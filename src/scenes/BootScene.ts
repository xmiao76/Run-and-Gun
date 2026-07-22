import Phaser from 'phaser';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, SCENE_KEYS } from '../app/config';
import { reportScene } from '../debug/debugBridge';

/**
 * Minimal loading scene. M0 has no assets to preload, so it briefly shows a
 * loading label and transitions straight to the title screen.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boot);
  }

  public create(): void {
    reportScene(SCENE_KEYS.boot);

    this.add
      .text(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, 'LOADING', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#9fb4d8'
      })
      .setOrigin(0.5);

    this.scene.start(SCENE_KEYS.title);
  }
}
