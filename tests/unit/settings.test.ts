import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  STARTING_LIVES_OPTIONS,
  nextStartingLives,
  parseSettings
} from '../../src/persistence/schema';
import { loadSettings, saveSettings, type StorageLike } from '../../src/persistence/StorageService';

function memStorage(initial: Record<string, string> = {}): StorageLike {
  const store = { ...initial };
  return {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v;
    }
  };
}

describe('settings validation', () => {
  it('falls back to defaults for missing or malformed input', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings('garbage')).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it('clamps volumes to [0,1] and rejects wrong types', () => {
    const s = parseSettings({ musicVolume: 5, sfxVolume: -2, mute: 'yes', controls: 'telepathy' });
    expect(s.musicVolume).toBe(1);
    expect(s.sfxVolume).toBe(0);
    expect(s.mute).toBe(DEFAULT_SETTINGS.mute);
    expect(s.controls).toBe(DEFAULT_SETTINGS.controls);
  });

  it('preserves valid fields', () => {
    const s = parseSettings({ musicVolume: 0.2, sfxVolume: 0.4, mute: true, reducedFlash: true, controls: 'gamepad' });
    expect(s.musicVolume).toBe(0.2);
    expect(s.mute).toBe(true);
    expect(s.reducedFlash).toBe(true);
    expect(s.controls).toBe('gamepad');
  });

  it('validates bestScore as a non-negative integer with fallback to zero', () => {
    expect(parseSettings({ bestScore: 2500 }).bestScore).toBe(2500);
    expect(parseSettings({ bestScore: -50 }).bestScore).toBe(0);
    expect(parseSettings({ bestScore: 'lots' }).bestScore).toBe(0);
    expect(parseSettings({}).bestScore).toBe(0);
  });
});

describe('starting lives setting', () => {
  it('offers both the default 3 and the 30-life practice option', () => {
    expect(STARTING_LIVES_OPTIONS).toContain(3);
    expect(STARTING_LIVES_OPTIONS).toContain(30);
  });

  it('defaults to 3 for a fresh profile', () => {
    expect(DEFAULT_SETTINGS.startingLives).toBe(3);
    expect(parseSettings({}).startingLives).toBe(3);
    expect(parseSettings(null).startingLives).toBe(3);
  });

  it('preserves every offered value', () => {
    for (const lives of STARTING_LIVES_OPTIONS) {
      expect(parseSettings({ startingLives: lives }).startingLives).toBe(lives);
    }
  });

  it('falls back to 3 for corrupt or out-of-range stored values', () => {
    expect(parseSettings({ startingLives: 0 }).startingLives).toBe(3);
    expect(parseSettings({ startingLives: -5 }).startingLives).toBe(3);
    expect(parseSettings({ startingLives: 999 }).startingLives).toBe(3);
    expect(parseSettings({ startingLives: 7 }).startingLives).toBe(3); // not an offered value
    expect(parseSettings({ startingLives: 'lots' }).startingLives).toBe(3);
    expect(parseSettings({ startingLives: NaN }).startingLives).toBe(3);
    expect(parseSettings({ startingLives: 3.5 }).startingLives).toBe(3);
  });

  it('cycles through the offered values and wraps around', () => {
    expect(nextStartingLives(3)).toBe(STARTING_LIVES_OPTIONS[1]);
    const last = STARTING_LIVES_OPTIONS[STARTING_LIVES_OPTIONS.length - 1];
    expect(nextStartingLives(last)).toBe(STARTING_LIVES_OPTIONS[0]);
  });

  it('cycles from an unexpected current value back into the offered set', () => {
    expect(STARTING_LIVES_OPTIONS).toContain(nextStartingLives(999));
  });
});

describe('storage service', () => {
  it('returns defaults when storage is empty', () => {
    expect(loadSettings(memStorage())).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips saved settings', () => {
    const storage = memStorage();
    const settings = { ...DEFAULT_SETTINGS, mute: true, sfxVolume: 0.3 };
    expect(saveSettings(settings, storage)).toBe(true);
    expect(loadSettings(storage).mute).toBe(true);
    expect(loadSettings(storage).sfxVolume).toBe(0.3);
  });

  it('falls back to defaults on corrupt JSON', () => {
    const storage = memStorage({ 'operation-iron-echo:settings:v1': '{not json' });
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it('never throws when storage is unavailable', () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(saveSettings(DEFAULT_SETTINGS, null)).toBe(false);
  });
});
