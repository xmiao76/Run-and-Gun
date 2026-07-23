import Phaser from 'phaser';
import { LOGICAL_WIDTH, SCENE_KEYS } from '../app/config';
import { reportRuntime, reportScene } from '../debug/debugBridge';

const LINES: { text: string; y: number; size: number; color: string }[] = [
  { text: 'CONTROLS', y: 70, size: 34, color: '#e8f1ff' },
  { text: 'KEYBOARD', y: 130, size: 20, color: '#8fb3ff' },
  { text: 'A/D or arrows - move    Space/W/Up - jump (hold for higher)', y: 160, size: 15, color: '#cdd9f0' },
  { text: 'S/Down - crouch / drop through platform    J/K/Enter - fire', y: 184, size: 15, color: '#cdd9f0' },
  { text: 'Hold a direction while firing to aim in 8 directions', y: 208, size: 15, color: '#cdd9f0' },
  { text: 'Esc - pause    M - mute (paused)    F - reduced flash (paused)    F10 - fullscreen', y: 232, size: 15, color: '#cdd9f0' },
  { text: 'GAMEPAD', y: 278, size: 20, color: '#8fb3ff' },
  { text: 'D-pad / left stick - move + aim    A - jump    X or RB - fire    Start - pause', y: 308, size: 15, color: '#cdd9f0' },
  { text: 'TOUCH', y: 354, size: 20, color: '#8fb3ff' },
  { text: 'On-screen buttons: move, aim-up, jump, fire, pause', y: 384, size: 15, color: '#cdd9f0' },
  { text: 'ESC / ENTER - BACK', y: 450, size: 16, color: '#5c6c8c' }
];

/** Controls/help screen (GAME_REQUIREMENTS.md section 11, B4). */
export class HelpScene extends Phaser.Scene {
  private onKey?: (e: KeyboardEvent) => void;

  constructor() {
    super(SCENE_KEYS.help);
  }

  public create(): void {
    reportScene(SCENE_KEYS.help);
    reportRuntime({ scene: SCENE_KEYS.help, controlsListed: ['keyboard', 'gamepad', 'touch'] });

    const cx = LOGICAL_WIDTH / 2;
    for (const line of LINES) {
      this.add
        .text(cx, line.y, line.text, {
          fontFamily: 'monospace',
          fontSize: line.size + 'px',
          color: line.color,
          fontStyle: line.size >= 20 ? 'bold' : 'normal'
        })
        .setOrigin(0.5, 0);
    }

    this.onKey = (e: KeyboardEvent): void => {
      if (e.code !== 'Escape' && e.code !== 'Enter' && e.code !== 'Space' && e.code !== 'KeyH') {
        return;
      }
      e.preventDefault();
      this.scene.start(SCENE_KEYS.title);
    };
    window.addEventListener('keydown', this.onKey);
  }

  public shutdown(): void {
    if (this.onKey) {
      window.removeEventListener('keydown', this.onKey);
      this.onKey = undefined;
    }
  }
}
