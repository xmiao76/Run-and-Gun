import { PLAYER_HEIGHT, PLAYER_WIDTH } from '../balance/player';

/**
 * Spawn-safety checks. Enemies must never spawn on top of the player
 * (ACCEPTANCE_CRITERIA E3). A candidate point is rejected when its body box,
 * expanded by a safety margin, overlaps the player body.
 */

export const DEFAULT_SPAWN_MARGIN = 48;

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function playerBox(playerX: number, playerY: number): Box {
  return { x: playerX, y: playerY, width: PLAYER_WIDTH, height: PLAYER_HEIGHT };
}

export function boxesOverlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

/** True when the candidate spawn box is clear of the player (with margin). */
export function isSpawnSafe(
  candidate: Box,
  playerX: number,
  playerY: number,
  margin = DEFAULT_SPAWN_MARGIN
): boolean {
  const expanded: Box = {
    x: candidate.x - margin,
    y: candidate.y - margin,
    width: candidate.width + margin * 2,
    height: candidate.height + margin * 2
  };
  return !boxesOverlap(expanded, playerBox(playerX, playerY));
}
