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