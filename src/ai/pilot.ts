/**
 * Deterministic AI pilot for the front-page autoplay demo.
 *
 * Pure over the typed runtime snapshot - the exact state shape the debug
 * bridge publishes (`src/debug/runtimeTypes.ts`) - so the pilot perceives the
 * game the same way external automation does: no pixels, no screenshots, no
 * canvas reads. It returns a standard `InputState`, which LevelScene merges at
 * the same layer as keyboard/gamepad/touch input, so a human pressing any
 * control key takes over instantly. No debug cheat commands are used: the
 * pilot plays the honest way.
 *
 * Decision priority per step:
 *   1. survive transitions (dying / game over / completing) - neutral
 *   2. dodge imminent enemy projectiles (jump if grounded, keep moving if not)
 *   3. boss fight: fire in vulnerable windows, jump stomps, retreat charges
 *   4. engage the nearest enemy in range (drones overhead get aimed-up fire)
 *   5. traverse right, jumping pits whose gaps come from level geometry
 */

import { PLAYER_HEIGHT, PLAYER_WIDTH } from '../balance/player';
import { FIXED_DT } from '../simulation/clock';
import { createNeutralInput, type InputState } from '../input/InputState';
import type { EnemyProjectileSnapshot, LevelEnemySnapshot, LevelRuntime, SubcomponentSnapshot } from '../debug/runtimeTypes';

/** A lethal gap in the ground, as an x range. */
export interface PilotPit {
  x0: number;
  x1: number;
}

/** Static level knowledge the pilot is allowed to have (data, not pixels). */
export interface PilotGeometry {
  pits: PilotPit[];
  /** One-way platform spans; they catch jumps that would otherwise fall in a pit. */
  platforms: PilotPit[];
  /** Lethal floor hazards (spike strips) to jump, as x ranges. */
  spikes: PilotPit[];
  /** Trigger line where the boss arena begins. */
  bossArenaX0: number;
  levelWidth: number;
}

export interface PilotMemory {
  geometry: PilotGeometry;
  /** Steps until another pit jump may be attempted (prevents re-press churn). */
  jumpCooldown: number;
  /** Player x from the previous snapshot, for progress detection. */
  lastX: number;
  /** Consecutive steps of pushing right without making progress. */
  stuckSteps: number;
  /** Keep jumpHeld until landing so jumps are not cut short mid-air. */
  holdingJump: boolean;
}

export interface PilotDecision {
  input: InputState;
  memory: PilotMemory;
}

// --- tuning -----------------------------------------------------------------

/** Simulate enemy fire this many steps ahead when looking for a dodge. */
const THREAT_HORIZON_STEPS = 14;
/** Padding around the player box for threat intersection (px). */
const THREAT_MARGIN = 6;
/** Notice and fight enemies within this horizontal distance (px). */
const ENGAGE_RANGE = 400;
/** Drones closer than this to directly overhead get aimed-up fire (px). */
const DRONE_OVERHEAD_X = 70;
/** Jump this many px before reaching a pit edge. */
const PIT_JUMP_WINDOW = 8;
/**
 * Jump this many px before a spike strip. Wider than the pit window because a
 * spike kills on contact with the player's RIGHT edge, which arrives
 * PLAYER_WIDTH before the left edge the pit window is based on.
 */
const SPIKE_JUMP_WINDOW = PLAYER_WIDTH + 8;
/** Pit-jump re-attempt cooldown (steps). */
const PIT_JUMP_COOLDOWN = 45;
/** Pushing right this many steps without progress means something blocks us. */
const STUCK_JUMP_AFTER = 12;
/** Horizontal distance covered by a full jump (215 px/s * 0.64 s airtime). */
const JUMP_LAND_DISTANCE = 135;
/* Descending-fire (drone bomb) analysis. */
const DESCENDING_THREAT_WINDOW = 1.2;
const DESCENDING_IMPACT_RADIUS = 60;
/** Take over boss behaviour this far before the arena trigger (px). */
const BOSS_APPROACH = 200;
/** Jump the stomp shockwave when inside this radius (px). */
const STOMP_DODGE_RADIUS = 260;
/** Telegraph time (s) at which to jump so the shockwave passes mid-air. */
const STOMP_JUMP_AT = 0.45;
/** Retreat left of this x while the boss charges (its reach ends at 2600). */
const CHARGE_RETREAT_X = 2540;
/** Idle this far left of the boss center between attack cycles (px). */
const BOSS_HOLD_DISTANCE = 350;
/** Boss body half-width for center math (Siege Walker width 64). */
const BOSS_HALF_WIDTH = 32;
/** Close standoff distance when attacking a boss subcomponent node (px). */
const SUB_STANDOFF = 60;
/** Horizontal slack around the subcomponent standoff before stopping (px). */
const SUB_STANDOFF_DEADZONE = 16;
/** Aim diagonally up when a node sits this far above gun level (px). */
const SUB_AIM_UP_ABOVE = 20;
/** Rough enemy half-width for center math. */
const ENEMY_HALF_WIDTH = 12;

// --- helpers ----------------------------------------------------------------

/** Derive lethal pit gaps from the ground-level solid segments of a level. */
export function pitsFromSolids(
  solids: ReadonlyArray<{ x: number; y: number; width: number }>,
  groundY: number
): PilotPit[] {
  const ground = solids
    .filter((s) => s.y === groundY)
    .map((s) => ({ x0: s.x, x1: s.x + s.width }))
    .sort((a, b) => a.x0 - b.x0);
  const pits: PilotPit[] = [];
  for (let i = 1; i < ground.length; i++) {
    if (ground[i].x0 > ground[i - 1].x1) {
      pits.push({ x0: ground[i - 1].x1, x1: ground[i].x0 });
    }
  }
  return pits;
}

/** One-way platform spans, as pit-safety knowledge. */
export function platformRanges(oneWays: ReadonlyArray<{ x: number; width: number }>): PilotPit[] {
  return oneWays.map((p) => ({ x0: p.x, x1: p.x + p.width }));
}

/**
 * Lethal floor hazards that sit ON the ground surface (spike strips) and must
 * be jumped. Pit-void markers live below the ground line and are handled by
 * the pit logic instead, so they are filtered out here.
 */
export function spikeRanges(hazards: ReadonlyArray<{ x: number; y: number; width: number }>, groundY: number): PilotPit[] {
  return hazards.filter((h) => h.y < groundY).map((h) => ({ x0: h.x, x1: h.x + h.width }));
}

export function createPilotMemory(geometry: PilotGeometry): PilotMemory {
  return { geometry, jumpCooldown: 0, lastX: 0, stuckSteps: 0, holdingJump: false };
}

function overPlatform(platforms: readonly PilotPit[], x: number): boolean {
  return platforms.some((p) => x >= p.x0 && x <= p.x1);
}

/** How to evade an incoming projectile. */
export interface ThreatAssessment {
  /** A projectile will hit the player unless they act. */
  imminent: boolean;
  /** Descending fire (drone bombs, grenade arcs): sidestep, never jump. */
  descending: boolean;
  /** Where a descending shot lands on the ground plane (px). */
  impactX: number;
}

const NO_THREAT: ThreatAssessment = { imminent: false, descending: false, impactX: 0 };

/**
 * Analyze enemy fire. Fast horizontal shots are dodged by jumping; slow
 * descending shots (drone bombs, grenade arcs) are dodged by moving away from
 * their impact point - jumping those near a pit is how a pilot dies.
 */
function analyzeProjectileThreat(
  projectiles: readonly EnemyProjectileSnapshot[],
  playerX: number,
  playerFeetY: number
): ThreatAssessment {
  const top = playerFeetY - PLAYER_HEIGHT;
  const playerCenter = playerX + PLAYER_WIDTH / 2;
  for (const p of projectiles) {
    // Descending fire: predict where it reaches the player's ground plane.
    if (p.vy > 0 && p.vy >= Math.abs(p.vx)) {
      const timeToFeet = (playerFeetY - p.y) / p.vy;
      if (timeToFeet > 0 && timeToFeet < DESCENDING_THREAT_WINDOW) {
        const impactX = p.x + p.vx * timeToFeet;
        if (Math.abs(impactX - playerCenter) < DESCENDING_IMPACT_RADIUS) {
          return { imminent: true, descending: true, impactX };
        }
      }
      continue;
    }
    // Level or rising fire: step it forward and check the player's body band.
    let x = p.x;
    let y = p.y;
    let vy = p.vy;
    for (let i = 0; i < THREAT_HORIZON_STEPS; i++) {
      x += p.vx * FIXED_DT;
      y += vy * FIXED_DT;
      vy += p.arcGravity * FIXED_DT;
      if (
        x >= playerX - THREAT_MARGIN &&
        x <= playerX + PLAYER_WIDTH + THREAT_MARGIN &&
        y >= top - THREAT_MARGIN &&
        y <= playerFeetY + THREAT_MARGIN
      ) {
        return { imminent: true, descending: false, impactX: x };
      }
    }
  }
  return NO_THREAT;
}

interface TargetChoice {
  enemy: LevelEnemySnapshot;
  overhead: boolean;
}

/** Nearest ground enemy in range, unless a drone sits directly overhead. */
function pickTarget(enemies: readonly LevelEnemySnapshot[], playerCenterX: number, playerFeetY: number): TargetChoice | null {
  let best: LevelEnemySnapshot | null = null;
  let bestDist = Infinity;
  for (const e of enemies) {
    const centerX = e.x + ENEMY_HALF_WIDTH;
    const dx = centerX - playerCenterX;
    if (e.kind === 'drone') {
      if (Math.abs(dx) < DRONE_OVERHEAD_X && e.y < playerFeetY - 60) {
        return { enemy: e, overhead: true };
      }
      continue;
    }
    const dist = Math.abs(dx);
    if (dx > -40 && dist < ENGAGE_RANGE && dist < bestDist) {
      best = e;
      bestDist = dist;
    }
  }
  return best ? { enemy: best, overhead: false } : null;
}

/** Nearest pit whose near edge is still ahead of the player's left edge. */
function pitAhead(pits: readonly PilotPit[], playerX: number): PilotPit | null {
  for (const pit of pits) {
    if (pit.x0 >= playerX) {
      return pit;
    }
  }
  return null;
}

/**
 * True when a full jump from `fromX` would come down inside a pit gap with no
 * one-way platform to catch the landing.
 */
function jumpLandsUnsafely(geometry: PilotGeometry, fromX: number): boolean {
  const landX = fromX + JUMP_LAND_DISTANCE;
  for (const pit of geometry.pits) {
    if (landX >= pit.x0 && landX <= pit.x1 && !overPlatform(geometry.platforms, landX)) {
      return true;
    }
  }
  return false;
}

// --- decision ---------------------------------------------------------------

/**
 * Decide this step's input from the current snapshot. Returns the input plus
 * updated memory; both are fresh values (the caller's state is never mutated).
 */
export function decidePilotInput(snapshot: LevelRuntime, memory: PilotMemory): PilotDecision {
  const decision = trackStuckProgress(snapshot, baseDecision(snapshot, memory));
  return applyJumpHold(snapshot, decision);
}

/**
 * Variable jump height cuts velocity the instant jumpHeld drops mid-rise, so
 * every intentional jump must be held until landing - one-step presses turn
 * full jumps into fatal little hops over pits.
 */
function applyJumpHold(snapshot: LevelRuntime, decision: PilotDecision): PilotDecision {
  const { input } = decision;
  let memory = decision.memory;
  if (input.jumpPressed) {
    // Jump initiated this step: the player is still flagged grounded, so the
    // snapshot-based branch below would wrongly drop the hold before it starts.
    input.jumpHeld = true;
  } else if (snapshot.grounded) {
    if (memory.holdingJump) {
      memory = { ...memory, holdingJump: false };
    }
  } else if (memory.holdingJump) {
    input.jumpHeld = true;
  }
  return { input, memory };
}

/**
 * If we have been pushing right without making progress, an obstacle (a
 * supply crate, a ledge) is blocking the way: hop over it. Runs after every
 * decision so no branch can wedge the pilot permanently.
 */
function trackStuckProgress(snapshot: LevelRuntime, decision: PilotDecision): PilotDecision {
  const { input } = decision;
  let memory = decision.memory;
  const madeProgress = snapshot.playerX > memory.lastX + 0.1;
  const stuckSteps = input.right && !madeProgress ? memory.stuckSteps + 1 : 0;
  memory = { ...memory, lastX: snapshot.playerX, stuckSteps };
  const hop = stuckSteps >= STUCK_JUMP_AFTER && !jumpLandsUnsafely(memory.geometry, snapshot.playerX);
  if (input.right && !input.jumpPressed && snapshot.grounded && hop) {
    input.jumpPressed = true;
    input.jumpHeld = true;
    memory = { ...memory, stuckSteps: 0, holdingJump: true };
  }
  return { input, memory };
}

function baseDecision(snapshot: LevelRuntime, memory: PilotMemory): PilotDecision {
  const input = createNeutralInput();
  let next: PilotMemory = memory.jumpCooldown > 0 ? { ...memory, jumpCooldown: memory.jumpCooldown - 1 } : memory;

  // 1. Transitions: nothing to do while dying or between scenes.
  if (snapshot.dying || snapshot.gameOver || snapshot.completing) {
    return { input, memory: next };
  }

  const playerCenterX = snapshot.playerX + PLAYER_WIDTH / 2;
  const geom = memory.geometry;

  // 3. Boss fight (only while the boss lives; it has its own dodging).
  if (
    snapshot.bossActive &&
    snapshot.bossHealth > 0 &&
    snapshot.bossX !== null &&
    snapshot.playerX > geom.bossArenaX0 - BOSS_APPROACH
  ) {
    return bossDecision(snapshot, snapshot.bossX + BOSS_HALF_WIDTH, input, next);
  }

  const target = pickTarget(snapshot.enemies, playerCenterX, snapshot.playerY);
  const threat = analyzeProjectileThreat(snapshot.enemyProjectiles, snapshot.playerX, snapshot.playerY);

  // 4. Run and gun. The goal is to COMPLETE the level, not duel every enemy,
  //    and contact is harmless - so we keep advancing right and firing right,
  //    killing what is ahead and outrunning the rest. Stopping to duel only
  //    ever produced point-blank facing oscillation and stalemate.

  // Anti-air: a drone overhead gets diagonal-up fire while we pass under it.
  if (target?.overhead) {
    input.right = true;
    input.aimUp = true; // right + aimUp fires at -45 degrees
    input.fireHeld = true;
    return { input, memory: next };
  }

  // Descending fire (drone bombs, grenade lobs): sidestep the impact point,
  // staying grounded so the muzzle stays on target. Horizontal fire we simply
  // out-tank - advancing and firing kills the source faster than dodging.
  if (threat.imminent && threat.descending) {
    input.left = playerCenterX < threat.impactX;
    input.right = playerCenterX >= threat.impactX;
    input.fireHeld = true;
    return { input, memory: next };
  }

  // Default: advance and fire.
  input.right = true;
  input.fireHeld = true;

  // 5. Never walk into a pit edge or a spike strip: commit to the jump instead.
  if (input.right && snapshot.grounded && next.jumpCooldown === 0) {
    const pit = pitAhead(geom.pits, snapshot.playerX);
    const spike = pitAhead(geom.spikes, snapshot.playerX);
    const pitJump = pit !== null && pit.x0 - snapshot.playerX <= PIT_JUMP_WINDOW;
    const spikeJump = spike !== null && spike.x0 - snapshot.playerX <= SPIKE_JUMP_WINDOW;
    if (pitJump || spikeJump) {
      input.jumpPressed = true;
      input.jumpHeld = true;
      next = { ...next, jumpCooldown: PIT_JUMP_COOLDOWN, holdingJump: true };
    }
  }
  return { input, memory: next };
}

function bossDecision(snapshot: LevelRuntime, bossCenterX: number, input: InputState, memory: PilotMemory): PilotDecision {
  const playerCenterX = snapshot.playerX + PLAYER_WIDTH / 2;
  const dx = bossCenterX - playerCenterX;

  // Subcomponents gate vulnerability (e.g. Reactor Warden): destroy them first.
  if (!snapshot.bossVulnerable && snapshot.subcomponentsAlive > 0) {
    return subcomponentAttack(snapshot, input, memory);
  }

  // Vulnerable window: advance toward the boss while firing, so facing (and
  // therefore the shots) always points at it even after clearing far nodes.
  if (snapshot.bossVulnerable) {
    if (Math.abs(dx) > 24) {
      input.right = dx > 0;
      input.left = dx < 0;
    }
    input.fireHeld = true;
    return { input, memory };
  }

  // Stomp: be airborne when the shockwave lands.
  if (
    snapshot.bossPattern === 'stomp' &&
    (snapshot.bossState === 'telegraph' || snapshot.bossState === 'attack') &&
    Math.abs(dx) < STOMP_DODGE_RADIUS
  ) {
    if (snapshot.grounded && snapshot.bossStateTimer >= STOMP_JUMP_AT) {
      input.jumpPressed = true;
      input.jumpHeld = true;
    }
    return { input, memory };
  }

  // Charge: retreat left of its reach so the firing position survives.
  if (snapshot.bossPattern === 'charge' && snapshot.bossState === 'attack' && snapshot.playerX > CHARGE_RETREAT_X) {
    input.left = true;
    return { input, memory };
  }

  // Otherwise hold a safe distance left of the boss and wait out the cycle.
  const holdX = bossCenterX - BOSS_HOLD_DISTANCE;
  if (snapshot.playerX > holdX + 30) {
    input.left = true;
  } else if (snapshot.playerX < holdX - 30) {
    input.right = true;
  }
  return { input, memory };
}

/**
 * Destroy the boss subcomponents that gate its vulnerability (Reactor Warden).
 * Nodes protrude on both sides of the boss body, which blocks bullets but
 * neither movement nor contact - so the pilot walks to a close standoff on
 * each node's protruding side (through the boss if needed) and pours fire in,
 * aiming diagonally up when the node sits above gun level.
 */
function subcomponentAttack(snapshot: LevelRuntime, input: InputState, memory: PilotMemory): PilotDecision {
  const playerCenterX = snapshot.playerX + PLAYER_WIDTH / 2;
  const gunY = snapshot.playerY - PLAYER_HEIGHT / 2;
  const bossCenterX = (snapshot.bossX ?? 0) + BOSS_HALF_WIDTH;

  // Nearest alive node.
  let target: SubcomponentSnapshot | null = null;
  for (const s of snapshot.subcomponents) {
    if (!s.alive) {
      continue;
    }
    if (target === null || Math.abs(s.x + s.width / 2 - playerCenterX) < Math.abs(target.x + target.width / 2 - playerCenterX)) {
      target = s;
    }
  }
  if (target === null) {
    return { input, memory };
  }

  const nodeCX = target.x + target.width / 2;
  const nodeCY = target.y + target.height / 2;
  // Stand close on the side the node protrudes toward; bullets cannot cross
  // the boss body, but the body neither blocks nor hurts on contact.
  const standX = nodeCX < bossCenterX ? target.x - SUB_STANDOFF : target.x + target.width + SUB_STANDOFF;
  const dx = standX - snapshot.playerX;
  if (Math.abs(dx) > SUB_STANDOFF_DEADZONE) {
    input.right = dx > 0;
    input.left = dx < 0;
  } else {
    // In position: face the node (this is also the diagonal aim direction).
    input.right = nodeCX > playerCenterX;
    input.left = nodeCX < playerCenterX;
  }
  if (nodeCY < gunY - SUB_AIM_UP_ABOVE) {
    input.aimUp = true;
  }
  input.fireHeld = true;
  return { input, memory };
}
