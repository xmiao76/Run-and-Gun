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
    // Back AWAY from the player: if they are to our left we retreat right
    // (+1); if they are to our right we retreat left (-1).
    return playerIsLeft ? 1 : -1;
  }
  if (tooFar) {
    // Close IN on the player: if they are to our left we advance left (-1);
    // if they are to our right we advance right (+1).
    return playerIsLeft ? -1 : 1;
  }
  return 0;
}
