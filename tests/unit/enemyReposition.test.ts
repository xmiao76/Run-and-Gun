import { describe, expect, it } from 'vitest';
import { repositionDir } from '../../src/simulation/enemyReposition';

describe('enemy reposition direction (right = +x)', () => {
  it('backs away opposite the player when too close', () => {
    // Enemy at 500. Backing away means increasing the gap, so a player on the
    // LEFT (400) pushes the enemy RIGHT. The previous expectations here said
    // the opposite while the test name said this - the assertion matched the
    // implementation's sign error rather than the behaviour (TASK-041).
    expect(repositionDir(true, false, 500, 400)).toBe(1); // player left -> retreat right
    expect(repositionDir(true, false, 500, 600)).toBe(-1); // player right -> retreat left
  });

  it('closes in toward the player when too far', () => {
    // Closing in means shrinking the gap: a player on the LEFT pulls the enemy
    // LEFT. Getting this backwards walked the Grenadier out of its own engage
    // range, so it never attacked anywhere in the game.
    expect(repositionDir(false, true, 500, 400)).toBe(-1); // player left -> advance left
    expect(repositionDir(false, true, 500, 600)).toBe(1); // player right -> advance right
  });

  it('holds position within the preferred band', () => {
    expect(repositionDir(false, false, 500, 500)).toBe(0);
  });
});
