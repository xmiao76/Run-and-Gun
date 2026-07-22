import { DEFAULT_SETTINGS, parseSettings, type Settings } from './schema';

/**
 * localStorage wrapper for user settings. Every read is validated and any
 * failure (missing key, bad JSON, unavailable storage) falls back to defaults.
 * Writes are best-effort and never throw.
 */

const SETTINGS_KEY = 'operation-iron-echo:settings:v1';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function getStorage(): StorageLike | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function loadSettings(storage: StorageLike | null = getStorage()): Settings {
  if (!storage) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    return parseSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings, storage: StorageLike | null = getStorage()): boolean {
  if (!storage) {
    return false;
  }
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}
