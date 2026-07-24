import { type EnemyKind } from '../balance/enemies';
import { type BossId } from '../balance/bosses';
import { type WeaponId } from '../balance/weapons';

/**
 * Data-driven level format (ARCHITECTURE.md section 6).
 *
 * Levels are plain data so they can be validated, tested, and authored without
 * scene code. Coordinates are in logical pixels with y-down.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CheckpointDef {
  id: string;
  x: number;
  y: number;
}

export interface LevelTriggerDef {
  id: string;
  x0: number;
  x1: number;
  spawns: { kind: EnemyKind; x: number; y: number }[];
}

export interface LevelPickupDef {
  id: string;
  x: number;
  y: number;
  weapon: WeaponId;
}

export interface BossArenaDef {
  id: BossId;
  /** Horizontal region; entering it (once) activates the boss. */
  x0: number;
  x1: number;
  spawnX: number;
}

export interface MovingPlatformDef {
  id: string;
  /** Top-left origin of the platform at its minimum extent. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Axis of travel. */
  axis: 'x' | 'y';
  /** Minimum and maximum top-left coordinate along the axis. */
  min: number;
  max: number;
  /** Travel speed (px/s). */
  speed: number;
}

export interface DoorDef {
  id: string;
  /** Solid body when closed. */
  rect: Rect;
  /** World region; while the player overlaps it the door is open (passable). */
  openTrigger: Rect;
}

/** A destructible crate: solid until destroyed by player fire, then passable. */
export interface ContainerDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Hits required to destroy. */
  health: number;
  /** Score awarded on destruction. */
  scoreValue: number;
}

export interface LevelDef {
  id: string;
  name: string;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  solids: Rect[];
  oneWays: Rect[];
  hazards: Rect[];
  checkpoints: CheckpointDef[];
  triggers: LevelTriggerDef[];
  pickups: LevelPickupDef[];
  movingPlatforms: MovingPlatformDef[];
  doors: DoorDef[];
  containers: ContainerDef[];
  boss: BossArenaDef;
  /** World x the player must reach (with the boss dead) to complete the level. */
  completionX: number;
}

export interface LevelValidationIssue {
  path: string;
  message: string;
}
