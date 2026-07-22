/**
 * Horizontal repositioning direction for distance-keeping enemies (Grenadier).
 *
 * Isolated so the rule is unit-testable on its own. Uses the standard world
 * convention (verified against the player: moving right increases x):
 *  - too close -> back away from the player (move opposite them);
 *  - too far   -> close in on the player (move toward them).
 * Returns -1, 0, or +1.
 */
export function repositionDir(tooClose: boolean, tooFar: boolean, enemyX: number, playerX: number): number {
  const playerIsLeft = playerX < enemyX;
  if (tooClose) {
    // Back away: left player -> left (-1); right player -> right (+1).
    return playerIsLeft ? -1 : 1;
  }
  if (tooFar) {
    // Close in (move toward the player): right player -> right (+1); left -> left (-1).
    return playerIsLeft ? 1 : -1;
  }
  return 0;
}
