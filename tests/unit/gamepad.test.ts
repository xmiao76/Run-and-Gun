import { describe, expect, it } from 'vitest';
import { createGamepadInput, mapGamepadSnapshot, type GamepadSnapshot } from '../../src/input/GamepadInput';

function snap(axes: number[], pressed: number[]): GamepadSnapshot {
  const buttons = Array.from({ length: 16 }, (_, i) => ({ pressed: pressed.includes(i) }));
  return { axes, buttons, connected: true };
}

describe('gamepad snapshot mapping', () => {
  it('maps left stick and dpad to movement and aim', () => {
    expect(mapGamepadSnapshot(snap([-1, 0], [])).left).toBe(true);
    expect(mapGamepadSnapshot(snap([1, 0], [])).right).toBe(true);
    expect(mapGamepadSnapshot(snap([0, -1], [])).aimUp).toBe(true);
    expect(mapGamepadSnapshot(snap([0, 1], [])).aimDown).toBe(true);
    expect(mapGamepadSnapshot(snap([0, 0], [14])).left).toBe(true);
    expect(mapGamepadSnapshot(snap([0, 0], [15])).right).toBe(true);
  });

  it('ignores input inside the deadzone', () => {
    const input = mapGamepadSnapshot(snap([0.1, -0.1], []));
    expect(input.left).toBe(false);
    expect(input.right).toBe(false);
    expect(input.aimUp).toBe(false);
  });

  it('maps A to jump and X/RB to fire', () => {
    expect(mapGamepadSnapshot(snap([0, 0], [0])).jumpHeld).toBe(true);
    expect(mapGamepadSnapshot(snap([0, 0], [2])).fireHeld).toBe(true);
    expect(mapGamepadSnapshot(snap([0, 0], [5])).fireHeld).toBe(true);
  });

  it('returns neutral input when disconnected', () => {
    const input = mapGamepadSnapshot({ axes: [1, 1], buttons: [{ pressed: true }], connected: false });
    expect(input.left).toBe(false);
    expect(input.jumpHeld).toBe(false);
  });
});

describe('gamepad adapter edge detection', () => {
  it('edge-triggers jump, fire, and pause exactly once per press', () => {
    let state = snap([0, 0], [0, 2, 9]);
    const pad = createGamepadInput(() => state);

    const first = pad.build();
    expect(first.jumpPressed).toBe(true);
    expect(first.firePressed).toBe(true);
    expect(pad.pauseEdge()).toBe(true);

    // Held: no repeat edges.
    const second = pad.build();
    expect(second.jumpPressed).toBe(false);
    expect(second.firePressed).toBe(false);
    expect(pad.pauseEdge()).toBe(false);

    // Release and press again: a fresh edge.
    state = snap([0, 0], []);
    pad.build();
    state = snap([0, 0], [0, 9]);
    const third = pad.build();
    expect(third.jumpPressed).toBe(true);
    expect(pad.pauseEdge()).toBe(true);
  });

  it('edge-triggers the Back button independently of Start', () => {
    let state = snap([0, 0], [8]);
    const pad = createGamepadInput(() => state);

    pad.build();
    expect(pad.backEdge()).toBe(true);
    expect(pad.pauseEdge()).toBe(false);

    // Held: no repeat.
    pad.build();
    expect(pad.backEdge()).toBe(false);

    // Release, then a fresh press.
    state = snap([0, 0], []);
    pad.build();
    state = snap([0, 0], [8]);
    pad.build();
    expect(pad.backEdge()).toBe(true);
  });
});
