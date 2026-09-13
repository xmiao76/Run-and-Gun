/**
 * Menu-confirm wiring for non-gameplay scenes.
 *
 * A menu must be completable with any supported input device: keyboard
 * (Enter/Space), tap/click anywhere, or a gamepad (A/X/Start to confirm,
 * Back for the optional secondary action). Returns a detach function that
 * scenes must run on shutdown (see sceneLifecycle.hookShutdown).
 *
 * Every menu also gets the debug `confirmMenu` / `backMenu` bridge commands for
 * free, so an agent driving the game can leave a menu without synthesizing real
 * keys - and, under `?manualClock`, without waiting on wall time at all.
 */

import type Phaser from 'phaser';

import { registerCommand } from '../debug/debugBridge';
import { createGamepadInput } from './GamepadInput';

const CONFIRM_KEYS = new Set(['Enter', 'Space']);

export interface MenuConfirmOptions {
  /** Secondary action: gamepad Back button or Escape key. */
  onBack?: () => void;
}

export function attachMenuConfirm(
  scene: Phaser.Scene,
  onConfirm: () => void,
  options: MenuConfirmOptions = {}
): () => void {
  const gamepad = createGamepadInput();

  const onKey = (e: KeyboardEvent): void => {
    if (CONFIRM_KEYS.has(e.code)) {
      e.preventDefault();
      onConfirm();
      return;
    }
    if (options.onBack && e.code === 'Escape') {
      e.preventDefault();
      options.onBack();
    }
  };
  const onPointer = (): void => {
    onConfirm();
  };
  const onUpdate = (): void => {
    const input = gamepad.build();
    if (input.firePressed || input.jumpPressed || gamepad.pauseEdge()) {
      onConfirm();
      return;
    }
    if (options.onBack && gamepad.backEdge()) {
      options.onBack();
    }
  };

  window.addEventListener('keydown', onKey);
  window.addEventListener('pointerdown', onPointer);
  scene.events.on('update', onUpdate);

  const disposeConfirm = registerCommand('confirmMenu', () => {
    onConfirm();
    return { ok: true };
  });
  const disposeBack = registerCommand('backMenu', () => {
    if (!options.onBack) {
      return { ok: false, error: 'this menu has no back action' };
    }
    options.onBack();
    return { ok: true };
  });

  return () => {
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('pointerdown', onPointer);
    scene.events.off('update', onUpdate);
    disposeConfirm();
    disposeBack();
  };
}
