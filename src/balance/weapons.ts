/**
 * Data-driven weapon definitions for the first release.
 *
 * Balance values live here so weapons are configurable without touching firing
 * logic. All weapons use original names.
 *
 * TASK-036 added the genre's two missing signatures - a piercing laser and an
 * arcing flame - expressed as data (`pierce`, `gravity`) rather than as special
 * cases in the firing code. The three original weapons are untouched: they omit
 * both fields and behave exactly as before.
 */

export type WeaponId = 'pulse' | 'scatter' | 'rapid' | 'laser' | 'flame';

export interface WeaponDef {
  id: WeaponId;
  /** Human-readable, original name shown in the HUD / pickups. */
  name: string;
  /** Minimum time between shots (s); enforces deterministic fire-rate limits. */
  cooldown: number;
  /** Damage applied per projectile on hit. */
  damage: number;
  /** Projectile speed (px/s) along its aim direction. */
  projectileSpeed: number;
  /** Projectile time-to-live (s); bounds projectile lifetime. */
  projectileLifetime: number;
  /** Projectile aim angles in degrees; 0 = right. Length = projectiles per shot. */
  spreadAngles: readonly number[];
  /**
   * How many targets one projectile may damage before it is consumed.
   * Omitted (the default) means 1: the shot dies on its first hit. A projectile
   * never damages the same target twice, however high this is.
   */
  pierce?: number;
  /**
   * Downward acceleration applied to the projectile in flight (px/s^2), which
   * makes the shot arc. Omitted (the default) means 0: the shot flies straight.
   * Mirrors `arcGravity` on enemy projectiles.
   */
  gravity?: number;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  pulse: {
    id: 'pulse',
    name: 'Pulse Rifle',
    cooldown: 0.22,
    damage: 1,
    projectileSpeed: 460,
    projectileLifetime: 1.4,
    spreadAngles: [0]
  },
  scatter: {
    id: 'scatter',
    name: 'Scatter Blaster',
    cooldown: 0.4,
    damage: 0.5,
    projectileSpeed: 420,
    // Arcade-feel pass: the fan was widened from +/-12 to +/-24 degrees so the
    // spread reads as a shotgun at a glance. Pellet count and damage are
    // unchanged, so this is a readability change, not a power change.
    projectileLifetime: 0.9,
    spreadAngles: [-24, 0, 24]
  },
  rapid: {
    id: 'rapid',
    name: 'Rapid Carbine',
    cooldown: 0.1,
    damage: 1,
    projectileSpeed: 520,
    projectileLifetime: 1.2,
    spreadAngles: [0]
  },
  laser: {
    id: 'laser',
    name: 'Lance Laser',
    // Damage was raised from 1 to 1.5 after the eval matrix ran the pilot
    // through both bosses with it: at 1 damage the laser was the roster's worst
    // SINGLE-target weapon (3.3 dps, below even the starting Pulse Rifle),
    // because piercing buys nothing against a boss. Picking up the L capsule
    // before a boss was therefore a downgrade - the opposite of how a laser
    // should feel. At 1.5 it sits at 5 dps single-target, between Pulse and
    // Rapid, and pays off at up to 15 against a line of three.
    cooldown: 0.3,
    damage: 1.5,
    projectileSpeed: 700,
    projectileLifetime: 1.1,
    spreadAngles: [0],
    pierce: 3
  },
  flame: {
    id: 'flame',
    name: 'Flare Thrower',
    // 5 dps, between Pulse and Rapid, paid for with a slow arcing shot that is
    // awkward against distant or airborne targets.
    cooldown: 0.3,
    damage: 1.5,
    projectileSpeed: 360,
    projectileLifetime: 1,
    spreadAngles: [0],
    gravity: 620
  }
};

export const DEFAULT_WEAPON: WeaponId = 'pulse';

export const WEAPON_ORDER: readonly WeaponId[] = ['pulse', 'scatter', 'rapid', 'laser', 'flame'];

export function getWeapon(id: WeaponId): WeaponDef {
  return WEAPONS[id];
}
