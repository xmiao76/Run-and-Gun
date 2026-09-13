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

---

### 2026-07-25 01:10 - TASK-004

- Status before: TODO
- Goal of this iteration:
  Give the four existing enemy archetypes recognizable, distinct sprite identities in the main gameplay scene.
- Work completed:
  - Audited: all 4 archetypes (Runner rusher, Sentry turret, Drone aerial patrol, Grenadier arc-lobber) already existed with distinct data-driven behaviors, unit tests, player damage, kill bursts, and soak-test stability. The gap was visuals: LevelScene rendered colored rectangles; Grenadier/Drone had no sprites at all.
  - Authored 2 new sprites: Grenadier (purple ordnance trooper with bandolier + arm cannon) and Drone (rotor craft with red optic, chin guns, thrusters).
  - Added pure `enemyTexture(kind)` mapping (`src/art/enemyArt.ts`) with unit tests (distinctness, sheet existence, sprite-within-hitbox bounds).
  - LevelScene renders enemies as kind-keyed sprites with facing flip (telegraph outlines + aim lines preserved); enemy projectiles now use the plasma-orb sprite (were red rectangles).
  - Fixed LevelScene telegraph overlay: opaque black fill hid enemy sprites during wind-up (same bug class as the sandbox fix in TASK-001); now stroke-only.
  - Published the enemy kind/position list in the level runtime for tests/probes.
  - Found + explained a spawn-culling edge: enemies spawned far ahead are culled against the *stale* (one-step-lagged) camera window, so long debug teleports can drop a spawn; organic play is unaffected (verified via probe); e2e uses staged teleports instead.
- Files changed:
  - src/art/sprites.ts, src/art/enemyArt.ts (new)
  - src/scenes/LevelScene.ts
  - tests/unit/enemyArt.test.ts (new), tests/e2e/enemyVisuals.spec.ts (new)
  - scripts/enemy-check.mjs (new), scripts/probe.mjs (new, debug probe utility)
- Assets added or updated:
  - `art/enemy-grenadier`, `art/enemy-drone` sprites; enemy orbs now sprite-based in levels.
- Commands run:
  - `npx vitest run tests/unit/enemyArt.test.ts` (3 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (176 passed, 36 files)
  - `npm run build` (pass)
  - `npx playwright test` (29 passed, incl. new enemyVisuals spec)
  - `node scripts/probe.mjs`, `node scripts/enemy-check.mjs` (spawn probe + screenshots)
- Verification result:
  - All checks pass: lint, typecheck, 176 unit tests, build, 29 e2e tests.
  - e2e `enemyVisuals.spec.ts` asserts all 4 enemy sprite textures on the display list across waves 1-2 and that enemy fire renders as sprite orbs.
  - Screenshots reviewed: Runner + Drone (wave 1) and Sentry with telegraph aim line (wave 2 zoom) read clearly; no placeholder blocks remain for enemies.
- Visual quality notes:
  - All four enemies are visually distinct: crimson visored Runner, red-dome Sentry turret, rotor Drone, purple Grenadier.
  - Level terrain/boss/pickups remain rectangles - terrain is TASK-005/TASK-007 scope; pickups/boss visuals fold into those.
- Status after: DONE
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-005 - Build Level 1 as a complete visually rich playable stage
- Blockers (if any):
  - none

---

### 2026-07-25 07:15 - TASK-005

- Status before: TODO
- Goal of this iteration:
  Turn Level 1's functional-but-abstract map into a themed, visually rich stage (jungle war zone) with layered environment art.
- Work completed:
  - Audited: level layout (solids/one-ways/hazards), 3 enemy waves, 2 pickups, 3 checkpoints, boss arena, and completion flow all existed and were e2e-covered; the gap was presentation - flat dark rectangles for terrain and no backdrop at all.
  - Added a themeable environment system: pure `themeForLevel` + deterministic `propsForSolid`/`horizonForLevel` placement (`src/art/levelTheme.ts`) with unit tests; Level 2 inherits the jungle theme until TASK-007 gives it a fortress identity.
  - Level 1 backdrop: night-sky gradient, star field (0.15x), distant ridge band (0.3x parallax), world-anchored horizon silhouettes (dead trees + ruins, alpha-faded for depth), textured grass/dirt ground tiles (world-anchored tile offsets), wooden one-way platforms, hazard-striped pit voids, bushes/rocks scattered deterministically.
  - New sprites: `art/tile-oneway` (plank platform) and `art/prop-skiff` (supply carrier pod); containers, pickups, carrier drops, and supply skiffs now render as sprites in LevelScene.
  - Debug note: spent a cycle chasing "missing" changes that were really a stale vite-preview process serving an old bundle and minified identifiers defeating grep; restarted the server and all was correct. The screenshots now come from the fresh build.
- Files changed:
  - src/art/sprites.ts, src/art/levelTheme.ts (new)
  - src/scenes/LevelScene.ts
  - tests/unit/levelTheme.test.ts (new), tests/e2e/levelVisuals.spec.ts (new)
  - scripts/level-check.mjs (new), scripts/display-probe.mjs (new)
- Assets added or updated:
  - `art/tile-oneway`, `art/prop-skiff`; Level 1 environment built from the shared sheet.
- Commands run:
  - `npx vitest run tests/unit/levelTheme.test.ts` (10 passed with sprite tests)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (183 passed, 37 files)
  - `npm run build` (pass)
  - `npx playwright test` (30 passed, incl. new levelVisuals spec)
  - `node scripts/level-check.mjs`, `node scripts/display-probe.mjs`
- Verification result:
  - All checks pass: lint, typecheck, 183 unit tests, build, 30 e2e tests.
  - e2e `levelVisuals.spec.ts` asserts ground tiles, horizon silhouettes, crate pickups, and that the ridge parallax trails the camera correctly.
  - Screenshots reviewed at start/wave/mid/arena: dusk jungle war-zone theme is coherent and combat stays readable.
- Visual quality notes:
  - Level 1 no longer presents as abstract blocks: layered parallax backdrop, textured terrain, themed props, sprite pickups/containers/skiffs.
  - The boss itself is still a rectangle - intentionally deferred to TASK-006 (boss pass).
  - Level 2 currently inherits the jungle theme; TASK-007 gives it the fortress identity.
- Status after: DONE
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-006 - Implement Level 1 boss
- Blockers (if any):
  - none

---

### 2026-07-25 13:00 - TASK-006

- Status before: TODO
- Goal of this iteration:
  Give the existing Siege Walker boss a large, detailed visual identity worthy of a boss fight.
- Work completed:
  - Audited: the Siege Walker already existed with 3 telegraphed patterns (stomp/burst/charge), vulnerable windows, boss bar, defeat/completion flow, and e2e coverage. The gap was purely visual: a 64x56 brown rectangle.
  - Authored the Siege Walker sprite (61x56, stretched to the 64x56 hitbox): quadruped siege mech with a wide red plated hull, amber optic visor band, vented belly skirt, dorsal cannon + antenna, and four hydraulic legs with knees and feet. Two design iterations via screenshot review (first reads as "dome on a fence", second as a proper mech).
  - LevelScene renders the boss as the sprite: facing flip toward the player, warm tint during the vulnerable window (replaces the rectangle fill swap), telegraph outline and stomp zone markers preserved. Non-siegeWalker bosses keep the rectangle fallback until their own task (Reactor Warden = TASK-008).
  - Boss sprite hidden once defeated (verified in e2e).
  - Also repaired two self-inflicted sprite-sheet corruptions mid-task (clipped PROP_SKIFF body) caught by typecheck + sprite tests.
- Files changed:
  - src/art/sprites.ts
  - src/scenes/LevelScene.ts
  - tests/unit/sprites.test.ts
  - tests/e2e/bossVisuals.spec.ts (new)
  - scripts/boss-check.mjs (new), scripts/texture-probe.mjs (new)
- Assets added or updated:
  - `art/boss-siege-walker`.
- Commands run:
  - `npx vitest run tests/unit/sprites.test.ts` (6 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (184 passed, 37 files)
  - `npm run build` (pass)
  - `npx playwright test` (31 passed, incl. new bossVisuals spec)
  - `node scripts/boss-check.mjs`, `node scripts/texture-probe.mjs`
- Verification result:
  - All checks pass: lint, typecheck, 184 unit tests, build, 31 e2e tests.
  - e2e `bossVisuals.spec.ts` asserts the boss renders as its 64x56 sprite during the fight (clearly larger than <=24px standard enemies) and hides on defeat; fight behavior/flow remains covered by the pre-existing polish/hardening specs.
  - Screenshots reviewed at 1x and 2x zoom: walker reads as an imposing mech; boss bar, telegraph box, and plasma orbs all visible mid-fight.
- Visual quality notes:
  - Every combat actor in Level 1 is now sprite-based (player, 4 enemy kinds, boss, projectiles, pickups).
  - Boss is intentionally single-pose; leg animation/pattern-specific poses are future polish, not required by the task.
- Status after: DONE
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-007 - Build Level 2 as a complete second stage with stronger visual identity
- Blockers (if any):
  - none

---

### 2026-07-25 13:40 - TASK-007

- Status before: TODO
- Goal of this iteration:
  Give Level 2 its own industrial-fortress visual identity, distinct from Level 1's dusk jungle, on top of its existing complete layout.
- Work completed:
  - Audited: Level 2 (fortress-interior) already had its own layout (pit + moving platforms, trigger-gated door, hazards), 3 enemy waves, pickups, 3 checkpoints, and the Reactor Warden arena - all e2e-covered. The gap was identity: it inherited the jungle theme (night sky, trees, grass).
  - Authored 9 fortress sprites: metal deck tile, grate platform tile, interior wall tile, pipes band, machine + I-beam column silhouettes, hazard barrel + metal crate props, security blast door; plus a murky interior gradient (new texture, key extracted to pure `src/art/textureKeys.ts` so levelTheme stays Phaser-free).
  - Extended the theme system (`src/art/levelTheme.ts`): sky key, star toggle, configurable mid band (ridge vs wall), optional pipes band, per-theme horizon/prop/tile keys; `themeForLevel('fortress-interior')` returns the new FORTRESS_THEME.
  - LevelScene renders the themed layer stack per level; doors now use the blast-door sprite (open-state alpha kept), moving platforms use themed grate tiles with world-tracked tile offsets.
  - Contrast pass after screenshot review: lighter deck vs darker wall for floor/wall separation, brighter horizon silhouettes (alpha 0.75), brighter barrel.
  - Fixed a latent e2e race exposed by the richer scene: polish.spec's muzzle-particle assertion could let real-time steps expire the ~5-step muzzle ttl between evaluates; input + advanceSteps now run in one atomic evaluate.
- Files changed:
  - src/art/sprites.ts, src/art/textures.ts, src/art/textureKeys.ts (new), src/art/levelTheme.ts
  - src/scenes/LevelScene.ts
  - tests/unit/levelTheme.test.ts (rewritten for the expanded theme system)
  - tests/e2e/level2Visuals.spec.ts (new), tests/e2e/polish.spec.ts (determinism fix)
  - scripts/level2-check.mjs (new)
- Assets added or updated:
  - `art/tile-metal`, `art/tile-grate`, `art/tile-wall`, `art/bg-pipes`, `art/bg-machine`, `art/bg-column`, `art/prop-barrel`, `art/prop-crate-metal`, `art/door-security`, `art/bg-sky-fortress`.
- Commands run:
  - `npx vitest run tests/unit/levelTheme.test.ts tests/unit/sprites.test.ts` (17 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (188 passed, 37 files)
  - `npm run build` (pass)
  - `npx playwright test` (32 passed, incl. new level2Visuals spec)
  - `node scripts/level2-check.mjs`
- Verification result:
  - All checks pass: lint, typecheck, 188 unit tests, build, 32 e2e tests.
  - e2e `level2Visuals.spec.ts` asserts metal deck, wall band, pipes, grate platforms, blast door, machinery silhouettes, and zero jungle textures in Level 2.
  - Screenshots reviewed at start/pit/door/arena: industrial interior clearly distinct from Level 1's jungle; combat readable after the contrast pass.
- Visual quality notes:
  - Level 2 is now fully representational: paneled walls, pipe runs, machinery, metal deck, security door, themed platforms.
  - The Reactor Warden boss is still a rectangle - deferred to TASK-008 (final boss pass).
- Status after: DONE
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-008 - Implement final boss and full game completion flow
- Blockers (if any):
  - none

---

### 2026-07-26 12:30 - TASK-008

- Status before: TODO
- Goal of this iteration:
  Give the Reactor Warden its final-boss visual identity and prove the full title-to-ending completion flow.
- Work completed:
  - Audited: the Reactor Warden already existed with 2 phases gated by destructible subcomponents, burst/charge patterns, and the MISSION COMPLETE results flow. The gaps: it rendered as a rectangle, its subcomponents as mint squares, and no end-to-end completion test existed.
  - Authored the Reactor Warden sprite (69x72 stretched to the 72x72 hitbox): armored housing with amber warning band, glowing cyan reactor core chamber, vented skirt, bolted plinth base; plus the octagonal shield-emitter subcomponent node sprite (18x18).
  - Added pure `bossTexture(id)` mapping (`src/art/bossArt.ts`) with unit tests; LevelScene now renders both bosses as sprites (facing flip, vulnerable tint) and removed the rectangle fallback entirely; subcomponents render as emitter nodes.
  - New e2e `fullGame.spec.ts`: title -> Enter -> Level 1 -> defeat Siege Walker -> exit -> results (final=false) -> Enter -> Level 2 -> defeat Reactor Warden -> exit -> MISSION COMPLETE (final=true) -> Enter -> title, with real key input for transitions.
  - Repaired a mid-task file truncation self-inflicted via a script (missing `];` anchor) - recovered the sprite sheet tail and re-verified with the art test suite (25/25).
- Files changed:
  - src/art/sprites.ts, src/art/bossArt.ts (new)
  - src/scenes/LevelScene.ts
  - tests/unit/bossArt.test.ts (new), tests/e2e/fullGame.spec.ts (new)
  - scripts/warden-check.mjs (new)
- Assets added or updated:
  - `art/boss-reactor-warden`, `art/subcomponent-node`.
- Commands run:
  - `npx vitest run tests/unit/bossArt.test.ts tests/unit/sprites.test.ts ...` (25 art tests passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (190 passed, 38 files)
  - `npm run build` (pass)
  - `npx playwright test` (33 passed, incl. new fullGame spec)
  - `node scripts/warden-check.mjs`
- Verification result:
  - All checks pass: lint, typecheck, 190 unit tests, build, 33 e2e tests.
  - e2e `fullGame.spec.ts` completes the whole game from title to MISSION COMPLETE and back.
  - Screenshots reviewed at 1x and 2x zoom: warden reads as a fortress core installation (reactor glow, housing, plinth, floating emitter nodes), clearly distinct from the Siege Walker.
- Visual quality notes:
  - Every actor and boss in the game is now sprite-based; no rectangles remain in combat presentation.
  - Boss is single-pose like the walker; pattern-specific poses remain future polish.
- Status after: DONE
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-009 - Implement HUD, pause, game over, local save, and polish
- Blockers (if any):
  - none

---

### 2026-07-26 13:10 - TASK-009

- Status before: TODO
- Goal of this iteration:
  Finish the user-facing loop with a HUD that is visually coherent with the pixel-art presentation, and verify the remaining flow criteria.
- Work completed:
  - Audited: pause/resume (smoke/input e2e), game over + restart R/T (level2.spec), high-score and settings persistence (settings.spec) all existed and were covered. The HUD itself was a single plain text line, and world objects could overlap it (creation-order rendering).
  - Rebuilt the HUD: life count as commando-helmet icons (new `art/ui-life` sprite), current weapon shown as its projectile sprite + name, right-aligned score readout, small version label, boss name plate above the boss health bar (uses the boss def names).
  - Set explicit depths (HUD 100, overlays 110) so pooled world sprites created during render can never cover the interface.
  - New e2e `hud.spec.ts`: 3 life icons at start, icon+name follow the scatter pickup, a life icon disappears after a pit death, and the SIEGE WALKER name plate appears with the boss bar.
- Files changed:
  - src/art/sprites.ts (art/ui-life)
  - src/scenes/LevelScene.ts (HUD restructure + depths)
  - tests/e2e/hud.spec.ts (new)
  - scripts/hud-check.mjs (new)
- Assets added or updated:
  - `art/ui-life` helmet icon.
- Commands run:
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (190 passed, 38 files)
  - `npm run build` (pass)
  - `npx playwright test` (34 passed, incl. new hud spec)
  - `node scripts/hud-check.mjs`
- Verification result:
  - All checks pass: lint, typecheck, 190 unit tests, build, 34 e2e tests.
  - Screenshots reviewed: helmet icons + weapon readout top-left, score top-right, SIEGE WALKER name plate with boss bar - readable and coherent with the game.
- Visual quality notes:
  - The whole game presentation is now sprite-driven: actors, terrain, pickups, bosses, and HUD icons; only effects (particles) and UI strokes remain primitives, which is appropriate.
  - Horizon silhouettes currently read as faint haze; acceptable depth cue, could be tuned in the TASK-011 polish pass if desired.
- Status after: DONE
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-010 - Add touch/gamepad support and responsive presentation
- Blockers (if any):
  - none

---

### 2026-07-26 13:50 - TASK-010

- Status before: TODO
- Goal of this iteration:
  Close the remaining device-accessibility gaps and verify the responsive presentation.
- Work completed:
  - Audited: in-game gamepad (input.spec fake-pad), touch buttons (responsive.spec phone viewport), 16:9 scaling at 3 viewports (responsive.spec), and keyboard reliability (TASK-002 listener-leak fix) were all in place. The real gap: menus were keyboard-only - a gamepad or touch user could not start the game, continue after results, or restart after game over.
  - Added `backEdge()` (Back/Select button 8) to the gamepad adapter with a TDD unit test.
  - Added `attachMenuConfirm(scene, onConfirm, {onBack})` (`src/input/menuConfirm.ts`): keyboard Enter/Space, tap/click, and gamepad A/X/Start to confirm, Escape/Back for the secondary action; returns a detach wired into the existing hookShutdown lifecycle.
  - Wired Title (start), Results (continue), GameOver (restart / Back->title), and Help (back); updated the help screen with a MENUS section documenting the confirm/back controls.
  - New e2e `menuControls.spec.ts`: gamepad A starts the game, tap starts and restarts after game over, gamepad Back returns to title - all without keyboard input.
- Files changed:
  - src/input/GamepadInput.ts (backEdge), src/input/menuConfirm.ts (new)
  - src/scenes/TitleScene.ts, ResultsScene.ts, GameOverScene.ts, HelpScene.ts
  - tests/unit/gamepad.test.ts, tests/e2e/menuControls.spec.ts (new)
- Assets added or updated:
  - none (input/UI only).
- Commands run:
  - `npx vitest run tests/unit/gamepad.test.ts` (RED then GREEN, 6 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (191 passed, 38 files)
  - `npm run build` (pass)
  - `npx playwright test` (37 passed, incl. 3 new menuControls specs)
- Verification result:
  - All checks pass: lint, typecheck, 191 unit tests, build, 37 e2e tests.
  - Menus are now fully navigable by keyboard, touch, and gamepad; keyboard-only e2e flows (fullGame etc.) remain green, confirming no input regressions.
- Visual quality notes:
  - Help screen documents all three input methods plus menu controls.
- Status after: DONE
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-011 - Final quality pass and deployment readiness
- Blockers (if any):
  - none

---

### 2026-07-26 14:10 - TASK-011

- Status before: TODO
- Goal of this iteration:
  Final release gate: verify every command, audit the static build output, confirm no placeholder art remains, and finish release documentation.
- Work completed:
  - Ran the full verification suite fresh: `npm run lint` (pass), `npm run typecheck` (pass), `npm run test:unit` (191 passed, 38 files), `npm run build` (pass; the >500 kB chunk notice is informational - Phaser bundle size, not an error), `npm run test:e2e` (37 passed).
  - Audited `dist/`: index.html + hashed JS bundle + favicon, 1.5 MB total, relative `./assets/` paths (vite base './'), no backend dependency - suitable for static hosting anywhere, including Cloudflare Pages.
  - Final visual audit (`scripts/final-audit.mjs`): captured title, help, prototype room, Level 1 exploration/combat/boss, Level 2 exploration/boss, game over, and MISSION COMPLETE screens - zero page errors, no placeholder blocks anywhere; characters, weapons, enemies, bosses, and scenes are all recognizable sprite art.
  - Rewrote README.md as the actual game README: play instructions, full control table (keyboard/gamepad/touch), game content, dev commands, project layout, deployment notes, and the original-assets policy.
- Files changed:
  - README.md (rewritten for the game)
  - scripts/final-audit.mjs (new)
- Assets added or updated:
  - none.
- Commands run:
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (191 passed)
  - `npm run build` (pass)
  - `npm run test:e2e` (37 passed)
  - `node scripts/final-audit.mjs` (10 screens, 0 page errors)
- Verification result:
  - Every acceptance criterion verified with evidence above.
- Visual quality notes:
  - The game presents a coherent original pixel-art identity end to end: dusk jungle (L1), industrial fortress (L2), four enemy archetypes, two detailed bosses, weapon-distinct projectiles, and icon-based HUD.
- Status after: DONE
- Remaining work:
  - Core release task list complete (TASK-001 through TASK-011 all DONE).
  - Optional: manual deployment to Cloudflare Pages (user action; loop rules prohibit deploys).
  - Enhancement ideas for the future-enhancements section: boss leg/pattern animations, richer title art, additional weapon, gameplay balance pass.
- Next recommended task:
  - none - core release complete; add enhancement tasks to TASKS.md if desired.
- Blockers (if any):
  - none

---

### 2026-07-26 15:05 - TASK-012 (+ enhancement backlog added)

- Status before: TODO (task created this iteration from a user enhancement request)
- Goal of this iteration:
  Record the four requested enhancements as bounded tasks, then rebind the
  keyboard to a classic PC run-and-gun layout so the game is comfortable to
  play on a PC.
- Work completed:
  - Added TASK-012 through TASK-015 to the Future enhancements section with
    bounded requirements, objective acceptance criteria, and non-goals:
    012 PC control layout, 013 diagonal firing usability, 014 selectable
    starting lives (3 / 30), 015 classic arcade feel pass.
  - Researched the genre convention before choosing bindings: NES-emulator
    defaults and retro PC platformers (Cave Story, Celeste) put direction on
    the arrow cluster (right hand) and the face buttons on Z/X (left hand),
    with Z = A = jump and X = B = shoot. Confirmed the ordering with the user.
  - Root-caused the diagonal-aim complaint: the aim math already produced
    -45/-135/45/135, but `aimUp` was bound to the jump key, so aiming up made
    the player jump. Aim-up now has its own key.
  - Refactored `KeyboardInput` into pure, unit-testable pieces
    (`resolveKeyAction`, `buildInputFromRaw`, `createRawKeyState`) with a thin
    DOM adapter over them; the raw state gained a dedicated `up` field.
  - New layout: Arrows move/aim-up/crouch, Z jump, X fire. Aliases retained so
    nothing regresses: WASD move/aim, Space jump, J/K/Enter fire.
  - Updated the help screen (now documents diagonals explicitly), the in-level
    hint, the prototype-room hint, and the README control table.
- Files changed:
  - TASKS.md (4 new tasks), src/input/KeyboardInput.ts (refactor + rebind)
  - src/scenes/HelpScene.ts, LevelScene.ts, SandboxScene.ts, README.md
  - tests/unit/keyboard.test.ts (new), scripts/controls-check.mjs (new)
- Assets added or updated:
  - none (input/text only).
- Commands run:
  - `npx vitest run tests/unit/keyboard.test.ts` (RED 10 failures -> GREEN 10 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (201 passed, 39 files)
  - `npm run build` (pass)
  - `npx playwright test` (37 passed, unchanged)
  - `node scripts/controls-check.mjs` (live real-key verification)
- Verification result:
  - All checks pass: lint, typecheck, 201 unit tests, build, 37 e2e tests.
  - Live key verification: ArrowRight moved 60 -> 129.67; ArrowUp kept
    `grounded: true` with the `aim-up` pose (the old jump bug is gone); Z left
    the ground; X fired at angle 0; Up+Right+X fired at -45 with the
    `aim-diag` pose; Up+X fired at -90. Zero page errors.
  - Existing e2e specs needed no changes: they drive the debug input bridge,
    and the only raw keys they press (`s`, `ArrowRight`) map as before.
- Visual quality notes:
  - Screenshot `controls-diagonal.png` shows the bolt climbing at 45 degrees
    from the muzzle with the diagonal aim pose - the feature is now reachable.
- Status after: DONE
- Remaining work:
  - TASK-013 is now mostly satisfied incidentally (up-right diagonal, pose, and
    projectile rotation all verified live). What remains for it: verify up-left
    (-135) and the airborne down diagonals (45/135), and add e2e coverage
    asserting all four angles through real key input.
- Next recommended task:
  - TASK-013 - Make 45-degree diagonal firing fully usable from the keyboard
- Blockers (if any):
  - TASK-015 carries an open question (difficulty direction) recorded in the
    task; answer it before that task is started.

---

### 2026-07-26 15:45 - TASK-012 (completed; TASK-013 merged in)

- Status before: DONE for the rebinding half, with the diagonal-firing half
  outstanding. Per user request, the former TASK-013 was merged into TASK-012
  and TASK-013 removed from the list; TASK-014/015 keep their ids so history
  references stay valid.
- Goal of this iteration:
  Finish the merged task: prove all eight fire directions work with the real PC
  bindings, and surface the control scheme on the title screen.
- Work completed:
  - Merged TASK-013's requirement and criteria into TASK-012 and deleted the
    separate task, restating the requirement to cover layout + diagonals + the
    title-screen discoverability the user asked for.
  - New e2e `keyboardAim.spec.ts` (4 tests) covering every aim angle through
    real key presses: forward 0, straight up -90, up-diagonals -45/-135,
    airborne straight down 90, down-diagonals 45/135, grounded-Down staying
    crouch-fire forward, and projectile rotation matching the flight vector.
    Real keys drive the bindings while `advanceSteps` drives the clock, so the
    short airborne window is deterministic rather than wall-clock dependent.
  - Debug finding: the first airborne draft packed three shots into one jump -
    38 sim steps (0.63s) against a ~0.69s airtime and a 0.22s pulse cooldown,
    so the player landed mid-test. Restructured to one jump per shot via an
    `airborneShot` helper; also documents why Down is pressed only after
    leaving the ground (crouching blocks a jump).
  - Title screen: added a framed KEYBOARD card listing the primary bindings
    (arrows / Z / X / diagonal combo) with key names highlighted, an alias line
    beneath it, and relabelled the menu hint to "H - FULL CONTROLS & HELP" so
    the deeper help screen is an obvious link. Repositioned the start prompt to
    make room.
  - Layout fix after screenshot review: the alias line originally sat on the
    panel border and the two-bindings-per-row layout read unevenly; switched to
    five single-binding rows and moved the alias line below the frame.
- Files changed:
  - TASKS.md (merge + completion), src/scenes/TitleScene.ts (controls card)
  - tests/e2e/keyboardAim.spec.ts (new), scripts/controls-check.mjs (title capture)
- Assets added or updated:
  - none (UI text/layout only).
- Commands run:
  - `npx playwright test tests/e2e/keyboardAim.spec.ts` (1 failure diagnosed, then 4 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (201 passed, 39 files)
  - `npm run build` (pass)
  - `npx playwright test` (41 passed, up from 37)
  - `node scripts/controls-check.mjs` (live key checks + title capture)
- Verification result:
  - All checks pass: lint, typecheck, 201 unit tests, build, 41 e2e tests.
  - All eight directions asserted from real key presses; live check reconfirmed
    ArrowUp aims without jumping and Up+Right+X fires at -45.
  - `title-controls.png` reviewed: the controls card is centred, aligned, and
    free of overlaps.
- Visual quality notes:
  - A new player now sees the exact keys on the front page before starting, with
    the full three-device reference one key (H) away.
- Status after: DONE
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-014 - Selectable starting lives (3 default, 30 practice option)
- Blockers (if any):
  - TASK-015 still carries the open difficulty-direction question.

---

### 2026-07-26 16:30 - DEPLOYMENT (not a TASKS.md task)

- Status before: release-ready but never deployed.
- Goal of this iteration:
  Deploy the built game to Cloudflare Pages at the user's explicit request.
- Authorization note:
  `CLAUDE.md` and `.claude/loop.md` both forbid deploying ("Never push, deploy,
  change cloud resources, or modify DNS"). The user was shown that conflict and
  explicitly authorized the override for this action only. The repo rules were
  left unchanged - this was a one-off, not a policy change. No credentials were
  requested, printed, or stored at any point.
- Work completed:
  - Audited prerequisites first: no `wrangler.*` config, wrangler absent from
    package.json, no `CLOUDFLARE_*` env vars set, but `wrangler whoami` showed
    an existing OAuth session (xmiao76@gmail.com, single account) carrying
    `pages (write)`. So nothing secret was needed from the user.
  - Chose direct upload over Git integration: it deploys the local `dist/`
    without pushing the repository, keeping the "never push" rule intact.
  - Rebuilt `dist/` fresh and confirmed the new title controls card was bundled
    before uploading.
  - Created Pages project `run-and-gun` with `--production-branch main`
    explicitly (rather than letting `pages deploy` prompt), because the shell
    here is non-interactive and a prompt would hang.
  - Deployed `dist/` (3 files) to production.
  - Added `npm run deploy` and wrangler as a devDependency so future deploys are
    one reproducible command; documented the flow and the no-token rule in the
    README, plus the live URL.
  - Added `scripts/live-check.mjs`, a post-deploy smoke test that runs against
    the real URL.
- Files changed:
  - README.md (live URL + deployment section), package.json (deploy script,
    wrangler devDependency), package-lock.json, eslint.config.js (process
    global for scripts), scripts/live-check.mjs (new)
- Commands run:
  - `npx wrangler whoami` (auth/scope audit)
  - `npm run build`
  - `npx wrangler pages project create run-and-gun --production-branch main`
  - `npx wrangler pages deploy dist --project-name run-and-gun --branch main`
  - `curl` checks on both URLs and the hashed asset
  - `node scripts/live-check.mjs`
  - `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build`,
    `npx playwright test`
- Verification result:
  - Live at https://run-and-gun.pages.dev - HTTP 200, and the referenced
    bundle `assets/index-LAkaBjbK.js` serves 1,488,224 bytes.
  - `live-check.mjs` PASSED against the live site: plain visitor load renders a
    960x540 canvas with document title "Operation Iron Echo" and zero page or
    console errors; then Enter started Level 1, ArrowRight moved the player to
    x=139.17, Up+X fired at -90 (confirming the new bindings work on the
    deployed build), and the Siege Walker boss activated. Zero page errors.
  - Local suite still green after the dependency change: lint, typecheck, 201
    unit tests, build, 41 e2e tests.
  - The per-deployment hash URL did not resolve from this shell (HTTP 000);
    the canonical production URL is the supported entry point and works.
- Status after: deployed to production.
- Remaining work:
  - Redeploy with `npm run deploy` after future enhancement tasks land.
- Next recommended task:
  - TASK-014 - Selectable starting lives (3 default, 30 practice option)
- Blockers (if any):
  - none

---

### 2026-07-27 10:30 - TASK-014

- Status before: TODO
- Goal of this iteration:
  Let the player choose the starting life count, defaulting to 3 with a 30-life
  practice option, persisted and honoured by a new run.
- Work completed:
  - Schema: added `startingLives` with `STARTING_LIVES_OPTIONS = [3, 5, 10, 30]`
    and a pure `nextStartingLives` cycler. Validation accepts only offered
    values, so anything corrupt, fractional, negative, or absurd (999) falls
    back to 3 - a membership check rather than a range check, which also blocks
    plausible-looking but unsupported numbers.
  - Settings screen: a fifth row, `L` to cycle, persisted through the existing
    validated storage service on every change; row spacing and the key legend
    were re-laid out to fit.
  - LevelScene seeds the run and the initial checkpoint snapshot from
    `settings.startingLives` instead of the `MAX_LIVES` constant.
  - Ordering bug found and fixed while wiring it: `create()` called `resetRun()`
    at line 295 but only loaded settings at line 378, so a run would always have
    started on the default 3 lives regardless of the setting. Settings are now
    read before `resetRun()`.
  - HUD: extracted a pure `lifeHudLayout` (`src/ui/hudLives.ts`). Up to
    MAX_LIFE_ICONS (5) it draws one icon per life; beyond that it collapses to a
    single icon plus an `xN` label, satisfying the task's "count rather than 30
    icons" constraint.
  - Second layout bug caught by screenshot review, not by tests: at the 5-life
    option the icon row (x=14..90) would have overlapped the weapon icon at
    x=72. The life row now reserves fixed space for its worst case and the
    weapon readout is positioned after it.
- Files changed:
  - src/persistence/schema.ts, src/ui/hudLives.ts (new)
  - src/scenes/SettingsScene.ts, src/scenes/LevelScene.ts
  - tests/unit/settings.test.ts (+6 cases), tests/unit/hudLives.test.ts (new)
  - tests/e2e/startingLives.spec.ts (new), scripts/lives-check.mjs (new)
  - README.md (settings/lives note)
- Assets added or updated:
  - none (reuses the existing `art/ui-life` helmet icon).
- Commands run:
  - `npx vitest run tests/unit/settings.test.ts` (RED 6 failures -> GREEN 14 passed)
  - `npx vitest run tests/unit/hudLives.test.ts` (4 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (216 passed, 40 files)
  - `npm run build` (pass)
  - `npx playwright test` (60 passed, chromium + msedge)
  - `node scripts/lives-check.mjs` (settings + HUD captured at 3/5/10/30)
- Verification result:
  - All checks pass: lint, typecheck, 216 unit tests, build, 60 e2e tests.
  - e2e `startingLives.spec.ts` covers the default (3 lives, 3 icons), selecting
    30 and surviving a full page reload, a new run starting at 30 with the HUD
    showing `x30` and a single icon, a death decrementing to 29 (proving the run
    honours the configured count rather than 3), and a corrupt stored value
    (`startingLives: 999`) falling back to 3.
  - Screenshots confirm every offered option renders cleanly: 3 and 5 as icon
    rows, 10 and 30 collapsed to `x10`/`x30`, with no HUD overlap at 5.
- Visual quality notes:
  - The life row stays compact at every option and the weapon readout no longer
    shares its space.
- Status after: DONE
- Remaining work:
  - none for this task. Not deployed this iteration (loop rules forbid it); run
    `npm run deploy` to publish.
- Next recommended task:
  - TASK-015 - Classic arcade feel pass
- Blockers (if any):
  - TASK-015 still carries its open question: should difficulty rise overall, or
    stay approachable with only pacing and feedback improved? It needs answering
    before that task starts.

---

### 2026-07-27 11:40 - TASK-015

- Status before: TODO, carrying an open question about difficulty direction.
- Decision on the open question:
  Rather than block a third iteration with nothing delivered, this was built to
  the default already recorded in the task: improve pacing and feedback, leave
  difficulty roughly unchanged. Loop rule 4 asks for BLOCKED only when the
  acceptance criteria are unclear, and they were concrete and testable; the
  unanswered question affected magnitude, not testability. Enemy health, speed,
  fire rates, telegraph durations, and player damage were all left untouched, so
  the work is low-regret if a harder pass is wanted later - the levers are
  isolated in `src/balance/enemies.ts` and `bosses.ts`, and that is now recorded
  in the task itself.
- Work completed:
  - Physics retune (`src/balance/player.ts`): MOVE_SPEED 190 -> 215, and
    JUMP_VELOCITY -520 -> -560 with GRAVITY 1500 -> 1750. The jump pair was
    chosen so peak height is preserved: 560^2/(2*1750) = 89.6px against the old
    520^2/(2*1500) = 90.1px, so every platform stays exactly as reachable while
    airtime drops 0.69s -> 0.64s. Horizontal reach per jump actually rises
    (215*0.64 = 138px vs 190*0.69 = 132px), so pits got no harder. The reasoning
    is recorded in the file next to the values.
  - Spread weapon (`src/balance/weapons.ts`): scatter fan widened from +/-12 to
    +/-24 degrees. Pellet count and damage deliberately unchanged, so this is a
    readability change rather than a power change - and every scatter assertion
    derives from `spreadAngles.length`, so nothing needed updating.
  - Denser encounters: one extra defender per wave in both levels (Level 1 now
    3/3/4, Level 2 3/3/4). Each added position was placed on a verified solid
    ground segment and clear of the trigger line so the spawn-safety margin
    still admits it.
  - Combat feedback: new pure `src/ui/screenShake.ts` maps four events
    (bossHit < explosion < playerDeath < bossDefeat) to escalating shake specs
    and returns null under reduced-flash, wired into LevelScene at those four
    moments. Shake is motion rather than colour, but it is suppressed entirely
    for reduced-flash users, which is the conservative reading of that setting.
- Files changed:
  - src/balance/player.ts, src/balance/weapons.ts
  - src/levels/level1.ts, src/levels/level2.ts
  - src/ui/screenShake.ts (new), src/scenes/LevelScene.ts
  - tests/unit/screenShake.test.ts (new), tests/e2e/arcadeFeel.spec.ts (new)
  - scripts/arcade-feel-check.mjs (new)
- Commands run:
  - `npx vitest run tests/unit/screenShake.test.ts` (4 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (220 passed, 41 files)
  - `npm run build` (pass)
  - `npx playwright test` (63 passed, chromium + msedge)
  - `npx playwright test tests/e2e/soak.spec.ts` and `fullGame.spec.ts`
  - `node scripts/arcade-feel-check.mjs`
- Verification result:
  - All checks pass: lint, typecheck, 220 unit tests, build, 63 e2e tests.
  - Completability: `fullGame.spec.ts` still green end to end, and a targeted
    probe confirmed the retuned jump still clears the first pit - running at the
    720-840 pit and jumping at the edge ended at x=907 with all 3 lives intact.
  - Soak: still bounded and heap-flat after the density increase
    (`maxEnemies=3`, `maxPlayerBullets=1`, `maxEnemyBullets=2` against a cap of
    12; heapBefore == heapAfter).
  - Live probes: wave 1 now fields 3 (was 2); camera shake confirmed running
    after a player death and confirmed NOT running with reducedFlash=true;
    scatter pellets measured at -24/0/+24 degrees.
  - Screenshot `feel-scatter-fan.png` shows the three pellets visibly fanning.
- Two probe artifacts worth recording (neither a product defect):
  - The first scatter measurement returned a single pellet because it sampled
    the display list straight after `advanceSteps`, which drives the simulation
    without a render pass. This is the same trap that bit the Edge run of
    `keyboardAim`; the check script now waits for real frames and says why.
  - A first traversal probe reported lives=0, but it was holding right and
    jumping on a blind fixed cadence, so it walked into the pit. Replaced with a
    deliberate jump-at-the-edge crossing, which passes.
- Status after: DONE
- Remaining work:
  - Every task in TASKS.md is now DONE. Not deployed this iteration (loop rules
    forbid it); run `npm run deploy` to publish.
  - Optional follow-up if a harder difficulty is wanted: raise the values in
    `src/balance/enemies.ts` / `bosses.ts` as noted in TASK-015.
- Next recommended task:
  - none - the list is complete. Add further enhancements to TASKS.md to
    continue the loop.
- Blockers (if any):
  - none

---

### 2026-07-27 12:25 - TASK-014 revised: 30 lives is now the default

- Status before: DONE with 3 as the default.
- Goal of this iteration:
  Change the default starting lives from 3 to 30 on request, and update the task
  to match.
- Work completed:
  - TASK-014 retitled and its requirement/criteria rewritten: 30 is the default,
    3 remains selectable, corrupt values fall back to the default, and a new
    constraint was added - tests must not hardcode the default.
  - `DEFAULT_SETTINGS.startingLives` 3 -> 30. The option list stays [3, 5, 10, 30]
    so `L` cycles 30 -> 3 -> 5 -> 10, and validation still admits only offered
    values, so the fallback for corrupt data is now 30.
  - Rather than swap one magic number for another, the six e2e specs that
    depended on the old default were made independent of it, which is the reason
    this change touched so many files:
    - `level1`, `level2`, `menuControls` now assert against
      `DEFAULT_SETTINGS.startingLives` imported from src.
    - `level2`, `polish`, `playerAnim` now capture the run's life count first and
      assert the *change* (one life lost), which is what those tests actually
      care about.
    - `hud.spec` pins 3 lives via a new `tests/e2e/helpers/lives.ts` helper, so it
      keeps exercising the one-icon-per-life row; the collapsed high-count form
      stays covered by `startingLives.spec`.
    - `startingLives.spec` was inverted: the default case now asserts 30 with the
      collapsed `x30` HUD, and a second test selects the 3-life arcade run and
      checks it persists and yields a 3-icon row.
  - Caught while editing: a `livesAtStart` value was referenced inside a
    `page.waitForFunction` callback, which runs in the browser and cannot see
    Node variables. Passed it as an argument instead; it would have thrown a
    ReferenceError at runtime.
  - The helper file lives at `tests/e2e/helpers/lives.ts`; Playwright only
    collects `*.spec.ts`, so it is not picked up as a test.
- Files changed:
  - TASKS.md, README.md, src/persistence/schema.ts
  - tests/unit/settings.test.ts
  - tests/e2e/helpers/lives.ts (new), tests/e2e/startingLives.spec.ts,
    hud.spec.ts, level1.spec.ts, level2.spec.ts, menuControls.spec.ts,
    playerAnim.spec.ts, polish.spec.ts
- Commands run:
  - `npx vitest run tests/unit/settings.test.ts` (15 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (221 passed, 41 files)
  - `npm run build` (pass)
  - `npx playwright test` (63 passed, chromium + msedge)
  - `node scripts/lives-check.mjs`
- Verification result:
  - All checks pass: lint, typecheck, 221 unit tests, build, 63 e2e tests.
  - Live probe confirms a fresh profile starts at 30 and every option still
    applies (5 -> 5, 10 -> 10, 30 -> 30); `lives-hud-3.png` shows the fresh
    profile rendering as one icon plus `x30`.
  - Sandbox/prototype room is unaffected: it uses the `MAX_LIVES` constant (3),
    not the setting, and its spec still passes unchanged.
- Status after: DONE
- Remaining work:
  - Not deployed this iteration (loop rules forbid it); run `npm run deploy` to
    publish this together with TASK-015.
- Next recommended task:
  - none - the list is complete.
- Blockers (if any):
  - none

---

### 2026-07-26 19:20 - ROOT CAUSE CONFIRMED: extension stealing letter keys

- Status before: Z/X/S dead in the user's Edge; cause unconfirmed.
- Root cause (confirmed by the user via the `?keys=1` diagnostic):
  the **Global Speed** video-speed extension in Edge was consuming the keys.
  Disabling it restored S and X. That family of extensions binds bare letters
  (S slower, D faster, Z rewind, X advance), colliding with four of this game's
  bindings: S crouch, D right, Z jump, X fire. Extensions are per browser
  profile, which is exactly why Chrome worked and Edge did not on one machine.
  Nothing was wrong with the game's key mapping.
- Work completed:
  - Documented the whole diagnosis in the README as a "some keys do nothing"
    troubleshooting section: symptom, why it differs per browser, the confirmed
    Global Speed case, the `?keys=1` diagnostic with a table mapping each
    possible output to its cause and fix, and the alias-key workaround.
  - Added a short amber hint to the in-game help screen, where a stuck player
    actually looks, pointing at the alias keys and the diagnostic.
  - Real hardening, not just docs: moved the game's key listeners to the
    **capture phase on `window`**, which runs before any document-level
    listener in either phase. Extensions of this kind hook `document`, so the
    game now keeps working even with such an extension enabled. Applied to both
    the gameplay keys and the scene-level Esc/M/F keys.
  - Added `tests/e2e/extensionConflict.spec.ts`, which installs a simulated
    extension that claims S/D/Z/X on `document` in both phases and calls
    `stopImmediatePropagation`, then asserts fire, jump and crouch still work
    (and that the simulated extension really ran). Included in the msedge
    project so it is covered in both browsers.
  - Verified the new test is not vacuous: temporarily reverting the capture flag
    made both cases fail, and restoring it made them pass again.
- Honest limitation:
  capture-on-window defeats document-level interception, but an extension whose
  own listener also captures on `window` and registers first can still win. The
  `?keys=1` diagnostic remains the way to identify that, and the alias keys
  (Space jump, J/K/Enter fire) remain the escape hatch.
- Files changed:
  - README.md (troubleshooting section), src/scenes/HelpScene.ts (in-game hint)
  - src/input/KeyboardInput.ts, src/scenes/LevelScene.ts (capture phase)
  - tests/e2e/extensionConflict.spec.ts (new), playwright.config.ts (msedge scope)
- Verification result:
  - Local: lint, typecheck, 206 unit tests, build, 57 e2e tests
    (chromium + msedge), up from 53.
  - Simulated-extension test passes in both browsers; proven to fail without the
    capture-phase change.
  - Deployed; `live-check.mjs` PASSED against the live site.
  - Help screen re-captured and reviewed: the hint fits without overlapping.
- Status after: root cause confirmed, documented, and defended against.
- Next recommended task:
  - TASK-014 - Selectable starting lives (3 default, 30 practice option)
- Blockers (if any):
  - none

---

### 2026-07-26 18:40 - Z/X still dead in the user's Edge: IME hardening + input diagnostic

- Status before: user reported that after reloading, BOTH Z and X do nothing in
  their Edge (previously only X was mentioned).
- Investigation:
  - Confirmed the live bundle is the fixed one: it contains the focus-recovery
    marker and both `KeyZ`/`KeyX` bindings, and its hash matches the local
    `dist/`. So the deployed code is correct and the fault is specific to that
    machine's Edge session - meaning further blind guessing was not going to
    close this.
  - Found a regression I had introduced in the previous iteration: the
    `if (event.isComposing) return;` guard actively DROPS key events. If an IME
    (e.g. Microsoft Pinyin) is active in Edge, letter keys arrive flagged as
    composing while arrow keys do not - which matches "Z and X dead, arrows
    fine" precisely. That guard made the reported symptom more likely, not less.
- Work completed:
  - Removed the composing early-return. Resolution is now by physical `code`
    first, which is layout- and IME-independent; this game has no text fields,
    so a composing IME must never make the controls dead.
  - Added a legacy `keyCode` fallback as the last resort, for IME events that
    arrive with an empty `code` and `key === 'Process'` - in that state
    `keyCode` is the only surviving identity of the physical key.
    Resolution order is now code -> character -> keyCode.
  - Added `src/debug/keyOverlay.ts`, an opt-in diagnostic at `?keys=1`. It
    lists every keydown/keyup with `code`, `key`, `keyCode`, `isComposing` and
    the action the game resolved it to, plus scene/paused/autoPaused, focus
    state, and explicit notices for `compositionstart` (IME) and window
    blur/focus. Deliberately plain DOM rather than a Phaser scene so it still
    reports when the game loop or renderer is itself the broken thing, and
    registered in the capture phase so anything the game stops is still shown.
- Files changed:
  - src/input/KeyboardInput.ts (drop composing guard, keyCode fallback)
  - src/debug/keyOverlay.ts (new), src/main.ts (install when `?keys=1`)
  - tests/unit/keyboard.test.ts (+2 cases: keyCode fallback, unmapped keyCode)
  - scripts/overlay-check.mjs (new)
- Verification result:
  - Local: lint, typecheck, 206 unit tests, build, 53 e2e (chromium + msedge).
  - `overlay-check.mjs` against the live site classifies correctly:
    `KeyZ -> jump`, `KeyX -> fire`, `ArrowRight -> right`, `KeyQ -> IGNORED`.
  - `live-check.mjs` PASSED (headers + gameplay + boss).
  - Note: the first live overlay check failed on visibility; re-checking showed
    the element attaches in 1.28s and is visible with a real bounding box, so
    that was Cloudflare edge propagation lag right after deploy, not a defect.
- Status after: hardened and deployed; awaiting the diagnostic output from the
  affected machine to identify the remaining cause.
- Remaining work:
  - The user should open `https://run-and-gun.pages.dev/?keys=1&debug=1` in the
    affected Edge and report what the overlay shows when pressing Z and X. The
    three outcomes are decisive: no rows at all = the browser/extension is
    swallowing the key before the page; rows with `composing=true` or
    `key=Process` = IME (now handled by the keyCode fallback); rows resolving to
    jump/fire while nothing happens in game = the fault is in the game state,
    not input.
- Next recommended task:
  - TASK-014 - Selectable starting lives (3 default, 30 practice option)
- Blockers (if any):
  - Root cause on the affected machine is still unconfirmed; the diagnostic
    exists specifically to resolve that.

---

### 2026-07-26 17:55 - CACHE POLICY: deploys apply without a hard reload

- Status before: users were being told to hard-reload after a deploy.
- Goal of this iteration:
  Remove the need for a hard reload, and stop guessing about caching by
  measuring the real response headers.
- Investigation:
  - Measured the live headers instead of assuming. `index.html` was already
    `public, max-age=0, must-revalidate`, so a plain reload always picked up a
    new deploy - the hard-reload advice given to the user was over-cautious and
    is now retracted.
  - The same measurement exposed a real performance miss: the content-hashed
    1.49 MB bundle was also `max-age=0, must-revalidate`, so every single load
    paid a revalidation round trip for bytes that can never change.
- Work completed:
  - Added `public/_headers` (Vite copies it to `dist/`, Cloudflare Pages applies
    it): the stable-named entry point revalidates every load, while
    `assets/*.js` / `assets/*.css` are `immutable` for a year. Scoped by
    extension on purpose so stable-named files under `assets/images/` are not
    frozen for a year - a trap a blanket `/assets/*` rule would have set.
  - `scripts/live-check.mjs` now asserts both headers, so the policy cannot
    silently regress on a future deploy.
  - Added `scripts/reload-check.mjs`, which proves the behaviour in a real
    browser rather than arguing from headers alone.
  - Documented the policy and the reasoning in the README.
  - Fixed a genuine test-robustness bug surfaced by the new Edge project:
    `keyboardAim`'s projectile-rotation check sampled the display list right
    after `advanceSteps`, but that command drives the simulation without a
    render pass, so the sprite pool had not necessarily synced. It passed in
    Chromium and failed in Edge purely on timing. Now polls for the rendered
    sprite; verified stable over three consecutive Edge runs.
- Files changed:
  - public/_headers (new), scripts/live-check.mjs (header assertions),
    scripts/reload-check.mjs (new), tests/e2e/keyboardAim.spec.ts (render poll),
    eslint.config.js (fetch global), README.md (cache policy section)
- Verification result:
  - Live headers after deploy: `/` -> `max-age=0, must-revalidate`;
    `assets/index-<hash>.js` -> `max-age=31536000, immutable`;
    `assets/images/favicon.svg` -> still revalidating (not frozen).
  - `reload-check.mjs` in real Edge: on a plain reload with a warm cache the
    entry point still hit the network (status 200, not served blindly from
    cache), and the game loaded - so a deploy applies without Ctrl+F5.
  - `live-check.mjs` PASSED end to end (headers + gameplay + boss).
  - Local: lint, typecheck, 204 unit tests, build, 53 e2e (chromium + msedge).
- Status after: deployed; hard reload no longer required.
- Next recommended task:
  - TASK-014 - Selectable starting lives (3 default, 30 practice option)
- Blockers (if any):
  - none

---

### 2026-07-26 17:20 - BUGFIX: unresponsive input after the browser steals focus

- Status before: user reported "X shoots in Chrome but does nothing in Edge".
- Goal of this iteration:
  Reproduce and fix the reported cross-browser input failure.
- Investigation:
  - Could NOT reproduce a key-mapping fault in Edge. Drove real Microsoft Edge
    150 (Playwright `channel: 'msedge'`), headless and headed, on the plain
    production URL with a click-to-focus first: firing worked, and the page
    received `{code: 'KeyX', key: 'x', isComposing: false}` with zero errors.
    Screenshot `edge-firing.png` shows two bullets in flight. So `event.code`
    handling and the X binding were not the fault.
  - Re-examined the scene for state that differs between a clean automation
    profile and a real browsing session, and found the real defect: `blur`
    auto-paused the game and NOTHING resumed it. There was no `focus` or
    pointer listener - the only exits were Esc, gamepad Start, or the touch
    pause button. Edge steals window focus far more readily than Chrome
    (Copilot/sidebar, "Save password?" bubble, shopping popups, Drop,
    notification toasts), so in Edge the game silently pauses and every key,
    including X, stops responding. That matches the report exactly.
  - While writing the regression test, uncovered a SECOND real bug: the Esc
    pause toggle polled whether Esc was *held* (`isDown`) rather than consuming
    a keydown edge, so a quick tap that started and ended between two frames was
    dropped entirely. Never caught before because no test pressed a real Esc -
    the existing specs used the debug `pause`/`resume` commands or gamepad Start.
- Work completed:
  - Auto-pause is now distinguishable from a deliberate pause (`autoPaused`).
    Regaining window focus, or clicking/tapping the game, lifts an auto-pause;
    an explicit Esc pause is deliberately left alone so it still needs Esc.
  - The pause overlay now states the cause and the remedy: "LOST WINDOW FOCUS -
    CLICK THE GAME OR PRESS ESC TO RESUME".
  - Pause/mute/reduced-flash are edge-triggered via a consumed keydown set, so
    no quick tap is dropped; removed the now-dead polled fields and `isDown`.
  - Keyboard hardening: `resolveKeyAction` accepts the produced character as a
    fallback when the physical code is unrecognised (odd layouts), preferring
    the code when both are known; events with `isComposing` are ignored so an
    active IME cannot corrupt held-key state.
  - Published `autoPaused` in the runtime snapshot for test observability.
- Files changed:
  - src/scenes/LevelScene.ts (auto-pause recovery, edge-triggered toggles)
  - src/input/KeyboardInput.ts (character fallback, IME guard)
  - tests/unit/keyboard.test.ts (+4 cases), tests/e2e/focusResume.spec.ts (new)
  - playwright.config.ts (real `msedge` project over the input-critical specs)
  - eslint.config.js (script globals), scripts/edge-repro.mjs, scripts/edge-diag.mjs (new)
- Commands run:
  - `npx playwright install msedge`
  - `node scripts/edge-repro.mjs msedge` / `node scripts/edge-diag.mjs msedge`
  - `npx playwright test tests/e2e/focusResume.spec.ts` (3 failed -> diagnosed
    a stale preview server on 4173 serving the pre-fix bundle, killed it, then
    1 genuine failure exposing the dropped-Esc bug, then 3 passed)
  - `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build`
  - `npx playwright test` (53 passed across chromium + msedge)
  - `npm run deploy`, then `edge-repro.mjs` against the live URL in both browsers
- Verification result:
  - Local: lint, typecheck, 204 unit tests, build, and 53 e2e tests pass -
    the input-critical specs now run in real Edge as well as Chromium.
  - Live after deploy: fire/jump/move all OK in real Edge AND Chrome against
    https://run-and-gun.pages.dev, zero page errors in both.
- Visual quality notes:
  - An auto-paused game now explains itself instead of appearing frozen.
- Status after: fixed and deployed.
- Remaining work:
  - If the user still sees a dead X key, the next thing to capture is whether
    the PAUSED overlay is on screen (which would confirm this path) or whether
    an extension/IME is swallowing keydown entirely.
- Next recommended task:
  - TASK-014 - Selectable starting lives (3 default, 30 practice option)
- Blockers (if any):
  - none

---

### 2026-08-12 02:05 - TASK-016 (agent-drivable debug bridge) + TASK-017 (planned)

- Status before: all enhancement tasks DONE; no agent-facing automation refactor.
- Goal of this iteration:
  Let scripted tests and an external agent drive the game deterministically
  without screenshots. Land TASK-016 (typed runtime contract, race-free manual
  clock, shared GameDriver helper) and record TASK-017 (live-site suite, HTTP
  agent server, docs) for the next iteration.
- Work completed:
  - Added `src/debug/runtimeTypes.ts`: pure types (no Phaser) for every scene's
    runtime snapshot - `LevelRuntime`, `SandboxRuntime`, `ResultsRuntime`,
    `GameOverRuntime`, `SettingsRuntime`, `HelpRuntime` - plus the
    `RuntimeSnapshot` union and `DebugSnapshot`. The wire format stays flat and
    byte-identical; the union is enforced at the construction boundary so no
    existing spec needed any change.
  - Typed `reportRuntime(runtime: RuntimeSnapshot)` in `debugBridge.ts` and added
    `MAX_ADVANCE_STEPS` + `clampStepCount(payload)` so every scene clamps
    `advanceSteps` through one helper.
  - Added a race-free manual-clock mode. `manualClockRequested()` reads
    `?manualClock` under the debug gate; a `setManualClock` command toggles it at
    runtime. While active, `LevelScene.update()` and `SandboxScene.update()` skip
    the real-time tick/step and only render, so the simulation advances solely via
    `advanceSteps`; because `readDebugInput()` runs only inside `stepOnce()`,
    bridge input edges persist until the driver's own step consumes them.
    Blur/focus auto-pause handlers are not attached under manual clock.
  - Discovered `HelpScene` also publishes a runtime snapshot (`controlsListed`)
    that earlier audits missed; added `HelpRuntime` to keep typecheck honest.
  - Discovered the sandbox scene had NO `advanceSteps` command (level-only);
    added it there with the same bounded clamp so the sandbox is agent-drivable too.
  - Added `tests/e2e/helpers/gameDriver.ts`, a typed Playwright driver over the
    bridge (goto/snapshot/waitForScene/command/input/startLevel/startSandbox/
    gotoTitle/hold/release/press/resetInput/step/act/teleport/defeatBoss/
    completeLevel). Its `act()` applies input changes and steps in ONE evaluate so
    no real-time frame can interleave - the race-free pattern.
  - New specs: `manualClock.spec.ts` (4 tests: freeze + edge persistence, step-only
    movement, unchanged real-time path + runtime toggle, sandbox honours it) and
    `driverSmoke.spec.ts` (drives Level 1 spawn -> move -> fire -> jump -> teleport
    to boss -> defeat -> complete -> results entirely via the driver).
  - Recorded TASK-017 in TASKS.md for the next iteration.
- Files changed:
  - src/debug/runtimeTypes.ts (new), src/debug/debugBridge.ts
  - src/scenes/LevelScene.ts, src/scenes/SandboxScene.ts
  - tests/e2e/helpers/lives.ts, tests/e2e/helpers/gameDriver.ts (new)
  - tests/e2e/manualClock.spec.ts (new), tests/e2e/driverSmoke.spec.ts (new)
  - TASKS.md (TASK-016 DONE, TASK-017 added)
- Assets added or updated:
  - none (types + tests only).
- Commands run:
  - `npm run typecheck` (clean), `npm run lint` (clean)
  - `npm run test:unit` (221 passed, 41 files)
  - `npm run build` (pass)
  - `npx playwright test` (68 passed across chromium + msedge: the prior 63 plus
    4 manualClock + 1 driverSmoke)
- Verification result:
  - All green: lint, typecheck, 221 unit tests, build, 68 e2e tests.
  - Manual-clock race proven gone: `firePress` + 500 ms real-time wait leaves
    `projectileCount === 0` and `playerX` unchanged; the following `advanceSteps`
    fires. Real-time mode without the flag is byte-for-byte unchanged.
  - Normal visitors (no `?debug`) are unaffected: the flag and command live behind
    the existing debug gate and add no behavior otherwise.
- Visual quality notes:
  - none (no presentation change; rendering still runs every frame under manual
    clock so the canvas always reflects the stepped state).
- Status after: TASK-016 DONE; TASK-017 TODO.
- Remaining work:
  - TASK-017: `TEST_BASE_URL` env-driven Playwright config + `test-live.mjs`
    launcher + `test:e2e:live`, `@slow-live` tag on soak, `agent-server.mjs`
    (node:http driver server with /state /command /input /step /act /goto /health),
    `docs/AUTOMATION.md` + README link, then run the suite against the live site.
- Next recommended task:
  - TASK-017 - Test the deployed site: live-suite targeting, HTTP agent server, docs
- Blockers (if any):
  - none

---

### 2026-08-12 02:40 - TASK-017 (test the deployed site: live suite, agent server, docs)

- Status before: TODO
- Goal of this iteration:
  Make the TASK-016 automation surface usable against the deployed website:
  point the formal Playwright suite at any URL, ship a dependency-free HTTP
  driver server for interactive agent play, and document everything.
- Work completed:
  - `playwright.config.ts` now reads `TEST_BASE_URL` and skips the local
    webServer when a remote base is set. The env read goes through a typed
    globalThis cast to keep @types/node out of the dependencies.
  - `scripts/test-live.mjs` + `npm run test:e2e:live`: cross-platform launcher
    that spawns the Playwright CLI through `node` directly (no shell, no npx
    .cmd resolution on Windows, no DEP0190 warning) with TEST_BASE_URL set,
    defaulting to https://run-and-gun.pages.dev and forwarding extra argv.
  - Soak spec tagged `@slow-live` (36,000 round-trips + Chrome-only heap assert
    are CDN-environment-sensitive); assertions untouched; documented
    `--grep-invert @slow-live` as the opt-out. The default live run keeps it.
  - `scripts/agent-server.mjs` + `npm run agent:server`: node:http server that
    keeps ONE headless page at TARGET_URL with
    `?debug=1&renderer=canvas&manualClock=1`, serialized request queue for
    atomicity, endpoints /health /state /command /input /step /act /goto
    mirroring the GameDriver surface. No new npm dependencies.
  - `docs/AUTOMATION.md` (bridge API tables, runtime contract, manual-clock
    semantics, GameDriver walkthrough, live targeting, agent-server endpoint
    reference, example curl session, example agent loop, safety) + README
    Automation section linking it.
  - Verified the deployed bundle state empirically before testing: production
    carried TASK-014/015 but not TASK-016 (`manualClock` absent from the live
    bundle), so the first live run passed 63/68 with the 5 failures limited to
    the not-yet-deployed manual-clock specs - exactly as predicted.
- Authorization note (deploy):
  CLAUDE.md forbids deploying; the user was shown that the final acceptance
  criterion ("live suite passes against production") required a redeploy and
  explicitly authorized a one-off `npm run deploy` for this action only (same
  override precedent as the 2026-07-26 entry). No credentials requested,
  printed, or stored.
- Files changed:
  - playwright.config.ts, package.json (test:e2e:live, agent:server)
  - scripts/test-live.mjs (new), scripts/agent-server.mjs (new)
  - tests/e2e/soak.spec.ts (@slow-live tag), eslint.config.js (URL/Buffer
    globals for scripts), docs/AUTOMATION.md (new), README.md
  - TASKS.md (TASK-017 completion)
- Assets added or updated:
  - none.
- Commands run:
  - `npm run lint`, `npm run typecheck` (clean), `npm run test:unit` (221),
    `npm run build` (pass)
  - `npx playwright test` (68 passed locally)
  - `node scripts/test-live.mjs http://localhost:4173` (68 passed via the
    remote-base path with webServer skipped, proving the mechanism)
  - `node scripts/test-live.mjs` vs production BEFORE deploy (63 passed; the 5
    failures exactly the undeployed manual-clock specs)
  - `npm run deploy` (user-authorized one-off), `node scripts/live-check.mjs`
    (LIVE CHECK PASSED: headers, plain load, new bindings, boss)
  - `node scripts/test-live.mjs` vs production AFTER deploy (68 passed)
  - agent-server curl verification against production: /health, /command
    startLevel1, /act hold-right n=30 (playerX 60 -> 364.58), /act tap-fire
    n=2 (projectileCount 1, fireAngle 0), /step 30 (manualClock: true on
    prod), /input resetInput, /goto (session reset to title), /state
- Verification result:
  - All TASK-017 acceptance criteria verified with evidence above. The formal
    suite now passes 68/68 against the live production site, and an external
    agent can play the deployed game over plain HTTP with deterministic,
    screenshot-free control.
- Visual quality notes:
  - none (tooling/docs only).
- Status after: DONE and deployed.
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-018 - Front-page AI autoplay demo (bridge-driven, no screenshots)
- Blockers (if any):
  - none

---

### 2026-08-12 12:00 - TASK-018 (front-page AI autoplay demo)

- Status before: TODO (user-added task).
- Goal of this iteration:
  A title-screen option that lets a built-in AI pilot play Level 1 itself,
  perceiving only the typed runtime snapshot and acting only through the
  standard InputState merge - no screenshots, no pixel reads, no cheats.
- Work completed:
  - Extended the typed runtime contract for pilot perception
    (`src/debug/runtimeTypes.ts` + `LevelScene.publishRuntime`): added
    `enemyProjectiles[{x,y,vx,vy,arcGravity}]`, `bossX/bossY`,
    `bossStateTimer`, and `autopilot` to `LevelRuntime`. Wire format stays flat.
  - New pure module `src/ai/pilot.ts` (no Phaser/DOM imports):
    `decidePilotInput(snapshot, memory): PilotDecision` returns an InputState
    per step from the same fields the debug bridge publishes. Also
    `pitsFromSolids`/`platformRanges`/`createPilotMemory`. 28 unit tests
    (`tests/unit/pilot.test.ts`).
  - LevelScene wiring: pilot input merged at the same layer as
    keyboard/gamepad/touch/debug in `stepOnce()`; any human gameplay input
    disengages the pilot instantly (takeover). Reads the `autopilot` registry
    flag in `create()` (consumed so restart is a normal run), builds pilot
    memory from level geometry, stores `lastRuntime` for perception, and shows
    an "AI PLAYING - press any control key to take over" HUD label while engaged.
  - `advanceSteps` now stops early if a step transitions the scene and only
    republishes while the scene is active (needed for fast-forwarding the AI
    run deterministically through completion).
  - Title screen: `I - WATCH AI PLAY` entry (same keyboard-shortcut pattern as
    H/S/P); `?autopilot` starts Level 1 with the pilot engaged,
    `?autopilot=remote` starts it disengaged for an external bridge agent.
  - `tests/e2e/autopilot.spec.ts`: drives the demo from the title screen (real
    `i` key) under the manual clock, fast-forwards, and asserts the pilot
    crosses the level, activates + damages + defeats the Siege Walker, and
    reaches the results scene, with zero page errors; plus a human-takeover
    test and the `?autopilot=remote` test.
- The hard part (recorded for future reference):
  A pure "state in, input out" pilot is easy to write but hard to make
  *behave*. It took five empirically-driven design revisions, each diagnosed
  with a fast-forward probe (`scripts/autopilot-probe.mjs`):
  1. **Jump cut**: the pilot pressed jump for one step, so the variable-jump
     physics cut velocity to 40% and it fell into the pit. Fix: hold jump
     until landing (`holdingJump` memory flag; `applyJumpHold`).
  2. **Dodge loop**: prioritizing dodging over fighting meant perpetual jumps
     and no kills. Fix: fight while dodging.
  3. **Facing oscillation**: stop-and-duel at point-blank flipped facing every
     step so shots sailed the wrong way (confirmed via `window.__GAME__`
     internals: persistent `facing:-1` + capped bullets + enemy hp stuck).
  4. **Root cause of the stall**: enemies deal NO contact damage (only
     projectiles and the boss shockwave hurt - verified in the scene collision
     code), so dueling to a standstill was pure self-sabotage.
  5. **Final design - run-and-gun**: the goal is to *complete the level*, not
     duel every enemy. The pilot now always advances right and fires right
     (facing/shots always correct), kills what is ahead and outruns the rest,
     sidesteps only descending fire (drone bombs / grenade lobs), jumps pits
     at the edge, and hands off to `bossDecision` for the actual boss fight.
     This took it from "dies at x~700" to "completes Level 1 losing 4 lives".
- Files changed:
  - src/ai/pilot.ts (new), src/debug/runtimeTypes.ts
  - src/input/InputState.ts (+isNeutralInput), src/debug/debugBridge.ts
    (+setManualClock cmd earlier), src/scenes/LevelScene.ts, src/scenes/SandboxScene.ts,
    src/scenes/TitleScene.ts
  - tests/unit/pilot.test.ts (new), tests/e2e/autopilot.spec.ts (new)
  - scripts/autopilot-probe.mjs (new diagnostic), TASKS.md
- Assets added or updated:
  - none.
- Commands run:
  - `npx vitest run tests/unit/pilot.test.ts` (28 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (249 passed, up from 221)
  - `npm run build` (pass)
  - `node scripts/autopilot-probe.mjs` (repeatedly, to diagnose behavior)
  - `npx playwright test tests/e2e/autopilot.spec.ts` (3 passed)
  - `npx playwright test` (71 passed: 68 prior + 3 autopilot)
  - autopilot spec x3 consecutive (3 passed each) for reliability
- Verification result:
  - All TASK-018 acceptance criteria verified. The pilot completes Level 1
    start-to-boss, defeating the Siege Walker in its vulnerable windows, losing
    ~4 lives, with zero page errors; deterministic sim means repeated runs are
    identical. Human takeover and `?autopilot=remote` verified. The full suite
    is green: 249 unit, 71 e2e, lint/typecheck/build clean.
  - Boss fight detail: the pilot holds ~350px left of the boss between attack
    cycles and pours fire during each vulnerable window; with the rapid carbine
    (picked up on the path) the Siege Walker dies inside one window, with the
    pulse rifle it takes two windows (both acceptable).
- Visual quality notes:
  - none for gameplay art; the autoplay adds an on-screen "AI PLAYING" HUD label.
- Status after: DONE. Not deployed (loop rules forbid it); the demo ships with
  the next `npm run deploy`, after which `npm run test:e2e:live` can verify it
  on production.
- Remaining work:
  - none for this task.
- Next recommended task:
  - none open. Add further enhancements to TASKS.md to continue the loop.
- Blockers (if any):
  - none

---

### 2026-08-12 12:20 - DEPLOYMENT of TASK-018 (not a TASKS.md task)

- Status before: TASK-018 complete locally, not deployed.
- Authorization note:
  CLAUDE.md forbids deploying; the user explicitly instructed "Deploy to the
  website now", a one-off override for this action only (same precedent as the
  2026-07-26 and TASK-017 entries). The repo rules are unchanged. No
  credentials were requested, printed, or stored.
- Work completed:
  - `npm run deploy` (build + `wrangler pages deploy dist`) -> production.
  - Verified propagation: production bundle `index-Cb3eTtis.js` is byte-for-byte
    the local `dist` build and contains the autoplay code.
  - `node scripts/live-check.mjs` PASSED (headers, plain load, new bindings, boss).
  - `node scripts/test-live.mjs` -> 71/71 passed against production (chromium+msedge).
  - `node scripts/test-live.mjs ... tests/e2e/autopilot.spec.ts` -> 3/3 passed on
    production (the deployed AI pilot completes Level 1 and defeats the boss).
- Verification result: the AI autoplay demo is live at
  https://run-and-gun.pages.dev (press I on the title screen, or `?autopilot=1`).
- Status after: deployed to production.

---

### 2026-08-12 13:10 - TASK-019 (per-level AI autoplay toggle + Level 2 competency)

- Status before: TODO (user enhancement request: control AI autoplay on every level).
- Goal of this iteration:
  Let the player switch the AI pilot on/off on any level (and mid-level), keep
  the choice across level transitions and restarts, and make the pilot competent
  enough to complete Level 2 as well as Level 1.
- Work completed:
  - **Per-level toggle (the core ask).** The `autopilot` registry flag is now a
    session-global switch (no longer consumed on engage). `I` toggles the pilot
    on/off during any level via `consumePress('KeyI')` in `update()`;
    `engagePilot`/`disengagePilot`/`togglePilot` update the HUD label and the
    registry. Title `I` still starts Level 1 with it on; `?autopilot=1`/`=remote`
    unchanged. Because the flag persists, the AI keeps playing across
    results->next-level and game-over->restart until switched off.
  - **Hands-free continuity.** `ResultsScene` auto-advances after 2 s when the
    toggle is on (with an "AI PLAYING - advancing..." hint), so the pilot plays
    Level 1 -> results -> Level 2 -> MISSION COMPLETE with zero menu keypresses.
    When the toggle is off, results waits for the player as before.
  - **Pilot memory per level.** `buildPilotGeometry()` builds the pilot's static
    knowledge from the current level (pits, one-way platforms, floor spikes,
    boss arena), so it is level-agnostic.
  - **Snapshot extensions (runtimeTypes.ts + publishRuntime):** added
    `subcomponents[]` (id/x/y/w/h/alive) and `movingPlatforms[]` (id/x/y/width)
    to `LevelRuntime` for Level 2 perception and external agents.
  - **Level 2 competency, probe-driven** (`scripts/autopilot2-probe.mjs`):
    - Floor spike hazard: added `spikeRanges` + `spikes` to geometry and a wider
      `SPIKE_JUMP_WINDOW` (spikes kill on right-edge contact, before the pit's
      left-edge window). The pilot now jumps the x=2360 spike strip.
    - Reactor Warden: the boss is immune while subcomponents live, and its nodes
      protrude on both sides of the bullet-blocking boss body. Added
      `subcomponentAttack`: the pilot walks to a close standoff on each node's
      protruding side (through the boss, which neither blocks nor hurts on
      contact) and fires, aiming diagonally up at above-gun nodes. It cleared
      both phases' nodes, then damaged the boss to death.
    - Facing fix: during the vulnerable window the pilot now *advances toward*
      the boss while firing (facing follows movement), so it can't fire away
      from the boss after clearing the far node.
- **Bug found and fixed (NOT pilot accommodation):** the Level 2 corridor door
  was impassable on foot for everyone. `stepDoor` opens only while the player
  overlaps the trigger pad, but the pad ended at x=1760, 40 px before the door
  at x=1800, so it could never be held open through the doorway - the player was
  permanently blocked at x=1778 (confirmed empirically with
  `scripts/door-check.mjs`). `fullGame.spec.ts` only ever passed because it
  teleports past the door, masking the bug for humans too. Fixed by extending
  the pad through the doorway (`src/levels/level2.ts`, width 60 -> 124), which
  preserves the documented reversible "stand on the pad" mechanic (the door
  closes behind you). Re-verified walkable on foot.
- Files changed:
  - src/scenes/LevelScene.ts (toggle, geometry builder, snapshot fields)
  - src/scenes/ResultsScene.ts (auto-advance), src/scenes/TitleScene.ts
  - src/ai/pilot.ts (spikes, subcomponentAttack, vulnerable-window facing)
  - src/debug/runtimeTypes.ts, src/levels/level2.ts (door fix)
  - tests/unit/pilot.test.ts, tests/e2e/aiToggle.spec.ts (new)
  - scripts/autopilot2-probe.mjs, autopilot-fullrun.mjs, door-check.mjs (new diagnostics)
  - TASKS.md
- Assets added or updated:
  - none.
- Commands run:
  - `npx vitest run tests/unit/pilot.test.ts` (28 passed)
  - `npm run lint`, `npm run typecheck` (clean), `npm run test:unit` (249 passed)
  - `npm run build` (pass)
  - `node scripts/door-check.mjs`, `autopilot2-probe.mjs`, `autopilot-fullrun.mjs`
  - `npx playwright test tests/e2e/aiToggle.spec.ts` (3 passed)
  - `npx playwright test` (74 passed: 71 prior + 3 aiToggle)
- Verification result:
  - All TASK-019 acceptance criteria verified. Full hands-free run: AI on ->
    Level 1 complete (loses 4 lives) -> results auto-advance -> Level 2 complete
    (loses 9 lives, defeats Reactor Warden incl. both subcomponent phases) ->
    MISSION COMPLETE -> title, zero page errors. Toggle on/off mid-level and the
    toggle-off results wait both verified. Full suite green: 249 unit, 74 e2e.
- Visual quality notes:
  - "AI PLAYING" HUD label shows while the pilot is engaged; an "AI PLAYING -
    advancing..." hint shows on the results screen when the toggle is on.
- Status after: DONE. Not deployed (loop rules forbid it); ships with the next
  `npm run deploy`, after which `npm run test:e2e:live` can verify on production.
- Remaining work:
  - none for this task.
- Next recommended task:
  - none open. Add further enhancements to TASKS.md to continue the loop.
- Blockers (if any):
  - none

---

### 2026-08-12 13:25 - DEPLOYMENT of TASK-019 (not a TASKS.md task)

- Status before: TASK-019 complete locally, not deployed.
- Authorization note:
  CLAUDE.md forbids deploying; the user replied "continue" directly to the
  offer "Want me to deploy it now?", a one-off authorization for this action
  only (same precedent as the TASK-017/018 deploys). Repo rules unchanged. No
  credentials were requested, printed, or stored.
- Work completed:
  - `npm run deploy` (build + `wrangler pages deploy dist`) -> production.
  - Verified propagation: production bundle `index-Be4AsXlZ.js` is byte-for-byte
    the local `dist` build and contains the door fix and subcomponent snapshot code.
  - `node scripts/live-check.mjs` PASSED (headers, plain load, new bindings, boss).
  - `node scripts/test-live.mjs ... aiToggle.spec.ts autopilot.spec.ts` -> 6/6
    passed on production, including the hands-free Level 1 + Level 2 completion.
  - `node scripts/test-live.mjs` -> 74/74 passed against production (chromium+msedge).
- Verification result: the per-level AI autoplay toggle is live at
  https://run-and-gun.pages.dev (press I on any level to switch the pilot on/off;
  with it on, the AI plays both levels hands-free to MISSION COMPLETE).
- Status after: deployed to production.
### 2026-09-12 12:58 - TASK-020 (bridge correctness and run instrumentation)

- Status before: TODO (new task; TASK-020..TASK-026 added this iteration from a
  user request to build a self-play / self-evaluation loop).
- Goal of this iteration:
  Make the debug bridge trustworthy enough to build an evaluation harness on,
  and publish the telemetry that harness needs. `src/` only.
- Planning note (what changed before any code was written):
  The user asked whether the game needed a slow-motion mode so an AI could
  watch the screen and react, or an MCP/web interface for near-real-time
  control. Neither is the gap: `?manualClock=1` already freezes wall time so the
  agent IS the clock (unlimited thinking time per decision, zero races), and the
  typed `LevelRuntime` snapshot already gives richer perception than pixels.
  What was missing was everything downstream of "the AI can play": batch runs,
  run variation, invariant checks, and a producer that turns play into tasks.
  The user chose bug-finding as the loop's goal, the built-in heuristic pilot as
  the driver, and asked for an MCP server (TASK-023).
- **The blocking defect found while planning, and fixed here:**
  `advanceSteps` did NOT stop at a scene transition, contrary to its own comment
  at `LevelScene.ts:661`. Phaser's `ScenePlugin.start` only queues the swap
  ("this will happen at the next Scene Manager update, not immediately" -
  `node_modules/phaser/src/scene/ScenePlugin.js`), so `this.scene.isActive()`
  stays true for the whole synchronous batch. Consequences, both verified:
  - a game over re-queued stop+start once per remaining step;
  - after a completion `completionTimer` went negative, so its branch was
    skipped on the next step and the level kept simulating for the rest of the
    batch - able to queue `results` and `gameOver` from one call.
  Fixed with an explicit `ending: 'results' | 'gameOver' | null` latch set
  before any `scene.start`, checked at the top of `stepOnce` and in the
  `advanceSteps` loop. `advanceSteps` now returns `{ ok, steps, ended }`, so a
  driver learns the run ended without polling `getState().scene` (which lags the
  swap by up to two frames).
- **Second finding: the soak test has been passing vacuously.**
  `scripts/soak-probe.mjs` (new) showed the soak reaching game over in chunk 1
  of 10 (~6,300 of 36,000 steps), never clearing the first pit (maxX=769, 21
  deaths in the first 60 simulated seconds - it holds right and walks into the
  pit at x=720, respawns at x=60, repeats). After that transition
  `getState().runtime` is the game-over snapshot, which carries no counters, so
  `after.maxEnemiesSeen ?? 0` evaluated to 0 and all three resource-bound
  assertions were comparing 0 against their caps. The spec was rewritten, not
  weakened: counters are now sampled inside the same evaluate that runs the
  chunk (before any frame can swap the scene), the loop runs on steps remaining
  rather than a fixed chunk count, an ended run is restarted and the soak
  continues, and it now asserts the counters are non-zero and that all 36,000
  steps were really simulated. Result: `maxEnemies=3 maxPlayerBullets=1
  maxEnemyBullets=3 restarts=5 steps=36000 heapBefore=12700000
  heapAfter=12700000` - ten minutes of live simulation across five restarts,
  heap flat.
- Work completed:
  - **Transition latch** (above), plus `ending` published in the runtime.
  - **Command lifetime.** `registerCommand` now returns a disposer and scenes
    release their commands on shutdown, so a stopped scene can no longer answer
    the bridge (it previously kept mutating a dead scene, or silently no-opped).
    The disposer only removes a name still bound to *its* handler, so an
    outgoing scene shutting down after its successor registered the same name
    cannot unregister the live one - that ordering is real, because Phaser
    queues swaps.
  - **Input surface completed:** `holdCrouch` / `releaseCrouch` / `holdDrop` /
    `releaseDrop`. `readDebugInput` already read both fields; only the command
    names were missing.
  - **Menu commands:** `confirmMenu` and `backMenu`, registered inside
    `attachMenuConfirm` so every menu scene (title, results, game over, help)
    gets them from one place. A batch run can now advance results -> next level
    and game over -> restart with no real key press and no real-time wait; the
    only hands-free path before was ResultsScene's 2 s wall-clock `delayedCall`,
    which `advanceSteps` cannot drive. `GameOverScene` gained the double-start
    latch `ResultsScene` already had.
  - **`startAtCheckpoint({ id | index, lives?, weapon? })`.** The evaluation
    matrix needs to start each segment at its checkpoint, and `teleportPlayer`
    cannot do it: `updateSpawnTriggers` fires when playerX enters `[x0,x1]`, so
    teleporting across a band skips that wave permanently - which is exactly how
    `fullGame.spec` flew past (and hid) the Level 2 door bug for months.
  - **Run instrumentation** in `LevelRuntime`: `stepIndex`, `maxPlayerX`
    (monotone, so a driver sampling every N steps cannot miss progress between
    samples), `ending`, and `deaths: DeathEvent[]` with
    `DeathCause = 'pit' | 'hazard' | 'enemyFire' | 'bossShockwave'` and a
    `costLife` flag. Three damage sites carry the cause; enemy body contact is
    deliberately harmless and so is not a cause.
- Evidence for all four death causes:
  - `pit` and `hazard`: deterministic e2e cases (`bridgeContract.spec.ts`).
  - `enemyFire`: `scripts/death-cause-probe.mjs` - the pilot completes Level 1
    in 1438 steps losing 4 lives (x=672/1185/1881/2529) and Level 2 in 3183
    steps losing 9, all `enemyFire`, zero page errors. Matches the loss counts
    recorded for TASK-018/019.
  - `bossShockwave`: `scripts/shockwave-probe.mjs` - a grounded, passive player
    in the Siege Walker arena dies to the stomp 7 times out of 13 deaths. The AI
    pilot never produces this cause because it jumps every stomp telegraph.
- Worth recording for TASK-022: the Level 2 probe shows five deaths at exactly
  x=2583.25 on a ~337-step cycle (respawn at preboss -> walk -> killed at the
  identical spot). That is the death-trap signature the evaluation harness is
  meant to detect, already present in real play.
- Files changed:
  - src/debug/debugBridge.ts (disposer-returning `registerCommand`, crouch/drop
    inputs, `confirmMenu`/`backMenu`/`startAtCheckpoint` names)
  - src/debug/runtimeTypes.ts (`DeathCause`, `DeathEvent`, four new LevelRuntime fields)
  - src/scenes/LevelScene.ts (latch, instrumentation, `startAtCheckpoint`,
    death-cause plumbing, command disposal, hoisted `round2`)
  - src/scenes/SandboxScene.ts (command disposal)
  - src/scenes/GameOverScene.ts (double-start latch)
  - src/input/menuConfirm.ts (`confirmMenu`/`backMenu` for every menu scene)
  - tests/e2e/bridgeContract.spec.ts (new, 11 tests), tests/e2e/soak.spec.ts (rewritten)
  - tests/unit/debugBridge.test.ts (new, 8 tests), tests/unit/pilot.test.ts (fixture fields)
  - scripts/soak-probe.mjs, scripts/death-cause-probe.mjs, scripts/shockwave-probe.mjs (new diagnostics)
  - TASKS.md (TASK-020..TASK-026 added; 020 completed)
- Assets added or updated:
  - none.
- Commands run:
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (257 passed, 43 files; was 249/42)
  - `npm run build` (pass)
  - `npx playwright test` (85 passed; was 74)
  - `node scripts/soak-probe.mjs`, `death-cause-probe.mjs` (levels 1 and 2),
    `shockwave-probe.mjs`
- Verification result:
  - Every TASK-020 acceptance criterion verified. 257 unit, 85 e2e, lint,
    typecheck and build all green.
  - The transition contract is asserted directly: `advanceSteps(3600)` across a
    completion returns `steps < 3600` with `ended: 'results'`, and exactly one
    scene is running afterwards (read from `__GAME__.scene.getScenes(true)`).
- Visual quality notes:
  - none; no user-facing presentation changed. Normal visitors (no `?debug`) see
    no behaviour change at all.
- Status after: DONE. Not deployed (loop rules forbid it).
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-021 - Shared driver library and the single-run evaluator.
- Blockers (if any):
  - none. Note TASK-025 and TASK-026 were filed from review findings (a dropped
    first input press on pilot takeover, and a free respawn when a pit death
    lands inside an open invulnerability window); both are user-facing and
    independent of the harness work.

---

### 2026-09-12 13:30 - TASK-021 (shared driver library and the single-run evaluator)

- Status before: TODO
- Goal of this iteration:
  Kill the one real duplication in the driver layer, and build the single-run
  evaluator on top of it: drive one configured self-play run, sample it, and
  check gameplay invariants. No `src/` changes.
- Work completed:
  - **`scripts/lib/`** - the setup 26 probe scripts were each repeating:
    - `browser.mjs`: `gameUrl`, `launch`, `openGame`, `closeSession`, `log`.
      `openGame` uses a fresh browser context per run (localStorage and the
      Phaser registry both survive a plain re-navigation, so reusing a context
      would leak settings, best score and `autopilot` between runs) and seeds
      settings via `addInitScript`. That seeding is not cosmetic: the shipped
      default is 30 starting lives, so a run that does not force a lower count
      effectively never reaches the game-over path.
    - `bridge.mjs`: the hold/release/tap maps as the single source of truth,
      plus `act()` (inputs + advance + snapshot in ONE evaluate, so no real
      frame can interleave) and `settleSceneSwap()` (a queued scene swap needs
      two animation frames before `getState()` reports the new scene).
    - `rng.mjs` (mulberry32) and `policies.mjs` (8 policies).
  - **`scripts/agent-server.mjs` refactored onto the lib.** It had hand-copied
    the action maps from `tests/e2e/helpers/gameDriver.ts` - its own comment
    admitted it. All seven endpoints verified by hand against a live server,
    including the error paths (400 on an unknown action, 405 on a wrong method,
    `/goto` re-navigation). Its logging moved to stderr, because the MCP server
    (TASK-023) will share `scripts/lib/` and speaks JSON-RPC on stdout.
  - **`scripts/eval/checks.mjs`** - every detector is a pure function over a
    trace array, so the whole thing is unit-testable with no browser.
  - **`scripts/eval/run.mjs`** - drives one config to its end or its budget
    (18,000 steps = 5 simulated minutes), sampling every 30 steps.
- Design decisions worth keeping:
  - **Progress is measured monotonically**, never as a raw `playerX` delta. A
    delta is wrong in both directions: the boss standoff oscillates left/right
    forever (reads as progress) and a player wedged against a door jitters a
    pixel or two (also reads as progress). `maxPlayerX` was added to the
    snapshot in TASK-020 precisely so a driver sampling every 30 steps cannot
    miss progress that happened between samples.
  - **Two stall windows.** 600 steps (10 s) for traversal, chosen against the
    slowest legitimately stationary state in the game - the Level 2 vertical
    platform's 4 s round trip - and 3600 steps (60 s) in the boss arena, where
    `maxPlayerX` cannot grow by design and holding position between attack
    cycles is the correct play.
  - **Suppressed samples freeze the stall clock rather than resetting it**, so a
    run cannot hide a wedge behind a periodic death or pause.
  - **The death-trap detector is separate** from the stall detector, because a
    respawn loop keeps changing `lives` and therefore reads as progress forever.
  - **`startAtCheckpoint` rather than `teleportPlayer`** for every run setup
    (see TASK-020): a teleport across a spawn-trigger band skips that wave
    permanently.
- Two false-positive classes found by running it, and fixed:
  - The `idler` policy reported 28 stalls in one run. Standing still forever is
    what that policy is *for*, so policies now carry `expectsProgress` and the
    stall detector is skipped when it is false. A detector that cries wolf gets
    muted and then finds nothing.
  - A wedged run re-reported the same stall every window until the budget ran
    out. Findings are now deduplicated per `(kind, bucket)` with an occurrence
    count, and tagged with the policy so aggregation (TASK-022) can weight a
    pilot finding above a chaos-policy one.
- **The harness independently found real defects on its first run:**
  - `L2-start-30lives-pilot` -> `deathTrap @x=2587: 6 deaths within 96px
    (enemyFire)`. This is the same trap spotted by hand during TASK-020, now
    detected automatically.
  - `L1-start-3lives-rusher` -> `freeDeath @x=770: 1 death cost no life`. That
    is TASK-026 (an invulnerability window swallows the life loss but the
    respawn still runs), caught in the wild without being looked for.
  - `L1-start-3lives-rusher` -> `deathTrap @x=770 (causes: hazard)` where `pit`
    was expected, which exposed a new inconsistency: `level1.ts` documents its
    pit markers as "non-lethal; lethality comes from the fall threshold", but
    `hazardTouchesPlayer()` treats every hazard rect as lethal on contact, so
    the markers kill and pit falls are attributed `hazard`. Filed as TASK-027
    rather than fixed here (it is a gameplay/data decision, not harness work).
- Note on `tsconfig.json`: `allowJs` was enabled so the unit tests can import
  the `.mjs` harness modules and infer their types from source, instead of a
  hand-written `.d.mts` that would drift. `checkJs` stays off. It earned its
  keep immediately - inference caught a `string` index into the release map in
  the new test.
- Files changed:
  - scripts/lib/browser.mjs, scripts/lib/bridge.mjs, scripts/lib/rng.mjs,
    scripts/lib/policies.mjs (new)
  - scripts/eval/checks.mjs, scripts/eval/run.mjs (new)
  - scripts/agent-server.mjs (refactored onto the lib)
  - tests/unit/evalChecks.test.ts (new, 22 tests), tests/unit/agentActions.test.ts (new, 8 tests)
  - tsconfig.json (allowJs), eslint.config.js (browser globals used inside
    page.evaluate callbacks)
  - TASKS.md (021 completed, TASK-027 filed)
- Assets added or updated:
  - none.
- Commands run:
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (287 passed, 45 files; was 257/43)
  - `npm run build` (pass)
  - `npx playwright test` (85 passed, unchanged)
  - `node scripts/eval/run.mjs` across pilot/rusher/idler/doorCamper/bossHugger
    on both levels and several checkpoints
  - live `curl` pass over all seven agent-server endpoints plus error paths
- Verification result:
  - Every TASK-021 acceptance criterion verified. The required false-positive
    cases are pinned in `tests/unit/evalChecks.test.ts`: boss standoff, the 4 s
    platform wait, the death pause, the completion delay, and a mid-wedge pause.
  - `node scripts/eval/run.mjs --level 1 --checkpoint start --lives 3 --policy pilot`
    writes `test-results/eval/run-L1-start-3lives-pilot.json` with zero findings.
  - `L1-start-30lives-pilot` completes the level (ended=results, 1438 steps,
    zero findings), which is the clean-run baseline.
- Visual quality notes:
  - none; no `src/` or presentation changes in this task.
- Status after: DONE. Not deployed (loop rules forbid it).
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-022 - Batch matrix, aggregation, `npm run eval`.
- Caveat recorded for TASK-022:
  `test-results/` is Playwright's output directory and Playwright clears it at
  the start of every run, so eval traces written there do not survive a
  subsequent `npx playwright test`. The per-run traces are disposable working
  data so that is acceptable, but the aggregated report and any baseline must be
  written somewhere durable (`docs/eval/`, which is also committed - unlike
  `test-results/`, which is gitignored).
- Blockers (if any):
  - none. TASK-025, TASK-026 and TASK-027 are open user-facing findings,
    independent of the harness chain.

---

### 2026-09-13 01:50 - TASK-022 (batch matrix, aggregation, `npm run eval`)

- Status before: TODO
- Goal of this iteration:
  Run the single-run evaluator across a varied matrix, aggregate it into a
  report a human and the loop can both read, and prove the thing actually
  detects a real bug.
- Work completed:
  - `scripts/eval/matrix.mjs` - six variation axes, ordered by bugs found per
    run rather than by cleverness: start state (level x checkpoint x lives, plus
    starting weapon at `preboss` only, where it is the weapon you actually fight
    the boss with), seeded hiccups over a pilot run, scripted adversarial
    policies, seeded fuzz, `advanceSteps` batch size, and the full two-level
    chain.
  - `scripts/eval/report.mjs` - grouping, ranking, markdown, and a categorical
    baseline. Findings are grouped by (kind, level, bucket) and ranked with
    competent-policy findings first: a wedge the pilot hits is one a real player
    hits; a wedge `fuzz` hits may not be reachable deliberately.
  - `scripts/eval/index.mjs` + `npm run eval`, with `--quick`, `--seeds`,
    `--filter`, `--baseline`, `--update-baseline`, `--headed`.
  - New seeded policies: `hiccup` (pilot + stray input bursts) and `fuzz`.
  - `runOnBrowser` so the matrix reuses one browser with a fresh context per run.
- Measured: 39 runs in **40 seconds**; `--quick` (12 runs) in **13 seconds**.
  The budgets in the task were 6 and 2 minutes.
- **The harness found a real defect on its first full matrix (TASK-028 filed).**
  The pilot completes Level 2 from the level start but NOT from the `mid` or
  `preboss` checkpoint. From `preboss` it walks to x=2748.83, stops there
  permanently, never damages a subcomponent (`subcomponentsAlive` stays 2, boss
  health stays 8 because the Warden is immune while its nodes live) and dies to
  boss fire every ~216 steps until all 30 lives are gone.
  Diagnosis, run down rather than guessed at:
  - Not the weapon. Forcing `scatter` - the weapon the winning run actually
    fights with - still wedges at 2749; `rapid` reaches one node and still dies
    out; `pulse` and `scatter` reach none.
  - Not enemies. The wedged run has ZERO enemies alive during the fight; the
    winning run has 2-3.
  - Not geometry. The winning run passes through the SAME x with the SAME
    subcomponent state at step 840 and destroys a node at 2770, so the nodes are
    reachable and destructible from exactly there.
  So it is a fixed point in the pilot's `subcomponentAttack`: it settles on a
  standoff with no line of fire (bullets cannot cross the boss body, per
  TASK-019) and fires ineffectively forever. The TASK-019 claim that the pilot
  completes Level 2 was only ever true for a full-level run - it could not have
  been tested from a checkpoint, because `startAtCheckpoint` did not exist until
  TASK-020.
- **Detection proven end-to-end.** Narrowing the Level 2 trigger pad back to
  width 60 (the original door bug) and rebuilding: the harness reported
  `stall @x=1778` - the exact pixel TASK-019 recorded as "permanently blocked at
  x=1778" - from a cold start with no knowledge of the bug. With `--baseline`
  the run exited 1 with 17 regressions and `completed=0`. Reverted and rebuilt;
  `git diff` on the level file is empty.
- Two detector notes worth keeping:
  - The stall detector did NOT fire on the TASK-028 wedge, because dying every
    216 steps keeps changing `lives`, which counts as progress. The death-trap
    detector caught it instead. The two covering each other is exactly why they
    are separate passes.
  - `crouchWalker` reported a stall at x=60: holding crouch pins the player, so
    a permanent crouch-walk never moves. That was the policy being wrong, not
    the detector - fixed to crouch intermittently, and `stuck` went to 0.
- Deviation from the written criteria, with reason:
  - The report and baseline go to `docs/eval/`, not `test-results/`. Playwright
    clears `test-results/` on every run and it is gitignored, so a baseline
    there could not survive between loop iterations. Per-run traces stay there
    as disposable working data. The criterion was amended to say so.
  - The exit code gates on REGRESSIONS when a baseline exists, and on critical
    findings only when one does not. The game carries 26 standing critical
    findings - chaos policies dying repeatedly where a competent player never
    goes - so gating on the absolute count would leave the signal permanently
    red, which is the same as having no gate. The criterion was amended to say
    so. Verified both ways: clean run exits 0, injected door bug exits 1.
- Files changed:
  - scripts/eval/matrix.mjs, report.mjs, index.mjs (new)
  - scripts/eval/run.mjs (browser reuse, chain, weapon, sampleSteps, weapon in
    the sample projection)
  - scripts/eval/checks.mjs (findings tagged with policy)
  - scripts/lib/policies.mjs (hiccup, fuzz, crouchWalker fix)
  - package.json (`eval` script), docs/AUTOMATION.md (eval section + the
    TASK-020 commands the doc had not caught up with)
  - docs/eval/report.md, docs/eval/baseline.json (new, committed)
  - TASKS.md (022 completed and two criteria amended; TASK-028 filed)
- Commands run:
  - `npm run eval` (39 runs, 40 s), `npm run eval -- --quick` (12 runs, 13 s),
    `--update-baseline`, `--baseline` (exit 0 clean, exit 1 with the injected bug)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (287 passed, 45 files)
  - `npm run build` (pass)
  - `npx playwright test` (85 passed)
- Verification result:
  - Every TASK-022 acceptance criterion verified, two amended as recorded above.
  - The batch-size axis is clean: chunk 1, 30 and 600 all produce
    `steps=1438 ended=results` on the same config - identical outcomes at every
    granularity, which is the harness-correctness proof that the TASK-020
    transition latch holds.
  - The chain config completes Level 1 -> results -> Level 2 hands-free through
    `confirmMenu`, with no wall-clock waiting.
- Visual quality notes:
  - none; no `src/` changes in this task.
- Status after: DONE. Not deployed (loop rules forbid it).
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-023 - MCP server for the game bridge. But TASK-028 (the pilot wedge) and
    TASK-025/026/027 are user-facing and may deserve to jump the queue.
- Blockers (if any):
  - none.

---

### 2026-09-12 19:20 - Reprioritisation, then TASK-025 (dropped first press on takeover)

- Status before: TASK-025 TODO, sitting behind TASK-023/024 in the file.
- Reprioritisation (user request):
  `.claude/loop.md` takes the first `TODO` task in `TASKS.md`, so file order is
  priority. TASK-025 to TASK-028 - four user-facing defects, three of them found
  by the evaluation harness - were moved ahead of TASK-023 (MCP server) and
  TASK-024 (loop closure): adding more automation surface while known player
  bugs sit open is the wrong trade. Ids were NOT renumbered, because
  `PROGRESS.md` references them; only the blocks moved. Verified no content was
  lost (`diff <(sort before) <(sort after)` is empty) and a note was added under
  "Future enhancements" recording that order is priority, not id order.
- Goal of this iteration: fix the dropped first keypress on AI takeover.
- The defect:
  `buildInputFromRaw` derived edges as `jumpPressed = raw.jump && !prev.jumpHeld`,
  and `LevelScene.stepOnce` passed `this.stepInput` as `prev` - the MERGED input
  from the previous step, which carries whatever the gamepad, touch controls,
  debug bridge and AI pilot asked for. So while the pilot held jump or fire, a
  human's first real press read as a continuation of the pilot's hold and its
  edge was silently dropped. The player had to release and press again before a
  takeover registered.
- The fix:
  An edge belongs to the DEVICE, so it is now derived from the previous RAW KEY
  state and nothing else. `buildInputFromRaw(raw, prevRaw: RawKeyState)`, and the
  adapter owns that state internally - `build()` takes no argument at all, which
  makes the old misuse impossible to express rather than merely fixed. Both call
  sites (LevelScene, SandboxScene) updated.
  `clear()` now also resets the remembered state: focus loss drops held keys
  without a matching keyup, and without this a key that is still physically down
  would be stuck "already held" and never edge again.
- Verification that the regression test actually catches the regression:
  The new e2e was run against a deliberate restoration of the old behaviour and
  FAILED with `Expected: < 408, Received: 408` - the player never left the
  ground. The temporary revert was then restored from a backup and both files
  confirmed byte-identical to the fixed version by `diff`. A regression test that
  has not been seen to fail is not evidence of anything.
- Files changed:
  - src/input/KeyboardInput.ts (raw-state edges, adapter-owned prev, clear())
  - src/scenes/LevelScene.ts, src/scenes/SandboxScene.ts (call sites)
  - tests/unit/keyboard.test.ts (3 new adapter tests with a stub Window, since
    unit tests run in the node environment; existing tests updated to the
    raw-state contract)
  - tests/e2e/aiToggle.spec.ts (takeover test)
  - TASKS.md (reorder + priority note + 025 completed)
- Commands run:
  - `npx vitest run tests/unit/keyboard.test.ts` (RED 3 failures -> GREEN 18 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (290 passed, up from 287)
  - `npm run build` (pass)
  - `npx playwright test` (86 passed, up from 85)
  - `npm run eval -- --baseline` (exit 0, no regressions, 26 standing criticals
    all present in the baseline)
- Verification result:
  - All four acceptance criteria met. The suite is green and the evaluation
    harness reports no regression, so the input change did not disturb any run
    outcome across the 39-config matrix.
- Visual quality notes:
  - none; input-layer only, no presentation change.
- Status after: DONE. Not deployed (loop rules forbid it).
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-026 - a pit or hazard death while invulnerable is free. Note the
    evaluation harness already reports this one in the wild as `freeDeath`, so
    the fix has a ready-made check: those findings should disappear from
    `docs/eval/report.md`.
- Blockers (if any):
  - none.

---

### 2026-09-12 20:36 - TASK-026 (a pit or hazard death while invulnerable was free)

- Status before: TODO (found by the evaluation harness as `freeDeath`).
- Goal of this iteration: decide the intended rule for a lethal death landing
  inside a mercy-invulnerability window, and make the code enforce it.
- The rule chosen, and why:
  A pit or hazard death ALWAYS costs a life. Mercy invincibility exists so that
  one projectile hit does not immediately become several; falling out of the
  world is not damage for it to absorb. The respawn runs either way, so letting
  the window swallow the life loss turned a pit into a free teleport back to the
  last checkpoint. The everyday way to hit it was not exotic: die, respawn
  (which opens a fresh window), walk straight off the same ledge again - the
  second fall was free.
- Work completed:
  - New pure `applyLethalDamage(state, invulnDuration)` in
    `src/simulation/health.ts`: takes a life regardless of the invulnerability
    window, still a no-op once the run is over so a death cannot be double
    counted. `applyDamage` now delegates to it after its own invuln check, so
    the two paths cannot drift.
  - `LevelScene.finishDeath` and `SandboxScene.handleDeath` both use it. The
    sandbox had the identical bug in its pit handler and would have been missed
    by a fix aimed only at the level scene.
  - 5 unit tests in `tests/unit/health.test.ts` covering the invulnerable death,
    the fresh respawn window, the last life, the already-over case, and
    equivalence with ordinary damage when not invulnerable.
  - E2E in `bridgeContract.spec.ts`: die, respawn, fall again while still
    invulnerable, assert 30 -> 29 -> 28 and that every published death has
    `costLife: true`.
- Verification that the regression test catches the regression:
  Ran against a deliberate restoration of the old behaviour; it failed with
  "player never dropped to 28 lives" - the second fall was free, exactly the
  bug. Restored from backup and confirmed byte-identical by `diff`.
  Test-construction note worth keeping: the first draft over-stepped after the
  first death, the 1.5 s mercy window expired, and the second death became an
  ordinary one that would have passed against the buggy code too. The test now
  steps in small increments and stops the moment the life is actually lost. A
  green regression test that never exercises the regression is worse than none.
- **The harness confirmed the fix in the wild.** `npm run eval -- --baseline`
  reported 7 findings fixed and no regressions: `freeDeath` gone from six
  different runs (edgeNudger, bossHugger, rusher, crouchWalker, two fuzz seeds)
  plus a `deathTrap` at x=768 that only existed because the rusher could loop at
  the pit forever without paying for it.
- One detector refinement, driven by the fix:
  The run then reported a NEW `structural` finding at x=2340. Investigated
  rather than assumed: exactly ONE sample sat in the single-step window between
  losing the last life and the scene queueing the game-over transition at the
  top of the next step, and the following sample already read
  `ending='gameOver'`. A correct game over, a false positive in my check. The
  "lives reached zero without the run ending" rule now requires the condition to
  persist across two consecutive samples, which a genuine stranded run would and
  a one-step transition cannot. Pinned with a unit test built from the real
  sample sequence.
- Files changed:
  - src/simulation/health.ts (applyLethalDamage; applyDamage delegates)
  - src/scenes/LevelScene.ts, src/scenes/SandboxScene.ts (lethal death path)
  - scripts/eval/checks.mjs (structural check needs persistence)
  - tests/unit/health.test.ts (+5), tests/unit/evalChecks.test.ts (+1, and the
    existing structural case updated to two samples)
  - tests/e2e/bridgeContract.spec.ts (+1)
  - docs/eval/report.md, docs/eval/baseline.json (regenerated)
  - TASKS.md (026 completed, rule recorded in the criterion)
- Commands run:
  - `npx vitest run tests/unit/health.test.ts` (RED 5 failures -> GREEN 9 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (296 passed, up from 290)
  - `npm run build` (pass)
  - `npx playwright test` (87 passed, up from 86)
  - `npm run eval -- --baseline` (exit 0, no regressions, 7 fixed), then
    `--update-baseline`
- Verification result:
  - All four acceptance criteria met.
  - Side effect worth noting as correct, not a regression: the soak spec now
    reports `restarts=6` instead of 5, because pit deaths finally cost lives and
    its blind right-pusher burns through them slightly faster.
- Visual quality notes:
  - none; rules only, no presentation change.
- Status after: DONE. Not deployed (loop rules forbid it).
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-027 - the "non-lethal" pit markers are lethal on contact. Related area,
    and it decides whether a Level 1 pit fall should read as `pit` or `hazard`.
- Blockers (if any):
  - none.

---

### 2026-09-12 20:52 - TASK-027 (the "non-lethal" pit markers were lethal on contact)

- Status before: TODO (found by the evaluation harness, which reported a Level 1
  pit fall with `causes: hazard` where `pit` was expected).
- The decision, and why it was not a coin flip:
  The game's own data model already drew the line - it was just drawn in only one
  place. `src/ai/pilot.ts` filtered hazards with `h.y < groundY` to decide which
  strips it must jump, i.e. a rect whose top sits ABOVE the ground line is a
  spike strip and anything at or below it is decorative paint on a pit rim. The
  level data agreed: `level1.ts` labels its two rects "Visual pit markers
  (non-lethal; lethality comes from the fall threshold)". Only
  `LevelScene.hazardTouchesPlayer()` was unaware, treating every rect in
  `hazards` as lethal. So the markers killed on contact a few frames before the
  fall threshold, and the death came out as `hazard`.
  The fix makes the code match the documented intent rather than the reverse:
  the comment in `level1.ts` is now true as written.
- Work completed:
  - New pure `isLethalHazard(hazard, groundY)` in `src/levels/levelSchema.ts` -
    the rule now lives once, next to the data it describes, because three places
    need to agree on it: the scene's contact test, the pilot's jump geometry,
    and (in future) the level validator. `hazards` gained a doc comment saying
    it carries two different things.
  - `LevelScene.hazardTouchesPlayer()` skips non-lethal rects.
  - `pilot.spikeRanges` now calls the shared predicate instead of repeating
    `h.y < groundY`, so the pilot cannot disagree with the game about which
    strips kill.
  - `tests/unit/levelHazards.test.ts` (new, 5 tests): the predicate either way of
    the ground line, plus assertions against the SHIPPED levels - Level 1
    declares only decorative markers, Level 2 declares exactly one lethal strip
    at x=2360, and the pilot jumps exactly the strips the scene treats as lethal.
    That last one is the anti-drift test.
  - E2E: walk off the first pit edge on foot and assert the cause is `pit`.
    Starting the player at x=690 keeps the wave-1 trigger (x 520-560) behind, so
    enemy fire cannot claim the first death and mask the attribution - the first
    draft failed exactly that way, reporting `enemyFire`.
- Verification that the regression test catches the regression:
  Ran against a deliberate removal of the lethality check; it failed with
  `Expected: "pit", Received: "hazard"`. Restored and confirmed by `diff`.
- Evidence at the data level: the eval report's death-cause histogram went from
  `{enemyFire: 338, hazard: 85}` to `{enemyFire: 338, pit: 29, hazard: 30,
  bossShockwave: 2}`. Every Level 1 pit fall had been mislabelled; now pit falls
  and Level 2 spike deaths are counted separately, which is what makes the
  death-cause data worth anything.
- One gate refinement, forced by this fix:
  The first post-fix eval reported two "regressions": new `deathTrap` findings
  for `edgeNudger` at x=288 and x=576. Investigated rather than assumed - that
  policy dies 30 times spread across seven 96px buckets on the first screen (21
  enemyFire, 9 pit), and which buckets happen to cross the "3 deaths" threshold
  moves whenever anything shifts the run's timing. Phantom regressions on a
  correct fix.
  The gate now compares finding KINDS per run, not `kind@bucket`; the bucket
  detail stays in the report, where a human wants it, and in the "fixed" list.
  Re-proved the gate is still sharp: with the Level 2 door bug reinjected it
  exits 1 with 16 regressions, `completed=0`, `stuck=8`. Then reverted and
  rebuilt; `git diff` on the level file is empty.
- Files changed:
  - src/levels/levelSchema.ts (isLethalHazard + hazards doc)
  - src/scenes/LevelScene.ts (contact test), src/ai/pilot.ts (shared predicate)
  - scripts/eval/report.mjs (kind-level regression comparison)
  - tests/unit/levelHazards.test.ts (new), tests/e2e/bridgeContract.spec.ts (+1)
  - docs/eval/report.md, docs/eval/baseline.json (regenerated)
  - TASKS.md (027 completed)
- Commands run:
  - `npx vitest run tests/unit/levelHazards.test.ts` (5 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (301 passed, up from 296)
  - `npm run build` (pass)
  - `npx playwright test` (88 passed, up from 87)
  - `npm run eval -- --baseline` (exit 0 clean), `--update-baseline`, plus the
    reinjected-door-bug gate check (exit 1)
- Verification result:
  - All four acceptance criteria met. No balance change: a pit fall still costs
    exactly one life, it just resolves at the fall threshold as documented
    instead of on contact with the paint a few frames earlier.
- Visual quality notes:
  - none. The markers still render exactly as before; only their collision
    behaviour changed, and only to match what they were always documented to be.
- Status after: DONE. Not deployed (loop rules forbid it).
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-028 - the pilot cannot clear the Reactor Warden from a mid-level
    checkpoint. The largest of the open findings and the last before the harness
    chain (TASK-023/024) resumes.
- Blockers (if any):
  - none.

---

### 2026-09-12 21:20 - TASK-028 (pilot could not clear the Reactor Warden from a checkpoint)

- Status before: TODO (found by the evaluation harness: 30 deaths at one x).
- Outcome: every checkpoint x every weapon now completes. 12 configurations
  (2 levels x 3 checkpoints, plus Level 2 x 3 weapons) all end in `results`
  with ZERO findings.
- This turned out to be three distinct defects stacked on each other. Each was
  found by measuring, not by reasoning about the code.

  **1. The pilot fired away from the node it was attacking.**
  The probe showed `angle=-135` (up-LEFT) held constantly while the target node
  sat at x=2792, to the pilot's RIGHT. `subcomponentAttack` computed an exact
  standoff spot and walked toward it; that spot was BEHIND the player, and since
  movement is facing in this game, walking backwards pointed the gun backwards.
  Every shot flew into empty space, forever.
  Fixed by replacing the exact-spot seek with a firing band, plus hysteresis
  (`subRepositioning`): once the pilot backs off it keeps backing off until
  clearly outside the band, so the re-approach always ends moving TOWARD the
  node and leaves the gun on target. Without the latch it just oscillated
  between "back off" and "face the node" - the same fixed point one level up,
  which is exactly what the first attempt produced.

  **2. It stood at the wrong distance for the shot it was taking.**
  A node above gun level can only be hit on the 45-degree diagonal, and a
  45-degree shot rises one pixel per pixel travelled - so the horizontal
  distance must MATCH the height difference or the shot sails over. Standing
  closer is not better: the pilot ended up 1 px from a node firing straight up
  past it (`angle=-90`). The standoff is now derived from the geometry
  (`desiredGap = verticalOffset`) and measured from the MUZZLE, which spawns at
  the player's leading edge rather than the centre - an 11 px error that a
  scatter fan hid and the single-bolt weapons did not.
  Also added the safety net the task asked for: `SUB_NO_DAMAGE_STEPS` (240)
  without destroying a node forces a break-out, so no future geometry change can
  reintroduce a silent stalemate.

  **3. A game bug: every boss used the Siege Walker's hitbox.**
  With the pilot fixed, pulse and rapid still did `bossH: 8 -> 8` across 113
  vulnerable samples while standing on top of the boss. Cause:
  `resolvePlayerBulletsVsBoss` hard-codes `{ width: 64, height: 56 }` for every
  boss. The Reactor Warden is 72x72, so its collision box was 16 px short - body
  top y=408, box bottom y=464, and the player's gun is at exactly y=464. A
  horizontal bolt misses by one pixel. Only the scatter fan, whose pellets rise
  into the box, could damage it at all.
  This is user-facing and has nothing to do with the AI: a human carrying the
  DEFAULT pulse rifle cannot damage the final boss by firing at it. Fixed to
  read the boss definition. Measured: preboss + pulse went from game over after
  ~10,000 steps to a clear in 717 steps with zero findings.
- Scope note (recorded honestly): the task's non-goal said "the same fight is
  winnable from the level start today, so the fix belongs in the pilot". The
  evidence overturned that premise. Most of the defect was indeed in the pilot,
  but the last part was not, and the fix was folded in under the
  "Bug found and fixed (not pilot accommodation)" heading TASK-019 established
  for exactly this situation. The non-goal was amended rather than quietly
  ignored.
- Also fixed while in there: the vulnerable-window branch stopped advancing once
  within 24 px of the boss centre, which froze facing wherever the node attack
  had left it. A pre-existing unit test pinned that behaviour ("stands and fires
  once at point-blank"); it encoded the bug, so it was rewritten with the
  measurement that disproves it rather than deleted.
- Harness robustness: one matrix run failed with a 10 s `waitForFunction`
  timeout after 23 prior runs, and passed in isolation and on re-run - flake
  under browser load. Added a single retry per config, because a gate that goes
  red at random is a gate people stop reading, and a real defect reproduces.
- Files changed:
  - src/ai/pilot.ts (firing band + hysteresis + muzzle-relative distance +
    no-damage break-out + closer hold for node-gated bosses + vulnerable-window
    advance; `PilotMemory` gained subAttackSteps/lastSubAlive/subBreakout/
    subRepositioning/sawSubcomponents)
  - src/scenes/LevelScene.ts (boss hitbox reads the boss definition)
  - scripts/eval/index.mjs (retry), scripts/warden-wedge-probe.mjs (new)
  - tests/unit/pilot.test.ts (+8 positioning tests; 1 rewritten)
  - docs/eval/report.md, docs/eval/baseline.json (regenerated)
  - TASKS.md (028 completed, non-goal amended, bug recorded)
- Commands run:
  - `node scripts/warden-wedge-probe.mjs` (repeatedly, to diagnose each layer)
  - `node scripts/eval/run.mjs` across 12 checkpoint x weapon configurations
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (309 passed, up from 301)
  - `npm run build` (pass)
  - `npx playwright test` (88 passed)
  - `npm run eval -- --baseline` (exit 0, no regressions), `--update-baseline`
- Verification result:
  - All five acceptance criteria met.
  - Matrix-wide: completed 19 -> **25**, findings 26 -> **18**, critical 26 ->
    **18**, deaths 399 -> **240**. Ten deathTrap findings fixed, including every
    one in the Warden arena (x=2496, 2688, 2880).
  - Level 1 is untouched: `L1-start-30lives-pilot` still completes in exactly
    1438 steps with zero findings, the same as before the change. The
    `sawSubcomponents` gate is what keeps the Siege Walker tuning out of this.
- Visual quality notes:
  - none; no presentation change.
- Status after: DONE. Not deployed (loop rules forbid it).
- Remaining work:
  - none for this task.
- Next recommended task:
  - TASK-023 - MCP server for the game bridge. All four user-facing findings
    (025-028) are now closed, so the harness chain resumes.
- Blockers (if any):
  - none.

---

### 2026-09-12 21:35 - TASK-023 (MCP server for the game bridge)

- Status before: TODO
- Goal of this iteration:
  A stdio MCP server so an MCP client can start, observe and drive the game as
  tools, sharing `scripts/lib/` with the HTTP server so the two cannot drift.
- Work completed:
  - `scripts/lib/jsonrpc.mjs` - the pure half: a buffering line decoder and a
    dispatcher. Separated from the transport precisely so the whole protocol
    surface is unit-testable against a scripted byte stream with no child
    process, which is the difference between finding a framing bug in a test and
    finding it as "the client just will not connect".
  - `scripts/lib/mcpTools.mjs` - tool schemas and handlers, plus `compactState`.
    Kept out of the transport so the tool list can be asserted without spawning
    anything, and out of `bridge.mjs` so the HTTP server does not carry MCP
    concepts around.
  - `scripts/mcp-server.mjs` - wiring only.
  - `.mcp.json` at the repo root registers it for this project.
  - `scripts/mcp-smoke.mjs` - drives the real child process end to end.
- The five things that break a hand-rolled MCP server, all handled and pinned in
  `tests/unit/mcpProtocol.test.ts` (20 tests):
  1. **stdin does not arrive in message-sized chunks.** The decoder buffers
     until a newline; tested with a message split across three chunks, a
     trailing partial, CRLF, and blank lines.
  2. **A notification must produce NO response.** Replying to one is a protocol
     violation some clients drop the connection over. Tested for both a known
     and an unknown notification.
  3. **Unknown methods answer -32601** rather than crashing.
  4. **Every `inputSchema` is an object schema WITH a `properties` map**, even
     the empty one - the most common reason a tool is listed but never callable.
  5. **stdout carries protocol JSON and nothing else.** `console.log/info/warn`
     are redirected to stderr at startup, because one stray line from anywhere
     in the import graph corrupts the stream. The smoke test fails on any
     non-protocol stdout line.
  Also: only `tools` is advertised in `initialize`. Advertising `resources` or
  `prompts` without handlers makes a client call `resources/list` and fail on
  the missing method.
- Two deliberate shapes:
  - **Chromium launches lazily**, on the first tool call rather than at module
    load. A client that times out on the handshake never gets to call a tool, so
    `initialize` has to answer immediately.
  - **`run_eval` is asynchronous**: it returns a job id and the caller polls
    `eval_status`, because a full matrix takes ~40 s and a tool call should not
    block that long.
  - **`game_act`/`game_state` return a compact projection** (position, lives,
    weapon, counts, boss state, nearest enemy x) rather than the full snapshot
    with its enemy/projectile/subcomponent arrays - a couple of KB per call that
    would fill a session's context with data the caller rarely reads.
    `verbose: true` opts into everything.
  - `game_step` was dropped from the sketched tool list: it is `game_act` with
    an empty spec, and every redundant tool costs context in every session that
    lists them.
- Verification, from the real process (`node scripts/mcp-smoke.mjs`):
  - `initialize` -> `{ protocolVersion: '2025-06-18', capabilities: { tools: {} },
    serverInfo: { name: 'iron-echo', version: '0.1.0' } }`
  - `notifications/initialized` -> silent
  - `tools/list` -> 7 tools
  - `ping` -> `{}`; `resources/list` -> `-32601`
  - `tools/call game_start` -> playerX 60, lives 30
  - 6 x `tools/call game_act` -> playerX 386.08, lives 28, score 200 (it killed
    things on the way)
  - `tools/call nope` -> a RESULT with `isError: true`, not a JSON-RPC error, so
    the model sees it and adapts rather than the call failing outright
  - **unsolicited responses: 0, non-protocol stdout lines: 0**
- Files changed:
  - scripts/lib/jsonrpc.mjs, scripts/lib/mcpTools.mjs, scripts/mcp-server.mjs,
    scripts/mcp-smoke.mjs, .mcp.json (all new)
  - tests/unit/mcpProtocol.test.ts (new, 20 tests)
  - docs/AUTOMATION.md (MCP section)
  - TASKS.md (023 completed)
- Commands run:
  - `npx vitest run tests/unit/mcpProtocol.test.ts` (20 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (329 passed, up from 309)
  - `npm run build` (pass)
  - `npx playwright test` (88 passed)
  - `node scripts/mcp-smoke.mjs` (PASSED)
  - `npm run eval -- --baseline` (exit 0, no regressions)
- Verification result:
  - Every acceptance criterion met. No new npm dependencies: `node:child_process`,
    `node:fs` and the Playwright already used by the other drivers.
- Visual quality notes:
  - none; no gameplay or presentation change.
- Status after: DONE. Not deployed (loop rules forbid it).
- Remaining work:
  - none for this task. Note the server needs a target to drive: start
    `npm run preview -- --port 4173` or point `TARGET_URL` at the deployed site.
- Next recommended task:
  - TASK-024 - close the loop: eval findings become TASKS.md entries. That is the
    last task in the chain, and the one that makes the loop self-sustaining.
- Blockers (if any):
  - none.

---

### 2026-09-12 21:50 - TASK-024 (close the loop: eval findings become TASKS.md entries)

- Status before: TODO. Last task in the chain.
- Goal of this iteration:
  Give the development loop a PRODUCER. `.claude/loop.md` only consumes tasks
  and halts with `IDLE - NO READY WORK` when none remain; this supplies
  well-formed TODO entries from observed gameplay defects.
- Work completed:
  - `scripts/eval/proposeTasks.mjs`. A pure `proposeTasks(groups, tasksText,
    options)` returning `{ text, proposed, skipped, omitted }`, plus a thin CLI.
    Per-kind templates (stall, bossStall, deathTrap, freeDeath, respawnUnsafe,
    outOfBounds, nanField, monotonic, resourceBounds, structural,
    notCompletable) each produce a bounded requirement quoting the actual
    evidence, objective acceptance criteria, and non-goals - the same bar
    `ADD_ENHANCEMENT_PROMPT.md` sets for a hand-written task.
  - `scripts/eval/report.mjs` gained `writeFindings`, so the eval emits
    `docs/eval/findings.json` alongside the markdown report. Parsing the report
    back would have been fragile; the same grouping is written in a shape a
    script can consume.
  - `.claude/eval-loop.md` - the producer iteration prompt.
  - `docs/AUTOMATION.md` gained a "Findings become tasks" section; README now
    describes `npm run eval` and the MCP server.
- The design decision that matters:
  **The producer never edits `TASKS.md` and never touches source.** It writes
  `docs/eval/proposed-tasks.md` for review. A finding is evidence that something
  looked wrong, not a decision about what to do - proposing and fixing in one
  pass is how an unreviewed detector becomes an unreviewed code change. The loop
  prompt makes the reviewer choose per proposal between "real and worth fixing"
  (copy it across), "real but intended" (record the decision so it is not
  re-litigated), and "a detector problem" (narrow the detector and pin the false
  positive) - that third branch matters, because this session hit it three times
  and each one would otherwise have become a bogus task.
- Dedupe: every block carries a `Source: eval finding kind@bucket:Ln` line,
  which is both the evidence trail and the dedupe key. Verified by round-trip:
  copying one signature into `TASKS.md` and re-running turned
  `alreadyCovered=0` into `alreadyCovered=1`, and the proposal disappeared.
  `TASKS.md` was restored afterwards and `TASK-999` confirmed gone.
- Ranking and cap: competent-policy findings (`pilot`, `hiccup`) first, then
  severity, then how many runs saw them; capped at 5 by default because more
  than a handful at a time is not a backlog anyone reads. The header says how
  many were held back.
- Files changed:
  - scripts/eval/proposeTasks.mjs (new), scripts/eval/report.mjs (writeFindings),
    scripts/eval/index.mjs (emit findings.json)
  - .claude/eval-loop.md (new)
  - tests/unit/proposeTasks.test.ts (new, 9 tests)
  - docs/AUTOMATION.md, README.md
  - docs/eval/findings.json, docs/eval/proposed-tasks.md (generated)
  - TASKS.md (024 completed)
- Commands run:
  - `npx vitest run tests/unit/proposeTasks.test.ts` (9 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (338 passed, up from 329)
  - `npm run build` (pass)
  - `npx playwright test` (88 passed)
  - `npm run eval -- --baseline` (exit 0, no regressions)
  - `node scripts/eval/proposeTasks.mjs` against the real findings, and the
    dedupe round-trip described above
- Verification result:
  - All five acceptance criteria met. The fixture test feeds one stall and one
    boss stall and asserts two well-formed blocks with different requirements -
    a traversal stall and an unwinnable boss are not the same problem and must
    not get the same task text.
  - Run against the real evaluation it proposed 5 tasks starting at TASK-029,
    each quoting its evidence, run ids and policies.
- Visual quality notes:
  - none; tooling and docs only.
- Status after: DONE.
- **Every task in TASKS.md is now DONE.** The consumer loop would report
  `IDLE - NO READY WORK`; the producer loop (`.claude/eval-loop.md`) is what
  refills it. Running it now would propose from the 18 standing findings, all
  of which are chaos-policy death clusters that a reviewer should look at before
  any becomes a task.
- Remaining work:
  - none for this task. Nothing has been committed or deployed.
- Next recommended task:
  - none open. Run `.claude/eval-loop.md` to produce candidates, or add
    enhancements by hand. If the eval keeps coming back clean, the useful next
    move is a new variation axis or a new invariant in `scripts/eval/`, not a
    longer run of the same matrix.
- Blockers (if any):
  - none.

---

### 2026-09-12 22:05 - PRODUCER ITERATION (.claude/eval-loop.md), first real run

- Status before: every task in TASKS.md DONE; the consumer loop would report
  `IDLE - NO READY WORK`. This is the producer iteration that refills it.
- Ran: `npm run eval -- --baseline` -> exit 0, **no regressions**, 39 runs,
  25 completed, 18 standing findings (all `deathTrap`).
- **Triage outcome: no game defects. One detector fix, one new task.**

- **Detector fix (branch 3 of the loop): `detectDeathTrap` was far too loose.**
  It counted total deaths per 96 px bucket across a whole run. Measured against
  the real death logs, that is not the respawn-loop signature at all:

  | run | deaths | max in a bucket | consecutive | ended |
  |---|---|---|---|---|
  | edgeNudger L1 | 30 | 8 | **1** | gameOver |
  | hiccup L2 x2 | 8-10 | 3 | **3** | **results** |
  | doorCamper L2 | 30 | 20 | 9 | gameOver |
  | bossHugger L2 | 30 | 30 | 30 | gameOver |
  | jumper L1 | 29 | 25 | 25 | budget |

  The stuttering policy racked up 8 deaths in one bucket while never dying there
  twice in a row - its deaths ping-pong across seven buckets. And the perturbed
  pilot tripped the rule with 3 deaths spread over a boss fight it went on to
  WIN. Neither is a loop, and together they were drowning the real ones.
  Narrowed to **4 consecutive deaths in the same bucket**, which is the actual
  "die, respawn, walk back, die again" signature. Both measured false positives
  are now pinned as unit tests, alongside the true positive (the real Reactor
  Warden wedge, 4 in a row at x=2583).
  Effect: **18 findings -> 4**, all four genuine loops. No regressions.

- **Triage of the remaining four - all rejected, with reasons:**
  Every one comes from a chaos policy that refuses to use a core mechanic, and
  loops at the first obstacle a jump would clear. None were hit by `pilot` or
  `hiccup`, which is the signal that matters: **no respawn loop in this game is
  reachable by a competent player.**
  - `deathTrap@2304:L2` (bossHugger, 30 in a row at the x=2360 spike) - the most
    plausible of the four, so it was checked rather than waved away. Clearance
    from the preboss checkpoint to that spike is 98 px = 0.46 s at a full run.
    Level 1's mid checkpoint gives 118 px = 0.55 s to its pit. Comparable, so
    this is a consistent design choice and not an outlier. The policy simply
    never jumps. Rejected.
  - `deathTrap@768:L1` (crouchWalker, 9 in a row in the first pit) - crouching
    pins the player, so it stutters into the pit the level is built around.
    Rejected.
  - `deathTrap@3168:L1` (jumper, 25 in a row past completionX with the boss
    alive) - standing in the boss arena losing the fight. That is the encounter.
    Rejected.
  - `deathTrap@1920:L2` (doorCamper, 9 in a row past the door) - standing still
    in a firefight. Rejected.
  Recorded here so the next producer iteration does not re-litigate them.

- **New task filed: TASK-029 - coverage invariants.**
  The useful observation from this iteration is not in the findings, it is in
  what the findings CANNOT see. Every invariant today watches the player's state
  - stuck, died, out of bounds, counters moving the wrong way. None assert that
  combat functions. That is exactly the gap TASK-028's boss-hitbox bug fell
  through: the Reactor Warden was immune to level fire and nothing in the
  harness noticed, because the pilot simply "lost", which looks like difficulty.
  TASK-029 adds a coverage pass over a whole matrix run: every boss must be
  damaged, every archetype killable, every threatening archetype must land a
  hit. Its acceptance test is that reintroducing the TASK-028 hitbox makes
  `npm run eval` fail.

- Files changed:
  - scripts/eval/checks.mjs (consecutive-death rule + the reasoning)
  - tests/unit/evalChecks.test.ts (true positive updated, 2 measured false
    positives pinned)
  - docs/eval/report.md, docs/eval/findings.json, docs/eval/proposed-tasks.md
    (regenerated)
  - TASKS.md (TASK-029 filed)
- Commands run:
  - `npm run eval -- --baseline` (before: 18 findings; after: 4; exit 0 both times)
  - `node scripts/eval/proposeTasks.mjs`
  - `npx vitest run tests/unit/evalChecks.test.ts` (25 passed)
  - `npm run lint`, `npm run typecheck` (clean)
- Verification result:
  - The producer loop works end to end on real data, and its most valuable
    output on this run was a detector correction rather than a task - which is
    the branch that keeps the whole thing trustworthy. A detector that reports
    14 things nobody can act on is worse than one that reports 4 real ones.
- Status after: one `TODO` in the queue (TASK-029). No source or gameplay change.
- Next recommended task:
  - TASK-029 - coverage invariants.
- Blockers (if any):
  - none.

---

### 2026-09-12 22:30 - TASK-029 (coverage invariants: prove combat actually works)

- Status before: TODO (filed by the producer iteration that preceded it).
- Goal of this iteration:
  Close the gap that let TASK-028's boss-hitbox bug through. Every existing
  invariant watches the PLAYER - stuck, dead, out of bounds, counters moving the
  wrong way. None notice when an ACTOR stops working, because a broken enemy
  just makes the game easier and a boss that cannot be hurt reads as difficulty.
- Work completed:
  - Runtime telemetry (`LevelRuntime`): `bossId`, `bossDamageTaken`,
    `killsByKind`, `damageByKind`. Enemy bullets gained a `sourceKind` so a hit
    on the player can be attributed to the archetype that fired it; boss fire is
    attributed to the boss id, so coverage can tell "the grenadier never hit
    anyone" from "the boss did all the damage".
  - `checkCoverage(traces)` in `scripts/eval/checks.mjs` - pure, browser-free,
    and judged over the WHOLE matrix rather than per run, because one run has no
    business meeting every archetype. An archetype that never appeared anywhere
    is untested, not broken, and is reported as neither.
  - Wired into `scripts/eval/index.mjs` as a synthetic `matrix-coverage` trace,
    so it flows through the same report, baseline and exit code as everything else.
- **The first version did not catch the bug it was built for, and the honest
  test is what showed it.**
  I reintroduced the TASK-028 hitbox and ran the matrix: coverage reported
  nothing. The reason is that my question was too weak. I had asked "is this
  boss damageable at all", and the answer was yes - the scatter fan's pellets
  rise into the short hitbox and still connect. The actual defect was "immune to
  most weapons".
  Sharpened to ask it **per weapon**: every (boss, weapon) pair with at least 20
  samples of active fight must have landed damage somewhere in the matrix. The
  20-sample floor matters - a run where the player meets the boss and dies
  immediately proves nothing about that weapon.
  With the bug reintroduced it now reports, exactly:
    `coverageBossWeaponIneffective: boss "reactorWarden" never took damage from
     the "pulse" weapon across 658 samples of active fight`
  and the same for `rapid`. That is the difference between "the pilot lost",
  which looks like difficulty, and a named defect.
  Reverted and confirmed by `diff`; the clean matrix reports no coverage
  findings and the gate exits 0.
- Note on what the gate already caught: even before the per-weapon rule, the
  bug made `npm run eval` exit 1 - through baseline regressions, because runs
  that used to complete stopped completing. So the safety net worked; what it
  did not do was SAY WHAT WAS WRONG. Coverage is the difference between a red
  light and a diagnosis.
- Files changed:
  - src/debug/runtimeTypes.ts (bossId, bossDamageTaken, killsByKind, damageByKind)
  - src/scenes/LevelScene.ts (sourceKind on enemy bullets, kill/damage/boss-damage
    tallies, publish, reset)
  - scripts/eval/checks.mjs (checkCoverage + per-weapon rule), scripts/eval/run.mjs
    (coverage inputs in the sample projection), scripts/eval/index.mjs (matrix pass)
  - tests/unit/evalChecks.test.ts (+7 coverage tests), tests/unit/pilot.test.ts
    (fixture fields)
  - docs/AUTOMATION.md (coverage invariant and why it exists)
  - docs/eval/report.md, baseline.json, findings.json (regenerated)
  - TASKS.md (029 completed)
- Commands run:
  - `npx vitest run tests/unit/evalChecks.test.ts` (32 passed)
  - `npm run lint`, `npm run typecheck` (clean)
  - `npm run test:unit` (347 passed, up from 340)
  - `npm run build` (pass)
  - `npx playwright test` (88 passed)
  - `npm run eval -- --baseline` clean (exit 0) and with the hitbox bug
    reintroduced (exit 1, coverage naming both weapons), then `--update-baseline`
- Verification result:
  - All eight acceptance criteria met, including the one that mattered:
    reintroducing the TASK-028 hitbox makes `npm run eval` report the failure.
  - No gameplay change. The added telemetry is published-only; no rule, balance
    value or enemy behaviour was touched.
- Visual quality notes:
  - none.
- Status after: DONE. Every task in TASKS.md is DONE again.
- Remaining work:
  - none. Nothing committed or deployed.
- Next recommended task:
  - none open. Run `.claude/eval-loop.md` to look for more. Worth noting for
    whoever does: the harness now has three kinds of question - is the player
    stuck, did the player die badly, and does combat work. A fourth worth
    considering is whether the game's STATE MACHINE is sound (can every scene be
    reached and left, does pause/resume survive every state), which nothing
    currently asks.
- Blockers (if any):
  - none.

---

### 2026-09-12 22:25 - DEPLOYMENT (not a TASKS.md task)

- Status before: TASK-020 through TASK-029 complete locally, never deployed.
  The live site was still running the TASK-019 build from 2026-08-12.
- Authorization note:
  `CLAUDE.md` forbids deploying ("Never push, deploy, change cloud resources, or
  modify DNS"). The user asked directly - "deploy latest code to web site in
  cloudflare" - which is a one-off override for this action only, the same
  precedent as the 2026-07-26, TASK-017, TASK-018 and TASK-019 deploys. The repo
  rules are unchanged. No credentials were requested, printed, or stored:
  `wrangler whoami` showed an existing OAuth session already carrying
  `pages (write)`.
- Work completed:
  - Verified before shipping: 347 unit tests, 88 e2e, lint, typecheck, build all
    green, and `npm run eval -- --baseline` clean.
  - `npx wrangler pages deploy dist --project-name run-and-gun --branch main`.
  - Deployed the WORKING TREE, not a commit: 36 files were uncommitted at the
    time, and wrangler warned about it. The live build therefore does not
    correspond to any recorded revision. Flagged to the user; committing is
    theirs to decide.
- Verification result:
  - `https://run-and-gun.pages.dev` HTTP 200, serving `index-VwXErcEi.js`.
  - Byte-for-byte match with the local build: 1,503,325 bytes both sides.
  - `node scripts/live-check.mjs` PASSED - cache headers, plain load with zero
    console/page errors, title scene, level start, movement, the Z/X bindings,
    and the Siege Walker activating.
  - `node scripts/test-live.mjs --grep-invert @slow-live` -> **87/87 passed**
    against production (chromium + msedge). The soak spec is tagged `@slow-live`
    and is skipped over the CDN by design, not weakened.
  - The headline gameplay fix verified ON PRODUCTION rather than assumed: the
    Reactor Warden now falls to every weapon from the preboss checkpoint -
    pulse 717 steps, scatter 1333, rapid 564, all `ended=results` with zero
    findings. Before TASK-028 that configuration was a game over after ~10,000
    steps, because the boss used the Siege Walker's hitbox and a horizontal bolt
    missed it by one pixel.
- What is now live that was not before:
  - The boss-hitbox fix (a human with the default pulse rifle can damage the
    final boss), the dropped-keypress fix on AI takeover, pit deaths always
    costing a life, pit markers no longer lethal on contact, and a pilot that
    clears both levels from any checkpoint with any weapon.
  - The debug bridge gained `startAtCheckpoint`, `confirmMenu`/`backMenu`, and
    crouch/drop inputs. All of it is inert without `?debug`, so a normal visitor
    sees no change beyond the gameplay fixes.
- Status after: deployed to production.
- Remaining work:
  - The working tree is still uncommitted. Committing would make the live build
    traceable to a revision; that is the user's call.

---
