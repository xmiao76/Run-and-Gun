/**
 * Turn evaluation findings into TASKS.md-shaped proposals.
 *
 * This is the PRODUCER side of the development loop. `.claude/loop.md` only
 * consumes tasks and halts with "IDLE - NO READY WORK" when none remain; this
 * supplies well-formed TODO entries from observed gameplay defects.
 *
 * It deliberately only ever WRITES A PROPOSAL FILE. It does not edit TASKS.md,
 * it does not touch source, and it does not implement anything - a finding is
 * evidence that something is wrong, not a decision about what to do, and that
 * decision stays with a person. Every proposal carries the evidence that
 * produced it so the reviewer can judge it rather than take it on trust.
 *
 *   node scripts/eval/proposeTasks.mjs [--max 5] [--out docs/eval/proposed-tasks.md]
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { log } from '../lib/browser.mjs';

const FINDINGS_PATH = join('docs', 'eval', 'findings.json');
const TASKS_PATH = 'TASKS.md';
const DEFAULT_OUT = join('docs', 'eval', 'proposed-tasks.md');

/** How many proposals to emit at once. More than a handful is not a backlog. */
const DEFAULT_MAX = 5;

/**
 * A stable, human-readable signature per finding, used both as the dedupe key
 * and as the `Source:` line. Searching TASKS.md for it is how a finding that
 * already has a task stops being proposed again.
 */
export function findingSignature(group) {
  return `${group.kind}@${group.bucket ?? group.x ?? '-'}:L${group.level}`;
}

/** Per-kind wording. The evidence is interpolated; the shape stays constant. */
const TEMPLATES = {
  stall: (g) => ({
    title: `Player can get stuck at x=${g.bucket} in level ${g.level}`,
    requirement:
      `Self-play found a position where the run makes no progress at all for ten simulated seconds: ` +
      `${g.evidence}. Nothing was advancing - not position, not lives, not score, not the boss - so ` +
      `something about the geometry or state there does not let the player continue. Establish whether ` +
      `a human is blocked too, and if so make the segment passable.`,
    criteria: [
      `Reaching x=${g.bucket} in level ${g.level} on foot always leaves a way to continue`,
      'A regression test drives the position and asserts forward progress',
      '`npm run eval -- --baseline` no longer reports this stall'
    ],
    nonGoals: ['Do not delete or bypass the mechanic involved; make it passable rather than absent.']
  }),
  bossStall: (g) => ({
    title: `Boss fight in level ${g.level} can reach an unwinnable state`,
    requirement:
      `Self-play spent a full simulated minute in the boss arena with no fight progress at all: ` +
      `${g.evidence}. Boss health, phase and subcomponents were all static, so the encounter had ` +
      `stopped being winnable from that state. Find what gates it and make the fight always resolvable.`,
    criteria: [
      `The level ${g.level} boss can always be damaged from a reachable position`,
      'A regression test reproduces the stuck state and asserts the fight progresses',
      '`npm run eval -- --baseline` no longer reports this boss stall'
    ],
    nonGoals: ['Do not lower boss health or weaken its patterns to paper over a positioning bug.']
  }),
  deathTrap: (g) => ({
    title: `Repeated deaths clustered at x=${g.bucket} in level ${g.level}`,
    requirement:
      `Self-play died over and over in one small stretch of level: ${g.evidence}. Respawning into the ` +
      `same death is a loop the player cannot learn their way out of within a life. Decide whether this ` +
      `is intended difficulty or a trap, and if it is a trap, break the cycle.`,
    criteria: [
      `A player respawning near x=${g.bucket} in level ${g.level} is not returned straight into the same death`,
      'The intended rule is recorded next to the code that enforces it',
      '`npm run eval -- --baseline` no longer reports this cluster'
    ],
    nonGoals: [
      'Do not change global difficulty; this is about one location.',
      'Do not move the checkpoint if the real problem is the hazard.'
    ]
  }),
  freeDeath: (g) => ({
    title: `A death costs no life in level ${g.level}`,
    requirement:
      `Self-play recorded a death that did not reduce the life count: ${g.evidence}. The respawn still ` +
      `ran, so the player was returned to the checkpoint for free. Decide the intended rule and enforce it.`,
    criteria: [
      'Every death either costs a life or is documented as deliberately free',
      'Unit coverage for the case',
      'The published death log stays consistent with lives lost'
    ],
    nonGoals: ['Do not change the invulnerability duration or projectile damage rules.']
  }),
  respawnUnsafe: (g) => ({
    title: `Unsafe respawn in level ${g.level}`,
    requirement: `Self-play found a respawn that does not settle the player safely: ${g.evidence}.`,
    criteria: [
      'Every respawn leaves the player grounded and clear of hazards',
      'A regression test covers the position'
    ],
    nonGoals: ['Do not move checkpoints if the real problem is the respawn logic.']
  }),
  outOfBounds: (g) => ({
    title: `Player can leave the world in level ${g.level}`,
    requirement: `Self-play put the player outside the level bounds: ${g.evidence}.`,
    criteria: ['The player position stays within the level bounds', 'A regression test reproduces the escape'],
    nonGoals: ['Do not clamp the position as a cover-up if the cause is a physics bug.']
  }),
  nanField: (g) => ({
    title: `Non-finite value in the runtime state (level ${g.level})`,
    requirement: `Self-play observed a non-finite number in the published state: ${g.evidence}.`,
    criteria: ['No published runtime field is ever non-finite', 'A unit test covers the arithmetic that produced it'],
    nonGoals: ['Do not mask it by filtering the snapshot; fix the source.']
  }),
  monotonic: (g) => ({
    title: `A counter moved the wrong way in level ${g.level}`,
    requirement: `Self-play saw a value change in a direction it should never move: ${g.evidence}.`,
    criteria: ['The counter only ever moves in its intended direction', 'Unit coverage for the transition'],
    nonGoals: ['Do not clamp the value; find what wrote it.']
  }),
  resourceBounds: (g) => ({
    title: `Entity or particle count exceeded its cap in level ${g.level}`,
    requirement: `Self-play exceeded a configured cap: ${g.evidence}. Unbounded growth is how a long session degrades.`,
    criteria: ['The count stays within its cap across a ten-minute soak', 'The soak spec covers it'],
    nonGoals: ['Do not raise the cap without understanding why it was exceeded.']
  }),
  structural: (g) => ({
    title: `Contradictory published state in level ${g.level}`,
    requirement: `Self-play saw fields that cannot both be true: ${g.evidence}.`,
    criteria: ['The fields stay consistent with each other', 'A unit test pins the relationship'],
    nonGoals: ['Do not relax the check without establishing which field is wrong.']
  }),
  notCompletable: (g) => ({
    title: `A segment of level ${g.level} did not complete within its budget`,
    requirement:
      `Self-play ran out of its step budget without finishing: ${g.evidence}. Either the segment is not ` +
      `completable from that start, or it is far slower than the rest of the game.`,
    criteria: [
      `The segment completes from its checkpoint within the budget`,
      '`npm run eval -- --baseline` no longer reports it'
    ],
    nonGoals: ['Do not raise the budget to make the symptom disappear.']
  })
};

function renderTask(id, group, spec) {
  const lines = [];
  lines.push(`### TASK-${String(id).padStart(3, '0')} - ${spec.title}`);
  lines.push('');
  lines.push('- Status: TODO');
  lines.push(`- Source: eval finding \`${findingSignature(group)}\` (${group.severity}, seen in ${group.runs.length} run(s): ${group.runs.slice(0, 3).join(', ')}${group.runs.length > 3 ? ', ...' : ''}; policies: ${group.policies.join(', ')})`);
  // Say plainly when nothing competent reproduced this. The sort already puts
  // such findings last, but ordering is invisible once you are reading one
  // proposal - and a reviewer who cannot tell `doorCamper` from `pilot` at a
  // glance ends up re-deriving it from the policy list every single run.
  if (!group.competent) {
    lines.push('- Evidence strength: **WEAK - no competent policy reproduced this.**');
    for (const line of wrap(
      'Only deliberately incompetent or adversarial policies reached it (see ' +
        'scripts/lib/policies.mjs), and those exist to find crashes and stuck ' +
        'states rather than to model a player: a policy that stands still in a ' +
        'hazard is expected to die there repeatedly. Treat this as likely ' +
        'policy noise unless the pilot, a hiccup run, or you can reproduce it.',
      74
    )) {
      lines.push(`  ${line}`);
    }
  }
  lines.push('- Requirement:');
  for (const line of wrap(spec.requirement, 74)) {
    lines.push(`  ${line}`);
  }
  lines.push('- Acceptance criteria:');
  for (const criterion of spec.criteria) {
    const [first, ...rest] = wrap(criterion, 70);
    lines.push(`  - [ ] ${first}`);
    for (const line of rest) {
      lines.push(`        ${line}`);
    }
  }
  lines.push('- Non-goals / constraints:');
  for (const nonGoal of spec.nonGoals) {
    const [first, ...rest] = wrap(nonGoal, 72);
    lines.push(`  - ${first}`);
    for (const line of rest) {
      lines.push(`    ${line}`);
    }
  }
  lines.push('');
  lines.push('---');
  return lines.join('\n');
}

function wrap(text, width) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (line.length === 0) {
      line = word;
    } else if (line.length + 1 + word.length <= width) {
      line += ' ' + word;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line.length > 0) {
    lines.push(line);
  }
  return lines;
}

/**
 * Build the proposal markdown.
 *
 * Pure: takes grouped findings and the current TASKS.md text, returns
 * `{ text, proposed, skipped, omitted }`. Nothing is read or written here, so
 * the whole producer is testable against a fixture.
 */
export function proposeTasks(groups, tasksText, options = {}) {
  const max = options.max ?? DEFAULT_MAX;
  const ids = [...String(tasksText).matchAll(/^### TASK-(\d+)/gm)].map((m) => Number(m[1]));
  let nextId = (ids.length > 0 ? Math.max(...ids) : 0) + 1;

  // Competent-policy findings first: a wedge the pilot hits is one a real
  // player hits. Then severity, then how many runs saw it.
  const ranked = [...groups].sort((a, b) => {
    if (Boolean(a.competent) !== Boolean(b.competent)) return a.competent ? -1 : 1;
    if (a.severity !== b.severity) return a.severity === 'CRITICAL' ? -1 : 1;
    return (b.runs?.length ?? 0) - (a.runs?.length ?? 0);
  });

  const blocks = [];
  const skipped = [];
  let considered = 0;
  /** Proposals no competent policy reproduced; surfaced in the summary. */
  let weak = 0;

  for (const group of ranked) {
    if (group.severity !== 'CRITICAL' && group.severity !== 'HIGH') {
      continue;
    }
    const template = TEMPLATES[group.kind];
    if (!template) {
      continue;
    }
    considered += 1;
    const signature = findingSignature(group);
    // Already has a task: the Source line of a previous proposal, or any
    // mention a human added by hand.
    if (String(tasksText).includes(signature)) {
      skipped.push(signature);
      continue;
    }
    if (blocks.length >= max) {
      continue;
    }
    blocks.push(renderTask(nextId, group, template(group)));
    if (!group.competent) {
      weak += 1;
    }
    nextId += 1;
  }

  const omitted = Math.max(0, considered - skipped.length - blocks.length);
  const header = [
    '# Proposed tasks',
    '',
    'Generated by `node scripts/eval/proposeTasks.mjs` from the latest evaluation.',
    '',
    '**Nothing here has been applied.** These are proposals for review: copy the',
    'ones that are real into the *Future enhancements* section of `TASKS.md`, and',
    'delete the rest. Each carries the evidence that produced it so it can be',
    'judged rather than taken on trust - a finding says something looked wrong,',
    'not that it must be fixed, and that call stays with a person.',
    '',
    `${blocks.length} proposed, ${skipped.length} already covered by an existing task` +
      (weak > 0 ? `, ${weak} of them seen ONLY by deliberately incompetent policies` : '') +
      (omitted > 0 ? `, ${omitted} more not shown (raise --max to see them)` : ''),
    '',
    '---',
    ''
  ].join('\n');

  return {
    text: blocks.length > 0 ? header + blocks.join('\n\n') + '\n' : header + '_No new findings to propose._\n',
    proposed: blocks.length,
    skipped,
    omitted
  };
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    out[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
  }
  return out;
}

const isMain = process.argv[1] && process.argv[1].endsWith('proposeTasks.mjs');
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const outPath = args.out ?? DEFAULT_OUT;

  let groups;
  try {
    groups = JSON.parse(readFileSync(args.findings ?? FINDINGS_PATH, 'utf8')).groups ?? [];
  } catch {
    log(`no findings at ${args.findings ?? FINDINGS_PATH}: run \`npm run eval\` first`);
    process.exit(1);
  }
  const tasksText = readFileSync(TASKS_PATH, 'utf8');
  const result = proposeTasks(groups, tasksText, { max: args.max ? Number(args.max) : DEFAULT_MAX });

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, result.text, 'utf8');

  log(
    `PROPOSED tasks=${result.proposed} alreadyCovered=${result.skipped.length} omitted=${result.omitted}` +
      ` out=${outPath}`
  );
  log('  TASKS.md was not modified; review the file and copy across what is real.');
}
