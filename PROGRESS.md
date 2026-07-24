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