/**
 * Weapon presentation helpers: pure mappings from weapon id to sprite texture.
 */

import type { WeaponId } from '../balance/weapons';

/** Projectile sprite for a weapon; each weapon reads distinctly in flight. */
export function bulletTexture(weapon: WeaponId): string {
  switch (weapon) {
    case 'scatter':
      return 'art/bullet-scatter';
    case 'rapid':
      return 'art/bullet-rapid';
    case 'laser':
      return 'art/bullet-laser';
    case 'flame':
      return 'art/bullet-flame';
    case 'pulse':
      return 'art/bullet-pulse';
  }
}
