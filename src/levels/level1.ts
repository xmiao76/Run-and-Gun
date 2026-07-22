import { GROUND_Y } from '../balance/player';
import { type LevelDef, type Rect } from './levelSchema';

/**
 * Level 1 - Jungle Outpost (original layout).
 *
 * Authored as data via small helpers so geometry stays internally consistent.
 * Teaches movement, jumping, one-way platforms, aiming, weapon pickups, and
 * checkpoints, then ends with the Siege Walker boss. No resemblance to any
 * commercial title's map (ASSET_POLICY.md).
 */

const WORLD_WIDTH = 3240;
const WORLD_HEIGHT = 540;
const GROUND_H = 80;

function ground(x: number, width: number): Rect {
  return { x, y: GROUND_Y, width, height: GROUND_H };
}

function oneWay(x: number, y: number, width: number): Rect {
  return { x, y, width, height: 12 };
}

// Ground segments with two pits (gaps at 720-840 and 1320-1440).
const solids: Rect[] = [
  ground(0, 720),
  ground(840, 480),
  ground(1440, 1120),
  ground(2560, WORLD_WIDTH - 2560)
];

const oneWays: Rect[] = [oneWay(720, 408, 120), oneWay(1320, 408, 120), oneWay(1820, 360, 140)];

const hazards: Rect[] = [
  // Visual pit markers (non-lethal; lethality comes from the fall threshold).
  { x: 720, y: GROUND_Y + 40, width: 120, height: 40 },
  { x: 1320, y: GROUND_Y + 40, width: 120, height: 40 }
];

const checkpoints = [
  { id: 'start', x: 60, y: GROUND_Y },
  { id: 'mid', x: 1180, y: GROUND_Y },
  { id: 'preboss', x: 2240, y: GROUND_Y }
];

const pickups = [
  { id: 'l1-scatter', x: 360, y: GROUND_Y - 24, weapon: 'scatter' as const },
  { id: 'l1-rapid', x: 1700, y: GROUND_Y - 24, weapon: 'rapid' as const }
];

const triggers = [
  {
    id: 'l1-wave1',
    x0: 520,
    x1: 560,
    spawns: [
      { kind: 'runner' as const, x: 760, y: GROUND_Y - 30 },
      { kind: 'drone' as const, x: 820, y: 300 }
    ]
  },
  {
    id: 'l1-wave2',
    x0: 1020,
    x1: 1060,
    spawns: [
      { kind: 'sentry' as const, x: 1240, y: GROUND_Y - 24 },
      { kind: 'grenadier' as const, x: 1500, y: GROUND_Y - 30 }
    ]
  },
  {
    id: 'l1-wave3',
    x0: 1720,
    x1: 1760,
    spawns: [
      { kind: 'runner' as const, x: 1980, y: GROUND_Y - 30 },
      { kind: 'drone' as const, x: 2040, y: 300 },
      { kind: 'grenadier' as const, x: 2200, y: GROUND_Y - 30 }
    ]
  }
];

export const LEVEL_1: LevelDef = {
  id: 'jungle-outpost',
  name: 'Jungle Outpost',
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT,
  spawn: { x: 60, y: GROUND_Y },
  solids,
  oneWays,
  hazards,
  checkpoints,
  triggers,
  pickups,
  boss: { id: 'siegeWalker', x0: 2560, x1: 2640, spawnX: 2880 },
  completionX: 3180
};
