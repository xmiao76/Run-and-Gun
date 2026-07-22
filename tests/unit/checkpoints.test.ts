import { describe, expect, it } from 'vitest';
import { restoreCheckpoint, snapshotCheckpoint } from '../../src/simulation/checkpoints';

const base = {
  levelId: 'sandbox',
  checkpointId: 'mid',
  lives: 2,
  score: 1500,
  weapon: 'scatter' as const,
  spawnX: 320,
  spawnY: 448
};

describe('checkpoint snapshot and restore', () => {
  it('snapshot returns an independent copy', () => {
    const snap = snapshotCheckpoint(base);
    expect(snap).toEqual(base);
    snap.score = 9999;
    expect(base.score).toBe(1500);
  });

  it('restore returns a fresh copy without mutating the stored checkpoint', () => {
    const snap = snapshotCheckpoint(base);
    const a = restoreCheckpoint(snap);
    const b = restoreCheckpoint(snap);
    expect(a).toEqual(base);
    expect(b).toEqual(base);
    a.lives = 0;
    expect(snap.lives).toBe(2);
    expect(b.lives).toBe(2);
  });

  it('preserves every resume field', () => {
    const snap = snapshotCheckpoint(base);
    expect(snap).toMatchObject({
      levelId: 'sandbox',
      checkpointId: 'mid',
      lives: 2,
      score: 1500,
      weapon: 'scatter',
      spawnX: 320,
      spawnY: 448
    });
  });
});
