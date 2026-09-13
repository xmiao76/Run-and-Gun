/**
 * Why does the pilot park at x~2749 in the Reactor Warden arena when it starts
 * from a checkpoint, but sail past the same point on a full-level run?
 *
 *   node scripts/warden-wedge-probe.mjs [baseUrl] [checkpoint]
 */
import { launch, openGame, closeSession, log } from './lib/browser.mjs';
import { command, waitForScene } from './lib/bridge.mjs';

const BASE = process.argv[2] ?? 'http://localhost:4173';
const CHECKPOINT = process.argv[3] ?? 'preboss';

const browser = await launch({});
const session = await openGame(browser, { base: BASE, manualClock: true, autopilot: '1' });
const { page } = session;

await command(page, 'startLevel2');
await waitForScene(page, 'level');
await command(page, 'startAtCheckpoint', { id: CHECKPOINT, lives: 30 });

log(`checkpoint=${CHECKPOINT}`);
log('step   playerX  bossState    pattern  subAlive  vuln  lives  subXs');

for (let i = 0; i < 60; i++) {
  const snap = await page.evaluate(() => {
    const b = window.__GAME_DEBUG__;
    b.command('advanceSteps', 30);
    const r = b.getState().runtime;
    return {
      step: r.stepIndex,
      x: r.playerX,
      bossActive: r.bossActive,
      state: r.bossState,
      pattern: r.bossPattern,
      subAlive: r.subcomponentsAlive,
      vuln: r.bossVulnerable,
      lives: r.lives,
      bossX: r.bossX,
      subs: (r.subcomponents ?? []).filter((s) => s.alive).map((s) => Math.round(s.x)),
      angle: r.fireAngle,
      pose: r.playerPose,
      bullets: r.projectileCount
    };
  });
  if (!snap.bossActive) {
    continue;
  }
  log(
    `${String(snap.step).padStart(5)}  ${String(Math.round(snap.x)).padStart(6)}` +
      `  ${String(snap.state).padEnd(11)}  ${String(snap.pattern).padEnd(7)}` +
      `  ${String(snap.subAlive).padStart(7)}  ${String(snap.vuln).padEnd(5)}` +
      `  ${String(snap.lives).padStart(4)}  angle=${snap.angle} pose=${snap.pose} bullets=${snap.bullets} subs=[${snap.subs.join(',')}]`
  );
}

await closeSession(session);
await browser.close();
