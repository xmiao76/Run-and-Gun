import Phaser from 'phaser';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH } from './config';
import { resolveRenderer } from './renderer';
import { BootScene } from '../scenes/BootScene';
import { TitleScene } from '../scenes/TitleScene';

/**
 * Creates the Phaser game instance.
 *
 * The logical resolution is fixed at 960x540 and scaled to fit its parent
 * while preserving aspect ratio, per GAME_REQUIREMENTS.md section 3.
 */
export function createGame(parent?: HTMLElement): Phaser.Game {
  return new Phaser.Game({
    type: resolveRenderer(),
    parent,
    backgroundColor: '#0b0f1a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: LOGICAL_WIDTH,
      height: LOGICAL_HEIGHT
    },
    scene: [BootScene, TitleScene]
  });
}
