import { describe, expect, it } from 'vitest';

import {
  buildInputFromRaw,
  createKeyboardInput,
  createRawKeyState,
  resolveKeyAction,
  type RawKeyState
} from '../../src/input/KeyboardInput';

function raw(overrides: Partial<RawKeyState> = {}): RawKeyState {
  return { ...createRawKeyState(), ...overrides };
}

describe('resolveKeyAction', () => {
  it('maps the arrow cluster to movement and aiming', () => {
    expect(resolveKeyAction('ArrowLeft')).toBe('left');
    expect(resolveKeyAction('ArrowRight')).toBe('right');
    expect(resolveKeyAction('ArrowUp')).toBe('up');
    expect(resolveKeyAction('ArrowDown')).toBe('down');
  });

  // NES-emulator convention: Z = A button = jump, X = B button = shoot.
  it('maps Z to jump and X to fire (classic left-hand layout)', () => {
    expect(resolveKeyAction('KeyZ')).toBe('jump');
    expect(resolveKeyAction('KeyX')).toBe('fire');
  });

  it('keeps Space/J/Enter as jump and fire aliases', () => {
    expect(resolveKeyAction('Space')).toBe('jump');
    expect(resolveKeyAction('KeyJ')).toBe('fire');
    expect(resolveKeyAction('KeyK')).toBe('fire');
    expect(resolveKeyAction('Enter')).toBe('fire');
  });

  it('keeps WASD as movement and aim aliases', () => {
    expect(resolveKeyAction('KeyA')).toBe('left');
    expect(resolveKeyAction('KeyD')).toBe('right');
    expect(resolveKeyAction('KeyW')).toBe('up');
    expect(resolveKeyAction('KeyS')).toBe('down');
  });

  it('does NOT map any aim-up key to jump (regression: Up used to jump)', () => {
    expect(resolveKeyAction('ArrowUp')).not.toBe('jump');
    expect(resolveKeyAction('KeyW')).not.toBe('jump');
  });

  it('ignores keys the game does not use', () => {
    expect(resolveKeyAction('KeyQ')).toBeNull();
    expect(resolveKeyAction('F5')).toBeNull();
  });

  it('falls back to the produced character when the code is unrecognised', () => {
    // Layouts that report an unexpected physical code still work.
    expect(resolveKeyAction('Unidentified', 'x')).toBe('fire');
    expect(resolveKeyAction('', 'z')).toBe('jump');
    expect(resolveKeyAction('Unidentified', 'X')).toBe('fire');
  });

  it('prefers the physical code over the character', () => {
    // Dvorak-style: physical KeyX produces 'q'; the binding follows the key.
    expect(resolveKeyAction('KeyX', 'q')).toBe('fire');
  });

  it('does not treat multi-character key names as characters', () => {
    expect(resolveKeyAction('Unidentified', 'Shift')).toBeNull();
    expect(resolveKeyAction('Unidentified', 'Process')).toBeNull();
  });

  // With an IME active the event can arrive with no usable code and
  // key === 'Process'; keyCode is then the only surviving key identity.
  it('falls back to the legacy keyCode when code and key are both unusable', () => {
    expect(resolveKeyAction('', 'Process', 90)).toBe('jump'); // Z
    expect(resolveKeyAction('', 'Process', 88)).toBe('fire'); // X
    expect(resolveKeyAction('Unidentified', 'Process', 39)).toBe('right');
    expect(resolveKeyAction('', 'Process', 38)).toBe('up');
  });

  it('ignores an unmapped keyCode', () => {
    expect(resolveKeyAction('', 'Process', 81)).toBeNull(); // Q
    expect(resolveKeyAction('', 'Process', 0)).toBeNull();
  });
});

describe('buildInputFromRaw', () => {
  // The previous state is a RAW KEY state, not a merged InputState: an edge
  // belongs to the device, not to whatever the scene OR-ed together last step.
  const prev = createRawKeyState();

  it('routes the up key to aim-up only, never to jumping', () => {
    const input = buildInputFromRaw(raw({ up: true }), prev);
    expect(input.aimUp).toBe(true);
    expect(input.jumpHeld).toBe(false);
    expect(input.jumpPressed).toBe(false);
  });

  it('routes the down key to crouch, drop, and aim-down together', () => {
    const input = buildInputFromRaw(raw({ down: true }), prev);
    expect(input.crouch).toBe(true);
    expect(input.drop).toBe(true);
    expect(input.aimDown).toBe(true);
  });

  it('supports an up-forward diagonal: right + aim up while firing', () => {
    const input = buildInputFromRaw(raw({ right: true, up: true, fire: true }), prev);
    expect(input.right).toBe(true);
    expect(input.aimUp).toBe(true);
    expect(input.fireHeld).toBe(true);
    expect(input.jumpHeld).toBe(false);
  });

  it('edge-triggers jump and fire once per press', () => {
    const held = raw({ jump: true, fire: true });
    const first = buildInputFromRaw(held, prev);
    expect(first.jumpPressed).toBe(true);
    expect(first.firePressed).toBe(true);

    // Still held on the next step: no repeat edge.
    const second = buildInputFromRaw(held, held);
    expect(second.jumpPressed).toBe(false);
    expect(second.firePressed).toBe(false);
    expect(second.jumpHeld).toBe(true);
    expect(second.fireHeld).toBe(true);
  });
});

/**
 * TASK-025 regression.
 *
 * Edges used to be derived from the previous step's MERGED input, which the
 * level scene assembles from keyboard + gamepad + touch + debug bridge + AI
 * pilot. So while the pilot held jump or fire, a human's first real press read
 * as a continuation of the pilot's hold and its edge was silently dropped - the
 * player had to release and press again before a takeover registered.
 *
 * An edge belongs to the DEVICE, so it is now derived from the previous raw key
 * state and nothing else. The adapter owns that state, which makes the old
 * misuse impossible to express.
 */
describe('keyboard edges are independent of other input sources (TASK-025)', () => {
  /** Minimal Window stand-in: unit tests run in the node environment. */
  function stubWindow() {
    const listeners: Record<string, Array<(e: unknown) => void>> = {};
    const target = {
      addEventListener(type: string, fn: (e: unknown) => void) {
        (listeners[type] ??= []).push(fn);
      },
      removeEventListener(type: string, fn: (e: unknown) => void) {
        listeners[type] = (listeners[type] ?? []).filter((f) => f !== fn);
      },
      send(type: string, code: string) {
        for (const fn of listeners[type] ?? []) {
          fn({ code, key: undefined, keyCode: 0, repeat: false, preventDefault() {} });
        }
      }
    };
    return target;
  }

  function attached() {
    const win = stubWindow();
    const keyboard = createKeyboardInput();
    keyboard.attach(win as unknown as Window);
    return { win, keyboard };
  }

  it('edges once on a fresh press and not again while held', () => {
    const { win, keyboard } = attached();

    win.send('keydown', 'KeyZ');
    const first = keyboard.build();
    expect(first.jumpHeld).toBe(true);
    expect(first.jumpPressed).toBe(true);

    const second = keyboard.build();
    expect(second.jumpHeld).toBe(true);
    expect(second.jumpPressed).toBe(false);
  });

  it('produces a new edge after a release and a second press', () => {
    const { win, keyboard } = attached();

    win.send('keydown', 'KeyX');
    expect(keyboard.build().firePressed).toBe(true);
    keyboard.build();

    win.send('keyup', 'KeyX');
    keyboard.build();

    win.send('keydown', 'KeyX');
    expect(keyboard.build().firePressed).toBe(true);
  });

  it('lets a key edge again after clear(), so focus loss cannot wedge it', () => {
    const { win, keyboard } = attached();

    win.send('keydown', 'KeyZ');
    expect(keyboard.build().jumpPressed).toBe(true);
    keyboard.build();

    // Window blur: every held key is dropped without a matching keyup.
    keyboard.clear();
    expect(keyboard.build().jumpHeld).toBe(false);

    win.send('keydown', 'KeyZ');
    expect(keyboard.build().jumpPressed).toBe(true);
  });
});
