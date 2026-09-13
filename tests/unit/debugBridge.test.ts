import { beforeEach, describe, expect, test } from 'vitest';

import {
  clampStepCount,
  getDebugInput,
  installDebugBridge,
  registerCommand,
  MAX_ADVANCE_STEPS
} from '../../src/debug/debugBridge';

/**
 * The command registry is module-level and shared by every scene, so the
 * lifetime rules matter: a scene that has stopped must not keep answering, and
 * a scene shutting down after its successor has already registered the same
 * name must not unregister the live handler. That ordering is real - Phaser
 * queues scene swaps, so the outgoing scene's shutdown can run after the
 * incoming scene's create().
 */

interface TestWindow {
  location: { search: string };
  __GAME_DEBUG__?: {
    command(name: string, payload?: unknown): unknown;
    input(name: string): void;
    getState(): unknown;
  };
}

/** The bridge targets `window`; these tests run in the node environment. */
function stubWindow(): TestWindow {
  const w: TestWindow = { location: { search: '?debug=1' } };
  (globalThis as unknown as { window: TestWindow }).window = w;
  return w;
}

let win: TestWindow;

function bridge(): NonNullable<TestWindow['__GAME_DEBUG__']> {
  if (!win.__GAME_DEBUG__) {
    throw new Error('bridge not installed');
  }
  return win.__GAME_DEBUG__;
}

beforeEach(() => {
  win = stubWindow();
  installDebugBridge();
});

describe('clampStepCount', () => {
  test('floors, clamps to zero, and caps at the bounded maximum', () => {
    expect(clampStepCount(10.9)).toBe(10);
    expect(clampStepCount(-5)).toBe(0);
    expect(clampStepCount(MAX_ADVANCE_STEPS + 1000)).toBe(MAX_ADVANCE_STEPS);
  });

  test('a non-numeric payload advances nothing rather than guessing', () => {
    expect(clampStepCount(undefined)).toBe(0);
    expect(clampStepCount('600')).toBe(0);
  });
});

describe('command registration lifetime', () => {
  test('an unregistered command reports itself instead of silently doing nothing', () => {
    expect(bridge().command('pause')).toEqual({ ok: false, error: 'unknown command: pause' });
  });

  test('a registered command runs, and its disposer removes it', () => {
    const dispose = registerCommand('pause', () => ({ ok: true, from: 'scene-a' }));
    expect(bridge().command('pause')).toEqual({ ok: true, from: 'scene-a' });

    dispose();
    expect(bridge().command('pause')).toEqual({ ok: false, error: 'unknown command: pause' });
  });

  test('a late disposer cannot unregister the successor that took the name over', () => {
    const disposeOld = registerCommand('advanceSteps', () => ({ ok: true, from: 'old-level' }));
    registerCommand('advanceSteps', () => ({ ok: true, from: 'new-level' }));

    // The outgoing scene shuts down after the incoming one registered.
    disposeOld();

    expect(bridge().command('advanceSteps')).toEqual({ ok: true, from: 'new-level' });
  });

  test('the payload reaches the handler untouched', () => {
    registerCommand('startAtCheckpoint', (payload) => ({ ok: true, payload }));
    expect(bridge().command('startAtCheckpoint', { id: 'mid', lives: 3 })).toEqual({
      ok: true,
      payload: { id: 'mid', lives: 3 }
    });
  });
});

describe('input commands', () => {
  test('crouch and drop are drivable, matching the InputState fields they set', () => {
    bridge().input('holdCrouch');
    bridge().input('holdDrop');
    expect(getDebugInput().crouch).toBe(true);
    expect(getDebugInput().drop).toBe(true);

    bridge().input('releaseCrouch');
    bridge().input('releaseDrop');
    expect(getDebugInput().crouch).toBe(false);
    expect(getDebugInput().drop).toBe(false);
  });

  test('resetInput clears every field, including the new ones', () => {
    bridge().input('holdCrouch');
    bridge().input('holdRight');
    bridge().input('jumpPress');
    bridge().input('resetInput');

    const input = getDebugInput();
    expect(input.crouch).toBe(false);
    expect(input.right).toBe(false);
    expect(input.jumpHeld).toBe(false);
    expect(input.jumpPressed).toBe(false);
  });
});
