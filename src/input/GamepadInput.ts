import { createNeutralInput, type InputState } from './InputState';

/**
 * Gamepad support built on the browser Gamepad API (GAME_REQUIREMENTS.md
 * section 2, ACCEPTANCE_CRITERIA H2).
 *
 * The pure `mapGamepadSnapshot` turns a polled snapshot into the normalized
 * InputState (D-pad/left stick to move + aim, A jump, X/RB fire, Start pause).
 * The browser adapter polls `navigator.getGamepads()` each step and tracks
 * edge-triggered jump/fire/pause presses internally. Gamepads only report
 * after the first user interaction, which matches the autoplay/unlock rules.
 */

export interface GamepadSnapshot {
  axes: number[];
  buttons: { pressed: boolean }[];
  connected: boolean;
}

const DEADZONE = 0.35;
const BTN_A = 0;
const BTN_X = 2;
const BTN_RB = 5;
const BTN_BACK = 8;
const BTN_START = 9;
const BTN_DUP = 12;
const BTN_DDOWN = 13;
const BTN_DLEFT = 14;
const BTN_DRIGHT = 15;

export function mapGamepadSnapshot(snap: GamepadSnapshot): InputState {
  const input = createNeutralInput();
  if (!snap.connected) {
    return input;
  }
  const ax = snap.axes[0] ?? 0;
  const ay = snap.axes[1] ?? 0;
  const btn = (i: number): boolean => snap.buttons[i]?.pressed ?? false;

  const left = ax < -DEADZONE || btn(BTN_DLEFT);
  const right = ax > DEADZONE || btn(BTN_DRIGHT);
  const up = ay < -DEADZONE || btn(BTN_DUP);
  const down = ay > DEADZONE || btn(BTN_DDOWN);

  return {
    ...input,
    left,
    right,
    jumpHeld: btn(BTN_A),
    fireHeld: btn(BTN_X) || btn(BTN_RB),
    crouch: down,
    drop: down,
    aimUp: up,
    aimDown: down
  };
}

export interface GamepadInput {
  /** Polled input for one step; edge flags are tracked inside the adapter. */
  build(): InputState;
  /** Edge-triggered Start-button press, consumed on read. */
  pauseEdge(): boolean;
  /** Edge-triggered Back/Select-button press, consumed on read. */
  backEdge(): boolean;
}

export function createGamepadInput(
  poll: () => GamepadSnapshot = pollFirstGamepad
): GamepadInput {
  let prevJump = false;
  let prevFire = false;
  let prevStart = false;
  let prevBack = false;
  let startEdge = false;
  let backEdge = false;

  return {
    build(): InputState {
      const snap = poll();
      const mapped = mapGamepadSnapshot(snap);
      const jumpPressed = mapped.jumpHeld && !prevJump;
      const firePressed = mapped.fireHeld && !prevFire;
      prevJump = mapped.jumpHeld;
      prevFire = mapped.fireHeld;

      const start = snap.connected ? snap.buttons[BTN_START]?.pressed ?? false : false;
      startEdge = start && !prevStart;
      prevStart = start;

      const back = snap.connected ? snap.buttons[BTN_BACK]?.pressed ?? false : false;
      backEdge = back && !prevBack;
      prevBack = back;

      return { ...mapped, jumpPressed, firePressed };
    },
    pauseEdge(): boolean {
      const edge = startEdge;
      startEdge = false;
      return edge;
    },
    backEdge(): boolean {
      const edge = backEdge;
      backEdge = false;
      return edge;
    }
  };
}

function pollFirstGamepad(): GamepadSnapshot {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
      return { axes: [], buttons: [], connected: false };
    }
    const pads = navigator.getGamepads();
    for (const pad of pads) {
      if (pad && pad.connected) {
        return {
          axes: Array.from(pad.axes),
          buttons: pad.buttons.map((b) => ({ pressed: b.pressed })),
          connected: true
        };
      }
    }
  } catch {
    /* fall through to disconnected */
  }
  return { axes: [], buttons: [], connected: false };
}
