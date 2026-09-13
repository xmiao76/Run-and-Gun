/**
 * `npm run eval` - batch self-play evaluation.
 *
 *   npm run eval                     # full matrix
 *   npm run eval -- --quick          # the subset a loop iteration runs
 *   npm run eval -- --seeds 12       # more seeded variation
 *   npm run eval -- --filter door    # only configs matching a substring
 *   npm run eval -- --baseline       # compare against the committed baseline
 *   npm run eval -- --update-baseline
 *
 * Exits non-zero when any CRITICAL finding is present, or when a baseline
 * comparison reports a regression, so this can gate CI later.
 */

import { join } from 'node:path';

import { closeSession, launch, log, DEFAULT_BASE } from '../lib/browser.mjs';
import { checkCoverage, CRITICAL } from './checks.mjs';
import { buildMatrix } from './matrix.mjs';
import {
  compareToBaseline,
  renderReport,
  summarize,
  writeBaseline,
  writeFindings,
  writeReport
} from './report.mjs';
import { runId, runOnBrowser, writeTrace } from './run.mjs';

/**
 * The report and the baseline live in `docs/eval/`, not `test-results/`.
 *
 * `test-results/` is Playwright's output directory and Playwright clears it at
 * the start of every run, so a report written there vanishes the next time
 * anyone runs the e2e suite. It is also gitignored, which would mean the
 * baseline could never survive between loop iterations. Per-run traces stay in
 * `test-results/eval/` because they are disposable working data.
 */
const REPORT_PATH = join('docs', 'eval', 'report.md');
const BASELINE_PATH = join('docs', 'eval', 'baseline.json');
const FINDINGS_PATH = join('docs', 'eval', 'findings.json');

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    out[key] = value;
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const quick = args.quick === 'true';
const base = args.base ?? DEFAULT_BASE;
const matrix = buildMatrix({
  quick,
  seeds: args.seeds ? Number(args.seeds) : 4,
  filter: args.filter ?? null
});

log(`eval: ${matrix.length} configs against ${base}${quick ? ' (quick)' : ''}`);

const startedAt = Date.now();
const browser = await launch({ headless: args.headed !== 'true' });
const traces = [];
let failures = 0;

try {
  for (const [index, config] of matrix.entries()) {
    const full = { ...config, base };
    const label = runId(full);
    try {
      // One retry. A page-load or scene wait can time out when the shared
      // browser is busy after a couple of dozen runs; a gate that goes red at
      // random is a gate people stop reading, and a real defect reproduces.
      let produced;
      try {
        produced = await runOnBrowser(browser, full);
      } catch (first) {
        log(`  [${index + 1}/${matrix.length}] ${label} retrying after: ${first?.message ?? first}`);
        produced = await runOnBrowser(browser, full);
      }
      for (const trace of produced) {
        trace.id = runId(trace.config);
        traces.push(trace);
        writeTrace(trace);
        const critical = trace.findings.filter((f) => f.severity === CRITICAL).length;
        log(
          `  [${index + 1}/${matrix.length}] ${trace.id}` +
            ` ended=${trace.ended ?? 'budget'} steps=${trace.steps}` +
            ` findings=${trace.findings.length}${critical ? ` critical=${critical}` : ''}`
        );
      }
    } catch (err) {
      // One bad config must not lose the rest of the matrix.
      failures += 1;
      log(`  [${index + 1}/${matrix.length}] ${label} FAILED: ${err?.message ?? err}`);
    }
  }
} finally {
  await closeSession(undefined);
  await browser.close().catch(() => undefined);
}

// Coverage is a property of the MATRIX, not of any single run: one run has no
// business meeting every archetype. Attach it to a synthetic trace so it flows
// through the same report and gate as everything else.
const coverage = checkCoverage(traces);
if (coverage.length > 0) {
  traces.push({
    id: 'matrix-coverage',
    config: { level: 0, policy: 'coverage' },
    ended: null,
    steps: 0,
    samples: [{ deathLog: [] }],
    findings: coverage.map((f) => ({ ...f, policy: 'coverage' }))
  });
  for (const f of coverage) {
    log(`  [coverage] ${f.kind}: ${f.evidence}`);
  }
}

const comparison = args.baseline === 'true' ? compareToBaseline(traces, BASELINE_PATH) : null;
writeReport(renderReport(traces, comparison), REPORT_PATH);
writeFindings(traces, FINDINGS_PATH);

if (args['update-baseline'] === 'true') {
  writeBaseline(traces, BASELINE_PATH);
  log(`  baseline updated: ${BASELINE_PATH}`);
}

const s = summarize(traces);
const stalls = s.findings.filter((f) => f.kind === 'stall' || f.kind === 'bossStall').length;
const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

// Machine-greppable one-liner, matching the existing SOAK convention.
log(
  `EVAL runs=${s.runs} completed=${s.completed} gameOver=${s.gameOver} budget=${s.budget}` +
    ` stuck=${stalls} findings=${s.findings.length} critical=${s.critical.length}` +
    ` deaths=${s.deaths} harnessFailures=${failures} seconds=${elapsed}`
);
log(`  report: ${REPORT_PATH}`);

const regressed = comparison?.regressions.length ?? 0;
if (regressed > 0) {
  log(`  ${regressed} regression(s) versus baseline`);
}

/**
 * What makes this exit non-zero depends on whether there is anything to compare
 * against.
 *
 * The game has standing critical findings - chaos policies die repeatedly in
 * places a competent player never visits - so gating on the absolute count
 * would leave the signal permanently red, which is the same as having no gate.
 * With a baseline, the question that matters is "did anything get worse"; with
 * no baseline, any critical finding is news.
 */
const failed = comparison?.available
  ? regressed > 0 || failures > 0
  : s.critical.length > 0 || failures > 0;

if (comparison?.available && s.critical.length > 0 && regressed === 0) {
  log(`  ${s.critical.length} critical finding(s), all present in the baseline - not a regression`);
}
process.exit(failed ? 1 : 0);
