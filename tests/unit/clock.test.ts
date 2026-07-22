import { describe, expect, it } from 'vitest';
import { createClock, FIXED_DT, tick } from '../../src/simulation/clock';

describe('fixed-timestep accumulator', () => {
  it('returns zero steps for a sub-step delta and carries the remainder', () => {
    const r = tick(createClock(), FIXED_DT / 2);
    expect(r.steps).toBe(0);
    expect(r.accumulator).toBeCloseTo(FIXED_DT / 2);
  });

  it('emits the correct number of steps and preserves the leftover', () => {
    const r = tick(createClock(), FIXED_DT * 2.5);
    expect(r.steps).toBe(2);
    expect(r.accumulator).toBeCloseTo(FIXED_DT * 0.5);
  });

  it('clamps a pathological delta so the loop cannot spiral', () => {
    const r = tick(createClock(), 5); // 5s, e.g. a tab switch
    const maxSteps = Math.floor(0.25 / FIXED_DT);
    expect(r.steps).toBe(maxSteps);
  });

  it('accumulates across frames', () => {
    const clock = createClock();
    const a = tick(clock, FIXED_DT * 0.6);
    clock.accumulator = a.accumulator;
    const b = tick(clock, FIXED_DT * 0.6);
    expect(b.steps).toBe(1);
  });
});
