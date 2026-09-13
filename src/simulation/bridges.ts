import { type BridgeDef, type Rect } from '../levels/levelSchema';

/**
 * Collapsing bridges: solid terrain that gives way once the player steps on it.
 *
 * The set piece is the commitment. Standing on a bridge starts a fail timer
 * that does NOT reset when you step off, so crossing is a decision rather than
 * a thing you can poke at and retreat from. The span stays solid while it
 * fails - that is the window you run through - and becomes passable when it is
 * gone, which turns it into an ordinary pit.
 *
 * Pure and immutable, like the containers and doors it sits beside; the scene
 * owns rendering and the player-overlap test.
 */

export type BridgeStage = 'intact' | 'failing' | 'gone';

export interface BridgeState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Seconds of weight on the span before it commits to failing. */
  triggerDelay: number;
  /** Seconds from committing to actually dropping - the crossing window. */
  collapseDelay: number;
  stage: BridgeStage;
  /** Seconds accumulated in the current stage. */
  timer: number;
}

export function createBridgeState(def: BridgeDef): BridgeState {
  return { ...def, stage: 'intact', timer: 0 };
}

export function createBridgeStates(defs: readonly BridgeDef[]): BridgeState[] {
  return defs.map(createBridgeState);
}

/**
 * Advance one bridge by `dt`.
 *
 * `loaded` is whether the player's weight is on the span this step; it only
 * matters while the bridge is intact, because a failing bridge is already
 * committed and a gone one is terminal.
 */
export function stepBridge(bridge: BridgeState, dt: number, loaded: boolean): BridgeState {
  if (bridge.stage === 'gone') {
    return bridge;
  }
  if (bridge.stage === 'failing') {
    const timer = bridge.timer + dt;
    if (timer >= bridge.collapseDelay) {
      return { ...bridge, stage: 'gone', timer: 0 };
    }
    return { ...bridge, timer };
  }
  if (!loaded) {
    // Weight came off before it committed: the span is unstressed again.
    return bridge.timer === 0 ? bridge : { ...bridge, timer: 0 };
  }
  const timer = bridge.timer + dt;
  if (timer >= bridge.triggerDelay) {
    return { ...bridge, stage: 'failing', timer: 0 };
  }
  return { ...bridge, timer };
}

/** True while the span still carries the player. */
export function isBridgeSolid(bridge: BridgeState): boolean {
  return bridge.stage !== 'gone';
}

/** Standing-on test: the player's feet are on the span's top edge, within its run. */
export function bridgeCarries(bridge: BridgeState, playerX: number, playerWidth: number, feetY: number): boolean {
  if (!isBridgeSolid(bridge)) {
    return false;
  }
  const overlapsX = playerX + playerWidth > bridge.x && playerX < bridge.x + bridge.width;
  // Generous vertical tolerance: the platformer resolves the player to rest
  // exactly on the surface, but a step of float drift must not drop the test.
  return overlapsX && Math.abs(feetY - bridge.y) <= 2;
}

/** Bridges that are still solid terrain this step. */
export function solidBridgeRects(bridges: readonly BridgeState[]): Rect[] {
  return bridges
    .filter(isBridgeSolid)
    .map((b) => ({ x: b.x, y: b.y, width: b.width, height: b.height }));
}

/**
 * Spans a route-planner must treat as a gap.
 *
 * Every bridge, whatever stage it is in - NOT only the collapsed ones. The AI
 * pilot builds its geometry once at level start and a bridge can vanish at any
 * moment afterwards, so the only safe advice is "there may be nothing here".
 * Jumping a bridge that happens to be intact costs the pilot nothing; walking
 * onto one that is about to go costs it a life.
 */
export function bridgeGaps(bridges: readonly BridgeState[]): { x0: number; x1: number }[] {
  return bridges.map((b) => ({ x0: b.x, x1: b.x + b.width }));
}
