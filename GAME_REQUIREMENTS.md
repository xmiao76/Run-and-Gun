# Game Requirements - Operation Iron Echo

## 1. Product goal

Build an original, compact, polished browser run-and-gun game that evokes the pace and clarity of 1980s and 1990s arcade action games without copying any protected expression from an existing commercial title.

The first public release is a **single-player two-level vertical slice**, not a complete recreation of Contra.

## 2. Target platforms

- Current desktop Chromium, Firefox, and Safari
- Keyboard as the primary input
- Standard browser Gamepad API support
- Responsive layout usable on tablets and modern phones
- Touch controls required for basic play on mobile, but desktop quality has priority
- Static hosting on Cloudflare Pages

## 3. Presentation

- Logical game resolution: 960 x 540, scaled while preserving aspect ratio
- Original pixel-art-inspired visual language created from simple original sprites, SVG, procedural shapes, or permissively licensed assets
- Readable silhouettes and high contrast between player, enemies, bullets, and terrain
- 60 Hz target simulation and smooth rendering on ordinary integrated graphics
- Optional fullscreen
- Pause, mute, and volume controls
- Reduced-flash option that limits rapid full-screen flashes

## 4. Core player mechanics

The player must be able to:

- move left and right;
- jump with variable-height behavior based on button hold within a bounded window;
- drop through explicitly marked one-way platforms;
- crouch while grounded;
- aim and fire in eight directions where level geometry permits;
- fire while standing, crouching, jumping, and moving;
- take damage, enter a brief invulnerability state, and respawn at a checkpoint;
- collect weapon and health pickups;
- pause and resume the game;
- restart the current level;
- complete a level and proceed to the next one.

The player has three lives by default. Losing all lives shows a game-over screen with restart and return-to-title actions.

## 5. Weapons

Implement exactly three player weapons for the first release:

1. **Pulse Rifle** - default, medium fire rate, one projectile stream.
2. **Scatter Blaster** - multiple projectiles with limited spread and lower per-projectile damage.
3. **Rapid Carbine** - faster fire rate with lower damage per shot.

Requirements:

- weapon behavior is data-driven;
- fire-rate limits are deterministic;
- bullets have bounded lifetime and are pooled or safely cleaned up;
- pickups visibly identify the weapon;
- weapon balance values live in a dedicated configuration module;
- no weapon uses names, visual designs, or effects copied from Contra.

## 6. Enemies

Implement exactly four regular enemy archetypes:

1. **Runner** - moves toward a tactical point near the player and fires intermittently.
2. **Sentry** - stationary or limited-arc turret with telegraphed shots.
3. **Drone** - follows a bounded aerial path and fires downward or diagonally.
4. **Grenadier** - keeps distance and launches a visible arcing projectile.

Enemy requirements:

- enemies use finite-state or behavior-state logic;
- attacks have readable telegraphs;
- enemy projectiles are visually distinct from player projectiles;
- off-screen spawning is controlled by level trigger data;
- enemies cannot spawn directly on top of the player;
- enemy counts and attack cadence are capped to prevent unfair overlap;
- deterministic logic is testable without rendering where practical.

## 7. Bosses

Implement exactly two original bosses, one per level:

- **Level 1: Siege Walker** - ground machine with three readable attack patterns and a vulnerable phase.
- **Level 2: Reactor Warden** - stationary or semi-mobile fortress core with two phases and destructible subcomponents.

Boss requirements:

- attacks are telegraphed;
- phases are data-driven;
- health is displayed;
- the boss cannot damage the player before the player gains control;
- defeating the boss ends the level after a short non-interactive sequence;
- phase transitions cannot deadlock.

## 8. Levels

Implement exactly two original levels.

### Level 1 - Jungle Outpost

- Side-scrolling exterior environment
- Teaches movement, jumping, aiming, weapon pickups, and checkpoints
- Includes pits, one-way platforms, destructible containers, and four enemy archetypes introduced gradually
- Ends with the Siege Walker boss
- Target first-play completion time: 5 to 8 minutes

### Level 2 - Fortress Interior

- Side-scrolling industrial environment
- Uses moving platforms, hazards, doors, and denser combinations of previously learned enemies
- Introduces no new regular enemy archetype
- Ends with the Reactor Warden boss
- Target first-play completion time: 6 to 10 minutes

Do not implement the original Contra base corridor, original level layouts, or recognizable map reproductions.

## 9. Checkpoints and persistence

- Each level has at least two checkpoints, including the level start.
- A checkpoint stores level ID, checkpoint ID, lives, score, and current weapon.
- Runtime checkpoint state may be in memory.
- User settings and best score persist through localStorage.
- Saved data must be versioned and validated before use.
- Corrupt or incompatible local data must fall back safely to defaults.
- No cloud saves or user accounts.

## 10. Scoring and difficulty

- Score is awarded for enemies, destructible targets, bosses, and level completion.
- A visible score counter is present during play.
- Implement Normal difficulty only for the first release.
- Difficulty values live in a central balance file.
- The game must be completable by a competent first-time player after learning enemy patterns.
- Avoid invisible damage, unavoidable spawn hits, and attacks without telegraphing.

## 11. User interface

Required screens and overlays:

- Loading screen
- Title screen
- Controls/help screen
- Settings screen
- In-game HUD
- Pause overlay
- Level-complete screen
- Game-over screen
- Final completion screen

The title screen must clearly use the original title **Operation Iron Echo**, not Contra branding.

## 12. Audio

- Background music and sound effects must be original, procedural, public domain, or permissively licensed and documented.
- Provide independent music and sound-effect volume controls.
- Start audio only after user interaction, following browser autoplay restrictions.
- The game remains playable when audio initialization fails.

## 13. Debug and test support

In development or when explicitly enabled with a debug query parameter, expose a minimal read-only bridge such as `window.__GAME_DEBUG__` that can report:

- current scene and level;
- player position, lives, weapon, and invulnerability state;
- active enemy and projectile counts;
- current checkpoint;
- boss phase and health;
- game status.

Debug helpers must not expose secrets, enable remote code, or materially change normal gameplay.

## 14. Explicitly out of scope

- Online or network multiplayer
- Local two-player mode
- Accounts, leaderboards, cloud saves, or backend APIs
- Procedural level generation
- Modding or user-generated content
- More than two levels, four regular enemy types, three weapons, or two bosses
- Original Contra characters, story, names, sprites, maps, animations, sounds, music, text, UI, logos, or ROM content
- Monetization, advertising, analytics, or tracking
