import { describe, expect, it } from 'vitest';
import { CollisionCategory, ENEMY_PROJECTILE_HITS, PLAYER_PROJECTILE_HITS } from '../../src/simulation/categories';

describe('collision categories and ownership (D3)', () => {
  it('player projectiles hit enemies and boss components, never the player', () => {
    expect(CollisionCategory.enemyBody & PLAYER_PROJECTILE_HITS).not.toBe(0);
    expect(CollisionCategory.bossComponent & PLAYER_PROJECTILE_HITS).not.toBe(0);
    expect(CollisionCategory.playerBody & PLAYER_PROJECTILE_HITS).toBe(0);
  });

  it('enemy projectiles hit the player, never enemies or pickups', () => {
    expect(CollisionCategory.playerBody & ENEMY_PROJECTILE_HITS).not.toBe(0);
    expect(CollisionCategory.enemyBody & ENEMY_PROJECTILE_HITS).toBe(0);
    expect(CollisionCategory.pickup & ENEMY_PROJECTILE_HITS).toBe(0);
  });

  it('categories are unique bit masks', () => {
    const values = Object.values(CollisionCategory).filter((v) => v !== 0);
    expect(new Set(values).size).toBe(values.length);
  });
});
