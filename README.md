# Operation Iron Echo

An original browser-based side-scrolling run-and-gun action game, inspired by
the feel of classic arcade run-and-gun design. Built with TypeScript, Phaser,
and Vite. All art is original, procedurally authored pixel art - no external
or copyrighted assets, sprites, maps, music, or ROM content.

## Play

Serve the contents of `dist/` from any static host and open `index.html`.
The game runs entirely in the browser; there is no backend.

## Controls

| Action | Keyboard | Gamepad | Touch |
| ------ | -------- | ------- | ----- |
| Move / aim | A/D or arrows | D-pad / left stick | on-screen buttons |
| Jump | Space / W / Up | A | JUMP button |
| Crouch / drop | S / Down | Down | - |
| Fire | J / K / Enter | X or RB | FIRE button |
| Pause | Esc | Start | pause button |
| Menus | Enter/Space, Esc | A/Start, Back | tap |

Hold a direction while firing to shoot in 8 directions. F10 toggles
fullscreen. High score and settings (volume, mute, reduced flash) persist in
local storage.

## Game content

- 2 themed levels: Jungle Outpost (dusk jungle war zone) and Fortress
  Interior (industrial stronghold), each with enemy waves, pickups,
  checkpoints, and a boss arena.
- 4 enemy archetypes: Runner, Sentry, Drone, Grenadier.
- 2 multi-phase bosses: the Siege Walker and the Reactor Warden.
- 3 weapons: Pulse Rifle, Scatter Blaster, Rapid Carbine.
- A prototype room (press P on the title screen) used as the visual/mechanics
  testbed.

## Development

```bash
npm install
npm run dev        # local dev server
npm run build      # production bundle in dist/
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run test:unit  # Vitest unit tests
npm run test:e2e   # Playwright end-to-end tests (builds + serves dist)
```

Project layout:

- `src/simulation/` - pure, deterministic gameplay logic (unit-tested)
- `src/scenes/` - Phaser scenes (title, levels, menus)
- `src/art/` - original pixel-art sprite sheet, texture compiler, themes
- `src/levels/` - data-driven level definitions
- `tests/` - Vitest unit tests and Playwright e2e specs
- `scripts/` - one-off visual-inspection capture utilities

## Deployment

`npm run build` produces a fully static `dist/` (relative asset paths) ready
for Cloudflare Pages or any static host. Deployment is performed manually.

## Asset policy

Everything visible and audible in the game is original work authored for this
project (procedural pixel art and synthesized audio). Do not add copied
commercial game assets or extracted ROM content.
