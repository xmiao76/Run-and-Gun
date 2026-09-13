import { SCENE_KEYS } from './app/config';
import { createGame } from './app/createGame';
import { createAudioService } from './audio/AudioService';
import { getDebugInput, installDebugBridge, isDebugEnabled, registerCommand } from './debug/debugBridge';
import { installKeyOverlay, isKeyOverlayEnabled } from './debug/keyOverlay';
import { loadSettings } from './persistence/StorageService';
import type Phaser from 'phaser';

declare global {
  interface Window {
    /** Debug-only handle to the Phaser game (see below); absent in normal play. */
    __GAME__?: Phaser.Game;
  }
}

installDebugBridge();

// Opt-in input diagnostic (`?keys=1`); installed before the game so it also
// reports when the game itself fails to start.
if (isKeyOverlayEnabled()) {
  installKeyOverlay();
}

const game = createGame(document.getElementById('game') ?? undefined);

// Debug builds expose the game instance so automated tests can inspect the
// texture manager and display list (e.g. verifying sprite presentation).
// Absent entirely in normal play, like the rest of the debug bridge.
if (isDebugEnabled()) {
  window.__GAME__ = game;
}

// Shared mutable input the debug bridge mutates and the active scene reads,
// letting automated tests synthesize input without real keyboard events.
game.registry.set('debugInput', getDebugInput());

// Failure-safe audio; scenes pull it from the registry and call unlock() on
// the first user gesture. Stored as a singleton so settings persist in-session.
game.registry.set('audio', createAudioService());

// Versioned, validated settings (volumes, mute, reduced-flash, controls, best
// score); corrupt or absent storage falls back to defaults.
game.registry.set('settings', loadSettings());

// Optional fullscreen toggle (F10), failure-safe per the presentation spec.
window.addEventListener('keydown', (e) => {
  if (e.code !== 'F10') {
    return;
  }
  e.preventDefault();
  try {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void document.documentElement.requestFullscreen();
    }
  } catch {
    /* fullscreen unavailable; ignore */
  }
});

// Scene-switching commands are global so they are available from any scene
// (e.g. starting a level from the title screen). Scene-specific commands such
// as pause/damageBoss are registered by the scene that owns them.
function switchToScene(key: string): void {
  for (const scene of game.scene.scenes) {
    if (scene.sys.settings.key !== key && game.scene.isActive(scene.sys.settings.key)) {
      game.scene.stop(scene.sys.settings.key);
    }
  }
  game.scene.start(key);
}

registerCommand('startSandbox', () => {
  switchToScene(SCENE_KEYS.sandbox);
  return { ok: true, scene: SCENE_KEYS.sandbox };
});
registerCommand('startLevel1', () => {
  game.registry.set('currentLevelIndex', 0);
  switchToScene(SCENE_KEYS.level);
  return { ok: true, scene: SCENE_KEYS.level };
});
registerCommand('startLevel2', () => {
  game.registry.set('currentLevelIndex', 1);
  switchToScene(SCENE_KEYS.level);
  return { ok: true, scene: SCENE_KEYS.level };
});
registerCommand('startLevel3', () => {
  game.registry.set('currentLevelIndex', 2);
  switchToScene(SCENE_KEYS.level);
  return { ok: true, scene: SCENE_KEYS.level };
});
registerCommand('gotoTitle', () => {
  switchToScene(SCENE_KEYS.title);
  return { ok: true, scene: SCENE_KEYS.title };
});
