import Phaser from 'phaser';
import { LOGICAL_HEIGHT, LOGICAL_WIDTH, SCENE_KEYS } from '../app/config';
import { reportScene } from '../debug/debugBridge';
import { drawText } from '../ui/text';
import { attachScanlines } from '../ui/scanlines';

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
    attachScanlines(this);

    drawText(this, LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, 'LOADING', {
      size: 24,
      color: '#9fb4d8',
      originX: 0.5,
      originY: 0.5
    });

    this.scene.start(SCENE_KEYS.title);
  }
}
