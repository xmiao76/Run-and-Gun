/**
 * Original WebAudio sound + music service.
 *
 * All audio is synthesized at runtime (no asset files, ASSET_POLICY.md). Audio
 * only starts after a user gesture (browser autoplay rules) and the service is
 * fully failure-safe: if the AudioContext is unavailable or suspended, every
 * method is a silent no-op so gameplay is never blocked (I4).
 */

import { type Settings } from '../persistence/schema';

export type SfxName = 'jump' | 'shoot' | 'hit' | 'pickup' | 'explosion' | 'complete';

const SFX: Record<SfxName, { freq: number; duration: number; type: OscillatorType }> = {
  jump: { freq: 420, duration: 0.12, type: 'square' },
  shoot: { freq: 720, duration: 0.06, type: 'square' },
  hit: { freq: 160, duration: 0.14, type: 'sawtooth' },
  pickup: { freq: 880, duration: 0.12, type: 'triangle' },
  explosion: { freq: 90, duration: 0.3, type: 'sawtooth' },
  complete: { freq: 660, duration: 0.4, type: 'triangle' }
};

interface MinimalContext {
  currentTime: number;
  state: string;
  destination: unknown;
  resume(): Promise<void> | void;
  createGain(): MinimalGain;
  createOscillator(): MinimalOscillator;
}

interface MinimalGain {
  gain: { setValueAtTime(v: number, t: number): void; linearRampToValueAtTime(v: number, t: number): void };
  connect(dest: unknown): void;
}

interface MinimalOscillator {
  type: OscillatorType;
  frequency: { setValueAtTime(v: number, t: number): void };
  connect(dest: unknown): void;
  start(t: number): void;
  stop(t: number): void;
}

export interface AudioService {
  /** Call on the first user gesture; safe to call repeatedly. */
  unlock(): void;
  setSettings(settings: Settings): void;
  playSfx(name: SfxName): void;
  setMusic(on: boolean): void;
  stop(): void;
}

export function createAudioService(contextFactory: () => MinimalContext | null = defaultContextFactory): AudioService {
  let ctx: MinimalContext | null = null;
  let master: MinimalGain | null = null;
  let musicOsc: MinimalOscillator | null = null;
  let musicGain: MinimalGain | null = null;
  let settings: Settings = { version: 1, musicVolume: 0.6, sfxVolume: 0.8, mute: false, reducedFlash: false, controls: 'keyboard' };

  function ensure(): boolean {
    if (ctx) {
      return true;
    }
    try {
      ctx = contextFactory();
      if (!ctx) {
        return false;
      }
      master = ctx.createGain();
      master.gain.setValueAtTime(settings.mute ? 0 : 1, ctx.currentTime);
      master.connect(ctx.destination);
      return true;
    } catch {
      ctx = null;
      return false;
    }
  }

  return {
    unlock(): void {
      if (ensure() && ctx && ctx.state === 'suspended') {
        try {
          void ctx.resume();
        } catch {
          /* ignore */
        }
      }
    },
    setSettings(next: Settings): void {
      settings = next;
      if (master && ctx) {
        master.gain.setValueAtTime(settings.mute ? 0 : 1, ctx.currentTime);
      }
      if (musicGain && ctx) {
        musicGain.gain.setValueAtTime(settings.mute ? 0 : settings.musicVolume * 0.15, ctx.currentTime);
      }
    },
    playSfx(name: SfxName): void {
      if (!ensure() || !ctx || !master || settings.mute) {
        return;
      }
      try {
        const spec = SFX[name];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = spec.type;
        osc.frequency.setValueAtTime(spec.freq, ctx.currentTime);
        gain.gain.setValueAtTime(settings.sfxVolume * 0.25, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + spec.duration);
        osc.connect(gain);
        gain.connect(master);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + spec.duration + 0.02);
      } catch {
        /* ignore */
      }
    },
    setMusic(on: boolean): void {
      if (!ensure() || !ctx || !master) {
        return;
      }
      try {
        if (on && !musicOsc) {
          musicOsc = ctx.createOscillator();
          musicGain = ctx.createGain();
          musicOsc.type = 'triangle';
          musicOsc.frequency.setValueAtTime(110, ctx.currentTime);
          musicGain.gain.setValueAtTime(settings.mute ? 0 : settings.musicVolume * 0.15, ctx.currentTime);
          musicOsc.connect(musicGain);
          musicGain.connect(master);
          musicOsc.start(ctx.currentTime);
        } else if (!on && musicOsc) {
          musicOsc.stop(ctx.currentTime);
          musicOsc = null;
          musicGain = null;
        }
      } catch {
        musicOsc = null;
        musicGain = null;
      }
    },
    stop(): void {
      try {
        if (musicOsc && ctx) {
          musicOsc.stop(ctx.currentTime);
        }
      } catch {
        /* ignore */
      }
      musicOsc = null;
      musicGain = null;
    }
  };
}

function defaultContextFactory(): MinimalContext | null {
  try {
    const Ctor = (window as unknown as { AudioContext?: new () => MinimalContext; webkitAudioContext?: new () => MinimalContext })
      .AudioContext ?? (window as unknown as { webkitAudioContext?: new () => MinimalContext }).webkitAudioContext;
    return Ctor ? new Ctor() : null;
  } catch {
    return null;
  }
}
