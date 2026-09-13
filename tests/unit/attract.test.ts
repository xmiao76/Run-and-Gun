import { describe, expect, it } from 'vitest';

import { attractDelayMs, ATTRACT_DELAY_MS } from '../../src/ui/attract';

/**
 * Attract mode must be invisible to automation and effortless for a person:
 * "a human watches the demo, a machine never does". These pin both halves.
 */

describe('attractDelayMs', () => {
  it('arms with the arcade delay for a plain visitor', () => {
    expect(attractDelayMs('', false, false)).toBe(ATTRACT_DELAY_MS);
    expect(attractDelayMs('?foo=1', false, false)).toBe(ATTRACT_DELAY_MS);
  });

  it('is suppressed under the debug bridge', () => {
    expect(attractDelayMs('?debug=1', true, false)).toBeNull();
    // Debug in dev mode suppresses too, even with no param.
    expect(attractDelayMs('', true, false)).toBeNull();
  });

  it('is suppressed under the manual clock', () => {
    expect(attractDelayMs('?manualClock=1', false, true)).toBeNull();
  });

  it('is suppressed when the title is skipped by autopilot', () => {
    expect(attractDelayMs('?autopilot=1', false, false)).toBeNull();
    expect(attractDelayMs('?autopilot=remote', false, false)).toBeNull();
  });

  it('the attractMs override forces the demo on, even under automation', () => {
    // This is the seam the e2e suite drives.
    expect(attractDelayMs('?debug=1&attractMs=250', true, false)).toBe(250);
    expect(attractDelayMs('?manualClock=1&attractMs=100', true, true)).toBe(100);
  });

  it('rejects a malformed override rather than guessing a delay', () => {
    expect(attractDelayMs('?attractMs=soon', false, false)).toBeNull();
  });
});
