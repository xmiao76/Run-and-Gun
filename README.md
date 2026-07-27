# Operation Iron Echo

An original browser-based side-scrolling run-and-gun action game, inspired by
the feel of classic arcade run-and-gun design. Built with TypeScript, Phaser,
and Vite. All art is original, procedurally authored pixel art - no external
or copyrighted assets, sprites, maps, music, or ROM content.

## Play

**Live: https://run-and-gun.pages.dev**

Or serve the contents of `dist/` from any static host and open `index.html`.
The game runs entirely in the browser; there is no backend.

## Controls

The keyboard layout follows the classic PC/emulated run-and-gun convention:
the arrow cluster is the D-pad (right hand) and `Z`/`X` are the face buttons
(left hand). WASD, `Space`, and `J`/`K`/`Enter` also work as aliases.

| Action | Keyboard | Gamepad | Touch |
| ------ | -------- | ------- | ----- |
| Move | Arrow Left/Right (or A/D) | D-pad / left stick | on-screen buttons |
| Aim up | Arrow Up (or W) | Up | ▲ button |
| Crouch / drop | Arrow Down (or S) | Down | - |
| Jump | `Z` (or Space) | A | JUMP button |
| Fire | `X` (or J/K/Enter) | X or RB | FIRE button |
| Pause | Esc | Start | pause button |
| Menus | Enter/Space, Esc | A/Start, Back | tap |

Aiming up is a dedicated key, so you can fire diagonally: hold Arrow Up plus a
direction and fire for a 45-degree shot. Holding Down while airborne fires
downward; on the ground it is crouch-fire. F10 toggles fullscreen. High score
and settings (volume, mute, reduced flash) persist in local storage.

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
for Cloudflare Pages or any static host.

Deployed to Cloudflare Pages as project `run-and-gun` by direct upload (no Git
integration, so deploys never require pushing the repo):

```bash
npm run deploy        # build + wrangler pages deploy dist
```

This needs an authenticated Cloudflare session (`npx wrangler login`) with
`pages (write)` scope. Never place an API token in the repo or in a command
argument. After deploying, smoke-test the live site:

```bash
node scripts/live-check.mjs https://run-and-gun.pages.dev
```

## Asset policy

Everything visible and audible in the game is original work authored for this
project (procedural pixel art and synthesized audio). Do not add copied
commercial game assets or extracted ROM content.
