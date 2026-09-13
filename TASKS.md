# TASKS.md

## Task status rules

Allowed statuses:

- TODO
- IN_PROGRESS
- BLOCKED
- DONE

The loop should always continue the earliest `IN_PROGRESS` task first.
If no task is `IN_PROGRESS`, start the first `TODO` task.

Only one task should be actively worked on in a single loop iteration.

---

### TASK-001 - Bootstrap project and create non-abstract presentation baseline

- Status: DONE
- Requirement:
  Set up the TypeScript + Phaser + Vite project, configure lint/test/build commands, and create a title screen plus a tiny playable test room that already demonstrates the intended visual direction using recognizable sprites rather than rectangles.
- Acceptance criteria:
  - [x] `package.json` exists with `dev`, `build`, `lint`, `typecheck`, `test:unit`, and `test:e2e` scripts
  - [x] Phaser app launches successfully in the browser
  - [x] There is a title screen with the game name "Operation Iron Echo"
  - [x] There is a small test scene or prototype room
  - [x] The prototype room shows a recognizable player character sprite, not just a square/rectangle
  - [x] The prototype room shows some environment art or tiles, not just colored blocks
  - [x] ESLint, typecheck, and build succeed
  - [x] At least one Playwright smoke test exists and passes

---

### TASK-002 - Implement player movement, animation states, and combat controls

- Status: DONE
- Requirement:
  Implement the player controller with core movement and readable presentation.
- Acceptance criteria:
  - [x] Player can move left and right
  - [x] Player can jump
  - [x] Player can crouch
  - [x] Player can shoot
  - [x] Player supports directional aiming where implemented
  - [x] Player has recognizable animation states for idle, run, jump, crouch, shoot, hurt, and death
  - [x] Player sprite remains representational and non-abstract
  - [x] Unit tests or logic tests exist for relevant movement/combat logic where practical
  - [x] Manual play confirms the controls feel responsive

---

### TASK-003 - Implement weapon system and readable visual combat feedback

- Status: DONE
- Requirement:
  Add the standard rifle, spread weapon, and rapid-fire weapon with distinct behavior and visible feedback.
- Acceptance criteria:
  - [x] Standard rifle is implemented
  - [x] Spread weapon is implemented
  - [x] Rapid-fire weapon is implemented
  - [x] Each weapon has distinct projectile behavior
  - [x] Each weapon has visually distinct bullets/projectiles or firing feedback
  - [x] Muzzle flash, hit effect, or projectile impact feedback exists
  - [x] Weapon pickup switching works
  - [x] Unit or integration tests cover core weapon logic where practical

---

### TASK-004 - Implement enemy roster with recognizable visual identities

- Status: DONE
- Requirement:
  Add at least four enemy types with distinct visuals and behaviors.
- Acceptance criteria:
  - [x] At least 4 enemy types are implemented
  - [x] Enemy types are visually distinct and recognizable
  - [x] At least one enemy shoots
  - [x] At least one enemy rushes, jumps, or changes position aggressively
  - [x] At least one tougher enemy or mechanical/armored enemy exists
  - [x] Enemies can damage the player
  - [x] Enemies can be defeated
  - [x] Enemy death feedback is visible
  - [x] Core enemy behavior is stable during gameplay

---

### TASK-005 - Build Level 1 as a complete visually rich playable stage

- Status: DONE
- Requirement:
  Build the full first level with level art, encounters, pickups, checkpoint, and a boss arena.
- Acceptance criteria:
  - [x] Level 1 has a clear visual theme such as jungle, battlefield, or ruined war zone
  - [x] Level 1 contains terrain/platform layout and environment art
  - [x] Level 1 uses non-abstract map presentation
  - [x] Level 1 contains enemies and pickups
  - [x] Level 1 contains at least one checkpoint
  - [x] Level 1 contains a boss arena
  - [x] The player can play Level 1 from start to boss encounter
  - [x] Background layers or scenic decoration are present to improve visual quality

---

### TASK-006 - Implement Level 1 boss

- Status: DONE
- Requirement:
  Create the first boss with visual presence and readable attack pattern.
- Acceptance criteria:
  - [x] Level 1 boss exists
  - [x] Boss is visually larger and more detailed than standard enemies
  - [x] Boss has at least 2 attack patterns or phases
  - [x] Boss can be defeated
  - [x] Defeating the boss transitions correctly to the next stage or victory flow for current development stage
  - [x] Boss fight is covered by manual or E2E validation

---

### TASK-007 - Build Level 2 as a complete second stage with stronger visual identity

- Status: DONE
- Requirement:
  Build the second level with a different environment theme and stronger escalation.
- Acceptance criteria:
  - [x] Level 2 has a distinct visual theme such as enemy base or industrial fortress
  - [x] Level 2 visually differs from Level 1
  - [x] Level 2 contains its own terrain/platform layout
  - [x] Level 2 contains enemy encounters and pickups
  - [x] Level 2 includes checkpoint support
  - [x] Level 2 is playable from start to final boss encounter
  - [x] Environment visuals are representational and non-abstract

---

### TASK-008 - Implement final boss and full game completion flow

- Status: DONE
- Requirement:
  Implement the final boss and the complete victory flow.
- Acceptance criteria:
  - [x] Final boss exists
  - [x] Final boss is visually distinct and more impressive than standard enemies
  - [x] Final boss has readable attack patterns
  - [x] The player can defeat the final boss
  - [x] Beating the final boss leads to a victory/completion screen
  - [x] Full game can be completed from title screen to ending

---

### TASK-009 - Implement HUD, pause, game over, local save, and polish

- Status: DONE
- Requirement:
  Finish the core user-facing loop and readable interface.
- Acceptance criteria:
  - [x] HUD shows at least lives, score, and current weapon
  - [x] Pause and resume work
  - [x] Game over flow works
  - [x] Restart flow works
  - [x] High score is stored in local storage
  - [x] Basic settings such as mute or volume are stored in local storage
  - [x] HUD is readable and visually coherent with the game presentation
  - [x] The game no longer looks like a prototype built from blocks

---

### TASK-010 - Add touch/gamepad support and responsive presentation

- Status: DONE
- Requirement:
  Improve accessibility across devices.
- Acceptance criteria:
  - [x] Keyboard controls work reliably
  - [x] Gamepad support works if feasible
  - [x] Touch controls exist if feasible for first release
  - [x] The layout remains usable on common desktop and mobile viewport sizes
  - [x] Touch/gamepad support does not break keyboard play

---

### TASK-011 - Final quality pass and deployment readiness

- Status: DONE
- Requirement:
  Make the game release-ready for static deployment.
- Acceptance criteria:
  - [x] `npm run lint` passes
  - [x] `npm run typecheck` passes
  - [x] `npm run test:unit` passes
  - [x] `npm run test:e2e` passes
  - [x] `npm run build` passes
  - [x] `dist/` is generated correctly
  - [x] The build is suitable for static hosting
  - [x] No major placeholder art remains in the main user-facing flow
  - [x] The final product clearly contains recognizable characters, weapons, enemies, and scenes
  - [x] The project is ready for manual deployment to Cloudflare Pages

---

## Future enhancements

Add new enhancement tasks below this section later.
Do not start them until the core release tasks above are complete or explicitly reprioritized.

**Order in this file is priority, not id order.** The loop takes the first
`TODO` task it finds, so reprioritising means moving a block, never renumbering
one - ids are referenced from `PROGRESS.md` and must stay stable. TASK-025 to
TASK-028 were moved ahead of TASK-023/024 because they are user-facing defects
found by the evaluation harness, and shipping more automation surface while
known player-facing bugs sit open is the wrong trade.

---

### TASK-012 - Classic PC keyboard layout with fully usable 45-degree firing

- Status: DONE
- Requirement:
  Rebind the keyboard so the game is comfortable on a PC: movement and aiming
  on the arrow keys (right hand), jump and fire on dedicated left-hand keys, in
  the layout used by classic PC/emulated run-and-gun games. Aiming up must no
  longer be bound to the jump key - that binding is what made diagonal firing
  unreachable, even though the aim math in `src/simulation/aim.ts` already
  returns -45/-135/45/135. Then make all four 45-degree directions usable and
  readable in play, and surface the control scheme on the title screen so a new
  player can see it without hunting.
  (Merged: this task absorbed the former TASK-013.)
- Acceptance criteria:
  - [x] Arrow Left/Right move; Arrow Up aims up; Arrow Down crouches / drops through platforms
  - [x] `Z` jumps and `X` fires (left hand, matching NES-emulator/Cave Story defaults)
  - [x] Pressing Arrow Up does NOT cause a jump
  - [x] `Space` still jumps and `J`/`K`/`Enter` still fire (kept as aliases so existing muscle memory and tests keep working)
  - [x] `W`/`A`/`S`/`D` remain usable as movement/aim aliases
  - [x] The help screen and the in-level control hint show the new primary bindings
  - [x] Unit tests cover the key-to-action mapping, including the Up-is-not-jump regression
  - [x] Up + Right fires at -45 degrees and Up + Left at -135 (ground or air)
  - [x] While airborne, Down + Right fires at 45 degrees, Down + Left at 135, and Down alone at 90
  - [x] The player sprite shows the diagonal aim pose for up-diagonals
  - [x] The projectile sprite is rotated along its actual flight vector for every diagonal
  - [x] E2E coverage asserts every aim angle driven through real key presses
  - [x] The title screen shows the primary controls (or an obvious link to them) so users understand them immediately
- Non-goals / constraints:
  - Do not change gamepad or touch bindings.
  - Do not change movement physics, fire rate, or any balance value.
  - Keep the existing grounded behaviour: Down while grounded is crouch-fire forward (angle 0), not a downward shot.
  - Do not add new aim directions beyond the existing 8.
  - Existing e2e specs drive the debug input bridge, not raw keys; they must stay green unchanged.

---

### TASK-014 - Selectable starting lives (30 default, 3 for an arcade run)

- Status: DONE
- Requirement:
  Let the player choose the starting life count from the settings screen,
  persisted in local storage like the other settings. **30 is the default**, so a
  new player can explore both levels without a quick game over; 3 remains
  selectable for an authentic arcade run.
  (Revised: the default was 3 in the first implementation and changed to 30 on
  request.)
- Acceptance criteria:
  - [x] Settings screen exposes a starting-lives option with at least the values 3 and 30
  - [x] Default is 30 for a fresh profile
  - [x] A new run starts with the selected life count and the HUD reflects it
  - [x] The choice persists across a page reload through the existing validated storage service
  - [x] Corrupt or out-of-range stored values fall back to the 30 default
  - [x] Selecting 3 still yields a 3-life run with one icon per life
  - [x] Unit tests cover settings validation/defaulting for the new field
- Non-goals / constraints:
  - Do not change checkpoint, respawn, or game-over logic beyond honouring the configured count.
  - The HUD life row must stay readable at 30 lives (show a count rather than 30 icons).
  - Tests must not hardcode the default; assert life *changes* (one life lost) or
    seed the setting explicitly, so a future default change does not break them.

---

### TASK-015 - Classic arcade feel pass

- Status: DONE
- Requirement:
  Tune the moment-to-moment gameplay closer to a classic arcade run-and-gun:
  brisker movement, denser and more aggressive encounters, and punchier combat
  feedback, without changing the level layouts or adding new systems.
- Acceptance criteria:
  - [x] Player run speed and jump arc retuned for arcade pacing, with the values recorded in `src/balance/player.ts`
  - [x] Enemy encounters are denser: wave sizes and/or spawn cadence increased in both levels
  - [x] The spread weapon fires a visibly wider fan of pellets
  - [x] Firing, hits, and deaths have stronger feedback (screen-shake or equivalent, respecting the reduced-flash setting)
  - [x] Both levels remain completable start-to-finish; the full-game e2e stays green
  - [x] The soak test still shows bounded enemy/projectile counts and a flat heap
- Non-goals / constraints:
  - Do not change level geometry, add levels, or add enemy archetypes.
  - Do not remove the existing telegraph wind-ups; readability must not regress.
  - Keep one-hit-per-life damage (already the current model).
- Open question (resolved by proceeding on the recorded default):
  - Should difficulty rise overall (fewer safety nets, faster enemies) or stay
    approachable with only pacing and feedback improved? Implemented as the
    recorded default: pacing and feedback, difficulty roughly unchanged. Enemy
    health/speed/fire rates and player damage were all left alone; the only
    difficulty-adjacent change is one extra defender per wave.
  - If a harder pass is wanted later, the levers are already isolated:
    `src/balance/enemies.ts` (health, moveSpeed, fireInterval, telegraph
    duration) and `src/balance/bosses.ts`. Raise them there rather than
    reworking scenes.

---

### TASK-016 - Agent-drivable debug bridge: typed contract, manual clock, shared driver

- Status: DONE
- Requirement:
  Harden the existing `window.__GAME_DEBUG__` bridge into a control surface an
  external agent can use to play the game deterministically without
  screenshots: a typed runtime-snapshot contract shared by game, tests, and
  agents; a race-free manual-clock mode where wall time never advances the
  simulation and only `advanceSteps` does (so bridge input edges persist until
  the agent's own step consumes them); and one shared, typed `GameDriver`
  Playwright helper replacing the per-spec inline accessors for new specs.
- Acceptance criteria:
  - [x] `src/debug/runtimeTypes.ts` exports `LevelRuntime`, `SandboxRuntime`,
        `ResultsRuntime`, `GameOverRuntime`, `SettingsRuntime`, `HelpRuntime`,
        the `RuntimeSnapshot` union, and `DebugSnapshot`, with no Phaser imports
  - [x] `reportRuntime` accepts only the `RuntimeSnapshot` union, enforcing the
        contract at every scene's construction site; the wire format stays flat
        (no envelope), so all pre-existing specs pass unchanged
  - [x] `?manualClock` (debug-only) freezes the real-time clock in the level and
        sandbox scenes while still rendering; the simulation advances only via
        `advanceSteps`, and the mode is toggleable at runtime via `setManualClock`
  - [x] Under manual clock, a `firePress` survives a 500 ms real-time wait with
        zero projectiles, and the following `advanceSteps` fires (race proven gone)
  - [x] `manualClock` is reported in the level and sandbox runtime snapshots
  - [x] Window blur/focus auto-pause handlers are not attached under manual clock
  - [x] `advanceSteps` is available in the sandbox scene too (bounded by the
        shared `clampStepCount`, same 60000-step cap as the level scene)
  - [x] `tests/e2e/helpers/gameDriver.ts` provides the typed driver
        (goto/snapshot/waitForScene/command/input/startLevel/startSandbox/
        gotoTitle/hold/release/press/step/act/teleport/defeatBoss/completeLevel/
        resetInput); `tests/e2e/driverSmoke.spec.ts` drives Level 1 from spawn to
        boss defeat through it exclusively
  - [x] All pre-existing specs pass unchanged; unit tests, lint, typecheck, build green
- Non-goals / constraints:
  - Do not migrate the pre-existing specs to GameDriver in this task.
  - Do not change gameplay, balance, physics, or level content.
  - Normal visitors (no `?debug`) see zero behavior change.
  - Do not add live-site targeting or the HTTP agent server (that is TASK-017).

---

### TASK-017 - Test the deployed site: live-suite targeting, HTTP agent server, docs

- Status: DONE
- Requirement:
  Make the automation surface usable against the deployed website: run the
  formal Playwright suite against any URL (default the Cloudflare Pages
  production site), provide a small dependency-free HTTP driver server so an
  AI agent can keep one browser session open and play the deployed game
  between turns, and document the whole surface.
- Acceptance criteria:
  - [x] `playwright.config.ts` reads `TEST_BASE_URL` (default
        `http://localhost:4173`) and skips the local `webServer` when a remote
        base is set
  - [x] `scripts/test-live.mjs` + `npm run test:e2e:live` launch the suite
        against `https://run-and-gun.pages.dev` by default, cross-platform on
        Windows git-bash, forwarding extra Playwright argv
  - [x] The soak spec is tagged `@slow-live`; live runs document
        `--grep-invert @slow-live`; no assertion is weakened
  - [x] `scripts/agent-server.mjs` (`npm run agent:server`) keeps one headless
        page open at `TARGET_URL` with `?debug=1&renderer=canvas&manualClock=1`
        and exposes `GET /state`, `GET /health`, `POST /command`, `POST /input`,
        `POST /step`, `POST /act`, `POST /goto` over `node:http` (no new npm
        dependencies; Playwright already a devDependency)
  - [x] An example curl session drives the deployed site: start level, act
        (hold right + tap jump + step), read state back
  - [x] `docs/AUTOMATION.md` documents the bridge API, the runtime contract,
        manual-clock semantics (edges persist until you step; do not mix with
        real-time play; `pause` unnecessary), both driver surfaces, an example
        agent loop, and the safety note (bridge ships in prod, inert without
        `?debug`); README links to it
  - [x] All local specs still pass; the live suite passes against production
- Non-goals / constraints:
  - Do not change gameplay or the bridge command set beyond documenting it.
  - The agent server must not add npm dependencies.
  - Do not weaken or skip assertions to make live runs pass; tag environment-
        sensitive specs instead.
		
---

###  TASK-018 - Front-page AI autoplay demo (bridge-driven, no screenshots)

- Status: DONE
- Requirement:
a title-screen option that lets an AI pilot play the game itself as a
. The pilot must control the game through the same programmatic
rface automated tests use — the typed runtime state snapshot and the
tState input abstraction — never screenshots or pixel inspection, so
erceives and acts at simulation speed (60 Hz, near real time) and can
 competently.
sign direction (recommended):
New pure module src/ai/pilot.ts (no Phaser/DOM imports, unit-testable
 other src/simulation code): decidePilotInput(snapshot, memory): PilotDecision
      → returns an InputState each step from the same fields the debug bridge
      already publishes (playerX/Y, grounded, enemies[] with positions,
      enemy projectiles, boss state/vulnerability, checkpoint, etc. — see
    src/debug/runtimeTypes.ts).
        - The pilot's InputState is merged at the existing input merge point in
      LevelScene.stepOnce() (same layer as keyboard/gamepad/debug input) —
      the AI plays through the exact path a human does: no teleports, no
    damageBoss, no cheats. This keeps the demo honest.
        - Behavior tiers (heuristic, deterministic): run forward; jump pits
      (level data is known); shoot nearest in-range enemy; dodge telegraphed
 and in-flight enemy projectiles; fight bosses during vulnerable windows;
lect weapon pickups on path.
 Title screen: a new entry (e.g. I - WATCH AI PLAY) starting Level 1
h the pilot engaged; a small "AI PLAYING — press any control key to
e over" HUD label; any gameplay input hands control back to the human.
 Optional external-pilot hook (reuses TASK-017 surface): ?autopilot=remote
ables the built-in pilot so an outside agent (agent-server / LLM loop)
 play through the bridge instead — one flag, no extra systems.
cceptance criteria:
 [x] Title screen exposes the AI-demo option, navigable by keyboard, touch, and gamepad like other menu entries
 [x] src/ai/pilot.ts is pure and unit-tested: jump-at-pit, shoot-nearest-enemy, dodge-incoming-projectile, boss-vulnerable-window decisions
   - [x] The pilot reads only the typed runtime/simulation state (no canvas pixels, no screenshots anywhere in the loop)
        - [x] The pilot acts through the standard InputState merge — a human pressing keys immediately regains control
        - [x] The AI completes Level 1 start-to-boss (and damages/defeats the Siege Walker) reliably across repeated automated runs
        - [x] E2E spec starts the AI demo from the title screen via the debug bridge and asserts autonomous progress (movement, kills, boss reached) with zero page errors
      - [x] All existing unit (221+) and e2e (68+) tests stay green; lint, typecheck, build clean
      - Non-goals / constraints:
        - No external ML services, backends, or network calls — the built-in pilot runs fully in-page (static-site constraint).
        - Do not change gameplay balance, level layouts, or enemy behavior to accommodate the pilot.
      - Do not let the demo pilot use debug cheat commands; it must be beatable the honest way.

---

### TASK-019 - Per-level AI autoplay toggle and Level 2 competency

- Status: DONE
- Requirement:
  Turn the one-shot Level 1 autoplay demo into a per-level control: the player
  can switch the AI pilot on or off on any level (and mid-level), the choice
  persists across level transitions and restarts within the session, and the
  pilot is competent enough to complete Level 2 as well as Level 1 (moving-
  platform pit, floor spike hazard, trigger door, and the Reactor Warden whose
  vulnerability is gated behind destructible subcomponents).
- Acceptance criteria:
  - [x] A key (I) toggles the AI pilot on/off during any level, with the "AI PLAYING" HUD label reflecting the state; human input still takes over instantly
  - [x] The toggle state persists across results->next-level and game-over->restart within the session (registry), so the AI keeps playing on every level until switched off
  - [x] Title `I` starts Level 1 with the AI on; `?autopilot=1` on, `?autopilot=remote` off (external bridge agent) - unchanged entry points
  - [x] Pilot memory is rebuilt per level from that level's geometry (pits, platforms, hazards, moving platforms, boss)
  - [x] Runtime snapshot exposes what Level 2 needs: moving platform positions and subcomponent positions (typed in runtimeTypes.ts)
  - [x] The pilot crosses Level 2's moving-platform pit, avoids the floor spike hazard, passes the trigger door, and destroys the Reactor Warden's subcomponents then the boss
  - [x] E2E: toggle on/off mid-level, AI continues into Level 2 on the toggle, and full Level 2 completion with zero page errors; Level 1 completion still green
  - [x] All unit (249+) and e2e (71+) tests stay green; lint, typecheck, build clean
- Non-goals / constraints:
  - Do not change gameplay balance, level layouts, or enemy behavior to accommodate the pilot.
  - No external ML services, backends, or network calls.
  - Do not let the pilot use debug cheat commands; it must win the honest way.
- Bug found and fixed (not pilot accommodation):
  - The Level 2 corridor door was impassable on foot for EVERYONE (it closed the
    instant the player stepped off the trigger pad, which ends 40 px before the
    door). `fullGame.spec` only passed because it teleports past it. Fixed by
    extending the trigger pad through the doorway (`src/levels/level2.ts`),
    preserving the documented reversible "stand on the pad" mechanic.

---

### TASK-020 - Bridge correctness and run instrumentation

- Status: DONE
- Requirement:
  Make the debug bridge trustworthy enough to build an evaluation harness on,
  and publish the telemetry such a harness needs. `src/` only - no driver
  scripts in this task.
  The blocking defect: `advanceSteps` does NOT stop at a scene transition.
  Phaser's `ScenePlugin.start` only queues the swap ("this will happen at the
  next Scene Manager update, not immediately"), so `this.scene.isActive()` stays
  true for the whole synchronous batch. The guard at `LevelScene.ts:664` and its
  comment are therefore wrong: a game over re-queues stop+start once per
  remaining step, and after a completion `completionTimer` goes negative so the
  branch is skipped and the level keeps simulating for the rest of the batch -
  which can start `results` and `gameOver` in the same queue. Every long-batch
  measurement is suspect until this is fixed.
- Acceptance criteria:
  - [x] A transition latch (`ending: 'results' | 'gameOver' | null`) is set before
        any `scene.start`, short-circuits `stepOnce`, and stops the `advanceSteps`
        loop; it is cleared in `create()`
  - [x] `advanceSteps` returns `{ ok, steps, ended }` so a driver never has to
        poll `getState().scene` to learn that the scene swapped
  - [x] E2E proves `advanceSteps(3600)` across a completion returns
        `steps < 3600` with `ended: 'results'`, and that exactly one scene is
        active afterwards
  - [x] Scene-registered commands are released on scene shutdown, so a stopped
        scene can no longer answer bridge commands
  - [x] New input commands `holdCrouch` / `releaseCrouch` / `holdDrop` /
        `releaseDrop` (`readDebugInput` already reads both fields; only the
        command names were missing)
  - [x] `confirmMenu` and `backMenu` commands let a driver leave the title,
        results, game-over and help screens with no real key press and no
        real-time wait; `GameOverScene` gains the same double-start latch
        `ResultsScene` already has
  - [x] `startAtCheckpoint({ id | index, lives?, weapon? })` starts a level at a
        chosen checkpoint with every spawn trigger ahead of it still armed.
        `teleportPlayer` must not be used for this: `updateSpawnTriggers` fires on
        `playerX` entering `[x0,x1]`, so teleporting past a trigger permanently
        skips its content - which is exactly how `fullGame.spec` masked the
        Level 2 door bug
  - [x] `LevelRuntime` gains `stepIndex`, `maxPlayerX` (monotone, so a sampling
        driver cannot miss progress between samples), `ending`, and
        `deaths: DeathEvent[]` (capped) where
        `DeathCause = 'pit' | 'hazard' | 'enemyFire' | 'bossShockwave'`
  - [x] All four causes are attributed at their three sites: the hazard/fall
        check in `stepOnce` (carried into `finishDeath`), the boss shockwave, and
        the enemy-bullet overlap. Enemy body contact is deliberately harmless and
        is not a cause
  - [x] All existing unit (249+) and e2e (74+) tests stay green; lint, typecheck,
        build clean
- Non-goals / constraints:
  - No balance, physics, level-layout or enemy-behaviour changes.
  - Do not make the pilot's tuning constants configurable (dropped: it explores
    policy space, not game state, and is the weakest source of run variation).
  - Normal visitors (no `?debug`) see zero behaviour change.

---

### TASK-021 - Shared driver library and the single-run evaluator

- Status: DONE
- Requirement:
  Extract the Playwright/bridge boilerplate that 26 `scripts/*.mjs` files
  duplicate, and build the one-run evaluator on top of it: drive one configured
  self-play run, sample it, and check gameplay invariants. The invariant logic
  must be pure and browser-free so it can be unit-tested against synthetic
  traces before it is ever pointed at the game.
- Acceptance criteria:
  - [x] `scripts/lib/browser.mjs` (`gameUrl`, `launch`, `openGame`) centralises
        `chromium.launch()`, the 960x540 viewport, the debug/renderer/manualClock
        URL, the bridge fail-fast wait, `pageerror` + console-error capture, and
        seeds settings through `addInitScript` (the default is 30 starting lives,
        so an eval that does not force 3 never reaches the game-over path at all)
  - [x] `scripts/lib/bridge.mjs` owns the hold/release/tap maps as the single
        source of truth, plus `act()` and `settleSceneSwap()` (a scene swap needs
        two animation frames before `getState()` reports the new scene)
  - [x] `scripts/agent-server.mjs` consumes the lib instead of its own copies;
        all seven endpoints behave identically
  - [x] `scripts/lib/rng.mjs` (mulberry32) and `scripts/lib/policies.mjs`
        (`pilot`, `rusher`, `idler`, `jumper`, plus scripted adversarial policies)
  - [x] `scripts/eval/checks.mjs` is pure and browser-free: `progressed`,
        `stallSuppressed`, `detectStall`, `detectDeathTrap`, `checkBounds`,
        `checkMonotonic`, `checkResources`, `checkStructural`
  - [x] The stall detector uses monotone progress (`maxPlayerX`, checkpoint,
        lives, score, bossHealth, subcomponentsAlive, bossPhase, containersAlive),
        a 600-step traversal window and a 3600-step boss window, and is suppressed
        while `dying`, `completing`, `paused`, `autoPaused`, or `ending !== null`.
        600 steps is chosen against the slowest legitimate wait in the game, the
        4 s `l2-mp-vert` platform cycle
  - [x] A separate death-trap detector catches respawn loops (3+ deaths inside one
        96 px window), which the stall detector cannot see because a respawn loop
        keeps changing `lives`
  - [x] `tests/unit/evalChecks.test.ts` asserts no false positive for each
        legitimately stationary case: boss standoff, the 4 s platform wait, the
        death pause, and the completion delay
  - [x] `node scripts/eval/run.mjs --level 1 --checkpoint start --lives 3 --policy pilot`
        writes one `test-results/eval/run-<id>.json` with zero violations
- Non-goals / constraints:
  - No `src/` changes; no new npm dependencies.
  - Keep every harness file `.mjs` - the repo deliberately has no `@types/node`.
  - Anything in `scripts/lib/` must log to stderr only, because the MCP server
    (TASK-023) shares it and any stray stdout write corrupts its protocol stream.

---

### TASK-022 - Batch matrix, aggregation, `npm run eval`

- Status: DONE
- Requirement:
  Run the evaluator across a varied matrix and aggregate the result into a
  report a human and the development loop can both read. The simulation has no
  RNG at all, so variation is injected entirely from the harness.
- Acceptance criteria:
  - [x] Variation axes, in priority order: the start-state matrix
        (2 levels x 3 checkpoints x {3,30} lives x starting weapon), seeded
        additive input hiccups over a pilot run, scripted adversarial policies
        aimed at named mechanics (door camper, platform rider, pit-edge nudger,
        boss hugger, respawn spammer), seeded input fuzzing, and step-batch-size
        variation (1 / 30 / 600 / 3600, a harness-correctness axis that is exactly
        what would have caught the TASK-020 transition defect)
  - [x] One full title -> Level 1 -> results -> Level 2 -> MISSION COMPLETE chain
        runs as its own config, since it is the only thing exercising the
        cross-level registry carry-over
  - [x] `npm run eval -- --quick` finishes inside 2 minutes; the default matrix
        inside 6 minutes; one browser is reused across runs with a fresh context
        per run (localStorage and the Phaser registry both persist otherwise)
  - [x] The report plus a greppable one-liner in the existing
        soak convention: `EVAL runs=... completed=... stuck=... critical=...`.
        The report and baseline live in `docs/eval/` rather than `test-results/`:
        Playwright clears that directory on every run and it is gitignored, so a
        baseline written there could not survive between iterations. Per-run
        traces stay in `test-results/eval/` as disposable working data.
  - [x] Non-zero exit on any CRITICAL violation when there is no baseline;
        with `--baseline` the exit code tracks REGRESSIONS instead. The game
        carries standing critical findings (chaos policies die repeatedly in
        places a competent player never visits), so gating on the absolute
        count would leave the signal permanently red - the same as no gate
  - [x] Detection proven end-to-end: temporarily narrowing the Level 2 trigger pad
        back to width 60 reproduces the door bug and the harness reports a stall at
        the right x (verification only - reverted, never committed)
  - [x] Any baseline comparison is opt-in (`--baseline`) and compares only
        categorical outcomes (completed / stall bucket / death-cause histogram),
        never exact numbers, which would diff on every gameplay commit
- Non-goals / constraints:
  - No `src/` gameplay changes; no balance tuning; no level edits.
  - Do not run the harness under `@playwright/test`; import `chromium` as a
    library the way `scripts/agent-server.mjs` does.

---

### TASK-025 - Fix: input takeover from the AI pilot drops the first press

- Status: DONE
- Requirement:
  `LevelScene.stepOnce` calls `this.keyboard.build(this.stepInput)`, passing the
  previous step's *merged* input as `prev`. `buildInputFromRaw` derives
  `jumpPressed = raw.jump && !prev.jumpHeld`, so while the AI pilot (or any other
  merged source) is holding jump or fire, a human's first real press is treated
  as a continuation and its edge is silently dropped. The human must release and
  press again. Found by inspection during the TASK-020 review; user-facing.
- Acceptance criteria:
  - [x] The keyboard adapter derives its edges from the previous *device* input,
        not the merged step input
  - [x] A unit test covers the regression directly
  - [x] An e2e test proves that with the pilot engaged and holding jump, a single
        human jump press is honoured on the takeover step
  - [x] No change to the merge order or to which sources can take over
- Non-goals / constraints:
  - Do not change movement physics, jump feel, or fire rate.

---

### TASK-026 - Fix: a pit or hazard death while invulnerable is free

- Status: DONE
- Requirement:
  `finishDeath` calls `applyDamage`, which returns `applied: false` while the
  invulnerability window from an earlier hit is still open - but the respawn runs
  regardless. So taking an enemy hit and then immediately falling into a pit
  costs one life instead of two, and hands the player a free teleport back to the
  checkpoint. Decide the intended rule and make it explicit.
- Acceptance criteria:
  - [x] A pit or hazard death always costs a life. Rule chosen and recorded in
        `applyLethalDamage`: mercy invincibility exists so one projectile hit
        does not become several; falling out of the world is not damage for it
        to absorb, and the respawn runs either way
  - [x] Unit coverage for the invulnerable-death case
  - [x] An e2e test takes a hit and then falls into a pit, asserting the resulting
        life count
  - [x] The death list published in the runtime stays consistent with lives lost
- Non-goals / constraints:
  - Do not change the invulnerability duration or projectile damage rules.

---

### TASK-027 - The "non-lethal" pit markers are lethal on contact

- Status: DONE
- Requirement:
  `src/levels/level1.ts` declares its pit markers with the comment
  "Visual pit markers (non-lethal; lethality comes from the fall threshold)",
  but `LevelScene.hazardTouchesPlayer()` treats every rect in `level.hazards`
  as lethal on overlap and makes no distinction between a decorative marker and
  a spike strip. A player falling into a Level 1 pit therefore dies on contact
  with the marker band (y 520-560) rather than at the fall threshold, and the
  death is attributed `hazard` instead of `pit`.
  Found by the evaluation harness: the `rusher` policy reported
  `deathTrap @x=770 (causes: hazard)` at the first pit, where `pit` was expected.
  Decide which is intended and make the code and the data agree.
- Acceptance criteria:
  - [x] Either the markers are genuinely non-lethal (excluded from the lethal
        hazard test, so the fall threshold ends the life) or the comment and the
        level data are corrected to say they are lethal
  - [x] A Level 1 pit fall is attributed to exactly one cause, and that cause
        matches the documented rule
  - [x] Level 2's spike strip keeps its `hazard` attribution
  - [x] The existing death-cause e2e coverage still passes, updated if the
        intended rule changes
- Non-goals / constraints:
  - Do not change pit geometry, the fall threshold, or any balance value; a pit
    fall must still cost exactly one life.
  - Do not make Level 2 spikes non-lethal.

---

### TASK-028 - The AI pilot cannot clear the Reactor Warden from a mid-level checkpoint

- Status: DONE
- Requirement:
  The pilot completes Level 2 when it plays the level from the beginning, but
  not when it starts at the `mid` or `preboss` checkpoint. From `preboss` it
  walks to x=2748.83, stops there permanently, never damages a subcomponent
  (`subcomponentsAlive` stays at 2 and boss health stays at 8, because the
  Warden is immune while its nodes live), and dies to boss fire every ~216
  steps until all 30 lives are gone - 30 deaths at one x.
  This is a pilot defect, not level geometry. The successful full-level run
  passes through the *same* x with the *same* subcomponent state at step 840 and
  destroys a node at 2770, so the nodes are reachable and destructible from that
  position. Forcing the weapon does not fix it: with `scatter` - the weapon the
  winning run actually fights with - the preboss run still wedges at 2749;
  `rapid` gets one node and still dies out; `pulse` and `scatter` get none.
  The likely mechanism is a fixed point in `subcomponentAttack`: the chosen
  standoff sits on a side with no line of fire to the node, and bullets cannot
  cross the boss body (recorded in TASK-019), so the pilot stands and fires
  ineffectively forever.
  The TASK-019 claim that the pilot completes Level 2 is true only for a
  full-level run; it was never tested from a checkpoint, because
  `startAtCheckpoint` did not exist until TASK-020.
- Acceptance criteria:
  - [x] The pilot clears the Reactor Warden starting from `mid` and from
        `preboss`, at 30 lives, with each of the three weapons
  - [x] `subcomponentAttack` cannot settle on a standoff whose line of fire is
        blocked by the boss body: if firing produces no subcomponent damage
        within a bounded number of steps, the pilot repositions
  - [x] The full-level Level 1 and Level 2 runs still complete, with no
        regression in lives lost
  - [x] `npm run eval -- --baseline` reports no regressions, and the death-trap
        findings at x=2749 and x=2961 are gone from the report
  - [x] Unit coverage for the repositioning rule in `tests/unit/pilot.test.ts`
- Non-goals / constraints:
  - Do not change boss balance, subcomponent health, level geometry, or weapon
    damage to make this easier.
  - Do not let the pilot use debug commands; it must win the honest way.
  - Do not regress the Siege Walker fight in Level 1.
- Amendment: the original non-goal said "the same fight is winnable from the
  level start today, so the fix belongs in the pilot". That premise was wrong.
  Most of the defect WAS in the pilot and was fixed there, but the last part was
  a game bug: `resolvePlayerBulletsVsBoss` hard-codes the Siege Walker's 64x56
  hitbox for every boss, so the 72x72 Reactor Warden was effectively immune to
  level fire - a human with the default pulse rifle could not damage it either.
  Fixed alongside, recorded below (the TASK-019 precedent for a bug found while
  making the pilot competent).
- Bug found and fixed (not pilot accommodation):
  - `resolvePlayerBulletsVsBoss` used `{ width: 64, height: 56 }` for every
    boss. The Reactor Warden is 72x72, so its collision box was 16 px short: its
    body top is y=408, the box bottom y=464, and the player's gun sits at
    exactly y=464 - a horizontal bolt missed by one pixel. Only the scatter fan,
    whose pellets rise, could ever damage it. Now reads the boss definition.
    Measured: from the preboss checkpoint with the pulse rifle, game over after
    ~10,000 steps became a clear in 717 steps with zero findings.

---

### TASK-023 - MCP server for the game bridge

- Status: DONE
- Requirement:
  A stdio MCP server so an MCP client (including Claude Code in this repo) can
  start, observe and drive the game as tools, sharing `scripts/lib/` with the
  HTTP server so the two cannot drift.
- Acceptance criteria:
  - [x] `scripts/lib/jsonrpc.mjs` holds a pure dispatcher and a line decoder;
        `scripts/mcp-server.mjs` is wiring only
  - [x] Newline-delimited JSON-RPC 2.0 over stdio (not LSP `Content-Length`
        framing), tolerating `\r\n` and messages split across stdin chunks
  - [x] `initialize` returns `protocolVersion`, `capabilities: { tools: {} }` and
        `serverInfo`; only `tools` is advertised, since advertising `resources` or
        `prompts` without handlers fails the connection
  - [x] Notifications (`notifications/initialized`, `notifications/cancelled`)
        produce no response at all; `ping` returns `{}`; unknown methods return -32601
  - [x] Every tool's `inputSchema` is an object schema with a `properties` map,
        even when empty
  - [x] Nothing but protocol JSON ever reaches stdout
  - [x] Chromium is launched lazily on first use, not at module load, so
        `initialize` answers within a couple of seconds
  - [x] `run_eval` is asynchronous (returns a job id immediately, with
        `eval_status` / `read_findings`), because a full matrix exceeds the
        default MCP tool timeout
  - [x] `act` returns a compact state projection by default with `verbose` to opt
        into the full snapshot, so a session is not flooded with enemy arrays
  - [x] `tests/unit/mcpProtocol.test.ts` drives a scripted byte stream (split
        chunks, `\r\n`, notification silence, schema shape) with no child process
  - [x] `.mcp.json` at the repo root registers the server; `docs/AUTOMATION.md`
        gains an MCP section
  - [x] No new npm dependencies; lint, typecheck, build clean
- Non-goals / constraints:
  - Do not change gameplay.
  - The MCP server does not replace `scripts/agent-server.mjs`; both share the lib.

---

### TASK-024 - Close the loop: eval findings become TASKS.md entries

- Status: DONE
- Requirement:
  Turn the evaluation report into the producer side of the development loop.
  `.claude/loop.md` today only consumes tasks and reports `IDLE - NO READY WORK`
  when none remain; this task supplies well-formed TODO entries from observed
  gameplay defects, for review rather than automatic implementation.
- Acceptance criteria:
  - [x] `scripts/eval/proposeTasks.mjs` emits a `Proposed tasks` section in the
        `ADD_ENHANCEMENT_PROMPT.md` shape (next sequential ID, `Status: TODO`,
        bounded requirement, objective acceptance criteria, non-goals), one per
        distinct CRITICAL/HIGH finding, deduped against the IDs already in `TASKS.md`
  - [x] Given a fixture report containing one stall and one boss stall, the
        producer emits two well-formed task blocks
  - [x] `.claude/eval-loop.md` documents the producer iteration and hands off to
        `.claude/loop.md`
  - [x] Proposals are never auto-implemented and no source file is auto-edited
  - [x] `docs/AUTOMATION.md` documents the eval harness, its variation axes and
        its invariant list; README links it
- Non-goals / constraints:
  - Do not weaken the safety rules in `CLAUDE.md` or the one-task-per-iteration
    discipline.
  - Do not push, deploy, or modify cloud resources.

---

### TASK-029 - Coverage invariants: prove combat actually works

- Status: DONE
- Requirement:
  Every current invariant watches the PLAYER's state - stuck, died, out of
  bounds, counters moving the wrong way. None of them assert that the game's
  combat functions at all, and that gap let a real bug through: the Reactor
  Warden used the Siege Walker's hard-coded 64x56 hitbox, so it was effectively
  immune to level fire and a human with the default pulse rifle could not damage
  the final boss (fixed in TASK-028, found only because the AI pilot could not
  win and the cause was chased down by hand).
  Add coverage invariants that fail when a combat actor stops working: across a
  full matrix run, every boss must be damaged, every enemy archetype must be
  killable, and every archetype that is supposed to threaten the player must
  land at least one hit.
- Acceptance criteria:
  - [x] `scripts/eval/checks.mjs` gains a pure coverage pass over the aggregate
        of a matrix run (not per-run: one run need not meet every enemy)
  - [x] It fails when a boss present in the matrix is never damaged
  - [x] It fails when an enemy archetype that appears is never killed
  - [x] It fails when an archetype that is supposed to damage the player never
        does, with the harmless ones (enemy body contact) recorded as expected
        rather than silently passing
  - [x] Reintroducing the TASK-028 hard-coded boss hitbox makes `npm run eval`
        report the failure (verification only - reverted, never committed)
  - [x] The runtime publishes whatever the pass needs that it does not already:
        enemy kills by archetype, and boss damage taken
  - [x] Unit tests over synthetic aggregates, including the case where an
        archetype simply never appeared in the matrix (not a failure)
  - [x] `npm run eval -- --baseline` stays green on the current build
- Non-goals / constraints:
  - Do not change gameplay, balance, or enemy behaviour.
  - Do not fail a run because ONE run missed an archetype; this is a property of
    the matrix as a whole.
  - Keep the pass pure and browser-free like the rest of `checks.mjs`.

---

### TASK-030 - Restore the asset policy and the missing referenced docs

- Status: DONE
- Requirement:
  Three source files cite `ASSET_POLICY.md` as the authority for "no resemblance to any
  commercial title's map" and "no asset files", but the file does not exist: it was
  written early and deleted in commit `b8a9afa` (the same commit that introduced the
  pixel-art pipeline). `ARCHITECTURE.md` and `GAME_REQUIREMENTS.md` are cited from five
  more places and have never existed either. Restore the asset policy, bring its manifest
  up to date, and resolve the other two dangling references. Then amend `PROJECT.md` so
  the Contra-like direction and a third level are sanctioned rather than contradicted.
  This task comes first because it is the document the rest of this programme relies on.
- Acceptance criteria:
  - [x] `ASSET_POLICY.md` exists again, recovered from `git show b8a9afa^:ASSET_POLICY.md`
  - [x] Its manifest describes what the game actually ships now - hand-authored
        `PixelArtSpec` sprites compiled to canvas textures at runtime, procedural sky
        gradients, synthesised WebAudio music and SFX - not the "colored rectangles" it
        was written against
  - [x] It keeps its existing rules verbatim: the named prohibition on reproducing
        protected Contra expression, and the allowance for broad genre mechanics
  - [x] `ARCHITECTURE.md` and `GAME_REQUIREMENTS.md` either exist or are no longer cited
        from source; no comment points at a file that does not exist
  - [x] `PROJECT.md` non-goals no longer bar the planned work: the "more than 2 core
        levels" entry is amended, with the reason recorded
  - [x] Lint, typecheck, unit, e2e and build stay green; `npm run eval -- --baseline`
        reports no regressions
- Non-goals / constraints:
  - Do not weaken the IP rules. The policy exists to keep concrete expression original
    and that is exactly what makes the rest of this programme defensible.
  - No gameplay, art or audio change in this task.

---

### TASK-031 - Pixel bitmap font

- Status: DONE
- Requirement:
  Every string in the game is drawn in the system `monospace` font across 38 call sites,
  which is the single loudest thing telling a player this is a web page rather than an
  arcade cabinet. Author an original pixel font and use it everywhere. Phaser 4.2.1 ships
  `ParseRetroFont`/`RetroFont`, which builds a bitmap font from a texture with no font
  file, so the glyph sheet is authored as a `PixelArtSpec` in `src/art/sprites.ts` like
  every other sprite and no asset file is introduced.
- Acceptance criteria:
  - [x] An original glyph sheet covering A-Z, 0-9 and the punctuation the UI uses,
        authored in the existing `PixelArtSpec` format
  - [x] A helper that creates the retro font once and a text helper scenes call instead
        of `this.add.text(...)`, so the font lives in one place
  - [x] Title, HUD, results, game over, settings, help and the pause overlay all use it
  - [x] Text stays readable at the 960x540 logical size and at phone width
  - [x] Unit coverage for the glyph sheet (every declared character has art) and for the
        text helper
  - [x] The e2e specs that assert on text content still pass, updated where they assert
        on a `Text` object specifically
  - [x] Full verification green
- Non-goals / constraints:
  - No font files; the glyph sheet is procedural like the rest of the art.
  - Do not change any wording, only how it is drawn.

---

### TASK-032 - NES-leaning palette

- Status: DONE
- Requirement:
  The art uses 103 unique colours in a dusk/muted direction, with 14 colours on the
  player alone. Classic NES-era run-and-gun art is a small, saturated palette on
  near-black. Introduce one shared palette and route all art through it.
  `parsePixelArt` and `gridToCanvas` are the single choke point every sprite passes
  through, so a quantiser there re-palettes the whole game at once; the player and the
  four enemies then get hand-tuned rather than left to the quantiser.
- Acceptance criteria:
  - [x] One exported palette constant is the only place a colour is defined for art
  - [x] Every sprite renders through it; no sprite declares a colour outside it
  - [x] The loose `0x......` literals in scene code (HUD, particles, tints, boss bar,
        telegraphs, pit void) come from the same palette
  - [x] The player, the four enemy archetypes and both bosses are hand-tuned, not merely
        quantised, and reviewed against a screenshot
  - [x] Unit coverage asserting no art colour falls outside the palette
  - [x] `sprites.test.ts` still passes unchanged - it asserts sprite dimensions, which
        this task must not alter
  - [x] Full verification green, and the visual e2e specs updated if they assert colour
- Non-goals / constraints:
  - Do not resize any sprite; the dimension assertions tie art to hitboxes.
  - Keep contrast readable; a restricted palette must not make combat harder to parse.

---

### TASK-033 - Title screen and attract mode

- Status: DONE
- Requirement:
  The title screen is text on a flat background with no art at all. Give it an original
  logo and a backdrop, then add the arcade convention that ties this project together:
  after a short idle the title starts a DEMO, driven by the AI pilot that already exists,
  and any input returns to the title. This reuses `src/ai/pilot.ts` and the `autopilot`
  registry flag rather than adding a second way to play the game automatically.
- Acceptance criteria:
  - [x] An original title logo sprite plus a backdrop (starfield or skyline), not flat colour
  - [x] After roughly 15 s idle on the title, a demo starts: the pilot plays a level with
        a DEMO label visible
  - [x] Any control input during the demo returns to the title immediately
  - [x] The demo never starts during automated runs: `?autopilot`, `?debug` and the
        manual clock must all suppress the idle timer, the same way `?autopilot` already
        short-circuits the title
  - [x] The demo loop does not leak scenes, timers or listeners across repeats; the
        existing `hookShutdown` lifecycle is used
  - [x] E2E covers the idle timer starting a demo, input returning to title, and the
        suppression under automation flags
  - [x] Full verification green, including `npm run eval -- --baseline`
- Non-goals / constraints:
  - Do not change how a real game starts.
  - Do not let the demo write to persisted settings or the best score.

---

### TASK-034 - CRT / scanline option

- Status: DONE
- Requirement:
  Add an opt-in scanline/CRT presentation option in Settings, persisted like the other
  settings. Implement it as a tiling overlay, NOT a WebGL post-processing shader: the
  test and eval harnesses force `?renderer=canvas`, so a shader effect would be invisible
  to every automated check while shipping to real users on WebGL - untestable by
  construction.
- Acceptance criteria:
  - [x] A Settings row toggles the effect, persisted through the existing validated
        storage service with a safe default
  - [x] The overlay covers the whole view including the HUD, and sits above every other
        depth in use
  - [x] It honours `reducedFlash`: no pulsing, shimmer or animation when that is set
  - [x] It works under the canvas renderer, so e2e can assert it
  - [x] E2E asserts the overlay appears when enabled, disappears when disabled, and
        survives a reload
  - [x] Measured: no frame-time regression in the soak spec
  - [x] Full verification green
- Non-goals / constraints:
  - Do not change the logical resolution or the scale mode.
  - Default off, so nothing changes for an existing player without opting in.

---

### TASK-035 - Animation pass

- Status: DONE
- Requirement:
  Enemies and bosses have zero animation frames - `enemyArt.ts` and `bossArt.ts` are pure
  key switches and every enemy is one static image. The player has a two-frame run cycle
  at roughly 7 fps. Static actors are the clearest tell that this is not an arcade game.
  Add frames. The player poses are already composed from a shared body plus a legs spec,
  so new frames are new leg and torso specs rather than whole new sprites.
- Acceptance criteria:
  - [x] The player run cycle has at least 4 frames at an arcade-appropriate rate
  - [x] Each enemy archetype has at least a 2-frame idle or walk cycle, and a distinct
        firing frame
  - [x] Both bosses have at least a subtle idle animation
  - [x] Frame selection stays pure and unit-tested, following `playerPose.ts`
  - [x] Animation is driven by simulation time, not wall time, so it stays deterministic
        under the manual clock and the eval harness
  - [x] `sprites.test.ts` dimension assertions extended to the new frames
  - [x] Full verification green
- Non-goals / constraints:
  - Do not change any hitbox; art dimensions are tied to balance constants.
  - Do not change enemy behaviour, only its presentation.

---

### TASK-036 - Weapon roster and letter capsules

- Status: DONE
- Requirement:
  The game has three weapons: a rifle, a spread and a rapid. Two of the genre's
  signatures are missing - a piercing laser and an arcing flame. Add both, and adopt the
  letter-capsule pickup convention so a weapon reads at a glance.
  `WeaponDef` cannot currently express piercing or projectile gravity, so it needs new
  optional fields and matching branches in `stepWeapon`; everything else about weapons is
  already data-driven. `pickupLetter()` already exists in `LevelScene`, so the letter
  convention is half-built.
- Acceptance criteria:
  - [x] A piercing laser: passes through more than one target, with the pierce limit
        expressed as data rather than hard-coded
  - [x] An arcing or spiralling flame weapon, visually distinct in flight
  - [x] `WeaponDef` gains the fields these need; the three existing weapons are
        unchanged in behaviour and their tests pass untouched
  - [x] Pickups show their weapon letter, and the HUD shows the same letter
  - [x] Each new weapon has a distinct projectile sprite and fire sound
  - [x] The damage ledger still prevents a single shot damaging one target twice, and
        piercing does not bypass it
  - [x] Unit coverage for piercing and for the new projectile motion
  - [x] Full verification green; the eval matrix weapon axis extended to the new weapons
- Non-goals / constraints:
  - Do not retune the existing weapons' damage, cooldown or speed.
  - Do not add ammo limits or weapon switching.

---

### TASK-037 - Arcade feedback

- Status: DONE
- Requirement:
  Impact currently reads as a screen shake and a few 3 px rectangles. There is no sound
  at all for player death, enemy death or a boss hit, and one fixed 720 Hz blip serves
  all three weapons. Build out the feedback vocabulary so hits land.
- Acceptance criteria:
  - [x] Brief hit-stop on heavy impacts (boss hit, boss defeat, player death), expressed
        in simulation steps so it stays deterministic
  - [x] A damage flash on the player and on damaged enemies
  - [x] A death explosion for the player and for enemies, not just a burst of rectangles
  - [x] Sounds added for player death, enemy death and boss hit; each weapon has its own
        fire sound
  - [x] Every new effect honours `reducedFlash`, and hit-stop is suppressed or minimal
        under it
  - [x] Hit-stop does not break the fixed-step contract: `advanceSteps` must still
        advance exactly the number of steps it reports
  - [x] Unit coverage for the hit-stop state machine
  - [x] Full verification green, soak still bounded and heap-flat
- Blocker, now cleared (recorded 2026-09-13):
  Implementation is COMPLETE and every criterion above passes. The final criterion
  does not: `npm run eval -- --baseline` exits 1 with one regression,
  `coverageEnemyHarmless` for the grenadier. That defect is pre-existing and
  independent of this task - proven by re-running the probe with `reducedFlash` on,
  which suppresses every freeze this task added and produces identical results - and
  is filed as TASK-041. UNBLOCKED: TASK-041 landed and the gate is green again. The
  baseline was deliberately NOT updated and `HARMLESS_ARCHETYPES` was deliberately
  NOT used, because either would silence a real bug to make this task look green.
- Non-goals / constraints:
  - Do not change damage values or invulnerability duration.
  - Do not add screen-filling flashes; `reducedFlash` exists for a reason.

---

### TASK-038 - Set-piece mechanics: collapsing bridge and turret emplacement

- Status: DONE
- Requirement:
  Add two genre set pieces as reusable, data-authored mechanics: a bridge that collapses
  under the player, and a fixed turret emplacement. Both follow the established pattern -
  a pure module under `src/simulation/`, immutable state in the scene, one step call, one
  render block. The turret reuses the existing enemy FSM rather than inventing a new
  object type, so it inherits telegraphing and the concurrent-attack throttle for free.
- Acceptance criteria:
  - [x] A collapsing bridge authored in level data: solid, then collapses on a timer once
        triggered, then is gone
  - [x] A turret emplacement authored in level data, using the existing enemy pipeline
  - [x] Both are pure-module driven and unit-tested over immutable state
  - [x] `validateLevel` rejects malformed definitions of both
  - [x] Both appear in the runtime snapshot so the harness and an agent can see them
  - [x] **The AI pilot handles both.** `buildPilotGeometry` currently hands the pilot only
        pits, one-ways, spikes and the boss line - it knows nothing about doors, platforms
        or containers. A collapsing bridge on the critical path becomes a pit the pilot
        cannot see, so the geometry it receives must be extended
  - [x] `npm run eval -- --baseline` green, with the pilot completing any level using them
  - [x] Full verification green
- Placement note (recorded 2026-09-13):
  The turret is placed in the prototype room, which is where a new archetype is
  exercised before a level commits to one. The collapsing bridge is implemented
  end to end - schema, validation, pure module, scene step, dynamic solids,
  render, runtime snapshot and pilot geometry - but is not placed in Level 1 or
  2, because this task's own non-goal forbids changing existing layouts.
  TASK-039 (Level 3) is where it lands, and where the pilot-geometry path gets
  live coverage.
- Non-goals / constraints:
  - No climbable structures or vertical scrolling; the camera is horizontal-only by
    architecture and that is out of scope.
  - Do not change existing level layouts in this task.

---

### TASK-039 - Level 3 and a third theme

- Status: DONE
- Requirement:
  Add a third stage with its own visual identity, using the set pieces from TASK-038.
  Requires the `PROJECT.md` amendment from TASK-030, which currently bars more than two
  levels. Beyond the level data there is a known tail of hardcoded level counts to
  generalise rather than duplicate.
- Acceptance criteria:
  - [x] `src/levels/level3.ts` passes `validateLevel` and is registered in `levels.ts`
  - [x] A third `LevelTheme`; `themeForLevel` becomes a lookup rather than a hardcoded
        `if`, so a fourth theme costs nothing
  - [x] `startLevel3` joins the debug command union and `main.ts`
  - [x] The level-number hardcoding in `scripts/eval/matrix.mjs`, `scripts/eval/run.mjs`
        and `scripts/lib/mcpTools.mjs` is generalised, not extended case by case
  - [x] `fullGame.spec.ts` gains a third leg - its `final === true` assertion moves to the
        new last level and the spec fails until updated
  - [x] The AI pilot completes Level 3 from every checkpoint; the eval matrix covers it
  - [x] Full verification green
- Boss note (recorded 2026-09-13):
  Level 3 reuses the Reactor Warden, so the last two stages end with the same
  boss. A distinct third boss is real content work (sprite, patterns, balance)
  that this task neither asked for nor scoped, and building a rushed one would
  be worse than reusing a good one. Filed as TASK-042.
- Non-goals / constraints:
  - Side-scrolling only.
  - Original layout; no resemblance to any commercial stage, per `ASSET_POLICY.md`.

---

### TASK-040 - Per-stage music and a fuller SFX set

- Status: DONE
- Requirement:
  The whole game shares one 2-second, 8-step music loop - the same music on Level 1,
  Level 2 and both boss fights, with no title or results music. The synth is a single
  oscillator per voice, so NES-style percussion is impossible as written. Give each stage
  its own theme and add the missing voices.
- Acceptance criteria:
  - [x] Distinct original themes for the title, each stage, the boss fight and the
        results screen
  - [x] A noise-based percussion voice, so the music has drums
  - [x] Music changes on stage and boss transitions without clicks or overlap
  - [x] Everything respects the existing music/SFX volume and mute settings
  - [x] All audio synthesised at runtime; no audio files, per `ASSET_POLICY.md`
  - [x] Audio never blocks or throws when the AudioContext is unavailable, as today
  - [x] Full verification green; the soak spec still shows a flat heap
- Non-goals / constraints:
  - Do not transcribe or imitate any recognisable melody. The restored policy names this
    prohibition explicitly.
  - Do not add an asset pipeline.

---


### TASK-041 - Grenadier never attacks: inverted repositioning

- Status: DONE
- Requirement:
  The eval matrix's coverage invariant reported `enemy "grenadier" appeared but never
  damaged the player anywhere in the matrix`.
- Root cause (corrected during the work - the original diagnosis filed here was wrong):
  This task was first filed against the attack-concurrency cap, on the theory that the
  slowest-firing archetype was being starved of attack slots by faster neighbours. A
  step-by-step trace disproved that. The real cause was `repositionDir` in
  `src/simulation/enemyReposition.ts` returning the OPPOSITE of what its own doc
  comment promised, in both branches. A Grenadier that was too far from the player
  walked further away instead of closing in: from x=1500 against a player at x=1205 it
  drifted 1500 -> 1526 -> 1561 -> 1666 -> 1701, left its own 340 px `engageRange`
  within about two seconds, and could never fire again.
  A scheduler built against the wrong diagnosis was measured and removed: with the
  sign corrected the Grenadier lands 8 shots in 20 s under the ORIGINAL first-come
  rule and 8 under the scheduler, so slot starvation was never the mechanism and the
  extra machinery earned nothing.
- Why it survived so long:
  Five separate unit assertions had locked the inverted behaviour in, each with an
  inline comment that contradicted its own test name - "player to the right ... moves
  the enemy left, toward the player". The implementation and its tests were wrong in
  the same direction, so the suite was green and only a behavioural invariant over a
  whole matrix of runs could see it.
- Acceptance criteria:
  - [x] A grenadier within `engageRange` of the player reliably attacks, whatever else
        is on screen with it
  - [x] The two-slot concurrency cap is preserved unchanged
  - [x] The fix is in the pure simulation layer where it can be unit-tested
  - [x] Unit coverage proving the behaviour, not just the -1/+1: six engagement tests
        covering approach from both sides, staying in range, settling at the preferred
        band, backing off when crowded, and a sustained fire rate. All six fail on the
        old sign, as do the three corrected assertions in `newEnemies.test.ts` and the
        two in `enemyReposition.test.ts`
  - [x] `coverageEnemyHarmless` clears in the eval matrix, and `HARMLESS_ARCHETYPES`
        is NOT used to silence it
  - [x] Full verification green
- Non-goals / constraints:
  - No enemy damage, health, or fire interval was changed; this is a direction fix.
  - The concurrent-attack cap was not raised.

---

### TASK-042 - A third boss for Ashfall Ridge

- Status: DONE
- Requirement:
  Levels 2 and 3 both end with the Reactor Warden, because TASK-039 added a stage
  without adding a boss. Fighting the same boss twice in a row is the weakest moment
  in the game's progression. Give Ashfall Ridge its own final boss.
- Acceptance criteria:
  - [x] A third `BossDef` with its own sprite, pattern set and subcomponent layout,
        original to this project per `ASSET_POLICY.md`
  - [x] Distinct from the Siege Walker (ground, horizontal) and the Reactor Warden
        (static, subcomponent-gated) in how it must be fought, not only in appearance
  - [x] Damageable by every weapon in the roster, verified by the eval coverage
        invariant rather than by inspection - this is the exact class of bug TASK-022
        found, where a boss was immune to the default weapon
  - [x] The AI pilot defeats it from the `preboss` checkpoint with every weapon
  - [x] Two-frame idle animation, matching the other bosses (TASK-035)
  - [x] Full verification green
- Non-goals / constraints:
  - Do not retune the existing two bosses.
  - No new boss mechanics that need vertical scrolling or a camera change.

---

### TASK-043 - The Reactor Warden's charge pattern does nothing

- Status: DONE
- Requirement:
  `reactorWarden` declares `patterns: ['burst', 'charge']` but `chargeSpeed: 0`, and
  `stepBoss` implements charge purely as movement (`x += facing * chargeSpeed * dt`).
  Half the boss's rotation is therefore a wind-up followed by `attackDuration` seconds
  of nothing: it does not move, does not fire, and cannot hurt the player. The fight
  reads as a boss that keeps pausing. Give the Warden a real second attack.
- Evidence:
  Recorded during the original Contra-plan exploration as one of two balance oddities
  "worth filing separately rather than fixing here", and never filed. Still true:
  `siegeWalker` has `chargeSpeed: 260`, `reactorWarden` has `0`.
- Acceptance criteria:
  - [x] Every pattern in every boss's rotation does something observable
  - [x] The Warden keeps its identity: static, subcomponent-gated - the fix must not
        turn it into a second Siege Walker, and must not take the Ash Sentinel's volley,
        which `ashSentinel.test.ts` asserts is unique to it
  - [x] A unit test that fails if any boss is given a pattern it cannot perform
  - [x] The pilot still defeats the Warden from `preboss` with every weapon
  - [x] Full verification green
- Non-goals / constraints:
  - Do not change the Warden's health, phases or subcomponent layout.

---

### TASK-044 - The Rapid Carbine strictly dominates the Pulse Rifle

- Status: DONE
- Requirement:
  The starting Pulse Rifle and the Rapid Carbine deal the same damage (1), but the
  Carbine fires 2.2x faster (0.1s vs 0.22s) and its bullet travels faster (520 vs 460).
  It is better in every measurable way with no cost, so picking it up is never a
  decision and the Pulse Rifle stops existing the moment you find one. Every other
  weapon in the roster trades something: the Scatter spreads, the Laser fires slowly to
  pierce, the Flare arcs. Give the Carbine a real cost too.
- Evidence:
  Recorded during the original Contra-plan exploration and deliberately left out of
  scope then. Corroborated by the eval matrix: at the Level 3 boss the Carbine finishes
  in 480 steps against the Pulse Rifle's 689, with no offsetting weakness anywhere.
- Acceptance criteria:
  - [x] The Carbine has a drawback that shows up in play, not only on paper
  - [x] The Pulse Rifle is preferable in at least one identifiable situation
  - [x] No weapon becomes unable to defeat any boss; the coverage invariant still passes
  - [x] The pilot completes every level from every checkpoint with every weapon
  - [x] Full verification green
- Second instance found while doing this (recorded 2026-09-13):
  The balance invariants written for this task immediately reported a SECOND
  strict domination that predated it: at a 0.3s cooldown the Flare Thrower
  matched the Lance Laser's damage-per-second AND its damage per shot while
  having less than half the reach and no piercing, so the Laser beat it on
  every axis and the Flare had no reason to exist. Both were introduced in
  TASK-036. Fixed in the same change, because shipping a task about strict
  domination while leaving one in place would be incoherent.
- Non-goals / constraints:
  - **This is a deliberate balance change**, unlike TASK-043 which repairs a pattern
    that does nothing. It alters how the game plays and should be confirmed as wanted
    before it is taken.
  - Do not remove a weapon or add ammo limits.

---
