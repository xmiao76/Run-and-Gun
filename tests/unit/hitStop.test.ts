import { describe, expect, it } from 'vitest';

import {
  createHitStop,
  hitStopFor,
  isFrozen,
  tickHitStop,
  triggerHitStop,
  type HitStopEvent
} from '../../src/ui/hitStop';

/**
 * TASK-037: the hit-stop state machine.
 *
 * Freezes are counted in simulation steps, so the whole machine is testable
 * without a scene, a clock, or a browser.
 */

const EVENTS: HitStopEvent[] = ['bossHit', 'playerDeath', 'bossDefeat'];

describe('hitStopFor', () => {
  it('scales the freeze with the weight of the event', () => {
    expect(hitStopFor('bossHit', false)).toBeLessThan(hitStopFor('playerDeath', false));
    expect(hitStopFor('playerDeath', false)).toBeLessThan(hitStopFor('bossDefeat', false));
  });

  it('keeps every freeze short enough to read as impact, not as a dropped frame', () => {
    for (const event of EVENTS) {
      expect(hitStopFor(event, false), event).toBeGreaterThan(0);
      // A sixth of a second at 60 Hz.
      expect(hitStopFor(event, false), event).toBeLessThanOrEqual(10);
    }
  });

  it('suppresses every freeze under reduced flash', () => {
    for (const event of EVENTS) {
      expect(hitStopFor(event, true), event).toBe(0);
    }
  });
});

describe('the freeze state machine', () => {
  it('starts running, not frozen', () => {
    expect(isFrozen(createHitStop())).toBe(false);
  });

  it('freezes for exactly the number of steps the event asks for', () => {
    let state = triggerHitStop(createHitStop(), 'playerDeath', false);
    const want = hitStopFor('playerDeath', false);

    let frozenSteps = 0;
    for (let i = 0; i < want + 5; i++) {
      const result = tickHitStop(state);
      state = result.state;
      if (result.frozen) {
        frozenSteps += 1;
      }
    }
    expect(frozenSteps).toBe(want);
    expect(isFrozen(state)).toBe(false);
  });

  it('never freezes at all under reduced flash', () => {
    const state = triggerHitStop(createHitStop(), 'bossDefeat', true);
    expect(isFrozen(state)).toBe(false);
    expect(tickHitStop(state).frozen).toBe(false);
  });

  it('takes the longer freeze instead of stacking them', () => {
    // Rapid fire lands a bossHit every few steps. If those stacked, doing well
    // against a boss would grind the game to a halt.
    let state = triggerHitStop(createHitStop(), 'bossHit', false);
    const one = state.stepsRemaining;
    for (let i = 0; i < 5; i++) {
      state = triggerHitStop(state, 'bossHit', false);
    }
    expect(state.stepsRemaining).toBe(one);
  });

  it('lets a heavier event upgrade a freeze already running', () => {
    let state = triggerHitStop(createHitStop(), 'bossHit', false);
    state = triggerHitStop(state, 'bossDefeat', false);
    expect(state.stepsRemaining).toBe(hitStopFor('bossDefeat', false));
  });

  it('does not let a lighter event shorten a heavier freeze already running', () => {
    let state = triggerHitStop(createHitStop(), 'bossDefeat', false);
    const heavy = state.stepsRemaining;
    state = triggerHitStop(state, 'bossHit', false);
    expect(state.stepsRemaining).toBe(heavy);
  });

  it('reports the freeze on the step that consumes it, not one step late', () => {
    // Off-by-one here would hold the world for the wrong step and let one
    // frame of movement slip through the freeze. Driven off a multi-step event
    // and its own declared length, so tuning a freeze cannot silently make
    // this assertion vacuous.
    const want = hitStopFor('playerDeath', false);
    expect(want).toBeGreaterThan(1);
    let state = triggerHitStop(createHitStop(), 'playerDeath', false);
    for (let i = 0; i < want; i++) {
      const result = tickHitStop(state);
      expect(result.frozen, `step ${i} of ${want}`).toBe(true);
      expect(result.state.stepsRemaining).toBe(state.stepsRemaining - 1);
      state = result.state;
    }
    expect(state.stepsRemaining).toBe(0);
    expect(tickHitStop(state).frozen).toBe(false);
  });

  it('rate limits repeated boss hits so sustained fire cannot freeze the fight solid', () => {
    // The regression this exists for: the eval matrix caught a point-blank
    // policy blowing its whole step budget, because a boss hit every six steps
    // was freezing two of them. Measured here as the frozen fraction of a long
    // burst at the Rapid Carbine's rate.
    const FIRE_EVERY = 6;
    const STEPS = 600;
    let state = createHitStop();
    let frozenSteps = 0;
    for (let i = 0; i < STEPS; i++) {
      if (i % FIRE_EVERY === 0) {
        state = triggerHitStop(state, 'bossHit', false);
      }
      const result = tickHitStop(state);
      state = result.state;
      if (result.frozen) {
        frozenSteps += 1;
      }
    }
    // Comfortably under a tenth of the fight, rather than the third it was.
    expect(frozenSteps / STEPS).toBeLessThan(0.1);
    // ...but not zero: hits must still land with a jolt.
    expect(frozenSteps).toBeGreaterThan(0);
  });

  it('lets a repeated event freeze again once the gap has passed', () => {
    let state = triggerHitStop(createHitStop(), 'bossHit', false);
    expect(isFrozen(state)).toBe(true);
    for (let i = 0; i < 40; i++) {
      state = tickHitStop(state).state;
    }
    expect(isFrozen(state)).toBe(false);
    state = triggerHitStop(state, 'bossHit', false);
    expect(isFrozen(state)).toBe(true);
  });

  it('never rate limits a one-shot event, however recently a hit froze', () => {
    // A player death or a boss defeat must always land, even if a boss hit
    // froze the world a step earlier.
    let state = triggerHitStop(createHitStop(), 'bossHit', false);
    state = tickHitStop(state).state;
    state = triggerHitStop(state, 'playerDeath', false);
    expect(state.stepsRemaining).toBe(hitStopFor('playerDeath', false));
  });

  it('is immutable: ticking never edits the state handed to it', () => {
    const state = triggerHitStop(createHitStop(), 'playerDeath', false);
    const before = state.stepsRemaining;
    tickHitStop(state);
    expect(state.stepsRemaining).toBe(before);
  });
});
