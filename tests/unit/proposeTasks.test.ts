import { describe, expect, it } from 'vitest';

import { findingSignature, proposeTasks } from '../../scripts/eval/proposeTasks.mjs';

/**
 * The producer side of the development loop: findings in, TASKS.md-shaped
 * proposals out.
 *
 * What matters here is that a proposal is WELL FORMED - it has to meet the same
 * bar as a hand-written task (bounded requirement, objective criteria,
 * non-goals) or a reviewer cannot act on it - and that it never proposes the
 * same finding twice.
 */

interface Group {
  kind: string;
  severity: string;
  level: number;
  bucket: number;
  runs: string[];
  policies: string[];
  competent?: boolean;
  evidence: string;
}

const STALL: Group = {
  kind: 'stall',
  severity: 'CRITICAL',
  level: 2,
  bucket: 1728,
  runs: ['L2-mid-30lives-pilot', 'L2-start-30lives-pilot'],
  policies: ['pilot'],
  competent: true,
  evidence: 'no progress for 630 steps at x=1778'
};

const BOSS_STALL: Group = {
  kind: 'bossStall',
  severity: 'CRITICAL',
  level: 2,
  bucket: 2816,
  runs: ['L2-preboss-30lives-pilot'],
  policies: ['pilot'],
  competent: true,
  evidence: 'no fight progress for 3630 steps with the boss active'
};

/** A minimal TASKS.md: the producer reads it for the next id and for dedupe. */
const TASKS = ['### TASK-001 - Something', '', '- Status: DONE', '', '---', ''].join('\n');

describe('proposeTasks', () => {
  it('emits one well-formed block per finding', () => {
    const result = proposeTasks([STALL, BOSS_STALL], TASKS);
    expect(result.proposed).toBe(2);

    // Continues the id sequence rather than colliding with what exists.
    expect(result.text).toContain('### TASK-002');
    expect(result.text).toContain('### TASK-003');

    // Every block carries the shape ADD_ENHANCEMENT_PROMPT.md asks for.
    for (const block of result.text.split('### TASK-').slice(1)) {
      expect(block).toContain('- Status: TODO');
      expect(block).toContain('- Requirement:');
      expect(block).toContain('- Acceptance criteria:');
      expect(block).toContain('  - [ ] ');
      expect(block).toContain('- Non-goals / constraints:');
      expect(block).toContain('- Source: eval finding');
    }
  });

  it('carries the evidence into the requirement so a reviewer can judge it', () => {
    const result = proposeTasks([STALL], TASKS);
    expect(result.text).toContain('no progress for 630 steps at x=1778');
    expect(result.text).toContain('L2-mid-30lives-pilot');
    expect(result.text).toContain('pilot');
  });

  it('writes a different requirement for a boss stall than for a traversal stall', () => {
    const traversal = proposeTasks([STALL], TASKS).text;
    const boss = proposeTasks([BOSS_STALL], TASKS).text;
    expect(traversal).toContain('get stuck at x=1728');
    expect(boss).toContain('unwinnable state');
    expect(boss).not.toContain('get stuck at x=');
  });

  it('does not propose a finding that already has a task', () => {
    const covered = TASKS + `\n### TASK-002 - Existing\n\n- Source: eval finding \`${findingSignature(STALL)}\`\n`;
    const result = proposeTasks([STALL, BOSS_STALL], covered);
    expect(result.proposed).toBe(1);
    expect(result.skipped).toContain(findingSignature(STALL));
    expect(result.text).toContain('unwinnable state');
  });

  it('ranks findings a competent player hit above the rest', () => {
    const chaos: Group = { ...STALL, bucket: 64, competent: false, policies: ['fuzz'], runs: ['L1-fuzz-seed1'] };
    const result = proposeTasks([chaos, BOSS_STALL], TASKS, { max: 1 });
    // Only one slot, and the pilot's finding takes it.
    expect(result.proposed).toBe(1);
    expect(result.text).toContain('unwinnable state');
  });

  it('marks a proposal no competent policy reproduced, and counts them', () => {
    // The friction this fixes: the producer already SORTS competent findings
    // first, but ordering is invisible once you are reading one proposal. A
    // reviewer who cannot tell `doorCamper` from `pilot` at a glance ends up
    // re-deriving "these are all stress policies" from the policy list on
    // every single run.
    const chaos: Group = { ...STALL, bucket: 64, competent: false, policies: ['doorCamper'], runs: ['L2-doorCamper'] };
    const result = proposeTasks([chaos], TASKS, { max: 5 });
    expect(result.text).toContain('Evidence strength');
    expect(result.text).toContain('no competent policy reproduced this');
    expect(result.text).toContain('seen ONLY by deliberately incompetent policies');
  });

  it('says nothing about evidence strength when a competent policy did hit it', () => {
    // The label must mean something: a pilot finding carries no caveat.
    const result = proposeTasks([STALL], TASKS, { max: 5 });
    expect(result.text).not.toContain('Evidence strength');
    expect(result.text).not.toContain('seen ONLY by deliberately incompetent');
  });

  it('caps how many it proposes and says how many it held back', () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ ...STALL, bucket: i * 100 }));
    const result = proposeTasks(many, TASKS, { max: 3 });
    expect(result.proposed).toBe(3);
    expect(result.omitted).toBe(5);
    expect(result.text).toContain('not shown');
  });

  it('says so plainly when there is nothing to propose', () => {
    const result = proposeTasks([], TASKS);
    expect(result.proposed).toBe(0);
    expect(result.text).toContain('No new findings to propose');
  });

  it('ignores a finding kind it has no template for', () => {
    const unknown = { ...STALL, kind: 'somethingNew' };
    expect(proposeTasks([unknown], TASKS).proposed).toBe(0);
  });

  it('states prominently that nothing has been applied', () => {
    const result = proposeTasks([STALL], TASKS);
    expect(result.text).toContain('**Nothing here has been applied.**');
  });
});
