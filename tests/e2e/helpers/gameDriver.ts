/**
 * Shared Playwright driver over the `window.__GAME_DEBUG__` bridge.
 *
 * Not a spec file: Playwright only collects `*.spec.ts`, so this is safe here.
 *
 * One typed surface for scripted tests and agent-style drivers: read state,
 * inject input, and advance the deterministic fixed-step simulation - no
 * screenshots involved. With `{ manualClock: true }` the page runs with the
 * real-time clock frozen, so every step happens only when `step`/`act` says
 * so and input edges can never be consumed by a background frame.
 *
 * Type-only imports below are erased at compile time; the serialized
 * page.evaluate callbacks reference only browser globals.
 */

import type { Page } from '@playwright/test';
import type { DebugCommandName, InputCommandName } from '../../../src/debug/debugBridge';
import type { DebugSnapshot, LevelRuntime, SandboxRuntime } from '../../../src/debug/runtimeTypes';

export type HoldAction = 'left' | 'right' | 'aimUp' | 'aimDown';
export type TapAction = 'jump' | 'fire';

/** One atomic driver action: adjust inputs, then advance N steps. */
export interface ActSpec {
  /** Held directions to press and keep holding. */
  hold?: HoldAction[];
  /** Held directions or tap actions to release. */
  release?: (HoldAction | TapAction)[];
  /** Edge-triggered taps (consumed by the first stepped frame). */
  tap?: TapAction[];
}

export interface GameDriverOptions {
  /** Freeze the real-time clock so only driver steps advance the game. */
  manualClock?: boolean;
  /** Force a renderer; 'canvas' is recommended for headless stability. */
  renderer?: 'canvas' | 'webgl';
}

const HOLD_COMMANDS: Record<HoldAction, { hold: InputCommandName; release: InputCommandName }> = {
  left: { hold: 'holdLeft', release: 'releaseLeft' },
  right: { hold: 'holdRight', release: 'releaseRight' },
  aimUp: { hold: 'holdAimUp', release: 'releaseAimUp' },
  aimDown: { hold: 'holdAimDown', release: 'releaseAimDown' }
};

function releaseCommand(action: HoldAction | TapAction): InputCommandName {
  if (action === 'jump') {
    return 'jumpRelease';
  }
  if (action === 'fire') {
    return 'fireRelease';
  }
  return HOLD_COMMANDS[action].release;
}

function tapCommand(action: TapAction): InputCommandName {
  return action === 'jump' ? 'jumpPress' : 'firePress';
}

export class GameDriver {
  constructor(
    private readonly page: Page,
    private readonly opts: GameDriverOptions = {}
  ) {}

  /** Navigate to the game with the debug bridge enabled. */
  async goto(): Promise<DebugSnapshot> {
    const params = new URLSearchParams({ debug: '1' });
    if (this.opts.renderer) {
      params.set('renderer', this.opts.renderer);
    }
    if (this.opts.manualClock) {
      params.set('manualClock', '1');
    }
    await this.page.goto(`/?${params.toString()}`);
    await this.page.locator('canvas').waitFor({ state: 'visible', timeout: 15_000 });
    await this.page.waitForFunction(() => !!window.__GAME_DEBUG__, undefined, { timeout: 15_000 });
    return this.snapshot();
  }

  /** Full typed state snapshot (scene + runtime). */
  async snapshot(): Promise<DebugSnapshot> {
    return this.page.evaluate(() => {
      const bridge = window.__GAME_DEBUG__;
      if (!bridge) {
        throw new Error('debug bridge missing - navigate with ?debug=1 first');
      }
      return bridge.getState() as unknown as DebugSnapshot;
    });
  }

  async waitForScene(scene: string, timeoutMs = 10_000): Promise<DebugSnapshot> {
    await this.page.waitForFunction((k) => window.__GAME_DEBUG__?.getState()?.scene === k, scene, {
      timeout: timeoutMs
    });
    return this.snapshot();
  }

  /** Escape hatch: run any debug command (see DebugCommandName). */
  async command<T = unknown>(name: DebugCommandName, payload?: unknown): Promise<T> {
    return this.page.evaluate(([n, p]) => {
      const bridge = window.__GAME_DEBUG__;
      if (!bridge) {
        throw new Error('debug bridge missing - navigate with ?debug=1 first');
      }
      return bridge.command(n, p) as T;
    }, [name, payload] as [DebugCommandName, unknown]);
  }

  /** Escape hatch: apply one raw bridge input command. */
  async input(name: InputCommandName): Promise<void> {
    await this.page.evaluate((n) => {
      const bridge = window.__GAME_DEBUG__;
      if (!bridge) {
        throw new Error('debug bridge missing - navigate with ?debug=1 first');
      }
      bridge.input(n);
    }, name);
  }

  async startLevel(level: 1 | 2): Promise<LevelRuntime> {
    await this.command(level === 1 ? 'startLevel1' : 'startLevel2');
    await this.waitForScene('level');
    await this.page.waitForFunction(() => {
      const r = window.__GAME_DEBUG__?.getState()?.runtime as { level?: unknown } | null | undefined;
      return typeof r?.level === 'string';
    });
    return (await this.snapshot()).runtime as LevelRuntime;
  }

  async startSandbox(): Promise<SandboxRuntime> {
    await this.command('startSandbox');
    await this.waitForScene('sandbox');
    return (await this.snapshot()).runtime as SandboxRuntime;
  }

  async gotoTitle(): Promise<DebugSnapshot> {
    await this.command('gotoTitle');
    return this.waitForScene('title');
  }

  /** Press and keep holding a direction or aim. */
  async hold(action: HoldAction): Promise<void> {
    await this.input(HOLD_COMMANDS[action].hold);
  }

  /** Release a held direction/aim or a tap action. */
  async release(action: HoldAction | TapAction): Promise<void> {
    await this.input(releaseCommand(action));
  }

  /** Edge-triggered tap; the next stepped frame consumes it. */
  async press(action: TapAction): Promise<void> {
    await this.input(tapCommand(action));
  }

  /** Reset all simulated input to neutral. */
  async resetInput(): Promise<void> {
    await this.input('resetInput');
  }

  /**
   * Advance the simulation exactly N fixed steps (1/60 s each) and return the
   * resulting state. Under the manual clock this is the only way time passes.
   */
  async step(n = 1): Promise<DebugSnapshot> {
    return this.page.evaluate((steps) => {
      const bridge = window.__GAME_DEBUG__;
      if (!bridge) {
        throw new Error('debug bridge missing - navigate with ?debug=1 first');
      }
      bridge.command('advanceSteps', steps);
      return bridge.getState() as unknown as DebugSnapshot;
    }, n);
  }

  /**
   * Atomic act-then-step: apply input changes, advance N steps, return the
   * resulting state - all in one evaluate, so no real-time frame can ever
   * interleave (the pattern that makes agent driving race-free).
   */
  async act(spec: ActSpec, steps = 1): Promise<DebugSnapshot> {
    const commands: InputCommandName[] = [
      ...(spec.hold ?? []).map((a) => HOLD_COMMANDS[a].hold),
      ...(spec.release ?? []).map(releaseCommand),
      ...(spec.tap ?? []).map(tapCommand)
    ];
    return this.page.evaluate(([cmds, n]) => {
      const bridge = window.__GAME_DEBUG__;
      if (!bridge) {
        throw new Error('debug bridge missing - navigate with ?debug=1 first');
      }
      for (const c of cmds) {
        bridge.input(c);
      }
      bridge.command('advanceSteps', n);
      return bridge.getState() as unknown as DebugSnapshot;
    }, [commands, steps] as [InputCommandName[], number]);
  }

  async teleport(x?: number, y?: number): Promise<void> {
    const payload: { x?: number; y?: number } = {};
    if (x !== undefined) {
      payload.x = x;
    }
    if (y !== undefined) {
      payload.y = y;
    }
    await this.command('teleportPlayer', payload);
  }

  async defeatBoss(): Promise<void> {
    await this.command('defeatBoss');
  }

  async completeLevel(): Promise<void> {
    await this.command('completeLevel');
  }
}

export function createDriver(page: Page, opts?: GameDriverOptions): GameDriver {
  return new GameDriver(page, opts);
}
