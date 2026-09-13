import { describe, expect, it } from 'vitest';

import { DEFAULT_WEAPON, getWeapon, WEAPON_ORDER, type WeaponId } from '../../src/balance/weapons';

/**
 * TASK-044: every weapon must trade something.
 *
 * The Rapid Carbine used to be a strict upgrade on the Pulse Rifle - same
 * damage, 2.2x the fire rate, a faster bullet, and effectively the same reach -
 * so picking it up was never a decision and the starting weapon stopped
 * existing the moment you found one.
 *
 * These encode the shape a roster needs so that cannot happen again: nothing
 * beats anything on every axis, every pickup is the best at SOMETHING (a
 * reason to grab it), and the starting weapon is never the worst at anything
 * (a reason it stays usable all game).
 */

interface Profile {
  dps: number;
  range: number;
  perShot: number;
  shotsPerSecond: number;
  pellets: number;
  pierce: number;
}

function profile(id: WeaponId): Profile {
  const w = getWeapon(id);
  const pellets = w.spreadAngles.length;
  return {
    dps: (w.damage * pellets) / w.cooldown,
    range: w.projectileSpeed * w.projectileLifetime,
    perShot: w.damage,
    shotsPerSecond: 1 / w.cooldown,
    pellets,
    pierce: w.pierce ?? 1
  };
}

const AXES: (keyof Profile)[] = ['dps', 'range', 'perShot', 'shotsPerSecond', 'pellets', 'pierce'];

/** True when `a` is at least as good as `b` everywhere and better somewhere. */
function dominates(a: Profile, b: Profile): boolean {
  return AXES.every((k) => a[k] >= b[k]) && AXES.some((k) => a[k] > b[k]);
}

describe('weapon roster balance', () => {
  it('has no weapon that beats another on every axis at once', () => {
    for (const a of WEAPON_ORDER) {
      for (const b of WEAPON_ORDER) {
        if (a !== b) {
          expect(dominates(profile(a), profile(b)), `${a} strictly dominates ${b}`).toBe(false);
        }
      }
    }
  });

  it('gives every pickup weapon something it is outright best at', () => {
    // If a weapon leads on nothing, there is no situation that calls for it
    // and it is just clutter in the level.
    for (const id of WEAPON_ORDER) {
      if (id === DEFAULT_WEAPON) {
        continue;
      }
      const mine = profile(id);
      const leads = AXES.some((axis) =>
        WEAPON_ORDER.every((other) => other === id || mine[axis] > profile(other)[axis])
      );
      expect(leads, `${id} is not the best at anything`).toBe(true);
    }
  });

  it('keeps the starting weapon from being the worst at anything', () => {
    // The Pulse Rifle is the generalist you keep falling back to after every
    // death, so it must never be the roster's floor on any axis - it leads
    // nothing and trails nothing.
    const start = profile(DEFAULT_WEAPON);
    for (const axis of AXES) {
      // "Not the sole floor" rather than "strictly above the floor": most
      // weapons share a pierce of 1, so a strict comparison would fail on a
      // tie that means nothing.
      const somethingIsNoBetter = WEAPON_ORDER.some(
        (id) => id !== DEFAULT_WEAPON && profile(id)[axis] <= start[axis]
      );
      expect(somethingIsNoBetter, `${DEFAULT_WEAPON} is the worst weapon for ${axis}`).toBe(true);
    }
  });

  it('makes the Carbine pay for its fire rate in reach and per-shot damage', () => {
    // The specific trade this task introduced, pinned so a later tweak cannot
    // quietly hand the reach back.
    const rapid = profile('rapid');
    const pulse = profile('pulse');
    expect(rapid.shotsPerSecond).toBeGreaterThan(pulse.shotsPerSecond);
    expect(rapid.range).toBeLessThan(pulse.range);
    expect(rapid.perShot).toBeLessThan(pulse.perShot);
  });

  it('keeps every weapon able to reach a boss from where the fight is fought', () => {
    // The AI pilot holds 350px off a boss (BOSS_HOLD_DISTANCE in ai/pilot.ts).
    // A weapon that cannot cross that gap is not a trade-off, it is broken -
    // and the eval matrix would report it as a boss that ignores one weapon.
    for (const id of WEAPON_ORDER) {
      expect(profile(id).range, `${id} cannot reach a boss`).toBeGreaterThan(350);
    }
  });
});
