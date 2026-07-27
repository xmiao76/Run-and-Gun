/**
 * Input diagnostic overlay, enabled with `?keys=1`.
 *
 * Exists because "the controls do nothing" can only be diagnosed with the real
 * events from the affected machine: a browser extension, an IME, or a stolen
 * focus each look identical from the outside. This reports exactly what the page
 * receives and what the game resolves it to.
 *
 * Deliberately plain DOM, not a Phaser scene, so it still reports even when the
 * game loop, renderer, or scene is the thing that is broken.
 */

import { resolveKeyAction } from '../input/KeyboardInput';

const MAX_ROWS = 10;

export function isKeyOverlayEnabled(): boolean {
  return new URLSearchParams(window.location.search).has('keys');
}

export function installKeyOverlay(): void {
  const panel = document.createElement('div');
  panel.setAttribute('data-key-overlay', 'true');
  Object.assign(panel.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    zIndex: '99999',
    maxWidth: '100%',
    padding: '8px 10px',
    background: 'rgba(4,8,16,0.92)',
    color: '#cdd9f0',
    font: '12px/1.45 monospace',
    whiteSpace: 'pre',
    pointerEvents: 'none',
    borderBottom: '1px solid #33415e'
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(panel);

  const rows: string[] = [];
  let seen = 0;

  const status = (): string => {
    const bridge = window.__GAME_DEBUG__;
    const state = bridge?.getState();
    const runtime = (state?.runtime ?? {}) as { paused?: boolean; autoPaused?: boolean; projectileCount?: number };
    const active = document.activeElement;
    return [
      'INPUT DIAGNOSTIC  (add &debug=1 for scene state)',
      `scene=${state?.scene ?? 'n/a'}  paused=${String(runtime.paused)}  autoPaused=${String(runtime.autoPaused)}  shots=${String(runtime.projectileCount)}`,
      `hasFocus=${String(document.hasFocus())}  activeElement=${active ? active.tagName : 'none'}  keysSeen=${seen}`,
      rows.length > 0 ? '' : '(press Z / X / arrows - nothing below means the browser is swallowing the key)'
    ].join('\n');
  };

  const render = (): void => {
    panel.textContent = [status(), ...rows].join('\n');
  };

  const onKey = (event: KeyboardEvent, kind: string): void => {
    seen += 1;
    const action = resolveKeyAction(event.code, event.key, event.keyCode);
    rows.unshift(
      `${kind.padEnd(7)} code=${(event.code || '<empty>').padEnd(11)} key=${String(event.key).padEnd(9)} ` +
        `keyCode=${String(event.keyCode).padEnd(4)} composing=${String(event.isComposing)} -> ${action ?? 'IGNORED'}`
    );
    if (rows.length > MAX_ROWS) {
      rows.length = MAX_ROWS;
    }
    render();
  };

  // Capture phase, so anything the game or a library stops is still reported.
  window.addEventListener('keydown', (e) => onKey(e, 'keydown'), true);
  window.addEventListener('keyup', (e) => onKey(e, 'keyup'), true);
  window.addEventListener('compositionstart', () => {
    rows.unshift('compositionstart  <- an IME is intercepting typing');
    render();
  }, true);
  window.addEventListener('blur', () => {
    rows.unshift('window blur  <- focus left the game (auto-pause)');
    render();
  }, true);
  window.addEventListener('focus', () => {
    rows.unshift('window focus <- focus returned');
    render();
  }, true);

  render();
  window.setInterval(render, 500);
}
