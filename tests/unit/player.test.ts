import { describe, expect, it } from 'vitest';
import { GROUND_Y, MOVE_SPEED, PIT_X0, SPAWN_X, SPAWN_Y } from '../../src/balance/player';
import { createNeutralInput } from '../../src/input/InputState';
import {
  createPlayerState,
  groundAt,
  isOverPit,
  stepPlayer
} from '../../src/simulation/player';

const FIXED_DT = 1 / 60;

function holdRight(): ReturnType<typeof createNeutralInput> {
  return { ...createNeutralInput(), right: true };
}

describe('player horizontal movement is frame-rate independent', () => {
  it('moves at MOVE_SPEED regardless of step size', () => {
    const oneStep = stepPlayer(createPlayerState(100, SPAWN_Y), holdRight(), 1);
    expect(oneStep.player.x).toBeCloseTo(100 + MOVE_SPEED * 1, 4);

    const halfSteps = [0.5, 0.5].reduce(
      (state, dt) => stepPlayer(state, holdRight(), dt).player,
      createPlayerState(100, SPAWN_Y)
    );
    expect(halfSteps.x).toBeCloseTo(100 + MOVE_SPEED * 1, 4);
  });

  it('clamps to the left wall', () => {
    const result = stepPlayer(createPlayerState(0, SPAWN_Y), { ...createNeutralInput(), left: true }, 1);
    expect(result.player.x).toBe(0);
  });
});

describe('jumping and variable jump height', () => {
  it('leaves the ground only on a grounded press', () => {
    const jump = stepPlayer(createPlayerState(SPAWN_X, SPAWN_Y), { ...createNeutralInput(), jumpPressed: true, jumpHeld: true }, FIXED_DT);
    expect(jump.player.grounded).toBe(false);
    expect(jump.player.vy).toBeLessThan(0);

    // A press while airborne does not re-jump.
    const airPress = stepPlayer(jump.player, { ...createNeutralInput(), jumpPressed: true, jumpHeld: true }, FIXED_DT);
    expect(airPress.player.vy).toBeGreaterThan(jump.player.vy); // gravity applied, no new jump
  });

  it('releasing jump early cuts upward velocity (lower apex)', () => {
    const jumping = stepPlayer(createPlayerState(SPAWN_X, SPAWN_Y), { ...createNeutralInput(), jumpPressed: true, jumpHeld: true }, FIXED_DT);

    const held = stepPlayer(jumping.player, { ...createNeutralInput(), jumpHeld: true }, FIXED_DT);
    const cut = stepPlayer(jumping.player, { ...createNeutralInput(), jumpHeld: false }, FIXED_DT);
    // The cut branch damps upward velocity, so the next vy is less negative (and gravity then adds).
    expect(cut.player.vy).toBeGreaterThan(held.player.vy);
  });

  it('lands back on the ground after a jump', () => {
    let state = stepPlayer(createPlayerState(SPAWN_X, SPAWN_Y), { ...createNeutralInput(), jumpPressed: true, jumpHeld: true }, FIXED_DT).player;
    let landed = false;
    for (let i = 0; i < 240; i++) {
      state = stepPlayer(state, createNeutralInput(), FIXED_DT).player;
      if (state.grounded) {
        landed = true;
        break;
      }
    }
    expect(landed).toBe(true);
    expect(state.y).toBe(GROUND_Y);
  });
});

describe('ground and pit collision', () => {
  it('reports ground everywhere except the pit gap', () => {
    expect(groundAt(100)).toBe(GROUND_Y);
    expect(groundAt(PIT_X0 + 10)).toBeNull();
    expect(isOverPit(PIT_X0 + 10)).toBe(true);
    expect(isOverPit(100)).toBe(false);
  });

  it('falls when walking off the ledge into the pit', () => {
    let state = createPlayerState(PIT_X0 - 30, SPAWN_Y);
    let fell = false;
    for (let i = 0; i < 120; i++) {
      const result = stepPlayer(state, holdRight(), FIXED_DT);
      state = result.player;
      if (!state.grounded && state.y > SPAWN_Y + 1) {
        fell = true;
        break;
      }
    }
    expect(fell).toBe(true);
  });
});
