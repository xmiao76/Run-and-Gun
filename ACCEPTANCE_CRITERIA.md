# Acceptance Criteria

Check a box only after recording verification evidence in PROGRESS.md.

## A. Repository and toolchain

- [x] A1. `npm install` succeeds from a clean checkout using the committed lockfile.
- [x] A2. `npm run dev` starts a playable local site.
- [x] A3. `npm run lint` exits with code 0.
- [x] A4. `npm run typecheck` exits with code 0 under strict TypeScript settings.
- [x] A5. `npm run test` exits with code 0.
- [x] A6. `npm run test:e2e` exits with code 0 in Chromium.
- [x] A7. `npm run build` exits with code 0 and creates `dist/`.
- [x] A8. No production dependency requires a server at runtime.

## B. Game startup and navigation

- [x] B1. The site loads without an uncaught browser console error.
- [x] B2. The title screen displays the original title Operation Iron Echo.
- [ ] B3. New Game starts Level 1 in a controlled playable state.
- [ ] B4. Help accurately lists keyboard, gamepad, and touch controls.
- [ ] B5. Settings persist volume, mute, reduced-flash, and control preferences.
- [ ] B6. Pause, resume, restart-level, and return-to-title work without stale state.

## C. Player mechanics

- [ ] C1. Horizontal movement is frame-rate independent and respects solid collisions.
- [ ] C2. Jumping, landing, variable jump height, and one-way platform drop-through are reliable.
- [ ] C3. Crouching changes the player's pose and collision behavior safely.
- [ ] C4. Eight-direction aiming and firing work in standing, moving, crouching, and airborne states.
- [ ] C5. Fire-rate limits prevent input frequency from bypassing weapon balance.
- [ ] C6. Player damage, temporary invulnerability, death, life loss, checkpoint respawn, and game over are correct.
- [ ] C7. The player never respawns inside a solid tile, hazard, enemy, or active projectile.

## D. Weapons and projectiles

- [ ] D1. Pulse Rifle, Scatter Blaster, and Rapid Carbine behave according to their data definitions.
- [ ] D2. Weapon pickups change the active weapon and clearly communicate the result.
- [ ] D3. Player and enemy projectiles use correct collision categories and ownership.
- [ ] D4. Projectiles expire or are recycled and do not grow without bound during a ten-minute soak test.
- [ ] D5. Scatter projectiles cannot multiply damage through duplicate collision callbacks in one simulation step.

## E. Enemies

- [ ] E1. Runner, Sentry, Drone, and Grenadier each have distinct tested behavior.
- [ ] E2. Every damaging enemy action has a readable visual or timing telegraph.
- [ ] E3. Level triggers cannot spawn an enemy on top of the player.
- [ ] E4. Enemies do not remain alive indefinitely far outside the active level region.
- [ ] E5. Attack concurrency is capped so ordinary encounters avoid unfair simultaneous attacks.

## F. Levels and checkpoints

- [ ] F1. Level 1 is complete from start through the Siege Walker boss.
- [ ] F2. Level 2 is complete from start through the Reactor Warden boss.
- [ ] F3. Each level includes at least two functioning checkpoints.
- [ ] F4. Falling into a pit or touching a lethal hazard follows the same documented life-loss flow.
- [ ] F5. Doors, moving platforms, destructible containers, and level transitions do not trap the player in an invalid state.
- [ ] F6. Level content is original and does not reproduce a Contra map or recognizable encounter sequence.

## G. Bosses

- [ ] G1. Siege Walker has three telegraphed patterns and a vulnerable phase.
- [ ] G2. Reactor Warden has two phases and destructible subcomponents.
- [ ] G3. Boss phase transitions are deterministic and cannot deadlock.
- [ ] G4. Boss health UI appears only when appropriate and reaches zero exactly once.
- [ ] G5. Boss defeat cannot leave hostile projectiles active during the completion sequence.

## H. Input and responsive behavior

- [ ] H1. Keyboard controls are fully playable.
- [ ] H2. A standard gamepad is fully playable after connection and user interaction.
- [ ] H3. Touch controls allow movement, jump, aim/fire, pause, and basic completion on a phone-sized viewport.
- [ ] H4. The canvas preserves aspect ratio and remains visible at common desktop, tablet, and phone viewports.
- [ ] H5. Losing window focus pauses or safely neutralizes held inputs.

## I. Persistence and resilience

- [ ] I1. Best score and settings survive a browser reload.
- [ ] I2. Saved local data is versioned and schema-validated.
- [ ] I3. Corrupt localStorage data does not prevent the game from starting.
- [ ] I4. Audio failure does not prevent gameplay.

## J. Quality and deployment

- [ ] J1. A Playwright smoke test starts a game, moves, jumps, fires, pauses, resumes, and returns to title.
- [ ] J2. Playwright verifies at least one checkpoint respawn flow.
- [ ] J3. Automated tests cover weapon rate limits, damage/invulnerability, checkpoint state, storage validation, and boss phase transitions.
- [ ] J4. A ten-minute automated or scripted soak test shows bounded enemy/projectile counts and no uncaught errors.
- [x] J5. `dist/` works when served as static files with SPA fallback behavior configured if needed.
- [x] J6. Cloudflare Pages settings are documented as build command `npm run build` and output directory `dist`.
- [ ] J7. ASSET_POLICY.md contains provenance and license notes for every non-code asset.
- [x] J8. The production UI, source assets, and metadata contain no Contra title, logo, characters, extracted assets, ROM data, or copied level layouts.
