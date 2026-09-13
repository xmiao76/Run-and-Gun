/**
 * Typed contract for the runtime snapshots that scenes publish through the
 * debug bridge (`reportRuntime`).
 *
 * Pure types with no Phaser or scene imports, so tests, tooling, and external
 * agents can import the contract freely. The wire format stays flat - each
 * scene publishes one of these shapes verbatim, exactly as before - and the
 * active scene reported by `getState().scene` is the discriminator.
 *
 * `debugBridge.reportRuntime` enforces this union at the construction
 * boundary; `window.__GAME_DEBUG__.getState()` still returns the loose
 * record type for backward compatibility with older consumers, and newer
 * ones (e.g. the e2e GameDriver) cast to `DebugSnapshot`.
 */

/** Enemy entry as reported by the level scene. */
export interface LevelEnemySnapshot {
  id: string;
  kind: string;
  state: string;
  x: number;
  y: number;
}

/** Enemy projectile entry as reported by the level scene. */
export interface EnemyProjectileSnapshot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Downward acceleration for lobbed shots (0 for straight fire). */
  arcGravity: number;
}

/** A destructible boss subcomponent (e.g. a Reactor Warden node). */
export interface SubcomponentSnapshot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
}

/** Current world-space position of a moving platform. */
/**
 * How a life was lost. Enemy body contact is deliberately harmless (only
 * projectiles and the boss shockwave damage the player), so it is not a cause.
 */
export type DeathCause = 'pit' | 'hazard' | 'enemyFire' | 'bossShockwave';

export interface DeathEvent {
  cause: DeathCause;
  x: number;
  y: number;
  /** Simulation step the death landed on. */
  stepIndex: number;
  /**
   * False when an already-open invulnerability window swallowed the life loss.
   * A pit death can currently respawn the player for free this way; the
   * evaluator flags it rather than the scene silently hiding it.
   */
  costLife: boolean;
}

export interface MovingPlatformSnapshot {
  id: string;
  x: number;
  y: number;
  width: number;
}

/** Enemy entry as reported by the sandbox scene. */
export interface SandboxEnemySnapshot {
  id: string;
  kind: string;
  state: string;
  x: number;
  telegraphing: boolean;
}

/** Pickup entry as reported by the sandbox scene. */
export interface SandboxPickupSnapshot {
  id: string;
  weapon: string;
  x: number;
}

/** Gameplay snapshot published each step by the level scene. */
export interface LevelRuntime {
  level: string;
  levelIndex: number;
  playerX: number;
  playerY: number;
  grounded: boolean;
  crouching: boolean;
  playerPose: string;
  dying: boolean;
  lives: number;
  invuln: boolean;
  weapon: string;
  fireAngle: number;
  enemyCount: number;
  enemies: LevelEnemySnapshot[];
  projectileCount: number;
  enemyProjectileCount: number;
  /** Positions and velocities of enemy fire, so agents can dodge from state alone. */
  enemyProjectiles: EnemyProjectileSnapshot[];
  checkpoint: string;
  bossActive: boolean;
  bossHealth: number;
  bossState: string;
  bossPhase: number;
  bossVulnerable: boolean;
  /** Boss top-left position, or null when inactive/dead. */
  bossX: number | null;
  bossY: number | null;
  /** Seconds spent in the boss's current state (0 when inactive). */
  bossStateTimer: number;
  /** Destructible subcomponent nodes with positions (empty when none). */
  subcomponents: SubcomponentSnapshot[];
  subcomponentsAlive: number;
  /** Current positions of moving platforms (empty when none). */
  movingPlatforms: MovingPlatformSnapshot[];
  containersAlive: number;
  supplyCarriersAlive: number;
  supplyCarrierX: number | null;
  pickupsAvailable: number;
  autoPaused: boolean;
  telegraphCount: number;
  bossPattern: string | null;
  maxEnemiesSeen: number;
  maxPlayerBulletsSeen: number;
  maxEnemyBulletsSeen: number;
  particleCount: number;
  paused: boolean;
  gameOver: boolean;
  completing: boolean;
  score: number;
  /** True when the simulation is driven only by `advanceSteps` (`?manualClock`). */
  manualClock: boolean;
  /** True while the built-in AI pilot is playing (disengages on human input). */
  autopilot: boolean;
  /** Simulation steps run since this level started. */
  stepIndex: number;
  /**
   * Furthest x reached this run. Monotone, so a driver sampling every N steps
   * cannot miss progress that happened between two samples.
   */
  maxPlayerX: number;
  /**
   * Set once a step has queued the scene swap that ends this run. The
   * simulation is finished at that point even though Phaser has not yet
   * processed the swap.
   */
  ending: 'results' | 'gameOver' | null;
  /** Deaths this run, oldest first (capped). */
  deaths: DeathEvent[];
}

/** Gameplay snapshot published each step by the sandbox scene. */
export interface SandboxRuntime {
  playerX: number;
  playerY: number;
  grounded: boolean;
  lives: number;
  invuln: boolean;
  invulnRemaining: number;
  weapon: string;
  projectileCount: number;
  enemyProjectileCount: number;
  enemyCount: number;
  pickupCount: number;
  enemies: SandboxEnemySnapshot[];
  pickups: SandboxPickupSnapshot[];
  checkpoint: string;
  score: number;
  gameOver: boolean;
  /** True when the simulation is driven only by `advanceSteps` (`?manualClock`). */
  manualClock: boolean;
}

/** Snapshot published by the results screen. */
export interface ResultsRuntime {
  scene: 'results';
  score: number;
  bestScore: number;
  final: boolean;
}

/** Snapshot published by the game-over screen. */
export interface GameOverRuntime {
  scene: 'gameOver';
  score: number;
  bestScore: number;
}

/** Snapshot published by the settings screen. */
export interface SettingsRuntime {
  scene: 'settings';
  musicVolume: number;
  sfxVolume: number;
  mute: boolean;
  reducedFlash: boolean;
  startingLives: number;
}

/** Snapshot published by the help screen. */
export interface HelpRuntime {
  scene: 'help';
  controlsListed: string[];
}

/** Every shape a scene may publish; discriminated by `getState().scene`. */
export type RuntimeSnapshot =
  | LevelRuntime
  | SandboxRuntime
  | ResultsRuntime
  | GameOverRuntime
  | SettingsRuntime
  | HelpRuntime;

/** Full typed state returned by `window.__GAME_DEBUG__.getState()`. */
export interface DebugSnapshot {
  gameTitle: string;
  gameVersion: string;
  scene: string | null;
  titleHeading: string | null;
  runtime: RuntimeSnapshot | null;
}
