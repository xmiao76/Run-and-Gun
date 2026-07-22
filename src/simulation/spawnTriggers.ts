import { getEnemyDef, type EnemyKind } from '../balance/enemies';
import { isSpawnSafe } from './safeSpawn';

/**
 * Data-driven spawn triggers with active-enemy and spawn-safety enforcement.
 *
 * A trigger fires once when the player crosses its horizontal region. Each
 * requested spawn is admitted only if the global active-enemy cap allows it and
 * the point is safe relative to the player (E3, E4, E5). Trigger data is
 * immutable; the returned state carries the `triggered` flags.
 */

export interface SpawnSpec {
  kind: EnemyKind;
  x: number;
  y: number;
}

export interface SpawnTrigger {
  id: string;
  /** Inclusive horizontal region that arms the trigger. */
  x0: number;
  x1: number;
  spawns: readonly SpawnSpec[];
  triggered: boolean;
}

export function createSpawnTrigger(id: string, x0: number, x1: number, spawns: readonly SpawnSpec[]): SpawnTrigger {
  return { id, x0, x1, spawns, triggered: false };
}

export interface TriggerUpdate {
  triggers: SpawnTrigger[];
  /** Spawns admitted this step (already filtered by cap + safety). */
  spawned: SpawnSpec[];
}

export function updateSpawnTriggers(
  triggers: readonly SpawnTrigger[],
  playerX: number,
  playerY: number,
  activeEnemyCount: number,
  maxEnemies: number
): TriggerUpdate {
  const spawned: SpawnSpec[] = [];
  let active = activeEnemyCount;
  const next = triggers.map((t): SpawnTrigger => {
    if (t.triggered) {
      return t;
    }
    if (playerX < t.x0 || playerX > t.x1) {
      return t;
    }
    for (const spec of t.spawns) {
      if (active >= maxEnemies) {
        break;
      }
      const def = getEnemyDef(spec.kind);
      if (!isSpawnSafe({ x: spec.x, y: spec.y, width: def.width, height: def.height }, playerX, playerY)) {
        continue;
      }
      spawned.push(spec);
      active += 1;
    }
    return { ...t, triggered: true };
  });
  return { triggers: next, spawned };
}
