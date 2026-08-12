import Phaser from 'phaser';
import { LOGICAL_WIDTH, SCENE_KEYS } from '../app/config';
import { LEVELS } from '../levels/levels';
import { reportRuntime, reportScene } from '../debug/debugBridge';
import { DEFAULT_SETTINGS, type Settings } from '../persistence/schema';
import { saveSettings } from '../persistence/StorageService';
import { attachMenuConfirm } from '../input/menuConfirm';
import { hookShutdown } from './sceneLifecycle';

/**
 * Level-complete / final-completion screen. After a non-final level it offers
 * the next level; after the last level it shows mission completion. Continuing
 * works from any device (Enter/Space, tap, or gamepad A/Start). Persists the
 * best score through validated storage.
 */
export class ResultsScene extends Phaser.Scene {
  private detachConfirm?: () => void;

  constructor() {
    super(SCENE_KEYS.results);
  }

  public create(): void {
    reportScene(SCENE_KEYS.results);
    const score = (this.registry.get('lastScore') as number | undefined) ?? 0;
    const idx = (this.registry.get('currentLevelIndex') as number | undefined) ?? 0;
    const final = idx >= LEVELS.length - 1;

    const settings = (this.registry.get('settings') as Settings | undefined) ?? { ...DEFAULT_SETTINGS };
    const bestScore = Math.max(settings.bestScore, score);
    if (bestScore !== settings.bestScore) {
      const next = { ...settings, bestScore };
      this.registry.set('settings', next);
      saveSettings(next);
    }

    reportRuntime({ score, bestScore, final, scene: SCENE_KEYS.results });

    const cx = LOGICAL_WIDTH / 2;
    const autopilot = this.registry.get('autopilot') === true;
    this.add
      .text(cx, 190, final ? 'MISSION COMPLETE' : 'LEVEL COMPLETE', {
        fontFamily: 'monospace',
        fontSize: '44px',
        color: final ? '#ffd970' : '#9be8a0',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    if (final) {
      this.add
        .text(cx, 250, 'ALL SECTORS CLEAR', { fontFamily: 'monospace', fontSize: '20px', color: '#e8f1ff' })
        .setOrigin(0.5);
    }
    this.add
      .text(cx, final ? 296 : 270, 'SCORE ' + score + '   BEST ' + bestScore, { fontFamily: 'monospace', fontSize: '24px', color: '#e8f1ff' })
      .setOrigin(0.5);
    const prompt = this.add
      .text(cx, 350, final ? 'PRESS ENTER OR SPACE - TITLE' : 'PRESS ENTER OR SPACE - NEXT LEVEL', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#8fa3c7'
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    let advanced = false;
    const advance = (): void => {
      if (advanced) {
        return;
      }
      advanced = true;
      if (final) {
        this.registry.set('currentLevelIndex', 0);
        this.scene.start(SCENE_KEYS.title);
      } else {
        this.registry.set('currentLevelIndex', idx + 1);
        this.scene.start(SCENE_KEYS.level);
      }
    };
    this.detachConfirm = attachMenuConfirm(this, advance);

    // When the AI pilot is driving, keep the run going hands-free instead of
    // waiting on a menu keypress: auto-advance after a short beat. The player
    // can still press a key to skip ahead or switch the pilot off in-level.
    if (autopilot) {
      this.add
        .text(cx, 390, 'AI PLAYING - advancing...', { fontFamily: 'monospace', fontSize: '14px', color: '#ffd970' })
        .setOrigin(0.5);
      this.time.delayedCall(2000, advance);
    }
    hookShutdown(this.events, () => this.shutdown());
  }

  public shutdown(): void {
    if (this.detachConfirm) {
      this.detachConfirm();
      this.detachConfirm = undefined;
    }
  }
}
