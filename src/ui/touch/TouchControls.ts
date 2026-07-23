import { createNeutralInput, type InputState } from '../../input/InputState';

/**
 * Touch controls for coarse-pointer devices (GAME_REQUIREMENTS.md section 2,
 * ACCEPTANCE_CRITERIA H3).
 *
 * Renders DOM buttons (move, aim-up, jump, fire, pause) over the canvas only
 * when a touch device is detected. Buttons feed the same normalized InputState
 * as every other device; the scene merges them with keyboard/gamepad/debug.
 */

export function isTouchDevice(): boolean {
  try {
    if (typeof window === 'undefined') {
      return false;
    }
    if ('ontouchstart' in window) {
      return true;
    }
    if (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) {
      return true;
    }
    return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

export interface TouchControls {
  /** Snapshot of current touch input; edge flags are consumed by this read. */
  read(): InputState;
  /** Edge-triggered pause-button press, consumed on read. */
  consumePauseEdge(): boolean;
  destroy(): void;
}

const BTN_BASE: Partial<CSSStyleDeclaration> = {
  position: 'absolute',
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  background: 'rgba(40,52,80,0.55)',
  color: '#e8f1ff',
  border: '2px solid rgba(140,160,200,0.6)',
  fontFamily: 'monospace',
  fontSize: '18px',
  pointerEvents: 'auto',
  touchAction: 'none',
  userSelect: 'none'
};

export function createTouchControls(): TouchControls {
  const state: InputState = createNeutralInput();
  let pauseEdge = false;

  const root = document.createElement('div');
  root.id = 'touch-ui';
  Object.assign(root.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '10'
  } as CSSStyleDeclaration);

  const mkBtn = (label: string, style: Partial<CSSStyleDeclaration>, onDown: () => void, onUp: () => void): void => {
    const b = document.createElement('button');
    b.className = 'touch-btn';
    b.textContent = label;
    Object.assign(b.style, BTN_BASE, style);
    const down = (e: Event): void => {
      e.preventDefault();
      onDown();
    };
    const up = (e: Event): void => {
      e.preventDefault();
      onUp();
    };
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up);
    b.addEventListener('pointercancel', up);
    b.addEventListener('pointerleave', up);
    root.appendChild(b);
  };

  mkBtn('◀', { left: '16px', bottom: '16px' }, () => { state.left = true; }, () => { state.left = false; });
  mkBtn('▶', { left: '96px', bottom: '16px' }, () => { state.right = true; }, () => { state.right = false; });
  mkBtn('▲', { right: '176px', bottom: '16px' }, () => { state.aimUp = true; }, () => { state.aimUp = false; });
  mkBtn('JUMP', { right: '96px', bottom: '16px' }, () => { state.jumpHeld = true; state.jumpPressed = true; }, () => { state.jumpHeld = false; });
  mkBtn('FIRE', { right: '16px', bottom: '16px' }, () => { state.fireHeld = true; state.firePressed = true; }, () => { state.fireHeld = false; });
  mkBtn('⏸', { right: '16px', top: '16px', width: '48px', height: '48px', fontSize: '15px' }, () => { pauseEdge = true; }, () => undefined);

  document.body.appendChild(root);

  return {
    read(): InputState {
      const snapshot = { ...state };
      state.jumpPressed = false;
      state.firePressed = false;
      return snapshot;
    },
    consumePauseEdge(): boolean {
      const edge = pauseEdge;
      pauseEdge = false;
      return edge;
    },
    destroy(): void {
      root.remove();
    }
  };
}
