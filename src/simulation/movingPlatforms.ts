import { type MovingPlatformDef, type Rect } from '../levels/levelSchema';

/**
 * Deterministic moving-platform logic.
 *
 * Each platform oscillates between `min` and `max` along its axis at a constant
 * speed, reversing at the bounds. `step` returns the per-step displacement
 * (deltaX/deltaY) so the scene can carry a grounded rider with the platform.
 * Pure and unit-testable.
 */

export interface MovingPlatformState {
  id: string;
  axis: 'x' | 'y';
  pos: number;
  width: number;
  height: number;
  baseX: number;
  baseY: number;
  min: number;
  max: number;
  speed: number;
  dir: 1 | -1;
}

export interface MovingPlatformStep {
  state: MovingPlatformState;
  deltaX: number;
  deltaY: number;
}

export function createMovingPlatformState(def: MovingPlatformDef): MovingPlatformState {
  return {
    id: def.id,
    axis: def.axis,
    pos: def.min,
    width: def.width,
    height: def.height,
    baseX: def.x,
    baseY: def.y,
    min: def.min,
    max: def.max,
    speed: def.speed,
    dir: 1
  };
}

export function createMovingPlatformStates(defs: readonly MovingPlatformDef[]): MovingPlatformState[] {
  return defs.map(createMovingPlatformState);
}

/** Current world-space rectangle of the platform. */
export function movingPlatformRect(state: MovingPlatformState): Rect {
  const x = state.axis === 'x' ? state.baseX + (state.pos - state.min) : state.baseX;
  const y = state.axis === 'y' ? state.baseY + (state.pos - state.min) : state.baseY;
  return { x, y, width: state.width, height: state.height };
}

export function stepMovingPlatform(state: MovingPlatformState, dt: number): MovingPlatformStep {
  let pos = state.pos + state.dir * state.speed * dt;
  let dir = state.dir;
  if (pos >= state.max) {
    pos = state.max;
    dir = -1;
  } else if (pos <= state.min) {
    pos = state.min;
    dir = 1;
  }
  const deltaX = state.axis === 'x' ? pos - state.pos : 0;
  const deltaY = state.axis === 'y' ? pos - state.pos : 0;
  return { state: { ...state, pos, dir }, deltaX, deltaY };
}
