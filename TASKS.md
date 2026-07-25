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

- Status: TODO
- Requirement:
  Build the second level with a different environment theme and stronger escalation.
- Acceptance criteria:
  - [ ] Level 2 has a distinct visual theme such as enemy base or industrial fortress
  - [ ] Level 2 visually differs from Level 1
  - [ ] Level 2 contains its own terrain/platform layout
  - [ ] Level 2 contains enemy encounters and pickups
  - [ ] Level 2 includes checkpoint support
  - [ ] Level 2 is playable from start to final boss encounter
  - [ ] Environment visuals are representational and non-abstract

---

### TASK-008 - Implement final boss and full game completion flow

- Status: TODO
- Requirement:
  Implement the final boss and the complete victory flow.
- Acceptance criteria:
  - [ ] Final boss exists
  - [ ] Final boss is visually distinct and more impressive than standard enemies
  - [ ] Final boss has readable attack patterns
  - [ ] The player can defeat the final boss
  - [ ] Beating the final boss leads to a victory/completion screen
  - [ ] Full game can be completed from title screen to ending

---

### TASK-009 - Implement HUD, pause, game over, local save, and polish

- Status: TODO
- Requirement:
  Finish the core user-facing loop and readable interface.
- Acceptance criteria:
  - [ ] HUD shows at least lives, score, and current weapon
  - [ ] Pause and resume work
  - [ ] Game over flow works
  - [ ] Restart flow works
  - [ ] High score is stored in local storage
  - [ ] Basic settings such as mute or volume are stored in local storage
  - [ ] HUD is readable and visually coherent with the game presentation
  - [ ] The game no longer looks like a prototype built from blocks

---

### TASK-010 - Add touch/gamepad support and responsive presentation

- Status: TODO
- Requirement:
  Improve accessibility across devices.
- Acceptance criteria:
  - [ ] Keyboard controls work reliably
  - [ ] Gamepad support works if feasible
  - [ ] Touch controls exist if feasible for first release
  - [ ] The layout remains usable on common desktop and mobile viewport sizes
  - [ ] Touch/gamepad support does not break keyboard play

---

### TASK-011 - Final quality pass and deployment readiness

- Status: TODO
- Requirement:
  Make the game release-ready for static deployment.
- Acceptance criteria:
  - [ ] `npm run lint` passes
  - [ ] `npm run typecheck` passes
  - [ ] `npm run test:unit` passes
  - [ ] `npm run test:e2e` passes
  - [ ] `npm run build` passes
  - [ ] `dist/` is generated correctly
  - [ ] The build is suitable for static hosting
  - [ ] No major placeholder art remains in the main user-facing flow
  - [ ] The final product clearly contains recognizable characters, weapons, enemies, and scenes
  - [ ] The project is ready for manual deployment to Cloudflare Pages

---

## Future enhancements

Add new enhancement tasks below this section later.
Do not start them until the core release tasks above are complete or explicitly reprioritized.