import Phaser from 'phaser';
import { LOGICAL_WIDTH, SCENE_KEYS } from '../app/config';
import { reportRuntime, reportScene } from '../debug/debugBridge';

/**
 * Game-over screen (GAME_REQUIREMENTS.md section 11). Shown when all lives are
 * lost. R restarts the current level; T returns to the title screen.
 */
export class GameOverScene extends Phaser.Scene {
  private onKey?: (e: KeyboardEvent) => void;

  constructor() {
    super(SCENE_KEYS.gameOver);
  }

  public create(): void {
    reportScene(SCENE_KEYS.gameOver);
    const score = (this.registry.get('lastScore') as number | undefined) ?? 0;
    reportRuntime({ score, scene: SCENE_KEYS.gameOver });

    const cx = LOGICAL_WIDTH / 2;
    this.add
      .text(cx, 190, 'GAME OVER', { fontFamily: 'monospace', fontSize: '46px', color: '#ff7777', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add
      .text(cx, 260, 'SCORE ' + score, { fontFamily: 'monospace', fontSize: '24px', color: '#e8f1ff' })
      .setOrigin(0.5);
    const prompt = this.add
      .text(cx, 340, 'R RESTART LEVEL      T TITLE', { fontFamily: 'monospace', fontSize: '18px', color: '#8fa3c7' })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    this.onKey = (e: KeyboardEvent): void => {
      if (e.code === 'KeyR') {
        e.preventDefault();
        this.scene.start(SCENE_KEYS.level);
      } else if (e.code === 'KeyT') {
        e.preventDefault();
        this.scene.start(SCENE_KEYS.title);
      }
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
