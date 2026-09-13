import { describe, expect, it } from 'vitest';

import { getWeapon, WEAPON_ORDER, type WeaponId } from '../../src/balance/weapons';
import { createWeaponState, stepProjectiles, stepWeapon, type Projectile } from '../../src/simulation/weapons';

/**
 * TASK-036: the Lance Laser (piercing) and Flare Thrower (arcing).
 *
 * The two new behaviours are expressed as DATA on `WeaponDef` - `pierce` and
 * `gravity` - so these tests pin the data, its defaults, and the projectile
 * motion it produces. Piercing's consumption rule is scene-level collision and
 * is covered end-to-end in tests/e2e/weaponRoster.spec.ts.
 */

const DT = 1 / 60;
const PRESS = { pressed: true, held: false };

function fireOnce(id: WeaponId): Projectile[] {
  return stepWeapon(createWeaponState(id), 0, PRESS).projectiles;
}

describe('pierce as data', () => {
  it('defaults to a single target for the three original weapons', () => {
    // The originals must be untouched: no `pierce` field, so one hit consumes
    // the shot exactly as before.
    for (const id of ['pulse', 'scatter', 'rapid'] as const) {
      expect(getWeapon(id).pierce, id).toBeUndefined();
      for (const p of fireOnce(id)) {
        expect(p.pierce, id).toBe(1);
      }
    }
  });

  it('gives the laser a pierce budget expressed in the weapon data', () => {
    expect(getWeapon('laser').pierce).toBe(3);
    const [shot] = fireOnce('laser');
    expect(shot.pierce).toBe(3);
  });

  it('carries the budget on every projectile of a multi-shot weapon', () => {
    // Nothing today fires a piercing spread, but the rule is per projectile,
    // not per trigger pull, so a future spread inherits it correctly.
    const pellets = fireOnce('scatter');
    expect(pellets).toHaveLength(3);
    expect(pellets.every((p) => p.pierce === 1)).toBe(true);
  });
});

describe('gravity as data', () => {
  it('leaves the three original weapons flying dead straight', () => {
    for (const id of ['pulse', 'scatter', 'rapid'] as const) {
      expect(getWeapon(id).gravity, id).toBeUndefined();
      for (const p of fireOnce(id)) {
        expect(p.gravity, id).toBe(0);
      }
    }
  });

  it('gives the flame shot a downward acceleration', () => {
    expect(getWeapon('flame').gravity).toBe(620);
    expect(fireOnce('flame')[0].gravity).toBe(620);
  });
});

describe('projectile motion', () => {
  it('drops an arcing shot further every step, so the path is a curve not a ramp', () => {
    let shots = fireOnce('flame');
    const drops: number[] = [];
    let previousY = shots[0].y;
    for (let i = 0; i < 10; i++) {
      shots = stepProjectiles(shots, DT);
      drops.push(shots[0].y - previousY);
      previousY = shots[0].y;
    }
    // Each step falls further than the last: that is acceleration, not a
    // constant downward drift.
    for (let i = 1; i < drops.length; i++) {
      expect(drops[i]).toBeGreaterThan(drops[i - 1]);
    }
  });

  it('keeps a straight shot at exactly its firing height', () => {
    let shots = fireOnce('pulse');
    const y0 = shots[0].y;
    for (let i = 0; i < 30; i++) {
      shots = stepProjectiles(shots, DT);
    }
    expect(shots[0].y).toBe(y0);
    expect(shots[0].vy).toBe(0);
  });

  it('still carries an arcing shot forward at its full horizontal speed', () => {
    // Gravity must not steal horizontal range.
    const flame = getWeapon('flame');
    let shots = fireOnce('flame');
    for (let i = 0; i < 30; i++) {
      shots = stepProjectiles(shots, DT);
    }
    expect(shots[0].x).toBeCloseTo(flame.projectileSpeed * 30 * DT, 5);
  });

  it('accelerates at the rate the data asks for', () => {
    let shots = fireOnce('flame');
    shots = stepProjectiles(shots, DT);
    expect(shots[0].vy).toBeCloseTo(620 * DT, 6);
    shots = stepProjectiles(shots, DT);
    expect(shots[0].vy).toBeCloseTo(620 * DT * 2, 6);
  });

  it('expires an arcing shot on its lifetime like any other', () => {
    const flame = getWeapon('flame');
    let shots = fireOnce('flame');
    const steps = Math.ceil(flame.projectileLifetime / DT) + 1;
    for (let i = 0; i < steps; i++) {
      shots = stepProjectiles(shots, DT);
    }
    expect(shots).toHaveLength(0);
  });
});

describe('the roster as a whole', () => {
  it('exposes all five weapons in order', () => {
    expect(WEAPON_ORDER).toEqual(['pulse', 'scatter', 'rapid', 'laser', 'flame']);
  });

  it('gives every weapon an original name and no duplicate names', () => {
    const names = WEAPON_ORDER.map((id) => getWeapon(id).name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('keeps every weapon inside one power band', () => {
    // This asserted that the Rapid Carbine was the roster's damage-per-second
    // ceiling, which was true when it was written and is the very thing
    // TASK-044 removed - being untouchable on every axis was the defect. The
    // useful invariant is that the band stays narrow, so no weapon is a must-
    // have; who sits at the top is `weaponBalance.test.ts`'s business.
    const dps = (id: WeaponId): number => {
      const w = getWeapon(id);
      return (w.damage * w.spreadAngles.length) / w.cooldown;
    };
    const all = WEAPON_ORDER.map(dps);
    expect(Math.max(...all) / Math.min(...all)).toBeLessThan(2);
  });
});
