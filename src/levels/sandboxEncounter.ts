import { GROUND_Y } from '../balance/player';
import { type Pickup } from '../simulation/pickups';
import { createPickup } from '../simulation/pickups';
import { createSpawnTrigger, type SpawnTrigger } from '../simulation/spawnTriggers';

/**
 * Sandbox encounter data: one weapon pickup and one spawn trigger that
 * introduces the Runner, Sentry and Turret ahead of the player. Coordinates are tuned
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
      { kind: 'sentry', x: 700, y: ENEMY_Y },
      // The prototype room is where a new archetype gets exercised before a
      // level commits to it, so the Turret Emplacement lives here first.
      // Placement has three constraints: clear of the trigger band (400-460)
      // plus the 48px spawn-safety margin, or the spawn is refused; clear of
      // the Runner's approach lane (~640+), or it is drawn underneath it; and
      // inside its own 300px engage range of where the player comes to rest.
      { kind: 'turret', x: 550, y: GROUND_Y - 22 }
    ])
  ];
}

/** Maximum simultaneously active regular enemies in the sandbox. */
export const SANDBOX_MAX_ENEMIES = 8;
