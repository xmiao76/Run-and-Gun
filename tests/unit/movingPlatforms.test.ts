import { describe, expect, it } from 'vitest';
import {
  createMovingPlatformState,
  movingPlatformRect,
  stepMovingPlatform
} from '../../src/simulation/movingPlatforms';
import { type MovingPlatformDef } from '../../src/levels/levelSchema';

const DT = 1 / 60;

function hDef(): MovingPlatformDef {
  return { id: 'mp', x: 100, y: 400, width: 80, height: 12, axis: 'x', min: 100, max: 200, speed: 60 };
}

describe('moving platforms', () => {
  it('moves along its axis and reports the per-step delta', () => {
    const s = createMovingPlatformState(hDef());
    const r = stepMovingPlatform(s, DT);
    expect(r.deltaX).toBeCloseTo(60 * DT);
    expect(r.deltaY).toBe(0);
    expect(r.state.pos).toBeCloseTo(100 + 60 * DT);
  });

  it('reverses at the max bound', () => {
    const s = { ...createMovingPlatformState(hDef()), pos: 199.5, dir: 1 as const };
    const clamped = stepMovingPlatform(s, DT);
    // Overshoot is clamped to max; the platform only travels the remainder.
    expect(clamped.state.pos).toBe(200);
    expect(clamped.state.dir).toBe(-1);
    expect(clamped.deltaX).toBeCloseTo(0.5);
    // The next step travels in reverse.
    const reversed = stepMovingPlatform(clamped.state, DT);
    expect(reversed.deltaX).toBeLessThan(0);
  });

  it('exposes the current world rect offset by travel', () => {
    const s = { ...createMovingPlatformState(hDef()), pos: 150 };
    const rect = movingPlatformRect(s);
    expect(rect.x).toBe(100 + (150 - 100));
    expect(rect.y).toBe(400);
  });

  it('vertical platforms report deltaY and no deltaX', () => {
    const def: MovingPlatformDef = { id: 'v', x: 300, y: 300, width: 60, height: 12, axis: 'y', min: 300, max: 400, speed: 50 };
    const r = stepMovingPlatform(createMovingPlatformState(def), DT);
    expect(r.deltaX).toBe(0);
    expect(r.deltaY).toBeCloseTo(50 * DT);
  });
});
