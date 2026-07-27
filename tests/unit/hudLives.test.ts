import { describe, expect, it } from 'vitest';

import { lifeHudLayout, MAX_LIFE_ICONS } from '../../src/ui/hudLives';
import { STARTING_LIVES_OPTIONS } from '../../src/persistence/schema';

describe('lifeHudLayout', () => {
  it('shows one icon per life at small counts, with no label', () => {
    expect(lifeHudLayout(3)).toEqual({ icons: 3, countLabel: null });
    expect(lifeHudLayout(1)).toEqual({ icons: 1, countLabel: null });
    expect(lifeHudLayout(MAX_LIFE_ICONS)).toEqual({ icons: MAX_LIFE_ICONS, countLabel: null });
  });

  it('collapses to a single icon plus a multiplier past the icon limit', () => {
    expect(lifeHudLayout(MAX_LIFE_ICONS + 1)).toEqual({ icons: 1, countLabel: 'x6' });
    expect(lifeHudLayout(30)).toEqual({ icons: 1, countLabel: 'x30' });
  });

  it('never asks for more icons than the pool provides, for any offered option', () => {
    for (const lives of STARTING_LIVES_OPTIONS) {
      expect(lifeHudLayout(lives).icons).toBeLessThanOrEqual(MAX_LIFE_ICONS);
    }
  });

  it('handles zero and junk without producing negative or fractional icons', () => {
    expect(lifeHudLayout(0)).toEqual({ icons: 0, countLabel: null });
    expect(lifeHudLayout(-4)).toEqual({ icons: 0, countLabel: null });
    expect(lifeHudLayout(2.7)).toEqual({ icons: 2, countLabel: null });
    expect(lifeHudLayout(Number.NaN)).toEqual({ icons: 0, countLabel: null });
  });
});
