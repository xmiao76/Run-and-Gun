# Progress Log

## Current status

- Current milestone: M1 - Deterministic mechanics sandbox (COMPLETE this iteration)
- Overall state: M0 + M1 complete; full quality gate GREEN; deterministic sandbox playable in browser with keyboard + debug-driven flows
- Last verified commit: 84ed463 (M0 bootstrap); the M1 commit created this iteration verifies the working tree below (resolve with `git log -1`)
- Last full quality gate: 2026-07-22 ~03:01 local - all five commands exit 0 (see table)

## Acceptance summary

- Completed to date: A1-A8, B1, B2, C1, J5, J6, J8 (14)
- Newly completed this iteration: C1 (frame-rate-independent horizontal movement with solid + ledge collision, unit-tested)
- Partially addressed (NOT checked; recorded for traceability):
  - C2 jumping + variable jump height implemented & tested; one-way platform drop-through deferred to M3.
  - C6 damage + invulnerability + life loss + checkpoint respawn implemented & tested (unit + E2E); full game-over flow deferred to M4.
  - J3 automated tests now cover weapon rate limits, damage/invulnerability, and checkpoint state; storage validation + boss phase-transition tests deferred.
  - J1 the sandbox E2E flow covers start/move/jump/fire + a controlled-death respawn; pause/resume/return-to-title deferred (no pause scene yet).
  - B6 scene-switch lifecycle is clean (debug `gotoTitle`/`startSandbox` stop other scenes); pause/resume + restart-level deferred.
- Remaining: all other gameplay/level/boss/persistence/input criteria - deferred to M2-M7.

## Current iteration plan

M1 - deterministic mechanics sandbox:

1. Add pure, DOM-free simulation modules: fixed-step clock (accumulator), normalized InputState, data-driven weapons + projectile stepping, player physics (movement/variable jump/gravity/ground + pit collision), health/invulnerability/lives, checkpoint snapshot/restore, and balance files.
2. Add a keyboard adapter that maps browser events to InputState with edge-triggered jump/fire.
3. Expand the debug bridge into a read-only state snapshot + debug-only command/input surface; register scene-switch commands globally and scene-specific commands (damagePlayer) in the owning scene.
4. Add SandboxScene: fixed 60 Hz loop, arena render (ground + lethal pit + player + pooled projectile rects + HUD), keyboard + debug-merged input.
5. Tests: 6 unit suites (weapons, health, checkpoints, player, clock, input) + a Playwright sandbox flow (start, move, jump, fire, controlled damage, invulnerability-blocked re-hit, checkpoint respawn).
6. Run the full quality gate; fix two issues found (scene-switch left the title scene running; first-frame zero-step left runtime unpublished); re-run until green.

Next iteration: M2 - weapon & enemy foundations (Scatter Blaster + Rapid Carbine pickups, Runner + Sentry, centralized collision categories + duplicate-hit protection, spawn-trigger data, coverage).

## Completed work

New files this iteration:

- `src/balance/player.ts` - physics/life/arena constants (move speed, gravity, jump velocity + cut, ground/pit geometry, spawn, invuln duration).
- `src/balance/weapons.ts` - data-driven Pulse Rifle / Scatter Blaster / Rapid Carbine definitions + helpers.
- `src/simulation/clock.ts` - fixed-timestep accumulator (60 Hz, clamped delta).
- `src/input/InputState.ts` - normalized input type, neutral factory, OR-merge.
- `src/input/KeyboardInput.ts` - keyboard adapter with edge-triggered jump/fire and default-prevention for game keys.
- `src/simulation/player.ts` - pure player step (movement, variable jump, gravity, ground + ledge/pit collision).
- `src/simulation/weapons.ts` - fire-rate-limited firing, spread patterns, projectile stepping + TTL cull.
- `src/simulation/health.ts` - damage/invulnerability/lives/game-over + respawn restore.
- `src/simulation/checkpoints.ts` - immutable snapshot/restore.
- `src/scenes/SandboxScene.ts` - M1 arena scene with fixed-step loop, rendering, input merge, debug commands.
- `tests/unit/{weapons,health,checkpoints,player,clock,input}.test.ts` - deterministic unit coverage.
- `tests/e2e/sandbox.spec.ts` - Playwright sandbox flow.

Changed files:

- `src/debug/debugBridge.ts` - added runtime snapshot, command registry, debug-only simulated input, and `resolveRenderer`.
- `src/app/createGame.ts` - renderer override now read from the bridge; registers the SandboxScene.
- `src/app/config.ts` - added the `sandbox` scene key.
- `src/main.ts` - seeds shared debug input; registers global `startSandbox`/`gotoTitle` commands that stop other scenes on switch.
- `src/app/renderer.ts` - removed (logic folded into the bridge).
- `tests/e2e/title.spec.ts` - unchanged (still green).
- `tests/unit/config.test.ts` - unchanged (still green; now 3 scene keys).
- `ACCEPTANCE_CRITERIA.md` - checked C1.
- `PROGRESS.md` - this log.

No `public/assets/` files were added; all visuals remain procedural shapes + system fonts, so the ASSET_POLICY.md manifest stays correctly empty.

## Verification evidence

| Date/time (local) | Command or check | Result | Notes |
|---|---|---|---|
| 2026-07-22 03:01 | `npm run lint` | PASS (exit 0) | `eslint .`, flat config, no warnings |
| 2026-07-22 03:01 | `npm run typecheck` | PASS (exit 0) | `tsc --noEmit`, strict mode |
| 2026-07-22 03:01 | `npm run test` | PASS (exit 0) | Vitest 4.1.10: **7 files, 30 tests passed** |
| 2026-07-22 03:01 | `npm run test:e2e` | PASS (exit 0) | Playwright 1.61.1, 1 worker, chromium: **2 passed** (title + sandbox) |
| 2026-07-22 03:01 | `npm run build` | PASS (exit 0) | Vite 8.1.5; `dist/index.html` 0.71 kB; `dist/assets/index-*.js` 1,386.54 kB raw / **361.91 kB gzip** (under 2.5 MB budget) |
| 2026-07-22 (M0) | `npm ci --dry-run` | PASS (exit 0) | lockfile still consistent; no dependency changes this iteration |

Build advisory unchanged from M0: Vite warns that the single Phaser-containing chunk exceeds 500 kB (1.39 MB raw / 0.36 MB gzip). Expected at this stage, within the ARCHITECTURE.md budget; not a failure.

## Manual playtest notes

- The sandbox is keyboard-playable in the browser: A/D or arrows move, Space/W/Up jump (variable height on early release), J/K/Enter fire the Pulse Rifle; walking off the right ledge into the red pit costs a life and respawns at the checkpoint with a brief invulnerability flash. Controls are printed on-screen.
- Headless Chromium (SwiftShader) still cannot compile Phaser's WebGL shaders; automation continues to use the debug-gated `renderer=canvas` override while real users keep `Phaser.AUTO`. No `pageerror` in either E2E flow.
- Two defects found and fixed this iteration via the automated flows (not by weakening tests): (1) starting a scene from a global debug command did not stop the previously running scene, so the title rendered on top of the sandbox and raced its state - fixed by explicitly stopping other scenes on switch; (2) the first frame can yield zero fixed steps, leaving the runtime snapshot unpublished - fixed by publishing the spawn state in `create()`.
- A full manual playtest of levels/bosses is not applicable until M3/M4 (TEST_PLAN section 6).

## Known issues

- None blocking. Open advisories: Vite chunk-size warning (expected, under budget); headless-WebGL shader limitation (mitigated for automation via the canvas debug override).

## Next recommended task

Proceed to **M2 - Weapon and enemy foundations**: add the Scatter Blaster and Rapid Carbine with pickups, the Runner and Sentry enemy archetypes with telegraphed attacks, centralized collision categories with per-step duplicate-hit protection, and encounter/spawn-trigger data, extending the unit + Playwright coverage and keeping the M0/M1 quality gate green.
