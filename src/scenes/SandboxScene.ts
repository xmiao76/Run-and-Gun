import Phaser from 'phaser';
import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  DEATH_FALL_Y,
  GROUND_Y,
  INVULN_DURATION,
  MAX_LIVES,
  PIT_X0,
  PIT_X1,
  PLAYER_HEIGHT,
  PLAYER_WIDTH,
  SPAWN_X,
  SPAWN_Y
} from '../balance/player';
import { DEFAULT_WEAPON, getWeapon, type WeaponId } from '../balance/weapons';
import {
  clearRuntime,
  getDebugInput,
  registerCommand,
  reportRuntime,
  reportScene
} from '../debug/debugBridge';
import { createKeyboardInput, type KeyboardInput } from '../input/KeyboardInput';
import { createNeutralInput, mergeInput, type InputState } from '../input/InputState';
import {
  createSandboxPickups,
  createSandboxTriggers,
  SANDBOX_MAX_ENEMIES
} from '../levels/sandboxEncounter';
import { applyDamage, createHealthState, tickInvuln, type HealthState } from '../simulation/health';
import { createPlayerState, stepPlayer, type PlayerState } from '../simulation/player';
import {
  createWeaponState,
  stepProjectiles,
  stepWeapon,
  type Projectile,
  type WeaponState
} from '../simulation/weapons';
import { createClock, tick, FIXED_DT, type ClockState } from '../simulation/clock';
import {
  restoreCheckpoint,
  snapshotCheckpoint,
  type CheckpointData
} from '../simulation/checkpoints';
import {
  createDamageLedger,
  clearLedger,
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
import { collectPickups, type Pickup } from '../simulation/pickups';
import { updateSpawnTriggers, type SpawnTrigger } from '../simulation/spawnTriggers';
import { GAME_VERSION, LOGICAL_HEIGHT, LOGICAL_WIDTH, SCENE_KEYS } from '../app/config';
import { ensureGameTextures, SKY_TEXTURE } from '../art/textures';
import { hookShutdown } from './sceneLifecycle';

const HUD_Y = 20;
const MAX_PROJECTILES = 64;
const GUN_OFFSET_X = PLAYER_WIDTH;
const GUN_OFFSET_Y = 12;
const ENEMY_PROJECTILE_W = 8;
const ENEMY_PROJECTILE_H = 8;
/** Milliseconds per leg-swap in the player run cycle. */
const RUN_FRAME_MS = 140;

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
}

/**
 * Prototype room: a small playable arena that establishes the game's visual
 * direction with original pixel-art sprites and a layered jungle-war backdrop
 * instead of placeholder blocks.
 *
 * Extends the M1 arena with data-driven enemies (Runner + Sentry), weapon
 * pickups, spawn triggers, enemy projectiles, and a per-step damage ledger so
 * each attack (including every scatter pellet) hits a target at most once per
 * step. All rules live in pure simulation modules; this scene only wires them
 * into the fixed 60 Hz loop and renders the result with the sprite sheet from
 * art/sprites.ts.
 */
export class SandboxScene extends Phaser.Scene {
  private player: PlayerState = createPlayerState(SPAWN_X, SPAWN_Y);
  private weapon: WeaponState = createWeaponState(DEFAULT_WEAPON);
  private health: HealthState = createHealthState(MAX_LIVES);
  private playerBullets: PlayerBullet[] = [];
  private enemyBullets: EnemyBullet[] = [];
  private enemies: EnemyState[] = [];
  private pickups: Pickup[] = [];
  private triggers: SpawnTrigger[] = [];
  private ledger: DamageLedger = createDamageLedger();
  private nextId = 1;
  private clock: ClockState = createClock();
  private stepInput: InputState = createNeutralInput();
  private keyboard: KeyboardInput = createKeyboardInput();
  private checkpoint: CheckpointData = {
    levelId: 'sandbox',
    checkpointId: 'start',
    lives: MAX_LIVES,
    score: 0,
    weapon: DEFAULT_WEAPON,
    spawnX: SPAWN_X,
    spawnY: SPAWN_Y
  };
  private score = 0;

  private playerImage?: Phaser.GameObjects.Image;
  private playerFacing = 1;
  private animTimeMs = 0;
  private playerBulletImages: Phaser.GameObjects.Image[] = [];
  private enemyBulletImages: Phaser.GameObjects.Image[] = [];
  private enemyImages: Phaser.GameObjects.Image[] = [];
  private enemyTelegraphRects: Phaser.GameObjects.Rectangle[] = [];
  private pickupImages: Phaser.GameObjects.Image[] = [];
  private pickupLabels: Phaser.GameObjects.Text[] = [];
  private hudText?: Phaser.GameObjects.Text;
  private overlayText?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.sandbox);
  }

  public create(): void {
    reportScene(SCENE_KEYS.sandbox);
    ensureGameTextures(this);
    this.resetRun();
    this.buildEnvironment();
    this.playerImage = this.add.image(0, 0, 'art/player-idle').setOrigin(0, 0).setDepth(30);
    this.hudText = this.add.text(12, HUD_Y, '', { fontFamily: 'monospace', fontSize: '16px', color: '#e8f1ff' }).setDepth(100);
    this.add
      .text(12, LOGICAL_HEIGHT - 22, 'Move: A/D or arrows  Jump: Space/W/Up  Fire: J/K/Enter', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#8fa3c7'
      })
      .setOrigin(0, 0.5)
      .setDepth(100);
    this.keyboard.attach(window);
    this.registerDebugCommands();
    hookShutdown(this.events, () => this.shutdown());
    this.publishRuntime();
  }

  public shutdown(): void {
    this.keyboard.detach(window);
    clearRuntime();
  }

  public override update(_time: number, deltaMs: number): void {
    const result = tick(this.clock, deltaMs / 1000);
    this.clock.accumulator = result.accumulator;
    for (let i = 0; i < result.steps; i++) {
      this.stepOnce();
    }
    this.animTimeMs += deltaMs;
    this.render();
  }

  private makeId(prefix: string): string {
    const id = prefix + this.nextId;
    this.nextId += 1;
    return id;
  }

  private stepOnce(): void {
    const debug = this.readDebugInput();
    this.stepInput = mergeInput(this.keyboard.build(this.stepInput), debug);

    if (this.health.gameOver) {
      this.clearPressedEdges();
      return;
    }

    this.health = tickInvuln(this.health, FIXED_DT);

    const playerResult = stepPlayer(this.player, this.stepInput, FIXED_DT);
    this.player = playerResult.player;

    this.stepPlayerFiring();
    this.stepTriggers();
    this.stepEnemies();
    this.stepEnemyBullets();
    this.resolvePlayerBulletsVsEnemies();
    this.resolveEnemyBulletsVsPlayer();
    this.resolvePickups();

    this.playerBullets = this.cullBullets(this.playerBullets);
    this.enemyBullets = this.cullEnemyBullets(this.enemyBullets);
    this.enemies = this.enemies.filter((e) => isAlive(e) && e.x > -64 && e.x < ARENA_WIDTH + 64);

    if (this.player.y > DEATH_FALL_Y) {
      this.handleDeath();
    }

    clearLedger(this.ledger);
    this.clearPressedEdges();
    this.publishRuntime();
  }

  private stepPlayerFiring(): void {
    const fireResult = stepWeapon(this.weapon, FIXED_DT, { pressed: this.stepInput.firePressed, held: this.stepInput.fireHeld });
    this.weapon = fireResult.weapon;
    if (fireResult.projectiles.length > 0) {
      const spawned = fireResult.projectiles.map((p): PlayerBullet => ({
        ...p,
        id: this.makeId('pb'),
        x: this.player.x + GUN_OFFSET_X,
        y: this.player.y + GUN_OFFSET_Y
      }));
      this.playerBullets = this.playerBullets.concat(spawned).slice(-MAX_PROJECTILES);
    }
    this.playerBullets = stepProjectiles(this.playerBullets, FIXED_DT);
  }

  private stepTriggers(): void {
    const update = updateSpawnTriggers(
      this.triggers,
      this.player.x,
      this.player.y,
      this.enemies.length,
      SANDBOX_MAX_ENEMIES
    );
    this.triggers = update.triggers;
    for (const spec of update.spawned) {
      if (this.enemies.length >= SANDBOX_MAX_ENEMIES) {
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
        ttl: 2.4,
        damage: intent.damage
      });
    }
  }

  private stepEnemyBullets(): void {
    this.enemyBullets = this.enemyBullets
      .map((b): EnemyBullet => ({ ...b, x: b.x + b.vx * FIXED_DT, y: b.y + b.vy * FIXED_DT, ttl: b.ttl - FIXED_DT }))
      .filter((b) => b.ttl > 0);
  }

  private resolvePlayerBulletsVsEnemies(): void {
    const surviving: PlayerBullet[] = [];
    for (const bullet of this.playerBullets) {
      let consumed = false;
      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        if (!isAlive(enemy)) {
          continue;
        }
        if (!this.bulletHitsEnemy(bullet, enemy)) {
          continue;
        }
        if (!recordHit(this.ledger, bullet.id, enemy.id)) {
          continue;
        }
        this.enemies[i] = damageEnemy(enemy, bullet.damage);
        if (!isAlive(this.enemies[i])) {
          this.score += this.scoreFor(enemy.kind);
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

  private resolveEnemyBulletsVsPlayer(): void {
    const surviving: EnemyBullet[] = [];
    for (const bullet of this.enemyBullets) {
      const overlaps =
        bullet.x < this.player.x + PLAYER_WIDTH &&
        bullet.x + ENEMY_PROJECTILE_W > this.player.x &&
        bullet.y < this.player.y + PLAYER_HEIGHT &&
        bullet.y + ENEMY_PROJECTILE_H > this.player.y;
      if (overlaps && recordHit(this.ledger, bullet.id, 'player')) {
        const damage = applyDamage(this.health, INVULN_DURATION);
        this.health = damage.health;
      } else {
        surviving.push(bullet);
      }
    }
    this.enemyBullets = surviving;
  }

  private resolvePickups(): void {
    const result = collectPickups(this.pickups, this.player.x, this.player.y, PLAYER_WIDTH, PLAYER_HEIGHT);
    this.pickups = result.pickups;
    for (const pickup of result.collected) {
      this.weapon = createWeaponState(pickup.weapon);
    }
  }

  private bulletHitsEnemy(bullet: PlayerBullet, enemy: EnemyState): boolean {
    const w = 8;
    const h = 4;
    const eW = enemyWidth(enemy);
    const eH = enemyHeight(enemy);
    return (
      bullet.x < enemy.x + eW &&
      bullet.x + w > enemy.x &&
      bullet.y < enemy.y + eH &&
      bullet.y + h > enemy.y
    );
  }

  private scoreFor(kind: string): number {
    return kind === 'sentry' ? 150 : 100;
  }

  private cullBullets(bullets: PlayerBullet[]): PlayerBullet[] {
    return bullets.filter(
      (p) => p.x > -32 && p.x < ARENA_WIDTH + 32 && p.y > -32 && p.y < ARENA_HEIGHT + 32
    );
  }

  private cullEnemyBullets(bullets: EnemyBullet[]): EnemyBullet[] {
    return bullets.filter(
      (b) => b.x > -32 && b.x < ARENA_WIDTH + 32 && b.y > -32 && b.y < ARENA_HEIGHT + 32
    );
  }

  private handleDeath(): void {
    const damage = applyDamage(this.health, INVULN_DURATION);
    this.health = damage.health;
    if (this.health.gameOver) {
      return;
    }
    const snap = restoreCheckpoint(this.checkpoint);
    this.player = createPlayerState(snap.spawnX, snap.spawnY);
    this.weapon = createWeaponState(snap.weapon);
    this.playerBullets = [];
    this.enemyBullets = [];
  }

  private applyExternalHit(): { ok: boolean; lives: number; gameOver: boolean; applied: boolean } {
    const damage = applyDamage(this.health, INVULN_DURATION);
    this.health = damage.health;
    if (damage.applied && !this.health.gameOver) {
      const snap = restoreCheckpoint(this.checkpoint);
      this.player = createPlayerState(snap.spawnX, snap.spawnY);
      this.weapon = createWeaponState(snap.weapon);
      this.playerBullets = [];
      this.enemyBullets = [];
    }
    this.publishRuntime();
    return { ok: true, lives: this.health.lives, gameOver: this.health.gameOver, applied: damage.applied };
  }

  private spawnEnemyAt(payload: unknown): { ok: boolean; id?: string; error?: string } {
    const p = payload as { kind?: string; x?: number } | undefined;
    const kind = p?.kind === 'sentry' ? 'sentry' : 'runner';
    const x = typeof p?.x === 'number' ? p.x : this.player.x + 60;
    if (this.enemies.length >= SANDBOX_MAX_ENEMIES) {
      return { ok: false, error: 'enemy cap reached' };
    }
    const id = this.makeId('en');
    this.enemies.push(createEnemyState(id, kind, x, GROUND_Y - 30));
    this.publishRuntime();
    return { ok: true, id };
  }

  private resetRun(): void {
    this.player = createPlayerState(SPAWN_X, SPAWN_Y);
    this.weapon = createWeaponState(DEFAULT_WEAPON);
    this.health = createHealthState(MAX_LIVES);
    this.playerBullets = [];
    this.enemyBullets = [];
    this.enemies = [];
    this.pickups = createSandboxPickups();
    this.triggers = createSandboxTriggers();
    this.ledger = createDamageLedger();
    this.nextId = 1;
    this.clock = createClock();
    this.stepInput = createNeutralInput();
    this.score = 0;
    this.checkpoint = snapshotCheckpoint({
      levelId: 'sandbox',
      checkpointId: 'start',
      lives: MAX_LIVES,
      score: 0,
      weapon: DEFAULT_WEAPON,
      spawnX: SPAWN_X,
      spawnY: SPAWN_Y
    });
  }

  private registerDebugCommands(): void {
    registerCommand('damagePlayer', () => this.applyExternalHit());
    registerCommand('spawnEnemyAt', (payload) => this.spawnEnemyAt(payload));
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
      firePressed: d.firePressed
    };
    d.jumpPressed = false;
    d.firePressed = false;
    return snapshot;
  }

  private clearPressedEdges(): void {
    this.stepInput = { ...this.stepInput, jumpPressed: false, firePressed: false };
  }

  private publishRuntime(): void {
    reportRuntime({
      playerX: Math.round(this.player.x * 100) / 100,
      playerY: Math.round(this.player.y * 100) / 100,
      grounded: this.player.grounded,
      lives: this.health.lives,
      invuln: this.health.invuln > 0,
      invulnRemaining: Math.round(this.health.invuln * 1000) / 1000,
      weapon: this.weapon.id,
      projectileCount: this.playerBullets.length,
      enemyProjectileCount: this.enemyBullets.length,
      enemyCount: this.enemies.length,
      pickupCount: this.pickups.filter((p) => !p.collected).length,
      enemies: this.enemies.map((e) => ({ id: e.id, kind: e.kind, state: e.state, x: Math.round(e.x), telegraphing: e.telegraphing })),
      pickups: this.pickups.filter((p) => !p.collected).map((p) => ({ id: p.id, weapon: p.weapon, x: Math.round(p.x) })),
      checkpoint: this.checkpoint.checkpointId,
      score: this.score,
      gameOver: this.health.gameOver
    });
  }

  /**
   * Builds the layered jungle-war backdrop: dusk sky gradient, silhouette
   * ridge, ruins and dead trees on the horizon, textured ground tiles, props,
   * and the lethal pit rendered as a dark void with hazard-striped rims.
   */
  private buildEnvironment(): void {
    // Sky gradient, stretched across the whole arena, with a star field above.
    this.add
      .image(0, 0, SKY_TEXTURE)
      .setOrigin(0, 0)
      .setDisplaySize(LOGICAL_WIDTH, LOGICAL_HEIGHT)
      .setDepth(-100);
    this.add
      .tileSprite(0, 0, LOGICAL_WIDTH, 300, 'art/bg-stars')
      .setOrigin(0, 0)
      .setAlpha(0.8)
      .setDepth(-95);

    // Distant canopy ridge, scaled up so it reads as a far tree line.
    this.add
      .tileSprite(0, GROUND_Y - 60, LOGICAL_WIDTH, 60, 'art/bg-ridge')
      .setOrigin(0, 0)
      .setTileScale(3, 3)
      .setDepth(-90);

    // Horizon silhouettes: ruined structures and dead jungle trees.
    const horizonProps: readonly { key: string; x: number; scale: number }[] = [
      { key: 'art/bg-tree', x: 150, scale: 3 },
      { key: 'art/bg-ruin', x: 300, scale: 3 },
      { key: 'art/bg-tree', x: 505, scale: 2.5 },
      { key: 'art/bg-ruin', x: 640, scale: 2.5 },
      { key: 'art/bg-tree', x: 860, scale: 3 }
    ];
    for (const prop of horizonProps) {
      this.add
        .image(prop.x, GROUND_Y, prop.key)
        .setOrigin(0, 1)
        .setScale(prop.scale)
        .setDepth(-80);
    }

    // Textured ground spanning the safe span left of the pit.
    this.add
      .tileSprite(0, GROUND_Y, PIT_X0, LOGICAL_HEIGHT - GROUND_Y, 'art/tile-ground')
      .setOrigin(0, 0)
      .setDepth(-60);

    // The pit: a dark void, its rims marked with hazard stripes.
    this.add
      .rectangle((PIT_X0 + ARENA_WIDTH) / 2, GROUND_Y, ARENA_WIDTH - PIT_X0, LOGICAL_HEIGHT - GROUND_Y, 0x05070c)
      .setOrigin(0.5, 0)
      .setDepth(-59);
    this.add
      .tileSprite(PIT_X0 - 16, GROUND_Y, 16, 8, 'art/tile-hazard')
      .setOrigin(0, 0)
      .setDepth(-55);
    if (PIT_X1 < ARENA_WIDTH) {
      this.add
        .tileSprite(PIT_X1, GROUND_Y, 16, 8, 'art/tile-hazard')
        .setOrigin(0, 0)
        .setDepth(-55);
    }

    // Foreground props on the ground plane, behind the combatants.
    const groundProps: readonly { key: string; x: number; scale: number }[] = [
      { key: 'art/prop-bush', x: 230, scale: 2 },
      { key: 'art/prop-rock', x: 470, scale: 2 },
      { key: 'art/prop-bush', x: 660, scale: 1.5 }
    ];
    for (const prop of groundProps) {
      this.add
        .image(prop.x, GROUND_Y + 1, prop.key)
        .setOrigin(0, 1)
        .setScale(prop.scale)
        .setDepth(-70);
    }
  }

  private render(): void {
    if (!this.playerImage || !this.hudText) {
      return;
    }
    this.renderPlayer();
    this.renderPlayerBullets();
    this.renderEnemyBullets();
    this.renderEnemies();
    this.renderPickups();

    const def = getWeapon(this.weapon.id);
    this.hudText.setText(
      'LIVES ' + this.health.lives + '   ' + def.name.toUpperCase() + '   SCORE ' + this.score + '   v' + GAME_VERSION
    );

    if (this.health.gameOver) {
      this.showOverlay('GAME OVER');
    } else {
      this.hideOverlay();
    }
  }

  /**
   * Drives the player sprite: pose (idle / run cycle / jump) from the physics
   * state, horizontal flip from the last nonzero movement direction, and an
   * alpha blink while post-respawn invulnerability is active.
   */
  private renderPlayer(): void {
    const image = this.playerImage;
    if (!image) {
      return;
    }
    if (this.player.vx > 1) {
      this.playerFacing = 1;
    } else if (this.player.vx < -1) {
      this.playerFacing = -1;
    }
    let key = 'art/player-idle';
    if (!this.player.grounded) {
      key = 'art/player-jump';
    } else if (Math.abs(this.player.vx) > 1) {
      key = Math.floor(this.animTimeMs / RUN_FRAME_MS) % 2 === 0 ? 'art/player-run-a' : 'art/player-run-b';
    }
    image.setTexture(key);
    image.setFlipX(this.playerFacing < 0);
    image.setPosition(this.player.x, this.player.y);
    image.setAlpha(this.health.invuln > 0 ? 0.55 : 1);
  }

  private renderPlayerBullets(): void {
    this.syncImagePool(this.playerBulletImages, this.playerBullets.length, 'art/bullet-player', 0);
    for (let i = 0; i < this.playerBulletImages.length; i++) {
      const image = this.playerBulletImages[i];
      const b = this.playerBullets[i];
      if (b) {
        image.setVisible(true);
        image.setPosition(b.x, b.y);
      } else {
        image.setVisible(false);
      }
    }
  }

  private renderEnemyBullets(): void {
    this.syncImagePool(this.enemyBulletImages, this.enemyBullets.length, 'art/bullet-enemy', 0);
    for (let i = 0; i < this.enemyBulletImages.length; i++) {
      const image = this.enemyBulletImages[i];
      const b = this.enemyBullets[i];
      if (b) {
        image.setVisible(true);
        image.setPosition(b.x, b.y);
      } else {
        image.setVisible(false);
      }
    }
  }

  private renderEnemies(): void {
    this.syncImagePool(this.enemyImages, this.enemies.length, 'art/enemy-runner', 10);
    this.syncTelegraphPool(this.enemyTelegraphRects, this.enemies.length);
    for (let i = 0; i < this.enemyImages.length; i++) {
      const image = this.enemyImages[i];
      const tele = this.enemyTelegraphRects[i];
      const e = this.enemies[i];
      if (!e) {
        image.setVisible(false);
        tele.setVisible(false);
        continue;
      }
      image.setVisible(true);
      image.setTexture(e.kind === 'sentry' ? 'art/enemy-sentry' : 'art/enemy-runner');
      // Sprites are authored facing left; flip when the enemy faces right.
      image.setFlipX(e.facing > 0);
      image.setPosition(e.x, e.y);
      const w = enemyWidth(e);
      const h = enemyHeight(e);
      // Readable telegraph: a flashing outline while the enemy winds up.
      tele.setPosition(e.x - 4, e.y - 4);
      tele.setSize(w + 8, h + 8);
      tele.setVisible(e.telegraphing);
      if (e.telegraphing) {
        tele.setStrokeStyle(2, 0xffff66);
        tele.setAlpha(0.5 + 0.5 * Math.sin(performance.now() / 60));
      }
    }
  }

  private renderPickups(): void {
    const visible = this.pickups.filter((p) => !p.collected);
    this.syncImagePool(this.pickupImages, visible.length, 'art/pickup-crate', -40);
    this.syncTextPool(this.pickupLabels, visible.length);
    for (let i = 0; i < this.pickupImages.length; i++) {
      const image = this.pickupImages[i];
      const label = this.pickupLabels[i];
      const p = visible[i];
      if (!p) {
        image.setVisible(false);
        label.setVisible(false);
        continue;
      }
      image.setVisible(true);
      image.setPosition(p.x, p.y);
      label.setVisible(true);
      label.setPosition(p.x + 9, p.y + 9);
      label.setText(pickupLetter(p.weapon));
      label.setDepth(-35);
    }
  }

  private syncImagePool(
    pool: Phaser.GameObjects.Image[],
    count: number,
    key: string,
    depth: number
  ): void {
    while (pool.length < count) {
      const image = this.add.image(0, 0, key);
      image.setOrigin(0, 0);
      image.setDepth(depth);
      pool.push(image);
    }
  }

  /** Telegraph overlays are stroke-only outlines: no fill, so they never hide the sprite beneath. */
  private syncTelegraphPool(pool: Phaser.GameObjects.Rectangle[], count: number): void {
    while (pool.length < count) {
      const r = this.add.rectangle(0, 0, 28, 38);
      r.setOrigin(0, 0);
      r.setDepth(20);
      pool.push(r);
    }
  }

  private syncTextPool(pool: Phaser.GameObjects.Text[], count: number): void {
    while (pool.length < count) {
      const t = this.add.text(0, 0, '', { fontFamily: 'monospace', fontSize: '12px', color: '#06222b' });
      t.setOrigin(0.5, 0.5);
      pool.push(t);
    }
  }

  private showOverlay(message: string): void {
    if (!this.overlayText) {
      this.overlayText = this.add
        .text(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, message, {
          fontFamily: 'monospace',
          fontSize: '40px',
          color: '#ff7777'
        })
        .setOrigin(0.5);
    } else {
      this.overlayText.setText(message);
      this.overlayText.setVisible(true);
    }
  }

  private hideOverlay(): void {
    if (this.overlayText) {
      this.overlayText.setVisible(false);
    }
  }
}

function enemyWidth(enemy: EnemyState): number {
  return enemy.kind === 'sentry' ? 24 : 20;
}

function enemyHeight(enemy: EnemyState): number {
  return enemy.kind === 'sentry' ? 24 : 30;
}

function pickupLetter(weapon: WeaponId): string {
  if (weapon === 'scatter') {
    return 'S';
  }
  if (weapon === 'rapid') {
    return 'R';
  }
  return 'P';
}
