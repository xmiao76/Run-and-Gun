import { describe, expect, it } from 'vitest';
import { repositionDir } from '../../src/simulation/enemyReposition';

describe('enemy reposition direction (right = +x)', () => {
  it('backs away opposite the player when too close', () => {
    expect(repositionDir(true, false, 500, 400)).toBe(-1); // player left -> move left
    expect(repositionDir(true, false, 500, 600)).toBe(1); // player right -> move right
  });

  it('closes in toward the player when too far', () => {
    expect(repositionDir(false, true, 500, 400)).toBe(1); // player left -> move right
    expect(repositionDir(false, true, 500, 600)).toBe(-1); // player right -> move left
  });

  it('holds position within the preferred band', () => {
    expect(repositionDir(false, false, 500, 500)).toBe(0);
  });
});
