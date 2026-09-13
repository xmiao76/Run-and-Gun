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
| `advanceSteps` | number of steps (≤ 60000) | synchronous fast-forward of the fixed-step sim. Returns `{ ok, steps, ended }`; `ended` is `'results' \| 'gameOver' \| null`. The batch stops at a transition, so `steps` may be less than requested |
| `teleportPlayer` | `{ x?, y? }` | reposition the player. Note this SKIPS any spawn trigger it crosses, so waves behind the new position never fire |
| `startAtCheckpoint` | `{ id \| index, lives?, weapon? }` | restart the run at a checkpoint with every trigger ahead of it still armed. Use this, not `teleportPlayer`, to start a segment |
| `damageBoss` | amount (default 99) | activates the boss if needed |
| `defeatBoss` | — | forces the vulnerable window, then lethal damage |
| `completeLevel` | — | starts the completion timer |
| `triggerGameOver` | — | ends the run |
| `awardScore` | points | adds to score |
| `damagePlayer` | — | sandbox only: apply one hit |
| `spawnEnemyAt` | `{ kind?, x? }` | sandbox only |
| `pause` / `resume` | — | pause toggle (unnecessary under manual clock) |
| `setManualClock` | boolean | toggle the manual clock at runtime |
| `confirmMenu` / `backMenu` | — | leave the title / results / game-over / help screens with no key press and no wall-clock wait |
| `report` | — | force a runtime publish |

### Inputs

| Input command | Effect |
|---|---|
| `holdLeft` / `releaseLeft`, `holdRight` / `releaseRight` | horizontal movement |
| `holdAimUp` / `releaseAimUp`, `holdAimDown` / `releaseAimDown` | aiming |
| `jumpPress` / `jumpRelease`, `firePress` / `fireRelease` | edge + held for jump/fire |
| `holdCrouch` / `releaseCrouch`, `holdDrop` / `releaseDrop` | crouch, and drop through one-way platforms |
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

## Self-play evaluation: `npm run eval`

The harness plays the game many times with varied setups and checks gameplay
invariants, to find defects rather than to score the AI. It drives the bridge
exactly the way the sections above describe — structured state in, `InputState`
out — and uses no cheat commands beyond run setup and the clock.

```bash
npm run eval                      # full matrix (~40 runs, under a minute)
npm run eval -- --quick           # 12-run subset for an inner loop
npm run eval -- --seeds 12        # more seeded variation
npm run eval -- --filter door     # only configs matching a substring
npm run eval -- --baseline        # compare against the committed baseline
npm run eval -- --update-baseline # record the current outcomes as the baseline
node scripts/eval/run.mjs --level 2 --checkpoint preboss --lives 30 --policy pilot
```

### Why variation has to be constructed

The simulation contains no randomness at all — fixed 60 Hz timestep, data-driven
spawn triggers, fixed boss cycles, fixed particle tables. That determinism is
what makes the bridge trustworthy, but it means a given policy on a given start
state produces a byte-identical trace forever: running it a hundred times yields
one data point. So variation is injected from the driver, never from the game.

| Axis | What it varies | What it is good for |
|---|---|---|
| Start state | level x checkpoint x lives x starting weapon | "is every segment completable from its own checkpoint?" |
| Hiccups | seeded stray input on top of a pilot run | deep, legitimate states perturbed slightly — the best bugs per run |
| Scripted | door camper, edge nudger, boss hugger, rusher, jumper, idler | named mechanics, deliberately abused |
| Fuzz | seeded random input | invariant violations only; it never gets far |
| Batch size | `advanceSteps` granularity 1 / 30 / 600 | harness correctness: chunking must not change the outcome |
| Chain | Level 1 -> results -> Level 2 in one session | the cross-level registry carry-over |

Hiccups are additive: bridge input is OR-merged with the pilot's, so a hiccup
can add a keypress but never suppress one. That is an honest model of a human
bumping a key. A true override needs `?autopilot=remote`.

### Invariants

Every check is a pure function over the run trace (`scripts/eval/checks.mjs`),
so all of them are unit-tested against synthetic traces in
`tests/unit/evalChecks.test.ts` — including the cases where the game is
*legitimately* standing still, which is what keeps the detectors trustworthy.

- **stall** (CRITICAL) — no progress for 600 steps, or 3,600 in the boss arena.
  Progress is monotone (`maxPlayerX`, checkpoint, lives, score, boss health,
  subcomponents, phase, containers), never a raw position delta: the boss
  standoff oscillates and a wedged player jitters, and both would read as
  movement. Suppressed while dying, completing, paused or ending — and those
  freeze the clock rather than resetting it, so a periodic death cannot hide a
  wedge.
- **deathTrap** (CRITICAL) — 3+ deaths within 96 px. The stall detector cannot
  see a respawn loop, because every cycle changes `lives` and therefore looks
  like progress; this covers that hole.
- **freeDeath** (HIGH) — a death that cost no life.
- **outOfBounds**, **nanField** (CRITICAL), **monotonic**, **resourceBounds**,
  **structural**, **notCompletable** (HIGH).
- **coverage** (CRITICAL) — judged over the WHOLE matrix rather than per run,
  because one run has no business meeting every archetype. Every boss must take
  damage; every boss must be damageable by **every weapon**; every archetype
  that appears must be killable and must land at least one hit. An archetype
  that never appeared is untested, not broken, and is reported as neither.

  This pass exists because every other detector watches the *player*. None of
  them notice when an actor stops working: a broken enemy just makes the game
  easier, and a boss that cannot be hurt reads as difficulty. That is exactly
  how the Reactor Warden shipped hittable only by the scatter fan — its hitbox
  was 16 px too short and the two single-bolt weapons passed straight under it —
  with the whole suite green. Asking the question per weapon is what turns "the
  pilot lost" into a named defect.

A policy that is not trying to get anywhere (`idler`, `fuzz`) is exempt from the
stall check; without that, standing still forever reports a stall every ten
simulated seconds and the signal drowns.

### Output and the exit code

Per-run traces go to `test-results/eval/` (disposable — Playwright clears that
directory on every test run). The report and baseline go to `docs/eval/`, which
is committed, so a baseline survives between runs. A greppable summary line
follows the existing `SOAK …` convention:

```
EVAL runs=39 completed=19 gameOver=14 budget=6 stuck=0 findings=32 critical=26 deaths=442
```

With a baseline the exit code tracks **regressions**; without one it tracks
critical findings. The game carries standing critical findings — chaos policies
die repeatedly in places a competent player never visits — so gating on the
absolute count would leave the signal permanently red, which is the same as
having no gate. Findings are reported grouped, competent-policy ones first: a
wedge the pilot hits is something a real player hits.

### Findings become tasks

`node scripts/eval/proposeTasks.mjs` reads `docs/eval/findings.json` and writes
`docs/eval/proposed-tasks.md`: one `TASKS.md`-shaped block per distinct
CRITICAL/HIGH finding, with the next free id, a bounded requirement quoting the
evidence, objective acceptance criteria, and non-goals.

It **never edits `TASKS.md` and never touches source**. A finding is evidence
that something looked wrong, not a decision about what to do, and that decision
stays with a person - proposing and fixing in one pass is how an unreviewed
detector becomes an unreviewed code change. Each block carries a
`Source:` line naming the finding (`kind@bucket:Ln`), which is both the evidence trail
and the dedupe key: once a proposal is copied into `TASKS.md`, that finding is
not proposed again.

Proposals are ranked with competent-policy findings first, and capped (`--max`,
default 5) because more than a handful at a time is not a backlog anyone reads.

`.claude/eval-loop.md` is the producer iteration that ties it together: run the
eval, read the proposals, accept the real ones into `TASKS.md`, record what was
rejected and why, and hand off to the consumer loop in `.claude/loop.md`.

## MCP server: playing the game as tools

`scripts/mcp-server.mjs` exposes the same bridge as MCP tools, so an MCP client
can start a run, read state, and drive the player turn by turn. It shares
`scripts/lib/` with the HTTP agent server, so the two cannot drift apart; it
does not replace it.

Registered for this repo by `.mcp.json`:

```json
{
  "mcpServers": {
    "iron-echo": {
      "type": "stdio",
      "command": "node",
      "args": ["scripts/mcp-server.mjs"],
      "env": { "TARGET_URL": "http://localhost:4173" }
    }
  }
}
```

Start a preview (`npm run preview -- --port 4173`) or point `TARGET_URL` at the
deployed site first — the server itself launches nothing until the first tool
call.

### Tools

| Tool | Purpose |
|---|---|
| `game_start` | Begin a run: level, checkpoint, lives, optional built-in pilot |
| `game_state` | Read state without advancing |
| `game_act` | Apply holds/releases/taps, then advance N steps |
| `game_command` | Escape hatch to a raw bridge command |
| `run_eval` | Start a batch evaluation in the background, returns a job id |
| `eval_status` | Poll that job |
| `read_findings` | Read `docs/eval/report.md` |

`game_act` and `game_state` return a **compact projection** — position, lives,
weapon, counts, boss state — rather than the full snapshot with its enemy and
projectile arrays, which is a couple of KB per call and would fill a session's
context with data the caller rarely reads. Pass `verbose: true` for everything.

`run_eval` is asynchronous on purpose: a full matrix takes longer than a tool
call should block for, so it returns immediately and you poll `eval_status`.

### Why this is comfortable for a slow client

The server always opens the game with `manualClock`, so the simulation is frozen
between calls. A model can take a minute to decide its next move and the game
will be exactly where it left it — there is no real-time pressure anywhere in
the loop, and no screenshot in it either.

### Protocol notes

Newline-delimited JSON-RPC 2.0 on stdio — *not* LSP `Content-Length` framing.
The parts that break hand-rolled servers are handled in
`scripts/lib/jsonrpc.mjs` and pinned by `tests/unit/mcpProtocol.test.ts`:

- stdin does not arrive in message-sized chunks, so the decoder buffers until a
  newline and tolerates `\r\n`.
- a notification (no `id`) must produce **no** response at all.
- unknown methods answer `-32601` rather than crashing.
- only `tools` is advertised in `initialize`. Advertising `resources` or
  `prompts` without handlers makes a client call `resources/list` and fail the
  connection on the missing method.
- every tool's `inputSchema` is an object schema **with** a `properties` map,
  even when empty — the most common reason a tool is listed but never callable.
- **stdout carries protocol JSON and nothing else.** `console.log` is redirected
  to stderr at startup, because one stray line from anywhere in the import graph
  corrupts the stream.

`node scripts/mcp-smoke.mjs` drives the real child process through a full
handshake and a few moves, and fails if anything unsolicited or non-protocol
appears on stdout.

## Safety

- The bridge and manual clock ship in the production bundle but are inert
  without `?debug`; normal gameplay is unaffected.
- `advanceSteps` is bounded to 60,000 steps (1,000 s) per call.
- The agent server binds to localhost by default; it holds no credentials and
  needs none.
