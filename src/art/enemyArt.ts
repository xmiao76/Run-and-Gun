/**
 * Enemy presentation helpers: pure mappings from enemy kind to sprite texture.
 */

import type { EnemyKind } from '../balance/enemies';

/** Body sprite for an enemy kind; every archetype reads distinctly. */
export function enemyTexture(kind: EnemyKind): string {
  switch (kind) {
    case 'sentry':
      return 'art/enemy-sentry';
    case 'drone':
      return 'art/enemy-drone';
    case 'grenadier':
      return 'art/enemy-grenadier';
    case 'runner':
      return 'art/enemy-runner';
  }
}
