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
      audio.setMusic(true);
      audio.stop();
    }).not.toThrow();
  });
});
