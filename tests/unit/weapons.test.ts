import { describe, expect, it } from 'vitest';
import { getWeapon } from '../../src/balance/weapons';
import {
  createWeaponState,
  stepProjectiles,
  stepWeapon,
  type FireInput
} from '../../src/simulation/weapons';

const neutral = { left: false, right: false, jumpHeld: false, jumpPressed: false, fireHeld: false, firePressed: false };

const PRESS: FireInput = { pressed: true, held: false };
const NONE: FireInput = { pressed: false, held: false };
const HELD: FireInput = { pressed: false, held: true };

function heldShots(id: 'pulse' | 'rapid', steps: number, fire: FireInput): number {
  let state = createWeaponState(id);
  let shots = 0;
  for (let i = 0; i < steps; i++) {
    const r = stepWeapon(state, 1 / 60, fire);
    state = r.weapon;
    if (r.fired) {
      shots += 1;
    }
  }
  return shots;
}

describe('weapon fire-rate enforcement', () => {
  it('fires once on a press and blocks re-fire until the cooldown elapses', () => {
    const pulse = getWeapon('pulse');
    let state = createWeaponState('pulse');

    const first = stepWeapon(state, 0, PRESS);
    expect(first.fired).toBe(true);
    expect(first.projectiles).toHaveLength(1);
    expect(first.weapon.cooldown).toBeCloseTo(pulse.cooldown);
    state = first.weapon;

    // Mid-cooldown presses (even many of them) cannot bypass the fire-rate limit.
    const blocked = stepWeapon(state, pulse.cooldown / 2, PRESS);
    expect(blocked.fired).toBe(false);
    expect(blocked.projectiles).toHaveLength(0);
    state = blocked.weapon;
    expect(state.cooldown).toBeCloseTo(pulse.cooldown / 2);

    // A press with the cooldown not yet fully elapsed is still blocked.
    const almost = stepWeapon(state, pulse.cooldown / 2 - 0.001, PRESS);
    expect(almost.fired).toBe(false);
    state = almost.weapon;

    // Stepping the exact remaining cooldown expires it; the next press fires.
    const refired = stepWeapon(state, state.cooldown, PRESS);
    expect(refired.fired).toBe(true);
    expect(refired.projectiles).toHaveLength(1);
  });

  it('does not fire when there is no press, and ticks the cooldown down', () => {
    let state = createWeaponState('rapid');
    const fired = stepWeapon(state, 0, PRESS);
    state = fired.weapon;
    expect(state.cooldown).toBeGreaterThan(0);

    const idle = stepWeapon(state, 0.05, NONE);
    expect(idle.fired).toBe(false);
    expect(idle.weapon.cooldown).toBeCloseTo(state.cooldown - 0.05);
  });
});

describe('auto-fire while held (C5 preserved)', () => {
  it('held (not pressed) fires immediately when the cooldown is zero', () => {
    const result = stepWeapon(createWeaponState('pulse'), 0, HELD);
    expect(result.fired).toBe(true);
  });

  it('rapid held for 60 steps fires exactly 10 times (0.1s cooldown)', () => {
    expect(heldShots('rapid', 60, HELD)).toBe(10);
  });

  it('pulse held for 60 steps fires exactly 5 times (0.22s cooldown)', () => {
    expect(heldShots('pulse', 60, HELD)).toBe(5);
  });

  it('pressed and held every step yields the same count as held alone', () => {
    expect(heldShots('pulse', 60, { pressed: true, held: true })).toBe(heldShots('pulse', 60, HELD));
  });

  it('releasing stops the stream while the cooldown ticks down', () => {
    let state = createWeaponState('rapid');
    const first = stepWeapon(state, 0, HELD);
    state = first.weapon;
    let shots = first.fired ? 1 : 0;
    for (let i = 0; i < 30; i++) {
      const r = stepWeapon(state, 1 / 60, NONE);
      state = r.weapon;
      if (r.fired) {
        shots += 1;
      }
    }
    expect(shots).toBe(1);
  });
});

describe('scatter blaster spread and no duplicate multiplication', () => {
  it('spawns one projectile per spread angle with correct velocities', () => {
    const def = getWeapon('scatter');
    const result = stepWeapon(createWeaponState('scatter'), 0, PRESS);
    expect(result.projectiles).toHaveLength(def.spreadAngles.length);

    const speeds = result.projectiles.map((p) => Math.hypot(p.vx, p.vy));
    for (const speed of speeds) {
      expect(speed).toBeCloseTo(def.projectileSpeed, 3);
    }
    // The center projectile travels purely horizontally.
    const center = result.projectiles[1];
    expect(center.vy).toBeCloseTo(0);
    expect(center.vx).toBeCloseTo(def.projectileSpeed);
    // Each projectile carries exactly the weapon's per-shot damage (no multiplier).
    for (const p of result.projectiles) {
      expect(p.damage).toBe(def.damage);
    }
    // Scatter's per-projectile damage is lower than the single-stream weapons.
    expect(def.damage).toBeLessThan(getWeapon('pulse').damage);
  });
});

describe('projectile lifetime and cleanup', () => {
  it('moves projectiles and culls expired ones (no unbounded growth)', () => {
    const result = stepWeapon(createWeaponState('pulse'), 0, PRESS);
    const spawned = result.projectiles.map((p) => ({ ...p, x: 100, y: 200 }));
    const def = getWeapon('pulse');

    const moved = stepProjectiles(spawned, 0.1);
    expect(moved[0].x).toBeCloseTo(100 + spawned[0].vx * 0.1);
    expect(moved[0].ttl).toBeCloseTo(def.projectileLifetime - 0.1);

    const expired = stepProjectiles(spawned, def.projectileLifetime + 0.1);
    expect(expired).toHaveLength(0);
  });
});

describe('neutral input constant', () => {
  it('has no held or pressed flags', () => {
    expect(neutral.firePressed).toBe(false);
    expect(neutral.jumpHeld).toBe(false);
  });
});
