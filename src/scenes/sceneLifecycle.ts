/**
 * Scene shutdown wiring.
 *
 * Phaser's scene systems EMIT a 'shutdown' event when a scene stops, but they
 * never call a Scene subclass's own `shutdown()` method. Scenes that attach
 * window listeners in create() must therefore hook the event themselves, or
 * the listeners leak into every later scene (e.g. the title screen kept
 * reacting to S/H/Enter while Level 1 was running).
 */

/** Event key emitted by Phaser.Scenes.Systems#shutdown. */
export const SCENE_SHUTDOWN_EVENT = 'shutdown';

interface ShutdownEmitter {
  once(event: string, fn: () => void): void;
}

/** Runs `shutdown` when the owning scene's systems emit the shutdown event. */
export function hookShutdown(events: ShutdownEmitter, shutdown: () => void): void {
  events.once(SCENE_SHUTDOWN_EVENT, shutdown);
}
