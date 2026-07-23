import Phaser from 'phaser';
import {
  DEATH_FALL_Y,
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
  registerCommand,
  reportRuntime,
  reportScene
} from '../debug/debugBridge';
import { createKeyboardInput, type KeyboardInput } from '../input/KeyboardInput';
import { createNeutralInput, mergeInput, type InputState } from '../input/InputState';
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
  type EnemyFireIntent,
  type EnemyState
} from '../simulation/enemies';
import { applyDamage, createHealthState, tickInvuln, type HealthState } from '../simulation/health';
import { collectPickups, type Pickup } from '../simulation/pickups';
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
  damageBoss,
  isBossAlive,
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

const MAX_ENEMIES = 12;
const MAX_PROJECTILES = 96;
const COMPLETION_DELAY = 1.2;

interface PlayerBullet extends Projectile {
  id: string;
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
  private clock: ClockState = createClock();
  private stepInput: InputState = createNeutralInput();
  private keyboard: KeyboardInput = createKeyboardInput();
  private ledger: DamageLedger = createDamageLedger();
  private nextId = 1;
  private paused = false;
  private prevEsc = false;
  private completionTimer = -1;
  private prevM = false;
  private prevF = false;
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private movingPlatforms: MovingPlatformState[] = [];
  private doors: DoorState[] = [];
  private subcomponents: SubcomponentState[] = [];
  private lastBossPhase = 0;
  private bossDeathHandled = false;

  private solidRects: Phaser.GameObjects.Rectangle[] = [];
  private oneWayRects: Phaser.GameObjects.Rectangle[] = [];
  private hazardRects: Phaser.GameObjects.Rectangle[] = [];
  private movingPlatformRects: Phaser.GameObjects.Rectangle[] = [];
  private doorRects: Phaser.GameObjects.Rectangle[] = [];
  private subcomponentRects: Phaser.GameObjects.Rectangle[] = [];
  private enemyRects: Phaser.GameObjects.Rectangle[] = [];
  private telegraphRects: Phaser.GameObjects.Rectangle[] = [];
  private enemyBulletRects: Phaser.GameObjects.Rectangle[] = [];
  private playerBulletRects: Phaser.GameObjects.Rectangle[] = [];
  private pickupRects: Phaser.GameObjects.Rectangle[] = [];
  private pickupLabels: Phaser.GameObjects.Text[] = [];
  private playerRect?: Phaser.GameObjects.Rectangle;
  private bossRect?: Phaser.GameObjects.Rectangle;
  private bossTeleRect?: Phaser.GameObjects.Rectangle;
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
    this.solidRects = [];
    this.oneWayRects = [];
    this.hazardRects = [];
    this.movingPlatformRects = [];
    this.doorRects = [];
    this.subcomponentRects = [];
    this.enemyRects = [];
    this.telegraphRects = [];
    this.enemyBulletRects = [];
    this.playerBulletRects = [];
    this.pickupRects = [];
    this.pickupLabels = [];
    this.resetRun();
    this.buildStaticVisuals();
    this.playerRect = this.add.rectangle(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT, 0x44dd66);
    this.playerRect.setOrigin(0, 0);
    this.bossRect = this.add.rectangle(0, 0, 64, 56, 0x884422);
    this.bossRect.setOrigin(0, 0);
    this.bossRect.setVisible(false);
    this.bossTeleRect = this.add.rectangle(0, 0, 72, 64);
    this.bossTeleRect.setOrigin(0, 0);
    this.bossTeleRect.setStrokeStyle(3, 0xffff66);
    this.bossTeleRect.setFillStyle(0x000000, 0);
    this.bossTeleRect.setVisible(false);
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
    this.registerDebugCommands();
    reportScene(SCENE_KEYS.level);
    this.publishRuntime();
    const audio = this.registry.get('audio') as AudioService | undefined;
    audio?.setSettings(this.settings);
    audio?.setMusic(true);
  }

  public shutdown(): void {
    this.keyboard.detach(window);
    LevelScene.detachKeys();
    const audio = this.registry.get('audio') as AudioService | undefined;
    audio?.setMusic(false);
  }

  public override update(_time: number, deltaMs: number): void {
    const esc = this.keyboardEsc();
    if (esc && !this.prevEsc) {
      this.paused = !this.paused;
    }
    this.prevEsc = esc;

    if (this.paused) {
      this.handlePauseInput();
      this.render();
      this.renderPauseOverlay();
      return;
    }

    const result = tick(this.clock, deltaMs / 1000);
    this.clock.accumulator = result.accumulator;
    for (let i = 0; i < result.steps; i++) {
      this.stepOnce();
    }
    this.render();
  }

  private keyboardEsc(): boolean {
    return LevelScene.isDown('Escape');
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
      drop: d.drop
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
    this.stepInput = mergeInput(this.keyboard.build(this.stepInput), debug);

    if (this.health.gameOver) {
      this.goToGameOver();
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

    this.health = tickInvuln(this.health, FIXED_DT);

    // Advance moving platforms and doors, then merge them into the solid set.
    const platformDeltas: { rect: Rect; deltaX: number; deltaY: number }[] = [];
    this.movingPlatforms = this.movingPlatforms.map((mp) => {
      const step = stepMovingPlatform(mp, FIXED_DT);
      platformDeltas.push({ rect: movingPlatformRect(step.state), deltaX: step.deltaX, deltaY: step.deltaY });
      return step.state;
    });
    const playerTop = this.player.y - currentHeight(this.player);
    this.doors = this.doors.map((d) => stepDoor(d, this.player.x, playerTop, PLAYER_WIDTH, currentHeight(this.player)));
    const dynamicSolids = [
      ...this.level.solids,
      ...platformDeltas.map((p) => p.rect),
      ...closedDoorRects(this.doors)
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
    this.resolvePlayerBulletsVsEnemies();
    this.resolvePlayerBulletsVsSubcomponents();
    this.resolvePlayerBulletsVsBoss();
    this.resolveEnemyBulletsVsPlayer();
    this.resolvePickups();

    this.lastCheckpointId = advanceCheckpoint(this.level.checkpoints, this.lastCheckpointId, this.player.x, this.player.y, PLAYER_WIDTH, PLAYER_HEIGHT);

    this.playerBullets = this.cullPlayerBullets(this.playerBullets);
    this.enemyBullets = this.cullEnemyBullets(this.enemyBullets);
    this.enemies = this.enemies.filter((e) => isAlive(e) && e.x > this.cameraX - 200 && e.x < this.cameraX + LOGICAL_WIDTH + 400);

    this.cameraX = Math.min(Math.max(this.player.x - LOGICAL_WIDTH / 2, 0), Math.max(0, this.level.width - LOGICAL_WIDTH));

    if (this.hazardTouchesPlayer() || playerResult.died) {
      this.handleDeath();
    }

    if (isBossAlive(this.boss) === false && this.boss.active && this.player.x >= this.level.completionX && this.completionTimer < 0) {
      this.completionTimer = COMPLETION_DELAY;
      this.sfx('complete');
    }

    clearLedger(this.ledger);
    this.clearPressedEdges();
    this.publishRuntime();
  }

  private stepPlayerFiring(): void {
    const fireResult = stepWeapon(this.weapon, FIXED_DT, this.stepInput.firePressed);
    this.weapon = fireResult.weapon;
    if (fireResult.fired) {
      this.sfx('shoot');
    }
    if (fireResult.projectiles.length > 0) {
      const h = currentHeight(this.player);
      const spawned = fireResult.projectiles.map((p): PlayerBullet => ({
        ...p,
        id: this.makeId('pb'),
        x: this.player.x + (this.player.facing > 0 ? PLAYER_WIDTH : 0),
        y: this.player.y - h / 2
      }));
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
    this.boss = result.boss;
    if (!isBossAlive(this.boss) && !this.bossDeathHandled) {
      // G5: no hostile projectiles survive into the completion sequence.
      this.bossDeathHandled = true;
      this.enemyBullets = [];
      this.sfx('explosion');
    }
    if (result.action.kind === 'shockwave') {
      this.sfx('explosion');
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
          arcGravity: 0
        });
      }
      void len;
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
        arcGravity: intent.arcGravity
      });
    }
  }

  private stepEnemyBullets(): void {
    this.enemyBullets = this.enemyBullets
      .map((b): EnemyBullet => ({ ...b, x: b.x + b.vx * FIXED_DT, y: b.y + b.vy * FIXED_DT, vy: b.vy + b.arcGravity * FIXED_DT, ttl: b.ttl - FIXED_DT }))
      .filter((b) => b.ttl > 0);
  }

  private resolvePlayerBulletsVsEnemies(): void {
    const surviving: PlayerBullet[] = [];
    for (const bullet of this.playerBullets) {
      let consumed = false;
      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        if (!isAlive(enemy) || !this.bulletHitsRect(bullet.x, bullet.y, 8, 4, enemy.x, enemy.y, enemyWidth(enemy), enemyHeight(enemy))) {
          continue;
        }
        if (!recordHit(this.ledger, bullet.id, enemy.id)) {
          continue;
        }
        this.enemies[i] = damageEnemy(enemy, bullet.damage);
        if (!isAlive(this.enemies[i])) {
          this.score += enemyScore(enemy.kind);
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

  private resolvePlayerBulletsVsSubcomponents(): void {
    const def = getBossDef(this.level.boss.id);
    if (!bossHasSubcomponents(def) || !this.boss.active) {
      return;
    }
    const surviving: PlayerBullet[] = [];
    for (const bullet of this.playerBullets) {
      let consumed = false;
      for (let i = 0; i < this.subcomponents.length; i++) {
        const s = this.subcomponents[i];
        if (!s.alive || !this.bulletHitsRect(bullet.x, bullet.y, 8, 4, s.x, s.y, s.width, s.height)) {
          continue;
        }
        if (!recordHit(this.ledger, bullet.id, s.id)) {
          continue;
        }
        const health = s.health - bullet.damage;
        this.subcomponents[i] = { ...s, health, alive: health > 0 };
        if (health <= 0) {
          this.score += s.score;
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
    const def = { width: 64, height: 56 };
    const surviving: PlayerBullet[] = [];
    for (const bullet of this.playerBullets) {
      if (this.bulletHitsRect(bullet.x, bullet.y, 8, 4, this.boss.x, this.boss.y, def.width, def.height) && recordHit(this.ledger, bullet.id, 'boss')) {
        const result = damageBoss(this.boss, bullet.damage);
        this.boss = result.boss;
        if (result.applied) {
          this.sfx('hit');
        }
      } else {
        surviving.push(bullet);
      }
    }
    this.playerBullets = surviving;
  }

  private resolveEnemyBulletsVsPlayer(): void {
    const h = currentHeight(this.player);
    const top = this.player.y - h;
    const surviving: EnemyBullet[] = [];
    for (const bullet of this.enemyBullets) {
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

  private handleDeath(): void {
    const damage = applyDamage(this.health, INVULN_DURATION);
    this.health = damage.health;
    if (this.health.gameOver) {
      // The game-over scene transition fires at the top of the next step.
      return;
    }
    const cp = resolveCheckpoint(this.level.checkpoints, this.lastCheckpointId);
    this.player = createPlatformerState(cp.x, cp.y);
    this.weapon = createWeaponState(this.checkpoint.weapon);
    this.playerBullets = [];
    this.enemyBullets = [];
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
      const audio = this.registry.get('audio') as AudioService | undefined;
      audio?.setSettings(this.settings);
    }
    this.prevM = m;
    const f = LevelScene.isDown('KeyF');
    if (f && !this.prevF) {
      this.settings = { ...this.settings, reducedFlash: !this.settings.reducedFlash };
    }
    this.prevF = f;
  }

  private publishRuntime(): void {
    reportRuntime({
      level: this.level.id,
      levelIndex: this.levelIndex,
      playerX: Math.round(this.player.x * 100) / 100,
      playerY: Math.round(this.player.y * 100) / 100,
      grounded: this.player.grounded,
      crouching: this.player.crouching,
      lives: this.health.lives,
      invuln: this.health.invuln > 0,
      weapon: this.weapon.id,
      enemyCount: this.enemies.length,
      projectileCount: this.playerBullets.length,
      enemyProjectileCount: this.enemyBullets.length,
      checkpoint: this.lastCheckpointId,
      bossActive: this.boss.active,
      bossHealth: this.boss.health,
      bossState: this.boss.state,
      bossPhase: this.boss.phase,
      bossVulnerable: this.boss.vulnerable,
      subcomponentsAlive: this.subcomponents.filter((s) => s.alive).length,
      paused: this.paused,
      gameOver: this.health.gameOver,
      completing: this.completionTimer >= 0,
      score: this.score
    });
  }

  private buildStaticVisuals(): void {
    for (const r of this.level.solids) {
      const rect = this.add.rectangle(0, 0, r.width, r.height, 0x243049);
      rect.setOrigin(0, 0);
      this.solidRects.push(rect);
    }
    for (const r of this.level.oneWays) {
      const rect = this.add.rectangle(0, 0, r.width, r.height, 0x3a6ea5);
      rect.setOrigin(0, 0);
      this.oneWayRects.push(rect);
    }
    for (const r of this.level.hazards) {
      const rect = this.add.rectangle(0, 0, r.width, r.height, 0x3a1010);
      rect.setOrigin(0, 0);
      rect.setStrokeStyle(2, 0xff5555);
      this.hazardRects.push(rect);
    }
  }

  private render(): void {
    if (!this.playerRect || !this.hudText) {
      return;
    }
    this.solidRects.forEach((rect, i) => {
      const r = this.level.solids[i];
      rect.setPosition(r.x - this.cameraX, r.y);
    });
    this.oneWayRects.forEach((rect, i) => {
      const r = this.level.oneWays[i];
      rect.setPosition(r.x - this.cameraX, r.y);
    });
    this.hazardRects.forEach((rect, i) => {
      const r = this.level.hazards[i];
      rect.setPosition(r.x - this.cameraX, r.y);
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

    const h = currentHeight(this.player);
    this.playerRect.setSize(PLAYER_WIDTH, h);
    this.playerRect.setPosition(this.player.x - this.cameraX, this.player.y - h);
    this.playerRect.setFillStyle(this.health.invuln > 0 ? 0x99ff99 : 0x44dd66);

    this.syncPool(this.playerBulletRects, this.playerBullets.length, 8, 4, 0xffe066);
    this.playerBulletRects.forEach((rect, i) => {
      const b = this.playerBullets[i];
      if (b) {
        rect.setVisible(true);
        rect.setPosition(b.x - this.cameraX, b.y);
      } else {
        rect.setVisible(false);
      }
    });
    this.syncPool(this.enemyBulletRects, this.enemyBullets.length, 8, 8, 0xff5533);
    this.enemyBulletRects.forEach((rect, i) => {
      const b = this.enemyBullets[i];
      if (b) {
        rect.setVisible(true);
        rect.setPosition(b.x - this.cameraX, b.y);
      } else {
        rect.setVisible(false);
      }
    });

    this.syncPool(this.enemyRects, this.enemies.length, 22, 30, 0xff9933);
    this.syncPool(this.telegraphRects, this.enemies.length, 30, 38, 0);
    this.enemies.forEach((e, i) => {
      const rect = this.enemyRects[i];
      const tele = this.telegraphRects[i];
      const w = enemyWidth(e);
      const hh = enemyHeight(e);
      rect.setSize(w, hh);
      rect.setPosition(e.x - this.cameraX, e.y);
      rect.setFillStyle(enemyColor(e.kind));
      tele.setSize(w + 8, hh + 8);
      tele.setPosition(e.x - this.cameraX - 4, e.y - 4);
      tele.setVisible(e.telegraphing);
      if (e.telegraphing) {
        tele.setAlpha(0.5 + 0.5 * Math.sin(performance.now() / 60));
      }
    });

    const visiblePickups = this.pickups.filter((p) => !p.collected);
    this.syncPool(this.pickupRects, visiblePickups.length, 18, 18, 0x33ddff);
    this.syncTextPool(this.pickupLabels, visiblePickups.length);
    visiblePickups.forEach((p, i) => {
      const rect = this.pickupRects[i];
      const label = this.pickupLabels[i];
      rect.setPosition(p.x - this.cameraX, p.y);
      label.setPosition(p.x - this.cameraX + 9, p.y + 9);
      label.setText(pickupLetter(p.weapon));
    });

    const bossDef = getBossDef(this.level.boss.id);
    if (this.boss.active && isBossAlive(this.boss)) {
      this.bossRect?.setVisible(true);
      this.bossRect?.setSize(bossDef.width, bossDef.height);
      this.bossRect?.setPosition(this.boss.x - this.cameraX, this.boss.y);
      this.bossRect?.setFillStyle(this.boss.vulnerable ? 0xddaa44 : 0x884422);
      this.bossTeleRect?.setVisible(this.boss.telegraphing);
      this.bossTeleRect?.setSize(bossDef.width + 8, bossDef.height + 8);
      this.bossTeleRect?.setPosition(this.boss.x - this.cameraX - 4, this.boss.y - 4);
    } else {
      this.bossRect?.setVisible(false);
      this.bossTeleRect?.setVisible(false);
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

  private syncPool(pool: Phaser.GameObjects.Rectangle[], count: number, w: number, h: number, color: number): void {
    while (pool.length < count) {
      const r = this.add.rectangle(0, 0, w, h, color);
      r.setOrigin(0, 0);
      pool.push(r);
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

function enemyColor(kind: string): number {
  if (kind === 'sentry') {
    return 0xbb55ff;
  }
  if (kind === 'drone') {
    return 0x55bbff;
  }
  if (kind === 'grenadier') {
    return 0xffaa33;
  }
  return 0xff9933;
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
