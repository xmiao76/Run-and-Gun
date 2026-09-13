import { describe, expect, it } from 'vitest';

import { stageTrack, trackLoopMs, TRACKS, type TrackId } from '../../src/audio/music';
import { LEVELS } from '../../src/levels/levels';

/**
 * TASK-040: the music data.
 *
 * Pure patterns, so the things that would actually be wrong with a chiptune
 * score - a silent track, a loop that never repeats, a stage with no theme -
 * are checkable without a browser or an AudioContext.
 */

const IDS = Object.keys(TRACKS) as TrackId[];

describe('music tracks', () => {
  it('defines a track for every screen and stage the game has', () => {
    expect(IDS.sort()).toEqual(['boss', 'results', 'stage1', 'stage2', 'stage3', 'title']);
  });

  it('gives every level its own stage theme', () => {
    const used = LEVELS.map((_, i) => stageTrack(i));
    expect(new Set(used).size).toBe(LEVELS.length);
  });

  it('falls back to the last theme rather than silence for an unthemed stage', () => {
    // A fourth level added without a theme should still have music.
    expect(stageTrack(99)).toBe('stage3');
    expect(stageTrack(-1)).toBe('stage1');
  });

  it('has no silent or empty track', () => {
    for (const id of IDS) {
      const track = TRACKS[id];
      expect(track.steps.length, id).toBeGreaterThan(0);
      expect(track.steps.some((s) => s.bass !== null || s.lead !== null), id).toBe(true);
    }
  });

  it('loops in a sensible amount of time', () => {
    for (const id of IDS) {
      const ms = trackLoopMs(TRACKS[id]);
      // Long enough not to be a stutter, short enough to be a loop.
      expect(ms, id).toBeGreaterThan(1000);
      expect(ms, id).toBeLessThan(6000);
    }
  });

  it('uses a positive tempo everywhere', () => {
    for (const id of IDS) {
      expect(TRACKS[id].stepSeconds, id).toBeGreaterThan(0);
    }
  });

  it('keeps every note in an audible range', () => {
    for (const id of IDS) {
      for (const s of TRACKS[id].steps) {
        for (const note of [s.bass, s.lead]) {
          if (note !== null) {
            expect(note, id).toBeGreaterThan(20);
            expect(note, id).toBeLessThan(4200);
          }
        }
      }
    }
  });

  it('keeps the bass below the lead wherever both sound', () => {
    // Not a rule of music, but a rule of THIS score: the triangle is the bass
    // voice and the square is the lead, so crossing them would muddy both.
    for (const id of IDS) {
      for (const s of TRACKS[id].steps) {
        if (s.bass !== null && s.lead !== null) {
          expect(s.lead, id).toBeGreaterThan(s.bass);
        }
      }
    }
  });

  it('gives the boss fight the most urgent track', () => {
    const boss = TRACKS.boss;
    for (const id of IDS) {
      if (id !== 'boss') {
        expect(boss.stepSeconds, id).toBeLessThanOrEqual(TRACKS[id].stepSeconds);
      }
    }
    // ...and the densest percussion.
    const density = (t: TrackId): number =>
      TRACKS[t].steps.filter((s) => s.drum !== null).length / TRACKS[t].steps.length;
    expect(density('boss')).toBeGreaterThanOrEqual(density('stage1'));
  });

  it('leaves the title screen undrummed, so the first kick belongs to the game', () => {
    expect(TRACKS.title.steps.every((s) => s.drum === null)).toBe(true);
    expect(TRACKS.stage1.steps.some((s) => s.drum !== null)).toBe(true);
  });

  it('gives each track a distinct pattern, not one loop at six tempos', () => {
    const shapes = IDS.map((id) =>
      TRACKS[id].steps.map((s) => `${s.bass ?? '-'}/${s.lead ?? '-'}/${s.drum ?? '-'}`).join('|')
    );
    expect(new Set(shapes).size).toBe(IDS.length);
  });
});
