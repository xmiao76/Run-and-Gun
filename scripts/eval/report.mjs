/**
 * Aggregate many run traces into something a person and the development loop
 * can both read.
 *
 * Two rules shape this file:
 *  - findings are weighted by who hit them. The pilot reaching a wedge means a
 *    competent player reaches it; `fuzz` reaching one means random noise did.
 *    Both are worth knowing, in that order.
 *  - the baseline compares CATEGORICAL outcomes only (completed / stalled at a
 *    bucket / death causes), never exact numbers. With zero RNG every number
 *    shifts on any gameplay commit, so a numeric baseline would be 100% noise
 *    on exactly the commits you most want it to be quiet on.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { CRITICAL } from './checks.mjs';

/** Policies whose findings represent something a real player would hit. */
const COMPETENT = new Set(['pilot', 'hiccup']);

export function summarize(traces) {
  const runs = traces.length;
  const completed = traces.filter((t) => t.ended === 'results').length;
  const gameOver = traces.filter((t) => t.ended === 'gameOver').length;
  const budget = traces.filter((t) => t.ended === null).length;

  const findings = traces.flatMap((t) =>
    t.findings.map((f) => ({ ...f, run: t.id, policy: f.policy ?? t.config.policy, level: t.config.level }))
  );
  const critical = findings.filter((f) => f.severity === CRITICAL);
  const deaths = traces.reduce((n, t) => {
    const last = t.samples[t.samples.length - 1];
    return n + (last?.deathLog?.length ?? 0);
  }, 0);

  const byCause = {};
  for (const t of traces) {
    for (const d of t.samples[t.samples.length - 1]?.deathLog ?? []) {
      byCause[d.cause] = (byCause[d.cause] ?? 0) + 1;
    }
  }

  return { runs, completed, gameOver, budget, findings, critical, deaths, byCause };
}

/** Group findings so one wedge reported by six runs reads as one problem. */
export function groupFindings(findings) {
  const groups = new Map();
  for (const f of findings) {
    const key = `${f.kind}:${f.level}:${f.bucket ?? f.x ?? '-'}`;
    const g = groups.get(key) ?? {
      kind: f.kind,
      severity: f.severity,
      level: f.level,
      bucket: f.bucket ?? f.x,
      runs: [],
      policies: new Set(),
      evidence: f.evidence
    };
    g.runs.push(f.run);
    g.policies.add(f.policy);
    groups.set(key, g);
  }
  return [...groups.values()]
    .map((g) => ({ ...g, policies: [...g.policies], competent: [...g.policies].some((p) => COMPETENT.has(p)) }))
    .sort((a, b) => {
      // Competent-policy findings first, then by how many runs saw them.
      if (a.competent !== b.competent) return a.competent ? -1 : 1;
      if (a.severity !== b.severity) return a.severity === CRITICAL ? -1 : 1;
      return b.runs.length - a.runs.length;
    });
}

/**
 * The categorical shape of a run, for baseline comparison.
 *
 * Two granularities on purpose. `findingKinds` keeps the position bucket and is
 * what a human reads. `findingTypes` drops it, and is what the GATE compares.
 *
 * The reason is empirical: a chaos policy dies dozens of times across the first
 * screen, and which 96px buckets happen to cross the "3 deaths" threshold moves
 * whenever anything shifts the run's timing - so bucket-keyed comparison
 * reported phantom regressions on a correct gameplay fix. Comparing kinds still
 * catches what matters (a run that gains a stall, a wedge, an out-of-bounds it
 * never had before) while ignoring where a bad policy happened to die this time.
 */
export function outcomeOf(trace) {
  const last = trace.samples[trace.samples.length - 1];
  return {
    id: trace.id,
    ended: trace.ended ?? 'budget',
    findingKinds: [...new Set(trace.findings.map((f) => `${f.kind}@${f.bucket ?? f.x ?? '-'}`))].sort(),
    findingTypes: [...new Set(trace.findings.map((f) => f.kind))].sort(),
    deathCauses: [...new Set((last?.deathLog ?? []).map((d) => d.cause))].sort()
  };
}

export function compareToBaseline(traces, baselinePath) {
  let baseline;
  try {
    baseline = JSON.parse(readFileSync(baselinePath, 'utf8'));
  } catch {
    return { available: false, regressions: [], fixed: [] };
  }
  const byId = new Map(baseline.outcomes?.map((o) => [o.id, o]) ?? []);
  const regressions = [];
  const fixed = [];

  for (const trace of traces) {
    const now = outcomeOf(trace);
    const before = byId.get(now.id);
    if (!before) {
      continue; // a new configuration is not a regression
    }
    if (before.ended === 'results' && now.ended !== 'results') {
      regressions.push(`${now.id}: was completing, now ${now.ended}`);
    }
    // Gate on the KIND of finding, not its position bucket (see outcomeOf).
    const beforeTypes = before.findingTypes ?? before.findingKinds ?? [];
    for (const kind of now.findingTypes) {
      if (!beforeTypes.includes(kind)) {
        regressions.push(`${now.id}: new finding ${kind}`);
      }
    }
    // "Fixed" stays at bucket granularity: it is informational, and knowing
    // exactly which wedge went away is the useful part.
    for (const kind of before.findingKinds ?? []) {
      if (!now.findingKinds.includes(kind)) {
        fixed.push(`${now.id}: ${kind} no longer reported`);
      }
    }
  }
  return { available: true, regressions, fixed };
}

export function writeBaseline(traces, path) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    JSON.stringify({ generated: new Date().toISOString(), outcomes: traces.map(outcomeOf) }, null, 2),
    'utf8'
  );
}

export function renderReport(traces, comparison) {
  const s = summarize(traces);
  const groups = groupFindings(s.findings);
  const lines = [];

  lines.push('# Self-play evaluation report');
  lines.push('');
  lines.push(`Generated ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`- Runs: **${s.runs}** (completed ${s.completed}, game over ${s.gameOver}, hit budget ${s.budget})`);
  lines.push(`- Findings: **${s.findings.length}** (${s.critical.length} critical), grouped into ${groups.length}`);
  lines.push(`- Deaths observed: ${s.deaths} ${JSON.stringify(s.byCause)}`);
  lines.push('');

  if (comparison?.available) {
    lines.push('## Versus baseline');
    lines.push('');
    if (comparison.regressions.length === 0) {
      lines.push('No regressions.');
    } else {
      for (const r of comparison.regressions) {
        lines.push(`- **REGRESSION** ${r}`);
      }
    }
    for (const f of comparison.fixed) {
      lines.push(`- fixed: ${f}`);
    }
    lines.push('');
  }

  lines.push('## Findings');
  lines.push('');
  if (groups.length === 0) {
    lines.push('None.');
  } else {
    lines.push('Ordered by whether a competent player hit it, then severity, then how many runs saw it.');
    lines.push('');
    lines.push('| Kind | Level | Near x | Severity | Runs | Policies | Evidence |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const g of groups) {
      lines.push(
        `| ${g.kind} | ${g.level} | ${g.bucket ?? '-'} | ${g.severity} | ${g.runs.length} | ${g.policies.join(', ')} | ${g.evidence} |`
      );
    }
  }
  lines.push('');

  lines.push('## Runs');
  lines.push('');
  lines.push('| Run | Ended | Steps | Furthest x | Deaths | Findings |');
  lines.push('|---|---|---|---|---|---|');
  for (const t of traces) {
    const last = t.samples[t.samples.length - 1];
    lines.push(
      `| ${t.id} | ${t.ended ?? 'budget'} | ${t.steps} | ${Math.round(last?.maxPlayerX ?? 0)} | ${last?.deathLog?.length ?? 0} | ${t.findings.length} |`
    );
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * The grouped findings as JSON, for the task producer.
 *
 * The markdown report is for people; parsing it back would be fragile, so the
 * same grouping is written in a shape a script can consume.
 */
export function writeFindings(traces, path) {
  mkdirSync(dirname(path), { recursive: true });
  const groups = groupFindings(summarize(traces).findings);
  writeFileSync(path, JSON.stringify({ generated: new Date().toISOString(), groups }, null, 2), 'utf8');
  return path;
}

export function writeReport(text, path) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, 'utf8');
  return path;
}
