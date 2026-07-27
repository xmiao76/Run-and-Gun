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

### TASK-014 - Selectable starting lives (3 default, 30 practice option)

- Status: DONE
- Requirement:
  Let the player choose the starting life count from the settings screen, with
  the current 3 as the default and 30 as an additional option, persisted in
  local storage like the other settings.
- Acceptance criteria:
  - [x] Settings screen exposes a starting-lives option with at least the values 3 and 30
  - [x] Default remains 3 for a fresh profile
  - [x] A new run starts with the selected life count and the HUD reflects it
  - [x] The choice persists across a page reload through the existing validated storage service
  - [x] Corrupt or out-of-range stored values fall back to 3
  - [x] Unit tests cover settings validation/defaulting for the new field
- Non-goals / constraints:
  - Do not change checkpoint, respawn, or game-over logic beyond honouring the configured count.
  - The HUD life row must stay readable at 30 lives (show a count rather than 30 icons).

---

### TASK-015 - Classic arcade feel pass

- Status: TODO
- Requirement:
  Tune the moment-to-moment gameplay closer to a classic arcade run-and-gun:
  brisker movement, denser and more aggressive encounters, and punchier combat
  feedback, without changing the level layouts or adding new systems.
- Acceptance criteria:
  - [ ] Player run speed and jump arc retuned for arcade pacing, with the values recorded in `src/balance/player.ts`
  - [ ] Enemy encounters are denser: wave sizes and/or spawn cadence increased in both levels
  - [ ] The spread weapon fires a visibly wider fan of pellets
  - [ ] Firing, hits, and deaths have stronger feedback (screen-shake or equivalent, respecting the reduced-flash setting)
  - [ ] Both levels remain completable start-to-finish; the full-game e2e stays green
  - [ ] The soak test still shows bounded enemy/projectile counts and a flat heap
- Non-goals / constraints:
  - Do not change level geometry, add levels, or add enemy archetypes.
  - Do not remove the existing telegraph wind-ups; readability must not regress.
  - Keep one-hit-per-life damage (already the current model).
- Open question (answer before starting):
  - Should difficulty rise overall (fewer safety nets, faster enemies) or stay
    approachable with only pacing and feedback improved? The criteria above
    assume "pacing and feedback, difficulty roughly unchanged".