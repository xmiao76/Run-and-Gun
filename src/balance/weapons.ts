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
    // TASK-044: the Carbine used to be a strict upgrade on the Pulse Rifle -
    // same damage, 2.2x the fire rate, a faster bullet, and effectively the
    // same reach. Picking it up was never a decision, and it retired the
    // starting weapon on sight. Every other weapon in the roster trades
    // something, so now this one does too.
    //
    // Its identity is close-range sustained fire: well under half the damage
    // per shot, and a bullet that expires at about four fifths of the Rifle's
    // reach. It keeps a clear edge on sustained output while the Rifle owns
    // anything at distance.
    //
    // A first attempt cut harder still - 0.5 damage and 0.8s of flight - and
    // the eval matrix rejected it: Level 1 hands you this weapon before its
    // boss, and at that power the pilot could no longer finish the level
    // inside its step budget at all. A cost is a trade, not a halving.
    //
    // The reach is deliberately kept above the AI pilot's 350px boss stand-off
    // (BOSS_HOLD_DISTANCE): a weapon that cannot reach a boss from where the
    // fight is fought is not a trade-off, it is a broken weapon.
    cooldown: 0.1,
    damage: 0.6,
    projectileSpeed: 520,
    projectileLifetime: 1,
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
    // The roster's highest sustained damage, and the shortest reach to pay for
    // it - plus an arc that makes anything distant or airborne genuinely
    // awkward to hit.
    //
    // Found while writing the TASK-044 balance invariants: at a 0.3s cooldown
    // this weapon matched the Lance Laser's damage-per-second AND its damage
    // per shot, while having less than half its reach and no piercing. The
    // Laser beat it on every axis at once, so the Flare Thrower had no reason
    // to exist. Raw output is now the thing it is best at.
    cooldown: 0.24,
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
