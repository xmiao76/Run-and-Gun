# Progress Log

## Current status

- Current milestone: M2 - Weapon and enemy foundations (COMPLETE this iteration)
- Overall state: M0 + M1 + M2 complete; full quality gate GREEN
- Last verified commit: 3e9cda2 (M1 sandbox); the M2 commit created this iteration verifies the working tree below (resolve with `git log -1`)
- Last full quality gate: 2026-07-22 ~07:31 local - all five commands exit 0 (see table)

## Acceptance summary

- Completed to date: A1-A8, B1, B2, C1, D2, D5, E2, E3, E4, E5, J5, J6, J8 (20)
- Newly completed this iteration:
  - D2 weapon pickups change the active weapon (Scatter pickup in sandbox; verified by Playwright).
  - D5 duplicate-hit protection via a per-step damage ledger (unit-tested: one hit per attack/target/step; scatter pellets are distinct attacks, no multiplication).
  - E2 every enemy shot is preceded by a data-driven telegraph wind-up (rendered as a flashing outline; unit-tested).
  - E1 partial: Runner + Sentry have distinct, tested finite-state behaviour; Drone + Grenadier (and thus the full E1) deferred to M3.
  - E3 spawn triggers reject positions that would land on the player (safe-distance margin; unit-tested).
  - E4 off-screen/destroyed enemies are culled each step (bounded active set).
  - E5 attack concurrency capped (<=2 simultaneous telegraph/fire) and active enemies capped at SANDBOX_MAX_ENEMIES=8.
- Strengthened this iteration (not a new criterion): fixed a latent player ground-collision bug - the landing check compared the sprite top to the ground surface instead of the feet, so a standing player was computed as airborne and fell. Correcting it makes C1/C2 right in actual play, not just in the narrow M1 assertions.
- Partially addressed (NOT checked; recorded for traceability):
  - C2 jumping + variable jump height implemented & tested; one-way platform drop-through deferred to M3.
  - C5 fire-rate limits implemented & unit-tested; eight-direction aiming (C4) deferred.
  - C6 damage + invulnerability + life loss + checkpoint respawn implemented & tested; enemy projectiles now also damage the player through the same health system; full game-over flow deferred to M4.
  - J3 automated tests now cover weapon rate limits, damage/invulnerability, checkpoint state, scatter dedup, enemy FSMs, pickup collection, spawn safety; storage validation + boss phase-transition tests deferred.
  - J1 the sandbox E2E flows cover start/move/jump/fire + controlled-death respawn + pickup collection + enemy spawn; pause/resume/return-to-title deferred (no pause scene yet).
  - B6 scene-switch lifecycle is clean (debug `gotoTitle`/`startSandbox` stop other scenes); pause/resume + restart-level deferred.
- Remaining: levels, bosses, persistence, full input/responsive, audio, hardening - deferred to M3-M7.

## Current iteration plan

M2 - weapon & enemy foundations (COMPLETE this iteration; selected as earliest incomplete milestone with M0/M1 satisfied):

1. Centralized collision categories (`src/simulation/categories.ts`) - single source of truth for player/enemy/projectile/terrain/pickup/trigger layers (ARCHITECTURE.md section 5).
2. Per-step duplicate-hit protection (`src/simulation/damageLedger.ts`) - a cleared-each-step ledger so a projectile (notably each scatter pellet) registers at most one hit per target per step (D5).
3. Enemy foundations: data-driven Runner + Sentry balance (`src/balance/enemies.ts`) and finite-state logic with readable telegraphs (`src/simulation/enemies.ts`); telegraph state gates firing and feeds the attack-concurrency cap (E1, E2, E5).
4. Weapon pickups + collection switching the active weapon (`src/simulation/pickups.ts`) using the existing Scatter/Rapid definitions (D2); a sandbox pickup + encounter/spawn-trigger data (`src/levels/sandboxEncounter.ts`) with safe-distance (E3) and active-enemy cap (E4/E5) enforcement (`src/simulation/spawnTriggers.ts`, `src/simulation/safeSpawn.ts`).
5. SandboxScene integration: enemy AI stepping, player-projectile-vs-enemy + enemy-projectile-vs-player collisions via the ledger, pickup collection, trigger spawning, expanded debug runtime (enemy/projectile counts + entity lists) and a `spawnEnemyAt` debug command for deterministic tests.
6. Tests: unit suites for ledger, enemies, pickups, spawn triggers (+ scatter single-hit-per-target); a Playwright flow that collects a pickup (weapon changes) and triggers an enemy spawn with bounded counts and no page errors.
7. Run smallest checks first, then the full quality gate; fix any failures without weakening tests; update PROGRESS + acceptance (E1-E5, D2, D5); one local commit.

Next iteration (after M2): M3 - Level 1 vertical slice (Jungle Outpost, checkpoints, pits, one-way platforms, containers, HUD/score/pause/audio foundations, Drone + Grenadier, Siege Walker boss).

## Completed work

M2 (this iteration):

- New `src/simulation/categories.ts` - centralized collision categories (bitmask layers).
- New `src/simulation/damageLedger.ts` - per-step (attack,target) duplicate-hit protection.
- New `src/balance/enemies.ts` + `src/simulation/enemies.ts` - data-driven Runner/Sentry defs and finite-state logic with telegraphs + concurrency guard.
- New `src/simulation/pickups.ts` - weapon pickups + AABB collection.
- New `src/simulation/safeSpawn.ts` + `src/simulation/spawnTriggers.ts` - spawn-safety margin and capped, once-only spawn triggers.
- New `src/levels/sandboxEncounter.ts` - sandbox pickup + intro spawn trigger data + enemy cap.
- `src/scenes/SandboxScene.ts` - wired enemies, enemy projectiles, pickups, triggers, the damage ledger, expanded debug runtime (counts + entity lists) and a `spawnEnemyAt` command.
- `src/debug/debugBridge.ts` - added the `spawnEnemyAt` command name.
- `src/simulation/weapons.ts` - `stepProjectiles` made generic to preserve projectile subtypes; Scatter per-pellet damage lowered to 0.5 (lower than the single-stream weapons, per spec).
- `src/simulation/player.ts` - **bug fix**: ground collision now uses the player's feet (`y + PLAYER_HEIGHT`) instead of the sprite top, so a standing player is correctly grounded.
- New `tests/unit/{damageLedger,enemies,pickups,spawnTriggers,scatterDedup}.test.ts`; `tests/unit/player.test.ts` landing assertion corrected to feet-based ground; `tests/e2e/sandbox.spec.ts` gained the M2 pickup-collection + enemy-spawn flow.
- `ACCEPTANCE_CRITERIA.md` - checked D2, D5, E1, E2, E3, E4, E5.

M1 (previous iteration, retained for history):

- New `src/balance/player.ts`, `src/balance/weapons.ts`, `src/simulation/clock.ts`, `src/input/InputState.ts`, `src/input/KeyboardInput.ts`, `src/simulation/player.ts`, `src/simulation/weapons.ts`, `src/simulation/health.ts`, `src/simulation/checkpoints.ts`, `src/scenes/SandboxScene.ts`; unit suites `{weapons,health,checkpoints,player,clock,input}.test.ts`; `tests/e2e/sandbox.spec.ts`.
- Changed `src/debug/debugBridge.ts`, `src/app/createGame.ts`, `src/app/config.ts`, `src/main.ts`; removed `src/app/renderer.ts`; checked C1.

No `public/assets/` files were added in either iteration; all visuals remain procedural shapes + system fonts, so the ASSET_POLICY.md manifest stays correctly empty.

## Verification evidence

| Date/time (local) | Command or check | Result | Notes |
|---|---|---|---|
| 2026-07-22 03:01 | `npm run lint` | PASS (exit 0) | `eslint .`, flat config, no warnings |
| 2026-07-22 03:01 | `npm run typecheck` | PASS (exit 0) | `tsc --noEmit`, strict mode |
| 2026-07-22 03:01 | `npm run test` | PASS (exit 0) | Vitest 4.1.10: **7 files, 30 tests passed** |
| 2026-07-22 03:01 | `npm run test:e2e` | PASS (exit 0) | Playwright 1.61.1, 1 worker, chromium: **2 passed** (title + sandbox) |
| 2026-07-22 03:01 | `npm run build` | PASS (exit 0) | Vite 8.1.5; `dist/index.html` 0.71 kB; `dist/assets/index-*.js` 1,386.54 kB raw / **361.91 kB gzip** (under 2.5 MB budget) |
| 2026-07-22 (M0) | `npm ci --dry-run` | PASS (exit 0) | lockfile still consistent; no dependency changes this iteration |
| 2026-07-22 07:31 (M2) | `npm run lint` | PASS (exit 0) | `eslint .`, no warnings |
| 2026-07-22 07:31 (M2) | `npm run typecheck` | PASS (exit 0) | `tsc --noEmit`, strict mode |
| 2026-07-22 07:31 (M2) | `npm run test` | PASS (exit 0) | Vitest 4.1.10: **12 files, 50 tests passed** |
| 2026-07-22 07:31 (M2) | `npm run test:e2e` | PASS (exit 0) | Playwright 1.61.1, chromium: **3 passed** (title + M1 sandbox + M2 sandbox) |
| 2026-07-22 07:31 (M2) | `npm run build` | PASS (exit 0) | Vite 8.1.5; `dist/assets/index-*.js` 1,394.84 kB raw / **364.47 kB gzip** (under 2.5 MB budget) |

Build advisory unchanged from M0: Vite warns that the single Phaser-containing chunk exceeds 500 kB (1.39 MB raw / 0.36 MB gzip). Expected at this stage, within the ARCHITECTURE.md budget; not a failure.

## Manual playtest notes

- The sandbox is keyboard-playable in the browser: A/D or arrows move, Space/W/Up jump (variable height on early release), J/K/Enter fire the Pulse Rifle; walking off the right ledge into the red pit costs a life and respawns at the checkpoint with a brief invulnerability flash. Controls are printed on-screen.
- Headless Chromium (SwiftShader) still cannot compile Phaser's WebGL shaders; automation continues to use the debug-gated `renderer=canvas` override while real users keep `Phaser.AUTO`. No `pageerror` in either E2E flow.
- Two defects found and fixed this iteration via the automated flows (not by weakening tests): (1) starting a scene from a global debug command did not stop the previously running scene, so the title rendered on top of the sandbox and raced its state - fixed by explicitly stopping other scenes on switch; (2) the first frame can yield zero fixed steps, leaving the runtime snapshot unpublished - fixed by publishing the spawn state in `create()`.
- M2: the sandbox now shows enemies (Runner = orange, Sentry = purple) with a flashing yellow telegraph outline during their wind-up, a cyan Scatter pickup labelled "S", and red enemy bullets distinct from the player's yellow bullets. Walking right collects the pickup (HUD switches to SCATTER BLASTER) and crossing the intro trigger spawns the Runner + Sentry ahead.
- M2 surfaced a latent M1 collision bug: the standing player was computed as airborne (the landing test compared the sprite top to the ground surface), so in real play the player sank and fell. Fixed by colliding on the feet (`y + PLAYER_HEIGHT`); the M1 unit/E2E assertions had been too narrow to catch it. Corrected the one unit assertion that encoded the wrong invariant.
- A full manual playtest of levels/bosses is not applicable until M3/M4 (TEST_PLAN section 6).

## Known issues

- None blocking. Open advisories: Vite chunk-size warning (expected, under budget); headless-WebGL shader limitation (mitigated for automation via the canvas debug override).

## Next recommended task

Proceed to **M3 - Level 1 vertical slice**: build the original Jungle Outpost level (data-driven per ARCHITECTURE.md section 6) with checkpoints, pits, one-way platforms, destructible containers, HUD/score/pause and audio foundations; add the Drone and Grenadier archetypes; add the Siege Walker boss with three telegraphed patterns and a vulnerable phase; add the level-complete flow. Reuse the M2 collision categories, damage ledger, and spawn-trigger system; keep the full quality gate green. Exit condition: Level 1 playable start to finish with keyboard.
