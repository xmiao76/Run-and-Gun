import Phaser from 'phaser';
import { LOGICAL_WIDTH, SCENE_KEYS } from '../app/config';
import { reportRuntime, reportScene } from '../debug/debugBridge';

/**
 * Level-complete / results screen. Shows the score recorded by the level and
 * returns to the title on Enter/Space. Non-interactive gameplay; no simulation.
 */
export class ResultsScene extends Phaser.Scene {
  private onContinue?: (e: KeyboardEvent) => void;

  constructor() {
    super(SCENE_KEYS.results);
  }

  public create(): void {
    reportScene(SCENE_KEYS.results);
    const score = (this.registry.get('lastScore') as number | undefined) ?? 0;
    reportRuntime({ score, scene: SCENE_KEYS.results });

    const cx = LOGICAL_WIDTH / 2;
    this.add
      .text(cx, 200, 'LEVEL COMPLETE', { fontFamily: 'monospace', fontSize: '44px', color: '#9be8a0', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add
      .text(cx, 270, 'SCORE ' + score, { fontFamily: 'monospace', fontSize: '26px', color: '#e8f1ff' })
      .setOrigin(0.5);
    const prompt = this.add
      .text(cx, 340, 'PRESS ENTER OR SPACE', { fontFamily: 'monospace', fontSize: '18px', color: '#8fa3c7' })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    this.onContinue = (e: KeyboardEvent): void => {
      if (e.code !== 'Enter' && e.code !== 'Space') {
        return;
      }
      e.preventDefault();
      this.scene.start(SCENE_KEYS.title);
    };
    window.addEventListener('keydown', this.onContinue);
  }

  public shutdown(): void {
    if (this.onContinue) {
      window.removeEventListener('keydown', this.onContinue);
      this.onContinue = undefined;
    }
  }
}
