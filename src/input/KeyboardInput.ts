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

/** The logical action a physical key drives, or null when the game ignores it. */
export function resolveKeyAction(code: string): KeyAction | null {
  return KEY_ACTIONS[code] ?? null;
}

/**
 * Projects held-key state into one step of normalized input. `prev` supplies
 * the previous step's held flags so jump/fire edges fire exactly once.
 */
export function buildInputFromRaw(raw: RawKeyState, prev: InputState): InputState {
  return {
    left: raw.left,
    right: raw.right,
    jumpHeld: raw.jump,
    jumpPressed: raw.jump && !prev.jumpHeld,
    fireHeld: raw.fire,
    firePressed: raw.fire && !prev.fireHeld,
    crouch: raw.down,
    drop: raw.down,
    aimUp: raw.up,
    aimDown: raw.down
  };
}

export interface KeyboardInput {
  /** Build the input for one step, given the previous step's edge flags. */
  build(prev: InputState): InputState;
  attach(target: Window): void;
  detach(target: Window): void;
  /** Neutralizes all held keys (e.g. on window focus loss). */
  clear(): void;
}

export function createKeyboardInput(): KeyboardInput {
  const raw = createRawKeyState();

  const applyEvent = (event: KeyboardEvent, down: boolean): void => {
    const action = resolveKeyAction(event.code);
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
    build(prev: InputState): InputState {
      return buildInputFromRaw(raw, prev);
    },
    attach(target: Window): void {
      target.addEventListener('keydown', onKeyDown);
      target.addEventListener('keyup', onKeyUp);
    },
    detach(target: Window): void {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
    },
    clear(): void {
      Object.assign(raw, createRawKeyState());
    }
  };
}
