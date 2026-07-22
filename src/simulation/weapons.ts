/**
 * Weapon firing rules and projectile descriptors.
 *
 * Pure and deterministic: `stepWeapon` is given the elapsed step time and the
 * (edge-triggered) fire intent and returns the next weapon state plus any newly
 * spawned projectiles. Cooldowns use simulation time, never frame counts.
 */

import { getWeapon, type WeaponDef, type WeaponId } from '../balance/weapons';

export interface WeaponState {
  id: WeaponId;
  /** Time remaining on the fire-rate cooldown (s). */
  cooldown: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Remaining lifetime (s). */
  ttl: number;
  damage: number;
  /** Identifier of the weapon that created it (for ownership / collisions). */
  weapon: WeaponId;
}

export interface FireResult {
  weapon: WeaponState;
  projectiles: Projectile[];
  /** True when a shot was actually released this step. */
  fired: boolean;
}

export function createWeaponState(id: WeaponId): WeaponState {
  return { id, cooldown: 0 };
}

export function weaponDef(state: WeaponState): WeaponDef {
  return getWeapon(state.id);
}

/**
 * Advance the weapon by `dt` seconds. When `firePressed` is set and the
 * cooldown has elapsed, the weapon fires its spread pattern and the cooldown
 * resets; the fire-rate limit cannot be bypassed by input frequency.
 */
export function stepWeapon(state: WeaponState, dt: number, firePressed: boolean): FireResult {
  const cooldown = Math.max(0, state.cooldown - dt);
  if (!firePressed || cooldown > 0) {
    return { weapon: { ...state, cooldown }, projectiles: [], fired: false };
  }
  const def = getWeapon(state.id);
  const projectiles = def.spreadAngles.map((angleDeg): Projectile => {
    const radians = (angleDeg * Math.PI) / 180;
    return {
      x: 0,
      y: 0,
      vx: Math.cos(radians) * def.projectileSpeed,
      vy: Math.sin(radians) * def.projectileSpeed,
      ttl: def.projectileLifetime,
      damage: def.damage,
      weapon: state.id
    };
  });
  return { weapon: { ...state, cooldown: def.cooldown }, projectiles, fired: true };
}

/** Advance projectile positions and age; returns only the still-live ones. */
export function stepProjectiles<T extends Projectile>(projectiles: readonly T[], dt: number): T[] {
  const next: T[] = [];
  for (const p of projectiles) {
    const ttl = p.ttl - dt;
    if (ttl <= 0) {
      continue;
    }
    next.push({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, ttl });
  }
  return next;
}
