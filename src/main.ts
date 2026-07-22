import { SCENE_KEYS } from './app/config';
import { createGame } from './app/createGame';
import { getDebugInput, installDebugBridge, registerCommand } from './debug/debugBridge';

installDebugBridge();

const game = createGame(document.getElementById('game') ?? undefined);

// Shared mutable input the debug bridge mutates and the active scene reads,
// letting automated tests synthesize input without real keyboard events.
game.registry.set('debugInput', getDebugInput());

// Scene-switching commands are global so they are available from any scene
// (e.g. starting the sandbox from the title screen). Scene-specific commands
// such as damagePlayer are registered by the scene that owns them.
function switchToScene(key: string): void {
  // Starting a scene from outside a scene context does not stop the currently
  // running one, so stop every other scene explicitly to keep exactly one
  // active scene (and one clean display list) at a time.
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
registerCommand('gotoTitle', () => {
  switchToScene(SCENE_KEYS.title);
  return { ok: true, scene: SCENE_KEYS.title };
});
