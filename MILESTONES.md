# Milestones

Complete in order unless a documented dependency requires a small adjustment.

## M0 - Repository bootstrap

- Initialize npm project and lockfile.
- Install Phaser, Vite, TypeScript, Vitest, Playwright, and ESLint.
- Create strict TypeScript, Vite, Vitest, Playwright, and ESLint configuration.
- Create required npm scripts.
- Add a minimal loading/title screen.
- Add one unit test and one Playwright title-screen test.
- Make the full quality gate pass.

## M1 - Deterministic mechanics sandbox

- Implement normalized input state.
- Implement player movement, jump, crouch, aim, and fire in a small test arena.
- Implement Pulse Rifle and projectile cleanup.
- Implement damage, invulnerability, life loss, and deterministic checkpoint respawn.
- Add debug bridge and tests.

Exit condition: a browser test can start the sandbox, move, jump, fire, take controlled damage, and respawn.

## M2 - Weapon and enemy foundations

- Add Scatter Blaster and Rapid Carbine.
- Add weapon pickups.
- Add Runner and Sentry.
- Add centralized collision categories and duplicate-hit protection.
- Add encounter/spawn trigger data.
- Complete relevant unit and E2E coverage.

## M3 - Level 1 vertical slice

- Build the original Jungle Outpost level.
- Add checkpoints, pits, one-way platforms, containers, HUD, score, pause, and audio foundations.
- Add Drone and Grenadier.
- Add the Siege Walker boss with three patterns and vulnerable phase.
- Add level-complete flow.

Exit condition: Level 1 is playable start to finish with keyboard.

## M4 - Level 2 and final flow

- Build the original Fortress Interior level.
- Add moving platforms, doors, and hazards.
- Reuse and remix existing regular enemies without adding archetypes.
- Add Reactor Warden with two phases and destructible subcomponents.
- Add final completion and game-over flows.

Exit condition: both levels are playable in sequence.

## M5 - Input, responsive UI, and persistence

- Complete gamepad support.
- Complete touch controls.
- Add responsive scaling and fullscreen.
- Add settings, best-score persistence, schema validation, and corruption fallback.
- Add reduced-flash option and focus-loss input handling.

## M6 - Original asset and audio polish

- Replace temporary shapes only where needed with original or documented permissive assets.
- Add original/permissive music and effects.
- Confirm asset manifest and licenses.
- Improve visual telegraphs and readability without expanding scope.

## M7 - Hardening and Cloudflare readiness

- Complete all acceptance criteria.
- Run soak tests.
- Fix browser console errors and performance leaks.
- Confirm static build and deployment documentation.
- Perform final manual playtest.
- Record final evidence in PROGRESS.md.

Do not deploy production automatically.
