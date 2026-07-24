# Progress Log

## Current status

- Current milestone: **Post-completion enhancement pass (user-directed): classic arcade feel** (COMPLETE)
- Overall state: ALL milestones M0-M7 complete; ALL 59 acceptance criteria still checked; full quality gate GREEN after the polish pass
- Last verified commit: 0e68c3c (M7); the polish commit created this iteration verifies the working tree below (resolve with `git log -1`)
- Last full quality gate: 2026-07-24 00:31 local - all five commands exit 0 (see table)
- Open acceptance criteria: **0 of 59** (unchanged by this pass)

## Post-completion enhancement pass (user-directed): classic arcade feel

The user asked to make the game feel closer to a classic arcade run-and-gun. Literal copying of Contra is forbidden by ASSET_POLICY.md (highest precedence) and by GAME_REQUIREMENTS.md's scope caps, so this pass delivered the feel with original expression only, inside the caps (2 levels, 4 enemy archetypes, 3 weapons, 2 bosses, Normal only). Five items, each landed green in TDD order:

1. **Auto-fire while held (P1)** - `stepWeapon` now takes `{ pressed, held }`; holding fire auto-fires gated by the same cooldown (a 1e-9 epsilon keeps data cooldowns step-exact). Unit counts: rapid held 60 steps = exactly 10 shots, pulse = 5, and pressed+held can never beat the rate (C5 preserved; e2e asserts 2-8 live bullets after 2s held).
2. **Particle juice (P2)** - pure deterministic `src/simulation/particles.ts` (fixed velocity tables, ttl cull, cap 128) + a pooled render collection in LevelScene: muzzle flash on fire, hit sparks, death bursts on enemies/containers/subcomponents/boss, ground sparks on the stomp. Reduced-flash renders steady alpha (no strobing).
3. **Death/respawn juice (P5)** - burst on player death + a fading beacon at the respawn point (C6/C7 flows untouched).
4. **Telegraph readability (P4)** - exported `telegraphAim` (same math as the fire intents) drives aim-line markers during enemy wind-ups; the Siege Walker stomp now has a ground danger-zone marker paired with an **honest grounded-only shockwave damage rule** (`shockwaveHits`; jumping dodges) - the stomp previously dealt no damage, so the marker needed a real rule to be an honest affordance (strengthens E2/G1).
5. **Supply skiff carriers (P3)** - neutral destructible flyers (NOT a 5th enemy archetype: no AI, not counted in `MAX_ENEMIES`/`enemyCount`) patrolling a sky lane; one hit destroys them and they drop an existing weapon pickup (rapid in L1, scatter in L2) that falls and lands on solid ground (pit loss is intended). Reuses `collectPickups` verbatim (D2).

Scope reaffirmed: no Contra expression, no new levels/enemies/weapons/bosses/difficulty modes, no new asset files, no screen shake/hit-stop/camera effects, no new SFX/music. The `npm run test:soak` caps held with particles + carriers (maxEnemies 2/12, bullets 1-2/96, flat ~10 MB heap). Measured results below; one local commit, no push/deploy.

## Acceptance summary

- **Completed: all 59 of 59** - A1-A8, B1-B6, C1-C7, D1-D5, E1-E5, F1-F6, G1-G5, H1-H5, I1-I4, J1-J8.
- Newly completed this iteration (M7):
  - C7 respawns can never place the player inside a solid, hazard, enemy, or active projectile: loader rejects checkpoints overlapping terrain/hazards, `respawnPosition` shifts clear of enemies, and respawn clears projectiles (unit-tested).
  - D3 projectiles carry collision-category ownership tags and the resolvers enforce the centralized masks (`PLAYER_PROJECTILE_HITS` hits enemy bodies + boss components only; `ENEMY_PROJECTILE_HITS` hits the player body only; unit-tested).
  - D4 + J4 a ten-minute accelerated soak (`advanceSteps` fast-forward, 36,000 fixed steps) held counts far below caps - maxEnemies 2/12, maxPlayerBullets 1/96, maxEnemyBullets 2/96 - with a flat ~10 MB heap and zero uncaught errors; the bridge stayed responsive after (`npm run test:soak`).
  - F5 destructible containers block until destroyed and never permanently trap (E2E: blocked at the crate, destroyed by fire, walked through); doors/moving platforms/level transitions were verified trap-free in earlier milestones.
- Also this iteration: a dedicated Settings screen (GAME_REQUIREMENTS section 11) with volume/mute/reduced-flash adjustments persisted across reload (E2E); `test:soak` script added.
- Deployment note: DEPLOYMENT.md already documents Cloudflare Pages as build command `npm run build` and output directory `dist` (J6); the production build is fully static (A8, J5). **No push, no deploy, no PR** - deployment remains a user-authorized step.
- Remaining optional work (not part of the acceptance criteria, only with explicit user direction): a hands-on human playtest session, richer sprite art replacing procedural shapes, additional music tracks.

## Current iteration plan

M7 - Hardening and Cloudflare readiness (selected: final milestone; M0-M6 prerequisites satisfied). Plan to close the last five open criteria plus the settings-screen gap, with no scope expansion:

1. C7: level-loader validation that no checkpoint sits inside a solid or hazard, plus a pure `respawnPosition` that shifts the spawn clear of overlapping enemies; LevelScene respawn uses it (projectiles already cleared); unit tests.
2. D3: tag projectiles with their collision categories and enforce the centralized ownership masks (`PLAYER_PROJECTILE_HITS`, `ENEMY_PROJECTILE_HITS`) inside the collision resolvers; unit test for mask correctness + ownership.
3. F5: destructible containers (schema + `simulation/containers.ts` + LevelScene integration as solid-until-destroyed + level 1 data) that can never permanently trap the player; E2E destroys one and walks through.
4. D4 + J4: max-count tracking in the runtime, an `advanceSteps` debug command for accelerated simulation, a `test:soak` script, and a Playwright soak that fast-forwards ten minutes of simulation and asserts bounded enemy/projectile counts, no uncaught errors, and a responsive scene (memory trend recorded).
5. Settings screen (GAME_REQUIREMENTS section 11): a dedicated SettingsScene (volume up/down, mute, reduced-flash, all persisted) reachable from the title; persistence E2E.
6. Final: full quality gate, an extended automated keyboard playtest of Level 1's opening with a screenshot, deployment-docs confirmation (DEPLOYMENT.md already records build command + output dir), final evidence in PROGRESS.md, one local commit. Then evaluate project completion against the acceptance criteria.

M7 status: COMPLETE this iteration. Full quality gate GREEN (lint 0, typecheck 0, test 122/122 across 27 files, e2e 21/21 including the soak and hardening specs, build 377.41 kB gzip). All 59 acceptance criteria are now checked with recorded evidence, so per .claude/loop.md the completion condition is met; the final evidence and the completion signal follow. No further feature changes will be made.

## M6 (completed) iteration plan

M6 - Original asset and audio polish (selected: earliest incomplete milestone; M0-M5 prerequisites satisfied). Plan, staying strictly within ASSET_POLICY.md (original/procedural/permissive only; no Contra expression):

1. Asset manifest (J7): document every non-code asset class in ASSET_POLICY.md with provenance + license (procedural shapes, system font usage, WebAudio-synthesized music/SFX), and add one real project-created asset file - an original SVG favicon referenced from index.html.
2. Audio polish: replace the single drone with an original sequenced WebAudio music loop (short original bass + arpeggio pattern, low volume, no recognizable melody) plus SFX for telegraph wind-up, door open, and respawn; keep the service fully failure-safe; extend unit tests.
3. Readability polish (no scope expansion): an aim-direction barrel indicator on the player, per-weapon pickup colors, darker pit interiors for contrast; capture a Level 1 gameplay screenshot as PROGRESS evidence.
4. Run smallest checks first, then the full gate; fix failures without weakening tests; update PROGRESS + acceptance (J7); one local commit.

M6 status: COMPLETE this iteration. Full quality gate GREEN (lint 0, typecheck 0, test 111/111, e2e 18/18, build 376.05 kB gzip). The asset manifest documents every non-code asset class (one project-created SVG favicon + all procedural sprites/terrain/font/audio); audio gained an original sequenced music loop and three new wired SFX; readability polish (barrel indicator, per-weapon pickup colors, darker pits) was verified in a captured Level 1 gameplay screenshot with zero page errors.

Next iteration (after M6): M7 - hardening + Cloudflare readiness (C7 respawn-safety test, D3/D4 evidence, F5 destructible containers, J4 ten-minute soak test, console-error sweep, final manual playtest, deployment-docs confirmation).

## M5 (completed) iteration plan

M5 - Input, responsive UI, and persistence (selected: earliest incomplete milestone; M0-M4 prerequisites satisfied). Plan, reusing the input adapter, settings schema/StorageService, AudioService, and debug bridge:

1. Persistence: add `bestScore` to the versioned settings schema; load settings at boot into the registry; LevelScene/pause read + mutate + save them; results/game-over persist best score. E2E: change a setting, reload, assert it survives (B5, I1).
2. Eight-direction aiming: pure `simulation/aim.ts` (angle from input+facing; velocity rotation preserving spread); InputState `aimUp`/`aimDown`; keyboard mapping; LevelScene rotates projectile velocities and reports the last fire angle for tests; debug aim input commands; unit + E2E (C4).
3. Gamepad: `input/GamepadInput.ts` - pure snapshot->InputState mapping (D-pad/stick move+aim, A jump, X/RB fire, Start pause) plus a browser adapter merged into the scene input; E2E via a stubbed `navigator.getGamepads` fake pad (H2).
4. Touch: `ui/touch/TouchControls.ts` - DOM buttons (left/right, aim-up, jump, fire, pause) shown on coarse-pointer devices, merged into the scene input; E2E at a phone viewport with taps (H3).
5. Responsive + fullscreen: verify aspect-preserving canvas at desktop/tablet/phone viewports (H4 E2E); F10 fullscreen toggle.
6. Help: HelpScene listing keyboard/gamepad/touch controls (B4) reachable from the title; E2E.
7. Reduced-flash + focus-loss: telegraph flashes become steady when reducedFlash is on; window blur auto-pauses and clears held keys (H5 E2E).
8. Consolidated Playwright smoke test: real New Game start, move, jump, fire, pause, resume, return to title (J1).
9. Run smallest checks first, then the full gate; fix failures without weakening tests; update PROGRESS + acceptance; one local commit.

M5 status: COMPLETE this iteration. Full quality gate GREEN (lint 0, typecheck 0, test 109/109, e2e 18/18, build 375.64 kB gzip). Three integration defects found via the new E2E flows and fixed without weakening tests: (1) pause never published runtime state while paused, so gamepad/blur/touch pauses were invisible to tests; (2) the gamepad adapter was only polled in stepOnce, so Start could not resume from pause; (3) the airborne-down aim E2E raced the weapon cooldown (fixed with deterministic waits, not a logic change). Touch UI also gained a debug `touch=1` force flag for automation, mirroring `renderer=canvas`.

Next iteration (after M5): M6 - original asset + audio polish (replace temp shapes only where needed, documented/permissive audio, asset manifest + licenses, telegraph/readability polish).

## M4 (completed) iteration plan

M4 - Level 2 + final flow (selected: earliest incomplete milestone; M0-M3 prerequisites satisfied). Plan, reusing the M3 level schema/loader, platformer, boss FSM, damage ledger, and debug bridge:

1. Schema/loader: add `movingPlatforms` (axis/bounds/speed), `doors` (closed solid + open trigger region), and validate them; keep `loadLevel` throwing on malformed data.
2. Boss: add `reactorWarden` to `balance/bosses.ts` with `phaseCount` + per-phase `subcomponents`; extend `simulation/bosses.ts` so the boss is immune until the current phase's subcomponents are destroyed (scene passes `subcomponentsCleared`), then a vulnerable window, then next phase; health reaches zero once after the last phase (G2, G3, G4).
3. Sim modules: `simulation/movingPlatforms.ts` (bounded oscillation + per-step delta for player riding) and `simulation/doors.ts` (open/closed; closed = solid; opens on trigger overlap) - both pure + unit-tested.
4. `levels/level2.ts` - original Fortress Interior: moving platforms over pits, a door gated by a trigger, hazards, >=2 checkpoints, pickups, enemy remix (no new archetype), Reactor Warden arena, completion point (F2, F5, F6).
5. `LevelScene` integration: parameterize by `currentLevelIndex` (registry); merge dynamic solids (moving platforms + closed doors) into the platformer call; apply platform-riding delta; step doors/subcomponents; player bullets damage subcomponents via the ledger; render new entities; extend game-over overlay to R=restart + T=title; add debug commands `setCurrentLevel`/`triggerGameOver`/`completeLevel`/`damageBoss`.
6. Flow: `GameOverScene` (restart-level / return-to-title) and `ResultsScene` advances to the next level or shows final completion when no levels remain (B6, C6, final screen).
7. Tests: unit suites for movingPlatforms, doors, boss subcomponent phase gating, level2 validation; Playwright flows for checkpoint respawn (J2), game-over + restart/title (C6/B6), and Level 2 -> final completion (F2/G2).
8. Run smallest checks first, then the full gate; fix failures without weakening tests; update PROGRESS + acceptance; one local commit. Exit condition: both levels playable in sequence (deterministic flows verified).

M4 status: COMPLETE this iteration. Full quality gate GREEN (lint 0, typecheck 0, test 99/99, e2e 7/7, build 373.08 kB gzip). The E2E suite verifies both levels in sequence: Level 1 completes into Level 2, and Level 2 completes into the final completion screen (M4 exit condition). One significant debugging episode: scene restarts crashed because Phaser reuses the scene instance while my `create()` pushed into instance render-pool arrays without clearing them (out-of-bounds reads killed the game loop). The fix was correct early, but verification was poisoned by a stale `vite preview` process from an earlier manual probe lingering on port 4173 - with `reuseExistingServer: true`, the Playwright webServer and my probes kept serving the pre-fix bundle. Killing the stale process confirmed the fix. Lesson recorded: probe servers must be torn down; do not trust `reuseExistingServer` when a manual server may be alive.

Next iteration (after M4): M5 - input/responsive/persistence polish (gamepad, touch, responsive scaling + fullscreen, settings load/save across reload, best-score persistence, reduced-flash + focus-loss handling).

## M3 (completed) iteration plan

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

M7 (this iteration):

- `src/levels/levelLoader.ts` - C7 checkpoint validation (no checkpoint body inside solid terrain or a hazard); container validation.
- `src/simulation/safeSpawn.ts` - `respawnPosition` shifts the respawn clear of enemies (C7); `src/scenes/LevelScene.ts` uses it on respawn.
- `src/simulation/categories.ts` - now enforced in the LevelScene resolvers: bullets carry category tags and the centralized masks gate damage (D3).
- `src/levels/levelSchema.ts` + `src/simulation/containers.ts` + level 1/2 data - destructible containers (F5); LevelScene integrates them as solid-until-destroyed with score drops.
- `src/scenes/LevelScene.ts` - max-count tracking (`maxEnemiesSeen`/`maxPlayerBulletsSeen`/`maxEnemyBulletsSeen`), `advanceSteps` debug command, game-over transition guard.
- New `src/scenes/SettingsScene.ts` - dedicated settings screen (GAME_REQUIREMENTS section 11); title S shortcut; volume/mute/reduced-flash persisted.
- New `tests/e2e/soak.spec.ts` + `npm run test:soak` - ten-minute accelerated soak (J4/D4); new `tests/e2e/hardening.spec.ts` (F5 containers + settings screen); new `tests/unit/{respawn,categories,containers}.test.ts`; `tests/unit/levelLoader.test.ts` C7 cases.
- `ACCEPTANCE_CRITERIA.md` - checked C7, D3, D4, F5, J4 (all 59 now complete).

M6 (previous iteration, retained for history):

- `ASSET_POLICY.md` - manifest now documents every non-code asset class with provenance + license (J7).
- New `public/assets/images/favicon.svg` - original hand-authored shield + echo-wave favicon; `index.html` references it.
- `src/audio/AudioService.ts` - original sequenced music loop (8-step bass + arpeggio) replacing the drone; new `telegraph`/`door`/`respawn` SFX; `musicTimer`/`musicNodes` lifecycle with clean stop/restart.
- `src/scenes/LevelScene.ts` - wires the new SFX (enemy/boss telegraph wind-up, door open, respawn); aim-direction barrel indicator; per-weapon pickup colors; darker pit fills.
- `tests/unit/audio.test.ts` - coverage for all nine SFX names + music loop scheduling/stop/restart.
- `ACCEPTANCE_CRITERIA.md` - checked J7.

M5 (previous iteration, retained for history):

- `src/persistence/schema.ts` - `bestScore` added (versioned, validated, non-negative integer); `src/main.ts` loads settings into the registry at boot.
- `src/scenes/LevelScene.ts` - reads settings from the registry; pause toggles persist them; `awardScore` command; aim rotation in firing + `fireAngle` in runtime; gamepad/touch merged into input; blur auto-pause + key clear; reduced-flash steady telegraphs; publish runtime + poll gamepad while paused.
- `src/scenes/ResultsScene.ts` + `src/scenes/GameOverScene.ts` - persist + display the best score.
- `src/audio/AudioService.ts` - settings literal unified to `DEFAULT_SETTINGS`.
- New `src/simulation/aim.ts` - pure eight-direction aim angle + velocity rotation.
- New `src/input/GamepadInput.ts` - pure snapshot mapping + adapter (A jump, X/RB fire, D-pad/stick move+aim, Start pause edge).
- New `src/ui/touch/TouchControls.ts` - DOM touch buttons (move, aim-up, jump, fire, pause) for touch devices (plus a debug `touch=1` force flag).
- `src/input/InputState.ts` - `aimUp`/`aimDown` fields; `src/input/KeyboardInput.ts` - aim mapping + `clear()`; `src/debug/debugBridge.ts` - aim + `awardScore` command names.
- New `src/scenes/HelpScene.ts` - controls/help screen (B4); `src/scenes/TitleScene.ts` - help hint + F10 note + H shortcut; `src/app/config.ts`/`createGame.ts` - help scene registration; `src/main.ts` - F10 fullscreen toggle.
- New `tests/unit/{aim,gamepad}.test.ts`; `tests/unit/settings.test.ts` bestScore cases; new `tests/e2e/{input,responsive,settings,smoke}.spec.ts` (C4 aiming, H2 gamepad, H5 focus-loss, H4 aspect, H3 touch, B5/I1 persistence, B4 help, J1 smoke).
- `ACCEPTANCE_CRITERIA.md` - checked C2, C4, B4, B5, H1-H5, I1, J1.

M4 (previous iteration, retained for history):

- `src/levels/levelSchema.ts` - added `MovingPlatformDef` + `DoorDef` + LevelDef fields; `src/levels/levelLoader.ts` validates them; `src/levels/level1.ts` supplies the new (empty) fields.
- New `src/levels/level2.ts` - original Fortress Interior (moving platforms, a trigger-gated door, hazards, 3 checkpoints, pickups, enemy remix, Reactor Warden arena).
- New `src/levels/levels.ts` - ordered `LEVELS` registry driving level sequencing.
- `src/balance/bosses.ts` - Reactor Warden def (2 phases, per-phase destructible subcomponents); BossDef extended (`phaseCount`, `phases`).
- New `src/simulation/movingPlatforms.ts` - bounded oscillation + per-step delta (player riding); `src/simulation/doors.ts` - open/closed doors with `closedDoorRects`.
- `src/simulation/bosses.ts` - phase/subcomponent gating (`subcomponentsCleared` param, phase advance, no deadlock); Siege Walker behaviour preserved (M3 tests still green).
- `src/scenes/LevelScene.ts` - parameterized by `currentLevelIndex`; dynamic solids (moving platforms + closed doors) merged into the platformer call; platform-riding delta; door + subcomponent stepping; bullets damage subcomponents via the ledger; boss death transition clears hostile projectiles (G5); render pools for new entities; **fix**: clear render-pool arrays on `create()` (scene-instance reuse crash); game-over now transitions to the new scene.
- New `src/scenes/GameOverScene.ts` - game-over screen (score, R restart-level, T return-to-title).
- `src/scenes/ResultsScene.ts` - advances to the next level, or shows MISSION COMPLETE (final) and returns to title.
- `src/app/config.ts` + `src/app/createGame.ts` - `gameOver` scene key + registration; `src/main.ts` - `startLevel2` command + `currentLevelIndex` seeding; `src/debug/debugBridge.ts` - `startLevel2`/`triggerGameOver` command names; `src/scenes/TitleScene.ts` - resets level index on start.
- New `tests/unit/{movingPlatforms,doors,bossesPhase}.test.ts`; `tests/unit/levelLoader.test.ts` extended (level2 + moving platform/door validation); new `tests/e2e/level2.spec.ts` (checkpoint respawn, game-over restart/title, Level 1 -> Level 2 -> final screen).
- `ACCEPTANCE_CRITERIA.md` - checked F1, F2, G2, G5, C5, C6, B6, D1, E1, J2, J3.

M3 (previous iteration, retained for history):

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
| 2026-07-22 21:31 (M4) | `npm run lint` | PASS (exit 0) | `eslint .`, no warnings |
| 2026-07-22 21:31 (M4) | `npm run typecheck` | PASS (exit 0) | `tsc --noEmit`, strict mode |
| 2026-07-22 21:31 (M4) | `npm run test` | PASS (exit 0) | Vitest 4.1.10: **22 files, 99 tests passed** |
| 2026-07-22 21:31 (M4) | `npm run test:e2e` | PASS (exit 0) | Playwright 1.61.1, chromium: **7 passed** (title + M1/M2 sandbox + level1 + level2) |
| 2026-07-22 21:31 (M4) | `npm run build` | PASS (exit 0) | Vite 8.1.5; `dist/assets/index-*.js` 1,429.92 kB raw / **373.08 kB gzip** (under 2.5 MB budget) |
| 2026-07-23 07:15 (M5) | `npm run lint` | PASS (exit 0) | `eslint .`, no warnings |
| 2026-07-23 07:15 (M5) | `npm run typecheck` | PASS (exit 0) | `tsc --noEmit`, strict mode |
| 2026-07-23 07:15 (M5) | `npm run test` | PASS (exit 0) | Vitest 4.1.10: **24 files, 109 tests passed** |
| 2026-07-23 07:15 (M5) | `npm run test:e2e` | PASS (exit 0) | Playwright 1.61.1, chromium: **18 passed** (title + sandbox x2 + level1 + level2 x3 + input x3 + responsive x4 + settings x3 + smoke) |
| 2026-07-23 07:15 (M5) | `npm run build` | PASS (exit 0) | Vite 8.1.5; `dist/assets/index-*.js` 1,437.35 kB raw / **375.64 kB gzip** (under 2.5 MB budget) |
| 2026-07-23 12:39 (M6) | `npm run lint` | PASS (exit 0) | `eslint .`, no warnings |
| 2026-07-23 12:39 (M6) | `npm run typecheck` | PASS (exit 0) | `tsc --noEmit`, strict mode |
| 2026-07-23 12:39 (M6) | `npm run test` | PASS (exit 0) | Vitest 4.1.10: **24 files, 111 tests passed** |
| 2026-07-23 12:39 (M6) | `npm run test:e2e` | PASS (exit 0) | Playwright 1.61.1, chromium: **18 passed** |
| 2026-07-23 12:39 (M6) | `npm run build` | PASS (exit 0) | Vite 8.1.5; `dist/assets/index-*.js` 1,438.60 kB raw / **376.05 kB gzip** (under 2.5 MB budget) |
| 2026-07-23 12:39 (M6) | Level 1 gameplay screenshot (production preview, canvas renderer) | PASS | Player + barrel indicator with an aim-up bullet in flight, per-weapon pickup color, darker red-outlined pit, HUD + controls hint; **zero page errors** |
| 2026-07-23 18:57 (M7) | `npm run lint` | PASS (exit 0) | `eslint .`, no warnings |
| 2026-07-23 18:57 (M7) | `npm run typecheck` | PASS (exit 0) | `tsc --noEmit`, strict mode |
| 2026-07-23 18:57 (M7) | `npm run test` | PASS (exit 0) | Vitest 4.1.10: **27 files, 122 tests passed** |
| 2026-07-23 18:57 (M7) | `npm run test:e2e` | PASS (exit 0) | Playwright 1.61.1, chromium: **21 passed** (all suites incl. soak + hardening) |
| 2026-07-23 18:57 (M7) | `npm run test:soak` | PASS (exit 0) | 36,000-step (10 min) accelerated soak: maxEnemies 2/12, maxPlayerBullets 1/96, maxEnemyBullets 2/96, heap flat ~10 MB, zero uncaught errors, bridge responsive after |
| 2026-07-23 18:57 (M7) | `npm run build` | PASS (exit 0) | Vite 8.1.5; `dist/assets/index-*.js` 1,444.62 kB raw / **377.41 kB gzip** (under 2.5 MB budget) |
| 2026-07-23 18:57 (M7) | Automated keyboard playtest (production preview, real keys) | PASS | Enter starts Level 1; D moves (x 60 -> 291); Space jumps and lands; J fires; Escape pauses and resumes; pickup collected en route (HUD shows SCATTER BLASTER); 3-pellet scatter spread visible in screenshot; **zero page errors** |
| 2026-07-24 00:31 (polish) | `npm run lint` | PASS (exit 0) | `eslint .`, no warnings |
| 2026-07-24 00:31 (polish) | `npm run typecheck` | PASS (exit 0) | `tsc --noEmit`, strict mode |
| 2026-07-24 00:31 (polish) | `npm run test` | PASS (exit 0) | Vitest 4.1.10: **30 files, 149 tests passed** |
| 2026-07-24 00:31 (polish) | `npm run test:e2e` | PASS (exit 0) | Playwright 1.61.1, chromium: **25 passed** (21 + 4 new polish flows) |
| 2026-07-24 00:31 (polish) | `npm run test:soak` | PASS (exit 0) | Soak caps hold with particles + carriers: maxEnemies 2/12, maxPlayerBullets 1/96, maxEnemyBullets 2/96, heap flat ~10 MB, zero uncaught errors |
| 2026-07-24 00:31 (polish) | `npm run build` | PASS (exit 0) | Vite 8.1.5; `dist/assets/index-*.js` 1,451.99 kB raw / **379.41 kB gzip** (under 2.5 MB budget) |

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
- M4: Level 2 renders an industrial interior (olive moving platforms traversing the pit and a vertical lift, an orange door that turns translucent while open, cyan Reactor Warden turrets, and the phase-gated core). The game-over screen (score + R/T actions) and the final MISSION COMPLETE screen are keyboard-navigable. Boss-fight playthroughs are verified at FSM/unit level; a full human keyboard playthrough of both levels remains a manual-playtest item for M7 (TEST_PLAN section 6).
- M4 debugging note: a scene-restart crash (Phaser reuses the scene instance; un-cleared render-pool arrays indexed past the level data and killed the game loop) was masked for several runs by a stale `vite preview` from an early manual probe - the Playwright `reuseExistingServer` option reused it, so the fixed bundle never ran. Always tear down manual probe servers; treat "the fix didn't change anything" as a signal to check what is actually being served.
- M5: the game now presents a proper front end - title with start/help hints, a controls/help screen covering all three input families, and pause with live mute/reduced-flash toggles that survive reload. Touch devices get on-screen buttons (verified by taps at a phone viewport); gamepads drive every action (verified through a stubbed Gamepad API); F10 toggles fullscreen. Aiming works in eight directions and the whole scatter fan rotates with the aim. A full human playthrough of both levels on keyboard/gamepad/touch remains the M7 manual-playtest item.
- M5 debugging note: three integration defects were caught by the new E2E flows (unpublished pause state; gamepad not polled while paused; an aim-flow cooldown race in the test itself) - all fixed at the source, no test weakened.
- M6: presentation is now documentably original end-to-end - the only asset file is a hand-authored SVG favicon; everything else is procedural code output (documented in the ASSET_POLICY.md manifest). The level scene has an original sequenced music loop plus telegraph/door/respawn cues, an aim-direction barrel indicator, per-weapon pickup colors, and darker pit interiors. The captured gameplay screenshot shows the aim-up barrel + bullet, colored pickup, and pit contrast with zero console errors.

- M7 playtest (TEST_PLAN section 6, automated with real keyboard input on the production build): controls feel responsive (move/jump/fire/pause all act within a frame or two of a human-length press); bullets and the scatter spread are visually readable; enemy telegraphs flash yellow outlines (steady when reduced-flash is on); the pit respawn returns the player to the checkpoint with a visible invulnerability tint and no repeated instant deaths; pause and window-blur freeze the simulation without stuck input; audio settings persist across reload; the game remains playable with sound disabled (the audio service is failure-safe by design and unit-tested). Zero uncaught console errors across every flow. One nuance recorded: instant sub-frame key taps (Playwright's `press()`) can be missed by the 60 Hz input sampling - real keyboards hold keys for multiple frames, so this does not affect players, but the playtest was repeated with human-length holds for honest evidence.
- Manual human playtest: the full checklist above was verified automatically; a hands-on session by the user before public deployment is still recommended (see DEPLOYMENT.md), but it is not a blocker for the acceptance criteria, which are all now checked with recorded evidence.

## Known issues

- None. Open advisories only: the Vite chunk-size warning (Phaser bundle, expected and well under the 2.5 MB budget) and the headless-WebGL limitation (mitigated for automation via the documented `renderer=canvas` debug override; real browsers use WebGL via `Phaser.AUTO`).

## Next recommended task

**None - the project is complete, including the user-directed classic-feel polish pass.** All milestones M0-M7 are done, all 59 acceptance criteria remain checked with recorded evidence, and the full quality gate passes. Any further work happens only with explicit user direction (e.g., the "expand the spec scope" option from the polish planning: amending GAME_REQUIREMENTS.md to allow more original content). Deployment to Cloudflare Pages remains a user-authorized manual step (DEPLOYMENT.md).
