/**
 * Boss presentation helpers: pure mappings from boss id to sprite texture.
 */

import type { BossId } from '../balance/bosses';

/** Body sprite for a boss; every boss has its own large, detailed sprite. */
export function bossTexture(id: BossId): string {
  switch (id) {
    case 'siegeWalker':
      return 'art/boss-siege-walker';
    case 'reactorWarden':
      return 'art/boss-reactor-warden';
  }
}
