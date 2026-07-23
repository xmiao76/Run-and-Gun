/**
 * Versioned, schema-validated settings.
 *
 * Saved data carries a version and is validated before use; anything missing,
 * wrong-typed, or out of range falls back to defaults so corrupt localStorage
 * can never prevent the game from starting (GAME_REQUIREMENTS.md section 9,
 * ACCEPTANCE_CRITERIA I2/I3).
 */

export const SETTINGS_VERSION = 1;

export type ControlScheme = 'keyboard' | 'gamepad' | 'touch';

export interface Settings {
  version: number;
  musicVolume: number;
  sfxVolume: number;
  mute: boolean;
  reducedFlash: boolean;
  controls: ControlScheme;
  /** Highest score achieved across runs (persisted). */
  bestScore: number;
}

export const DEFAULT_SETTINGS: Settings = {
  version: SETTINGS_VERSION,
  musicVolume: 0.6,
  sfxVolume: 0.8,
  mute: false,
  reducedFlash: false,
  controls: 'keyboard',
  bestScore: 0
};

function volume(value: unknown, fallback: number): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : NaN;
  if (Number.isNaN(n)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, n));
}

function isControlScheme(value: unknown): value is ControlScheme {
  return value === 'keyboard' || value === 'gamepad' || value === 'touch';
}

/** Validates unknown parsed storage data, falling back field-by-field. */
export function parseSettings(raw: unknown): Settings {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    version: SETTINGS_VERSION,
    musicVolume: volume(r.musicVolume, DEFAULT_SETTINGS.musicVolume),
    sfxVolume: volume(r.sfxVolume, DEFAULT_SETTINGS.sfxVolume),
    mute: typeof r.mute === 'boolean' ? r.mute : DEFAULT_SETTINGS.mute,
    reducedFlash: typeof r.reducedFlash === 'boolean' ? r.reducedFlash : DEFAULT_SETTINGS.reducedFlash,
    controls: isControlScheme(r.controls) ? r.controls : DEFAULT_SETTINGS.controls,
    bestScore: typeof r.bestScore === 'number' && Number.isFinite(r.bestScore) && r.bestScore >= 0 ? Math.floor(r.bestScore) : 0
  };
}
