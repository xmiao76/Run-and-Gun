import { describe, expect, it } from 'vitest';

import { isLethalHazard, type Rect } from '../../src/levels/levelSchema';
import { LEVELS } from '../../src/levels/levels';
import { spikeRanges } from '../../src/ai/pilot';

/**
 * TASK-027.
 *
 * `hazards` carries two different things: real spike strips, and decorative
 * paint on a pit rim. The scene used to treat every rect as lethal, so walking
 * into a Level 1 pit killed the player on contact with the stripes and reported
 * the death as `hazard` when it was a `pit`.
 *
 * y grows downward, so "above the ground line" means a SMALLER y.
 */

const GROUND_Y = 480;

function rect(overrides: Partial<Rect> = {}): Rect {
  return { x: 0, y: GROUND_Y, width: 64, height: 8, ...overrides };
}

describe('isLethalHazard', () => {
  it('treats a strip standing on the ground as lethal', () => {
    expect(isLethalHazard(rect({ y: GROUND_Y - 8 }), GROUND_Y)).toBe(true);
  });

  it('treats paint at or below the ground line as decorative', () => {
    expect(isLethalHazard(rect({ y: GROUND_Y }), GROUND_Y)).toBe(false);
    expect(isLethalHazard(rect({ y: GROUND_Y + 40 }), GROUND_Y)).toBe(false);
  });
});

describe('the shipped levels match the rule they document', () => {
  it('Level 1 declares only decorative pit markers, no lethal strips', () => {
    const level1 = LEVELS[0];
    const lethal = level1.hazards.filter((h) => isLethalHazard(h, GROUND_Y));
    // level1.ts calls these "Visual pit markers (non-lethal)"; that comment is
    // only true if none of them are lethal by the shared rule.
    expect(lethal).toEqual([]);
    expect(level1.hazards.length).toBeGreaterThan(0);
  });

  it('Level 2 declares exactly one lethal spike strip', () => {
    const level2 = LEVELS[1];
    const lethal = level2.hazards.filter((h) => isLethalHazard(h, GROUND_Y));
    expect(lethal).toHaveLength(1);
    expect(lethal[0].x).toBe(2360);
  });

  it('the pilot jumps exactly the strips the scene treats as lethal', () => {
    for (const level of LEVELS) {
      const lethal = level.hazards.filter((h) => isLethalHazard(h, GROUND_Y));
      expect(spikeRanges(level.hazards, GROUND_Y)).toHaveLength(lethal.length);
    }
  });
});
