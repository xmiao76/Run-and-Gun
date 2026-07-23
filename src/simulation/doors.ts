import { type DoorDef } from '../levels/levelSchema';

/**
 * Deterministic door logic.
 *
 * A door is a solid body while closed and passable while open. It opens while
 * the player overlaps its `openTrigger` region and closes again otherwise, so
 * progress is reversible and trap-free (F5). Pure and unit-testable.
 */

export interface DoorState {
  id: string;
  rect: DoorDef['rect'];
  openTrigger: DoorDef['openTrigger'];
  open: boolean;
}

export function createDoorState(def: DoorDef): DoorState {
  return { id: def.id, rect: def.rect, openTrigger: def.openTrigger, open: false };
}

export function createDoorStates(defs: readonly DoorDef[]): DoorState[] {
  return defs.map(createDoorState);
}

function overlaps(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function stepDoor(
  door: DoorState,
  playerX: number,
  playerY: number,
  playerW: number,
  playerH: number
): DoorState {
  const t = door.openTrigger;
  const open = overlaps(playerX, playerY, playerW, playerH, t.x, t.y, t.width, t.height);
  return { ...door, open };
}

/** Closed doors act as solid terrain. */
export function closedDoorRects(doors: readonly DoorState[]): DoorState['rect'][] {
  return doors.filter((d) => !d.open).map((d) => d.rect);
}
