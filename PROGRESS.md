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