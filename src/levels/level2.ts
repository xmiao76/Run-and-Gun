import { GROUND_Y } from '../balance/player';
import { type LevelDef, type Rect } from './levelSchema';

/**
 * Level 2 - Fortress Interior (original layout).
 *
 * Industrial interior that reuses the four regular archetypes (no new
 * archetype) and adds moving platforms, a trigger-gated door, and hazards,
 * ending with the Reactor Warden. Authored as data via small helpers; no
 * resemblance to any commercial title's map (ASSET_POLICY.md).
 */

const WORLD_WIDTH = 3240;
const WORLD_HEIGHT = 540;
const GROUND_H = 80;

function ground(x: number, width: number): Rect {
  return { x, y: GROUND_Y, width, height: GROUND_H };
}

// A single pit at 700-860 crossed by a horizontal moving platform; otherwise
// continuous floor so the level is forgiving and completable.
const solids: Rect[] = [ground(0, 700), ground(860, WORLD_WIDTH - 860)];

const oneWays: Rect[] = [{ x: 1180, y: 392, width: 130, height: 12 }];

const hazards: Rect[] = [
  { x: 700, y: GROUND_Y + 40, width: 160, height: 40 },
  { x: 2360, y: GROUND_Y - 8, width: 70, height: 8 }
];

const checkpoints = [
  { id: 'start', x: 60, y: GROUND_Y },
  { id: 'mid', x: 1320, y: GROUND_Y },
  { id: 'preboss', x: 2240, y: GROUND_Y }
];

const pickups = [
  { id: 'l2-rapid', x: 520, y: GROUND_Y - 24, weapon: 'rapid' as const },
  { id: 'l2-scatter', x: 1640, y: GROUND_Y - 24, weapon: 'scatter' as const }
];

const triggers = [
  {
    id: 'l2-wave1',
    x0: 360,
    x1: 400,
    spawns: [
      { kind: 'runner' as const, x: 560, y: GROUND_Y - 30 },
      { kind: 'drone' as const, x: 620, y: 300 }
    ]
  },
  {
    id: 'l2-wave2',
    x0: 1000,
    x1: 1040,
    spawns: [
      { kind: 'sentry' as const, x: 1240, y: GROUND_Y - 24 },
      { kind: 'grenadier' as const, x: 1460, y: GROUND_Y - 30 }
    ]
  },
  {
    id: 'l2-wave3',
    x0: 1900,
    x1: 1940,
    spawns: [
      { kind: 'runner' as const, x: 2120, y: GROUND_Y - 30 },
      { kind: 'drone' as const, x: 2180, y: 300 },
      { kind: 'grenadier' as const, x: 2300, y: GROUND_Y - 30 }
    ]
  }
];

// Horizontal moving platform bridging the pit.
const movingPlatforms = [
  { id: 'l2-mp-pit', x: 700, y: GROUND_Y - 12, width: 120, height: 12, axis: 'x' as const, min: 700, max: 760, speed: 60 },
  { id: 'l2-mp-vert', x: 1500, y: 360, width: 96, height: 12, axis: 'y' as const, min: 320, max: 420, speed: 50 }
];

// A door that blocks the corridor until the player stands on its trigger pad.
const doors = [
  {
    id: 'l2-door1',
    rect: { x: 1800, y: GROUND_Y - 96, width: 16, height: 96 },
    openTrigger: { x: 1700, y: GROUND_Y - 40, width: 60, height: 40 }
  }
];

export const LEVEL_2: LevelDef = {
  id: 'fortress-interior',
  name: 'Fortress Interior',
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT,
  spawn: { x: 60, y: GROUND_Y },
  solids,
  oneWays,
  hazards,
  checkpoints,
  triggers,
  pickups,
  movingPlatforms,
  doors,
  containers: [{ id: 'l2-crate-1', x: 2080, y: GROUND_Y - 24, width: 24, height: 24, health: 3, scoreValue: 50 }],
  boss: { id: 'reactorWarden', x0: 2560, x1: 2640, spawnX: 2860 },
  completionX: 3180
};
