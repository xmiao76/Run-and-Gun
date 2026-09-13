import Phaser from 'phaser';
import { LOGICAL_WIDTH, SCENE_KEYS } from '../app/config';
import { LEVELS } from '../levels/levels';
import { reportRuntime, reportScene } from '../debug/debugBridge';
import { type AudioService } from '../audio/AudioService';
import { DEFAULT_SETTINGS, type Settings } from '../persistence/schema';
import { saveSettings } from '../persistence/StorageService';
import { attachMenuConfirm } from '../input/menuConfirm';
import { hookShutdown } from './sceneLifecycle';
import { drawText } from '../ui/text';
import { attachScanlines } from '../ui/scanlines';

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
    // Screen music: the stage-clear theme.
    (this.registry.get('audio') as AudioService | undefined)?.setMusic('results');
    attachScanlines(this);
    const score = (this.registry.get('lastScore') as number | undefined) ?? 0;
    const idx = (this.registry.get('currentLevelIndex') as number | undefined) ?? 0;
    const final = idx >= LEVELS.length - 1;

    const settings = (this.registry.get('settings') as Settings | undefined) ?? { ...DEFAULT_SETTINGS };
    // The attract demo's score is a machine's, not the player's: it must never
    // be persisted as a best (or shown as one afterwards).
    const attractMode = this.registry.get('attractMode') === true;
    const bestScore = Math.max(settings.bestScore, attractMode ? 0 : score);
    if (!attractMode && bestScore !== settings.bestScore) {
      const next = { ...settings, bestScore };
      this.registry.set('settings', next);
      saveSettings(next);
    }

    reportRuntime({ score, bestScore, final, scene: SCENE_KEYS.results });

    const cx = LOGICAL_WIDTH / 2;
    const autopilot = this.registry.get('autopilot') === true;
    drawText(this, cx, 190, final ? 'MISSION COMPLETE' : 'LEVEL COMPLETE', {
      size: 40,
      color: final ? '#ffd970' : '#9be8a0',
      originX: 0.5,
      originY: 0.5
    });
    if (final) {
      drawText(this, cx, 250, 'ALL SECTORS CLEAR', { size: 24, color: '#e8f1ff', originX: 0.5, originY: 0.5 });
    }
    drawText(this, cx, final ? 296 : 270, 'SCORE ' + score + '   BEST ' + bestScore, { size: 24, color: '#e8f1ff', originX: 0.5, originY: 0.5 });
    const prompt = drawText(this, cx, 350, final ? 'PRESS ENTER OR SPACE - TITLE' : 'PRESS ENTER OR SPACE - NEXT LEVEL', {
      size: 16,
      color: '#8fa3c7',
      originX: 0.5,
      originY: 0.5
    });
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    let advanced = false;
    const advance = (): void => {
      if (advanced) {
        return;
      }
      advanced = true;
      if (attractMode) {
        // The demo is over: back to the title, where the idle timer will start
        // the cycle again after a beat.
        this.registry.set('attractMode', false);
        this.registry.set('autopilot', false);
        this.registry.set('currentLevelIndex', 0);
        this.scene.start(SCENE_KEYS.title);
      } else if (final) {
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
    if (autopilot || attractMode) {
      drawText(this, cx, 390, attractMode ? 'DEMO' : 'AI PLAYING - advancing...', {
        size: 16,
        color: '#ffd970',
        originX: 0.5,
        originY: 0.5
      });
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
