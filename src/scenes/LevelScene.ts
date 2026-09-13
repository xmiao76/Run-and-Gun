import Phaser from 'phaser';
import {
  DEATH_FALL_Y,
  GROUND_Y,
  INVULN_DURATION,
  PLAYER_HEIGHT,
  PLAYER_WIDTH
} from '../balance/player';
import { DEFAULT_WEAPON, getWeapon, type WeaponId } from '../balance/weapons';
import { GAME_VERSION, LOGICAL_HEIGHT, LOGICAL_WIDTH, SCENE_KEYS } from '../app/config';
import { stageTrack, type AudioService, type SfxName } from '../audio/AudioService';
import { createPilotMemory, decidePilotInput, pitsFromSolids, platformRanges, spikeRanges, type PilotGeometry, type PilotMemory } from '../ai/pilot';
import {
  clampStepCount,
  getDebugInput,
  isDebugEnabled,
  manualClockRequested,
  registerCommand,
  reportRuntime,
  reportScene,
  type CommandHandler,
  type DebugCommandName
} from '../debug/debugBridge';
import { type DeathCause, type DeathEvent, type LevelRuntime } from '../debug/runtimeTypes';
import { createKeyboardInput, type KeyboardInput } from '../input/KeyboardInput';
import { createGamepadInput, type GamepadInput } from '../input/GamepadInput';
import { createNeutralInput, isNeutralInput, mergeInput, type InputState } from '../input/InputState';
import { createTouchControls, isTouchDevice, type TouchControls } from '../ui/touch/TouchControls';
import { loadLevel, type LevelDef } from '../levels/levelLoader';
import { isLethalHazard, type Rect } from '../levels/levelSchema';
import { LEVELS } from '../levels/levels';
import { getBossDef, VOLLEY_HEIGHTS } from '../balance/bosses';
import {
  advanceCheckpoint,
  resolveCheckpoint,
  snapshotCheckpoint,
  type CheckpointData
} from '../simulation/checkpoints';
import { CollisionCategory, ENEMY_PROJECTILE_HITS, PLAYER_PROJECTILE_HITS } from '../simulation/categories';
import { createClock, tick, FIXED_DT, type ClockState } from '../simulation/clock';
import {
  clearLedger,
  createDamageLedger,
  recordHit,
  type DamageLedger
} from '../simulation/damageLedger';
import {
  createEnemyState,
  damageEnemy,
  isAlive,
  stepEnemy,
  telegraphAim,
  type EnemyFireIntent,
  type EnemyState
} from '../simulation/enemies';
import { aimAngle, rotateVelocity } from '../simulation/aim';
import { applyDamage, applyLethalDamage, createHealthState, tickInvuln, type HealthState } from '../simulation/health';
import { collectPickups, createPickup, type Pickup } from '../simulation/pickups';
import {
  createPlatformerState,
  currentHeight,
  stepPlatformer,
  type PlatformerState
} from '../simulation/platformer';
import {
  activateBoss,
  bossHasSubcomponents,
  createBossState,
  currentPattern,
  damageBoss,
  isBossAlive,
  SHOCKWAVE_RADIUS,
  shockwaveHits,
  stepBoss,
  type BossState
} from '../simulation/bosses';
import {
  createMovingPlatformStates,
  movingPlatformRect,
  stepMovingPlatform,
  type MovingPlatformState
} from '../simulation/movingPlatforms';
import {
  closedDoorRects,
  createDoorStates,
  stepDoor,
  type DoorState
} from '../simulation/doors';
import { respawnPosition } from '../simulation/safeSpawn';
import { ensureGameTextures } from '../art/textures';
import { selectPlayerPose, playerPoseTexture, type PlayerPoseKey } from '../art/playerPose';
import { bulletTexture } from '../art/weaponArt';
import { enemyFrame } from '../art/enemyArt';
import { getEnemyDef, type EnemyKind } from '../balance/enemies';
import { bossFrame } from '../art/bossArt';
import { propsForSolid, horizonForLevel, themeForLevel } from '../art/levelTheme';
import { lifeHudLayout, MAX_LIFE_ICONS } from '../ui/hudLives';
import { shakeFor, type ShakeEvent } from '../ui/screenShake';
import { createHitStop, tickHitStop, triggerHitStop, type HitStopEvent, type HitStopState } from '../ui/hitStop';
import { hookShutdown } from './sceneLifecycle';
import { drawText, setText } from '../ui/text';
import { attachScanlines } from '../ui/scanlines';
import {
  spawnParticles,
  stepParticles,
  type Particle,
  type ParticleSpawn
} from '../simulation/particles';
import {
  createContainerStates,
  damageContainer,
  solidContainerRects,
  type ContainerState
} from '../simulation/containers';
import {
  bridgeCarries,
  bridgeGaps,
  createBridgeStates,
  solidBridgeRects,
  stepBridge,
  type BridgeState
} from '../simulation/bridges';
import {
  CARRIER_HEIGHT,
  CARRIER_WIDTH,
  createSupplyCarrierStates,
  damageCarrier,
  stepCarrierDrops,
  stepSupplyCarriers,
  type CarrierDrop,
  type SupplyCarrierState
} from '../simulation/supplyCarriers';
import {
  createSpawnTriggers,
  updateSpawnTriggers,
  type SpawnTrigger
} from '../simulation/spawnTriggers';
import {
  createWeaponState,
  stepProjectiles,
  stepWeapon,
  type Projectile,
  type WeaponState
} from '../simulation/weapons';
import { DEFAULT_SETTINGS, type Settings } from '../persistence/schema';
import { saveSettings } from '../persistence/StorageService';
import { PALETTE_HEX } from '../art/palette';

const MAX_ENEMIES = 12;
const MAX_PROJECTILES = 96;
/** Cap on the published death log; a 30-life run cannot exceed this. */
const MAX_DEATH_EVENTS = 64;

/** Snapshot precision for positions: two decimals is plenty and keeps the wire small. */
const round2 = (v: number): number => Math.round(v * 100) / 100;

const COMPLETION_DELAY = 1.2;
/** Seconds the death pose holds before the respawn (classic arcade death pause). */
const DEATH_DURATION = 0.9;
/** Simulation steps an enemy stays lit after taking a hit (~100 ms). */
const ENEMY_FLASH_STEPS = 6;

/** Seconds the hurt flinch pose shows after a damaging hit. */
const HURT_DURATION = 0.3;
/**
 * Simulation steps per player run-cycle frame. 8 steps ≈ 133 ms at 60 Hz, so
 * the four-frame cycle loops in about half a second - and, being sim-driven,
 * it freezes while paused and is deterministic under the manual clock.
 */
const RUN_FRAME_STEPS = 8;

interface PlayerBullet extends Projectile {
  id: string;
  /** Collision ownership: always the player-projectile category (D3). */
  category: number;
  /**
   * Every target this projectile has already damaged, for its whole lifetime.
   *
   * The damage ledger is cleared each step, which is all a one-hit shot needs:
   * it is consumed the moment it connects. A PIERCING shot outlives its first
   * hit and can still be overlapping that same target on the next step, when
   * the ledger no longer remembers it - so without this list a laser would
   * re-damage one enemy every step it took to pass through. Piercing must let a
   * shot hit MORE targets, never the same target more often.
   */
  hitIds: string[];
}
interface EnemyBullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
  damage: number;
  arcGravity: number;
  /** Archetype that fired it, so a hit can be attributed for coverage. */
  sourceKind: string;
  /** Collision ownership: always the enemy-projectile category (D3). */
  category: number;
}

/** A destructible boss subcomponent (e.g. a Reactor Warden turret). */
interface SubcomponentState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  score: number;
  alive: boolean;
}

/**
 * Level 1 gameplay scene. Wires the data-driven level (platforms, one-way
 * platforms, hazards, checkpoints, spawn triggers, pickups, boss) into the
 * fixed 60 Hz loop with a clamped follow camera, HUD, boss health bar, an
 * in-scene pause overlay with settings toggles, and a level-complete sequence
 * that hands off to the results scene. All rules live in pure modules.
 */
export class LevelScene extends Phaser.Scene {
  private level!: LevelDef;
  private levelIndex = 0;
  private player!: PlatformerState;
  private health!: HealthState;
  private weapon!: WeaponState;
  private playerBullets: PlayerBullet[] = [];
  private enemyBullets: EnemyBullet[] = [];
  private enemies: EnemyState[] = [];
  private pickups: Pickup[] = [];
  private triggers: SpawnTrigger[] = [];
  private boss!: BossState;
  private score = 0;
  private checkpoint!: CheckpointData;
  private lastCheckpointId = '';
  private cameraX = 0;
  private lastFireAngle = 0;
  private clock: ClockState = createClock();
  private stepInput: InputState = createNeutralInput();
  private keyboard: KeyboardInput = createKeyboardInput();
  private gamepad: GamepadInput = createGamepadInput();
  private touch: TouchControls | null = null;
  private onBlur: (() => void) | null = null;
  private onRegainFocus: (() => void) | null = null;
  /**
   * True when the pause came from losing window focus rather than from the
   * player. Auto-pauses clear themselves as soon as focus returns, so a browser
   * stealing focus (Edge's sidebar, password bubbles, notification toasts)
   * cannot leave the game permanently unresponsive.
   */
  private autoPaused = false;
  private ledger: DamageLedger = createDamageLedger();
  private nextId = 1;
  private paused = false;
  /**
   * Agent-driven manual clock (`?manualClock`, debug-only). When true, wall
   * time never advances the simulation - only the `advanceSteps` debug
   * command does - so programmatic drivers get step-exact determinism and
   * bridge input edges persist until the driver's next step consumes them.
   */
  private manualClock = false;
  /**
   * Built-in AI pilot (autoplay demo). While engaged it contributes an
   * InputState at the same merge layer as the devices; any human gameplay
   * input disengages it immediately and permanently for the run.
   */
  private pilotEngaged = false;
  /** True while this level is the title screen's attract demo. */
  private attractMode = false;
  private pilotMemory: PilotMemory | null = null;
  /** Last published snapshot; the pilot's perception for the next step. */
  private lastRuntime: LevelRuntime | null = null;
  private aiLabel?: Phaser.GameObjects.BitmapText;
  /** Disposers for this scene's bridge commands, released on shutdown. */
  private debugDisposers: Array<() => void> = [];
  /**
   * Set the moment a step queues the scene swap that ends the run.
   *
   * Phaser's `scene.start` only QUEUES the swap - it lands on the next Scene
   * Manager update, not immediately - so `this.scene.isActive()` stays true for
   * the rest of a synchronous `advanceSteps` batch. Without this latch a game
   * over re-queued stop+start once per remaining step, and after a completion
   * `completionTimer` went negative so its branch was skipped and the level kept
   * simulating, which could start `results` and `gameOver` from one batch.
   */
  private ending: 'results' | 'gameOver' | null = null;
  private stepIndex = 0;
  /** World-freeze state for heavy impacts (TASK-037). */
  private hitStop: HitStopState = createHitStop();
  /**
   * Whether the step just run was held by a freeze.
   *
   * Published rather than `isFrozen(this.hitStop)`, which is the state AFTER
   * the step's decrement and so reported the last frozen step as running - one
   * step out of phase for anything reading the snapshot.
   */
  private hitStoppedThisStep = false;
  /**
   * Enemies flashing from a hit, as `enemy id -> steps of flash remaining`.
   *
   * Kept in the scene rather than on `EnemyState` because it is presentation
   * only: the simulation must not carry a field that exists to tint a sprite.
   */
  private enemyFlash: Map<string, number> = new Map();
  private maxPlayerX = 0;
  private deaths: DeathEvent[] = [];
  private bossDamageTaken = 0;
  private killsByKind: Record<string, number> = {};
  private damageByKind: Record<string, number> = {};
  /** Cause of the death currently playing out, carried into `finishDeath`. */
  private pendingDeathCause: DeathCause | null = null;
  private completionTimer = -1;
  private maxEnemiesSeen = 0;
  private maxPlayerBulletsSeen = 0;
  private maxEnemyBulletsSeen = 0;
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private movingPlatforms: MovingPlatformState[] = [];
  private doors: DoorState[] = [];
  private containers: ContainerState[] = [];
  private bridges: BridgeState[] = [];
  private supplyCarriers: SupplyCarrierState[] = [];
  private carrierDrops: CarrierDrop[] = [];
  private particles: Particle[] = [];
  private particleSeq = 1;
  private subcomponents: SubcomponentState[] = [];
  private lastBossPhase = 0;
  private bossDeathHandled = false;

  private groundTiles: Phaser.GameObjects.TileSprite[] = [];
  private oneWayTiles: Phaser.GameObjects.TileSprite[] = [];
  private hazardVoids: Phaser.GameObjects.Rectangle[] = [];
  private hazardRims: Phaser.GameObjects.TileSprite[] = [];
  private propImages: { image: Phaser.GameObjects.Image; worldX: number; baseY: number }[] = [];
  private starsLayer?: Phaser.GameObjects.TileSprite;
  private bandLayer?: Phaser.GameObjects.TileSprite;
  private pipesLayer?: Phaser.GameObjects.TileSprite;
  private bandScrollFactor = 0.3;
  private movingPlatformTiles: Phaser.GameObjects.TileSprite[] = [];
  private doorImages: Phaser.GameObjects.Image[] = [];
  private containerImages: Phaser.GameObjects.Image[] = [];
  private bridgeTiles: Phaser.GameObjects.Image[] = [];
  private particleRects: Phaser.GameObjects.Rectangle[] = [];
  private carrierImages: Phaser.GameObjects.Image[] = [];
  private subcomponentImages: Phaser.GameObjects.Image[] = [];
  private telegraphRects: Phaser.GameObjects.Rectangle[] = [];
  private aimLineRects: Phaser.GameObjects.Rectangle[] = [];
  private enemyBulletImages: Phaser.GameObjects.Image[] = [];
  private playerBulletImages: Phaser.GameObjects.Image[] = [];
  private pickupImages: Phaser.GameObjects.Image[] = [];
  private pickupLabels: Phaser.GameObjects.BitmapText[] = [];
  private playerImage?: Phaser.GameObjects.Image;
  private enemyImages: Phaser.GameObjects.Image[] = [];
  private animTimeMs = 0;
  private deathTimer = -1;
  private hurtTimer = 0;
  private bossImage?: Phaser.GameObjects.Image;
  private bossTeleRect?: Phaser.GameObjects.Rectangle;
  private bossZoneRect?: Phaser.GameObjects.Rectangle;
  private lifeImages: Phaser.GameObjects.Image[] = [];
  private lifeCountText?: Phaser.GameObjects.BitmapText;
  private weaponIcon?: Phaser.GameObjects.Image;
  private weaponText?: Phaser.GameObjects.BitmapText;
  private scoreText?: Phaser.GameObjects.BitmapText;
  private bossLabelText?: Phaser.GameObjects.BitmapText;
  private bossBarBack?: Phaser.GameObjects.Rectangle;
  private bossBarFill?: Phaser.GameObjects.Rectangle;
  private overlayText?: Phaser.GameObjects.BitmapText;
  private overlaySubText?: Phaser.GameObjects.BitmapText;

  constructor() {
    super(SCENE_KEYS.level);
  }

  public create(): void {
    const idx = (this.registry.get('currentLevelIndex') as number | undefined) ?? 0;
    this.levelIndex = Math.min(Math.max(idx, 0), LEVELS.length - 1);
    this.level = loadLevel(LEVELS[this.levelIndex]);
    // Phaser reuses the scene instance across scene.start calls, so the flag
    // is re-read here rather than once at construction.
    this.manualClock = manualClockRequested();
    // Autoplay: engage the AI pilot when the session toggle is on. The flag
    // persists (registry) so the AI keeps playing across level transitions
    // and restarts until the player switches it off (I in-level).
    this.pilotEngaged = this.registry.get('autopilot') === true;
    this.attractMode = this.registry.get('attractMode') === true;
    this.pilotMemory = this.pilotEngaged ? createPilotMemory(this.buildPilotGeometry()) : null;
    // Phaser reuses the scene instance across scene.start calls, so pooled
    // render arrays must be cleared before they are rebuilt; otherwise they
    // would hold stale entries from the previous run and index out of bounds.
    this.groundTiles = [];
    this.oneWayTiles = [];
    this.hazardVoids = [];
    this.hazardRims = [];
    this.propImages = [];
    this.movingPlatformTiles = [];
    this.doorImages = [];
    this.subcomponentImages = [];
    this.enemyImages = [];
    this.telegraphRects = [];
    this.aimLineRects = [];
    this.enemyBulletImages = [];
    this.playerBulletImages = [];
    this.pickupImages = [];
    this.pickupLabels = [];
    this.containerImages = [];
    this.bridgeTiles = [];
    this.particleRects = [];
    this.carrierImages = [];
    this.lifeImages = [];
    // Settings must be read before resetRun(), which seeds the run's life count
    // from them; loading them later left a new run on the default 3 lives.
    this.settings = (this.registry.get('settings') as Settings | undefined) ?? { ...DEFAULT_SETTINGS };
    this.resetRun();
    ensureGameTextures(this);
    this.buildEnvironment();
    // Feet-anchored so poses with different heights (stand/crouch/death) stay planted.
    this.playerImage = this.add.image(0, 0, 'art/player-idle').setOrigin(0, 1);
    this.bossImage = this.add.image(0, 0, 'art/boss-siege-walker').setOrigin(0, 0).setVisible(false);
    this.bossTeleRect = this.add.rectangle(0, 0, 72, 64);
    this.bossTeleRect.setOrigin(0, 0);
    this.bossTeleRect.setStrokeStyle(3, PALETTE_HEX.YELLOW);
    this.bossTeleRect.setFillStyle(PALETTE_HEX.BLACK, 0);
    this.bossTeleRect.setVisible(false);
    this.bossZoneRect = this.add.rectangle(0, 0, SHOCKWAVE_RADIUS * 2, 6, PALETTE_HEX.GOLD);
    this.bossZoneRect.setOrigin(0.5, 1);
    this.bossZoneRect.setVisible(false);

    // HUD (depth >= 100 so world objects can never cover it). The life row is
    // given fixed space for its worst case (MAX_LIFE_ICONS) so the weapon
    // readout never collides with it at higher life counts.
    const LIFE_X = 14;
    const LIFE_STEP = 16;
    const WEAPON_X = LIFE_X + MAX_LIFE_ICONS * LIFE_STEP + 10;
    for (let i = 0; i < MAX_LIFE_ICONS; i++) {
      this.lifeImages.push(this.add.image(LIFE_X + i * LIFE_STEP, 8, 'art/ui-life').setOrigin(0, 0).setDepth(100));
    }
    this.lifeCountText = drawText(this, LIFE_X + 18, 9, '', { size: 16, color: '#e8f1ff', depth: 100 });
    this.weaponIcon = this.add.image(WEAPON_X, 12, 'art/bullet-pulse').setOrigin(0, 0).setDepth(100);
    this.weaponText = drawText(this, WEAPON_X + 18, 16, '', { size: 16, color: '#e8f1ff', depth: 100 });
    this.scoreText = drawText(this, LOGICAL_WIDTH - 12, 16, '', { size: 16, color: '#e8f1ff', originX: 1, originY: 0, depth: 100 });
    drawText(this, LOGICAL_WIDTH - 12, LOGICAL_HEIGHT - 16, 'v' + GAME_VERSION, {
      size: 8,
      color: '#5c6c8c',
      originX: 1,
      originY: 0.5,
      depth: 100
    });
    drawText(this, 12, LOGICAL_HEIGHT - 16, 'Arrows move/aim   Z jump   X fire   Up+X diagonal   Esc pause', {
      size: 8,
      color: '#5c6c8c',
      originX: 0,
      originY: 0.5,
      depth: 100
    });
    // Autoplay indicator, visible only while the AI pilot is in control. The
    // attract demo gets its own wording: any key returns to the title.
    this.aiLabel = drawText(this, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 16,
      this.attractMode ? 'DEMO - PRESS ANY KEY' : 'AI PLAYING - press any control key to take over', {
      size: 8,
      color: '#ffd970',
      originX: 0.5,
      originY: 0.5,
      depth: 100
    });
    this.aiLabel.setVisible(this.pilotEngaged);
    this.bossLabelText = drawText(this, LOGICAL_WIDTH / 2, 4, '', { size: 16, color: '#ffb3a7', originX: 0.5, originY: 0, depth: 100 });
    this.bossLabelText.setVisible(false);
    this.bossBarBack = this.add.rectangle(LOGICAL_WIDTH / 2 - 150, 28, 300, 10, PALETTE_HEX.RED_DARK);
    this.bossBarBack.setOrigin(0, 0.5);
    this.bossBarBack.setVisible(false);
    this.bossBarBack.setDepth(100);
    this.bossBarFill = this.add.rectangle(LOGICAL_WIDTH / 2 - 150, 28, 300, 10, PALETTE_HEX.RED_LIGHT);
    this.bossBarFill.setOrigin(0, 0.5);
    this.bossBarFill.setVisible(false);
    this.bossBarFill.setDepth(100);
    this.overlayText = drawText(this, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, '', { size: 32, color: '#e8f1ff', originX: 0.5, originY: 0.5, depth: 110 });
    this.overlaySubText = drawText(this, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 40, '', { size: 16, color: '#8fa3c7', originX: 0.5, originY: 0.5, depth: 110 });
    this.overlayText.setVisible(false);
    this.overlaySubText.setVisible(false);
    this.keyboard.attach(window);
    LevelScene.attachKeys();
    this.touch = this.shouldShowTouchControls() ? createTouchControls() : null;
    // Under the manual clock the scene is driven by an external agent; focus
    // churn (headless pages, DevTools) must not auto-pause the session.
    if (!this.manualClock) {
      this.onBlur = (): void => {
        // H5: losing window focus pauses and neutralizes held inputs. Only mark
        // it auto-paused when the player had not already paused deliberately.
        if (!this.paused) {
          this.autoPaused = true;
        }
        this.paused = true;
        this.keyboard.clear();
      };
      window.addEventListener('blur', this.onBlur);

      // Regaining focus (or clicking/tapping the game) lifts an auto-pause. A
      // deliberate Esc pause is left alone so it still needs an explicit resume.
      this.onRegainFocus = (): void => {
        if (this.autoPaused) {
          this.autoPaused = false;
          this.paused = false;
          // Held keys were cleared on blur; re-sync so nothing sticks.
          this.keyboard.clear();
        }
      };
      window.addEventListener('focus', this.onRegainFocus);
      window.addEventListener('pointerdown', this.onRegainFocus);
    }
    this.registerDebugCommands();
    hookShutdown(this.events, () => this.shutdown());
    reportScene(SCENE_KEYS.level);
    attachScanlines(this);
    this.publishRuntime();
    const audio = this.registry.get('audio') as AudioService | undefined;
    audio?.setSettings(this.settings);
    audio?.setMusic(stageTrack(this.levelIndex));
  }

  public shutdown(): void {
    for (const dispose of this.debugDisposers) {
      dispose();
    }
    this.debugDisposers = [];
    this.keyboard.detach(window);
    LevelScene.detachKeys();
    if (this.onBlur) {
      window.removeEventListener('blur', this.onBlur);
      this.onBlur = null;
    }
    if (this.onRegainFocus) {
      window.removeEventListener('focus', this.onRegainFocus);
      window.removeEventListener('pointerdown', this.onRegainFocus);
      this.onRegainFocus = null;
    }
    if (this.touch) {
      this.touch.destroy();
      this.touch = null;
    }
    const audio = this.registry.get('audio') as AudioService | undefined;
    audio?.setMusic(null);
  }

  /**
   * Keep the music matched to the situation.
   *
   * Called every step; `setMusic` ignores a request for the track already
   * playing, so this cannot restart the loop or stutter. The boss theme holds
   * until the fight is genuinely over, then the stage theme returns.
   */
  private syncMusic(): void {
    const audio = this.registry.get('audio') as AudioService | undefined;
    if (!audio) {
      return;
    }
    const fighting = this.boss.active && isBossAlive(this.boss);
    audio.setMusic(fighting ? 'boss' : stageTrack(this.levelIndex));
  }

  public override update(_time: number, deltaMs: number): void {
    // All three sources are edge-triggered, so a quick tap is never dropped.
    const pauseEdge =
      LevelScene.consumePress('Escape') || this.gamepad.pauseEdge() || (this.touch?.consumePauseEdge() ?? false);
    if (pauseEdge) {
      this.paused = !this.paused;
      // An explicit toggle takes ownership of the pause state either way.
      this.autoPaused = false;
    }

    // In-level I: switch the AI pilot on/off (persists in the session).
    if (LevelScene.consumePress('KeyI')) {
      this.togglePilot();
    }

    if (this.paused) {
      // Keep the gamepad Start-button edge tracking alive while paused so it
      // can resume the game (stepOnce, which normally polls it, is frozen).
      this.gamepad.build();
      this.handlePauseInput();
      this.publishRuntime();
      this.render();
      this.renderPauseOverlay();
      return;
    }

    if (this.manualClock) {
      // Agent-driven: wall time never steps the simulation; only the debug
      // `advanceSteps` command does. Rendering continues so the canvas always
      // reflects the current simulation state between agent steps, and debug
      // input edges persist until the agent's next step consumes them
      // (readDebugInput runs only inside stepOnce).
      this.clock.accumulator = 0;
      this.render();
      return;
    }

    const result = tick(this.clock, deltaMs / 1000);
    this.clock.accumulator = result.accumulator;
    for (let i = 0; i < result.steps; i++) {
      this.stepOnce();
    }
    this.animTimeMs += deltaMs;
    this.render();
  }

  /** Real touch devices always get touch controls; a debug `touch` query param forces them for automation. */
  private shouldShowTouchControls(): boolean {
    if (isTouchDevice()) {
      return true;
    }
    if (!isDebugEnabled()) {
      return false;
    }
    return new URLSearchParams(window.location.search).has('touch');
  }

  private makeId(prefix: string): string {
    const id = prefix + this.nextId;
    this.nextId += 1;
    return id;
  }

  private resetRun(): void {
    const startingLives = this.settings.startingLives;
    this.player = createPlatformerState(this.level.spawn.x, this.level.spawn.y);
    this.health = createHealthState(startingLives);
    this.weapon = createWeaponState(DEFAULT_WEAPON);
    this.playerBullets = [];
    this.hitStop = createHitStop();
    this.hitStoppedThisStep = false;
    this.enemyFlash.clear();
    this.enemyBullets = [];
    this.enemies = [];
    this.pickups = this.level.pickups.map((p) => ({ id: p.id, x: p.x, y: p.y, width: 18, height: 18, weapon: p.weapon, collected: false }));
    this.triggers = createSpawnTriggers(this.level.triggers);
    this.boss = createBossState(this.level.boss.id);
    this.movingPlatforms = createMovingPlatformStates(this.level.movingPlatforms);
    this.doors = createDoorStates(this.level.doors);
    this.containers = createContainerStates(this.level.containers);
    this.bridges = createBridgeStates(this.level.bridges ?? []);
    this.supplyCarriers = createSupplyCarrierStates(this.level.supplyCarriers ?? []);
    this.carrierDrops = [];
    this.particles = [];
    this.particleSeq = 1;
    this.lastBossPhase = 0;
    this.bossDeathHandled = false;
    this.buildSubcomponents();
    this.score = 0;
    this.lastCheckpointId = this.level.checkpoints[0].id;
    this.checkpoint = snapshotCheckpoint({
      levelId: this.level.id,
      checkpointId: this.lastCheckpointId,
      lives: startingLives,
      score: 0,
      weapon: DEFAULT_WEAPON,
      spawnX: this.level.spawn.x,
      spawnY: this.level.spawn.y
    });
    this.cameraX = 0;
    this.clock = createClock();
    this.stepInput = createNeutralInput();
    this.ledger = createDamageLedger();
    this.nextId = 1;
    this.paused = false;
    this.completionTimer = -1;
    this.deathTimer = -1;
    this.hurtTimer = 0;
    this.animTimeMs = 0;
    this.maxEnemiesSeen = 0;
    this.maxPlayerBulletsSeen = 0;
    this.maxEnemyBulletsSeen = 0;
    this.stepIndex = 0;
    this.maxPlayerX = this.player.x;
    this.deaths = [];
    this.bossDamageTaken = 0;
    this.killsByKind = {};
    this.damageByKind = {};
    this.pendingDeathCause = null;
    this.ending = null;
  }

  private buildSubcomponents(): void {
    const def = getBossDef(this.level.boss.id);
    this.subcomponents = [];
    if (!bossHasSubcomponents(def)) {
      return;
    }
    const phaseDef = def.phases[this.boss.phase];
    if (!phaseDef) {
      return;
    }
    for (const s of phaseDef.subcomponents) {
      this.subcomponents.push({
        id: s.id,
        x: this.boss.x + s.dx,
        y: this.boss.y + s.dy,
        width: s.width,
        height: s.height,
        health: s.health,
        score: s.score,
        alive: true
      });
    }
  }

  private registerDebugCommands(): void {
    // Every handler below closes over this scene instance, so each registration
    // is disposed on shutdown (see `shutdown()`); otherwise a stopped level
    // would keep answering bridge commands.
    const reg = (name: DebugCommandName, handler: CommandHandler): void => {
      this.debugDisposers.push(registerCommand(name, handler));
    };
    reg('pause', () => {
      this.paused = true;
      this.publishRuntime();
      return { ok: true };
    });
    reg('resume', () => {
      this.paused = false;
      this.publishRuntime();
      return { ok: true };
    });
    reg('teleportPlayer', (payload) => {
      const p = payload as { x?: number; y?: number } | undefined;
      if (typeof p?.x === 'number') {
        this.player = { ...this.player, x: p.x };
      }
      if (typeof p?.y === 'number') {
        this.player = { ...this.player, y: p.y };
      }
      this.publishRuntime();
      return { ok: true };
    });
    reg('damageBoss', (payload) => {
      if (!this.boss.active) {
        this.boss = activateBoss(this.boss);
      }
      const amount = typeof payload === 'number' ? payload : 99;
      const result = damageBoss(this.boss, amount);
      this.boss = result.boss;
      this.publishRuntime();
      return { ok: true, applied: result.applied, health: this.boss.health };
    });
    reg('defeatBoss', () => {
      if (!this.boss.active) {
        this.boss = activateBoss(this.boss);
      }
      // Debug/test affordance: force the vulnerable window, then apply a
      // lethal hit so the deterministic completion flow can be exercised.
      this.boss = { ...this.boss, vulnerable: true };
      this.boss = damageBoss(this.boss, this.boss.health).boss;
      this.publishRuntime();
      return { ok: true };
    });
    reg('completeLevel', () => {
      if (this.completionTimer < 0 && !this.health.gameOver) {
        this.completionTimer = COMPLETION_DELAY;
      }
      this.publishRuntime();
      return { ok: true };
    });
    reg('triggerGameOver', () => {
      this.health = { lives: 0, invuln: 0, gameOver: true };
      this.publishRuntime();
      return { ok: true };
    });
    reg('awardScore', (payload) => {
      const amount = typeof payload === 'number' ? payload : 0;
      this.score += Math.max(0, Math.floor(amount));
      this.publishRuntime();
      return { ok: true, score: this.score };
    });
    reg('startAtCheckpoint', (payload) => {
      // Restart the run at a chosen checkpoint with every spawn trigger AHEAD
      // of it still armed. `teleportPlayer` cannot be used for this:
      // `updateSpawnTriggers` fires when playerX enters [x0,x1], so teleporting
      // across a trigger skips its wave permanently - which is exactly how
      // `fullGame.spec` flew past (and hid) the Level 2 door bug.
      const p = payload as { id?: string; index?: number; lives?: number; weapon?: WeaponId } | undefined;
      const list = this.level.checkpoints;
      const cp =
        typeof p?.id === 'string'
          ? list.find((c) => c.id === p.id)
          : typeof p?.index === 'number'
            ? list[p.index]
            : list[0];
      if (!cp) {
        return { ok: false, error: `no such checkpoint: ${p?.id ?? p?.index}` };
      }
      this.resetRun();
      if (typeof p?.lives === 'number' && p.lives > 0) {
        this.health = createHealthState(Math.floor(p.lives));
      }
      if (p?.weapon) {
        this.weapon = createWeaponState(p.weapon);
      }
      this.lastCheckpointId = cp.id;
      this.player = createPlatformerState(cp.x, cp.y);
      this.maxPlayerX = cp.x;
      this.checkpoint = snapshotCheckpoint({
        levelId: this.level.id,
        checkpointId: cp.id,
        lives: this.health.lives,
        score: 0,
        weapon: this.weapon.id,
        spawnX: cp.x,
        spawnY: cp.y
      });
      this.cameraX = Math.min(Math.max(cp.x - LOGICAL_WIDTH / 2, 0), Math.max(0, this.level.width - LOGICAL_WIDTH));
      this.publishRuntime();
      return { ok: true, checkpoint: cp.id, x: cp.x, lives: this.health.lives };
    });
    reg('advanceSteps', (payload) => {
      // Fast-forward simulation time synchronously (bounded), driving the real
      // fixed-step loop. Under the manual clock this is the ONLY way the
      // simulation advances.
      //
      // The loop stops on `this.ending`, not on `this.scene.isActive()`:
      // Phaser queues scene swaps for the next Scene Manager update, so
      // `isActive()` is still true for every remaining step of this batch.
      const n = clampStepCount(payload);
      let ran = 0;
      for (let i = 0; i < n && this.ending === null; i++) {
        this.stepOnce();
        ran += 1;
      }
      if (this.ending === null) {
        this.publishRuntime();
      }
      // `ended` tells a driver the run finished without it having to poll
      // `getState().scene`, which lags the swap by up to two frames.
      return { ok: true, steps: ran, ended: this.ending };
    });
    reg('setManualClock', (payload) => {
      // Runtime toggle for agent drivers that did not navigate with
      // `?manualClock`. A boolean payload sets the flag explicitly; any other
      // payload enables it.
      this.manualClock = typeof payload === 'boolean' ? payload : true;
      if (this.manualClock) {
        this.clock.accumulator = 0;
      }
      this.publishRuntime();
      return { ok: true, manualClock: this.manualClock };
    });
    reg('report', () => {
      this.publishRuntime();
      return { ok: true };
    });
  }

  private readDebugInput(): InputState {
    const d = getDebugInput();
    const snapshot: InputState = {
      left: d.left,
      right: d.right,
      jumpHeld: d.jumpHeld,
      jumpPressed: d.jumpPressed,
      fireHeld: d.fireHeld,
      firePressed: d.firePressed,
      crouch: d.crouch,
      drop: d.drop,
      aimUp: d.aimUp,
      aimDown: d.aimDown
    };
    d.jumpPressed = false;
    d.firePressed = false;
    return snapshot;
  }

  private clearPressedEdges(): void {
    this.stepInput = { ...this.stepInput, jumpPressed: false, firePressed: false };
  }

  /**
   * Run one AI-pilot decision from the last published snapshot. The pilot
   * perceives the game exactly as external automation does (typed runtime
   * state, no pixels) and returns a standard InputState.
   */
  private decidePilotStep(): InputState {
    if (!this.pilotMemory || !this.lastRuntime) {
      return createNeutralInput();
    }
    const decision = decidePilotInput(this.lastRuntime, this.pilotMemory);
    this.pilotMemory = decision.memory;
    return decision.input;
  }

  /** Static level knowledge the pilot may use, rebuilt for the current level. */
  private buildPilotGeometry(): PilotGeometry {
    return {
      // Bridge spans join the pit list whatever stage they are in. The pilot
      // builds this once at level start and a bridge can vanish at any moment
      // afterwards, so the only safe advice is "there may be nothing here":
      // jumping an intact bridge costs nothing, walking onto a failing one
      // costs a life.
      pits: [
        ...pitsFromSolids(this.level.solids, GROUND_Y),
        ...bridgeGaps(createBridgeStates(this.level.bridges ?? []))
      ],
      platforms: platformRanges(this.level.oneWays),
      spikes: spikeRanges(this.level.hazards, GROUND_Y),
      bossArenaX0: this.level.boss.x0,
      levelWidth: this.level.width
    };
  }

  /** Hand control back to the human for the rest of this run. */
  private endAttract(): void {
    this.attractMode = false;
    this.pilotEngaged = false;
    this.pilotMemory = null;
    this.registry.set('attractMode', false);
    this.registry.set('autopilot', false);
    this.scene.start(SCENE_KEYS.title);
  }

  private disengagePilot(): void {
    this.pilotEngaged = false;
    this.pilotMemory = null;
    this.aiLabel?.setVisible(false);
    this.registry.set('autopilot', false);
  }

  /** Give control to the AI pilot, rebuilding its view of the current level. */
  private engagePilot(): void {
    this.pilotEngaged = true;
    this.pilotMemory = createPilotMemory(this.buildPilotGeometry());
    this.aiLabel?.setVisible(true);
    this.registry.set('autopilot', true);
  }

  /** In-level I: switch the AI pilot on/off; the choice persists in the session. */
  private togglePilot(): void {
    if (this.pilotEngaged) {
      this.disengagePilot();
    } else {
      this.engagePilot();
    }
    this.publishRuntime();
  }

  private stepOnce(): void {
    if (this.ending !== null) {
      // The swap is queued; this scene is finished even though Phaser has not
      // processed it yet. Simulating further would run a level that is on its
      // way out and could queue a second, conflicting transition.
      return;
    }
    this.stepIndex += 1;
    this.syncMusic();
    const debug = this.readDebugInput();
    const touchInput = this.touch ? this.touch.read() : createNeutralInput();
    const device = mergeInput(this.keyboard.build(), this.gamepad.build());
    const humanInput = mergeInput(device, touchInput);
    // Any human gameplay input takes over from the AI pilot immediately -
    // except in the attract demo, where it ends the demo and returns to the
    // title, which is what an arcade machine does when you touch the stick.
    if (this.pilotEngaged && !isNeutralInput(humanInput)) {
      if (this.attractMode) {
        this.endAttract();
        return;
      }
      this.disengagePilot();
    }
    const pilotInput = this.pilotEngaged ? this.decidePilotStep() : createNeutralInput();
    this.stepInput = mergeInput(humanInput, mergeInput(debug, pilotInput));

    if (this.health.gameOver) {
      this.goToGameOver();
      return;
    }

    if (this.completionTimer >= 0) {
      this.completionTimer -= FIXED_DT;
      if (this.completionTimer <= 0) {
        this.registry.set('lastScore', this.score);
        this.ending = 'results';
        this.publishRuntime();
        this.scene.start(SCENE_KEYS.results);
        return;
      }
      this.clearPressedEdges();
      this.publishRuntime();
      return;
    }

    // Hit-stop: hold the world for a few steps so a heavy impact lands.
    //
    // This sits with the death pause and the completion timer below, and works
    // the same way: the step still happens - input is read, `stepIndex` has
    // already advanced, and `advanceSteps` still counts it - but the world does
    // not move. That is what keeps `advanceSteps(n)` advancing exactly n steps
    // while the freeze is running.
    const freeze = tickHitStop(this.hitStop);
    this.hitStop = freeze.state;
    this.hitStoppedThisStep = freeze.frozen;
    if (freeze.frozen) {
      this.clearPressedEdges();
      this.publishRuntime();
      return;
    }

    // Death pause: the world holds while the death pose plays out, then the
    // life loss applies and the player respawns (or the run ends).
    if (this.deathTimer >= 0) {
      this.deathTimer -= FIXED_DT;
      if (this.deathTimer < 0) {
        this.finishDeath();
      }
      this.clearPressedEdges();
      this.publishRuntime();
      return;
    }

    this.hurtTimer = Math.max(0, this.hurtTimer - FIXED_DT);

    // Age the enemy hit flashes; entries are dropped rather than left at zero
    // so the map cannot grow across a long run (the soak test watches this).
    for (const [id, steps] of this.enemyFlash) {
      if (steps <= 1) {
        this.enemyFlash.delete(id);
      } else {
        this.enemyFlash.set(id, steps - 1);
      }
    }

    this.health = tickInvuln(this.health, FIXED_DT);

    // Advance moving platforms and doors, then merge them into the solid set.
    const platformDeltas: { rect: Rect; deltaX: number; deltaY: number }[] = [];
    this.movingPlatforms = this.movingPlatforms.map((mp) => {
      const step = stepMovingPlatform(mp, FIXED_DT);
      platformDeltas.push({ rect: movingPlatformRect(step.state), deltaX: step.deltaX, deltaY: step.deltaY });
      return step.state;
    });
    const playerTop = this.player.y - currentHeight(this.player);
    this.doors = this.doors.map((d) => {
      const next = stepDoor(d, this.player.x, playerTop, PLAYER_WIDTH, currentHeight(this.player));
      if (!d.open && next.open) {
        this.sfx('door');
      }
      return next;
    });
    // Collapsing bridges advance with the world. The load test uses the
    // player position from the end of the previous step, the same one-step lag
    // every other dynamic solid here already has.
    if (this.bridges.length > 0) {
      this.bridges = this.bridges.map((b) =>
        stepBridge(b, FIXED_DT, this.player.grounded && bridgeCarries(b, this.player.x, PLAYER_WIDTH, this.player.y))
      );
    }

    const dynamicSolids = [
      ...this.level.solids,
      ...platformDeltas.map((p) => p.rect),
      ...closedDoorRects(this.doors),
      ...solidContainerRects(this.containers),
      ...solidBridgeRects(this.bridges)
    ];

    const playerResult = stepPlatformer(this.player, this.stepInput, FIXED_DT, dynamicSolids, this.level.oneWays, {
      levelWidth: this.level.width,
      deathFallY: DEATH_FALL_Y
    });
    this.player = playerResult.player;

    // Carry a grounded rider with the platform it stands on.
    if (this.player.grounded) {
      for (const p of platformDeltas) {
        if (
          (p.deltaX !== 0 || p.deltaY !== 0) &&
          this.overlapsX(this.player.x, PLAYER_WIDTH, p.rect) &&
          Math.abs(this.player.y - p.rect.y) < 2
        ) {
          this.player = { ...this.player, x: this.player.x + p.deltaX, y: this.player.y + p.deltaY };
          break;
        }
      }
    }

    if (this.stepInput.jumpPressed && this.player.grounded) {
      this.sfx('jump');
    }

    this.stepPlayerFiring();

    if (!this.boss.active && this.player.x >= this.level.boss.x0 && this.player.x <= this.level.boss.x1) {
      this.boss = activateBoss(this.boss);
    }
    this.stepBossLogic();

    // Rebuild subcomponents when the boss advances to a new phase.
    if (this.boss.phase !== this.lastBossPhase) {
      this.lastBossPhase = this.boss.phase;
      this.buildSubcomponents();
    }

    this.stepTriggers();
    this.stepEnemies();
    this.stepEnemyBullets();
    this.stepSupplyCarriers();
    this.resolvePlayerBulletsVsEnemies();
    this.resolvePlayerBulletsVsContainers();
    this.resolvePlayerBulletsVsCarriers();
    this.resolvePlayerBulletsVsSubcomponents();
    this.resolvePlayerBulletsVsBoss();
    this.resolveEnemyBulletsVsPlayer();
    this.resolvePickups();

    this.particles = stepParticles(this.particles, FIXED_DT);

    this.lastCheckpointId = advanceCheckpoint(this.level.checkpoints, this.lastCheckpointId, this.player.x, this.player.y, PLAYER_WIDTH, PLAYER_HEIGHT);

    this.playerBullets = this.cullPlayerBullets(this.playerBullets);
    this.enemyBullets = this.cullEnemyBullets(this.enemyBullets);
    this.enemies = this.enemies.filter((e) => isAlive(e) && e.x > this.cameraX - 200 && e.x < this.cameraX + LOGICAL_WIDTH + 400);

    this.cameraX = Math.min(Math.max(this.player.x - LOGICAL_WIDTH / 2, 0), Math.max(0, this.level.width - LOGICAL_WIDTH));

    this.maxPlayerX = Math.max(this.maxPlayerX, this.player.x);

    if (this.hazardTouchesPlayer() || playerResult.died) {
      // `died` is the fall-below-the-world threshold, i.e. a pit; anything else
      // reaching here is a floor hazard (spike strip).
      this.startDeath(playerResult.died ? 'pit' : 'hazard');
    }

    if (isBossAlive(this.boss) === false && this.boss.active && this.player.x >= this.level.completionX && this.completionTimer < 0) {
      this.completionTimer = COMPLETION_DELAY;
      this.sfx('complete');
    }

    clearLedger(this.ledger);
    this.clearPressedEdges();
    this.maxEnemiesSeen = Math.max(this.maxEnemiesSeen, this.enemies.length);
    this.maxPlayerBulletsSeen = Math.max(this.maxPlayerBulletsSeen, this.playerBullets.length);
    this.maxEnemyBulletsSeen = Math.max(this.maxEnemyBulletsSeen, this.enemyBullets.length);
    this.publishRuntime();
  }

  private spawnFx(spawns: ParticleSpawn[]): void {
    const r = spawnParticles(this.particles, spawns, this.particleSeq);
    this.particles = r.particles;
    this.particleSeq = r.nextId;
  }

  private stepPlayerFiring(): void {
    const fireResult = stepWeapon(this.weapon, FIXED_DT, { pressed: this.stepInput.firePressed, held: this.stepInput.fireHeld });
    this.weapon = fireResult.weapon;
    if (fireResult.fired) {
      this.sfx(fireSound(this.weapon.id));
    }
    if (fireResult.projectiles.length > 0) {
      const h = currentHeight(this.player);
      const angle = aimAngle(this.stepInput, this.player.facing, this.player.grounded);
      this.lastFireAngle = angle;
      const gunX = this.player.x + (this.player.facing > 0 ? PLAYER_WIDTH : 0);
      const gunY = this.player.y - h / 2;
      this.spawnFx([{ kind: 'muzzle', x: gunX, y: gunY, angleDeg: angle }]);
      const spawned = fireResult.projectiles.map((p): PlayerBullet => {
        const rotated = rotateVelocity(p.vx, p.vy, angle);
        return {
          ...p,
          vx: rotated.vx,
          vy: rotated.vy,
          id: this.makeId('pb'),
          category: CollisionCategory.playerProjectile,
          hitIds: [],
          x: gunX,
          y: gunY
        };
      });
      this.playerBullets = this.playerBullets.concat(spawned).slice(-MAX_PROJECTILES);
    }
    this.playerBullets = stepProjectiles(this.playerBullets, FIXED_DT);
  }

  private stepBossLogic(): void {
    if (!this.boss.active) {
      return;
    }
    const def = getBossDef(this.level.boss.id);
    const cleared = bossHasSubcomponents(def) ? this.subcomponents.every((s) => !s.alive) : false;
    const h = currentHeight(this.player);
    const playerCenterY = this.player.y - h / 2;
    const result = stepBoss(this.boss, this.player.x, playerCenterY, FIXED_DT, cleared);
    if (!this.boss.telegraphing && result.boss.telegraphing) {
      this.sfx('telegraph');
    }
    this.boss = result.boss;
    if (!isBossAlive(this.boss) && !this.bossDeathHandled) {
      // G5: no hostile projectiles survive into the completion sequence.
      this.bossDeathHandled = true;
      this.enemyBullets = [];
      const bossDef = getBossDef(this.level.boss.id);
      this.spawnFx([
        { kind: 'explosion', x: this.boss.x + bossDef.width / 2, y: this.boss.y + bossDef.height / 2 },
        { kind: 'explosion', x: this.boss.x + bossDef.width / 4, y: this.boss.y + bossDef.height / 3 },
        { kind: 'explosion', x: this.boss.x + (bossDef.width * 3) / 4, y: this.boss.y + (bossDef.height * 2) / 3 }
      ]);
      this.sfx('explosion');
      this.shake('bossDefeat');
      this.freeze('bossDefeat');
    }
    if (result.action.kind === 'shockwave') {
      this.sfx('explosion');
      const def = getBossDef(this.level.boss.id);
      const zoneCenter = result.action.x + def.width / 2;
      // Honest, grounded-only shockwave damage (jumping dodges it).
      if (shockwaveHits(zoneCenter, this.player.x + PLAYER_WIDTH / 2, this.player.grounded)) {
        this.playerHit('bossShockwave');
      }
      this.spawnFx([
        { kind: 'spark', x: zoneCenter - 120, y: def.groundY - 4 },
        { kind: 'spark', x: zoneCenter - 40, y: def.groundY - 4 },
        { kind: 'spark', x: zoneCenter + 40, y: def.groundY - 4 },
        { kind: 'spark', x: zoneCenter + 120, y: def.groundY - 4 }
      ]);
    }
    if (result.action.kind === 'burst') {
      const tx = result.action.targetX ?? this.player.x;
      const ty = result.action.targetY ?? playerCenterY;
      const dx = tx - result.action.x;
      const dy = ty - result.action.y;
      const len = Math.hypot(dx, dy) || 1;
      for (let i = -1; i <= 1; i++) {
        if (this.enemyBullets.length >= MAX_PROJECTILES) {
          break;
        }
        const ang = Math.atan2(dy, dx) + i * 0.25;
        this.enemyBullets.push({
          // Boss fire is attributed to the boss, not to an archetype, so
          // coverage can tell "the grenadier never hit anyone" from "the boss
          // did all the damage".
          sourceKind: this.level.boss.id,
          id: this.makeId('bb'),
          x: result.action.x,
          y: result.action.y,
          vx: Math.cos(ang) * 220,
          vy: Math.sin(ang) * 220,
          ttl: 2.4,
          damage: 1,
          arcGravity: 0,
          category: CollisionCategory.enemyProjectile
        });
      }
      void len;
    }

    if (result.action.kind === 'volley') {
      // A flat sweep at one of two heights: the high one passes over a crouch,
      // the low one can only be jumped. The dodge is about what your body is
      // doing rather than where you are standing, which is what makes this
      // fight read differently from the Walker's shockwave (jump on cue) and
      // the Warden's aimed burst (step aside).
      const def = getBossDef(this.level.boss.id);
      const y = result.action.volleyY ?? VOLLEY_HEIGHTS[0];
      const facing = this.player.x < result.action.x ? -1 : 1;
      const originX = result.action.x + (facing < 0 ? 0 : def.width);
      // Three shots strung out horizontally, so the sweep reads as a wall
      // coming at you rather than as a single pellet.
      for (let i = 0; i < 3; i++) {
        if (this.enemyBullets.length >= MAX_PROJECTILES) {
          break;
        }
        this.enemyBullets.push({
          sourceKind: this.level.boss.id,
          id: this.makeId('bb'),
          x: originX + facing * i * 22,
          y,
          vx: facing * def.burstSpeed,
          vy: 0,
          ttl: 3,
          damage: 1,
          arcGravity: 0,
          category: CollisionCategory.enemyProjectile
        });
      }
      this.sfx('telegraph');
    }
  }

  private stepSupplyCarriers(): void {
    if (this.supplyCarriers.length === 0 && this.carrierDrops.length === 0) {
      return;
    }
    this.supplyCarriers = stepSupplyCarriers(this.supplyCarriers, FIXED_DT);
    const result = stepCarrierDrops(this.carrierDrops, FIXED_DT, this.level.solids, this.level.height + 64);
    this.carrierDrops = result.drops.filter((d) => !d.landed);
    for (const d of result.landed) {
      this.pickups = [...this.pickups, createPickup(this.makeId('pk'), d.x, d.y, d.weapon)];
      this.sfx('pickup');
    }
  }

  private stepTriggers(): void {
    const update = updateSpawnTriggers(this.triggers, this.player.x, this.player.y, this.enemies.length, MAX_ENEMIES);
    this.triggers = update.triggers;
    for (const spec of update.spawned) {
      if (this.enemies.length >= MAX_ENEMIES) {
        break;
      }
      this.enemies.push(createEnemyState(this.makeId('en'), spec.kind, spec.x, spec.y));
    }
  }

  private stepEnemies(): void {
    const telegraphing = this.enemies.filter((e) => e.telegraphing).length;
    const firing = this.enemies.filter((e) => e.state === 'fire').length;
    const activeAttacks = telegraphing + firing;
    const intents: EnemyFireIntent[] = [];
    this.enemies = this.enemies.map((enemy) => {
      const canFire = activeAttacks < 2;
      const result = stepEnemy(enemy, this.player.x, this.player.y, FIXED_DT, canFire);
      if (!enemy.telegraphing && result.enemy.telegraphing) {
        this.sfx('telegraph');
      }
      if (result.fireIntent) {
        intents.push(result.fireIntent);
      }
      return result.enemy;
    });
    const kindById = new Map(this.enemies.map((e) => [e.id, e.kind]));
    for (const intent of intents) {
      if (this.enemyBullets.length >= MAX_PROJECTILES) {
        break;
      }
      this.enemyBullets.push({
        id: this.makeId('eb'),
        x: intent.x,
        y: intent.y,
        vx: intent.vx,
        vy: intent.vy,
        ttl: 2.6,
        damage: intent.damage,
        arcGravity: intent.arcGravity,
        sourceKind: kindById.get(intent.enemyId) ?? 'unknown',
        category: CollisionCategory.enemyProjectile
      });
    }
  }

  private stepEnemyBullets(): void {
    this.enemyBullets = this.enemyBullets
      .map((b): EnemyBullet => ({ ...b, x: b.x + b.vx * FIXED_DT, y: b.y + b.vy * FIXED_DT, vy: b.vy + b.arcGravity * FIXED_DT, ttl: b.ttl - FIXED_DT }))
      .filter((b) => b.ttl > 0);
  }

  private resolvePlayerBulletsVsEnemies(): void {
    // D3: only player-owned projectiles may damage enemy bodies.
    if ((CollisionCategory.enemyBody & PLAYER_PROJECTILE_HITS) === 0) {
      return;
    }
    const surviving: PlayerBullet[] = [];
    for (const bullet of this.playerBullets) {
      if (bullet.category !== CollisionCategory.playerProjectile) {
        surviving.push(bullet);
        continue;
      }
      let pierceLeft = bullet.pierce;
      let hitIds = bullet.hitIds;
      for (let i = 0; i < this.enemies.length && pierceLeft > 0; i++) {
        const enemy = this.enemies[i];
        if (!isAlive(enemy) || !this.bulletHitsRect(bullet.x, bullet.y, 8, 4, enemy.x, enemy.y, enemyWidth(enemy), enemyHeight(enemy))) {
          continue;
        }
        if (hitIds.includes(enemy.id) || !recordHit(this.ledger, bullet.id, enemy.id)) {
          continue;
        }
        this.spawnFx([{ kind: 'spark', x: bullet.x, y: bullet.y }]);
        this.enemies[i] = damageEnemy(enemy, bullet.damage);
        this.enemyFlash.set(enemy.id, ENEMY_FLASH_STEPS);
        if (!isAlive(this.enemies[i])) {
          this.killsByKind[enemy.kind] = (this.killsByKind[enemy.kind] ?? 0) + 1;
          this.score += enemyScore(enemy.kind);
          this.spawnFx([{ kind: 'explosion', x: enemy.x + enemyWidth(enemy) / 2, y: enemy.y + enemyHeight(enemy) / 2 }]);
          this.sfx('enemyDeath');
        }
        hitIds = [...hitIds, enemy.id];
        pierceLeft -= 1;
      }
      if (pierceLeft > 0) {
        surviving.push(pierceLeft === bullet.pierce ? bullet : { ...bullet, pierce: pierceLeft, hitIds });
      }
    }
    this.playerBullets = surviving;
  }

  private resolvePlayerBulletsVsContainers(): void {
    if (this.containers.length === 0) {
      return;
    }
    const surviving: PlayerBullet[] = [];
    for (const bullet of this.playerBullets) {
      if (bullet.category !== CollisionCategory.playerProjectile) {
        surviving.push(bullet);
        continue;
      }
      let pierceLeft = bullet.pierce;
      let hitIds = bullet.hitIds;
      for (let i = 0; i < this.containers.length && pierceLeft > 0; i++) {
        const c = this.containers[i];
        if (c.destroyed || !this.bulletHitsRect(bullet.x, bullet.y, 8, 4, c.x, c.y, c.width, c.height)) {
          continue;
        }
        if (hitIds.includes(c.id) || !recordHit(this.ledger, bullet.id, c.id)) {
          continue;
        }
        this.spawnFx([{ kind: 'spark', x: bullet.x, y: bullet.y }]);
        this.containers[i] = damageContainer(c, bullet.damage);
        if (this.containers[i].destroyed) {
          this.score += c.scoreValue;
          this.spawnFx([{ kind: 'burst', x: c.x + c.width / 2, y: c.y + c.height / 2 }]);
          this.sfx('explosion');
          this.shake('explosion');
        }
        hitIds = [...hitIds, c.id];
        pierceLeft -= 1;
      }
      if (pierceLeft > 0) {
        surviving.push(pierceLeft === bullet.pierce ? bullet : { ...bullet, pierce: pierceLeft, hitIds });
      }
    }
    this.playerBullets = surviving;
  }

  private resolvePlayerBulletsVsCarriers(): void {
    if (this.supplyCarriers.length === 0) {
      return;
    }
    const surviving: PlayerBullet[] = [];
    for (const bullet of this.playerBullets) {
      if (bullet.category !== CollisionCategory.playerProjectile) {
        surviving.push(bullet);
        continue;
      }
      let pierceLeft = bullet.pierce;
      for (let i = 0; i < this.supplyCarriers.length && pierceLeft > 0; i++) {
        const c = this.supplyCarriers[i];
        // Single-hit object: neither the ledger nor the bullet's lifetime hit
        // list is needed, because a carrier is destroyed outright - later
        // same-step pellets and later steps see `!alive` and pass through.
        if (!c.alive || !this.bulletHitsRect(bullet.x, bullet.y, 8, 4, c.x, c.y, CARRIER_WIDTH, CARRIER_HEIGHT)) {
          continue;
        }
        const result = damageCarrier(c);
        this.supplyCarriers[i] = result.state;
        if (result.drop) {
          this.carrierDrops.push(result.drop);
        }
        this.spawnFx([{ kind: 'burst', x: c.x + CARRIER_WIDTH / 2, y: c.y + CARRIER_HEIGHT / 2 }]);
        this.sfx('explosion');
        pierceLeft -= 1;
      }
      if (pierceLeft > 0) {
        surviving.push(pierceLeft === bullet.pierce ? bullet : { ...bullet, pierce: pierceLeft });
      }
    }
    this.playerBullets = surviving;
  }

  private resolvePlayerBulletsVsSubcomponents(): void {
    const def = getBossDef(this.level.boss.id);
    if (!bossHasSubcomponents(def) || !this.boss.active) {
      return;
    }
    // D3: subcomponents are boss components; only player projectiles damage them.
    if ((CollisionCategory.bossComponent & PLAYER_PROJECTILE_HITS) === 0) {
      return;
    }
    const surviving: PlayerBullet[] = [];
    for (const bullet of this.playerBullets) {
      if (bullet.category !== CollisionCategory.playerProjectile) {
        surviving.push(bullet);
        continue;
      }
      let pierceLeft = bullet.pierce;
      let hitIds = bullet.hitIds;
      for (let i = 0; i < this.subcomponents.length && pierceLeft > 0; i++) {
        const s = this.subcomponents[i];
        if (!s.alive || !this.bulletHitsRect(bullet.x, bullet.y, 8, 4, s.x, s.y, s.width, s.height)) {
          continue;
        }
        if (hitIds.includes(s.id) || !recordHit(this.ledger, bullet.id, s.id)) {
          continue;
        }
        this.spawnFx([{ kind: 'spark', x: bullet.x, y: bullet.y }]);
        const health = s.health - bullet.damage;
        this.subcomponents[i] = { ...s, health, alive: health > 0 };
        if (health <= 0) {
          this.score += s.score;
          this.spawnFx([{ kind: 'explosion', x: s.x + s.width / 2, y: s.y + s.height / 2 }]);
          this.sfx('enemyDeath');
        }
        hitIds = [...hitIds, s.id];
        pierceLeft -= 1;
      }
      if (pierceLeft > 0) {
        surviving.push(pierceLeft === bullet.pierce ? bullet : { ...bullet, pierce: pierceLeft, hitIds });
      }
    }
    this.playerBullets = surviving;
  }

  private resolvePlayerBulletsVsBoss(): void {
    if (!isBossAlive(this.boss)) {
      return;
    }
    // D3: the boss body is a boss component; only player projectiles damage it.
    if ((CollisionCategory.bossComponent & PLAYER_PROJECTILE_HITS) === 0) {
      return;
    }
    const def = getBossDef(this.level.boss.id);
    const surviving: PlayerBullet[] = [];
    for (const bullet of this.playerBullets) {
      if (bullet.category !== CollisionCategory.playerProjectile) {
        surviving.push(bullet);
        continue;
      }
      const hitsBoss =
        this.bulletHitsRect(bullet.x, bullet.y, 8, 4, this.boss.x, this.boss.y, def.width, def.height) &&
        !bullet.hitIds.includes('boss') &&
        recordHit(this.ledger, bullet.id, 'boss');
      if (!hitsBoss) {
        surviving.push(bullet);
        continue;
      }
      const result = damageBoss(this.boss, bullet.damage);
      this.boss = result.boss;
      if (result.applied) {
        this.bossDamageTaken += bullet.damage;
        this.spawnFx([{ kind: 'spark', x: bullet.x, y: bullet.y }]);
        this.sfx('bossHit');
        this.shake('bossHit');
        this.freeze('bossHit');
      }
      // A piercing shot carries on through the boss body; the lifetime hit list
      // is what stops it damaging the boss again on the way out.
      if (bullet.pierce > 1) {
        surviving.push({ ...bullet, pierce: bullet.pierce - 1, hitIds: [...bullet.hitIds, 'boss'] });
      }
    }
    this.playerBullets = surviving;
  }

  private resolveEnemyBulletsVsPlayer(): void {
    // D3: only enemy-owned projectiles may damage the player body.
    if ((CollisionCategory.playerBody & ENEMY_PROJECTILE_HITS) === 0) {
      return;
    }
    const h = currentHeight(this.player);
    const top = this.player.y - h;
    const surviving: EnemyBullet[] = [];
    for (const bullet of this.enemyBullets) {
      if (bullet.category !== CollisionCategory.enemyProjectile) {
        surviving.push(bullet);
        continue;
      }
      const overlaps = this.bulletHitsRect(bullet.x, bullet.y, 8, 8, this.player.x, top, PLAYER_WIDTH, h);
      if (overlaps && recordHit(this.ledger, bullet.id, 'player')) {
        this.damageByKind[bullet.sourceKind] = (this.damageByKind[bullet.sourceKind] ?? 0) + 1;
        this.playerHit('enemyFire');
      } else {
        surviving.push(bullet);
      }
    }
    this.enemyBullets = surviving;
  }

  private resolvePickups(): void {
    const h = currentHeight(this.player);
    const top = this.player.y - h;
    const result = collectPickups(this.pickups, this.player.x, top, PLAYER_WIDTH, h);
    this.pickups = result.pickups;
    for (const pickup of result.collected) {
      this.weapon = createWeaponState(pickup.weapon);
      this.sfx('pickup');
    }
  }

  private playerHit(cause: DeathCause): void {
    const damage = applyDamage(this.health, INVULN_DURATION);
    this.health = damage.health;
    if (damage.applied) {
      this.recordDeath(cause, true);
      this.sfx('hit');
      this.hurtTimer = HURT_DURATION;
    }
  }

  /** Append to the published death log, oldest first, bounded for snapshot size. */
  private recordDeath(cause: DeathCause, costLife: boolean): void {
    if (this.deaths.length >= MAX_DEATH_EVENTS) {
      this.deaths.shift();
    }
    this.deaths.push({
      cause,
      x: round2(this.player.x),
      y: round2(this.player.y),
      stepIndex: this.stepIndex,
      costLife
    });
  }

  private hazardTouchesPlayer(): boolean {
    const h = currentHeight(this.player);
    const top = this.player.y - h;
    for (const hz of this.level.hazards) {
      // Decorative pit markers live in the `hazards` array too, and they are
      // paint rather than spikes: a pit kills through the fall threshold, so
      // touching the stripes on its rim must not (TASK-027).
      if (!isLethalHazard(hz, GROUND_Y)) {
        continue;
      }
      if (this.bulletHitsRect(this.player.x, top, PLAYER_WIDTH, h, hz.x, hz.y, hz.width, hz.height)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Begins the death sequence: burst effect + death pause. The life loss and
   * respawn are deferred to finishDeath() so the death pose gets its moment;
   * tests observe the life decrement exactly when the respawn lands.
   */
  private startDeath(cause: DeathCause): void {
    if (this.deathTimer >= 0) {
      return;
    }
    this.pendingDeathCause = cause;
    this.deathTimer = DEATH_DURATION;
    this.spawnFx([{ kind: 'explosion', x: this.player.x + PLAYER_WIDTH / 2, y: this.player.y - PLAYER_HEIGHT / 2 }]);
    this.sfx('playerDeath');
    this.shake('playerDeath');
    this.freeze('playerDeath');
  }

  /** Applies the life loss at the end of the death pause, then respawns at the checkpoint or ends the run. */
  private finishDeath(): void {
    // Lethal, not ordinary damage: a pit or hazard death costs a life even if
    // the mercy window from an earlier hit is still open. Using `applyDamage`
    // here meant the respawn ran but the life did not go, so taking a hit and
    // then falling was a free ride back to the checkpoint (TASK-026).
    const damage = applyLethalDamage(this.health, INVULN_DURATION);
    this.health = damage.health;
    // `applied` is false only once the run is already over.
    this.recordDeath(this.pendingDeathCause ?? 'pit', damage.applied);
    this.pendingDeathCause = null;
    if (this.health.gameOver) {
      // The game-over scene transition fires at the top of the next step.
      return;
    }
    const cp = resolveCheckpoint(this.level.checkpoints, this.lastCheckpointId);
    // C7: respawn clear of enemies (projectiles are already cleared; loader
    // validation guarantees the checkpoint is outside solids and hazards).
    const enemyBoxes = this.enemies
      .filter((e) => isAlive(e))
      .map((e) => ({ x: e.x, y: e.y, width: enemyWidth(e), height: enemyHeight(e) }));
    const pos = respawnPosition(cp, enemyBoxes, PLAYER_WIDTH, PLAYER_HEIGHT, this.level.width);
    this.player = createPlatformerState(pos.x, pos.y);
    this.weapon = createWeaponState(this.checkpoint.weapon);
    this.playerBullets = [];
    this.enemyBullets = [];
    this.spawnFx([{ kind: 'beacon', x: pos.x + PLAYER_WIDTH / 2, y: pos.y - PLAYER_HEIGHT / 2 }]);
    this.sfx('respawn');
  }

  private goToGameOver(): void {
    this.registry.set('lastScore', this.score);
    this.ending = 'gameOver';
    this.publishRuntime();
    this.scene.start(SCENE_KEYS.gameOver);
  }

  private overlapsX(x: number, w: number, r: Rect): boolean {
    return x < r.x + r.width && x + w > r.x;
  }

  private bulletHitsRect(bx: number, by: number, bw: number, bh: number, rx: number, ry: number, rw: number, rh: number): boolean {
    return bx < rx + rw && bx + bw > rx && by < ry + rh && by + bh > ry;
  }

  private cullPlayerBullets(bullets: PlayerBullet[]): PlayerBullet[] {
    return bullets.filter((p) => p.x > this.cameraX - 64 && p.x < this.cameraX + LOGICAL_WIDTH + 64 && p.y > -64 && p.y < LOGICAL_HEIGHT + 64);
  }

  private cullEnemyBullets(bullets: EnemyBullet[]): EnemyBullet[] {
    return bullets.filter((b) => b.x > this.cameraX - 128 && b.x < this.cameraX + LOGICAL_WIDTH + 128 && b.y > -128 && b.y < LOGICAL_HEIGHT + 128);
  }

  private sfx(name: Parameters<AudioService['playSfx']>[0]): void {
    const audio = this.registry.get('audio') as AudioService | undefined;
    audio?.playSfx(name);
  }

  /** Camera kick for combat impact; suppressed by the reduced-flash setting. */
  /** Freeze the world briefly on a heavy impact; honours reduced flash. */
  private freeze(event: HitStopEvent): void {
    this.hitStop = triggerHitStop(this.hitStop, event, this.settings.reducedFlash);
  }

  private shake(event: ShakeEvent): void {
    const spec = shakeFor(event, this.settings.reducedFlash);
    if (spec === null) {
      return;
    }
    this.cameras.main.shake(spec.duration, spec.intensity);
  }

  private handlePauseInput(): void {
    if (LevelScene.consumePress('KeyM')) {
      this.settings = { ...this.settings, mute: !this.settings.mute };
      this.persistSettings();
    }
    if (LevelScene.consumePress('KeyF')) {
      this.settings = { ...this.settings, reducedFlash: !this.settings.reducedFlash };
      this.persistSettings();
    }
  }

  private persistSettings(): void {
    this.registry.set('settings', this.settings);
    saveSettings(this.settings);
    const audio = this.registry.get('audio') as AudioService | undefined;
    audio?.setSettings(this.settings);
  }

  private publishRuntime(): void {
    const bossVisible = this.boss.active && isBossAlive(this.boss);
    const snapshot: LevelRuntime = {
      level: this.level.id,
      levelIndex: this.levelIndex,
      playerX: round2(this.player.x),
      playerY: round2(this.player.y),
      grounded: this.player.grounded,
      crouching: this.player.crouching,
      playerPose: this.currentPose(),
      dying: this.deathTimer >= 0,
      lives: this.health.lives,
      invuln: this.health.invuln > 0,
      weapon: this.weapon.id,
      fireAngle: this.lastFireAngle,
      enemyCount: this.enemies.length,
      enemies: this.enemies.map((e) => ({ id: e.id, kind: e.kind, state: e.state, x: Math.round(e.x), y: Math.round(e.y) })),
      projectileCount: this.playerBullets.length,
      enemyProjectileCount: this.enemyBullets.length,
      enemyProjectiles: this.enemyBullets.map((b) => ({
        x: round2(b.x),
        y: round2(b.y),
        vx: round2(b.vx),
        vy: round2(b.vy),
        arcGravity: b.arcGravity
      })),
      checkpoint: this.lastCheckpointId,
      bossActive: this.boss.active,
      bossHealth: this.boss.health,
      bossState: this.boss.state,
      bossPhase: this.boss.phase,
      bossVulnerable: this.boss.vulnerable,
      bossX: bossVisible ? round2(this.boss.x) : null,
      bossY: bossVisible ? round2(this.boss.y) : null,
      bossStateTimer: round2(this.boss.stateTimer),
      subcomponents: this.subcomponents.map((s) => ({
        id: s.id,
        x: Math.round(s.x),
        y: Math.round(s.y),
        width: s.width,
        height: s.height,
        alive: s.alive
      })),
      subcomponentsAlive: this.subcomponents.filter((s) => s.alive).length,
      movingPlatforms: this.movingPlatforms.map((mp) => {
        const r = movingPlatformRect(mp);
        return { id: mp.id, x: Math.round(r.x), y: Math.round(r.y), width: r.width };
      }),
      containersAlive: this.containers.filter((c) => !c.destroyed).length,
      supplyCarriersAlive: this.supplyCarriers.filter((c) => c.alive).length,
      supplyCarrierX: this.supplyCarriers.find((c) => c.alive)?.x ?? null,
      pickupsAvailable: this.pickups.filter((p) => !p.collected).length,
      autoPaused: this.autoPaused,
      telegraphCount: this.enemies.filter((e) => e.telegraphing).length,
      bossPattern: this.boss.active ? currentPattern(this.boss, getBossDef(this.level.boss.id)) : null,
      maxEnemiesSeen: this.maxEnemiesSeen,
      maxPlayerBulletsSeen: this.maxPlayerBulletsSeen,
      maxEnemyBulletsSeen: this.maxEnemyBulletsSeen,
      particleCount: this.particles.length,
      bridges: this.bridges.map((b) => ({ id: b.id, x: b.x, y: b.y, width: b.width, stage: b.stage })),
      paused: this.paused,
      gameOver: this.health.gameOver,
      completing: this.completionTimer >= 0,
      score: this.score,
      manualClock: this.manualClock,
      autopilot: this.pilotEngaged,
      stepIndex: this.stepIndex,
      hitStopped: this.hitStoppedThisStep,
      maxPlayerX: round2(this.maxPlayerX),
      ending: this.ending,
      deaths: this.deaths.map((d) => ({ ...d })),
      bossId: this.level.boss.id,
      bossDamageTaken: round2(this.bossDamageTaken),
      killsByKind: { ...this.killsByKind },
      damageByKind: { ...this.damageByKind }
    };
    reportRuntime(snapshot);
    // The AI pilot perceives the game through this very snapshot next step.
    this.lastRuntime = snapshot;
  }

  /**
   * Builds the level's themed environment: base gradient, optional star field
   * and second band, a parallax mid band (jungle ridge / fortress wall),
   * world-anchored horizon silhouettes, themed ground/platform tiles,
   * hazard-striped pit voids, and deterministic scenic props. Terrain art is
   * world-anchored (tile offsets set from world x) so it never swims under
   * the camera; the background layers scroll at reduced rates for depth.
   */
  private buildEnvironment(): void {
    const theme = themeForLevel(this.level.id);
    this.bandScrollFactor = theme.bandScroll;

    this.add
      .image(0, 0, theme.skyKey)
      .setOrigin(0, 0)
      .setDisplaySize(LOGICAL_WIDTH, LOGICAL_HEIGHT);
    if (theme.showStars) {
      this.starsLayer = this.add
        .tileSprite(0, 0, LOGICAL_WIDTH, 300, 'art/bg-stars')
        .setOrigin(0, 0)
        .setAlpha(0.8);
    }
    if (theme.pipesKey !== null) {
      this.pipesLayer = this.add
        .tileSprite(0, 40, LOGICAL_WIDTH, 48, theme.pipesKey)
        .setOrigin(0, 0)
        .setTileScale(2, 2)
        .setAlpha(0.85);
    }
    if (theme.bandKey !== null) {
      this.bandLayer = this.add
        .tileSprite(0, theme.bandY, LOGICAL_WIDTH, theme.bandHeight, theme.bandKey)
        .setOrigin(0, 0)
        .setTileScale(theme.bandTileScale, theme.bandTileScale)
        .setTint(theme.bandTint);
    }

    // World-anchored silhouettes on the far ground line: they read against the
    // backdrop gradient and break up the tiled bands.
    for (const h of horizonForLevel(this.level.width, GROUND_Y, theme.horizonKeys)) {
      const image = this.add.image(0, 0, h.key).setOrigin(0, 1).setScale(h.scale).setAlpha(h.alpha);
      this.propImages.push({ image, worldX: h.x, baseY: h.y });
    }

    for (const r of this.level.solids) {
      const tile = this.add.tileSprite(0, 0, r.width, r.height, theme.groundTile).setOrigin(0, 0);
      // World-anchored pattern: the surface never slides as the camera moves.
      tile.tilePositionX = r.x;
      this.groundTiles.push(tile);
      for (const prop of propsForSolid(r, theme, r.y)) {
        const image = this.add.image(0, 0, prop.key).setOrigin(0, 1).setScale(prop.scale).setAlpha(prop.alpha);
        this.propImages.push({ image, worldX: prop.x, baseY: prop.y });
      }
    }

    for (const r of this.level.oneWays) {
      const tile = this.add.tileSprite(0, 0, r.width, r.height, theme.oneWayTile).setOrigin(0, 0);
      tile.tilePositionX = r.x;
      this.oneWayTiles.push(tile);
    }

    for (const r of this.level.hazards) {
      // The pit is a dark void; its rim carries hazard stripes as the warning.
      const voidRect = this.add.rectangle(0, 0, r.width, r.height, PALETTE_HEX.VOID).setOrigin(0, 0);
      this.hazardVoids.push(voidRect);
      const rim = this.add.tileSprite(0, 0, r.width, 8, 'art/tile-hazard').setOrigin(0, 0);
      rim.tilePositionX = r.x;
      this.hazardRims.push(rim);
    }

    // Moving platforms use the level's one-way platform tile (world-tracked).
    for (const mp of this.movingPlatforms) {
      const r = movingPlatformRect(mp);
      const tile = this.add.tileSprite(0, 0, r.width, r.height, theme.oneWayTile).setOrigin(0, 0);
      this.movingPlatformTiles.push(tile);
    }
  }

  private render(): void {
    if (!this.playerImage || !this.weaponText || !this.scoreText) {
      return;
    }
    // Parallax backdrop: farther layers scroll slower.
    if (this.starsLayer) {
      this.starsLayer.tilePositionX = this.cameraX * 0.15;
    }
    if (this.pipesLayer) {
      this.pipesLayer.tilePositionX = this.cameraX * 0.35;
    }
    if (this.bandLayer) {
      this.bandLayer.tilePositionX = this.cameraX * this.bandScrollFactor;
    }

    this.groundTiles.forEach((tile, i) => {
      const r = this.level.solids[i];
      tile.setPosition(r.x - this.cameraX, r.y);
    });
    this.propImages.forEach(({ image, worldX, baseY }) => {
      image.setPosition(worldX - this.cameraX, baseY);
    });
    this.oneWayTiles.forEach((tile, i) => {
      const r = this.level.oneWays[i];
      tile.setPosition(r.x - this.cameraX, r.y);
    });
    this.hazardVoids.forEach((rect, i) => {
      const r = this.level.hazards[i];
      rect.setPosition(r.x - this.cameraX, r.y);
    });
    this.hazardRims.forEach((tile, i) => {
      const r = this.level.hazards[i];
      tile.setPosition(r.x - this.cameraX, r.y);
    });

    this.movingPlatforms.forEach((mp, i) => {
      const tile = this.movingPlatformTiles[i];
      const r = movingPlatformRect(mp);
      tile.setPosition(r.x - this.cameraX, r.y);
      tile.tilePositionX = r.x;
    });

    this.syncImagePool(this.doorImages, this.doors.length, 'art/door-security');
    this.doors.forEach((d, i) => {
      const image = this.doorImages[i];
      image.setVisible(true);
      image.setOrigin(0, 0);
      image.setDisplaySize(d.rect.width, d.rect.height);
      image.setAlpha(d.open ? 0.25 : 1);
      image.setPosition(d.rect.x - this.cameraX, d.rect.y);
    });

    this.syncImagePool(this.containerImages, this.containers.length, 'art/pickup-crate');
    this.containers.forEach((c, i) => {
      const image = this.containerImages[i];
      image.setVisible(!c.destroyed);
      if (!c.destroyed) {
        image.setOrigin(0, 0);
        image.setDisplaySize(c.width, c.height);
        image.setPosition(c.x - this.cameraX, c.y);
      }
    });

    // Collapsing bridges: solid ground while intact, shuddering visibly once
    // committed, hidden once gone. The shudder is the only warning the player
    // gets, so it reads as motion rather than as a colour change - which also
    // means reduced flash has nothing to suppress here.
    // The theme's own ledge tile, not the jungle one: a causeway drawn with
    // Level 1's planks in a volcanic stage reads as a different game.
    this.syncImagePool(this.bridgeTiles, this.bridges.length, themeForLevel(this.level.id).oneWayTile);
    this.bridges.forEach((b, i) => {
      const image = this.bridgeTiles[i];
      image.setVisible(b.stage !== 'gone');
      if (b.stage === 'gone') {
        return;
      }
      image.setOrigin(0, 0);
      image.setDisplaySize(b.width, b.height);
      const shudder = b.stage === 'failing' ? ((this.stepIndex % 4) < 2 ? 1 : -1) : 0;
      image.setPosition(b.x - this.cameraX, b.y + shudder);
    });

    this.renderPlayer();

    this.syncImagePool(this.playerBulletImages, this.playerBullets.length, 'art/bullet-pulse');
    this.playerBulletImages.forEach((image, i) => {
      const b = this.playerBullets[i];
      if (b) {
        image.setVisible(true);
        image.setTexture(bulletTexture(b.weapon));
        // Rotate the sprite along its flight path so 8-way fire reads clearly.
        image.setRotation(Math.atan2(b.vy, b.vx));
        image.setPosition(b.x - this.cameraX + 4, b.y + 2);
      } else {
        image.setVisible(false);
      }
    });
    this.syncImagePool(this.enemyBulletImages, this.enemyBullets.length, 'art/bullet-enemy');
    this.enemyBulletImages.forEach((image, i) => {
      const b = this.enemyBullets[i];
      if (b) {
        image.setVisible(true);
        image.setPosition(b.x - this.cameraX + 4, b.y + 4);
      } else {
        image.setVisible(false);
      }
    });

    this.syncPool(this.particleRects, this.particles.length, 4, 4, PALETTE_HEX.WHITE);
    this.particles.forEach((p, i) => {
      const rect = this.particleRects[i];
      rect.setSize(p.size, p.size);
      rect.setFillStyle(particleColor(p.kind));
      rect.setAlpha(this.settings.reducedFlash ? 0.75 : Math.max(0.15, p.ttl / p.maxTtl));
      rect.setPosition(p.x - this.cameraX, p.y);
    });

    this.syncImagePool(this.enemyImages, this.enemies.length, 'art/enemy-runner');
    this.syncPool(this.telegraphRects, this.enemies.length, 30, 38, 0, 0);
    this.syncPool(this.aimLineRects, this.enemies.length, 110, 3, PALETTE_HEX.GOLD_LIGHT);
    this.enemies.forEach((e, i) => {
      const image = this.enemyImages[i];
      const tele = this.telegraphRects[i];
      const aim = this.aimLineRects[i];
      const w = enemyWidth(e);
      const hh = enemyHeight(e);
      image.setTexture(enemyFrame(e, this.stepIndex));
      // Damage flash: a hit enemy lights up for a few steps so a connecting
      // shot is unmistakable even when the target has health left. Under
      // reduced flash it warms rather than pops, which still reads as "hit"
      // without the bright strobe.
      if (this.enemyFlash.has(e.id)) {
        image.setTint(this.settings.reducedFlash ? PALETTE_HEX.RED_LIGHT : PALETTE_HEX.WHITE).setTintMode(Phaser.TintModes.FILL);
      } else {
        image.clearTint();
      }
      // Sprites are authored facing left; flip when the enemy faces right.
      image.setFlipX(e.facing > 0);
      image.setOrigin(0, 0);
      image.setPosition(e.x - this.cameraX, e.y);
      tele.setSize(w + 8, hh + 8);
      tele.setPosition(e.x - this.cameraX - 4, e.y - 4);
      tele.setVisible(e.telegraphing);
      if (e.telegraphing) {
        // Reduced-flash option: steady outline instead of a pulsing one.
        tele.setAlpha(this.settings.reducedFlash ? 0.9 : 0.5 + 0.5 * Math.sin(performance.now() / 60));
        const ta = telegraphAim(e, this.player.x, this.player.y);
        aim.setVisible(true);
        aim.setOrigin(0, 0.5);
        aim.setRotation((ta.angleDeg * Math.PI) / 180);
        aim.setPosition(ta.muzzleX - this.cameraX, ta.muzzleY);
        aim.setAlpha(this.settings.reducedFlash ? 0.7 : 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(performance.now() / 60)));
      } else {
        aim.setVisible(false);
      }
    });

    const visiblePickups = this.pickups.filter((p) => !p.collected);
    this.syncImagePool(this.pickupImages, visiblePickups.length + this.carrierDrops.length, 'art/pickup-crate');
    this.syncTextPool(this.pickupLabels, visiblePickups.length + this.carrierDrops.length);
    visiblePickups.forEach((p, i) => {
      const image = this.pickupImages[i];
      const label = this.pickupLabels[i];
      image.setOrigin(0, 0);
      image.setPosition(p.x - this.cameraX, p.y);
      label.setPosition(p.x - this.cameraX + 9, p.y + 9);
      setText(label, pickupLetter(p.weapon));
    });
    // Falling carrier drops reuse the pickup visuals.
    this.carrierDrops.forEach((d, k) => {
      const i = visiblePickups.length + k;
      const image = this.pickupImages[i];
      const label = this.pickupLabels[i];
      image.setOrigin(0, 0);
      image.setPosition(d.x - this.cameraX, d.y);
      label.setPosition(d.x - this.cameraX + 9, d.y + 9);
      setText(label, pickupLetter(d.weapon));
    });

    this.syncImagePool(this.carrierImages, this.supplyCarriers.length, 'art/prop-skiff');
    this.supplyCarriers.forEach((c, i) => {
      const image = this.carrierImages[i];
      image.setVisible(c.alive);
      if (c.alive) {
        image.setOrigin(0, 0);
        image.setPosition(c.x - this.cameraX, c.y);
      }
    });

    const bossDef = getBossDef(this.level.boss.id);
    if (this.boss.active && isBossAlive(this.boss)) {
      if (this.bossImage) {
        // Sprite boss: stretched to the hitbox, flipped toward the player,
        // warm tint during the vulnerable window.
        this.bossImage.setVisible(true);
        this.bossImage.setTexture(bossFrame(this.level.boss.id, this.stepIndex));
        this.bossImage.setDisplaySize(bossDef.width, bossDef.height);
        this.bossImage.setPosition(this.boss.x - this.cameraX, this.boss.y);
        this.bossImage.setFlipX(this.player.x > this.boss.x + bossDef.width / 2);
        if (this.boss.vulnerable) {
          this.bossImage.setTint(PALETTE_HEX.GOLD_LIGHT);
        } else {
          this.bossImage.clearTint();
        }
      }
      this.bossTeleRect?.setVisible(this.boss.telegraphing);
      this.bossTeleRect?.setSize(bossDef.width + 8, bossDef.height + 8);
      this.bossTeleRect?.setPosition(this.boss.x - this.cameraX - 4, this.boss.y - 4);
      // Ground danger-zone marker for the stomp pattern.
      const showZone = this.boss.telegraphing && currentPattern(this.boss, bossDef) === 'stomp';
      this.bossZoneRect?.setVisible(showZone);
      if (showZone && this.bossZoneRect) {
        this.bossZoneRect.setPosition(this.boss.x + bossDef.width / 2 - this.cameraX, bossDef.groundY);
        this.bossZoneRect.setAlpha(this.settings.reducedFlash ? 0.6 : 0.35 + 0.35 * (0.5 + 0.5 * Math.sin(performance.now() / 60)));
      }
    } else {
      this.bossImage?.setVisible(false);
      this.bossTeleRect?.setVisible(false);
      this.bossZoneRect?.setVisible(false);
    }

    this.syncImagePool(this.subcomponentImages, this.subcomponents.length, 'art/subcomponent-node');
    this.subcomponents.forEach((s, i) => {
      const image = this.subcomponentImages[i];
      const show = this.boss.active && s.alive;
      image.setVisible(show);
      if (show) {
        image.setOrigin(0, 0);
        image.setDisplaySize(s.width, s.height);
        image.setPosition(s.x - this.cameraX, s.y);
      }
    });

    const showBossBar = this.boss.active && isBossAlive(this.boss);
    this.bossBarBack?.setVisible(showBossBar);
    this.bossBarFill?.setVisible(showBossBar);
    this.bossLabelText?.setVisible(showBossBar);
    if (showBossBar && this.bossBarFill && this.bossLabelText) {
      this.bossBarFill.setSize((300 * Math.max(0, this.boss.health)) / bossDef.health, 10);
      setText(this.bossLabelText, bossDef.name);
    }

    // HUD: life icons (collapsing to "icon xN" at high counts), weapon, score.
    const lifeLayout = lifeHudLayout(this.health.lives);
    this.lifeImages.forEach((icon, i) => {
      icon.setVisible(i < lifeLayout.icons);
    });
    if (this.lifeCountText) { setText(this.lifeCountText, lifeLayout.countLabel ?? ''); }
    this.weaponIcon?.setTexture(bulletTexture(this.weapon.id));
    setText(this.weaponText, pickupLetter(this.weapon.id) + ' ' + getWeapon(this.weapon.id).name);
    setText(this.scoreText, 'SCORE ' + this.score);

    if (this.completionTimer >= 0) {
      this.showOverlay('LEVEL COMPLETE', '');
    } else {
      this.hideOverlay();
    }
  }

  /**
   * Drives the player sprite: pose from the pure animation selector, flip from
   * facing, feet-anchored position, and an alpha blink while invulnerable.
   * While dying, the body is clamped on-screen so a pit death still reads.
   */
  private renderPlayer(): void {
    const image = this.playerImage;
    if (!image) {
      return;
    }
    image.setTexture(playerPoseTexture(this.currentPose()));
    image.setFlipX(this.player.facing < 0);
    const feetY = this.deathTimer >= 0 ? Math.min(this.player.y, LOGICAL_HEIGHT - 4) : this.player.y;
    image.setPosition(this.player.x - this.cameraX, feetY);
    image.setAlpha(this.health.invuln > 0 ? 0.55 : 1);
    // The same damage flash the enemies get, on the hurt flinch: being hit
    // should read instantly, not only as a lost life on the HUD.
    if (this.hurtTimer > 0) {
      image.setTint(this.settings.reducedFlash ? PALETTE_HEX.RED_LIGHT : PALETTE_HEX.WHITE).setTintMode(Phaser.TintModes.FILL);
    } else {
      image.clearTint();
    }
  }

  private currentPose(): PlayerPoseKey {
    return selectPlayerPose({
      dying: this.deathTimer >= 0,
      hurt: this.hurtTimer > 0,
      crouching: this.player.crouching,
      grounded: this.player.grounded,
      speedX: this.player.vx,
      aimUp: this.stepInput.aimUp ?? false,
      runFrame: Math.floor(this.stepIndex / RUN_FRAME_STEPS) % 4
    });
  }

  private renderPauseOverlay(): void {
    if (this.autoPaused) {
      // Focus was taken from the game; say plainly how to get back in.
      this.showOverlay('PAUSED', 'LOST WINDOW FOCUS - CLICK THE GAME OR PRESS ESC TO RESUME');
      return;
    }
    this.showOverlay('PAUSED', 'ESC resume   M mute (' + (this.settings.mute ? 'on' : 'off') + ')   F reduced-flash (' + (this.settings.reducedFlash ? 'on' : 'off') + ')');
  }

  private showOverlay(title: string, sub: string): void {
    this.overlayText?.setVisible(true);
    this.overlayText?.setText(title);
    this.overlaySubText?.setVisible(true);
    this.overlaySubText?.setText(sub);
  }

  private hideOverlay(): void {
    this.overlayText?.setVisible(false);
    this.overlaySubText?.setVisible(false);
  }

  private syncPool(pool: Phaser.GameObjects.Rectangle[], count: number, w: number, h: number, color: number, fillAlpha = 1): void {
    while (pool.length < count) {
      const r = this.add.rectangle(0, 0, w, h, color, fillAlpha);
      r.setOrigin(0, 0);
      pool.push(r);
    }
    for (let i = 0; i < pool.length; i++) {
      pool[i].setVisible(i < count);
    }
  }

  /** Image-pool twin of syncPool; sprites are center-origin so rotation pivots correctly. */
  private syncImagePool(pool: Phaser.GameObjects.Image[], count: number, key: string): void {
    while (pool.length < count) {
      const image = this.add.image(0, 0, key);
      image.setOrigin(0.5, 0.5);
      pool.push(image);
    }
    for (let i = 0; i < pool.length; i++) {
      pool[i].setVisible(i < count);
    }
  }

  private syncTextPool(pool: Phaser.GameObjects.BitmapText[], count: number): void {
    while (pool.length < count) {
      const t = drawText(this, 0, 0, '', { size: 16, color: '#06222b', originX: 0.5, originY: 0.5 });
      pool.push(t);
    }
    for (let i = 0; i < pool.length; i++) {
      pool[i].setVisible(i < count);
    }
  }

  private static keys = new Set<string>();
  /**
   * Keydown edges awaiting consumption. Polling `keys` for a toggle drops taps
   * that begin and end between two frames, which made a quick Esc do nothing;
   * these edges survive until the frame that reads them.
   */
  private static pressed = new Set<string>();
  private static keyHandlers: { down: (e: KeyboardEvent) => void; up: (e: KeyboardEvent) => void } | null = null;

  private static attachKeys(): void {
    if (LevelScene.keyHandlers) {
      return;
    }
    const down = (e: KeyboardEvent): void => {
      if (!e.repeat) {
        LevelScene.pressed.add(e.code);
      }
      LevelScene.keys.add(e.code);
    };
    const up = (e: KeyboardEvent): void => {
      LevelScene.keys.delete(e.code);
    };
    // Capture phase, for the same reason as the gameplay keys: Esc/M/F must not
    // be interceptable by an extension listening at document level.
    window.addEventListener('keydown', down, true);
    window.addEventListener('keyup', up, true);
    LevelScene.keyHandlers = { down, up };
  }

  private static detachKeys(): void {
    if (!LevelScene.keyHandlers) {
      return;
    }
    window.removeEventListener('keydown', LevelScene.keyHandlers.down, true);
    window.removeEventListener('keyup', LevelScene.keyHandlers.up, true);
    LevelScene.keyHandlers = null;
    LevelScene.keys.clear();
    LevelScene.pressed.clear();
  }

  /** True once per physical press of `code`; the edge is cleared on read. */
  private static consumePress(code: string): boolean {
    if (!LevelScene.pressed.has(code)) {
      return false;
    }
    LevelScene.pressed.delete(code);
    return true;
  }
}

/**
 * Collision size straight from the archetype data.
 *
 * These used to be hand-written switches that happened to agree with
 * `ENEMY_DEFS`; reading the data means a new archetype cannot be added with a
 * hitbox that silently disagrees with its own definition.
 */
function enemyWidth(e: EnemyState): number {
  return getEnemyDef(e.kind).width;
}

function enemyHeight(e: EnemyState): number {
  return getEnemyDef(e.kind).height;
}

function enemyScore(kind: EnemyKind): number {
  return getEnemyDef(kind).score;
}

/** The fire voice for a weapon; the two new weapons sound like themselves. */
function fireSound(weapon: WeaponId): SfxName {
  switch (weapon) {
    case 'scatter':
      return 'shootScatter';
    case 'rapid':
      return 'shootRapid';
    case 'laser':
      return 'shootLaser';
    case 'flame':
      return 'shootFlame';
    default:
      return 'shoot';
  }
}

/**
 * The capsule letter for a weapon - the genre convention that lets a pickup be
 * read at a glance. The HUD shows the same letter beside the weapon name, so
 * what you grabbed and what you are holding always match.
 */
function pickupLetter(weapon: string): string {
  switch (weapon) {
    case 'scatter':
      return 'S';
    case 'rapid':
      return 'R';
    case 'laser':
      return 'L';
    case 'flame':
      return 'F';
    default:
      return 'P';
  }
}

function particleColor(kind: string): number {
  if (kind === 'muzzle') {
    return PALETTE_HEX.GOLD_LIGHT;
  }
  if (kind === 'spark') {
    return PALETTE_HEX.GOLD;
  }
  if (kind === 'beacon') {
    return PALETTE_HEX.MINT;
  }
  if (kind === 'explosion') {
    return PALETTE_HEX.FIRE_LIGHT;
  }
  return PALETTE_HEX.FIRE;
}
