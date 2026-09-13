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
  /**
   * Targets this projectile may still damage before it is consumed. Starts at
   * the weapon's `pierce` (default 1) and is decremented by the collision
   * resolver on each hit.
   */
  pierce: number;
  /** Downward acceleration in flight (px/s^2); 0 for a straight shot. */
  gravity: number;
}

export interface FireResult {
  weapon: WeaponState;
  projectiles: Projectile[];
  /** True when a shot was actually released this step. */
  fired: boolean;
}

/**
 * Fire intent for one step: `pressed` is edge-triggered (the action went down
 * this step) and `held` is level-triggered (the action is down). Both release
 * a shot, but only when the cooldown has elapsed, so holding fire auto-fires
 * at exactly the weapon's rate and input frequency can never bypass it (C5).
 */
export interface FireInput {
  pressed: boolean;
  held: boolean;
}

export function createWeaponState(id: WeaponId): WeaponState {
  return { id, cooldown: 0 };
}

export function weaponDef(state: WeaponState): WeaponDef {
  return getWeapon(state.id);
}

/**
 * Advance the weapon by `dt` seconds. When the fire intent is present (pressed
 * or held) and the cooldown has elapsed, the weapon fires its spread pattern
 * and the cooldown resets; the fire-rate limit cannot be bypassed.
 */
export function stepWeapon(state: WeaponState, dt: number, fire: FireInput): FireResult {
  const cooldown = Math.max(0, state.cooldown - dt);
  const wantsFire = fire.pressed || fire.held;
  // Epsilon tolerance so a data cooldown of exactly N steps fires every N
  // steps instead of N+1 when float subtraction leaves a residue of ~1e-17.
  if (!wantsFire || cooldown > 1e-9) {
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
      weapon: state.id,
      pierce: def.pierce ?? 1,
      gravity: def.gravity ?? 0
    };
  });
  return { weapon: { ...state, cooldown: def.cooldown }, projectiles, fired: true };
}

/**
 * Advance projectile positions and age; returns only the still-live ones.
 *
 * A projectile with `gravity` accelerates downward as it travels, which is what
 * makes the Flare Thrower's shot arc. Position uses the pre-acceleration
 * velocity (semi-implicit ordering is applied to the velocity for the NEXT
 * step), matching how enemy arcing shots already integrate.
 */
export function stepProjectiles<T extends Projectile>(projectiles: readonly T[], dt: number): T[] {
  const next: T[] = [];
  for (const p of projectiles) {
    const ttl = p.ttl - dt;
    if (ttl <= 0) {
      continue;
    }
    next.push({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.vy + p.gravity * dt,
      ttl
    });
  }
  return next;
}
