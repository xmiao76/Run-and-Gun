import { describe, expect, it } from 'vitest';

import {
  selectPlayerPose,
  playerPoseTexture,
  type PlayerPoseState
} from '../../src/art/playerPose';

const IDLE: PlayerPoseState = {
  dying: false,
  hurt: false,
  crouching: false,
  grounded: true,
  speedX: 0,
  aimUp: false,
  runFrame: 0
};

describe('selectPlayerPose', () => {
  it('returns idle for a grounded, stationary player', () => {
    expect(selectPlayerPose(IDLE)).toBe('idle');
  });

  it('cycles all four run frames while moving on the ground', () => {
    // TASK-035 widened the cycle from two frames to four: stride, passing,
    // counter-stride, counter-passing.
    expect(selectPlayerPose({ ...IDLE, speedX: 190, runFrame: 0 })).toBe('run-a');
    expect(selectPlayerPose({ ...IDLE, speedX: 190, runFrame: 1 })).toBe('run-c');
    expect(selectPlayerPose({ ...IDLE, speedX: 190, runFrame: 2 })).toBe('run-b');
    expect(selectPlayerPose({ ...IDLE, speedX: -190, runFrame: 3 })).toBe('run-d');
  });

  it('returns jump while airborne, even when aiming', () => {
    expect(selectPlayerPose({ ...IDLE, grounded: false })).toBe('jump');
    expect(selectPlayerPose({ ...IDLE, grounded: false, aimUp: true })).toBe('jump');
  });

  it('returns crouch while crouching', () => {
    expect(selectPlayerPose({ ...IDLE, crouching: true })).toBe('crouch');
  });

  it('aims straight up when stationary and diagonally when moving', () => {
    expect(selectPlayerPose({ ...IDLE, aimUp: true })).toBe('aim-up');
    expect(selectPlayerPose({ ...IDLE, aimUp: true, speedX: 190 })).toBe('aim-diag');
  });

  it('hurt overrides movement states but not death', () => {
    expect(selectPlayerPose({ ...IDLE, hurt: true, speedX: 190 })).toBe('hurt');
    expect(selectPlayerPose({ ...IDLE, hurt: true, crouching: true })).toBe('hurt');
    expect(selectPlayerPose({ ...IDLE, hurt: true, dying: true })).toBe('death');
  });

  it('death overrides every other state', () => {
    expect(selectPlayerPose({ ...IDLE, dying: true, crouching: true, aimUp: true })).toBe('death');
  });
});

describe('playerPoseTexture', () => {
  it('maps every pose to its sprite-sheet texture key', () => {
    expect(playerPoseTexture('idle')).toBe('art/player-idle');
    expect(playerPoseTexture('run-a')).toBe('art/player-run-a');
    expect(playerPoseTexture('run-b')).toBe('art/player-run-b');
    expect(playerPoseTexture('jump')).toBe('art/player-jump');
    expect(playerPoseTexture('crouch')).toBe('art/player-crouch');
    expect(playerPoseTexture('aim-up')).toBe('art/player-aim-up');
    expect(playerPoseTexture('aim-diag')).toBe('art/player-aim-diag');
    expect(playerPoseTexture('hurt')).toBe('art/player-hurt');
    expect(playerPoseTexture('death')).toBe('art/player-death');
  });
});
