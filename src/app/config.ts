/**
 * Core game identity and presentation constants.
 *
 * All gameplay-visible identity strings and the logical resolution live here
 * so simulation, scenes, UI, and tests share one source of truth.
 */

/** Canonical original title. Must never reference Contra branding. */
export const GAME_TITLE = 'Operation Iron Echo';

/** Display heading shown on the title screen. */
export const TITLE_HEADING = 'OPERATION IRON ECHO';

/** Current project version, mirrored in package.json. */
export const GAME_VERSION = '0.1.0';

/** Logical game resolution width in pixels. */
export const LOGICAL_WIDTH = 960;

/** Logical game resolution height in pixels. */
export const LOGICAL_HEIGHT = 540;

/** Central registry of scene keys to avoid magic strings. */
export const SCENE_KEYS = {
  boot: 'boot',
  title: 'title',
  sandbox: 'sandbox',
  level: 'level',
  results: 'results',
  gameOver: 'gameOver'
} as const;

export type SceneKey = (typeof SCENE_KEYS)[keyof typeof SCENE_KEYS];
