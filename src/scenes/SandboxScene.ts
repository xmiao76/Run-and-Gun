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
import { GAME_VERSION, LOGICAL_HEIGHT, SCENE_KEYS } from '../app/config';

const HUD_Y = 20;
const MAX_PROJECTILES = 64;
const GUN_OFFSET_X = PLAYER_WIDTH;
const GUN_OFFSET_Y = 12;
const ENEMY_PROJECTILE_W = 8;
const ENEMY_PROJECTILE_H = 8;

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
 * M2 deterministic mechanics sandbox.
 *
 * Extends the M1 arena with data-driven enemies (Runner + Sentry), weapon
 * pickups, spawn triggers, enemy projectiles, and a per-step damage ledger so
 * each attack (including every scatter pellet) hits a target at most once per
 * step. All rules live in pure simulation modules; this scene only wires them
 * into the fixed 60 Hz loop and renders the result.
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

  private groundRect?: Phaser.GameObjects.Rectangle;
  private pitRect?: Phaser.GameObjects.Rectangle;
  private playerRect?: Phaser.GameObjects.Rectangle;
  private playerBulletRects: Phaser.GameObjects.Rectangle[] = [];
  private enemyBulletRects: Phaser.GameObjects.Rectangle[] = [];
  private enemyRects: Phaser.GameObjects.Rectangle[] = [];
  private enemyTelegraphRects: Phaser.GameObjects.Rectangle[] = [];
  private pickupRects: Phaser.GameObjects.Rectangle[] = [];
  private pickupLabels: Phaser.GameObjects.Text[] = [];
  private hudText?: Phaser.GameObjects.Text;
  private overlayText?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.sandbox);
  }

  public create(): void {
    reportScene(SCENE_KEYS.sandbox);
    this.resetRun();
    this.buildStaticVisuals();
    this.playerRect = this.add.rectangle(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT, 0x44dd66);
    this.playerRect.setOrigin(0, 0);
    this.hudText = this.add.text(12, HUD_Y, '', { fontFamily: 'monospace', fontSize: '16px', color: '#e8f1ff' });
    this.add
      .text(12, LOGICAL_HEIGHT - 22, 'Move: A/D or arrows  Jump: Space/W/Up  Fire: J/K/Enter', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#5c6c8c'
      })
      .setOrigin(0, 0.5);
    this.keyboard.attach(window);
    this.registerDebugCommands();
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
    const fireResult = stepWeapon(this.weapon, FIXED_DT, this.stepInput.firePressed);
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

  private buildStaticVisuals(): void {
    this.groundRect = this.add.rectangle(PIT_X0 / 2, GROUND_Y + 30, PIT_X0, 60, 0x243049);
    this.groundRect.setOrigin(0.5, 0);
    this.pitRect = this.add.rectangle((PIT_X0 + PIT_X1) / 2, GROUND_Y + 30, PIT_X1 - PIT_X0, 60, 0x3a1010);
    this.pitRect.setOrigin(0.5, 0);
    this.pitRect.setStrokeStyle(2, 0xff5555);
  }

  private render(): void {
    if (!this.playerRect || !this.hudText) {
      return;
    }
    this.playerRect.setPosition(this.player.x, this.player.y);
    this.playerRect.setFillStyle(this.health.invuln > 0 ? 0x99ff99 : 0x44dd66);
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

  private renderPlayerBullets(): void {
    this.syncRectPool(this.playerBulletRects, this.playerBullets.length, 8, 4, 0xffe066);
    for (let i = 0; i < this.playerBulletRects.length; i++) {
      const rect = this.playerBulletRects[i];
      const b = this.playerBullets[i];
      if (b) {
        rect.setVisible(true);
        rect.setPosition(b.x, b.y);
      } else {
        rect.setVisible(false);
      }
    }
  }

  private renderEnemyBullets(): void {
    this.syncRectPool(this.enemyBulletRects, this.enemyBullets.length, ENEMY_PROJECTILE_W, ENEMY_PROJECTILE_H, 0xff5533);
    for (let i = 0; i < this.enemyBulletRects.length; i++) {
      const rect = this.enemyBulletRects[i];
      const b = this.enemyBullets[i];
      if (b) {
        rect.setVisible(true);
        rect.setPosition(b.x, b.y);
      } else {
        rect.setVisible(false);
      }
    }
  }

  private renderEnemies(): void {
    this.syncRectPool(this.enemyRects, this.enemies.length, 20, 30, 0xff9933);
    this.syncRectPool(this.enemyTelegraphRects, this.enemies.length, 28, 38, 0);
    for (let i = 0; i < this.enemyRects.length; i++) {
      const rect = this.enemyRects[i];
      const tele = this.enemyTelegraphRects[i];
      const e = this.enemies[i];
      if (!e) {
        rect.setVisible(false);
        tele.setVisible(false);
        continue;
      }
      rect.setVisible(true);
      const w = enemyWidth(e);
      const h = enemyHeight(e);
      rect.setSize(w, h);
      rect.setFillStyle(e.kind === 'sentry' ? 0xbb55ff : 0xff9933);
      rect.setPosition(e.x, e.y);
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
    this.syncRectPool(this.pickupRects, visible.length, 18, 18, 0x33ddff);
    this.syncTextPool(this.pickupLabels, visible.length);
    for (let i = 0; i < this.pickupRects.length; i++) {
      const rect = this.pickupRects[i];
      const label = this.pickupLabels[i];
      const p = visible[i];
      if (!p) {
        rect.setVisible(false);
        label.setVisible(false);
        continue;
      }
      rect.setVisible(true);
      rect.setPosition(p.x, p.y);
      label.setVisible(true);
      label.setPosition(p.x + 9, p.y + 9);
      label.setText(pickupLetter(p.weapon));
    }
  }

  private syncRectPool(
    pool: Phaser.GameObjects.Rectangle[],
    count: number,
    w: number,
    h: number,
    color: number
  ): void {
    while (pool.length < count) {
      const r = this.add.rectangle(0, 0, w, h, color);
      r.setOrigin(0, 0);
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
