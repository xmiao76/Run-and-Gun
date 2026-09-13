import { type EnemyKind } from '../balance/enemies';
import { type BossId } from '../balance/bosses';
import { type WeaponId } from '../balance/weapons';

/**
 * Data-driven level format (PROJECT.md, Levels).
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

/**
 * A bridge span that gives way once the player puts weight on it.
 *
 * Authored as terrain rather than as an obstacle: it is solid ground until it
 * is triggered, so a level can route the critical path across one and make
 * crossing it a decision.
 */
export interface BridgeDef {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Seconds of weight on the span before it commits to failing. */
  triggerDelay: number;
  /** Seconds from committing to dropping - the window to get across. */
  collapseDelay: number;
}

/**
 * A neutral flying supply skiff: crosses the sky on a patrol lane and drops a
 * weapon pickup when destroyed by player fire. A neutral destructible object
 * (like containers), not an enemy archetype.
 */
export interface SupplyCarrierDef {
  id: string;
  /** Sky lane: world y of the carrier's top edge. */
  y: number;
  /** Patrol extents; wraps from toX back to fromX until destroyed. */
  fromX: number;
  toX: number;
  /** Travel speed (px/s) in +x. */
  speed: number;
  /** Existing weapon dropped on destruction. */
  weapon: WeaponId;
}

/**
 * Is this hazard rect lethal to touch?
 *
 * `hazards` carries two different things. A rect whose top sits ABOVE the ground
 * line (smaller y, since y grows downward) is a real floor hazard - a spike
 * strip - and kills on contact. A rect at or below the ground line is a
 * decorative pit marker: it paints the hazard stripes on a pit rim, and the
 * lethality of a pit comes from the fall threshold, not from the paint.
 *
 * The rule is here, once, because three places need to agree on it: the scene's
 * contact test, the AI pilot's "which strips must I jump" geometry, and the
 * level validator. It used to live only in the pilot, so the scene killed the
 * player on contact with pit paint and then reported the death as `hazard`
 * rather than `pit` (TASK-027).
 */
export function isLethalHazard(hazard: Rect, groundY: number): boolean {
  return hazard.y < groundY;
}

export interface LevelDef {
  id: string;
  name: string;
  width: number;
  height: number;
  spawn: { x: number; y: number };
  solids: Rect[];
  oneWays: Rect[];
  /**
   * Floor hazards AND decorative pit markers; `isLethalHazard` separates them.
   */
  hazards: Rect[];
  checkpoints: CheckpointDef[];
  triggers: LevelTriggerDef[];
  pickups: LevelPickupDef[];
  movingPlatforms: MovingPlatformDef[];
  doors: DoorDef[];
  containers: ContainerDef[];
  bridges?: BridgeDef[];
  /** Optional supply skiff patrols (loader-tolerant when absent). */
  supplyCarriers?: SupplyCarrierDef[];
  boss: BossArenaDef;
  /** World x the player must reach (with the boss dead) to complete the level. */
  completionX: number;
}

export interface LevelValidationIssue {
  path: string;
  message: string;
}
