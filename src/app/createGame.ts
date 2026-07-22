import Phaser from 'phaser';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './config';
import { resolveRenderer } from '../debug/debugBridge';
import { BootScene } from '../scenes/BootScene';
import { SandboxScene } from '../scenes/SandboxScene';
import { TitleScene } from '../scenes/TitleScene';

/**
 * Creates the Phaser game instance.
 *
 * The logical resolution is fixed at 960x540 and scaled to fit its parent
 * while preserving aspect ratio, per GAME_REQUIREMENTS.md section 3. The
 * renderer defaults to AUTO (WebGL) for real users; a debug query parameter
 * may force Canvas/WebGL for headless automation (see debugBridge).
 */
export function createGame(parent?: HTMLElement): Phaser.Game {
  const override = resolveRenderer();
  return new Phaser.Game({
    type: override === null ? Phaser.AUTO : override,
    parent,
    backgroundColor: '#0b0f1a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: LOGICAL_WIDTH,
      height: LOGICAL_HEIGHT
    },
    scene: [BootScene, TitleScene, SandboxScene]
  });
}
