import { GROUND_Y } from '../balance/player';
import { type LevelDef, type Rect } from './levelSchema';

/**
 * Level 3: Ashfall Ridge.
 *
 * The volcanic approach to the enemy's last position, and the stage that puts
 * TASK-038's set pieces to work: two collapsing causeways over lava channels,
 * and turret emplacements holding the ground the player must cross.
 *
 * Layout is original to this project (ASSET_POLICY.md); side-scrolling only.
 *
 * Shape of the run, left to right:
 *   0- 640  approach, one turret to teach what an emplacement does
 * 640- 760  first collapsing causeway over a channel - a short, safe lesson
 * 760-1500  open ground, the level's first real firefight
 *1500-1620  second causeway, this time with a turret covering the far side
 *1620-2400  the climb, turrets on the high ledges
 *2400+      boss shelf
 */

// 3240 like Levels 1 and 2: the player clamps at `width - PLAYER_WIDTH`,
// so a completionX of 3180 needs headroom beyond it to be reachable at all.
const WORLD_WIDTH = 3240;
const WORLD_HEIGHT = 540;

function ground(x: number, width: number): Rect {
  return { x, y: GROUND_Y, width, height: WORLD_HEIGHT - GROUND_Y };
}

function oneWay(x: number, y: number, width: number): Rect {
  return { x, y, width, height: 12 };
}

/**
 * Ground with two channels, at 640-760 and 1500-1620.
 *
 * Both are bridged by a collapsing causeway, so they are crossable terrain
 * until the player commits to them - and a plain pit afterwards, which is why
 * both are narrow enough to jump. A channel the player could be stranded at
 * would be a trap rather than a set piece.
 */
const solids: Rect[] = [
  ground(0, 640),
  ground(760, 740),
  ground(1620, 780),
  ground(2400, WORLD_WIDTH - 2400)
];

const oneWays: Rect[] = [oneWay(980, 396, 140), oneWay(1800, 384, 150), oneWay(2080, 336, 140)];

const hazards: Rect[] = [
  // Channel markers, drawn under the causeways; lethality comes from the fall
  // threshold, exactly as in Levels 1 and 2.
  { x: 640, y: GROUND_Y + 40, width: 120, height: 40 },
  { x: 1500, y: GROUND_Y + 40, width: 120, height: 40 }
];

const checkpoints = [
  { id: 'start', x: 60, y: GROUND_Y },
  { id: 'mid', x: 1300, y: GROUND_Y },
  { id: 'preboss', x: 2260, y: GROUND_Y }
];

const pickups = [
  { id: 'l3-rapid', x: 420, y: GROUND_Y - 24, weapon: 'rapid' as const },
  { id: 'l3-laser', x: 1240, y: GROUND_Y - 24, weapon: 'laser' as const },
  // On the high ledge: the flame capsule rewards the climb.
  { id: 'l3-flame', x: 2130, y: 312, weapon: 'flame' as const }
];

/**
 * The two collapsing causeways.
 *
 * `triggerDelay` is short but non-zero so stepping on reads as a warning
 * rather than an instant drop, and `collapseDelay` is a comfortable second and
 * a half - long enough to walk across at full speed, short enough that
 * standing still is punished.
 */
const bridges = [
  { id: 'l3-causeway-1', x: 640, y: GROUND_Y, width: 120, height: 14, triggerDelay: 0.25, collapseDelay: 1.5 },
  { id: 'l3-causeway-2', x: 1500, y: GROUND_Y, width: 120, height: 14, triggerDelay: 0.25, collapseDelay: 1.5 }
];

const ENEMY_Y = GROUND_Y - 30;
const TURRET_Y = GROUND_Y - 22;

/**
 * Spawn waves.
 *
 * Every spawn sits on a solid ground segment (0-640, 760-1500, 1620-2400,
 * 2400+) and clear of its own trigger line, so the 48px spawn-safety margin
 * admits it - the same rule Levels 1 and 2 follow.
 */
const triggers = [
  {
    id: 'l3-wave-1',
    x0: 300,
    x1: 340,
    spawns: [
      { kind: 'turret' as const, x: 560, y: TURRET_Y },
      { kind: 'runner' as const, x: 500, y: ENEMY_Y }
    ]
  },
  {
    id: 'l3-wave-2',
    x0: 900,
    x1: 940,
    spawns: [
      { kind: 'sentry' as const, x: 1120, y: GROUND_Y - 24 },
      { kind: 'runner' as const, x: 1240, y: ENEMY_Y },
      { kind: 'grenadier' as const, x: 1400, y: ENEMY_Y }
    ]
  },
  {
    id: 'l3-wave-3',
    x0: 1680,
    x1: 1720,
    spawns: [
      // The turret covers the far side of the second causeway.
      { kind: 'turret' as const, x: 1900, y: TURRET_Y },
      { kind: 'drone' as const, x: 2000, y: 290 },
      { kind: 'runner' as const, x: 2120, y: ENEMY_Y }
    ]
  },
  {
    id: 'l3-wave-4',
    x0: 2150,
    x1: 2190,
    spawns: [
      { kind: 'turret' as const, x: 2340, y: TURRET_Y },
      { kind: 'grenadier' as const, x: 2260, y: ENEMY_Y }
    ]
  }
];

const movingPlatforms = [
  { id: 'l3-lift-1', x: 1700, y: 300, width: 96, height: 12, axis: 'y' as const, min: 260, max: 380, speed: 42 }
];

export const LEVEL_3: LevelDef = {
  id: 'ashfall-ridge',
  name: 'Ashfall Ridge',
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
  doors: [],
  containers: [
    { id: 'l3-crate-1', x: 1180, y: GROUND_Y - 24, width: 24, height: 24, health: 3, scoreValue: 50 },
    { id: 'l3-crate-2', x: 2200, y: GROUND_Y - 24, width: 24, height: 24, health: 3, scoreValue: 50 }
  ],
  bridges,
  supplyCarriers: [{ id: 'l3-skiff-1', fromX: 800, toX: 2300, y: 130, speed: 85, weapon: 'laser' }],
  boss: { id: 'ashSentinel', x0: 2560, x1: 2640, spawnX: 2880 },
  completionX: 3180
};
