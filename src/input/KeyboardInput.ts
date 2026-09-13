/**
 * Maps browser keyboard events to the normalized InputState.
 *
 * Layout follows the classic PC/emulated run-and-gun convention: the arrow
 * cluster is the D-pad (right hand) and Z/X are the face buttons (left hand),
 * with Z = jump and X = fire, matching NES-emulator and Cave Story defaults.
 * WASD, Space, and J/K/Enter are kept as aliases so the modern WASD layout
 * also works; the two sets do not collide.
 *
 * Aim-up has its own key (Up/W) and deliberately does NOT jump - sharing the
 * jump key made diagonal firing unusable.
 *
 * The key-to-action mapping and the raw-to-InputState projection are pure and
 * exported so they can be unit-tested without a DOM; the adapter below is a
 * thin event listener over them. Edge-triggered flags (jumpPressed /
 * firePressed) are derived by diffing against the previous step, so a held key
 * produces a single press.
 */

import { type InputState } from './InputState';

/** Logical key groups the game reacts to. */
export type KeyAction = 'left' | 'right' | 'up' | 'down' | 'jump' | 'fire';

export interface RawKeyState {
  left: boolean;
  right: boolean;
  /** Aim-up modifier (never jumps). */
  up: boolean;
  /** Crouch / drop-through / aim-down modifier. */
  down: boolean;
  jump: boolean;
  fire: boolean;
}

export function createRawKeyState(): RawKeyState {
  return { left: false, right: false, up: false, down: false, jump: false, fire: false };
}

const KEY_ACTIONS: Readonly<Record<string, KeyAction>> = {
  // Direction / aim: arrow cluster (primary) plus WASD (alias).
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  // Face buttons: Z jumps, X fires; Space and J/K/Enter stay as aliases.
  KeyZ: 'jump',
  Space: 'jump',
  KeyX: 'fire',
  KeyJ: 'fire',
  KeyK: 'fire',
  Enter: 'fire'
};

/**
 * Fallback map on the produced character, for keyboards/layouts where the
 * physical `code` is not the QWERTY position we expect. `code` is tried first.
 */
const CHAR_ACTIONS: Readonly<Record<string, KeyAction>> = {
  a: 'left',
  d: 'right',
  w: 'up',
  s: 'down',
  z: 'jump',
  x: 'fire',
  j: 'fire',
  k: 'fire'
};

/**
 * Last-resort map on the legacy `keyCode`. Needed when an IME is active: the
 * event can arrive with an empty `code` and `key === 'Process'`, and `keyCode`
 * is then the only surviving identity of the physical key.
 */
const KEYCODE_ACTIONS: Readonly<Record<number, KeyAction>> = {
  37: 'left',
  39: 'right',
  38: 'up',
  40: 'down',
  65: 'left', // A
  68: 'right', // D
  87: 'up', // W
  83: 'down', // S
  90: 'jump', // Z
  32: 'jump', // Space
  88: 'fire', // X
  74: 'fire', // J
  75: 'fire', // K
  13: 'fire' // Enter
};

/**
 * The logical action a key drives, or null when the game ignores it.
 *
 * Resolution order is deliberate: the physical `code` is layout- and
 * IME-independent so it wins; the produced character covers layouts that report
 * an unexpected code; `keyCode` is the last resort for IME events that carry
 * neither a usable code nor a real character.
 */
export function resolveKeyAction(code: string, key?: string, keyCode?: number): KeyAction | null {
  const byCode = KEY_ACTIONS[code];
  if (byCode !== undefined) {
    return byCode;
  }
  if (key !== undefined && key.length === 1) {
    const byChar = CHAR_ACTIONS[key.toLowerCase()];
    if (byChar !== undefined) {
      return byChar;
    }
  }
  if (keyCode !== undefined && keyCode > 0) {
    return KEYCODE_ACTIONS[keyCode] ?? null;
  }
  return null;
}

/**
 * Projects held-key state into one step of normalized input.
 *
 * `prevRaw` is the previous step's RAW KEY state, not a merged `InputState`.
 * That distinction is the whole point: an edge belongs to the device, and the
 * scene's merged input also carries whatever the gamepad, touch controls,
 * debug bridge and AI pilot asked for. Deriving edges from the merge meant that
 * while the pilot held jump, a human's first real press looked like a
 * continuation of it and was silently swallowed (TASK-025).
 */
export function buildInputFromRaw(raw: RawKeyState, prevRaw: RawKeyState): InputState {
  return {
    left: raw.left,
    right: raw.right,
    jumpHeld: raw.jump,
    jumpPressed: raw.jump && !prevRaw.jump,
    fireHeld: raw.fire,
    firePressed: raw.fire && !prevRaw.fire,
    crouch: raw.down,
    drop: raw.down,
    aimUp: raw.up,
    aimDown: raw.down
  };
}

export interface KeyboardInput {
  /**
   * Build the input for one step. The adapter tracks its own previous key
   * state, so no caller can hand it someone else's held flags.
   */
  build(): InputState;
  attach(target: Window): void;
  detach(target: Window): void;
  /** Neutralizes all held keys (e.g. on window focus loss). */
  clear(): void;
}

export function createKeyboardInput(): KeyboardInput {
  const raw = createRawKeyState();
  let prevRaw = createRawKeyState();

  const applyEvent = (event: KeyboardEvent, down: boolean): void => {
    // Resolve by physical key even while an IME reports composition: this game
    // has no text fields, so a composing IME must never make the controls dead.
    const action = resolveKeyAction(event.code, event.key, event.keyCode);
    if (action === null) {
      return;
    }
    event.preventDefault();
    if (down && event.repeat) {
      return;
    }
    raw[action] = down;
  };

  const onKeyDown = (event: KeyboardEvent): void => applyEvent(event, true);
  const onKeyUp = (event: KeyboardEvent): void => applyEvent(event, false);

  return {
    build(): InputState {
      const input = buildInputFromRaw(raw, prevRaw);
      prevRaw = { ...raw };
      return input;
    },
    attach(target: Window): void {
      // Capture phase on `window` runs before any document- or element-level
      // listener in either phase, so browser extensions that claim bare letters
      // (video-speed controllers bind S/D/Z/X) cannot silently eat the controls.
      target.addEventListener('keydown', onKeyDown, true);
      target.addEventListener('keyup', onKeyUp, true);
    },
    detach(target: Window): void {
      target.removeEventListener('keydown', onKeyDown, true);
      target.removeEventListener('keyup', onKeyUp, true);
    },
    clear(): void {
      // Focus loss drops every held key without a matching keyup. Clearing the
      // remembered state too means a key that is still physically down edges
      // again on the next press instead of being stuck "already held".
      Object.assign(raw, createRawKeyState());
      prevRaw = createRawKeyState();
    }
  };
}
