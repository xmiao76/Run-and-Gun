import {
  ARENA_WIDTH,
  CROUCH_HEIGHT,
  DROP_THROUGH_DURATION,
  GRAVITY,
  JUMP_CUT_MULTIPLIER,
  JUMP_VELOCITY,
  MAX_FALL_SPEED,
  MOVE_SPEED,
  PLAYER_HEIGHT,
  PLAYER_WIDTH
} from '../balance/player';
import { type InputState } from '../input/InputState';
import { type Rect } from '../levels/levelSchema';

/**
 * Deterministic platformer physics for data-driven levels.
 *
 * Axis-separated AABB resolution against solid terrain, one-way platforms with
 * drop-through, crouching (which shrinks the collision height from the feet),
 * gravity, variable-height jump, and a lethal fall threshold. The player's `y`
 * is the FEET position (bottom of the standing box); the scene derives the
 * drawn top from the current height. No DOM or Phaser dependency.
 */

export interface PlatformerState {
  x: number;
  /** Feet position (bottom of the standing box). */
  y: number;
  vx: number;
  vy: number;
  grounded: boolean;
  crouching: boolean;
  facing: number;
  /** Remaining time a one-way platform is passable after a drop input (s). */
  dropTimer: number;
}

export interface PlatformerStepResult {
  player: PlatformerState;
  died: boolean;
}

export function createPlatformerState(x: number, feetY: number): PlatformerState {
  return { x, y: feetY, vx: 0, vy: 0, grounded: true, crouching: false, facing: 1, dropTimer: 0 };
}

export function currentHeight(state: PlatformerState): number {
  return state.crouching ? CROUCH_HEIGHT : PLAYER_HEIGHT;
}

function overlapsX(x: number, w: number, r: Rect): boolean {
  return x < r.x + r.width && x + w > r.x;
}

function overlapsY(y: number, h: number, r: Rect): boolean {
  return y < r.y + r.height && y + h > r.y;
}

/** Highest surface top under the horizontal span within a small probe below feet. */
function supportAt(x: number, feet: number, solids: readonly Rect[], oneWays: readonly Rect[], useOneWay: boolean): number | null {
  let best: number | null = null;
  for (const r of solids) {
    if (overlapsX(x, PLAYER_WIDTH, r) && feet >= r.y - 0.5 && feet <= r.y + 6) {
      if (best === null || r.y > best) {
        best = r.y;
      }
    }
  }
  if (useOneWay) {
    for (const r of oneWays) {
      if (overlapsX(x, PLAYER_WIDTH, r) && feet >= r.y - 0.5 && feet <= r.y + 6) {
        if (best === null || r.y > best) {
          best = r.y;
        }
      }
    }
  }
  return best;
}

export interface PlatformerStepOptions {
  levelWidth?: number;
  deathFallY?: number;
}

/**
 * Advance the player one fixed step. `prevFeet`/`prevCrouchHeight` describe the
 * body before the move so one-way platforms only catch a fall that started
 * above their surface.
 */
export function stepPlatformer(
  state: PlatformerState,
  input: InputState,
  dt: number,
  solids: readonly Rect[],
  oneWays: readonly Rect[],
  options: PlatformerStepOptions = {}
): PlatformerStepResult {
  const levelWidth = options.levelWidth ?? ARENA_WIDTH;
  const deathFallY = options.deathFallY ?? 700;

  const crouching = (input.crouch ?? false) && state.grounded;
  const h = crouching ? CROUCH_HEIGHT : PLAYER_HEIGHT;
  const top = state.y - h;

  let dropTimer = Math.max(0, state.dropTimer - dt);
  if (input.drop && state.grounded) {
    dropTimer = DROP_THROUGH_DURATION;
  }
  const useOneWay = dropTimer <= 0;

  // Horizontal move + solid resolution.
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const vx = crouching ? 0 : dir * MOVE_SPEED;
  let x = state.x + vx * dt;
  for (const r of solids) {
    if (!overlapsY(top, h, r)) {
      continue;
    }
    if (vx > 0 && x + PLAYER_WIDTH > r.x && state.x + PLAYER_WIDTH <= r.x + 0.001) {
      x = r.x - PLAYER_WIDTH;
    } else if (vx < 0 && x < r.x + r.width && state.x >= r.x + r.width - 0.001) {
      x = r.x + r.width;
    }
  }

  // Vertical move + resolution.
  let { vy } = state;
  let grounded = false;

  if (state.grounded && input.jumpPressed && !crouching) {
    vy = JUMP_VELOCITY;
  } else if (!input.jumpHeld && vy < 0) {
    vy *= JUMP_CUT_MULTIPLIER;
  }
  if (!state.grounded) {
    vy = Math.min(vy + GRAVITY * dt, MAX_FALL_SPEED);
  }

  const prevFeet = state.y;
  const prevTop = top;
  let feet = prevFeet + vy * dt;

  if (vy >= 0) {
    let land: number | null = null;
    for (const r of solids) {
      if (overlapsX(x, PLAYER_WIDTH, r) && feet >= r.y && prevFeet <= r.y + 0.001) {
        if (land === null || r.y < land) {
          land = r.y;
        }
      }
    }
    if (useOneWay) {
      const prevBottom = prevFeet;
      for (const r of oneWays) {
        if (overlapsX(x, PLAYER_WIDTH, r) && feet >= r.y && prevBottom <= r.y + 0.001) {
          if (land === null || r.y < land) {
            land = r.y;
          }
        }
      }
    }
    if (land !== null) {
      feet = land;
      vy = 0;
      grounded = true;
    }
  } else {
    for (const r of solids) {
      if (overlapsX(x, PLAYER_WIDTH, r) && top + vy * dt <= r.y + r.height && prevTop >= r.y + r.height - 0.001) {
        feet = r.y + r.height + h;
        vy = 0;
        break;
      }
    }
  }

  if (!grounded && vy === 0) {
    const support = supportAt(x, feet, solids, oneWays, useOneWay);
    if (support !== null) {
      grounded = true;
    }
  }

  const facing = dir > 0 ? 1 : dir < 0 ? -1 : state.facing;

  if (x < 0) {
    x = 0;
  }
  if (x > levelWidth - PLAYER_WIDTH) {
    x = levelWidth - PLAYER_WIDTH;
  }

  const died = feet > deathFallY;

  return {
    player: { x, y: feet, vx, vy, grounded, crouching, facing, dropTimer },
    died
  };
}
