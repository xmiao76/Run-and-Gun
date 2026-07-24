/**
 * Pure player-animation state selection.
 *
 * Maps the platformer physics state plus the scene's hurt/death timers and
 * animation clock to a pose, and each pose to its sprite-sheet texture. Pure
 * so the state machine stays unit-testable without a running scene.
 *
 * Priority: death > hurt > crouch > airborne jump > aim-up (moving aims
 * diagonally) > run cycle > idle.
 */

export type PlayerPoseKey =
  | 'idle'
  | 'run-a'
  | 'run-b'
  | 'jump'
  | 'crouch'
  | 'aim-up'
  | 'aim-diag'
  | 'hurt'
  | 'death';

export interface PlayerPoseState {
  /** Death animation in progress (scene death timer active). */
  dying: boolean;
  /** Brief hurt flinch after a damaging hit. */
  hurt: boolean;
  crouching: boolean;
  grounded: boolean;
  /** Horizontal velocity; |speedX| > 1 counts as moving. */
  speedX: number;
  aimUp: boolean;
  /** Alternating 0/1 run-cycle index from the scene's animation clock. */
  runFrame: number;
}

export function selectPlayerPose(s: PlayerPoseState): PlayerPoseKey {
  if (s.dying) {
    return 'death';
  }
  if (s.hurt) {
    return 'hurt';
  }
  if (s.crouching) {
    return 'crouch';
  }
  if (!s.grounded) {
    return 'jump';
  }
  if (s.aimUp) {
    return Math.abs(s.speedX) > 1 ? 'aim-diag' : 'aim-up';
  }
  if (Math.abs(s.speedX) > 1) {
    return s.runFrame % 2 === 0 ? 'run-a' : 'run-b';
  }
  return 'idle';
}

/** Texture key for a pose, matching the sprite sheet in art/sprites.ts. */
export function playerPoseTexture(pose: PlayerPoseKey): string {
  return 'art/player-' + pose;
}
