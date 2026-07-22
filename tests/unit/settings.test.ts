import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, parseSettings } from '../../src/persistence/schema';
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
