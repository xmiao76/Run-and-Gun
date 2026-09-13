import { PLAYER_HEIGHT, PLAYER_WIDTH } from '../balance/player';

/**
 * Spawn-safety checks. Enemies must never spawn on top of the player.
 * A candidate point is rejected when its body box,
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

/**
 * Chooses a respawn position that is clear of every enemy box (C7: the player
 * never respawns inside an enemy). Starts at the checkpoint and, if any enemy
 * overlaps the spawn box (with a small margin), shifts right until clear or
 * the level edge is reached; falls back to the checkpoint itself, where the
 * post-respawn invulnerability window covers the overlap.
 */
export function respawnPosition(
  checkpoint: { x: number; y: number },
  enemies: readonly Box[],
  playerW: number,
  playerH: number,
  levelWidth: number,
  margin = DEFAULT_SPAWN_MARGIN
): { x: number; y: number } {
  for (let attempt = 0; attempt <= 8; attempt++) {
    const x = checkpoint.x + attempt * (playerW + margin);
    if (x + playerW > levelWidth) {
      break;
    }
    const spawnBox: Box = { x, y: checkpoint.y - playerH, width: playerW, height: playerH };
    const blocked = enemies.some((e) => {
      const expanded: Box = { x: e.x - margin / 2, y: e.y - margin / 2, width: e.width + margin, height: e.height + margin };
      return boxesOverlap(expanded, spawnBox);
    });
    if (!blocked) {
      return { x, y: checkpoint.y };
    }
  }
  return { x: checkpoint.x, y: checkpoint.y };
}
