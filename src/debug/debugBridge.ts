/**
 * Debug bridge exposed as `window.__GAME_DEBUG__`.
 *
 * Installed only in development builds or when the page carries a `?debug`
 * query parameter; otherwise it is inert and absent from `window`, so it cannot
 * affect normal gameplay (GAME_REQUIREMENTS.md section 13).
 *
 * The bridge has two halves:
 *  - a read-only `getState()` snapshot that the active scene reports each step;
 *  - a debug-only command + simulated-input surface used by automated tests to
 *    drive deterministic flows (start the sandbox, inject a controlled hit,
 *    synthesize input). Commands are registered by the active scene, so the
 *    bridge stays decoupled from any specific gameplay system.
 */

import { GAME_TITLE, GAME_VERSION } from '../app/config';
import { createNeutralInput, type InputState } from '../input/InputState';
import type { RuntimeSnapshot } from './runtimeTypes';

export interface GameDebugState {
  gameTitle: string;
  gameVersion: string;
  /** Key of the currently active scene, or null before any scene starts. */
  scene: string | null;
  /** Heading text rendered by the title scene, or null if not shown. */
  titleHeading: string | null;
  /**
   * Scene-provided snapshot (player, lives, weapon, projectiles...). Kept as
   * a loose record on the wire for backward compatibility; the typed contract
   * is `RuntimeSnapshot` in `runtimeTypes.ts`, which `reportRuntime` enforces
   * at the construction boundary.
   */
  runtime: Record<string, unknown> | null;
}

export type DebugCommandName =
  | 'startSandbox'
  | 'startLevel1'
  | 'startLevel2'
  | 'gotoTitle'
  | 'pause'
  | 'resume'
  | 'damagePlayer'
  | 'damageBoss'
  | 'defeatBoss'
  | 'completeLevel'
  | 'triggerGameOver'
  | 'awardScore'
  | 'advanceSteps'
  | 'teleportPlayer'
  | 'spawnEnemyAt'
  | 'startAtCheckpoint'
  | 'setManualClock'
  | 'confirmMenu'
  | 'backMenu'
  | 'report';

export interface DebugInputState extends InputState {
  /** Set by `installSandboxInput`; cleared by the scene after each step. */
  jumpPressed: boolean;
  firePressed: boolean;
}

export interface GameDebugBridge {
  getState(): GameDebugState;
  command(name: DebugCommandName, payload?: unknown): unknown;
  input(name: InputCommandName): void;
}

export type InputCommandName =
  | 'holdLeft'
  | 'holdRight'
  | 'releaseLeft'
  | 'releaseRight'
  | 'jumpPress'
  | 'jumpRelease'
  | 'firePress'
  | 'fireRelease'
  | 'holdAimUp'
  | 'releaseAimUp'
  | 'holdAimDown'
  | 'releaseAimDown'
  | 'holdCrouch'
  | 'releaseCrouch'
  | 'holdDrop'
  | 'releaseDrop'
  | 'resetInput';

declare global {
  interface Window {
    __GAME_DEBUG__?: GameDebugBridge;
  }
}

export type CommandHandler = (payload: unknown) => unknown;

/** Upper bound for `advanceSteps`: 60000 fixed steps = 1000 s of simulation. */
export const MAX_ADVANCE_STEPS = 60000;

/** Clamp an `advanceSteps` payload to the bounded step range. */
export function clampStepCount(payload: unknown): number {
  const n = typeof payload === 'number' ? Math.floor(payload) : 0;
  return Math.min(Math.max(n, 0), MAX_ADVANCE_STEPS);
}

const state: GameDebugState = {
  gameTitle: GAME_TITLE,
  gameVersion: GAME_VERSION,
  scene: null,
  titleHeading: null,
  runtime: null
};

const commands = new Map<DebugCommandName, CommandHandler>();
const debugInput: DebugInputState = { ...createNeutralInput() };

export function reportScene(scene: string): void {
  state.scene = scene;
}

export function reportTitleHeading(text: string): void {
  state.titleHeading = text;
}

/**
 * Replace the scene-provided runtime snapshot with a fresh copy. The
 * parameter is the typed `RuntimeSnapshot` union, so every scene must
 * construct a well-formed snapshot (see `runtimeTypes.ts`).
 */
export function reportRuntime(runtime: RuntimeSnapshot): void {
  state.runtime = { ...runtime };
}

export function clearRuntime(): void {
  state.runtime = null;
}

/**
 * Bind a command handler and return a disposer.
 *
 * Scenes call the disposer on shutdown so a stopped scene's handlers can never
 * be invoked: without it the registry kept handlers bound to a dead scene alive
 * and `command()` would silently mutate it (or no-op) instead of reporting that
 * no such surface is active - a trap for any agent driving the bridge.
 *
 * The disposer only removes the name while it is still bound to *this* handler,
 * so a scene shutting down after its successor has registered the same name
 * (the level-to-level transition order) cannot unregister the live one.
 */
export function registerCommand(name: DebugCommandName, handler: CommandHandler): () => void {
  commands.set(name, handler);
  return () => {
    if (commands.get(name) === handler) {
      commands.delete(name);
    }
  };
}

/** Debug-only simulated input merged with real device input by the scene. */
export function getDebugInput(): DebugInputState {
  return debugInput;
}

export function isDebugEnabled(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  return new URLSearchParams(window.location.search).has('debug');
}

/**
 * True when the page asked for the agent-driven manual clock (`?manualClock`)
 * while debug is enabled. Scenes read this in `create()`; while active, wall
 * time never advances the simulation - only the `advanceSteps` command does,
 * and bridge input edges persist until the agent's next step consumes them.
 */
export function manualClockRequested(): boolean {
  if (!isDebugEnabled()) {
    return false;
  }
  return new URLSearchParams(window.location.search).has('manualClock');
}

export function resolveRenderer(): number | null {
  if (!isDebugEnabled()) {
    return null;
  }
  const requested = new URLSearchParams(window.location.search).get('renderer');
  if (requested === 'canvas') {
    return 1; // Phaser.CANVAS
  }
  if (requested === 'webgl') {
    return 2; // Phaser.WEBGL
  }
  return null;
}

function applyInputCommand(name: InputCommandName): void {
  switch (name) {
    case 'holdLeft':
      debugInput.left = true;
      break;
    case 'holdRight':
      debugInput.right = true;
      break;
    case 'releaseLeft':
      debugInput.left = false;
      break;
    case 'releaseRight':
      debugInput.right = false;
      break;
    case 'jumpPress':
      debugInput.jumpHeld = true;
      debugInput.jumpPressed = true;
      break;
    case 'jumpRelease':
      debugInput.jumpHeld = false;
      break;
    case 'firePress':
      debugInput.fireHeld = true;
      debugInput.firePressed = true;
      break;
    case 'fireRelease':
      debugInput.fireHeld = false;
      break;
    case 'holdAimUp':
      debugInput.aimUp = true;
      break;
    case 'releaseAimUp':
      debugInput.aimUp = false;
      break;
    case 'holdAimDown':
      debugInput.aimDown = true;
      break;
    case 'releaseAimDown':
      debugInput.aimDown = false;
      break;
    case 'holdCrouch':
      debugInput.crouch = true;
      break;
    case 'releaseCrouch':
      debugInput.crouch = false;
      break;
    case 'holdDrop':
      debugInput.drop = true;
      break;
    case 'releaseDrop':
      debugInput.drop = false;
      break;
    case 'resetInput':
      Object.assign(debugInput, createNeutralInput());
      break;
  }
}

export function installDebugBridge(): void {
  if (!isDebugEnabled()) {
    return;
  }
  window.__GAME_DEBUG__ = {
    getState(): GameDebugState {
      return {
        gameTitle: state.gameTitle,
        gameVersion: state.gameVersion,
        scene: state.scene,
        titleHeading: state.titleHeading,
        runtime: state.runtime ? { ...state.runtime } : null
      };
    },
    command(name: DebugCommandName, payload?: unknown): unknown {
      const handler = commands.get(name);
      if (!handler) {
        return { ok: false, error: `unknown command: ${name}` };
      }
      return handler(payload);
    },
    input(name: InputCommandName): void {
      applyInputCommand(name);
    }
  };
}
