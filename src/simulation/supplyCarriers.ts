import { type Rect, type SupplyCarrierDef } from '../levels/levelSchema';
import { type WeaponId } from '../balance/weapons';

/**
 * Supply skiff carriers (pure, deterministic).
 *
 * Neutral destructible objects that patrol a sky lane, wrapping from `toX`
 * back to `fromX`. One player hit destroys a carrier and releases exactly one
 * falling weapon drop, which lands on the first solid it crosses (or is lost
 * down a pit). No AI, no attacks - same class as containers, not an enemy.
 */

export const CARRIER_WIDTH = 26;
export const CARRIER_HEIGHT = 14;
const DROP_GRAVITY = 900;
const DROP_PICKUP_SIZE = 18;

export interface SupplyCarrierState {
  id: string;
  x: number;
  y: number;
  fromX: number;
  toX: number;
  speed: number;
  weapon: WeaponId;
  alive: boolean;
}

export interface CarrierDrop {
  id: string;
  x: number;
  y: number;
  vy: number;
  weapon: WeaponId;
  landed: boolean;
}

export function createSupplyCarrierStates(defs: readonly SupplyCarrierDef[]): SupplyCarrierState[] {
  return defs.map((d) => ({
    id: d.id,
    x: d.fromX,
    y: d.y,
    fromX: d.fromX,
    toX: d.toX,
    speed: d.speed,
    weapon: d.weapon,
    alive: true
  }));
}

/** Move carriers along their lanes; destroyed ones are culled. */
export function stepSupplyCarriers(states: readonly SupplyCarrierState[], dt: number): SupplyCarrierState[] {
  const out: SupplyCarrierState[] = [];
  for (const s of states) {
    if (!s.alive) {
      continue;
    }
    let x = s.x + s.speed * dt;
    if (x > s.toX) {
      x = s.fromX + (x - s.toX);
    }
    out.push({ ...s, x });
  }
  return out;
}

/**
 * Apply one hit: the carrier is destroyed and yields exactly one drop the
 * first time; subsequent hits return no drop.
 */
export function damageCarrier(state: SupplyCarrierState): { state: SupplyCarrierState; drop: CarrierDrop | null } {
  if (!state.alive) {
    return { state, drop: null };
  }
  const drop: CarrierDrop = {
    id: state.id + '-drop',
    x: state.x + CARRIER_WIDTH / 2 - DROP_PICKUP_SIZE / 2,
    y: state.y,
    vy: 0,
    weapon: state.weapon,
    landed: false
  };
  return { state: { ...state, alive: false }, drop };
}

export interface DropStepResult {
  drops: CarrierDrop[];
  /** Drops that landed this step (reported exactly once). */
  landed: CarrierDrop[];
}

/**
 * Advance falling drops: gravity, snap to the first solid top crossed, report
 * each landing once, and cull drops that fall past `cullY` (e.g. into a pit).
 */
export function stepCarrierDrops(
  drops: readonly CarrierDrop[],
  dt: number,
  solids: readonly Rect[],
  cullY: number
): DropStepResult {
  const out: CarrierDrop[] = [];
  const landed: CarrierDrop[] = [];
  for (const d of drops) {
    const vy = d.vy + DROP_GRAVITY * dt;
    const y = d.y + vy * dt;
    if (y > cullY) {
      continue;
    }
    let snapped: CarrierDrop | null = null;
    for (const s of solids) {
      const overlapsX = d.x < s.x + s.width && d.x + DROP_PICKUP_SIZE > s.x;
      const crosses = d.y + DROP_PICKUP_SIZE <= s.y && y + DROP_PICKUP_SIZE >= s.y;
      if (overlapsX && crosses) {
        if (snapped === null || s.y < snapped.y) {
          snapped = { ...d, y: s.y - DROP_PICKUP_SIZE, vy: 0, landed: true };
        }
      }
    }
    if (snapped) {
      out.push(snapped);
      landed.push(snapped);
    } else {
      out.push({ ...d, y, vy });
    }
  }
  return { drops: out, landed };
}
