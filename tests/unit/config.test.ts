import { describe, expect, it } from 'vitest';
import {
  GAME_TITLE,
  GAME_VERSION,
  LOGICAL_HEIGHT,
  LOGICAL_WIDTH,
  SCENE_KEYS,
  TITLE_HEADING
} from '../../src/app/config';

describe('game config', () => {
  it('uses the original game title and heading', () => {
    expect(GAME_TITLE).toBe('Operation Iron Echo');
    expect(TITLE_HEADING).toBe('OPERATION IRON ECHO');
  });

  it('uses the required 960x540 logical resolution with a 16:9 aspect ratio', () => {
    expect(LOGICAL_WIDTH).toBe(960);
    expect(LOGICAL_HEIGHT).toBe(540);
    expect(LOGICAL_WIDTH / LOGICAL_HEIGHT).toBeCloseTo(16 / 9);
  });

  it('defines unique, non-empty scene keys', () => {
    const keys = Object.values(SCENE_KEYS);
    expect(keys.length).toBeGreaterThan(0);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) {
      expect(key.length).toBeGreaterThan(0);
    }
  });

  it('exposes a semver-style version string', () => {
    expect(GAME_VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });
});
