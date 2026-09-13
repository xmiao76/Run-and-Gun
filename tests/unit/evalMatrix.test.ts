import { describe, expect, it } from 'vitest';

import { LEVELS as MATRIX_LEVELS } from '../../scripts/eval/matrix.mjs';
import { LEVELS as GAME_LEVELS } from '../../src/levels/levels';

/**
 * TASK-039: keep the eval matrix in step with the game.
 *
 * The harness is plain Node and cannot import the game's TypeScript level
 * list, so its level numbers are declared by hand. That is fine right up until
 * someone adds a stage and forgets - at which point the new level is simply
 * never evaluated, and nothing anywhere says so. This test is the tripwire for
 * exactly that.
 */
describe('eval matrix coverage', () => {
  it('evaluates every level the game ships', () => {
    expect(MATRIX_LEVELS.length).toBe(GAME_LEVELS.length);
  });

  it('numbers levels from 1, matching the startLevelN debug commands', () => {
    expect(MATRIX_LEVELS).toEqual(GAME_LEVELS.map((_, i) => i + 1));
  });
});
