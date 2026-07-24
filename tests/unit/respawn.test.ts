import { describe, expect, it } from 'vitest';
import { respawnPosition } from '../../src/simulation/safeSpawn';

const cp = { x: 100, y: 480 };

describe('respawn position safety (C7)', () => {
  it('returns the checkpoint when no enemies exist', () => {
    expect(respawnPosition(cp, [], 22, 32, 1000)).toEqual({ x: 100, y: 480 });
  });

  it('returns the checkpoint when enemies are far away', () => {
    const enemies = [{ x: 500, y: 448, width: 20, height: 32 }];
    expect(respawnPosition(cp, enemies, 22, 32, 1000)).toEqual({ x: 100, y: 480 });
  });

  it('shifts right clear of an enemy overlapping the spawn box', () => {
    const enemies = [{ x: 96, y: 448, width: 20, height: 32 }];
    const pos = respawnPosition(cp, enemies, 22, 32, 1000);
    expect(pos.x).toBeGreaterThan(100);
    expect(pos.y).toBe(480);
  });

  it('the shifted spawn box no longer overlaps the enemy', () => {
    const enemies = [{ x: 96, y: 448, width: 20, height: 32 }];
    const pos = respawnPosition(cp, enemies, 22, 32, 1000);
    // First shift is one (player width + margin) to the right.
    expect(pos.x).toBe(100 + 22 + 48);
  });

  it('falls back to the checkpoint when the level edge blocks shifting', () => {
    const enemies = [{ x: 96, y: 448, width: 20, height: 32 }];
    expect(respawnPosition(cp, enemies, 22, 32, 150)).toEqual({ x: 100, y: 480 });
  });
});
