import { type WeaponId } from '../balance/weapons';

/**
 * Weapon pickups and collection. Pure AABB overlap against the player body;
 * collecting a pickup yields the weapon it carries so the scene can switch the
 * active weapon and communicate the result.
 */

export interface Pickup {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  weapon: WeaponId;
  collected: boolean;
}

export function createPickup(id: string, x: number, y: number, weapon: WeaponId): Pickup {
  return { id, x, y, width: 18, height: 18, weapon, collected: false };
}

function overlaps(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export interface CollectionResult {
  pickups: Pickup[];
  /** Pickups collected this step, in encounter order. */
  collected: Pickup[];
}

/** Returns the updated pickup list and whichever pickups the player touched. */
export function collectPickups(
  pickups: readonly Pickup[],
  playerX: number,
  playerY: number,
  playerW: number,
  playerH: number
): CollectionResult {
  const collected: Pickup[] = [];
  const next = pickups.map((p): Pickup => {
    if (p.collected) {
      return p;
    }
    if (overlaps(playerX, playerY, playerW, playerH, p.x, p.y, p.width, p.height)) {
      collected.push(p);
      return { ...p, collected: true };
    }
    return p;
  });
  return { pickups: next, collected };
}
