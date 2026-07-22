# Test Plan

## 1. Required scripts

The project must provide these scripts:

```text
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:watch
npm run test:e2e
npm run build
npm run preview
```

A `test:soak` script is recommended once the gameplay loop exists.

## 2. Unit tests

Required deterministic coverage:

- weapon cooldown and fire-rate enforcement;
- Scatter Blaster projectile angles and no duplicate-hit multiplication;
- damage, invulnerability window, death, and life decrement;
- checkpoint snapshot and restore;
- safe spawn-position selection;
- versioned storage parsing, invalid data fallback, and migration;
- enemy finite-state transitions;
- boss phase transition guards;
- score calculation;
- pause-neutralized input state.

Use fake or explicit simulation time. Avoid real timers in unit tests.

## 3. Integration tests

Cover boundaries between systems:

- player weapon creates the expected projectile descriptors;
- projectile collision produces one damage event;
- death restores the correct checkpoint state;
- level triggers spawn only within configured limits;
- boss defeat clears projectiles and advances level state;
- changing input device does not leave actions stuck.

## 4. Playwright E2E tests

Use Chromium as the required browser in CI/local automation. Keep E2E flows deterministic through a debug query parameter, test level, or seeded RNG.

Required flows:

1. Load title screen and assert no uncaught page errors.
2. Start a new game.
3. Move, jump, fire, crouch, and aim.
4. Pause and resume.
5. Change a setting and verify persistence after reload.
6. Trigger a controlled death and verify checkpoint respawn.
7. Verify the game-over screen through a deterministic test route.
8. Verify level-complete and final-completion screens through deterministic test routes.
9. Verify a phone-sized viewport shows usable touch controls.

Capture screenshots or traces on failure only. Do not commit large test artifacts.

## 5. Browser console policy

Treat these as failures during required flows:

- uncaught exceptions;
- unhandled promise rejections;
- failed required asset loads;
- repeated physics warnings;
- repeated audio errors after graceful fallback should have occurred.

Document intentionally ignored third-party warnings with justification.

## 6. Manual playtest checklist

At the end of each gameplay milestone, manually check:

- controls feel responsive;
- bullets and hazards are visually readable;
- attacks are telegraphed;
- checkpoints do not cause immediate repeated death;
- no platform edge traps;
- boss phases are understandable without documentation;
- pause and focus loss do not leave movement or firing stuck;
- audio settings work;
- the game remains playable with sound disabled.

Record findings in PROGRESS.md.

## 7. Soak test

Once enemies and projectiles exist, run a deterministic ten-minute simulation or automated browser scenario. Record:

- maximum active enemies;
- maximum player and enemy projectiles;
- memory trend if available;
- uncaught errors;
- whether the scene remains responsive.

The test passes only when counts stay within configured bounds and no error occurs.

## 8. Full quality gate

Before a local milestone commit:

```text
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Do not mark acceptance criteria complete unless exact command results are recorded in PROGRESS.md.
