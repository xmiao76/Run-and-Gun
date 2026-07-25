import Phaser from 'phaser';
import {
  DEATH_FALL_Y,
  GROUND_Y,
  INVULN_DURATION,
  MAX_LIVES,
  PLAYER_HEIGHT,
  PLAYER_WIDTH
} from '../balance/player';
import { DEFAULT_WEAPON, getWeapon } from '../balance/weapons';
import { GAME_VERSION, LOGICAL_HEIGHT, LOGICAL_WIDTH, SCENE_KEYS } from '../app/config';
import { type AudioService } from '../audio/AudioService';
import {
  getDebugInput,
  isDebugEnabled,
  registerCommand,
  reportRuntime,
  reportScene
} from '../debug/debugBridge';
import { createKeyboardInput, type KeyboardInput } from '../input/KeyboardInput';
import { createGamepadInput, type GamepadInput } from '../input/GamepadInput';
import { createNeutralInput, mergeInput, type InputState } from '../input/InputState';
import { createTouchControls, isTouchDevice, type TouchControls } from '../ui/touch/TouchControls';
import { loadLevel, type LevelDef } from '../levels/levelLoader';
import { type Rect } from '../levels/levelSchema';
import { LEVELS } from '../levels/levels';
import { getBossDef } from '../balance/bosses';
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
import { applyDamage, createHealthState, tickInvuln, type HealthState } from '../simulation/health';
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
import { enemyTexture } from '../art/enemyArt';
import { propsForSolid, horizonForLevel, themeForLevel } from '../art/levelTheme';
import { SKY_TEXTURE } from '../art/textures';
import { hookShutdown } from './sceneLifecycle';
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

const MAX_ENEMIES = 12;
const MAX_PROJECTILES = 96;
const COMPLETION_DELAY = 1.2;
/** Seconds the death pose holds before the respawn (classic arcade death pause). */
const DEATH_DURATION = 0.9;
/** Seconds the hurt flinch pose shows after a damaging hit. */
const HURT_DURATION = 0.3;
/** Milliseconds per leg-swap in the player run cycle. */
const RUN_FRAME_MS = 140;

interface PlayerBullet extends Projectile {
  id: string;
  /** Collision ownership: always the player-projectile category (D3). */
  category: number;
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
  private ledger: DamageLedger = createDamageLedger();
  private nextId = 1;
  private paused = false;
  private prevEsc = false;
  private completionTimer = -1;
  private maxEnemiesSeen = 0;
  private maxPlayerBulletsSeen = 0;
  private maxEnemyBulletsSeen = 0;
  private prevM = false;
  private prevF = false;
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private movingPlatforms: MovingPlatformState[] = [];
  private doors: DoorState[] = [];
  private containers: ContainerState[] = [];
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
  private ridgeLayer?: Phaser.GameObjects.TileSprite;
  private movingPlatformRects: Phaser.GameObjects.Rectangle[] = [];
  private doorRects: Phaser.GameObjects.Rectangle[] = [];
  private containerImages: Phaser.GameObjects.Image[] = [];
  private particleRects: Phaser.GameObjects.Rectangle[] = [];
  private carrierImages: Phaser.GameObjects.Image[] = [];
  private subcomponentRects: Phaser.GameObjects.Rectangle[] = [];
  private telegraphRects: Phaser.GameObjects.Rectangle[] = [];
  private aimLineRects: Phaser.GameObjects.Rectangle[] = [];
  private enemyBulletImages: Phaser.GameObjects.Image[] = [];
  private playerBulletImages: Phaser.GameObjects.Image[] = [];
  private pickupImages: Phaser.GameObjects.Image[] = [];
  private pickupLabels: Phaser.GameObjects.Text[] = [];
  private playerImage?: Phaser.GameObjects.Image;
  private enemyImages: Phaser.GameObjects.Image[] = [];
  private animTimeMs = 0;
  private deathTimer = -1;
  private hurtTimer = 0;
  private bossRect?: Phaser.GameObjects.Rectangle;
  private bossImage?: Phaser.GameObjects.Image;
  private bossTeleRect?: Phaser.GameObjects.Rectangle;
  private bossZoneRect?: Phaser.GameObjects.Rectangle;
  private hudText?: Phaser.GameObjects.Text;
  private bossBarBack?: Phaser.GameObjects.Rectangle;
  private bossBarFill?: Phaser.GameObjects.Rectangle;
  private overlayText?: Phaser.GameObjects.Text;
  private overlaySubText?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.level);
  }

  public create(): void {
    const idx = (this.registry.get('currentLevelIndex') as number | undefined) ?? 0;
    this.levelIndex = Math.min(Math.max(idx, 0), LEVELS.length - 1);
    this.level = loadLevel(LEVELS[this.levelIndex]);
    // Phaser reuses the scene instance across scene.start calls, so pooled
    // render arrays must be cleared before they are rebuilt; otherwise they
    // would hold stale entries from the previous run and index out of bounds.
    this.groundTiles = [];
    this.oneWayTiles = [];
    this.hazardVoids = [];
    this.hazardRims = [];
    this.propImages = [];
    this.movingPlatformRects = [];
    this.doorRects = [];
    this.subcomponentRects = [];
    this.enemyImages = [];
    this.telegraphRects = [];
    this.aimLineRects = [];
    this.enemyBulletImages = [];
    this.playerBulletImages = [];
    this.pickupImages = [];
    this.pickupLabels = [];
    this.containerImages = [];
    this.particleRects = [];
    this.carrierImages = [];
    this.resetRun();
    ensureGameTextures(this);
    this.buildEnvironment();
    // Feet-anchored so poses with different heights (stand/crouch/death) stay planted.
    this.playerImage = this.add.image(0, 0, 'art/player-idle').setOrigin(0, 1);
    this.bossRect = this.add.rectangle(0, 0, 64, 56, 0x884422);
    this.bossRect.setOrigin(0, 0);
    this.bossRect.setVisible(false);
    this.bossImage = this.add.image(0, 0, 'art/boss-siege-walker').setOrigin(0, 0).setVisible(false);
    this.bossTeleRect = this.add.rectangle(0, 0, 72, 64);
    this.bossTeleRect.setOrigin(0, 0);
    this.bossTeleRect.setStrokeStyle(3, 0xffff66);
    this.bossTeleRect.setFillStyle(0x000000, 0);
    this.bossTeleRect.setVisible(false);
    this.bossZoneRect = this.add.rectangle(0, 0, SHOCKWAVE_RADIUS * 2, 6, 0xffcc44);
    this.bossZoneRect.setOrigin(0.5, 1);
    this.bossZoneRect.setVisible(false);
    this.hudText = this.add.text(12, 16, '', { fontFamily: 'monospace', fontSize: '16px', color: '#e8f1ff' });
    this.add
      .text(12, LOGICAL_HEIGHT - 16, 'Move A/D  Jump W/Space  Crouch/Drop S  Fire J  Pause Esc', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#5c6c8c'
      })
      .setOrigin(0, 0.5);
    this.bossBarBack = this.add.rectangle(LOGICAL_WIDTH / 2 - 150, 18, 300, 10, 0x331111);
    this.bossBarBack.setOrigin(0, 0.5);
    this.bossBarBack.setVisible(false);
    this.bossBarFill = this.add.rectangle(LOGICAL_WIDTH / 2 - 150, 18, 300, 10, 0xff5544);
    this.bossBarFill.setOrigin(0, 0.5);
    this.bossBarFill.setVisible(false);
    this.overlayText = this.add.text(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, '', { fontFamily: 'monospace', fontSize: '34px', color: '#e8f1ff' }).setOrigin(0.5);
    this.overlaySubText = this.add.text(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2 + 40, '', { fontFamily: 'monospace', fontSize: '16px', color: '#8fa3c7' }).setOrigin(0.5);
    this.overlayText.setVisible(false);
    this.overlaySubText.setVisible(false);
    this.keyboard.attach(window);
    LevelScene.attachKeys();
    this.touch = this.shouldShowTouchControls() ? createTouchControls() : null;
    this.onBlur = (): void => {
      // H5: losing window focus pauses and neutralizes held inputs.
      this.paused = true;
      this.keyboard.clear();
    };
    window.addEventListener('blur', this.onBlur);
    this.registerDebugCommands();
    hookShutdown(this.events, () => this.shutdown());
    reportScene(SCENE_KEYS.level);
    this.settings = (this.registry.get('settings') as Settings | undefined) ?? { ...DEFAULT_SETTINGS };
    this.publishRuntime();
    const audio = this.registry.get('audio') as AudioService | undefined;
    audio?.setSettings(this.settings);
    audio?.setMusic(true);
  }

  public shutdown(): void {
    this.keyboard.detach(window);
    LevelScene.detachKeys();
    if (this.onBlur) {
      window.removeEventListener('blur', this.onBlur);
      this.onBlur = null;
    }
    if (this.touch) {
      this.touch.destroy();
      this.touch = null;
    }
    const audio = this.registry.get('audio') as AudioService | undefined;
    audio?.setMusic(false);
  }

  public override update(_time: number, deltaMs: number): void {
    const esc = this.keyboardEsc() || this.gamepad.pauseEdge() || (this.touch?.consumePauseEdge() ?? false);
    if (esc && !this.prevEsc) {
      this.paused = !this.paused;
    }
    this.prevEsc = esc;

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

    const result = tick(this.clock, deltaMs / 1000);
    this.clock.accumulator = result.accumulator;
    for (let i = 0; i < result.steps; i++) {
      this.stepOnce();
    }
    this.animTimeMs += deltaMs;
    this.render();
  }

  private keyboardEsc(): boolean {
    return LevelScene.isDown('Escape');
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
    this.player = createPlatformerState(this.level.spawn.x, this.level.spawn.y);
    this.health = createHealthState(MAX_LIVES);
    this.weapon = createWeaponState(DEFAULT_WEAPON);
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.pickups = this.level.pickups.map((p) => ({ id: p.id, x: p.x, y: p.y, width: 18, height: 18, weapon: p.weapon, collected: false }));
    this.triggers = createSpawnTriggers(this.level.triggers);
    this.boss = createBossState(this.level.boss.id);
    this.movingPlatforms = createMovingPlatformStates(this.level.movingPlatforms);
    this.doors = createDoorStates(this.level.doors);
    this.containers = createContainerStates(this.level.containers);
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
      lives: MAX_LIVES,
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
    registerCommand('pause', () => {
      this.paused = true;
      this.publishRuntime();
      return { ok: true };
    });
    registerCommand('resume', () => {
      this.paused = false;
      this.publishRuntime();
      return { ok: true };
    });
    registerCommand('teleportPlayer', (payload) => {
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
    registerCommand('damageBoss', (payload) => {
      if (!this.boss.active) {
        this.boss = activateBoss(this.boss);
      }
      const amount = typeof payload === 'number' ? payload : 99;
      const result = damageBoss(this.boss, amount);
      this.boss = result.boss;
      this.publishRuntime();
      return { ok: true, applied: result.applied, health: this.boss.health };
    });
    registerCommand('defeatBoss', () => {
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
    registerCommand('completeLevel', () => {
      if (this.completionTimer < 0 && !this.health.gameOver) {
        this.completionTimer = COMPLETION_DELAY;
      }
      this.publishRuntime();
      return { ok: true };
    });
    registerCommand('triggerGameOver', () => {
      this.health = { lives: 0, invuln: 0, gameOver: true };
      this.publishRuntime();
      return { ok: true };
    });
    registerCommand('awardScore', (payload) => {
      const amount = typeof payload === 'number' ? payload : 0;
      this.score += Math.max(0, Math.floor(amount));
      this.publishRuntime();
      return { ok: true, score: this.score };
    });
    registerCommand('advanceSteps', (payload) => {
      // Test affordance for the soak test: fast-forward simulation time
      // synchronously (bounded), driving the real fixed-step loop.
      const n = Math.min(Math.max(typeof payload === 'number' ? Math.floor(payload) : 0, 0), 60000);
      for (let i = 0; i < n; i++) {
        this.stepOnce();
      }
      this.publishRuntime();
      return { ok: true, steps: n };
    });
    registerCommand('report', () => {
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

  private stepOnce(): void {
    const debug = this.readDebugInput();
    const touchInput = this.touch ? this.touch.read() : createNeutralInput();
    const device = mergeInput(this.keyboard.build(this.stepInput), this.gamepad.build());
    this.stepInput = mergeInput(device, mergeInput(debug, touchInput));

    if (this.health.gameOver) {
      // Guard against repeated transitions when steps are driven externally.
      if (this.scene.isActive()) {
        this.goToGameOver();
      }
      return;
    }

    if (this.completionTimer >= 0) {
      this.completionTimer -= FIXED_DT;
      if (this.completionTimer <= 0) {
        this.registry.set('lastScore', this.score);
        this.scene.start(SCENE_KEYS.results);
        return;
      }
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
    const dynamicSolids = [
      ...this.level.solids,
      ...platformDeltas.map((p) => p.rect),
      ...closedDoorRects(this.doors),
      ...solidContainerRects(this.containers)
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

    if (this.hazardTouchesPlayer() || playerResult.died) {
      this.startDeath();
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
      this.sfx('shoot');
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
        { kind: 'burst', x: this.boss.x + bossDef.width / 2, y: this.boss.y + bossDef.height / 2 },
        { kind: 'burst', x: this.boss.x + bossDef.width / 2, y: this.boss.y + bossDef.height / 2 }
      ]);
      this.sfx('explosion');
    }
    if (result.action.kind === 'shockwave') {
      this.sfx('explosion');
      const def = getBossDef(this.level.boss.id);
      const zoneCenter = result.action.x + def.width / 2;
      // Honest, grounded-only shockwave damage (jumping dodges it).
      if (shockwaveHits(zoneCenter, this.player.x + PLAYER_WIDTH / 2, this.player.grounded)) {
        this.playerHit();
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
      let consumed = false;
      if (bullet.category !== CollisionCategory.playerProjectile) {
        surviving.push(bullet);
        continue;
      }
      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        if (!isAlive(enemy) || !this.bulletHitsRect(bullet.x, bullet.y, 8, 4, enemy.x, enemy.y, enemyWidth(enemy), enemyHeight(enemy))) {
          continue;
        }
        if (!recordHit(this.ledger, bullet.id, enemy.id)) {
          continue;
        }
        this.spawnFx([{ kind: 'spark', x: bullet.x, y: bullet.y }]);
        this.enemies[i] = damageEnemy(enemy, bullet.damage);
        if (!isAlive(this.enemies[i])) {
          this.score += enemyScore(enemy.kind);
          this.spawnFx([{ kind: 'burst', x: enemy.x + enemyWidth(enemy) / 2, y: enemy.y + enemyHeight(enemy) / 2 }]);
          this.sfx('hit');
        }
        consumed = true;
        break;
      }
      if (!consumed) {
        surviving.push(bullet);
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
      let consumed = false;
      if (bullet.category !== CollisionCategory.playerProjectile) {
        surviving.push(bullet);
        continue;
      }
      for (let i = 0; i < this.containers.length; i++) {
        const c = this.containers[i];
        if (c.destroyed || !this.bulletHitsRect(bullet.x, bullet.y, 8, 4, c.x, c.y, c.width, c.height)) {
          continue;
        }
        if (!recordHit(this.ledger, bullet.id, c.id)) {
          continue;
        }
        this.spawnFx([{ kind: 'spark', x: bullet.x, y: bullet.y }]);
        this.containers[i] = damageContainer(c, bullet.damage);
        if (this.containers[i].destroyed) {
          this.score += c.scoreValue;
          this.spawnFx([{ kind: 'burst', x: c.x + c.width / 2, y: c.y + c.height / 2 }]);
          this.sfx('explosion');
        }
        consumed = true;
        break;
      }
      if (!consumed) {
        surviving.push(bullet);
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
      let consumed = false;
      if (bullet.category !== CollisionCategory.playerProjectile) {
        surviving.push(bullet);
        continue;
      }
      for (let i = 0; i < this.supplyCarriers.length; i++) {
        const c = this.supplyCarriers[i];
        // Single-hit object: no damage ledger needed (later same-step pellets
        // see the destroyed state and pass through).
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
        consumed = true;
        break;
      }
      if (!consumed) {
        surviving.push(bullet);
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
      let consumed = false;
      if (bullet.category !== CollisionCategory.playerProjectile) {
        surviving.push(bullet);
        continue;
      }
      for (let i = 0; i < this.subcomponents.length; i++) {
        const s = this.subcomponents[i];
        if (!s.alive || !this.bulletHitsRect(bullet.x, bullet.y, 8, 4, s.x, s.y, s.width, s.height)) {
          continue;
        }
        if (!recordHit(this.ledger, bullet.id, s.id)) {
          continue;
        }
        this.spawnFx([{ kind: 'spark', x: bullet.x, y: bullet.y }]);
        const health = s.health - bullet.damage;
        this.subcomponents[i] = { ...s, health, alive: health > 0 };
        if (health <= 0) {
          this.score += s.score;
          this.spawnFx([{ kind: 'burst', x: s.x + s.width / 2, y: s.y + s.height / 2 }]);
          this.sfx('hit');
        }
        consumed = true;
        break;
      }
      if (!consumed) {
        surviving.push(bullet);
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
    const def = { width: 64, height: 56 };
    const surviving: PlayerBullet[] = [];
    for (const bullet of this.playerBullets) {
      if (bullet.category !== CollisionCategory.playerProjectile) {
        surviving.push(bullet);
        continue;
      }
      if (this.bulletHitsRect(bullet.x, bullet.y, 8, 4, this.boss.x, this.boss.y, def.width, def.height) && recordHit(this.ledger, bullet.id, 'boss')) {
        const result = damageBoss(this.boss, bullet.damage);
        this.boss = result.boss;
        if (result.applied) {
          this.spawnFx([{ kind: 'spark', x: bullet.x, y: bullet.y }]);
          this.sfx('hit');
        }
      } else {
        surviving.push(bullet);
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
        this.playerHit();
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

  private playerHit(): void {
    const damage = applyDamage(this.health, INVULN_DURATION);
    this.health = damage.health;
    if (damage.applied) {
      this.sfx('hit');
      this.hurtTimer = HURT_DURATION;
    }
  }

  private hazardTouchesPlayer(): boolean {
    const h = currentHeight(this.player);
    const top = this.player.y - h;
    for (const hz of this.level.hazards) {
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
  private startDeath(): void {
    if (this.deathTimer >= 0) {
      return;
    }
    this.deathTimer = DEATH_DURATION;
    this.spawnFx([{ kind: 'burst', x: this.player.x + PLAYER_WIDTH / 2, y: this.player.y - PLAYER_HEIGHT / 2 }]);
    this.sfx('explosion');
  }

  /** Applies the life loss at the end of the death pause, then respawns at the checkpoint or ends the run. */
  private finishDeath(): void {
    const damage = applyDamage(this.health, INVULN_DURATION);
    this.health = damage.health;
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

  private handlePauseInput(): void {
    const m = LevelScene.isDown('KeyM');
    if (m && !this.prevM) {
      this.settings = { ...this.settings, mute: !this.settings.mute };
      this.persistSettings();
    }
    this.prevM = m;
    const f = LevelScene.isDown('KeyF');
    if (f && !this.prevF) {
      this.settings = { ...this.settings, reducedFlash: !this.settings.reducedFlash };
      this.persistSettings();
    }
    this.prevF = f;
  }

  private persistSettings(): void {
    this.registry.set('settings', this.settings);
    saveSettings(this.settings);
    const audio = this.registry.get('audio') as AudioService | undefined;
    audio?.setSettings(this.settings);
  }

  private publishRuntime(): void {
    reportRuntime({
      level: this.level.id,
      levelIndex: this.levelIndex,
      playerX: Math.round(this.player.x * 100) / 100,
      playerY: Math.round(this.player.y * 100) / 100,
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
      checkpoint: this.lastCheckpointId,
      bossActive: this.boss.active,
      bossHealth: this.boss.health,
      bossState: this.boss.state,
      bossPhase: this.boss.phase,
      bossVulnerable: this.boss.vulnerable,
      subcomponentsAlive: this.subcomponents.filter((s) => s.alive).length,
      containersAlive: this.containers.filter((c) => !c.destroyed).length,
      supplyCarriersAlive: this.supplyCarriers.filter((c) => c.alive).length,
      supplyCarrierX: this.supplyCarriers.find((c) => c.alive)?.x ?? null,
      pickupsAvailable: this.pickups.filter((p) => !p.collected).length,
      telegraphCount: this.enemies.filter((e) => e.telegraphing).length,
      bossPattern: this.boss.active ? currentPattern(this.boss, getBossDef(this.level.boss.id)) : null,
      maxEnemiesSeen: this.maxEnemiesSeen,
      maxPlayerBulletsSeen: this.maxPlayerBulletsSeen,
      maxEnemyBulletsSeen: this.maxEnemyBulletsSeen,
      particleCount: this.particles.length,
      paused: this.paused,
      gameOver: this.health.gameOver,
      completing: this.completionTimer >= 0,
      score: this.score
    });
  }

  /**
   * Builds the level's themed environment: a parallax dusk-jungle backdrop
   * (sky, stars, distant ridge, near canopy), textured ground and platform
   * tiles, hazard-striped pit voids, and deterministic scenic props. Terrain
   * art is world-anchored (tile offsets set from world x) so it never swims
   * under the camera; the background layers scroll at reduced rates for depth.
   */
  private buildEnvironment(): void {
    const theme = themeForLevel(this.level.id);

    this.add
      .image(0, 0, SKY_TEXTURE)
      .setOrigin(0, 0)
      .setDisplaySize(LOGICAL_WIDTH, LOGICAL_HEIGHT);
    this.starsLayer = this.add
      .tileSprite(0, 0, LOGICAL_WIDTH, 300, 'art/bg-stars')
      .setOrigin(0, 0)
      .setAlpha(0.8);
    this.ridgeLayer = this.add
      .tileSprite(0, 250, LOGICAL_WIDTH, 130, 'art/bg-ridge')
      .setOrigin(0, 0)
      .setTileScale(4, 6)
      .setTint(theme.ridgeTint);

    // World-anchored silhouettes on the far ground line: they read against the
    // sky's horizon glow and break up the tiled bands.
    for (const h of horizonForLevel(this.level.width, GROUND_Y)) {
      const image = this.add.image(0, 0, h.key).setOrigin(0, 1).setScale(h.scale).setAlpha(h.alpha);
      this.propImages.push({ image, worldX: h.x, baseY: h.y });
    }

    for (const r of this.level.solids) {
      const tile = this.add.tileSprite(0, 0, r.width, r.height, theme.groundTile).setOrigin(0, 0);
      // World-anchored pattern: the grass never slides as the camera moves.
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
      const voidRect = this.add.rectangle(0, 0, r.width, r.height, 0x05070c).setOrigin(0, 0);
      this.hazardVoids.push(voidRect);
      const rim = this.add.tileSprite(0, 0, r.width, 8, 'art/tile-hazard').setOrigin(0, 0);
      rim.tilePositionX = r.x;
      this.hazardRims.push(rim);
    }
  }

  private render(): void {
    if (!this.playerImage || !this.hudText) {
      return;
    }
    // Parallax backdrop: farther layers scroll slower.
    if (this.starsLayer && this.ridgeLayer) {
      this.starsLayer.tilePositionX = this.cameraX * 0.15;
      this.ridgeLayer.tilePositionX = this.cameraX * 0.3;
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

    this.syncPool(this.movingPlatformRects, this.movingPlatforms.length, 12, 12, 0x5a7a3a);
    this.movingPlatforms.forEach((mp, i) => {
      const rect = this.movingPlatformRects[i];
      const r = movingPlatformRect(mp);
      rect.setSize(r.width, r.height);
      rect.setVisible(true);
      rect.setPosition(r.x - this.cameraX, r.y);
    });

    this.syncPool(this.doorRects, this.doors.length, 16, 96, 0xcc7733);
    this.doors.forEach((d, i) => {
      const rect = this.doorRects[i];
      rect.setSize(d.rect.width, d.rect.height);
      rect.setVisible(true);
      rect.setAlpha(d.open ? 0.25 : 1);
      rect.setPosition(d.rect.x - this.cameraX, d.rect.y);
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

    this.syncPool(this.particleRects, this.particles.length, 4, 4, 0xffffff);
    this.particles.forEach((p, i) => {
      const rect = this.particleRects[i];
      rect.setSize(p.size, p.size);
      rect.setFillStyle(particleColor(p.kind));
      rect.setAlpha(this.settings.reducedFlash ? 0.75 : Math.max(0.15, p.ttl / p.maxTtl));
      rect.setPosition(p.x - this.cameraX, p.y);
    });

    this.syncImagePool(this.enemyImages, this.enemies.length, 'art/enemy-runner');
    this.syncPool(this.telegraphRects, this.enemies.length, 30, 38, 0, 0);
    this.syncPool(this.aimLineRects, this.enemies.length, 110, 3, 0xffee88);
    this.enemies.forEach((e, i) => {
      const image = this.enemyImages[i];
      const tele = this.telegraphRects[i];
      const aim = this.aimLineRects[i];
      const w = enemyWidth(e);
      const hh = enemyHeight(e);
      image.setTexture(enemyTexture(e.kind));
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
      label.setText(pickupLetter(p.weapon));
    });
    // Falling carrier drops reuse the pickup visuals.
    this.carrierDrops.forEach((d, k) => {
      const i = visiblePickups.length + k;
      const image = this.pickupImages[i];
      const label = this.pickupLabels[i];
      image.setOrigin(0, 0);
      image.setPosition(d.x - this.cameraX, d.y);
      label.setPosition(d.x - this.cameraX + 9, d.y + 9);
      label.setText(pickupLetter(d.weapon));
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
      if (this.level.boss.id === 'siegeWalker' && this.bossImage) {
        // Sprite boss: stretched to the hitbox, flipped toward the player,
        // warm tint during the vulnerable window.
        this.bossRect?.setVisible(false);
        this.bossImage.setVisible(true);
        this.bossImage.setDisplaySize(bossDef.width, bossDef.height);
        this.bossImage.setPosition(this.boss.x - this.cameraX, this.boss.y);
        this.bossImage.setFlipX(this.player.x > this.boss.x + bossDef.width / 2);
        if (this.boss.vulnerable) {
          this.bossImage.setTint(0xffd070);
        } else {
          this.bossImage.clearTint();
        }
      } else {
        this.bossImage?.setVisible(false);
        this.bossRect?.setVisible(true);
        this.bossRect?.setSize(bossDef.width, bossDef.height);
        this.bossRect?.setPosition(this.boss.x - this.cameraX, this.boss.y);
        this.bossRect?.setFillStyle(this.boss.vulnerable ? 0xddaa44 : 0x884422);
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
      this.bossRect?.setVisible(false);
      this.bossImage?.setVisible(false);
      this.bossTeleRect?.setVisible(false);
      this.bossZoneRect?.setVisible(false);
    }

    this.syncPool(this.subcomponentRects, this.subcomponents.length, 18, 18, 0x66ffcc);
    this.subcomponents.forEach((s, i) => {
      const rect = this.subcomponentRects[i];
      const show = this.boss.active && s.alive;
      rect.setVisible(show);
      if (show) {
        rect.setSize(s.width, s.height);
        rect.setPosition(s.x - this.cameraX, s.y);
      }
    });

    const showBossBar = this.boss.active && isBossAlive(this.boss);
    this.bossBarBack?.setVisible(showBossBar);
    this.bossBarFill?.setVisible(showBossBar);
    if (showBossBar && this.bossBarFill) {
      this.bossBarFill.setSize((300 * Math.max(0, this.boss.health)) / bossDef.health, 10);
    }

    const def = getWeapon(this.weapon.id);
    this.hudText.setText('LIVES ' + this.health.lives + '   ' + def.name.toUpperCase() + '   SCORE ' + this.score + '   v' + GAME_VERSION);

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
  }

  private currentPose(): PlayerPoseKey {
    return selectPlayerPose({
      dying: this.deathTimer >= 0,
      hurt: this.hurtTimer > 0,
      crouching: this.player.crouching,
      grounded: this.player.grounded,
      speedX: this.player.vx,
      aimUp: this.stepInput.aimUp ?? false,
      runFrame: Math.floor(this.animTimeMs / RUN_FRAME_MS) % 2
    });
  }

  private renderPauseOverlay(): void {
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

  private syncTextPool(pool: Phaser.GameObjects.Text[], count: number): void {
    while (pool.length < count) {
      const t = this.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '12px', color: '#06222b' });
      t.setOrigin(0.5, 0.5);
      pool.push(t);
    }
    for (let i = 0; i < pool.length; i++) {
      pool[i].setVisible(i < count);
    }
  }

  private static keys = new Set<string>();
  private static keyHandlers: { down: (e: KeyboardEvent) => void; up: (e: KeyboardEvent) => void } | null = null;

  private static attachKeys(): void {
    if (LevelScene.keyHandlers) {
      return;
    }
    const down = (e: KeyboardEvent): void => {
      LevelScene.keys.add(e.code);
    };
    const up = (e: KeyboardEvent): void => {
      LevelScene.keys.delete(e.code);
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    LevelScene.keyHandlers = { down, up };
  }

  private static detachKeys(): void {
    if (!LevelScene.keyHandlers) {
      return;
    }
    window.removeEventListener('keydown', LevelScene.keyHandlers.down);
    window.removeEventListener('keyup', LevelScene.keyHandlers.up);
    LevelScene.keyHandlers = null;
    LevelScene.keys.clear();
  }

  private static isDown(code: string): boolean {
    return LevelScene.keys.has(code);
  }
}

function enemyWidth(e: EnemyState): number {
  if (e.kind === 'sentry' || e.kind === 'grenadier') {
    return e.kind === 'sentry' ? 24 : 22;
  }
  if (e.kind === 'drone') {
    return 22;
  }
  return 20;
}

function enemyHeight(e: EnemyState): number {
  if (e.kind === 'sentry') {
    return 24;
  }
  if (e.kind === 'drone') {
    return 18;
  }
  return 30;
}

function enemyScore(kind: string): number {
  if (kind === 'sentry') {
    return 150;
  }
  if (kind === 'drone') {
    return 120;
  }
  if (kind === 'grenadier') {
    return 140;
  }
  return 100;
}

function pickupLetter(weapon: string): string {
  if (weapon === 'scatter') {
    return 'S';
  }
  if (weapon === 'rapid') {
    return 'R';
  }
  return 'P';
}

function particleColor(kind: string): number {
  if (kind === 'muzzle') {
    return 0xfff2a8;
  }
  if (kind === 'spark') {
    return 0xffd166;
  }
  if (kind === 'beacon') {
    return 0x66ffcc;
  }
  return 0xff8855;
}
