import { describe, expect, it } from 'vitest';
import {
  createPilotMemory,
  decidePilotInput,
  pitsFromSolids,
  type PilotMemory
} from '../../src/ai/pilot';
import type { EnemyProjectileSnapshot, LevelEnemySnapshot, LevelRuntime } from '../../src/debug/runtimeTypes';

/**
 * The pilot must play from the typed runtime snapshot alone - these tests pin
 * each decision class: traverse, jump-at-pit, shoot-nearest-enemy,
 * dodge-incoming-projectile, and the boss vulnerable-window / dodge choices.
 */

const GROUND_Y = 480;

function makeRuntime(overrides: Partial<LevelRuntime> = {}): LevelRuntime {
  return {
    level: 'jungle-outpost',
    levelIndex: 0,
    playerX: 200,
    playerY: GROUND_Y,
    grounded: true,
    crouching: false,
    playerPose: 'idle',
    dying: false,
    lives: 30,
    invuln: false,
    weapon: 'pulse',
    fireAngle: 0,
    enemyCount: 0,
    enemies: [],
    projectileCount: 0,
    enemyProjectileCount: 0,
    enemyProjectiles: [],
    checkpoint: 'start',
    bossActive: false,
    bossHealth: 12,
    bossState: 'idle',
    bossPhase: 0,
    bossVulnerable: false,
    bossX: null,
    bossY: null,
    bossStateTimer: 0,
    bossPattern: null,
    subcomponents: [],
    subcomponentsAlive: 0,
    movingPlatforms: [],
    containersAlive: 2,
    supplyCarriersAlive: 1,
    supplyCarrierX: 260,
    pickupsAvailable: 2,
    autoPaused: false,
    telegraphCount: 0,
    maxEnemiesSeen: 0,
    maxPlayerBulletsSeen: 0,
    maxEnemyBulletsSeen: 0,
    particleCount: 0,
    paused: false,
    gameOver: false,
    completing: false,
    score: 0,
    manualClock: false,
    autopilot: true,
    stepIndex: 0,
  hitStopped: false,
  bridges: [],
    maxPlayerX: 200,
    ending: null,
    deaths: [],
    bossId: 'siegeWalker',
    bossDamageTaken: 0,
    killsByKind: {},
    damageByKind: {},
    ...overrides
  };
}

function makeMemory(overrides: Partial<PilotMemory['geometry']> = {}): PilotMemory {
  return createPilotMemory({
    pits: [
      { x0: 720, x1: 840 },
      { x0: 1320, x1: 1440 }
    ],
    // One-way platforms span both pits, like in Level 1.
    platforms: [
      { x0: 720, x1: 840 },
      { x0: 1320, x1: 1440 }
    ],
    // One floor spike strip before the boss arena, like in Level 2.
    spikes: [{ x0: 2360, x1: 2430 }],
    bossArenaX0: 2560,
    levelWidth: 3240,
    ...overrides
  });
}

const enemy = (x: number, kind = 'runner', y = GROUND_Y - 30): LevelEnemySnapshot => ({
  id: 'e1',
  kind,
  state: 'approach',
  x,
  y
});

const bullet = (x: number, vx: number, y = GROUND_Y - 16): EnemyProjectileSnapshot => ({
  x,
  y,
  vx,
  vy: 0,
  arcGravity: 0
});

describe('pitsFromSolids', () => {
  it('derives the lethal gaps between ground segments', () => {
    const solids = [
      { x: 0, y: GROUND_Y, width: 720 },
      { x: 840, y: GROUND_Y, width: 480 },
      { x: 1440, y: GROUND_Y, width: 1120 },
      { x: 2560, y: GROUND_Y, width: 680 }
    ];
    expect(pitsFromSolids(solids, GROUND_Y)).toEqual([
      { x0: 720, x1: 840 },
      { x0: 1320, x1: 1440 }
    ]);
  });

  it('ignores solids that are not at ground level', () => {
    const solids = [
      { x: 0, y: GROUND_Y, width: 100 },
      { x: 100, y: 408, width: 120 }, // one-way platform, not ground
      { x: 100, y: GROUND_Y, width: 100 }
    ];
    expect(pitsFromSolids(solids, GROUND_Y)).toEqual([]);
  });
});

describe('decidePilotInput: traversal', () => {
  it('runs and guns when the way is clear', () => {
    const { input } = decidePilotInput(makeRuntime(), makeMemory());
    expect(input.right).toBe(true);
    expect(input.left).toBe(false);
    expect(input.jumpPressed).toBe(false);
    expect(input.fireHeld).toBe(true); // run-and-gun fires while advancing
  });

  it('does nothing while dying or completing', () => {
    const dying = decidePilotInput(makeRuntime({ dying: true }), makeMemory());
    expect(dying.input.right).toBe(false);
    const completing = decidePilotInput(makeRuntime({ completing: true }), makeMemory());
    expect(completing.input.right).toBe(false);
  });

  it('resumes traversal once the boss is dead', () => {
    const snap = makeRuntime({ bossActive: true, bossHealth: 0, bossX: 2820, playerX: 2700 });
    const { input } = decidePilotInput(snap, makeMemory());
    expect(input.right).toBe(true);
    expect(input.fireHeld).toBe(true);
  });
});

describe('decidePilotInput: jump-at-pit', () => {
  it('jumps when grounded at the edge of a pit', () => {
    const snap = makeRuntime({ playerX: 714 }); // pit edge at 720
    const { input, memory } = decidePilotInput(snap, makeMemory());
    expect(input.jumpPressed).toBe(true);
    expect(input.jumpHeld).toBe(true);
    expect(input.right).toBe(true);
    expect(memory.jumpCooldown).toBeGreaterThan(0);
  });

  it('does not jump while far from a pit', () => {
    const { input } = decidePilotInput(makeRuntime({ playerX: 400 }), makeMemory());
    expect(input.jumpPressed).toBe(false);
  });

  it('does not re-press jump while the cooldown runs', () => {
    const seeded: PilotMemory = { ...makeMemory(), jumpCooldown: 10 };
    const { input } = decidePilotInput(makeRuntime({ playerX: 714 }), seeded);
    expect(input.jumpPressed).toBe(false);
  });
});

describe('decidePilotInput: run-and-gun combat', () => {
  it('advances right and fires right at enemies ahead', () => {
    const snap = makeRuntime({ enemyCount: 1, enemies: [enemy(420)] });
    const { input } = decidePilotInput(snap, makeMemory());
    expect(input.fireHeld).toBe(true);
    expect(input.right).toBe(true);
  });

  it('keeps advancing and firing even when on top of the enemy', () => {
    const snap = makeRuntime({ enemyCount: 1, enemies: [enemy(210)] });
    const { input } = decidePilotInput(snap, makeMemory());
    expect(input.fireHeld).toBe(true);
    expect(input.right).toBe(true); // never stops to duel; outruns what it does not kill
  });

  it('fires diagonally up at a drone directly overhead while advancing', () => {
    const snap = makeRuntime({ enemyCount: 1, enemies: [enemy(205, 'drone', 300)] });
    const { input } = decidePilotInput(snap, makeMemory());
    expect(input.aimUp).toBe(true);
    expect(input.right).toBe(true); // keeps passing under it
    expect(input.fireHeld).toBe(true);
  });

  it('still fires while traversing past a far enemy', () => {
    const snap = makeRuntime({ enemyCount: 1, enemies: [enemy(1200)] });
    const { input } = decidePilotInput(snap, makeMemory());
    expect(input.fireHeld).toBe(true);
    expect(input.right).toBe(true);
  });
});

describe('decidePilotInput: projectile response', () => {
  it('tanks a horizontal shot and keeps advancing and firing', () => {
    const snap = makeRuntime({
      enemyProjectileCount: 1,
      enemyProjectiles: [bullet(160, 200)] // closing fast at gun height
    });
    const { input } = decidePilotInput(snap, makeMemory());
    expect(input.jumpPressed).toBe(false); // no dodge-jump: firing kills the source faster
    expect(input.right).toBe(true);
    expect(input.fireHeld).toBe(true);
  });

  it('sidesteps a descending drone bomb instead of jumping it', () => {
    const snap = makeRuntime({
      playerX: 700,
      enemyProjectileCount: 1,
      enemyProjectiles: [{ x: 730, y: 320, vx: 20, vy: 220, arcGravity: 0 }]
    });
    const { input } = decidePilotInput(snap, makeMemory());
    expect(input.jumpPressed).toBe(false);
    expect(input.left).toBe(true); // impact is to the right -> move left
    expect(input.fireHeld).toBe(true);
  });

  it('ignores projectiles flying away from the player', () => {
    const snap = makeRuntime({
      enemyProjectileCount: 1,
      enemyProjectiles: [bullet(400, 200)] // ahead, moving further away
    });
    const { input } = decidePilotInput(snap, makeMemory());
    expect(input.jumpPressed).toBe(false);
    expect(input.right).toBe(true);
  });
});

describe('decidePilotInput: pit awareness', () => {
  it('tanks a horizontal shot near a pit instead of jumping into it', () => {
    const snap = makeRuntime({
      playerX: 650, // a jump from here lands inside the 720-840 pit
      enemyProjectileCount: 1,
      enemyProjectiles: [bullet(610, 200)]
    });
    const { input } = decidePilotInput(snap, makeMemory({ platforms: [] }));
    expect(input.jumpPressed).toBe(false); // never jumps into a pit; keeps firing
    expect(input.right).toBe(true);
    expect(input.fireHeld).toBe(true);
  });

  it('still jumps the pit itself at the edge', () => {
    const snap = makeRuntime({ playerX: 714 }); // pit edge at 720
    const { input } = decidePilotInput(snap, makeMemory());
    expect(input.jumpPressed).toBe(true);
    expect(input.right).toBe(true);
  });

  it('sidesteps a descending drone bomb instead of jumping it', () => {
    const snap = makeRuntime({
      playerX: 700,
      enemyProjectileCount: 1,
      // Slow, near-vertical shot landing just right of the player.
      enemyProjectiles: [{ x: 730, y: 320, vx: 20, vy: 220, arcGravity: 0 }]
    });
    const { input } = decidePilotInput(snap, makeMemory());
    expect(input.jumpPressed).toBe(false);
    expect(input.left).toBe(true); // impact is to the right -> move left
  });

  it('keeps firing while crossing toward an enemy past a pit', () => {
    const snap = makeRuntime({
      playerX: 650,
      enemyCount: 1,
      enemies: [enemy(760)] // enemy just across the pit
    });
    const { input } = decidePilotInput(snap, makeMemory());
    expect(input.fireHeld).toBe(true);
    expect(input.right).toBe(true);
  });

  it('fires diagonally up at an overhead drone while passing the pit', () => {
    const snap = makeRuntime({
      playerX: 860,
      enemyCount: 1,
      enemies: [enemy(855, 'drone', 300)]
    });
    const { input } = decidePilotInput(snap, makeMemory());
    expect(input.aimUp).toBe(true);
    expect(input.right).toBe(true);
    expect(input.fireHeld).toBe(true);
  });
});

describe('decidePilotInput: obstacle hop', () => {
  it('hops after pushing right without progress (a crate blocks the way)', () => {
    const seeded: PilotMemory = { ...makeMemory(), lastX: 980, stuckSteps: 11 };
    const snap = makeRuntime({ playerX: 980 });
    const { input, memory } = decidePilotInput(snap, seeded);
    expect(input.right).toBe(true);
    expect(input.jumpPressed).toBe(true);
    expect(memory.stuckSteps).toBe(0);
  });

  it('keeps walking while still making progress', () => {
    const seeded: PilotMemory = { ...makeMemory(), lastX: 970, stuckSteps: 11 };
    const snap = makeRuntime({ playerX: 980 });
    const { input } = decidePilotInput(snap, seeded);
    expect(input.jumpPressed).toBe(false);
    expect(input.right).toBe(true);
  });
});

describe('decidePilotInput: boss fight', () => {
  const inArena = (overrides: Partial<LevelRuntime> = {}): LevelRuntime =>
    makeRuntime({
      bossActive: true,
      bossX: 2820, // center 2852
      bossY: 424,
      playerX: 2500,
      ...overrides
    });

  it('approaches and fires during the vulnerable window', () => {
    const { input } = decidePilotInput(inArena({ bossVulnerable: true }), makeMemory());
    expect(input.fireHeld).toBe(true);
    expect(input.right).toBe(true); // 352 px from center > 300 -> close in
  });

  it('keeps closing on the boss at point-blank rather than standing still', () => {
    // Updated for TASK-028. Standing still here was the bug: facing only
    // changes while a direction is held, so a pilot that stopped "close
    // enough" kept whatever facing its last node attack left it with, and
    // could spend the whole 2 s window firing away from a vulnerable boss for
    // no damage. Measured: the Reactor Warden took 8 -> 8 across 113
    // vulnerable samples. The hull neither blocks movement nor hurts on
    // contact, so pressing on is safe and keeps the gun on target.
    const { input } = decidePilotInput(inArena({ bossVulnerable: true, playerX: 2820 }), makeMemory());
    expect(input.fireHeld).toBe(true);
    expect(input.right).toBe(true); // boss centre is still to the right
    expect(input.left).toBe(false);
  });

  it('jumps a telegraphed stomp when inside the shockwave radius', () => {
    const snap = inArena({
      playerX: 2700, // 152 px from center - inside the radius
      bossState: 'telegraph',
      bossPattern: 'stomp',
      bossStateTimer: 0.5
    });
    const { input } = decidePilotInput(snap, makeMemory());
    expect(input.jumpPressed).toBe(true);
  });

  it('does not jump for a stomp telegraphed early or far away', () => {
    const early = inArena({
      playerX: 2700,
      bossState: 'telegraph',
      bossPattern: 'stomp',
      bossStateTimer: 0.2
    });
    expect(decidePilotInput(early, makeMemory()).input.jumpPressed).toBe(false);
    const far = inArena({
      playerX: 2500, // 352 px from center - outside the radius
      bossState: 'telegraph',
      bossPattern: 'stomp',
      bossStateTimer: 0.6
    });
    expect(decidePilotInput(far, makeMemory()).input.jumpPressed).toBe(false);
  });

  it('retreats left while the boss charges', () => {
    const snap = inArena({ playerX: 2650, bossState: 'attack', bossPattern: 'charge' });
    const { input } = decidePilotInput(snap, makeMemory());
    expect(input.left).toBe(true);
    expect(input.right).toBe(false);
  });

  it('holds a safe distance between attack cycles', () => {
    const snap = inArena({ bossState: 'idle', playerX: 2600 }); // hold point is 2502
    const { input } = decidePilotInput(snap, makeMemory());
    expect(input.left).toBe(true);
  });
});

/**
 * TASK-028: attacking the Reactor Warden's shield nodes.
 *
 * The pilot used to settle into a stable, useless standoff - walking toward a
 * spot BEHIND itself while firing in its direction of travel, i.e. away from
 * the node. Movement is facing in this game, so "reposition" and "keep the gun
 * on the target" pull against each other and any naive seek has a fixed point.
 *
 * Geometry of the fixture (Level 2, phase 1): boss body at x 2820, node at
 * x 2792-2810 whose centre is 39 px above the gun, so a 45-degree shot only
 * connects from ~39 px away horizontally - measured from the MUZZLE, which sits
 * at the player's leading edge, not their centre.
 */
describe('subcomponent attack positioning', () => {
  const NODE = { id: 'rw-p1-a', x: 2792, y: 416, width: 18, height: 18, alive: true };

  function warden(overrides: Partial<LevelRuntime> = {}): LevelRuntime {
    return makeRuntime({
      playerY: 480,
      bossActive: true,
      bossHealth: 8,
      bossX: 2820,
      bossVulnerable: false,
      subcomponents: [NODE],
      subcomponentsAlive: 1,
      fireAngle: 0,
      ...overrides
    });
  }

  it('holds position and fires diagonally when the gap matches the shot', () => {
    // Muzzle at 2740+22 = 2762, node centre 2801: a 39 px gap, matching the
    // 39 px the node sits above the gun.
    const decision = decidePilotInput(warden({ playerX: 2740 }), makeMemory());
    expect(decision.input.left).toBe(false);
    expect(decision.input.right).toBe(false);
    expect(decision.input.fireHeld).toBe(true);
    expect(decision.input.aimUp).toBe(true);
  });

  it('swings the gun back onto the node when facing the wrong way', () => {
    // Same position, but the last move left the player facing left (180).
    const decision = decidePilotInput(warden({ playerX: 2740, fireAngle: 180 }), makeMemory());
    expect(decision.input.right).toBe(true);
    expect(decision.input.left).toBe(false);
  });

  it('backs off when too close for the diagonal to come down on the node', () => {
    // Muzzle almost on top of the node: a 45-degree shot sails over it.
    const decision = decidePilotInput(warden({ playerX: 2780 }), makeMemory());
    expect(decision.input.left).toBe(true);
    expect(decision.input.right).toBe(false);
  });

  it('keeps backing off once it starts, instead of stopping on the band edge', () => {
    // Latched retreat: without it the pilot alternates "back off" and "face the
    // node" forever, which is the original wedge.
    const memory = { ...makeMemory(), subRepositioning: true };
    const decision = decidePilotInput(warden({ playerX: 2749 }), memory);
    expect(decision.input.left).toBe(true);
    expect(decision.memory.subRepositioning).toBe(true);
  });

  it('closes in when too far out for the shot to reach', () => {
    const decision = decidePilotInput(warden({ playerX: 2600 }), makeMemory());
    expect(decision.input.right).toBe(true);
    expect(decision.input.left).toBe(false);
  });

  it('forces a break-out after firing for too long with nothing destroyed', () => {
    // A node has 2 health. Seconds of fire with no kill means the shots are not
    // landing, whatever the geometry says, so the position has to change.
    const stalled = { ...makeMemory(), subAttackSteps: 241, lastSubAlive: 1 };
    const decision = decidePilotInput(warden({ playerX: 2740 }), stalled);
    expect(decision.memory.subBreakout).toBeGreaterThan(0);
    expect(decision.input.left).toBe(true);
  });

  it('resets the stall counter as soon as a node actually dies', () => {
    const progressing = { ...makeMemory(), subAttackSteps: 200, lastSubAlive: 2 };
    const decision = decidePilotInput(warden({ playerX: 2740, subcomponentsAlive: 1 }), progressing);
    expect(decision.memory.subAttackSteps).toBe(0);
    expect(decision.memory.subBreakout).toBe(0);
  });

  it('leaves a boss with no nodes alone: Level 1 tuning is untouched', () => {
    const siegeWalker = makeRuntime({
      playerX: 2600,
      bossActive: true,
      bossHealth: 12,
      bossX: 2880,
      bossVulnerable: false,
      subcomponents: [],
      subcomponentsAlive: 0
    });
    const decision = decidePilotInput(siegeWalker, makeMemory());
    expect(decision.memory.sawSubcomponents).toBe(false);
  });
});
