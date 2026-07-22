import { describe, expect, it } from 'vitest';
import { advanceCheckpoint, checkpointAt, resolveCheckpoint } from '../../src/simulation/checkpoints';

const checkpoints = [
  { id: 'start', x: 60, y: 480 },
  { id: 'mid', x: 600, y: 480 },
  { id: 'end', x: 1200, y: 480 }
];

describe('checkpoint tracking', () => {
  it('detects the checkpoint the player overlaps', () => {
    expect(checkpointAt(checkpoints, 60, 460, 22, 32)).toBe('start');
    expect(checkpointAt(checkpoints, 300, 460, 22, 32)).toBeNull();
  });

  it('advances forward but never backward', () => {
    expect(advanceCheckpoint(checkpoints, 'start', 600, 460, 22, 32)).toBe('mid');
    expect(advanceCheckpoint(checkpoints, 'mid', 60, 460, 22, 32)).toBe('mid');
  });

  it('resolves an id with a fallback to the first checkpoint', () => {
    expect(resolveCheckpoint(checkpoints, 'end').id).toBe('end');
    expect(resolveCheckpoint(checkpoints, 'missing').id).toBe('start');
  });
});
