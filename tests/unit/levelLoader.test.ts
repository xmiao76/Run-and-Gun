import { describe, expect, it } from 'vitest';
import { LEVEL_1 } from '../../src/levels/level1';
import { loadLevel, validateLevel } from '../../src/levels/levelLoader';

describe('level validation', () => {
  it('accepts the authored Level 1', () => {
    expect(() => loadLevel(LEVEL_1)).not.toThrow();
    expect(validateLevel(LEVEL_1)).toEqual([]);
  });

  it('rejects fewer than two checkpoints', () => {
    const bad = { ...LEVEL_1, checkpoints: [LEVEL_1.checkpoints[0]] };
    const issues = validateLevel(bad);
    expect(issues.some((i) => i.path === 'level.checkpoints')).toBe(true);
    expect(() => loadLevel(bad)).toThrow(/checkpoints/);
  });

  it('rejects an out-of-range completionX', () => {
    const bad = { ...LEVEL_1, completionX: LEVEL_1.width + 100 };
    expect(validateLevel(bad).some((i) => i.path === 'level.completionX')).toBe(true);
  });

  it('rejects a spawn outside the level bounds', () => {
    const bad = { ...LEVEL_1, spawn: { x: -50, y: 0 } };
    expect(validateLevel(bad).some((i) => i.path === 'level.spawn')).toBe(true);
  });
});
