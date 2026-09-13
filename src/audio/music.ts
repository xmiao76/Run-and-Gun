/**
 * Original music data: one pattern per screen and stage.
 *
 * Pure data with no engine dependency, so the compositions can be unit-tested
 * and the AudioService stays a player rather than a composer.
 *
 * ORIGINALITY (ASSET_POLICY.md section 4): every pattern here was composed for
 * this project by choosing a scale and a rhythmic figure and writing degrees
 * against it. None is transcribed from, or built to resemble, any existing
 * work - that prohibition explicitly covers rhythm and interval sequence, not
 * just pitch. The shared vocabulary is the CHIPTUNE FORMAT (a triangle bass, a
 * square lead, a noise percussion channel), which is a technical convention of
 * the hardware era and not anyone's expression.
 *
 * Each track names the idea it is built on, so a later edit can stay in
 * character instead of guessing.
 */

/** Percussion voices, synthesised from filtered noise rather than a tone. */
export type DrumHit = 'kick' | 'snare' | 'hat';

export interface MusicStep {
  /** Triangle bass note (Hz), or null to rest. */
  bass: number | null;
  /** Square lead note (Hz), or null to rest. */
  lead: number | null;
  /** Percussion on this step, or null. */
  drum: DrumHit | null;
}

export interface MusicTrack {
  /** Seconds per step; the tempo. */
  stepSeconds: number;
  steps: readonly MusicStep[];
}

export type TrackId = 'title' | 'stage1' | 'stage2' | 'stage3' | 'boss' | 'results';

/** Note frequencies used below, named so the patterns read as music. */
const A1 = 55.0;
const C2 = 65.41;
const D2 = 73.42;
const E2 = 82.41;
const F2 = 87.31;
const G2 = 98.0;
const A2 = 110.0;
const B2 = 123.47;
const C3 = 130.81;
const E3 = 164.81;
const F3 = 174.61;
const G3 = 196.0;
const A3 = 220.0;
const C4 = 261.63;
const D4 = 293.66;
const E4 = 329.63;
const F4 = 349.23;
const G4 = 392.0;
const A4 = 440.0;
const C5 = 523.25;

/** Shorthand so a pattern reads as a grid rather than a wall of object literals. */
function step(bass: number | null, lead: number | null, drum: DrumHit | null): MusicStep {
  return { bass, lead, drum };
}

/**
 * Title: slow and wide, an A-minor drone with a falling answer.
 *
 * No drums - the title should feel like the calm before, and the first kick the
 * player hears belongs to the first stage.
 */
const TITLE: MusicTrack = {
  stepSeconds: 0.34,
  steps: [
    step(A1, A3, null),
    step(null, null, null),
    step(A1, G3, null),
    step(null, null, null),
    step(F2, F3, null),
    step(null, null, null),
    step(G2, E3, null),
    step(null, null, null)
  ]
};

/**
 * Stage 1, jungle: the game's original loop, now with a backbeat.
 *
 * The bass line is the one this project shipped with, kept because it is the
 * game's signature; the drums and the lead answer are new.
 */
const STAGE_1: MusicTrack = {
  stepSeconds: 0.25,
  steps: [
    step(A2, A3, 'kick'),
    step(A2, null, 'hat'),
    step(E3, E4, 'snare'),
    step(A2, null, 'hat'),
    step(G2, A3, 'kick'),
    step(A2, null, 'hat'),
    step(E2, G3, 'snare'),
    step(G2, null, 'hat')
  ]
};

/**
 * Stage 2, fortress: mechanical and driving.
 *
 * A D pedal with a semitone push above it, on a faster grid - the interior is
 * meant to feel like machinery you are walking through rather than terrain.
 */
const STAGE_2: MusicTrack = {
  stepSeconds: 0.2,
  steps: [
    step(D2, D4, 'kick'),
    step(D2, null, 'hat'),
    step(D2, C4, null),
    step(D2, null, 'hat'),
    step(C2, D4, 'snare'),
    step(C2, null, 'hat'),
    step(D2, F4, null),
    step(D2, null, 'hat'),
    step(D2, D4, 'kick'),
    step(D2, null, 'hat'),
    step(F2, C4, null),
    step(F2, null, 'hat'),
    step(G2, D4, 'snare'),
    step(G2, null, 'hat'),
    step(F2, A3, null),
    step(D2, null, 'hat')
  ]
};

/**
 * Stage 3, ashfall: tense and unstable.
 *
 * Built on the flattened second above E, which gives the line its unease, and
 * the lead climbs rather than resolves - the stage is an ascent.
 */
const STAGE_3: MusicTrack = {
  stepSeconds: 0.18,
  steps: [
    step(E2, E4, 'kick'),
    step(E2, null, 'hat'),
    step(F2, F4, 'snare'),
    step(E2, null, 'hat'),
    step(E2, G4, 'kick'),
    step(G2, null, 'hat'),
    step(F2, F4, 'snare'),
    step(E2, null, 'hat'),
    step(A2, A4, 'kick'),
    step(A2, null, 'hat'),
    step(G2, G4, 'snare'),
    step(F2, null, 'hat')
  ]
};

/**
 * Boss: the fastest grid and the only pattern with a kick on every beat.
 *
 * Deliberately narrow in pitch so it reads as pressure rather than melody -
 * the fight is the thing being listened to, not the music.
 */
const BOSS: MusicTrack = {
  stepSeconds: 0.15,
  steps: [
    step(A1, A4, 'kick'),
    step(A1, null, 'hat'),
    step(A1, C5, 'kick'),
    step(A1, null, 'snare'),
    step(C2, A4, 'kick'),
    step(C2, null, 'hat'),
    step(C2, G4, 'kick'),
    step(C2, null, 'snare'),
    step(D2, A4, 'kick'),
    step(D2, null, 'hat'),
    step(D2, C5, 'kick'),
    step(D2, null, 'snare'),
    step(E2, B2, 'kick'),
    step(E2, null, 'hat'),
    step(E2, E4, 'kick'),
    step(E2, null, 'snare')
  ]
};

/**
 * Results: short, and the only pattern that resolves upward.
 *
 * Everything else in the game sits in a minor key; the stage-clear screen is
 * the one place that lands on a major third, so finishing sounds like relief.
 */
const RESULTS: MusicTrack = {
  stepSeconds: 0.26,
  steps: [
    step(C3, C4, 'kick'),
    step(C3, E4, null),
    step(G3, G4, 'kick'),
    step(G3, null, null),
    step(A3, A4, 'snare'),
    step(A3, G4, null),
    step(F3, F4, 'kick'),
    step(F3, null, null)
  ]
};

export const TRACKS: Readonly<Record<TrackId, MusicTrack>> = {
  title: TITLE,
  stage1: STAGE_1,
  stage2: STAGE_2,
  stage3: STAGE_3,
  boss: BOSS,
  results: RESULTS
};

/**
 * The stage track for a level index, falling back to the last one defined.
 *
 * A fourth stage without its own theme gets the third's rather than silence,
 * which is the failure that matters least.
 */
export function stageTrack(levelIndex: number): TrackId {
  const ids: TrackId[] = ['stage1', 'stage2', 'stage3'];
  return ids[Math.min(Math.max(levelIndex, 0), ids.length - 1)];
}

/** Loop length in milliseconds, for the scheduler's timer. */
export function trackLoopMs(track: MusicTrack): number {
  return track.steps.length * track.stepSeconds * 1000;
}
