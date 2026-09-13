/**
 * Checkpoint snapshot, restore, and last-reached tracking.
 *
 * A checkpoint stores the resume state (level id, checkpoint id, lives, score,
 * weapon, spawn position). Snapshots are immutable value objects; restore
 * returns a fresh copy so callers cannot mutate the stored checkpoint. The
 * level scene also tracks the *last reached* checkpoint by overlapping the
 * player with checkpoint markers (PROJECT.md, Player abilities).
 */

import { type WeaponId } from '../balance/weapons';
import { type CheckpointDef } from '../levels/levelSchema';

export interface CheckpointData {
  levelId: string;
  checkpointId: string;
  lives: number;
  score: number;
  weapon: WeaponId;
  spawnX: number;
  spawnY: number;
}

/** Returns an independent copy of the checkpoint data. */
export function snapshotCheckpoint(data: CheckpointData): CheckpointData {
  return { ...data };
}

/** Returns a fresh copy to restore from, leaving the stored snapshot intact. */
export function restoreCheckpoint(data: CheckpointData): CheckpointData {
  return { ...data };
}

/**
 * Returns the id of the checkpoint the player currently overlaps, preferring
 * the furthest-along checkpoint when several overlap, or null if none.
 */
export function checkpointAt(
  checkpoints: readonly CheckpointDef[],
  playerX: number,
  playerY: number,
  playerW: number,
  playerH: number
): string | null {
  let found: string | null = null;
  for (const c of checkpoints) {
    const overlaps =
      playerX < c.x + 24 &&
      playerX + playerW > c.x - 24 &&
      playerY < c.y + 48 &&
      playerY + playerH > c.y - 48;
    if (overlaps) {
      found = c.id;
    }
  }
  return found;
}

/**
 * Advances the last-reached checkpoint id when the player touches a checkpoint
 * further along the level. Checkpoint order is the array order in the level
 * definition.
 */
export function advanceCheckpoint(
  checkpoints: readonly CheckpointDef[],
  currentId: string,
  playerX: number,
  playerY: number,
  playerW: number,
  playerH: number
): string {
  const touched = checkpointAt(checkpoints, playerX, playerY, playerW, playerH);
  if (touched === null) {
    return currentId;
  }
  const currentIndex = checkpoints.findIndex((c) => c.id === currentId);
  const touchedIndex = checkpoints.findIndex((c) => c.id === touched);
  return touchedIndex > currentIndex ? touched : currentId;
}

/** Resolves a checkpoint id to its definition (falls back to the first). */
export function resolveCheckpoint(checkpoints: readonly CheckpointDef[], id: string): CheckpointDef {
  return checkpoints.find((c) => c.id === id) ?? checkpoints[0];
}
