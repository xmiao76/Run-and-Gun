# Architecture

## 1. Stack

- TypeScript, strict mode
- Phaser
- Vite
- Vitest
- Playwright
- ESLint
- Browser localStorage
- Static Cloudflare Pages deployment

Use current stable package releases at initial bootstrap and commit `package-lock.json`. Do not perform unrelated upgrades after bootstrap.

## 2. Suggested repository structure

```text
src/
  app/
    createGame.ts
    config.ts
  scenes/
    BootScene.ts
    PreloadScene.ts
    TitleScene.ts
    HelpScene.ts
    SettingsScene.ts
    LevelScene.ts
    PauseScene.ts
    ResultsScene.ts
  simulation/
    clock/
    collision/
    damage/
    weapons/
    enemies/
    bosses/
    checkpoints/
    scoring/
  entities/
    player/
    enemies/
    bosses/
    projectiles/
    pickups/
  levels/
    levelSchema.ts
    levelLoader.ts
    level1.ts
    level2.ts
  input/
    InputState.ts
    KeyboardInput.ts
    GamepadInput.ts
    TouchInput.ts
  audio/
    AudioService.ts
  persistence/
    schema.ts
    StorageService.ts
  ui/
    hud/
    touch/
  debug/
    debugBridge.ts
  balance/
    player.ts
    weapons.ts
    enemies.ts
    bosses.ts
  main.ts
public/
  assets/
    images/
    audio/
    fonts/
tests/
  unit/
  integration/
  e2e/
```

This is guidance, not a requirement to create empty abstractions. Introduce modules as features require them.

## 3. Runtime boundaries

### Simulation

Owns deterministic state transitions: weapon cooldowns, damage, invulnerability, lives, checkpoints, enemy state logic, boss phases, and score. It must not depend on DOM APIs and should minimize direct Phaser dependencies.

### Phaser adapter

Owns sprites, animations, cameras, tile collisions, particles, and synchronization between simulation state and visual objects.

### Input

Normalizes keyboard, gamepad, and touch into one per-step `InputState`. Gameplay logic reads normalized actions, not raw browser events.

### Persistence

Owns versioned localStorage data. All reads pass through validation and default recovery.

### UI

Displays state and emits commands. It must not directly mutate simulation internals.

## 4. Timing

- Target a 60 Hz logical update.
- Clamp unexpectedly large frame deltas.
- Never use render-frame count as elapsed time.
- Cooldowns, invulnerability, telegraphs, and boss phases use simulation time.
- Tests should advance time explicitly.

## 5. Collision model

Define centralized categories for:

- player body;
- player projectile;
- enemy body;
- enemy projectile;
- solid terrain;
- one-way platform;
- hazard;
- pickup;
- trigger;
- boss component.

Damage events require source ownership and a per-step or per-attack identifier to prevent duplicate callbacks.

## 6. Level format

Levels must be data-driven. A level definition should include:

- metadata and bounds;
- tile or platform geometry;
- background layers;
- spawn triggers;
- checkpoints;
- pickups;
- hazards;
- moving platforms;
- boss arena trigger;
- completion trigger.

Validate level data during development and fail with an actionable error.

## 7. Testability

Prefer pure functions or small stateful classes for:

- weapon fire eligibility and projectile patterns;
- damage and invulnerability;
- checkpoint serialization;
- storage migration and validation;
- enemy state transitions;
- boss phase transitions;
- score calculation;
- spawn safety checks.

Use Playwright for browser-level flows rather than attempting to unit-test Phaser rendering.

## 8. Debug bridge

Provide a read-only debug bridge in development or explicit debug mode. It may expose state snapshots and safe test commands such as starting a known test level. It must be disabled or inert by default in production.

## 9. Performance budgets

Initial budgets, to be refined only with evidence:

- Production JavaScript bundle: target under 2.5 MB compressed, excluding optional audio
- Active projectiles: bounded by configured pools
- Active regular enemies: normally 12 or fewer
- No per-frame unbounded array growth
- Avoid asset files above 2 MB without documented justification
- Maintain smooth play on a typical integrated-GPU laptop

## 10. Deployment

The production build must be static. Cloudflare Pages configuration:

- Build command: `npm run build`
- Output directory: `dist`
- No required environment variables
- No Pages Functions for the first release
