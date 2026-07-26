/**
 * Per-level visual theme data and deterministic scenic-prop placement.
 *
 * Pure and Phaser-free so placement stays unit-testable. The scene consumes
 * these definitions to build its environment layer; each level id maps to a
 * distinct theme so stages have their own visual identity.
 */

import type { Rect } from '../levels/levelSchema';
import { SKY_TEXTURE, FORTRESS_SKY_TEXTURE } from './textureKeys';

export interface LevelTheme {
  /** Base backdrop texture key (gradient, stretched full-screen). */
  skyKey: string;
  /** Whether the star field layer is drawn. */
  showStars: boolean;
  /** Mid band texture (parallax layer), or null for none. */
  bandKey: string | null;
  bandTint: number;
  /** Parallax factor for the mid band. */
  bandScroll: number;
  bandY: number;
  bandHeight: number;
  /** Uniform tile scale for the mid band texture. */
  bandTileScale: number;
  /** Optional second band near the top (e.g. fortress pipes). */
  pipesKey: string | null;
  /** Ground tile texture key for solid terrain. */
  groundTile: string;
  /** One-way platform tile texture key. */
  oneWayTile: string;
  /** Horizon silhouette textures for the far ground line. */
  horizonKeys: readonly string[];
  /** Scenic prop textures scattered along the ground. */
  propKeys: readonly string[];
}

/** Dusk jungle war zone (Level 1: jungle-outpost). */
export const JUNGLE_THEME: LevelTheme = {
  skyKey: SKY_TEXTURE,
  showStars: true,
  bandKey: 'art/bg-ridge',
  bandTint: 0xffffff,
  bandScroll: 0.3,
  bandY: 250,
  bandHeight: 130,
  bandTileScale: 4,
  pipesKey: null,
  groundTile: 'art/tile-ground',
  oneWayTile: 'art/tile-oneway',
  horizonKeys: ['art/bg-tree', 'art/bg-ruin'],
  propKeys: ['art/prop-bush', 'art/prop-rock']
};

/** Industrial fortress interior (Level 2: fortress-interior). */
export const FORTRESS_THEME: LevelTheme = {
  skyKey: FORTRESS_SKY_TEXTURE,
  showStars: false,
  bandKey: 'art/tile-wall',
  bandTint: 0xffffff,
  bandScroll: 0.5,
  bandY: 96,
  bandHeight: 384,
  bandTileScale: 2,
  pipesKey: 'art/bg-pipes',
  groundTile: 'art/tile-metal',
  oneWayTile: 'art/tile-grate',
  horizonKeys: ['art/bg-machine', 'art/bg-column'],
  propKeys: ['art/prop-barrel', 'art/prop-crate-metal']
};

/** Returns the active theme for a level id; unknown levels share the default. */
export function themeForLevel(levelId: string): LevelTheme {
  if (levelId === 'fortress-interior') {
    return FORTRESS_THEME;
  }
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

/** Pixels between horizon silhouettes. */
const HORIZON_SPACING = 430;

/**
 * Deterministically places silhouettes along the level's far ground line,
 * breaking up the tiled bands. World-anchored (scrolls with the terrain),
 * faded so they read as a distant layer, stable for a given width.
 */
export function horizonForLevel(levelWidth: number, groundY: number, keys: readonly string[]): PropPlacement[] {
  if (keys.length === 0) {
    return [];
  }
  const placements: PropPlacement[] = [];
  for (let x = 180; x < levelWidth - 120; x += HORIZON_SPACING) {
    const hash = (Math.floor(x / 10) * 7) % 3;
    placements.push({
      key: keys[hash % keys.length],
      x: x + ((hash * 37) % 90),
      y: groundY,
      scale: hash === 2 ? 3.5 : 4,
      alpha: 0.75
    });
  }
  return placements;
}
