import { describe, expect, it } from 'vitest';

import { hookShutdown, SCENE_SHUTDOWN_EVENT } from '../../src/scenes/sceneLifecycle';

describe('hookShutdown', () => {
  it('registers the handler on the Phaser shutdown event key', () => {
    expect(SCENE_SHUTDOWN_EVENT).toBe('shutdown');
    const registered: string[] = [];
    const events = { once: (event: string): void => void registered.push(event) };
    hookShutdown(events, () => undefined);
    expect(registered).toEqual(['shutdown']);
  });

  it('runs the detach handler when the scene emits shutdown', () => {
    const box: { fn?: () => void } = {};
    const events = {
      once(_event: string, fn: () => void): void {
        box.fn = fn;
      }
    };
    let detached = false;
    hookShutdown(events, () => {
      detached = true;
    });
    expect(detached).toBe(false);
    expect(typeof box.fn).toBe('function');
    box.fn?.();
    expect(detached).toBe(true);
  });
});
