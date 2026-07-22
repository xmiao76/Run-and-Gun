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
import { DEFAULT_WEAPON, getWeapon } from '../balance/weapons';
import {
  clearRuntime,
  getDebugInput,
  registerCommand,
  reportRuntime,
  reportScene
} from '../debug/debugBridge';
import { createKeyboardInput, type KeyboardInput } from '../input/KeyboardInput';
import { createNeutralInput, mergeInput, type InputState } from '../input/InputState';
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
import { GAME_VERSION, LOGICAL_HEIGHT, SCENE_KEYS } from '../app/config';

const HUD_Y = 20;
const MAX_PROJECTILES = 64;
const GUN_OFFSET_X = PLAYER_WIDTH;
const GUN_OFFSET_Y = 12;

/**
 * M1 deterministic mechanics sandbox.
 *
 * A small test arena that wires the pure simulation modules (player physics,
 * weapons, health, checkpoints) into a fixed 60 Hz loop driven by the
 * accumulator clock. Input comes from the keyboard and/or the debug bridge. It
 * exposes debug commands so automated tests can start the sandbox, synthesize
 * input, and inject a controlled hit to verify checkpoint respawn.
 */
export class SandboxScene extends Phaser.Scene {
  private player: PlayerState = createPlayerState(SPAWN_X, SPAWN_Y);
  private weapon: WeaponState = createWeaponState(DEFAULT_WEAPON);
  private health: HealthState = createHealthState(MAX_LIVES);
  private projectiles: Projectile[] = [];
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
  private projectileRects: Phaser.GameObjects.Rectangle[] = [];
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
    // Publish the spawn state immediately so tests can read it without waiting
    // for the first fixed step (the first frame delta may yield zero steps).
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

    const fireResult = stepWeapon(this.weapon, FIXED_DT, this.stepInput.firePressed);
    this.weapon = fireResult.weapon;
    if (fireResult.projectiles.length > 0) {
      const spawned = fireResult.projectiles.map((p): Projectile => ({
        ...p,
        x: this.player.x + GUN_OFFSET_X,
        y: this.player.y + GUN_OFFSET_Y
      }));
      this.projectiles = this.projectiles.concat(spawned).slice(-MAX_PROJECTILES);
    }
    this.projectiles = stepProjectiles(this.projectiles, FIXED_DT).filter(
      (p) => p.x > -32 && p.x < ARENA_WIDTH + 32 && p.y > -32 && p.y < ARENA_HEIGHT + 32
    );

    if (this.player.y > DEATH_FALL_Y) {
      this.handleDeath();
    }

    this.clearPressedEdges();
    this.publishRuntime();
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
    this.projectiles = [];
  }

  private applyExternalHit(): { ok: boolean; lives: number; gameOver: boolean; applied: boolean } {
    const damage = applyDamage(this.health, INVULN_DURATION);
    this.health = damage.health;
    if (damage.applied && !this.health.gameOver) {
      const snap = restoreCheckpoint(this.checkpoint);
      this.player = createPlayerState(snap.spawnX, snap.spawnY);
      this.weapon = createWeaponState(snap.weapon);
      this.projectiles = [];
    }
    this.publishRuntime();
    return { ok: true, lives: this.health.lives, gameOver: this.health.gameOver, applied: damage.applied };
  }

  private resetRun(): void {
    this.player = createPlayerState(SPAWN_X, SPAWN_Y);
    this.weapon = createWeaponState(DEFAULT_WEAPON);
    this.health = createHealthState(MAX_LIVES);
    this.projectiles = [];
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
      projectileCount: this.projectiles.length,
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

    while (this.projectileRects.length < this.projectiles.length) {
      const r = this.add.rectangle(0, 0, 8, 4, 0xffe066);
      r.setOrigin(0.5, 0.5);
      this.projectileRects.push(r);
    }
    for (let i = 0; i < this.projectileRects.length; i++) {
      const rect = this.projectileRects[i];
      const p = this.projectiles[i];
      if (p) {
        rect.setVisible(true);
        rect.setPosition(p.x, p.y);
      } else {
        rect.setVisible(false);
      }
    }

    const def = getWeapon(this.weapon.id);
    this.hudText.setText(
      `LIVES ${this.health.lives}   ${def.name.toUpperCase()}   SCORE ${this.score}   v${GAME_VERSION}`
    );

    if (this.health.gameOver) {
      this.showOverlay('GAME OVER');
    } else {
      this.hideOverlay();
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
