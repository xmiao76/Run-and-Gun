# Progress Log

## Current status

- Current milestone: M0 - Repository bootstrap (COMPLETE this iteration)
- Overall state: M0 complete; full quality gate GREEN; title-screen vertical slice rendering in browser
- Last verified commit: M0 bootstrap commit created this iteration (resolve with `git log -1`); the verified tree is the working tree committed in that commit
- Last full quality gate: 2026-07-22 ~01:01 local — all five commands exit 0 (see table)

## Acceptance summary

- Completed this iteration: A1, A2, A3, A4, A5, A6, A7, A8, B1, B2, J5, J6, J8 (13)
- Remaining: all gameplay/persistence/input criteria (B3-B6, C-E, F-H, I, J1-J4, J7) - deferred to M1-M7

## Current iteration plan

M0 bootstrap + smallest coherent title-screen vertical slice:

1. Add strict toolchain config (TypeScript, Vite, Vitest, Playwright, ESLint flat config) and required npm scripts.
2. Add `index.html` entry and `src/` skeleton aligned with ARCHITECTURE.md (`app/`, `scenes/`, `debug/`).
3. Implement Boot (loading) -> Title scene flow rendering the original title with system fonts only (no asset files).
4. Add a minimal, debug-gated read-only bridge (`window.__GAME_DEBUG__`) plus a debug-gated renderer override so headless automation can use Canvas 2D while production keeps WebGL.
5. Add one unit test file (`config`) and one Playwright title-screen test.
6. Run the full quality gate; fix the one environment-specific failure (headless WebGL shader compile) via the renderer override; re-run until green.

Next iteration: M1 - deterministic mechanics sandbox (normalized input, movement/jump/crouch/aim/fire in a test arena, Pulse Rifle + cleanup, damage/invulnerability/lives/checkpoint respawn, debug bridge expansion + tests).

## Completed work

New / changed files this iteration:

- `package.json` - renamed to `operation-iron-echo`, set `"type": "module"`, `"private": true`, and the full script set (`dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `test:watch`, `test:e2e`). Dependencies unchanged from bootstrap lockfile.
- `tsconfig.json` - strict TypeScript, `bundler` resolution, `noEmit`, DOM libs, `types: ["vite/client"]`, includes `src`, `tests`, and the TS config files.
- `vite.config.ts` - `base: './'`, Vitest `test` block (node environment, unit+integration includes, v8 coverage provider).
- `vitest` is driven through `vite.config.ts`; no separate vitest config needed.
- `playwright.config.ts` - single `chromium` project, failure-only screenshot/trace, `webServer` builds then previews the production bundle on port 4173.
- `eslint.config.js` - flat config: `@eslint/js` recommended + `typescript-eslint` recommended, build/test artifact ignores, `no-undef` off for TS.
- `index.html` - Vite entry, `<title>Operation Iron Echo</title>`, full-bleed `#game` container, inline data favicon (no asset file).
- `src/app/config.ts` - `GAME_TITLE`, `TITLE_HEADING`, `GAME_VERSION`, `LOGICAL_WIDTH=960`, `LOGICAL_HEIGHT=540`, `SCENE_KEYS`.
- `src/app/createGame.ts` - Phaser `Game` factory (FIT scaling, center-both, scene list).
- `src/app/renderer.ts` - `resolveRenderer()`; `AUTO` for users, debug-gated `canvas`/`webgl` override for automation.
- `src/debug/debugBridge.ts` - read-only `window.__GAME_DEBUG__.getState()` installed only in dev or with `?debug`; reports scene + title heading.
- `src/scenes/BootScene.ts` - minimal loading label, transitions to title.
- `src/scenes/TitleScene.ts` - renders title heading, tagline, version label (system monospace font), gentle heading pulse.
- `src/main.ts` - installs debug bridge, mounts game into `#game`.
- `tests/unit/config.test.ts` - 4 deterministic config assertions.
- `tests/e2e/title.spec.ts` - loads built site with `?debug=1&renderer=canvas`, asserts canvas visible, scene `title`, exact title strings via the bridge, and no uncaught `pageerror`.
- `ACCEPTANCE_CRITERIA.md` - checked A1-A8, B1, B2, J5, J6, J8 with evidence below.
- `PROGRESS.md` - this evidence log.

No files were created under `public/assets/`; the title screen uses system fonts and procedural text only, so ASSET_POLICY.md's manifest correctly remains empty (no non-code assets committed yet).

## Verification evidence

| Date/time (local) | Command or check | Result | Notes |
|---|---|---|---|
| 2026-07-22 00:56 | `npm run lint` | PASS (exit 0) | `eslint .`, flat config, no warnings |
| 2026-07-22 01:01 | `npm run typecheck` | PASS (exit 0) | `tsc --noEmit`, strict mode |
| 2026-07-22 01:01 | `npm run test` | PASS (exit 0) | Vitest 4.1.10: 1 file, 4 tests passed |
| 2026-07-22 01:01 | `npm run test:e2e` | PASS (exit 0) | Playwright 1.61.1, 1 worker, chromium: 1 passed (~7.2s incl. webServer build+preview) |
| 2026-07-22 01:01 | `npm run build` | PASS (exit 0) | Vite 8.1.5; `dist/index.html` 0.71 kB; `dist/assets/index-*.js` 1,377.89 kB raw / **358.91 kB gzip** (under the 2.5 MB budget); 12 modules transformed |
| 2026-07-22 01:02 | `npm ci --dry-run` | PASS (exit 0) | "up to date" -> committed `package-lock.json` is consistent with `package.json` (A1) |
| 2026-07-22 01:03 | `npm run dev` probe (port 5173) | PASS | `GET /` -> 200 with `<title>Operation Iron Echo</title>` and `/src/main.ts`; `GET /src/main.ts` -> 200 (A2) |
| 2026-07-22 01:03 | Forbidden-term scan (`src`, `index.html`) | PASS | No `contra`/`probotector`/`konami` in UI or metadata; the sole `src` hit is a policy comment in `config.ts` prohibiting Contra branding (J8) |
| 2026-07-22 01:03 | One-off title screenshot (preview, `?debug=1&renderer=canvas`) | PASS | Canvas paints dark background + "OPERATION IRON ECHO" heading + tagline + version footer; saved to OS temp (not committed) |

Build output note: Vite emits a "some chunks are larger than 500 kB" advisory because Phaser is bundled into one chunk (~1.38 MB raw / 0.36 MB gzip). This is expected for M0 (no code-splitting needed yet) and is within the ARCHITECTURE.md performance budget; recorded here, not treated as a failure.

## Manual playtest notes

- Headless Chromium (SwiftShader) cannot compile Phaser 4's WebGL shaders, which surfaced as an uncaught `pageerror` ("Vertex Shader failed") on the first E2E run while the scene logic itself was correct. Fixed deterministically per TEST_PLAN section 4: a debug-gated `renderer=canvas` query parameter forces the Canvas 2D backend for automation; real users keep `Phaser.AUTO` (WebGL). The no-`pageerror` assertion was kept, not weakened.
- Visual confirmation via the one-off screenshot (above) shows the title screen renders correctly on the Canvas backend. A full manual keyboard playtest is not applicable at M0 (no gameplay yet); it begins in M1/M3 per TEST_PLAN section 6.

## Known issues

- None blocking. Open advisories: Vite chunk-size warning (expected, under budget); headless-WebGL shader limitation (mitigated for automation via the canvas debug override; unaffected on real GPUs).

## Next recommended task

Proceed to **M1 - Deterministic mechanics sandbox**: normalized `InputState`, a small test arena with player movement/jump/crouch/aim/fire, the Pulse Rifle with bounded projectile cleanup, damage + invulnerability + life loss + deterministic checkpoint respawn, and an expanded debug bridge with corresponding unit and Playwright coverage. Keep the M0 quality gate green throughout.
