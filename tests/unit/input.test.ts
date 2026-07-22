import { describe, expect, it } from 'vitest';
import { createNeutralInput, mergeInput } from '../../src/input/InputState';

describe('input merging and pause-neutralized state', () => {
  it('OR-merges two input sources', () => {
    const keyboard = { ...createNeutralInput(), right: true };
    const debug = { ...createNeutralInput(), jumpPressed: true };
    const merged = mergeInput(keyboard, debug);
    expect(merged.right).toBe(true);
    expect(merged.jumpPressed).toBe(true);
    expect(merged.left).toBe(false);
  });

  it('a neutral (paused) input contributes no actions when merged', () => {
    const device = { ...createNeutralInput(), left: true, fireHeld: true, jumpPressed: true };
    const paused = createNeutralInput();
    // Pausing neutralizes the device by replacing it with neutral input.
    const effective = mergeInput(paused, paused);
    expect(effective).toEqual(createNeutralInput());
    // And merging neutral over a device leaves the device intact only if not paused.
    expect(mergeInput(device, paused).left).toBe(true);
  });

  it('edge flags are independent between sources', () => {
    const a = { ...createNeutralInput(), firePressed: true };
    const b = { ...createNeutralInput(), fireHeld: true };
    const merged = mergeInput(a, b);
    expect(merged.firePressed).toBe(true);
    expect(merged.fireHeld).toBe(true);
  });
});
