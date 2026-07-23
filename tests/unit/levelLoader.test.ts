import { describe, expect, it } from 'vitest';
import { LEVEL_1 } from '../../src/levels/level1';
import { LEVEL_2 } from '../../src/levels/level2';
import { loadLevel, validateLevel } from '../../src/levels/levelLoader';

describe('level validation', () => {
  it('accepts the authored Level 1', () => {
    expect(() => loadLevel(LEVEL_1)).not.toThrow();
    expect(validateLevel(LEVEL_1)).toEqual([]);
  });

  it('accepts the authored Level 2', () => {
    expect(() => loadLevel(LEVEL_2)).not.toThrow();
    expect(validateLevel(LEVEL_2)).toEqual([]);
  });

  it('rejects a moving platform with a non-positive speed', () => {
    const bad = {
      ...LEVEL_2,
      movingPlatforms: [{ ...LEVEL_2.movingPlatforms[0], speed: 0 }]
    };
    expect(validateLevel(bad).some((i) => i.path.startsWith('level.movingPlatforms'))).toBe(true);
  });

  it('rejects a moving platform with max <= min', () => {
    const bad = {
      ...LEVEL_2,
      movingPlatforms: [{ ...LEVEL_2.movingPlatforms[0], max: LEVEL_2.movingPlatforms[0].min }]
    };
    expect(validateLevel(bad).some((i) => i.path.startsWith('level.movingPlatforms'))).toBe(true);
  });

  it('rejects a door with an empty body or trigger', () => {
    const bad = {
      ...LEVEL_2,
      doors: [{ id: 'd', rect: { x: 0, y: 0, width: 0, height: 10 }, openTrigger: { x: 0, y: 0, width: 10, height: 10 } }]
    };
    expect(validateLevel(bad).some((i) => i.path.startsWith('level.doors'))).toBe(true);
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
