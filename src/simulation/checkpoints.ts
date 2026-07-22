/**
 * Checkpoint snapshot and restore.
 *
 * A checkpoint stores the resume state (level id, checkpoint id, lives, score,
 * weapon, and spawn position). Snapshots are immutable value objects; restore
 * returns a fresh copy so callers cannot mutate the stored checkpoint.
 */

import type { WeaponId } from '../balance/weapons';

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
