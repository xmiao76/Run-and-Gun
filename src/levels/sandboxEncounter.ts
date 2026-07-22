import { GROUND_Y } from '../balance/player';
import { type Pickup } from '../simulation/pickups';
import { createPickup } from '../simulation/pickups';
import { createSpawnTrigger, type SpawnTrigger } from '../simulation/spawnTriggers';

/**
 * M2 sandbox encounter data: one weapon pickup and one spawn trigger that
 * introduces the Runner and Sentry ahead of the player. Coordinates are tuned
 * so the player collects the pickup first, then crosses the trigger.
 */

const PICKUP_Y = GROUND_Y - 24;
const ENEMY_Y = GROUND_Y - 30;

export function createSandboxPickups(): Pickup[] {
  return [createPickup('sandbox-scatter', 150, PICKUP_Y, 'scatter')];
}

export function createSandboxTriggers(): SpawnTrigger[] {
  return [
    createSpawnTrigger('sandbox-intro', 400, 460, [
      { kind: 'runner', x: 600, y: ENEMY_Y },
      { kind: 'sentry', x: 700, y: ENEMY_Y }
    ])
  ];
}

/** Maximum simultaneously active regular enemies in the sandbox. */
export const SANDBOX_MAX_ENEMIES = 8;
