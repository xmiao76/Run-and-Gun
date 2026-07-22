/**
 * Minimal read-only debug bridge exposed as `window.__GAME_DEBUG__`.
 *
 * Active only in development builds or when the page is loaded with a
 * `?debug` query parameter. In production without the parameter the bridge
 * is never installed, so it cannot affect normal gameplay.
 *
 * The bridge reports state snapshots; it never mutates game state.
 */

import { GAME_TITLE, GAME_VERSION } from '../app/config';

export interface GameDebugState {
  gameTitle: string;
  gameVersion: string;
  /** Key of the currently active scene, or null before any scene starts. */
  scene: string | null;
  /** Heading text rendered by the title scene, or null if not yet shown. */
  titleHeading: string | null;
}

export interface GameDebugBridge {
  getState(): GameDebugState;
}

declare global {
  interface Window {
    __GAME_DEBUG__?: GameDebugBridge;
  }
}

const state: GameDebugState = {
  gameTitle: GAME_TITLE,
  gameVersion: GAME_VERSION,
  scene: null,
  titleHeading: null
};

/** Called by scenes when they become active. */
export function reportScene(scene: string): void {
  state.scene = scene;
}

/** Called by the title scene once its heading text exists. */
export function reportTitleHeading(text: string): void {
  state.titleHeading = text;
}

/** True in dev builds or when the URL contains a `debug` query parameter. */
export function isDebugEnabled(): boolean {
  if (import.meta.env.DEV) {
    return true;
  }
  const params = new URLSearchParams(window.location.search);
  return params.has('debug');
}

/** Installs the read-only bridge on `window` when debugging is enabled. */
export function installDebugBridge(): void {
  if (!isDebugEnabled()) {
    return;
  }
  window.__GAME_DEBUG__ = {
    getState(): GameDebugState {
      return { ...state };
    }
  };
}
