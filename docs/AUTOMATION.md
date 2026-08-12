# Automation: driving Operation Iron Echo without screenshots

The game exposes a **debug bridge** (`window.__GAME_DEBUG__`) that lets scripts
and agents read structured game state, inject input, and advance the simulation
step-exactly. Because the simulation is pure and deterministic (fixed 60 Hz
timestep, no RNG in gameplay), an automated driver never needs screenshots:
read JSON state, act, step, read again.

Two driver surfaces build on the bridge:

| Surface | For | Entry point |
|---|---|---|
| `GameDriver` Playwright helper | scripted e2e tests | `tests/e2e/helpers/gameDriver.ts` |
| HTTP agent server | AI agents / interactive play between turns | `scripts/agent-server.mjs` |

## Enabling the bridge

The bridge ships in the production bundle but is **inert unless activated**:

| Query param | Effect |
|---|---|
| `?debug=1` | Activates `window.__GAME_DEBUG__` (required for everything below) |
| `?renderer=canvas` | Forces the Canvas renderer (recommended for headless) |
| `?manualClock=1` | Freezes the real-time clock; only `advanceSteps` advances the game |
| `?keys=1` | Input diagnostic overlay (separate feature) |

Normal visitors never see any of this. Do not share `?debug` URLs as "the game".

## The runtime contract

Every scene publishes a typed snapshot each step; the contract lives in
`src/debug/runtimeTypes.ts` (no Phaser imports, importable by any tooling):

- `LevelRuntime` — `playerX/Y`, `grounded`, `crouching`, `playerPose`, `dying`,
  `lives`, `invuln`, `weapon`, `fireAngle`, `enemies[]`, `projectileCount`,
  `enemyProjectileCount`, `checkpoint`, `bossActive/Health/State/Phase/
  Vulnerable/Pattern`, `subcomponentsAlive`, `containersAlive`, `pickupsAvailable`,
  `autoPaused`, `telegraphCount`, `max*Seen`, `particleCount`, `paused`,
  `gameOver`, `completing`, `score`, `manualClock`
- `SandboxRuntime` — same idea for the prototype room, plus `pickups[]`
- `ResultsRuntime` / `GameOverRuntime` / `SettingsRuntime` / `HelpRuntime` —
  small menu snapshots (score, bestScore, final; settings values; etc.)

The active scene name is `getState().scene`; `getState().runtime` is the
matching snapshot (flat, not wrapped).

## Bridge API

```js
window.__GAME_DEBUG__.getState()            // { gameTitle, gameVersion, scene, titleHeading, runtime }
window.__GAME_DEBUG__.command(name, payload)
window.__GAME_DEBUG__.input(name)
```

### Commands

| Command | Payload | Notes |
|---|---|---|
| `startLevel1` / `startLevel2` / `startSandbox` / `gotoTitle` | — | scene switching, available everywhere |
| `advanceSteps` | number of steps (≤ 60000) | synchronous fast-forward of the fixed-step sim |
| `teleportPlayer` | `{ x?, y? }` | reposition the player |
| `damageBoss` | amount (default 99) | activates the boss if needed |
| `defeatBoss` | — | forces the vulnerable window, then lethal damage |
| `completeLevel` | — | starts the completion timer |
| `triggerGameOver` | — | ends the run |
| `awardScore` | points | adds to score |
| `damagePlayer` | — | sandbox only: apply one hit |
| `spawnEnemyAt` | `{ kind?, x? }` | sandbox only |
| `pause` / `resume` | — | pause toggle (unnecessary under manual clock) |
| `setManualClock` | boolean | toggle the manual clock at runtime |
| `report` | — | force a runtime publish |

### Inputs

| Input command | Effect |
|---|---|
| `holdLeft` / `releaseLeft`, `holdRight` / `releaseRight` | horizontal movement |
| `holdAimUp` / `releaseAimUp`, `holdAimDown` / `releaseAimDown` | aiming |
| `jumpPress` / `jumpRelease`, `firePress` / `fireRelease` | edge + held for jump/fire |
| `resetInput` | back to neutral |

## Manual-clock mode

Under `?manualClock=1` (or after `setManualClock(true)`), wall time never steps
the simulation — `update()` renders but does not tick, and only `advanceSteps`
advances time. Consequences an agent can rely on:

- **Input edges persist.** A `jumpPress` set now is still pending 10 seconds
  later; the next `advanceSteps` consumes it. No race with background frames.
- **You are the clock.** Nothing moves, spawns, or expires until you step.
  Death/completion timers also advance only on your steps.
- **Do not mix with real-time play.** Manual clock and wall-clock play are
  mutually exclusive; pick one per session.
- **Do not call `pause`** in this mode — the clock is already frozen, and pause
  only adds its overlay.
- Blur/focus auto-pause is suppressed while the manual clock is on.

## Scripted tests: `GameDriver`

```ts
import { GameDriver } from './helpers/gameDriver';

const driver = new GameDriver(page, { manualClock: true, renderer: 'canvas' });
await driver.goto();
const level = await driver.startLevel(1);       // typed LevelRuntime
await driver.act({ hold: ['right'] }, 30);      // run for 0.5 s of sim time
await driver.act({ tap: ['fire'] }, 2);         // shoot; atomic input+step
await driver.teleport(2600);                    // boss arena
await driver.defeatBoss();
await driver.completeLevel();
await driver.step(180);                         // past COMPLETION_DELAY
await driver.waitForScene('results');
```

Key methods: `goto`, `snapshot`, `waitForScene`, `command`, `input` (escape
hatches), `startLevel(1|2)`, `startSandbox`, `gotoTitle`, `hold`, `release`,
`press`, `resetInput`, `step(n)`, `act({hold, release, tap}, n)`, `teleport`,
`defeatBoss`, `completeLevel`. `act` applies input changes and steps in ONE
`page.evaluate`, so nothing can interleave.

## Running the suite against the deployed site

```bash
npm run test:e2e:live                                # full suite vs production
npm run test:e2e:live -- --grep-invert @slow-live    # skip the CDN-sensitive soak
node scripts/test-live.mjs http://localhost:4173     # any other target
```

Mechanism: `TEST_BASE_URL` (set by `scripts/test-live.mjs`) overrides
`playwright.config.ts`'s `baseURL` and skips the local web server. The specs
themselves are target-agnostic — they drive whatever the base URL serves
through the same bridge. The soak spec is tagged `@slow-live` because 36,000
bridge round-trips and a Chrome-only heap assert are environment-sensitive over
the CDN; the assertions are identical, only the environment differs.

## AI agents: the HTTP driver server

`scripts/agent-server.mjs` keeps ONE headless browser page open (default target:
the deployed site, always with `?debug=1&renderer=canvas&manualClock=1`) and
serves the driver surface over `node:http`. No new dependencies.

```bash
npm run agent:server
# TARGET_URL=http://localhost:4173 PORT=8787 HEADLESS=0 npm run agent:server
```

| Endpoint | Body | Returns |
|---|---|---|
| `GET /health` | — | `{ ok, url, scene }` |
| `GET /state` | — | full bridge snapshot |
| `POST /command` | `{ name, payload? }` | `{ result }` |
| `POST /input` | `{ name }` | `{ ok }` |
| `POST /step` | `{ n }` | state after `advanceSteps(n)` |
| `POST /act` | `{ hold?, release?, tap?, n }` | state after atomic input+step |
| `POST /goto` | `{ url? }` | `{ ok, url }` — re-navigate, resets the session |

`hold`/`release` take `left|right|aimUp|aimDown` (release also `jump|fire`);
`tap` takes `jump|fire`. Requests are serialized so `/act` stays atomic.

### Example session (against production)

```bash
node scripts/agent-server.mjs &
curl -s localhost:8787/health
curl -s -XPOST localhost:8787/command -d '{"name":"startLevel1"}'
curl -s -XPOST localhost:8787/act -d '{"hold":["right"],"n":30}'     # run 0.5 s
curl -s -XPOST localhost:8787/act -d '{"tap":["fire"],"n":2}'        # shoot
curl -s localhost:8787/state                                          # read back
```

### Example agent loop

```text
loop:
  state = GET /state
  if state.runtime.gameOver or state.runtime.completing: finish
  decide next action from state (enemy positions, bossPhase, pits ahead...)
  POST /act { hold/release/tap, n }     # one deliberate sim-time slice
```

Termination signals: `gameOver` (run ended), `completing` (level clear in
progress), `scene === 'results'` / `'gameOver'`. A useful step size is 10–60
steps (≈0.17–1 s of simulation) per decision.

## Safety

- The bridge and manual clock ship in the production bundle but are inert
  without `?debug`; normal gameplay is unaffected.
- `advanceSteps` is bounded to 60,000 steps (1,000 s) per call.
- The agent server binds to localhost by default; it holds no credentials and
  needs none.
