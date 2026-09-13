/**
 * Centralized collision categories.
 *
 * A single source of truth for every collidable layer (PROJECT.md, quality
 * 5). Values are distinct bit masks so future broadphase filters can combine
 * them; gameplay logic refers to entities by these names, never by ad-hoc
 * strings or numbers.
 */

export const CollisionCategory = {
  none: 0,
  playerBody: 1 << 0,
  playerProjectile: 1 << 1,
  enemyBody: 1 << 2,
  enemyProjectile: 1 << 3,
  solidTerrain: 1 << 4,
  oneWayPlatform: 1 << 5,
  hazard: 1 << 6,
  pickup: 1 << 7,
  trigger: 1 << 8,
  bossComponent: 1 << 9
} as const;

export type CollisionCategoryValue = (typeof CollisionCategory)[keyof typeof CollisionCategory];

/** Categories a player projectile can damage. */
export const PLAYER_PROJECTILE_HITS = CollisionCategory.enemyBody | CollisionCategory.bossComponent;

/** Categories an enemy projectile can damage. */
export const ENEMY_PROJECTILE_HITS = CollisionCategory.playerBody;
