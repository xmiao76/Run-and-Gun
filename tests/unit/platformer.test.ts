import { describe, expect, it } from 'vitest';
import { GROUND_Y } from '../../src/balance/player';
import { createNeutralInput, type InputState } from '../../src/input/InputState';
import {
  createPlatformerState,
  currentHeight,
  stepPlatformer,
  type PlatformerState
} from '../../src/simulation/platformer';
import { type Rect } from '../../src/levels/levelSchema';

const DT = 1 / 60;
const GROUND: Rect = { x: 0, y: GROUND_Y, width: 400, height: 80 };
const ONEWAY: Rect = { x: 500, y: 400, width: 120, height: 12 };

function step(state: PlatformerState, input: Partial<InputState> = {}, solids: Rect[] = [GROUND], oneWays: Rect[] = []): PlatformerState {
  return stepPlatformer(state, { ...createNeutralInput(), ...input }, DT, solids, oneWays).player;
}

describe('platformer collision', () => {
  it('keeps a standing player grounded on a solid', () => {
    let s = createPlatformerState(50, GROUND_Y);
    for (let i = 0; i < 10; i++) {
      s = step(s);
    }
    expect(s.grounded).toBe(true);
    expect(s.y).toBe(GROUND_Y);
    expect(s.vy).toBe(0);
  });

  it('falls when walking off a ledge', () => {
    let s = createPlatformerState(380, GROUND_Y);
    let fell = false;
    for (let i = 0; i < 60; i++) {
      s = step(s, { right: true });
      if (!s.grounded && s.y > GROUND_Y + 1) {
        fell = true;
        break;
      }
    }
    expect(fell).toBe(true);
  });

  it('lands on a one-way platform from above', () => {
    let s = createPlatformerState(540, 360);
    let landed = false;
    for (let i = 0; i < 120; i++) {
      s = step(s, {}, [], [ONEWAY]);
      if (s.grounded && Math.abs(s.y - 400) < 0.01) {
        landed = true;
        break;
      }
    }
    expect(landed).toBe(true);
  });

  it('drops through a one-way platform when drop is held', () => {
    let s = createPlatformerState(540, 400);
    s = step(s, {}, [], [ONEWAY]);
    expect(s.grounded).toBe(true);
    s = step(s, { drop: true }, [], [ONEWAY]);
    let dropped = false;
    for (let i = 0; i < 30; i++) {
      s = step(s, {}, [], [ONEWAY]);
      if (s.y > 400 + 1) {
        dropped = true;
        break;
      }
    }
    expect(dropped).toBe(true);
  });

  it('crouching shrinks the collision height while keeping the feet planted', () => {
    const s = step(createPlatformerState(50, GROUND_Y), { crouch: true });
    expect(s.crouching).toBe(true);
    expect(currentHeight(s)).toBe(20);
    expect(s.y).toBe(GROUND_Y);
  });

  it('jump leaves the ground and is cut short on early release', () => {
    const jumping = step(createPlatformerState(50, GROUND_Y), { jumpPressed: true, jumpHeld: true });
    expect(jumping.grounded).toBe(false);
    expect(jumping.vy).toBeLessThan(0);

    const held = step(jumping, { jumpHeld: true });
    const cut = step(jumping, { jumpHeld: false });
    expect(cut.vy).toBeGreaterThan(held.vy);
  });

  it('solid walls block horizontal movement', () => {
    const wall: Rect = { x: 200, y: GROUND_Y - 60, width: 20, height: 60 };
    let s = createPlatformerState(150, GROUND_Y);
    for (let i = 0; i < 120; i++) {
      s = step(s, { right: true }, [GROUND, wall]);
    }
    expect(s.x + 22).toBeLessThanOrEqual(wall.x + 0.01);
  });
});
