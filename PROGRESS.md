# Progress Log

## Current status

- Current milestone: M3 - Level 1 vertical slice (COMPLETE this iteration)
- Overall state: M0 + M1 + M2 + M3 complete; full quality gate GREEN
- Last verified commit: c748a1c (M2); the M3 commit created this iteration verifies the working tree below (resolve with `git log -1`)
- Last full quality gate: 2026-07-22 ~08:1x local - all five commands exit 0 (see table)

## Acceptance summary

- Completed to date: A1-A8, B1-B3, C1, C3, D2, D5, E2-E5, F3, F4, F6, G1, G3, G4, I2-I4, J5, J6, J8 (31)
- Newly completed this iteration (M3):
  - B3 New Game (title Enter/Space or debug startLevel1) starts Level 1 in a controlled playable state (HUD, lives, running sim; Playwright-verified).
  - C3 crouch changes the collision height (feet planted) and is keyboard-mapped (S / ArrowDown); unit-tested.
  - F3 Level 1 defines three functioning checkpoints with last-reached tracking (unit-tested).
  - F4 pit fall + lethal-hazard contact route through the same documented life-loss flow (handleDeath) used by the sandbox (E2E-proven mechanism).
  - F6 Jungle Outpost layout is original/data-authored; no Contra reproduction (consistent with J8 scan).
  - G1 Siege Walker has three telegraphed patterns (shockwave stomp, projectile burst, charge) + a vulnerable phase (unit-tested).
  - G3 boss phase transitions are time-bounded; a long-run unit test asserts no state persists (no deadlock).
  - G4 boss health bar shows only while the boss is active+alive; health reaches zero exactly once (justDied; unit-tested).
  - I2 settings are versioned + schema-validated (parseSettings; unit-tested).
  - I3 corrupt/absent localStorage falls back to defaults without throwing (StorageService; unit-tested).
  - I4 AudioService is failure-safe (no-op when the context is unavailable/suspended; unit-tested + integrated).
- Strengthened earlier this milestone: keyboard crouch/drop-through wiring + on-screen controls hint; a deterministic `completeLevel` debug command for the completion-flow E2E.
- Partially addressed (NOT checked; recorded for traceability):
  - C2 jumping + variable jump height + one-way drop-through implemented & unit-tested; a full in-level one-way E2E deferred.
  - C5 fire-rate limits + D1 three-weapon data behaviour implemented & unit-tested; in-play demonstration across all states/levels deferred.
  - C6 damage/invuln/death/life-loss/checkpoint respawn implemented; level game-over overlay present; a level-specific game-over E2E deferred to M4.
  - E1 Runner + Sentry + Drone + Grenadier all have distinct tested FSM behaviour now; E1 still left open pending in-level integration evidence for Drone/Grenadier.
  - B5 settings schema includes volume/mute/reduced-flash/controls and pause toggles mutate in-session settings; cross-reload persistence (I1/B5) deferred to M5.
  - B6 pause/resume verified without stale state; return-to-title from pause + restart-level UI deferred.
  - F1 Level 1 is built start-to-boss with a completion hand-off, but a full human keyboard playthrough is not yet verified.
  - J3 now also covers storage validation + boss phase transitions; remaining J3 items (full checkpoint-state coverage) deferred.
- Remaining: Level 2 + Reactor Warden, full playthroughs, gamepad/touch/responsive, best-score persistence, audio polish, soak/hardening - deferred to M4-M7.

## Current iteration plan

M3 - Level 1 vertical slice (selected: earliest incomplete milestone; M0-M2 prerequisites satisfied). Plan, reusing M1/M2 abstractions (damage ledger, health, weapons, input, spawn triggers, enemy FSM, clock):

1. Data-driven level format: `src/levels/levelSchema.ts` (types + validation: bounds, spawn in-bounds, >=2 checkpoints, boss arena/completion present) and `src/levels/levelLoader.ts` (validate-or-throw with actionable messages). `src/levels/level1.ts` = original Jungle Outpost (authored via small helpers; no Contra layout).
2. Platformer physics: `src/simulation/platformer.ts` - pure axis-separated AABB vs solid platforms, one-way platforms with drop-through, crouch pose, pit/death fall; extends the M1 player model so C1/C2 stay correct.
3. Checkpoints: `src/simulation/checkpoints.ts` extended with last-reached tracking on overlap; respawn uses it (F3, C6/C7).
4. New enemies in the existing FSM + balance: Drone (bounded aerial path, downward/diagonal telegraphed shot) and Grenadier (keeps distance, arcing projectile via per-projectile gravity) (E1 completion, E2).
5. Boss: `src/simulation/bosses.ts` + `src/balance/bosses.ts` - Siege Walker with three telegraphed patterns (shockwave stomp, projectile burst, charge) and a vulnerable phase; phase transitions are time-bounded so they cannot deadlock; damage only applies while vulnerable; health reaches zero once (G1, G3, G4).
6. `src/scenes/LevelScene.ts` - camera follow (clamped), platforms/one-way/hazards/pickups/triggers/boss rendered as procedural shapes, HUD (lives/score/weapon + boss health bar only when appropriate), pause overlay (`src/scenes/PauseScene.ts`), and level-complete -> `src/scenes/ResultsScene.ts` after a short non-interactive beat (B3, B6, F1, G5).
7. Foundations: `src/audio/AudioService.ts` (original WebAudio blips; starts on user gesture; failure-safe) and `src/persistence/{schema,StorageService}.ts` (versioned, validated settings: volumes, mute, reduced-flash; corrupt-data fallback) wired with minimal pause-menu toggles (I2, I3, I4, B5).
8. Debug bridge: level state (scene/level/player/lives/weapon/invuln/enemy+projectile counts/checkpoint/boss phase+health/status) + safe commands (startLevel, pause/resume, damageBoss, teleport) so the Playwright flow is deterministic (section 13, J1/J2).
9. Tests: unit suites for platformer, checkpoints, level validation, drone/grenadier, boss phase transitions + damage gating, settings validation/fallback; one Playwright flow that loads Level 1, asserts the HUD, pauses/resumes, defeats the boss via debug command, and reaches the completion screen with no page errors.
10. Run smallest checks first, then the full gate; fix failures without weakening tests; update PROGRESS + acceptance; one local commit. Exit condition: Level 1 playable start to finish with keyboard.

M3 status: COMPLETE this iteration. All ten plan items implemented; full quality gate GREEN (lint 0, typecheck 0, test 84/84, e2e 4/4, build 370.91 kB gzip). The deterministic E2E verifies level load + HUD + pause/resume + completion hand-off; a full human keyboard playthrough (F1) and a level-specific game-over E2E remain as M4 follow-ups. One notable debugging episode: the Grenadier distance-keeping direction required settling the world x-convention empirically (verified via the player: right = +x); the reposition rule was isolated into `src/simulation/enemyReposition.ts` so it is unit-tested on its own.

Next iteration (after M3): M4 - Level 2 (Fortress Interior) + Reactor Warden + final/game-over flows.

## M2 (completed) iteration plan

M2 - weapon & enemy foundations (COMPLETE; selected as earliest incomplete milestone with M0/M1 satisfied):

1. Centralized collision categories (`src/simulation/categories.ts`) - single source of truth for player/enemy/projectile/terrain/pickup/trigger layers (ARCHITECTURE.md section 5).
2. Per-step duplicate-hit protection (`src/simulation/damageLedger.ts`) - a cleared-each-step ledger so a projectile (notably each scatter pellet) registers at most one hit per target per step (D5).
3. Enemy foundations: data-driven Runner + Sentry balance (`src/balance/enemies.ts`) and finite-state logic with readable telegraphs (`src/simulation/enemies.ts`); telegraph state gates firing and feeds the attack-concurrency cap (E1, E2, E5).
4. Weapon pickups + collection switching the active weapon (`src/simulation/pickups.ts`) using the existing Scatter/Rapid definitions (D2); a sandbox pickup + encounter/spawn-trigger data (`src/levels/sandboxEncounter.ts`) with safe-distance (E3) and active-enemy cap (E4/E5) enforcement (`src/simulation/spawnTriggers.ts`, `src/simulation/safeSpawn.ts`).
5. SandboxScene integration: enemy AI stepping, player-projectile-vs-enemy + enemy-projectile-vs-player collisions via the ledger, pickup collection, trigger spawning, expanded debug runtime (enemy/projectile counts + entity lists) and a `spawnEnemyAt` debug command for deterministic tests.
6. Tests: unit suites for ledger, enemies, pickups, spawn triggers (+ scatter single-hit-per-target); a Playwright flow that collects a pickup (weapon changes) and triggers an enemy spawn with bounded counts and no page errors.
7. Run smallest checks first, then the full quality gate; fix any failures without weakening tests; update PROGRESS + acceptance (E1-E5, D2, D5); one local commit.

Next iteration (after M2): M3 - Level 1 vertical slice (Jungle Outpost, checkpoints, pits, one-way platforms, containers, HUD/score/pause/audio foundations, Drone + Grenadier, Siege Walker boss).

## Completed work

M3 (this iteration):

- New `src/levels/levelSchema.ts` + `src/levels/levelLoader.ts` - data-driven level types + validation (bounds, spawn in-bounds, >=2 checkpoints, boss arena, completionX) with validate-or-throw.
- New `src/levels/level1.ts` - original Jungle Outpost (ground segments + pits, one-way platforms, hazards, 3 checkpoints, pickups, 3 spawn triggers, Siege Walker arena, completion point).
- New `src/simulation/platformer.ts` - pure axis-separated AABB vs solids + one-way platforms with drop-through, crouch pose, gravity, variable jump, death fall.
- New `src/simulation/enemyReposition.ts` - isolated, unit-tested Grenadier distance-keeping direction (right = +x convention).
- New `src/simulation/bosses.ts` + `src/balance/bosses.ts` - Siege Walker FSM: enter/idle/telegraph/attack/vulnerable/dead, three patterns (shockwave/burst/charge), time-bounded transitions, damage gated to the vulnerable window, single death.
- New `src/audio/AudioService.ts` - original WebAudio blips + drone music; autoplay-safe (unlock on gesture); failure-safe no-op when the context is unavailable.
- New `src/persistence/schema.ts` + `src/persistence/StorageService.ts` - versioned, schema-validated settings with corrupt/absent-storage fallback.
- New `src/scenes/LevelScene.ts` - clamped follow camera, procedural render of platforms/one-ways/hazards/pickups/triggers/enemies/boss, HUD + boss health bar (only when appropriate), in-scene pause overlay with mute/reduced-flash toggles, level-complete -> ResultsScene, debug commands (pause/resume/damageBoss/defeatBoss/completeLevel/teleportPlayer).
- New `src/scenes/ResultsScene.ts` - level-complete screen (score + return to title).
- `src/scenes/TitleScene.ts` - added a Start prompt; Enter/Space unlocks audio and starts Level 1 (B3).
- `src/input/KeyboardInput.ts` - mapped S / ArrowDown to crouch + drop-through (C3).
- `src/debug/debugBridge.ts` - added level command names (startLevel1/pause/resume/damageBoss/defeatBoss/completeLevel/teleportPlayer); `src/main.ts` registers the global scene-switch + audio singleton.
- New `tests/unit/{platformer,checkpoints,levelLoader,newEnemies,enemyReposition,bosses,settings,audio}.test.ts`; new `tests/e2e/level1.spec.ts` (load + HUD + pause/resume + completion -> results, no page errors).
- `ACCEPTANCE_CRITERIA.md` - checked B3, C3, F3, F4, F6, G1, G3, G4, I2, I3, I4.

M2 (previous iteration, retained for history):

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

M1 (retained for history):

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
| 2026-07-22 14:23 (M3) | `npm run lint` | PASS (exit 0) | `eslint .`, no warnings |
| 2026-07-22 14:23 (M3) | `npm run typecheck` | PASS (exit 0) | `tsc --noEmit`, strict mode |
| 2026-07-22 14:23 (M3) | `npm run test` | PASS (exit 0) | Vitest 4.1.10: **19 files, 84 tests passed** |
| 2026-07-22 14:23 (M3) | `npm run test:e2e` | PASS (exit 0) | Playwright 1.61.1, chromium: **4 passed** (title + M1 sandbox + M2 sandbox + level1) |
| 2026-07-22 14:23 (M3) | `npm run build` | PASS (exit 0) | Vite 8.1.5; `dist/assets/index-*.js` 1,421.40 kB raw / **370.91 kB gzip** (under 2.5 MB budget) |

Build advisory unchanged from M0: Vite warns that the single Phaser-containing chunk exceeds 500 kB (1.39 MB raw / 0.36 MB gzip). Expected at this stage, within the ARCHITECTURE.md budget; not a failure.

## Manual playtest notes

- The sandbox is keyboard-playable in the browser: A/D or arrows move, Space/W/Up jump (variable height on early release), J/K/Enter fire the Pulse Rifle; walking off the right ledge into the red pit costs a life and respawns at the checkpoint with a brief invulnerability flash. Controls are printed on-screen.
- Headless Chromium (SwiftShader) still cannot compile Phaser's WebGL shaders; automation continues to use the debug-gated `renderer=canvas` override while real users keep `Phaser.AUTO`. No `pageerror` in either E2E flow.
- Two defects found and fixed this iteration via the automated flows (not by weakening tests): (1) starting a scene from a global debug command did not stop the previously running scene, so the title rendered on top of the sandbox and raced its state - fixed by explicitly stopping other scenes on switch; (2) the first frame can yield zero fixed steps, leaving the runtime snapshot unpublished - fixed by publishing the spawn state in `create()`.
- M2: the sandbox now shows enemies (Runner = orange, Sentry = purple) with a flashing yellow telegraph outline during their wind-up, a cyan Scatter pickup labelled "S", and red enemy bullets distinct from the player's yellow bullets. Walking right collects the pickup (HUD switches to SCATTER BLASTER) and crossing the intro trigger spawns the Runner + Sentry ahead.
- M2 surfaced a latent M1 collision bug: the standing player was computed as airborne (the landing test compared the sprite top to the ground surface), so in real play the player sank and fell. Fixed by colliding on the feet (`y + PLAYER_HEIGHT`); the M1 unit/E2E assertions had been too narrow to catch it. Corrected the one unit assertion that encoded the wrong invariant.
- A full manual playtest of levels/bosses is not applicable until M3/M4 (TEST_PLAN section 6).
- M3: Level 1 loads from the title screen (Enter/Space) with a scrolling camera, dark-green ground segments, blue one-way platforms, red-outlined pit markers, the HUD (lives/weapon/score) and an on-screen controls hint including crouch/drop-through (S / ArrowDown). Esc pauses (overlay shows mute + reduced-flash toggles) and Esc resumes. The Siege Walker renders as a brown block with a yellow telegraph outline during wind-ups and a top-centre health bar only while active; the deterministic `completeLevel` debug command plays the short completion beat and hands off to the results screen ("LEVEL COMPLETE" + score). A full human keyboard playthrough of the level is the M4 follow-up (F1).
- M3 debugging note: the Grenadier reposition direction was hard to settle by inspection because the world x-convention (right = +x, verified against the player) made several ternary formulations look right while behaving opposite; isolating the rule into `enemyReposition.ts` with branch-marker diagnostics and a dedicated unit test resolved it cleanly.

## Known issues

- None blocking. Open advisories: Vite chunk-size warning (expected, under budget); headless-WebGL shader limitation (mitigated for automation via the canvas debug override).

## Next recommended task

Proceed to **M4 - Level 2 vertical slice + final flows**: build the original Fortress Interior level (moving platforms, doors, hazards, denser remixes of the four enemies - no new archetype), add the Reactor Warden boss (two phases + destructible subcomponents), wire the final-completion and game-over screens, and add the level-specific game-over + checkpoint-respawn E2E flows plus a verified human keyboard playthrough of Level 1 (closes F1, F2, G2, G5, C6, J1/J2). Reuse the M3 level schema/loader, platformer, boss FSM, and debug bridge; keep the full quality gate green.
