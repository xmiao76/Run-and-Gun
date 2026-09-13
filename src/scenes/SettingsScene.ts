import Phaser from 'phaser';
import { LOGICAL_WIDTH, SCENE_KEYS } from '../app/config';
import { reportRuntime, reportScene } from '../debug/debugBridge';
import { type AudioService } from '../audio/AudioService';
import { DEFAULT_SETTINGS, nextStartingLives, type Settings } from '../persistence/schema';
import { saveSettings } from '../persistence/StorageService';
import { hookShutdown } from './sceneLifecycle';
import { drawText } from '../ui/text';
import { attachScanlines } from '../ui/scanlines';

/**
 * Settings screen (PROJECT.md, Persistence). Adjusts music and SFX
 * volume, mute, and reduced-flash; every change is persisted through the
 * versioned, validated storage service.
 */
export class SettingsScene extends Phaser.Scene {
  private settings: Settings = { ...DEFAULT_SETTINGS };
  private rows: Phaser.GameObjects.BitmapText[] = [];
  private refreshScanlines?: () => void;
  private onKey?: (e: KeyboardEvent) => void;

  constructor() {
    super(SCENE_KEYS.settings);
  }

  public create(): void {
    reportScene(SCENE_KEYS.settings);
    this.refreshScanlines = attachScanlines(this);
    this.settings = (this.registry.get('settings') as Settings | undefined) ?? { ...DEFAULT_SETTINGS };
    this.rows = [];

    const cx = LOGICAL_WIDTH / 2;
    drawText(this, cx, 110, 'SETTINGS', { size: 40, color: '#e8f1ff', originX: 0.5, originY: 0.5 });
    for (const y of [170, 206, 242, 278, 314, 350]) {
      this.rows.push(drawText(this, cx, y, '', { size: 16, color: '#cdd9f0', originX: 0.5, originY: 0.5 }));
    }
    drawText(this, cx, 392, 'LEFT/RIGHT music    UP/DOWN sfx    M mute    F reduced flash    C scanlines', {
      size: 16,
      color: '#5c6c8c',
      originX: 0.5,
      originY: 0.5
    });
    drawText(this, cx, 414, 'L starting lives    ESC back', { size: 16, color: '#5c6c8c', originX: 0.5, originY: 0.5 });

    this.refresh();
    this.publish();

    this.onKey = (e: KeyboardEvent): void => {
      if (e.code === 'Escape' || e.code === 'Enter') {
        e.preventDefault();
        this.scene.start(SCENE_KEYS.title);
        return;
      }
      const next = this.adjust(e.code, this.settings);
      if (!next) {
        return;
      }
      e.preventDefault();
      this.settings = next;
      this.registry.set('settings', this.settings);
      saveSettings(this.settings);
      const audio = this.registry.get('audio') as AudioService | undefined;
      audio?.setSettings(this.settings);
      this.refresh();
      this.publish();
    };
    window.addEventListener('keydown', this.onKey);
    hookShutdown(this.events, () => this.shutdown());
  }

  private adjust(code: string, s: Settings): Settings | null {
    switch (code) {
      case 'ArrowLeft':
        return { ...s, musicVolume: clampStep(s.musicVolume - 0.1) };
      case 'ArrowRight':
        return { ...s, musicVolume: clampStep(s.musicVolume + 0.1) };
      case 'ArrowUp':
        return { ...s, sfxVolume: clampStep(s.sfxVolume + 0.1) };
      case 'ArrowDown':
        return { ...s, sfxVolume: clampStep(s.sfxVolume - 0.1) };
      case 'KeyM':
        return { ...s, mute: !s.mute };
      case 'KeyF':
        return { ...s, reducedFlash: !s.reducedFlash };
      case 'KeyL':
        return { ...s, startingLives: nextStartingLives(s.startingLives) };
      case 'KeyC':
        return { ...s, scanlines: !s.scanlines };
      default:
        return null;
    }
  }

  private refresh(): void {
    this.rows[0].setText('MUSIC VOLUME   < ' + Math.round(this.settings.musicVolume * 10) + ' >');
    this.rows[1].setText('SFX VOLUME     < ' + Math.round(this.settings.sfxVolume * 10) + ' >');
    this.rows[2].setText('MUTE (M): ' + (this.settings.mute ? 'ON' : 'OFF'));
    this.rows[3].setText('REDUCED FLASH (F): ' + (this.settings.reducedFlash ? 'ON' : 'OFF'));
    this.rows[4].setText('STARTING LIVES (L): < ' + this.settings.startingLives + ' >');
    this.rows[5].setText('SCANLINES (C): ' + (this.settings.scanlines ? 'ON' : 'OFF'));
    // The overlay updates in place, so toggling shows the effect immediately.
    this.refreshScanlines?.();
  }

  private publish(): void {
    reportRuntime({
      scene: SCENE_KEYS.settings,
      musicVolume: this.settings.musicVolume,
      sfxVolume: this.settings.sfxVolume,
      mute: this.settings.mute,
      reducedFlash: this.settings.reducedFlash,
      scanlines: this.settings.scanlines,
      startingLives: this.settings.startingLives
    });
  }

  public shutdown(): void {
    if (this.onKey) {
      window.removeEventListener('keydown', this.onKey);
      this.onKey = undefined;
    }
  }
}

function clampStep(v: number): number {
  return Math.min(1, Math.max(0, Math.round(v * 10) / 10));
}
