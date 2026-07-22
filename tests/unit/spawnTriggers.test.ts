import { describe, expect, it } from 'vitest';
import { isSpawnSafe } from '../../src/simulation/safeSpawn';
import { createSpawnTrigger, updateSpawnTriggers } from '../../src/simulation/spawnTriggers';

const spawns = [
  { kind: 'runner' as const, x: 560, y: 450 },
  { kind: 'sentry' as const, x: 700, y: 450 }
];

describe('spawn trigger arming and caps', () => {
  it('does not fire while the player is outside the region', () => {
    const triggers = [createSpawnTrigger('t1', 400, 460, spawns)];
    const r = updateSpawnTriggers(triggers, 300, 450, 0, 8);
    expect(r.spawned).toHaveLength(0);
    expect(r.triggers[0].triggered).toBe(false);
  });

  it('fires once when the player crosses the region and admits safe spawns', () => {
    const triggers = [createSpawnTrigger('t1', 400, 460, spawns)];
    // Player at the far edge of the region is far enough from both spawn points.
    const r = updateSpawnTriggers(triggers, 460, 450, 0, 8);
    expect(r.spawned.map((s) => s.kind)).toEqual(['runner', 'sentry']);
    expect(r.triggers[0].triggered).toBe(true);

    const again = updateSpawnTriggers(r.triggers, 460, 450, 0, 8);
    expect(again.spawned).toHaveLength(0);
  });

  it('respects the active-enemy cap', () => {
    const triggers = [createSpawnTrigger('t1', 400, 460, spawns)];
    const r = updateSpawnTriggers(triggers, 460, 450, 1, 2);
    expect(r.spawned).toHaveLength(1);
  });

  it('rejects spawns that would land on top of the player', () => {
    // One spawn just past the region edge (close), one far away.
    const nearSpawns = [
      { kind: 'runner' as const, x: 470, y: 450 },
      { kind: 'sentry' as const, x: 700, y: 450 }
    ];
    const triggers = [createSpawnTrigger('t1', 400, 460, nearSpawns)];
    // Player at the region edge is within the safety margin of the near runner
    // spawn (blocks it) but far from the sentry spawn (admits it).
    const r = updateSpawnTriggers(triggers, 460, 450, 0, 8);
    const kinds = r.spawned.map((s) => s.kind);
    expect(kinds).not.toContain('runner');
    expect(kinds).toContain('sentry');
  });
});

describe('spawn safety margin', () => {
  it('rejects candidates near the player and accepts distant ones', () => {
    expect(isSpawnSafe({ x: 100, y: 450, width: 20, height: 30 }, 110, 452)).toBe(false);
    expect(isSpawnSafe({ x: 400, y: 450, width: 20, height: 30 }, 110, 452)).toBe(true);
  });
});
