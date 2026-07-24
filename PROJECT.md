# PROJECT.md

## Project name

Operation Iron Echo

## Project purpose

Build an original browser-based side-scrolling run-and-gun action game inspired by the feel of classic Contra-style arcade gameplay.

The game must be playable in a web browser and deployable as a static site.
The game must NOT be an abstract block prototype. It must include recognizable characters, weapons, enemies, environments, and combat scenes with clear visual identity.

## Product goal

Create a polished first playable version with:

- visually recognizable player character art
- recognizable weapon visuals
- recognizable enemy soldier/creature/machine visuals
- readable battle scenes
- detailed level environments and backgrounds
- basic animation and visual effects
- responsive gameplay and satisfying combat feel

This first release should feel like a real game prototype, not a bare logic demo.

## Target platform

- Web browser
- Static deployment target: Cloudflare Pages
- No backend required

## Technology

- TypeScript
- Phaser 3
- Vite
- npm
- Vitest
- Playwright
- ESLint

## Package manager

- npm

## Expected commands

The project should expose these commands in `package.json`:

- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run typecheck`
- `npm run test:unit`
- `npm run test:e2e`

If a command is not yet available, create it as part of implementation.

## Core gameplay requirements

### Genre and style

- side-scrolling run-and-gun action game
- fast movement and shooting
- inspired by classic Contra-like pacing
- original game title, original art, original level design
- no direct copying of copyrighted commercial sprites, maps, music, logos, or names

### Player abilities

The player character must support:

- move left and right
- jump
- crouch
- shoot
- aim horizontally and diagonally where appropriate
- take damage and die
- respawn from checkpoint when lives remain

### Weapons

Initial release must include at least:

- standard rifle
- spread weapon
- rapid-fire weapon

Each weapon must have:

- a distinct projectile behavior
- a distinct visual identity
- readable firing feedback

### Enemies

Initial release must include at least 4 enemy types, for example:

- basic foot soldier
- elevated shooter / turret
- jumping attacker or rushing attacker
- tougher armored enemy or mechanical enemy

Enemies must be visually distinguishable from one another.

### Bosses

Initial release must include at least 2 bosses:

- Boss 1 at the end of level 1
- Final Boss at the end of level 2

Bosses must be visually larger and more detailed than normal enemies and must have readable attack patterns.

### Levels

Initial release must include at least 2 full levels:

- Level 1: outdoor war zone / jungle / ruined battlefield theme
- Level 2: enemy base / fortress / industrial interior theme

Each level must include:

- terrain/platform layout
- enemy placement
- pickups
- one or more checkpoints
- a final boss encounter

### Game flow

The game must include:

- title screen
- start game
- pause/resume
- game over
- victory / completion screen
- restart after death or game over

### Controls

The game must support:

- keyboard controls
- gamepad support if feasible in first release
- touch controls for mobile as a later first-release task if time permits

### Persistence

Use browser local storage for:

- high score
- last chosen settings such as sound volume or mute

## Visual requirements

This section is critical.

The game must NOT use only simple rectangles or abstract colored blocks for the main presentation.

### Required visual standard

The game must include:

- a recognizable human-like player character sprite
- visible weapon in hand or clearly associated weapon art
- recognizable enemy sprites
- real environment art rather than plain color blocks
- a readable HUD
- projectile visuals
- explosion / hit effects
- decorative backgrounds

### Acceptable art style

The preferred style is:

- stylized pixel art, or
- stylized 2D illustrated sprite art

The exact style can be chosen during implementation, but it must remain visually consistent.

### Minimum visual fidelity for release

For the first release, the agent must aim for:

- a coherent art direction across player, enemies, environment, and HUD
- sprite-based characters instead of abstract placeholders
- tiled or painted level backgrounds
- parallax or layered background in at least one level if feasible
- visible animation states for player: idle, run, jump, crouch, shoot, hurt, death
- visible animation states for enemies where appropriate
- readable muzzle flash / bullet / impact / explosion feedback

### Temporary placeholders policy

Temporary placeholders are allowed only during development, but they must be replaced before a task is marked complete if the task concerns user-facing gameplay presentation.

Temporary placeholders should be:

- simple but recognizable silhouettes
- not just generic colored blocks
- clearly labeled in progress notes if still temporary

A gameplay system must not be called "complete" if it only works with abstract block visuals when the task requires representational art.

## Audio requirements

Initial release should include basic audio feedback:

- shooting sound
- hit/explosion sound
- player death sound
- simple background music if feasible

Audio can be simple and original, but the game should not feel silent unless explicitly documented as temporary.

## Non-goals for initial release

Do NOT include these in the first release unless explicitly added later as enhancements:

- online multiplayer
- accounts / login
- cloud save
- backend APIs
- leaderboard service
- level editor
- procedural generation
- more than 2 core levels
- copying original Contra art, music, enemy designs, or level layouts

## Quality expectations

The project should be built as a maintainable codebase, not a one-off demo.

Prefer:

- clean scene separation
- reusable entity / combat logic
- data-driven level or enemy definitions where practical
- tests for non-trivial gameplay logic
- stable browser build

## Completion expectation for first release

The first release is complete only when:

- both levels are playable from start to finish
- both bosses are implemented
- the player, weapons, enemies, and levels all use recognizable non-abstract visuals
- the game builds successfully
- lint, typecheck, unit tests, and E2E tests pass
- the game can be served as a static site ready for Cloudflare Pages deployment