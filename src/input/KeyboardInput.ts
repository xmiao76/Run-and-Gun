/**
 * Maps browser keyboard events to the normalized InputState.
 *
 * The adapter only tracks raw key-down membership; edge-triggered flags
 * (jumpPressed / firePressed) are derived by diffing against the previous step
 * so a held key produces a single press. Game keys cancel their default browser
 * behaviour (e.g. Space scrolling the page).
 */

import { type InputState } from './InputState';

interface RawKeyState {
  left: boolean;
  right: boolean;
  jump: boolean;
  fire: boolean;
  down: boolean;
}

const JUMP_KEYS = new Set(['Space', 'KeyW', 'ArrowUp']);
const FIRE_KEYS = new Set(['KeyJ', 'KeyK', 'Enter']);
const DOWN_KEYS = new Set(['KeyS', 'ArrowDown']);

const GAME_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'KeyA',
  'KeyD',
  'KeyW',
  'KeyS',
  'Space',
  'KeyJ',
  'KeyK',
  'Enter'
]);

export interface KeyboardInput {
  /** Build the input for one step, given the previous step's edge flags. */
  build(prev: InputState): InputState;
  attach(target: Window): void;
  detach(target: Window): void;
}

export function createKeyboardInput(): KeyboardInput {
  const raw: RawKeyState = { left: false, right: false, jump: false, fire: false, down: false };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (!GAME_KEYS.has(event.code)) {
      return;
    }
    event.preventDefault();
    if (event.repeat) {
      return;
    }
    applyKey(raw, event.code, true);
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    if (!GAME_KEYS.has(event.code)) {
      return;
    }
    event.preventDefault();
    applyKey(raw, event.code, false);
  };

  return {
    build(prev: InputState): InputState {
      const jumpHeld = raw.jump;
      const fireHeld = raw.fire;
      return {
        left: raw.left,
        right: raw.right,
        jumpHeld,
        jumpPressed: jumpHeld && !prev.jumpHeld,
        fireHeld,
        firePressed: fireHeld && !prev.fireHeld,
        crouch: raw.down,
        drop: raw.down
      };
    },
    attach(target: Window): void {
      target.addEventListener('keydown', onKeyDown);
      target.addEventListener('keyup', onKeyUp);
    },
    detach(target: Window): void {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
    }
  };
}

function applyKey(raw: RawKeyState, code: string, down: boolean): void {
  if (code === 'ArrowLeft' || code === 'KeyA') {
    raw.left = down;
  } else if (code === 'ArrowRight' || code === 'KeyD') {
    raw.right = down;
  } else if (JUMP_KEYS.has(code)) {
    raw.jump = down;
  } else if (FIRE_KEYS.has(code)) {
    raw.fire = down;
  } else if (DOWN_KEYS.has(code)) {
    raw.down = down;
  }
}
