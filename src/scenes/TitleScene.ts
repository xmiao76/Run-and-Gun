import Phaser from 'phaser';
import { GAME_VERSION, LOGICAL_HEIGHT, LOGICAL_WIDTH, SCENE_KEYS, TITLE_HEADING } from '../app/config';
import { reportScene, reportTitleHeading } from '../debug/debugBridge';
import { type AudioService } from '../audio/AudioService';

const HEADING_Y = 190;
const TAGLINE_Y = 248;

/**
 * Title screen for Operation Iron Echo.
 *
 * Renders the original title, a tagline, a start prompt, and a version label
 * using system fonts only - no external asset files are required. Pressing
 * Enter or Space (or the debug `startLevel1` command) starts Level 1 and
 * unlocks audio on that first user gesture.
 */
export class TitleScene extends Phaser.Scene {
  private onStart?: (e: KeyboardEvent) => void;

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

    const prompt = this.add
      .text(centerX, 330, 'PRESS ENTER OR SPACE TO START', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#cdd9f0'
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, 366, 'H - HELP / CONTROLS      F10 - FULLSCREEN', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#5c6c8c'
      })
      .setOrigin(0.5);

    this.add
      .text(12, LOGICAL_HEIGHT - 16, 'v' + GAME_VERSION + ' - Operation Iron Echo', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#5c6c8c'
      })
      .setOrigin(0, 0.5);

    this.tweens.add({ targets: heading, alpha: 0.55, duration: 900, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    this.onStart = (e: KeyboardEvent): void => {
      if (e.code === 'KeyH') {
        e.preventDefault();
        this.scene.start(SCENE_KEYS.help);
        return;
      }
      if (e.code !== 'Enter' && e.code !== 'Space') {
        return;
      }
      e.preventDefault();
      const audio = this.registry.get('audio') as AudioService | undefined;
      audio?.unlock();
      this.registry.set('currentLevelIndex', 0);
      this.scene.start(SCENE_KEYS.level);
    };
    window.addEventListener('keydown', this.onStart);
  }

  public shutdown(): void {
    if (this.onStart) {
      window.removeEventListener('keydown', this.onStart);
      this.onStart = undefined;
    }
  }
}
