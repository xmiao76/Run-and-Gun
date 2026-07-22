import Phaser from 'phaser';
import { GAME_VERSION, LOGICAL_HEIGHT, LOGICAL_WIDTH, SCENE_KEYS, TITLE_HEADING } from '../app/config';
import { reportScene, reportTitleHeading } from '../debug/debugBridge';

const HEADING_Y = 210;
const TAGLINE_Y = 268;

/**
 * Title screen for Operation Iron Echo.
 *
 * Renders the original title, a tagline, and a version label using system
 * fonts only - no external asset files are required.
 */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.title);
  }

  public create(): void {
    reportScene(SCENE_KEYS.title);
    reportTitleHeading(TITLE_HEADING);

    const centerX = LOGICAL_WIDTH / 2;

    const heading = this.add
      .text(centerX, HEADING_Y, TITLE_HEADING, {
        fontFamily: 'monospace',
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#e8f1ff'
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, TAGLINE_Y, 'An original browser run-and-gun', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#8fa3c7'
      })
      .setOrigin(0.5);

    this.add
      .text(12, LOGICAL_HEIGHT - 16, `v${GAME_VERSION} - M0 bootstrap`, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#5c6c8c'
      })
      .setOrigin(0, 0.5);

    this.tweens.add({
      targets: heading,
      alpha: 0.55,
      duration: 900,
      yoyo: true,
      repeat: -1
    });
  }
}
