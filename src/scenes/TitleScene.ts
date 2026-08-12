import Phaser from 'phaser';
import { GAME_VERSION, LOGICAL_HEIGHT, LOGICAL_WIDTH, SCENE_KEYS, TITLE_HEADING } from '../app/config';
import { reportScene, reportTitleHeading } from '../debug/debugBridge';
import { type AudioService } from '../audio/AudioService';
import { attachMenuConfirm } from '../input/menuConfirm';
import { hookShutdown } from './sceneLifecycle';

const HEADING_Y = 190;
const TAGLINE_Y = 248;

/**
 * Title screen for Operation Iron Echo.
 *
 * Renders the original title, a tagline, a start prompt, and a version label
 * using system fonts only - no external asset files are required. Starting
 * works from any device (Enter/Space, tap, or gamepad A/Start) and unlocks
 * audio on that first gesture; H/S/P open help, settings, and the prototype room.
 */
export class TitleScene extends Phaser.Scene {
  private onStart?: (e: KeyboardEvent) => void;
  private detachConfirm?: () => void;

  constructor() {
    super(SCENE_KEYS.title);
  }

  public create(): void {
    reportScene(SCENE_KEYS.title);
    reportTitleHeading(TITLE_HEADING);

    // Autoplay: `?autopilot` starts Level 1 with the built-in AI pilot;
    // `?autopilot=remote` disables the pilot so an external agent (see
    // docs/AUTOMATION.md) can play through the debug bridge instead.
    const autopilot = new URLSearchParams(window.location.search).get('autopilot');
    if (autopilot !== null) {
      this.registry.set('autopilot', autopilot !== 'remote');
      this.registry.set('currentLevelIndex', 0);
      this.scene.start(SCENE_KEYS.level);
      return;
    }

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
      .text(centerX, 300, 'PRESS ENTER OR SPACE TO START', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#cdd9f0'
      })
      .setOrigin(0.5);

    // Primary controls, shown up front so a new player never has to hunt.
    this.buildControlsPanel(centerX, 334);

    this.add
      .text(centerX, LOGICAL_HEIGHT - 42, 'H - HELP      S - SETTINGS      P - PROTOTYPE ROOM      I - WATCH AI PLAY', {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#6b7c9c'
      })
      .setOrigin(0.5);

    this.add
      .text(12, LOGICAL_HEIGHT - 16, 'v' + GAME_VERSION + ' - Operation Iron Echo - F10 fullscreen', {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#5c6c8c'
      })
      .setOrigin(0, 0.5);

    this.tweens.add({ targets: heading, alpha: 0.55, duration: 900, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    const startGame = (): void => {
      const audio = this.registry.get('audio') as AudioService | undefined;
      audio?.unlock();
      this.registry.set('currentLevelIndex', 0);
      this.scene.start(SCENE_KEYS.level);
    };

    this.onStart = (e: KeyboardEvent): void => {
      if (e.code === 'KeyH') {
        e.preventDefault();
        this.scene.start(SCENE_KEYS.help);
        return;
      }
      if (e.code === 'KeyS') {
        e.preventDefault();
        this.scene.start(SCENE_KEYS.settings);
        return;
      }
      if (e.code === 'KeyP') {
        e.preventDefault();
        const audio = this.registry.get('audio') as AudioService | undefined;
        audio?.unlock();
        this.scene.start(SCENE_KEYS.sandbox);
        return;
      }
      if (e.code === 'KeyI') {
        e.preventDefault();
        const audio = this.registry.get('audio') as AudioService | undefined;
        audio?.unlock();
        this.registry.set('autopilot', true);
        this.registry.set('currentLevelIndex', 0);
        this.scene.start(SCENE_KEYS.level);
        return;
      }
    };
    window.addEventListener('keydown', this.onStart);
    this.detachConfirm = attachMenuConfirm(this, startGame);
    hookShutdown(this.events, () => this.shutdown());
  }

  /**
   * Compact keyboard-controls card: a framed panel listing the primary
   * bindings, with the key names highlighted so they read at a glance.
   */
  private buildControlsPanel(centerX: number, top: number): void {
    const rows: readonly { keys: string; action: string }[] = [
      { keys: '← →', action: 'move' },
      { keys: '↑ / ↓', action: 'aim up / crouch' },
      { keys: 'Z', action: 'jump' },
      { keys: 'X', action: 'fire' },
      { keys: '↑ + → + X', action: 'shoot diagonally (45°)' }
    ];
    const rowHeight = 19;
    const panelHeight = rowHeight * rows.length + 30;
    const panelWidth = 380;

    this.add
      .rectangle(centerX, top, panelWidth, panelHeight, 0x111a2b, 0.85)
      .setOrigin(0.5, 0)
      .setStrokeStyle(1, 0x33415e);
    this.add
      .text(centerX, top + 7, 'KEYBOARD', { fontFamily: 'monospace', fontSize: '12px', color: '#8fb3ff' })
      .setOrigin(0.5, 0);

    // Two columns: right-aligned keys, left-aligned actions, so they line up.
    const keyColumnRight = centerX - 54;
    const actionColumnLeft = centerX - 38;
    rows.forEach((row, i) => {
      const y = top + 25 + i * rowHeight;
      this.add
        .text(keyColumnRight, y, row.keys, { fontFamily: 'monospace', fontSize: '14px', color: '#ffd970' })
        .setOrigin(1, 0);
      this.add
        .text(actionColumnLeft, y, row.action, { fontFamily: 'monospace', fontSize: '14px', color: '#cdd9f0' })
        .setOrigin(0, 0);
    });

    // Sits below the panel frame, not on it.
    this.add
      .text(centerX, top + panelHeight + 6, 'also: WASD move    Space jump    J fire', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#6b7c9c'
      })
      .setOrigin(0.5, 0);
  }

  public shutdown(): void {
    if (this.onStart) {
      window.removeEventListener('keydown', this.onStart);
      this.onStart = undefined;
    }
    if (this.detachConfirm) {
      this.detachConfirm();
      this.detachConfirm = undefined;
    }
  }
}
