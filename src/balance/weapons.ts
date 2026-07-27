/**
 * Data-driven weapon definitions for the first release.
 *
 * Balance values live here so weapons are configurable without touching firing
 * logic. The three weapons match GAME_REQUIREMENTS.md section 5 and use only
 * original names.
 */

export type WeaponId = 'pulse' | 'scatter' | 'rapid';

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
  }
};

export const DEFAULT_WEAPON: WeaponId = 'pulse';

export const WEAPON_ORDER: readonly WeaponId[] = ['pulse', 'scatter', 'rapid'];

export function getWeapon(id: WeaponId): WeaponDef {
  return WEAPONS[id];
}
