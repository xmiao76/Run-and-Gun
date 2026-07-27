import Phaser from 'phaser';
import { LOGICAL_WIDTH, SCENE_KEYS } from '../app/config';
import { reportRuntime, reportScene } from '../debug/debugBridge';
import { attachMenuConfirm } from '../input/menuConfirm';
import { hookShutdown } from './sceneLifecycle';

const LINES: { text: string; y: number; size: number; color: string }[] = [
  { text: 'CONTROLS', y: 70, size: 34, color: '#e8f1ff' },
  { text: 'KEYBOARD', y: 130, size: 20, color: '#8fb3ff' },
  { text: 'Arrows - move / aim up / crouch      Z - jump (hold for higher)      X - fire', y: 160, size: 15, color: '#cdd9f0' },
  { text: 'Hold Up + Left/Right and fire to shoot diagonally; Down + fire while', y: 184, size: 15, color: '#cdd9f0' },
  { text: 'airborne shoots downward, on the ground it is crouch-fire', y: 206, size: 15, color: '#cdd9f0' },
  { text: 'Also works: WASD - move / aim    Space - jump    J/K/Enter - fire', y: 230, size: 15, color: '#9fb3d8' },
  { text: 'Esc - pause    M - mute (paused)    F - reduced flash (paused)    F10 - fullscreen', y: 252, size: 15, color: '#cdd9f0' },
  { text: 'GAMEPAD', y: 278, size: 20, color: '#8fb3ff' },
  { text: 'D-pad / left stick - move + aim    A - jump    X or RB - fire    Start - pause', y: 308, size: 15, color: '#cdd9f0' },
  { text: 'TOUCH', y: 354, size: 20, color: '#8fb3ff' },
  { text: 'On-screen buttons: move, aim-up, jump, fire, pause', y: 384, size: 15, color: '#cdd9f0' },
  { text: 'MENUS', y: 424, size: 20, color: '#8fb3ff' },
  { text: 'Enter/Space, tap, or gamepad A/Start - confirm    Esc/gamepad Back - back', y: 450, size: 15, color: '#cdd9f0' },
  { text: 'Keys dead? A browser extension may be claiming Z/X/S/D - disable it,', y: 476, size: 13, color: '#e8b06f' },
  { text: 'or use Space to jump and J to fire. Diagnose with ?keys=1 in the URL.', y: 494, size: 13, color: '#e8b06f' },
  { text: 'ESC / ENTER - BACK', y: 518, size: 16, color: '#5c6c8c' }
];

/** Controls/help screen: lists keyboard, gamepad, and touch controls. */
export class HelpScene extends Phaser.Scene {
  private onKey?: (e: KeyboardEvent) => void;
  private detachConfirm?: () => void;

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
      if (e.code !== 'KeyH') {
        return;
      }
      e.preventDefault();
      this.scene.start(SCENE_KEYS.title);
    };
    window.addEventListener('keydown', this.onKey);
    this.detachConfirm = attachMenuConfirm(this, () => this.scene.start(SCENE_KEYS.title), {
      onBack: () => this.scene.start(SCENE_KEYS.title)
    });
    hookShutdown(this.events, () => this.shutdown());
  }

  public shutdown(): void {
    if (this.onKey) {
      window.removeEventListener('keydown', this.onKey);
      this.onKey = undefined;
    }
    if (this.detachConfirm) {
      this.detachConfirm();
      this.detachConfirm = undefined;
    }
  }
}
