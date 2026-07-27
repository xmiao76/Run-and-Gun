import { describe, expect, it } from 'vitest';

import { shakeFor, type ShakeEvent } from '../../src/ui/screenShake';

const EVENTS: ShakeEvent[] = ['bossHit', 'explosion', 'playerDeath', 'bossDefeat'];

describe('shakeFor', () => {
  it('returns a shake for every combat event', () => {
    for (const event of EVENTS) {
      const spec = shakeFor(event, false);
      expect(spec, event).not.toBeNull();
      expect(spec!.duration).toBeGreaterThan(0);
      expect(spec!.intensity).toBeGreaterThan(0);
    }
  });

  it('suppresses shake entirely under the reduced-flash setting', () => {
    for (const event of EVENTS) {
      expect(shakeFor(event, true), event).toBeNull();
    }
  });

  it('scales intensity with how significant the event is', () => {
    const bossHit = shakeFor('bossHit', false)!;
    const explosion = shakeFor('explosion', false)!;
    const death = shakeFor('playerDeath', false)!;
    const defeat = shakeFor('bossDefeat', false)!;
    expect(bossHit.intensity).toBeLessThan(explosion.intensity);
    expect(explosion.intensity).toBeLessThan(death.intensity);
    expect(death.intensity).toBeLessThan(defeat.intensity);
  });

  it('keeps intensities subtle enough not to obscure the action', () => {
    for (const event of EVENTS) {
      // Phaser intensity is a fraction of viewport size; beyond ~2% the screen
      // becomes hard to read during a fight.
      expect(shakeFor(event, false)!.intensity).toBeLessThanOrEqual(0.02);
      expect(shakeFor(event, false)!.duration).toBeLessThanOrEqual(500);
    }
  });
});
