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
and settings (volume, mute, reduced flash, starting lives) persist in local
storage.

Press `S` on the title screen for settings. Starting lives default to **30**, so
you can see both levels without a quick game over; cycle to 10, 5, or 3 with the
`L` key, where 3 is the authentic arcade run. At high counts the HUD shows one
icon plus a multiplier (`x30`) rather than a row of thirty icons.

## Troubleshooting: some keys do nothing

**Symptom.** The game runs, but certain keys are dead — commonly `Z`, `X`, `S`,
or `D` — and it works in one browser while failing in another.

**Most likely cause: a browser extension is claiming those letters.** Extensions
register their shortcuts globally and can consume a key before the page ever
sees it. Extensions are installed per browser profile, which is exactly why the
game can work in Chrome and fail in Edge on the same machine.

A confirmed real case: the **Global Speed** video-speed extension in Edge
swallowed `S` and `X`. Video-speed controllers typically bind bare letters —
`S` slower, `D` faster, `Z` rewind, `X` advance — which collides with four of
this game's bindings (`S` crouch, `D` right, `Z` jump, `X` fire).

**Diagnose it in 15 seconds.** Open the game with the input diagnostic:

```
https://run-and-gun.pages.dev/?keys=1&debug=1
```

A panel appears at the top listing every key event the page receives and the
action it resolved to. Press the dead key and read the result:

| What the panel shows | Meaning | Fix |
| --- | --- | --- |
| **Nothing at all** | Something outside the page is swallowing the key — almost always an extension | Disable the extension, exclude this site in its options, or use the alias keys below |
| Rows with `composing=true` or `key=Process` | An IME (e.g. Microsoft Pinyin) is intercepting typing | Switch the input language to English while playing; the game also falls back to `keyCode`, so this normally still works |
| Rows resolving to `jump` / `fire`, but nothing happens in game | Input is fine; the game is paused | Check `paused=` / `autoPaused=` on the panel's second line, then click the game or press Esc |

**Workaround without touching extensions.** Every action has an alias on a
different key, so you can dodge a conflict: `Space` jumps and `J`, `K`, or
`Enter` fires, alongside the arrow keys for movement.

The game registers its key listeners in the capture phase on `window`, which
runs before any document-level listener and defeats many such conflicts — but an
extension whose own listener also captures on `window` and runs first can still
win, so the diagnostic above remains the way to identify it.

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
node scripts/live-check.mjs https://run-and-gun.pages.dev   # headers + gameplay
node scripts/reload-check.mjs                               # no hard reload needed
```

### Cache policy

`public/_headers` sets the rule that makes a deploy apply on a **plain reload**,
with no hard reload ever required:

- `index.html` has a stable name and points at the hashed bundle, so it is
  `max-age=0, must-revalidate` — every load checks the server.
- `assets/*.js` / `assets/*.css` are content-hashed by Vite (a new build means a
  new filename), so they are `immutable` for a year and load instantly on
  repeat visits.
- Stable-named files such as `assets/images/favicon.svg` are deliberately left
  revalidating, so they are never frozen.

`scripts/live-check.mjs` asserts these headers after every deploy so the policy
cannot silently regress.

## Asset policy

Everything visible and audible in the game is original work authored for this
project (procedural pixel art and synthesized audio). Do not add copied
commercial game assets or extracted ROM content.
