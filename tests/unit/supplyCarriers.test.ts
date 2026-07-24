import { describe, expect, it } from 'vitest';
import {
  createSupplyCarrierStates,
  damageCarrier,
  stepCarrierDrops,
  stepSupplyCarriers
} from '../../src/simulation/supplyCarriers';
import { type Rect } from '../../src/levels/levelSchema';

const DT = 1 / 60;
const DEFS = [{ id: 'skiff', fromX: 100, toX: 300, y: 110, speed: 60, weapon: 'rapid' as const }];
const GROUND: Rect = { x: 0, y: 480, width: 1000, height: 80 };

describe('supply skiff movement', () => {
  it('moves along the lane at the configured speed', () => {
    const [c] = stepSupplyCarriers(createSupplyCarrierStates(DEFS), 1);
    expect(c.x).toBeCloseTo(100 + 60);
  });

  it('wraps from toX back to fromX with overflow preserved', () => {
    const states = createSupplyCarrierStates(DEFS);
    states[0].x = 290;
    const [c] = stepSupplyCarriers(states, 0.5); // 290 + 30 = 320 -> wraps to 100 + 20
    expect(c.x).toBeCloseTo(120);
  });

  it('culls destroyed carriers', () => {
    const states = createSupplyCarrierStates(DEFS);
    states[0].alive = false;
    expect(stepSupplyCarriers(states, DT)).toHaveLength(0);
  });
});

describe('supply skiff destruction and drops', () => {
  it('one hit destroys the carrier and yields exactly one drop with the configured weapon', () => {
    const [c] = createSupplyCarrierStates(DEFS);
    const first = damageCarrier(c);
    expect(first.state.alive).toBe(false);
    expect(first.drop).not.toBeNull();
    expect(first.drop?.weapon).toBe('rapid');

    const second = damageCarrier(first.state);
    expect(second.drop).toBeNull();
  });

  it('drops fall with growing velocity and land snapped to a solid top, reported once', () => {
    const [c] = createSupplyCarrierStates(DEFS);
    const { drop } = damageCarrier(c);
    expect(drop).not.toBeNull();

    let drops = [drop!];
    let landed: typeof drops = [];
    for (let i = 0; i < 240 && landed.length === 0; i++) {
      const r = stepCarrierDrops(drops, DT, [GROUND], 1000);
      drops = r.drops;
      landed = r.landed;
    }
    expect(landed).toHaveLength(1);
    expect(landed[0].y).toBe(480 - 18);
    // After landing, the drop is removed from the active list by the caller.
    expect(drops.filter((d) => !d.landed)).toHaveLength(0);
  });

  it('culls drops that fall past the cull line (pit loss)', () => {
    const [c] = createSupplyCarrierStates(DEFS);
    const { drop } = damageCarrier(c);
    const r = stepCarrierDrops([{ ...drop!, y: 500, vy: 400 }], 1, [], 540);
    expect(r.drops).toHaveLength(0);
    expect(r.landed).toHaveLength(0);
  });
});
