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

export interface GameDebugState {
  gameTitle: string;
  gameVersion: string;
  /** Key of the currently active scene, or null before any scene starts. */
  scene: string | null;
  /** Heading text rendered by the title scene, or null if not shown. */
  titleHeading: string | null;
  /** Opaque, scene-provided snapshot (player, lives, weapon, projectiles...). */
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
  | 'resetInput';

declare global {
  interface Window {
    __GAME_DEBUG__?: GameDebugBridge;
  }
}

export type CommandHandler = (payload: unknown) => unknown;

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

/** Replace the scene-provided runtime snapshot with a fresh copy. */
export function reportRuntime(runtime: Record<string, unknown>): void {
  state.runtime = { ...runtime };
}

export function clearRuntime(): void {
  state.runtime = null;
}

export function registerCommand(name: DebugCommandName, handler: CommandHandler): void {
  commands.set(name, handler);
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
