# PROGRESS.md

Use this file as the durable development log.

Record one entry after each work iteration.

Include enough detail so the next iteration can continue without guessing.

---

## Entry template

### YYYY-MM-DD HH:MM - TASK-ID

- Status before:
- Goal of this iteration:
- Work completed:
- Files changed:
- Assets added or updated:
- Commands run:
- Verification result:
- Visual quality notes:
- Status after:
- Remaining work:
- Next recommended task:
- Blockers (if any):

---

## Initial entry

### INITIAL

- Status before: project planning only
- Goal of this iteration: set up project-specific loop workflow for Operation Iron Echo
- Work completed:
  - created project-specific requirements
  - created task list
  - created first-run prompt
  - prepared progress log structure
- Files changed:
  - PROJECT.md
  - TASKS.md
  - FIRST_RUN_PROMPT.md
  - PROGRESS.md
- Assets added or updated:
  - none yet
- Commands run:
  - none yet
- Verification result:
  - planning files prepared
- Visual quality notes:
  - the final game must use recognizable sprites and scenes rather than abstract block-only visuals
- Status after:
  - ready for first implementation iteration
- Remaining work:
  - begin TASK-001
- Next recommended task:
  - TASK-001 - Bootstrap project and create non-abstract presentation baseline
- Blockers (if any):
  - none

---

### 2026-07-24 15:45 - TASK-001

- Status before: TODO
- Goal of this iteration:
  Verify the existing bootstrapped build against the TASK-001 acceptance criteria and close the real gap: the gameplay scenes still rendered as abstract colored rectangles.
- Work completed:
  - Audited all 8 acceptance criteria. The prior milestone build already covered toolchain, title screen, prototype room, and tests; the missing pieces were the `test:unit` script and, critically, the non-abstract presentation baseline (player/enemies/environment were flat rectangles).
  - Added `test:unit` script to package.json (was only `test`).
  - Built an original pixel-art pipeline: pure parser (`src/art/pixelArt.ts`), hand-authored sprite sheet (`src/art/sprites.ts`), Phaser canvas-texture compiler (`src/art/textures.ts`). No external assets; everything procedural and original.
  - Re-rendered the prototype room (SandboxScene) with sprites: 22x32 commando player (idle/run-A/run-B/jump poses, facing flip, invuln blink), Runner and Sentry enemy sprites, energy bolt / plasma orb projectiles, supply crate pickups.
  - Built a layered dusk jungle-war backdrop: gradient night sky, star field, canopy ridge, ruins and dead-tree silhouettes, textured grass/dirt ground tiles, bush/rock props, hazard-striped pit rims over a dark void.
  - Title screen: added "P - PROTOTYPE ROOM" entry so the room is reachable by players, not only via debug command.
  - Enabled `pixelArt: true` in Phaser config for crisp sprite scaling.
  - Exposed `window.__GAME__` in debug mode only, so e2e tests can assert sprite textures/display list.
  - Fixed via visual inspection loop: ground-tile transparent seam (ragged rows), opaque telegraph overlay hiding enemy sprites, over-dense star field, visor palette typo.
- Files changed:
  - package.json, eslint.config.js
  - src/art/pixelArt.ts, src/art/sprites.ts, src/art/textures.ts (new)
  - src/scenes/SandboxScene.ts, src/scenes/TitleScene.ts, src/app/createGame.ts, src/main.ts
  - tests/unit/pixelArt.test.ts, tests/unit/sprites.test.ts (new)
  - tests/e2e/prototypeRoom.spec.ts (new)
  - scripts/visual-check.mjs (new, screenshot capture for visual review)
- Assets added or updated:
  - Original pixel-art sprite sheet in `src/art/sprites.ts`: player (4 poses), Runner, Sentry, player/enemy projectiles, pickup crate, ground/hazard tiles, bush/rock props, ruin/tree/ridge/stars background art.
- Commands run:
  - `npx vitest run tests/unit/pixelArt.test.ts tests/unit/sprites.test.ts` (10 passed)
  - `npm run lint` (pass)
  - `npm run typecheck` (pass)
  - `npm run test:unit` (159 passed, 32 files)
  - `npm run build` (pass)
  - `npx playwright test ...` smoke/prototypeRoom/sandbox/title (5 passed), then full suite (26 passed, incl. soak)
  - `node scripts/visual-check.mjs` (screenshot review of title + room: idle, run, enemies, 3x zoom)
- Verification result:
  - lint, typecheck, unit tests, build, and all 26 e2e tests pass.
  - Screenshots verified: recognizable commando sprite with rifle, distinct red Runner and turret Sentry, layered environment art; no rectangle-only presentation in the prototype room.
- Visual quality notes:
  - The prototype room now demonstrates the intended art direction (chunky original pixel art, dusk jungle war zone).
  - Level 1 / Level 2 (LevelScene) still render as rectangles; their visual upgrade is scoped to TASK-005/TASK-007 per the task list, not TASK-001.
  - Title screen is still text-only (system fonts); acceptable for now, richer title art is a polish item.
- Status after: DONE
- Remaining work:
  - TASK-002 player animation states (crouch/hurt/death poses do not exist yet; sandbox sim has no crouch yet).
- Next recommended task:
  - TASK-002 - Implement player movement, animation states, and combat controls
- Blockers (if any):
  - none

---

### 2026-07-24 16:45 - TASK-002

- Status before: TODO
- Goal of this iteration:
  Give the player the full TASK-002 animation-state set (idle/run/jump/crouch/shoot/hurt/death) with a representational sprite in the main gameplay scene, and verify the controls end to end.
- Work completed:
  - Found movement/jump/crouch/shoot/8-way-aim mechanics already implemented and unit-tested in the prior build (simulation/platformer.ts, simulation/aim.ts); the gaps were presentation and one critical input bug.
  - Authored 5 new player poses in the shared sprite sheet: crouch (22x20, matches crouch hitbox), aim-up, aim-diag, hurt flinch, death (32x16 fallen).
  - Added pure pose selector `src/art/playerPose.ts` (death > hurt > crouch > jump > aim-up/diag > run > idle) with full unit coverage.
  - LevelScene: replaced the green rectangle + barrel indicator with the animated pixel-art commando (feet-anchored, facing flip, invuln blink, run cycle); publishes `playerPose`/`dying` for tests.
  - Added a classic death pause (0.9 s death pose, burst fx, explosion sfx) before the life loss + checkpoint respawn; the life decrement now lands exactly when the respawn does (keeps e2e timing consistent); pit-death body clamped on-screen.
  - Hurt flinch (0.3 s) on any applied hit.
  - CRITICAL pre-existing fix: Phaser never calls a Scene's `shutdown()` method - it only emits the event - so every scene's window listeners leaked. The title screen's handler hijacked S (crouch opened Settings!), H, and Enter (fire restarted the level) while playing. Added `src/scenes/sceneLifecycle.ts` (`hookShutdown`) and wired all 7 listener-owning scenes; regression-asserted in e2e.
- Files changed:
  - src/art/sprites.ts, src/art/playerPose.ts (new), src/scenes/sceneLifecycle.ts (new)
  - src/scenes/LevelScene.ts, TitleScene.ts, HelpScene.ts, SettingsScene.ts, GameOverScene.ts, ResultsScene.ts, SandboxScene.ts
  - tests/unit/playerPose.test.ts (new), tests/unit/sceneLifecycle.test.ts (new), tests/unit/sprites.test.ts
  - tests/e2e/playerAnim.spec.ts (new)
  - scripts/zoom-check.mjs (new), scripts/visual-check.mjs
- Assets added or updated:
  - 5 new original pixel-art player poses (crouch, aim-up, aim-diag, hurt, death) in `src/art/sprites.ts`.
- Commands run:
  - `npx vitest run tests/unit/playerPose.test.ts tests/unit/sprites.test.ts` (19 passed after fixes)
  - `npm run typecheck`, `npm run lint` (both clean)
  - `npm run test:unit` (170 passed, 34 files)
  - `npm run build` (pass)
  - `npx playwright test` (27 passed, incl. new playerAnim spec)
  - `node scripts/visual-check.mjs`, `node scripts/zoom-check.mjs` (pose screenshots, 3x zoom art review)
- Verification result:
  - All automated checks pass: lint, typecheck, 170 unit tests, build, 27 e2e tests.
  - e2e `playerAnim.spec.ts` drives idle > run > jump > crouch > aim-up > aim-diag > death > respawn through real input and asserts each pose plus the no-leak regression.
  - Screenshots reviewed at 3x zoom: commando readable in idle, crouch, aim-up; death pose visible in pit flow.
  - Controls responsiveness: verified via deterministic input->state e2e flows (input latency path unchanged from prior milestone); physics untouched. Human hands-on play still recommended at release.
- Visual quality notes:
  - The main gameplay scene now shows the animated commando sprite instead of a green rectangle.
  - Level terrain/enemies remain rectangles - scoped to TASK-004/TASK-005, not this task.
  - Aim-up/aim-diag poses make 8-way firing readable; moving + aim-up uses the diagonal pose.
- Status after: DONE
- Remaining work:
  - none for this task; next tasks cover weapons presentation (TASK-003) and enemy visuals (TASK-004).
- Next recommended task:
  - TASK-003 - Implement weapon system and readable visual combat feedback
- Blockers (if any):
  - none

---

### 2026-07-24 18:55 - TASK-003

- Status before: TODO
- Goal of this iteration:
  Distinct visual identity per weapon plus readable combat feedback, on top of the existing data-driven weapon system.
- Work completed:
  - Audited: Pulse Rifle / Scatter Blaster / Rapid Carbine behaviors (cooldown, damage, speed, spread fan, ttl) were already implemented, unit-tested, and pickup-switchable in the prior build; muzzle + hit-spark + kill-burst feedback already existed in LevelScene. The gap was projectile visuals: every weapon shared one identical bullet.
  - Authored 3 distinct projectile sprites: pulse bolt (yellow-orange), scatter pellet (stubby orange chunk, 3 per shot), rapid dart (slim cyan tracer).
  - Added pure `bulletTexture(weapon)` mapping (`src/art/weaponArt.ts`) with unit tests (distinctness + sprite-sheet existence).
  - LevelScene and SandboxScene now render player bullets as per-weapon sprites rotated along their flight vector (atan2), so 8-way fire reads clearly; image pool replaces the rect pool in LevelScene.
- Files changed:
  - src/art/sprites.ts, src/art/weaponArt.ts (new)
  - src/scenes/LevelScene.ts, src/scenes/SandboxScene.ts
  - tests/unit/weaponArt.test.ts (new), tests/e2e/weaponVisuals.spec.ts (new)
  - scripts/weapon-check.mjs (new)
- Assets added or updated:
  - `art/bullet-pulse` (renamed from art/bullet-player), `art/bullet-scatter`, `art/bullet-rapid`.
- Commands run:
  - `npx vitest run tests/unit/weaponArt.test.ts tests/unit/sprites.test.ts` (8 passed)
  - `npm run typecheck`, `npm run lint` (clean)
  - `npm run test:unit` (173 passed, 35 files)
  - `npm run build` (pass)
  - `npx playwright test` (28 passed, incl. new weaponVisuals spec)
  - `node scripts/weapon-check.mjs` (screenshots of all three weapons firing)
- Verification result:
  - All checks pass: lint, typecheck, 173 unit tests, build, 28 e2e tests.
  - e2e `weaponVisuals.spec.ts` asserts each weapon's projectile texture on the display list, the scatter 3-pellet fan, sprite rotation matching aim angle, and pickup switching (pulse -> scatter -> rapid).
  - Screenshots reviewed: bolt / pellet fan / cyan darts are immediately distinguishable in flight.
- Visual quality notes:
  - Each weapon now has an unmistakable projectile identity; angled shots rotate the sprite.
  - Enemy projectiles still share one sprite (enemies get their visual pass in TASK-004).
- Status after: DONE
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-004 - Implement enemy roster with recognizable visual identities
- Blockers (if any):
  - none