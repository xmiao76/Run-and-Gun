import { describe, expect, it } from 'vitest';
import { createAudioService } from '../../src/audio/AudioService';
import { DEFAULT_SETTINGS } from '../../src/persistence/schema';

interface Probe {
  oscillators: number;
  resumes: number;
}

function mockContextFactory(probe: Probe, opts: { suspended?: boolean; fail?: boolean } = {}): () => unknown {
  return () => {
    if (opts.fail) {
      throw new Error('no audio');
    }
    const makeParam = () => ({ setValueAtTime: () => undefined, linearRampToValueAtTime: () => undefined });
    const gain = () => ({ gain: makeParam(), connect: () => undefined });
    const osc = () => {
      probe.oscillators += 1;
      return { type: 'sine', frequency: makeParam(), connect: () => undefined, start: () => undefined, stop: () => undefined };
    };
    return {
      currentTime: 0,
      state: opts.suspended ? 'suspended' : 'running',
      destination: {},
      resume: () => {
        probe.resumes += 1;
      },
      createGain: gain,
      createOscillator: osc
    };
  };
}

describe('audio service (failure-safe)', () => {
  it('plays sfx through the context when not muted', () => {
    const probe: Probe = { oscillators: 0, resumes: 0 };
    const audio = createAudioService(mockContextFactory(probe) as never);
    audio.setSettings({ ...DEFAULT_SETTINGS, mute: false });
    audio.playSfx('shoot');
    expect(probe.oscillators).toBe(1);
  });

  it('silences sfx when muted', () => {
    const probe: Probe = { oscillators: 0, resumes: 0 };
    const audio = createAudioService(mockContextFactory(probe) as never);
    audio.setSettings({ ...DEFAULT_SETTINGS, mute: true });
    audio.playSfx('shoot');
    expect(probe.oscillators).toBe(0);
  });

  it('resumes a suspended context on unlock', () => {
    const probe: Probe = { oscillators: 0, resumes: 0 };
    const audio = createAudioService(mockContextFactory(probe, { suspended: true }) as never);
    audio.unlock();
    expect(probe.resumes).toBe(1);
  });

  it('does not throw when the context factory fails', () => {
    const audio = createAudioService(mockContextFactory({ oscillators: 0, resumes: 0 }, { fail: true }) as never);
    expect(() => {
      audio.unlock();
      audio.playSfx('jump');
      audio.setMusic('stage1');
      audio.stop();
    }).not.toThrow();
  });

  it('plays every sound effect name, including the TASK-036/037 additions', () => {
    const probe: Probe = { oscillators: 0, resumes: 0 };
    const audio = createAudioService(mockContextFactory(probe) as never);
    audio.setSettings({ ...DEFAULT_SETTINGS, mute: false });
    const names = [
      'jump', 'shoot', 'shootScatter', 'shootRapid', 'shootLaser', 'shootFlame',
      'hit', 'enemyDeath', 'bossHit', 'playerDeath',
      'pickup', 'explosion', 'complete', 'telegraph', 'door', 'respawn'
    ] as const;
    for (const name of names) {
      audio.playSfx(name);
    }
    expect(probe.oscillators).toBe(names.length);
  });

  it('schedules a music loop and stops it cleanly', () => {
    const probe: Probe = { oscillators: 0, resumes: 0 };
    const audio = createAudioService(mockContextFactory(probe) as never);
    audio.setSettings({ ...DEFAULT_SETTINGS, mute: false, musicVolume: 0.6 });
    audio.setMusic('stage1');
    expect(probe.oscillators).toBeGreaterThan(0);
    const afterFirst = probe.oscillators;
    audio.setMusic(null);
    expect(() => audio.stop()).not.toThrow();
    // Restarting after a stop schedules a fresh loop.
    audio.setMusic('stage1');
    expect(probe.oscillators).toBe(afterFirst * 2);
    audio.setMusic(null);
  });

  it('ignores a request for the track already playing, so a loop never stutters', () => {
    // The level scene calls setMusic every step. Re-scheduling on each call
    // would restart the loop 60 times a second and the music would be a buzz.
    const probe: Probe = { oscillators: 0, resumes: 0 };
    const audio = createAudioService(mockContextFactory(probe) as never);
    audio.setSettings({ ...DEFAULT_SETTINGS, mute: false, musicVolume: 0.6 });
    audio.setMusic('stage1');
    const afterFirst = probe.oscillators;
    for (let i = 0; i < 60; i++) {
      audio.setMusic('stage1');
    }
    expect(probe.oscillators).toBe(afterFirst);
    audio.setMusic(null);
  });

  it('switches tracks cleanly, stopping the old one before starting the new', () => {
    const probe: Probe = { oscillators: 0, resumes: 0 };
    const audio = createAudioService(mockContextFactory(probe) as never);
    audio.setSettings({ ...DEFAULT_SETTINGS, mute: false, musicVolume: 0.6 });
    audio.setMusic('stage1');
    const afterStage = probe.oscillators;
    expect(() => audio.setMusic('boss')).not.toThrow();
    // The boss track is a different, longer pattern, so more notes are queued.
    expect(probe.oscillators).toBeGreaterThan(afterStage);
    audio.setMusic(null);
  });

  it('plays every track without a context that supports percussion', () => {
    // The mock has no createBuffer/createBufferSource. Drums must simply be
    // absent rather than throwing, which is the same rule the whole service
    // follows: audio degrades, never blocks.
    const probe: Probe = { oscillators: 0, resumes: 0 };
    const audio = createAudioService(mockContextFactory(probe) as never);
    audio.setSettings({ ...DEFAULT_SETTINGS, mute: false, musicVolume: 0.5 });
    for (const id of ['title', 'stage1', 'stage2', 'stage3', 'boss', 'results'] as const) {
      expect(() => audio.setMusic(id)).not.toThrow();
    }
    audio.setMusic(null);
  });
});
