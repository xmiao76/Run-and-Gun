/**
 * Per-level visual theme data and deterministic scenic-prop placement.
 *
 * Pure and Phaser-free so placement stays unit-testable. The scene consumes
 * these definitions to build its environment layer; Level 2's distinct theme
 * arrives with TASK-007, until then it shares the dusk-jungle look.
 */

import type { Rect } from '../levels/levelSchema';

export interface LevelTheme {
  /** Ground tile texture key for solid terrain. */
  groundTile: string;
  /** One-way platform tile texture key. */
  oneWayTile: string;
  /** Distant ridge band tint (multiplied over the shared ridge texture). */
  ridgeTint: number;
  /** Scenic prop textures scattered along the ground. */
  propKeys: readonly string[];
}

/** Dusk jungle war zone (Level 1: jungle-outpost). */
export const JUNGLE_THEME: LevelTheme = {
  groundTile: 'art/tile-ground',
  oneWayTile: 'art/tile-oneway',
  ridgeTint: 0xffffff,
  propKeys: ['art/prop-bush', 'art/prop-rock']
};

/** Returns the active theme for a level id; unknown levels share the default. */
export function themeForLevel(levelId: string): LevelTheme {
  // Level 2 gets its own fortress theme in TASK-007.
  void levelId;
  return JUNGLE_THEME;
}

export interface PropPlacement {
  key: string;
  x: number;
  y: number;
  scale: number;
  /** Multiplied over the sprite; 1 = unchanged. */
  alpha: number;
}

/** Horizon silhouette textures, alternating along the far ground line. */
const HORIZON_KEYS = ['art/bg-tree', 'art/bg-ruin'] as const;
/** Pixels between horizon silhouettes. */
const HORIZON_SPACING = 430;

/**
 * Deterministically places tree/ruin silhouettes along the level's far ground
 * line, breaking up the tiled bands. World-anchored (scrolls with the
 * terrain), faded so they read as a distant layer, stable for a given width.
 */
export function horizonForLevel(levelWidth: number, groundY: number): PropPlacement[] {
  const placements: PropPlacement[] = [];
  for (let x = 180; x < levelWidth - 120; x += HORIZON_SPACING) {
    const hash = (Math.floor(x / 10) * 7) % 3;
    placements.push({
      key: HORIZON_KEYS[hash % HORIZON_KEYS.length],
      x: x + ((hash * 37) % 90),
      y: groundY,
      scale: hash === 2 ? 3.5 : 4,
      alpha: 0.55
    });
  }
  return placements;
}

/** Pixels between scenic props along a ground span. */
const PROP_SPACING = 360;
/** Props are not placed within this distance of a span edge (pits look clean). */
const PROP_EDGE_MARGIN = 60;

/**
 * Deterministically scatters props along a ground solid: spacing-based,
 * alternating between the theme's prop textures with a position-derived
 * variation so identical spans still vary. Stable for a given rect.
 */
export function propsForSolid(r: Rect, theme: LevelTheme, groundY: number): PropPlacement[] {
  if (theme.propKeys.length === 0 || r.width < PROP_EDGE_MARGIN * 2 + PROP_SPACING) {
    return [];
  }
  const placements: PropPlacement[] = [];
  for (let x = r.x + PROP_EDGE_MARGIN; x + PROP_EDGE_MARGIN <= r.x + r.width; x += PROP_SPACING) {
    const hash = (Math.floor(x) * 7 + Math.floor(r.x) * 13) % 3;
    const key = theme.propKeys[hash % theme.propKeys.length];
    const scale = 1.5 + (hash % 2) * 0.5;
    placements.push({ key, x, y: groundY + 1, scale, alpha: 1 });
  }
  return placements;
}
