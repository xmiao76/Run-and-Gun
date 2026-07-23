import { SCENE_KEYS } from './app/config';
import { createGame } from './app/createGame';
import { createAudioService } from './audio/AudioService';
import { getDebugInput, installDebugBridge, registerCommand } from './debug/debugBridge';

installDebugBridge();

const game = createGame(document.getElementById('game') ?? undefined);

// Shared mutable input the debug bridge mutates and the active scene reads,
// letting automated tests synthesize input without real keyboard events.
game.registry.set('debugInput', getDebugInput());

// Failure-safe audio; scenes pull it from the registry and call unlock() on
// the first user gesture. Stored as a singleton so settings persist in-session.
game.registry.set('audio', createAudioService());

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
registerCommand('gotoTitle', () => {
  switchToScene(SCENE_KEYS.title);
  return { ok: true, scene: SCENE_KEYS.title };
});
