/**
 * Original WebAudio sound + music service.
 *
 * All audio is synthesized at runtime (no asset files, ASSET_POLICY.md). Audio
 * only starts after a user gesture (browser autoplay rules) and the service is
 * fully failure-safe: if the AudioContext is unavailable or suspended, every
 * method is a silent no-op so gameplay is never blocked (I4).
 */

import { DEFAULT_SETTINGS, type Settings } from '../persistence/schema';

export type SfxName = 'jump' | 'shoot' | 'hit' | 'pickup' | 'explosion' | 'complete' | 'telegraph' | 'door' | 'respawn';

const SFX: Record<SfxName, { freq: number; duration: number; type: OscillatorType }> = {
  jump: { freq: 420, duration: 0.12, type: 'square' },
  shoot: { freq: 720, duration: 0.06, type: 'square' },
  hit: { freq: 160, duration: 0.14, type: 'sawtooth' },
  pickup: { freq: 880, duration: 0.12, type: 'triangle' },
  explosion: { freq: 90, duration: 0.3, type: 'sawtooth' },
  complete: { freq: 660, duration: 0.4, type: 'triangle' },
  telegraph: { freq: 520, duration: 0.16, type: 'sawtooth' },
  door: { freq: 240, duration: 0.2, type: 'square' },
  respawn: { freq: 330, duration: 0.25, type: 'triangle' }
};

/**
 * Original background-music pattern (bass with a light arpeggio accent),
 * composed for this project - not transcribed from any existing work.
 */
const MUSIC_PATTERN: { bass: number; arp: number | null }[] = [
  { bass: 110.0, arp: 220.0 },
  { bass: 110.0, arp: null },
  { bass: 164.81, arp: 329.63 },
  { bass: 110.0, arp: null },
  { bass: 98.0, arp: 220.0 },
  { bass: 110.0, arp: null },
  { bass: 82.41, arp: 196.0 },
  { bass: 98.0, arp: null }
];
const MUSIC_STEP = 0.25;
const MUSIC_LOOP_MS = MUSIC_PATTERN.length * MUSIC_STEP * 1000;

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
  let musicTimer: ReturnType<typeof setInterval> | null = null;
  let musicNodes: MinimalOscillator[] = [];
  let settings: Settings = { ...DEFAULT_SETTINGS };

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

  function scheduleNote(freq: number, time: number, duration: number, type: OscillatorType, volume: number): void {
    if (!ctx || !master) {
      return;
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.linearRampToValueAtTime(0, time + duration);
    osc.connect(gain);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + duration + 0.02);
    musicNodes.push(osc);
  }

  function scheduleLoop(): void {
    if (!ctx) {
      return;
    }
    const t0 = ctx.currentTime + 0.05;
    MUSIC_PATTERN.forEach((step, i) => {
      const t = t0 + i * MUSIC_STEP;
      scheduleNote(step.bass, t, MUSIC_STEP * 0.9, 'triangle', settings.musicVolume * 0.1);
      if (step.arp !== null) {
        scheduleNote(step.arp, t + 0.06, MUSIC_STEP * 0.5, 'square', settings.musicVolume * 0.045);
      }
    });
  }

  function startMusic(): void {
    if (!ensure() || !ctx || !master || musicTimer !== null) {
      return;
    }
    try {
      scheduleLoop();
      musicTimer = setInterval(scheduleLoop, MUSIC_LOOP_MS);
    } catch {
      musicTimer = null;
    }
  }

  function stopMusic(): void {
    if (musicTimer !== null) {
      clearInterval(musicTimer);
      musicTimer = null;
    }
    if (ctx) {
      for (const osc of musicNodes) {
        try {
          osc.stop(ctx.currentTime);
        } catch {
          /* ignore */
        }
      }
    }
    musicNodes = [];
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
      if (on) {
        startMusic();
      } else {
        stopMusic();
      }
    },
    stop(): void {
      stopMusic();
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
