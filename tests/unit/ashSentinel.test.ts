import { describe, expect, it } from 'vitest';

import {
  getBossDef,
  VOLLEY_HEIGHTS,
  VOLLEY_HIGH_Y,
  VOLLEY_LOW_Y,
  type BossId
} from '../../src/balance/bosses';
import { CROUCH_HEIGHT, GROUND_Y, PLAYER_HEIGHT } from '../../src/balance/player';
import { volleyHeight } from '../../src/simulation/bosses';

/**
 * TASK-042: the Ash Sentinel.
 *
 * The point of a third boss is a third KIND of fight, so these test the things
 * that make it one - the volley heights meaning something against the player's
 * actual body, and the fight's rhythm differing from the other two - rather
 * than just that a new record exists in the table.
 */

/** Does a shot at `y` (8px tall) overlap a body of `height` standing on the ground? */
function hits(y: number, height: number): boolean {
  const bodyTop = GROUND_Y - height;
  return y + 8 > bodyTop && y < GROUND_Y;
}

describe('volley heights', () => {
  it('fires high shots that a crouch passes under but standing does not', () => {
    expect(hits(VOLLEY_HIGH_Y, PLAYER_HEIGHT), 'high shot must threaten a standing player').toBe(true);
    expect(hits(VOLLEY_HIGH_Y, CROUCH_HEIGHT), 'crouching must clear the high shot').toBe(false);
  });

  it('fires low shots that only a jump clears', () => {
    // The regression this exists for: a first draft placed three evenly spaced
    // slots by eye, and two of them passed clean over the player's head. Both
    // postures must be threatened by the low shot, or "jump" is not the answer.
    expect(hits(VOLLEY_LOW_Y, PLAYER_HEIGHT), 'low shot must threaten standing').toBe(true);
    expect(hits(VOLLEY_LOW_Y, CROUCH_HEIGHT), 'low shot must threaten crouching too').toBe(true);
  });

  it('keeps every volley height inside the player box, so none is decorative', () => {
    for (const y of VOLLEY_HEIGHTS) {
      expect(hits(y, PLAYER_HEIGHT), `a shot at ${y} cannot hit anyone`).toBe(true);
    }
  });

  it('alternates deterministically, so the fight is learnable and reproducible', () => {
    const first = [0, 1, 2, 3].map(volleyHeight);
    const again = [0, 1, 2, 3].map(volleyHeight);
    expect(first).toEqual(again);
    // It must actually alternate rather than repeat one height.
    expect(new Set(first).size).toBeGreaterThan(1);
  });

  it('handles a negative pattern index without producing undefined', () => {
    expect(VOLLEY_HEIGHTS).toContain(volleyHeight(-1));
  });
});

describe('every boss pattern does something', () => {
  const ALL: BossId[] = ['siegeWalker', 'reactorWarden', 'ashSentinel'];

  it('never declares a charge it cannot perform', () => {
    // TASK-043: the Reactor Warden listed 'charge' beside a chargeSpeed of 0,
    // so half its rotation was a wind-up followed by nothing - it neither
    // moved nor fired. `stepBoss` implements charge purely as movement, so a
    // charge without speed is a dead attack, and nothing anywhere said so.
    for (const id of ALL) {
      const def = getBossDef(id);
      if (def.patterns.includes('charge')) {
        expect(def.chargeSpeed, `${id} charges at zero speed`).toBeGreaterThan(0);
      }
    }
  });

  it('never declares a burst it cannot fire', () => {
    for (const id of ALL) {
      const def = getBossDef(id);
      if (def.patterns.includes('burst')) {
        expect(def.burstCount, `${id} bursts zero projectiles`).toBeGreaterThan(0);
        expect(def.burstSpeed, `${id} bursts at zero speed`).toBeGreaterThan(0);
      }
    }
  });

  it('gives every boss at least two distinct working patterns', () => {
    // One attack on repeat is not a fight.
    for (const id of ALL) {
      expect(new Set(getBossDef(id).patterns).size, id).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('the Ash Sentinel as a third kind of fight', () => {
  const sentinel = getBossDef('ashSentinel');

  it('needs no subcomponents to become vulnerable, unlike the Reactor Warden', () => {
    expect(getBossDef('reactorWarden').phases.length).toBeGreaterThan(0);
    expect(sentinel.phases).toEqual([]);
    expect(sentinel.phaseCount).toBe(1);
  });

  it('opens a window after every single attack, unlike the Siege Walker', () => {
    expect(sentinel.patternsPerCycle).toBe(1);
    expect(getBossDef('siegeWalker').patternsPerCycle).toBeGreaterThan(1);
  });

  it('pays for those frequent windows with the most health of the three', () => {
    for (const id of ['siegeWalker', 'reactorWarden'] as const) {
      expect(sentinel.health).toBeGreaterThan(getBossDef(id).health);
    }
  });

  it('owns the volley pattern, and is the only boss that uses it', () => {
    expect(sentinel.patterns).toContain('volley');
    for (const id of ['siegeWalker', 'reactorWarden'] as const) {
      expect(getBossDef(id).patterns, id).not.toContain('volley');
    }
  });

  it('gives every boss a distinct name, id and silhouette size', () => {
    const ids: BossId[] = ['siegeWalker', 'reactorWarden', 'ashSentinel'];
    const names = ids.map((id) => getBossDef(id).name);
    expect(new Set(names).size).toBe(ids.length);
    const shapes = ids.map((id) => `${getBossDef(id).width}x${getBossDef(id).height}`);
    expect(new Set(shapes).size).toBe(ids.length);
  });

  it('has the flattest silhouette of the three', () => {
    // The silhouette is the first thing the player reads, so a flat wing must
    // not be confusable with the Walker's box or the Warden's column. Stated
    // as an aspect ratio: the Walker is already slightly wide (64x56), so
    // "wider than tall" would not have distinguished anything.
    const ratio = (id: BossId): number => getBossDef(id).width / getBossDef(id).height;
    expect(ratio('ashSentinel')).toBeGreaterThan(ratio('siegeWalker'));
    expect(ratio('ashSentinel')).toBeGreaterThan(ratio('reactorWarden'));
  });
});
