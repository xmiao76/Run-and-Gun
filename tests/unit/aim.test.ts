import { describe, expect, it } from 'vitest';
import { createNeutralInput } from '../../src/input/InputState';
import { aimAngle, rotateVelocity } from '../../src/simulation/aim';

describe('eight-direction aim angle', () => {
  it('fires horizontally by facing when no aim modifier is held', () => {
    expect(aimAngle(createNeutralInput(), 1, true)).toBe(0);
    expect(aimAngle(createNeutralInput(), -1, true)).toBe(180);
  });

  it('aims straight up and diagonally up', () => {
    expect(aimAngle({ ...createNeutralInput(), aimUp: true }, 1, true)).toBe(-90);
    expect(aimAngle({ ...createNeutralInput(), aimUp: true, right: true }, 1, true)).toBe(-45);
    expect(aimAngle({ ...createNeutralInput(), aimUp: true, left: true }, -1, true)).toBe(-135);
  });

  it('aims down and diagonally down only while airborne', () => {
    expect(aimAngle({ ...createNeutralInput(), aimDown: true }, 1, false)).toBe(90);
    expect(aimAngle({ ...createNeutralInput(), aimDown: true, right: true }, 1, false)).toBe(45);
    expect(aimAngle({ ...createNeutralInput(), aimDown: true, left: true }, -1, false)).toBe(135);
    // Grounded down means crouch-fire forward, not downward.
    expect(aimAngle({ ...createNeutralInput(), aimDown: true }, 1, true)).toBe(0);
  });

  it('rotateVelocity preserves magnitude and turns the spread fan', () => {
    const speed = Math.hypot(460, 0);
    const up = rotateVelocity(460, 0, -90);
    expect(up.vx).toBeCloseTo(0);
    expect(up.vy).toBeCloseTo(-speed);
    const diag = rotateVelocity(460, 0, -45);
    expect(Math.hypot(diag.vx, diag.vy)).toBeCloseTo(speed);
    expect(diag.vx).toBeGreaterThan(0);
    expect(diag.vy).toBeLessThan(0);
  });
});
