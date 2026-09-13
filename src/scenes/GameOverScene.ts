import Phaser from 'phaser';
import { LOGICAL_WIDTH, SCENE_KEYS } from '../app/config';
import { reportRuntime, reportScene } from '../debug/debugBridge';
import { DEFAULT_SETTINGS, type Settings } from '../persistence/schema';
import { saveSettings } from '../persistence/StorageService';
import { attachMenuConfirm } from '../input/menuConfirm';
import { hookShutdown } from './sceneLifecycle';

/**
 * Game-over screen. Shown when all lives are lost. R (or Enter/tap/gamepad
 * A/Start) restarts the current level; T (or Escape/gamepad Back) returns to
 * the title screen. Persists the best score through validated storage.
 */
export class GameOverScene extends Phaser.Scene {
  private onKey?: (e: KeyboardEvent) => void;
  private detachConfirm?: () => void;

  constructor() {
    super(SCENE_KEYS.gameOver);
  }

  public create(): void {
    reportScene(SCENE_KEYS.gameOver);
    const score = (this.registry.get('lastScore') as number | undefined) ?? 0;
    const settings = (this.registry.get('settings') as Settings | undefined) ?? { ...DEFAULT_SETTINGS };
    const bestScore = Math.max(settings.bestScore, score);
    if (bestScore !== settings.bestScore) {
      const next = { ...settings, bestScore };
      this.registry.set('settings', next);
      saveSettings(next);
    }
    reportRuntime({ score, bestScore, scene: SCENE_KEYS.gameOver });

    const cx = LOGICAL_WIDTH / 2;
    this.add
      .text(cx, 190, 'GAME OVER', { fontFamily: 'monospace', fontSize: '46px', color: '#ff7777', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.add
      .text(cx, 260, 'SCORE ' + score + '   BEST ' + bestScore, { fontFamily: 'monospace', fontSize: '22px', color: '#e8f1ff' })
      .setOrigin(0.5);
    const prompt = this.add
      .text(cx, 340, 'R RESTART LEVEL      T TITLE', { fontFamily: 'monospace', fontSize: '18px', color: '#8fa3c7' })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    // One latch for both exits: a keydown and a pointerdown can land in the
    // same frame (attachMenuConfirm listens for both), and `scene.start` only
    // queues, so without this two scene swaps get queued from one gesture.
    let left = false;
    const restart = (): void => {
      if (left) {
        return;
      }
      left = true;
      this.scene.start(SCENE_KEYS.level);
    };
    const toTitle = (): void => {
      if (left) {
        return;
      }
      left = true;
      this.scene.start(SCENE_KEYS.title);
    };

    this.onKey = (e: KeyboardEvent): void => {
      if (e.code === 'KeyR') {
        e.preventDefault();
        restart();
      } else if (e.code === 'KeyT') {
        e.preventDefault();
        toTitle();
      }
    };
    window.addEventListener('keydown', this.onKey);
    this.detachConfirm = attachMenuConfirm(this, restart, { onBack: toTitle });
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
