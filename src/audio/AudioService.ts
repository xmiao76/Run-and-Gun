/**
 * Original WebAudio sound + music service.
 *
 * All audio is synthesized at runtime (no asset files, ASSET_POLICY.md). Audio
 * only starts after a user gesture (browser autoplay rules) and the service is
 * fully failure-safe: if the AudioContext is unavailable or suspended, every
 * method is a silent no-op so gameplay is never blocked (I4).
 */

import { DEFAULT_SETTINGS, type Settings } from '../persistence/schema';
import { stageTrack, TRACKS, trackLoopMs, type DrumHit, type TrackId } from './music';

export { stageTrack, type TrackId };

export type SfxName =
  | 'jump'
  | 'shoot'
  | 'shootScatter'
  | 'shootRapid'
  | 'shootLaser'
  | 'shootFlame'
  | 'hit'
  | 'enemyDeath'
  | 'playerDeath'
  | 'bossHit'
  | 'pickup'
  | 'explosion'
  | 'complete'
  | 'telegraph'
  | 'door'
  | 'respawn';

const SFX: Record<SfxName, { freq: number; duration: number; type: OscillatorType }> = {
  jump: { freq: 420, duration: 0.12, type: 'square' },
  shoot: { freq: 720, duration: 0.06, type: 'square' },
  // One voice per weapon, so a shot is identifiable with your eyes shut: the
  // laser a high thin sawtooth lance, the flare a low soft triangle whoomph.
  shootScatter: { freq: 520, duration: 0.09, type: 'square' },
  shootRapid: { freq: 880, duration: 0.04, type: 'square' },
  shootLaser: { freq: 1180, duration: 0.09, type: 'sawtooth' },
  shootFlame: { freq: 300, duration: 0.14, type: 'triangle' },
  // TASK-037: three impacts that had no sound at all. `hit` stays as the
  // generic light impact; these are the heavy ones it was standing in for.
  enemyDeath: { freq: 200, duration: 0.18, type: 'sawtooth' },
  bossHit: { freq: 140, duration: 0.1, type: 'square' },
  playerDeath: { freq: 120, duration: 0.5, type: 'sawtooth' },
  hit: { freq: 160, duration: 0.14, type: 'sawtooth' },
  pickup: { freq: 880, duration: 0.12, type: 'triangle' },
  explosion: { freq: 90, duration: 0.3, type: 'sawtooth' },
  complete: { freq: 660, duration: 0.4, type: 'triangle' },
  telegraph: { freq: 520, duration: 0.16, type: 'sawtooth' },
  door: { freq: 240, duration: 0.2, type: 'square' },
  respawn: { freq: 330, duration: 0.25, type: 'triangle' }
};

/** Percussion voices: duration and filter shape per hit (see `scheduleDrum`). */
const DRUMS: Readonly<Record<DrumHit, { duration: number; volume: number; highpass: boolean }>> = {
  kick: { duration: 0.13, volume: 0.55, highpass: false },
  snare: { duration: 0.11, volume: 0.32, highpass: true },
  hat: { duration: 0.035, volume: 0.16, highpass: true }
};

interface MinimalContext {
  currentTime: number;
  state: string;
  destination: unknown;
  resume(): Promise<void> | void;
  createGain(): MinimalGain;
  createOscillator(): MinimalOscillator;
  /**
   * Noise percussion support, all OPTIONAL.
   *
   * A context without these still plays every tone; it just has no drums. That
   * keeps the service working against a minimal or stubbed context - which the
   * unit tests provide - and honours the standing rule that audio degrades
   * rather than throws.
   */
  sampleRate?: number;
  createBuffer?(channels: number, length: number, sampleRate: number): MinimalBuffer;
  createBufferSource?(): MinimalBufferSource;
  createBiquadFilter?(): MinimalFilter;
}

interface MinimalBuffer {
  getChannelData(channel: number): Float32Array;
}

interface MinimalBufferSource {
  buffer: MinimalBuffer | null;
  connect(dest: unknown): void;
  start(t: number): void;
  stop(t: number): void;
}

interface MinimalFilter {
  type: string;
  frequency: { setValueAtTime(v: number, t: number): void };
  connect(dest: unknown): void;
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
  /**
   * Play a track, or `null` for silence.
   *
   * Switching to the track already playing is a no-op, so a scene may call
   * this every step without restarting the loop and stuttering.
   */
  setMusic(track: TrackId | null): void;
  stop(): void;
}

export function createAudioService(contextFactory: () => MinimalContext | null = defaultContextFactory): AudioService {
  let ctx: MinimalContext | null = null;
  let master: MinimalGain | null = null;
  let musicTimer: ReturnType<typeof setInterval> | null = null;
  let musicNodes: { stop(t: number): void }[] = [];
  let settings: Settings = { ...DEFAULT_SETTINGS };
  let currentTrack: TrackId | null = null;
  /** One shared noise buffer, built lazily; percussion is skipped without it. */
  let noiseBuffer: MinimalBuffer | null = null;

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

  /**
   * One second of white noise, reused by every drum hit.
   *
   * Built once and cached: allocating a buffer per hit would churn the heap,
   * and the soak test watches for exactly that.
   */
  function ensureNoise(): MinimalBuffer | null {
    if (noiseBuffer) {
      return noiseBuffer;
    }
    if (!ctx || !ctx.createBuffer) {
      return null;
    }
    try {
      const rate = ctx.sampleRate ?? 44100;
      const buffer = ctx.createBuffer(1, rate, rate);
      const data = buffer.getChannelData(0);
      // Deterministic noise from a small LCG rather than Math.random, so the
      // percussion is identical run to run - the same reason nothing else in
      // this project uses RNG.
      let seed = 22222;
      for (let i = 0; i < data.length; i++) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        data[i] = (seed / 0x3fffffff) - 1;
      }
      noiseBuffer = buffer;
      return buffer;
    } catch {
      return null;
    }
  }

  /** A percussion hit: filtered noise, or nothing if the context cannot make it. */
  function scheduleDrum(hit: DrumHit, time: number, volume: number): void {
    if (!ctx || !master || !ctx.createBufferSource) {
      return;
    }
    const buffer = ensureNoise();
    if (!buffer) {
      return;
    }
    const spec = DRUMS[hit];
    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume * spec.volume, time);
      gain.gain.linearRampToValueAtTime(0, time + spec.duration);
      // A high-pass turns the same noise into a snare or hat; without a filter
      // node every hit is a kick, which is still better than silence.
      if (spec.highpass && ctx.createBiquadFilter) {
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(hit === 'hat' ? 7000 : 1400, time);
        source.connect(filter);
        filter.connect(gain);
      } else {
        source.connect(gain);
      }
      gain.connect(master);
      source.start(time);
      source.stop(time + spec.duration + 0.02);
      musicNodes.push(source);
      // A kick also gets a short low tone, which is what gives it its weight.
      if (hit === 'kick') {
        scheduleNote(60, time, spec.duration, 'sine', volume * 0.5);
      }
    } catch {
      /* percussion is optional; never let it break the music */
    }
  }

  function scheduleLoop(): void {
    if (!ctx || currentTrack === null) {
      return;
    }
    const track = TRACKS[currentTrack];
    const t0 = ctx.currentTime + 0.05;
    track.steps.forEach((s, i) => {
      const t = t0 + i * track.stepSeconds;
      if (s.bass !== null) {
        scheduleNote(s.bass, t, track.stepSeconds * 0.9, 'triangle', settings.musicVolume * 0.1);
      }
      if (s.lead !== null) {
        scheduleNote(s.lead, t + 0.02, track.stepSeconds * 0.55, 'square', settings.musicVolume * 0.04);
      }
      if (s.drum !== null) {
        scheduleDrum(s.drum, t, settings.musicVolume * 0.5);
      }
    });
  }

  function startMusic(): void {
    if (!ensure() || !ctx || !master || musicTimer !== null || currentTrack === null) {
      return;
    }
    try {
      scheduleLoop();
      musicTimer = setInterval(scheduleLoop, trackLoopMs(TRACKS[currentTrack]));
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
    setMusic(track: TrackId | null): void {
      // Idempotent: a scene can call this every step and the loop keeps its
      // phase. Only an actual change stops the old track and starts the new
      // one, which is what keeps transitions free of overlap and clicks.
      if (track === currentTrack) {
        return;
      }
      stopMusic();
      currentTrack = track;
      if (track !== null) {
        startMusic();
      }
    },
    stop(): void {
      stopMusic();
      currentTrack = null;
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
