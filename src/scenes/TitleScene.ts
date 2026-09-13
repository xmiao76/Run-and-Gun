import Phaser from 'phaser';
import { GAME_VERSION, LOGICAL_HEIGHT, LOGICAL_WIDTH, SCENE_KEYS, TITLE_HEADING } from '../app/config';
import { reportScene, reportTitleHeading, isDebugEnabled, manualClockRequested } from '../debug/debugBridge';
import { type AudioService } from '../audio/AudioService';
import { attachMenuConfirm } from '../input/menuConfirm';
import { hookShutdown } from './sceneLifecycle';
import { drawText } from '../ui/text';
import { attachScanlines } from '../ui/scanlines';
import { attractDelayMs } from '../ui/attract';
import { SKY_TEXTURE } from '../art/textureKeys';
import { ensureGameTextures } from '../art/textures';

import { PALETTE_HEX } from '../art/palette';
const HEADING_Y = 190;
const TAGLINE_Y = 248;

/**
 * Title screen for Operation Iron Echo.
 *
 * Renders the original title, a tagline, a start prompt, and a version label
 * in the game's own pixel font (src/art/font.ts) - no external asset files are
 * required. Starting
 * works from any device (Enter/Space, tap, or gamepad A/Start) and unlocks
 * audio on that first gesture; H/S/P open help, settings, and the prototype room.
 */
export class TitleScene extends Phaser.Scene {
  private onStart?: (e: KeyboardEvent) => void;
  private detachConfirm?: () => void;
  /** Milliseconds idle on the title, counting toward the attract demo. */
  private idleMs = 0;
  /** Demo delay for this visit, or null when attract mode is suppressed. */
  private attractMs: number | null = null;

  constructor() {
    super(SCENE_KEYS.title);
  }

  public create(): void {
    reportScene(SCENE_KEYS.title);
    // Screen music: title theme.
    (this.registry.get('audio') as AudioService | undefined)?.setMusic('title');
    attachScanlines(this);
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

    // The backdrop needs the sprite sheet compiled; the title never had art
    // before, so nothing had registered it on a fresh page load (textures show
    // as the green missing-texture placeholder otherwise).
    ensureGameTextures(this);

    const centerX = LOGICAL_WIDTH / 2;

    // Backdrop: the game's own sky gradient, starfield and ground, so the
    // title reads as part of the game rather than a flat menu page.
    this.add.image(0, 0, SKY_TEXTURE).setOrigin(0, 0).setDisplaySize(LOGICAL_WIDTH, LOGICAL_HEIGHT);
    this.add.tileSprite(0, 0, LOGICAL_WIDTH, 320, 'art/bg-stars').setOrigin(0, 0);
    this.add.tileSprite(0, 436, LOGICAL_WIDTH, 44, 'art/bg-ridge').setOrigin(0, 0).setAlpha(0.7);
    this.add.tileSprite(0, 480, LOGICAL_WIDTH, 60, 'art/tile-ground').setOrigin(0, 0);
    // The commando stands on the strip, in the same art as the game.
    this.add.image(centerX - 300, 480, 'art/player-idle').setOrigin(0.5, 1).setScale(3);

    // The project emblem (the favicon's shield + echo wave at sprite scale).
    this.add.image(centerX, 84, 'art/logo-emblem').setOrigin(0.5, 0.5).setScale(2);

    // Attract mode: a person at the title gets a demo; anything automated does
    // not (see src/ui/attract.ts for the suppression rules).
    this.idleMs = 0;
    this.attractMs = attractDelayMs(window.location.search, isDebugEnabled(), manualClockRequested());

    const heading = drawText(this, centerX, HEADING_Y, TITLE_HEADING, {
      size: 48,
      color: '#e8f1ff',
      originX: 0.5,
      originY: 0.5
    });

    drawText(this, centerX, TAGLINE_Y, 'An original browser run-and-gun', {
      size: 16,
      color: '#8fa3c7',
      originX: 0.5,
      originY: 0.5
    });

    const prompt = drawText(this, centerX, 300, 'PRESS ENTER OR SPACE TO START', {
      size: 16,
      color: '#cdd9f0',
      originX: 0.5,
      originY: 0.5
    });

    // Primary controls, shown up front so a new player never has to hunt.
    this.buildControlsPanel(centerX, 334);

    drawText(this, centerX, LOGICAL_HEIGHT - 42, 'H - HELP    S - SETTINGS    P - PROTOTYPE ROOM    I - WATCH AI PLAY', {
      size: 8,
      color: '#6b7c9c',
      originX: 0.5,
      originY: 0.5
    });

    drawText(this, 12, LOGICAL_HEIGHT - 16, 'v' + GAME_VERSION + ' - Operation Iron Echo - F10 fullscreen', {
      size: 16,
      color: '#5c6c8c',
      originX: 0,
      originY: 0.5
    });

    this.tweens.add({ targets: heading, alpha: 0.55, duration: 900, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: prompt, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });

    const startGame = (): void => {
      const audio = this.registry.get('audio') as AudioService | undefined;
      audio?.unlock();
      this.registry.set('attractMode', false);
      this.registry.set('autopilot', false);
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
        // I is the player-chosen AI demo, not attract mode.
        this.registry.set('attractMode', false);
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
    const rowHeight = 22;
    const panelHeight = rowHeight * rows.length + 30;
    const panelWidth = 380;

    this.add
      .rectangle(centerX, top, panelWidth, panelHeight, PALETTE_HEX.PANEL, 0.85)
      .setOrigin(0.5, 0)
      .setStrokeStyle(1, PALETTE_HEX.BLUE_DARK);
    drawText(this, centerX, top + 7, 'KEYBOARD', { size: 8, color: '#8fb3ff', originX: 0.5, originY: 0 });

    // Two columns: right-aligned keys, left-aligned actions, so they line up.
    const keyColumnRight = centerX - 54;
    const actionColumnLeft = centerX - 38;
    rows.forEach((row, i) => {
      const y = top + 25 + i * rowHeight;
      drawText(this, keyColumnRight, y, row.keys, { size: 16, color: '#ffd970', originX: 1, originY: 0 });
      drawText(this, actionColumnLeft, y, row.action, { size: 16, color: '#cdd9f0', originX: 0, originY: 0 });
    });

    // Sits below the panel frame, not on it.
    drawText(this, centerX, top + panelHeight + 6, 'also: WASD move    Space jump    J fire', {
      size: 8,
      color: '#6b7c9c',
      originX: 0.5,
      originY: 0
    });
  }

  public override update(_time: number, deltaMs: number): void {
    if (this.attractMs === null) {
      return;
    }
    this.idleMs += deltaMs;
    if (this.idleMs >= this.attractMs) {
      // The arcade demo: the built-in pilot plays Level 1. Any human input in
      // the level ends the demo and returns here (see LevelScene).
      this.attractMs = null;
      this.registry.set('attractMode', true);
      this.registry.set('autopilot', true);
      this.registry.set('currentLevelIndex', 0);
      this.scene.start(SCENE_KEYS.level);
    }
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
