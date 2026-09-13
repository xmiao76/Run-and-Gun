import { describe, expect, it } from 'vitest';
import {
  applyDamage,
  applyLethalDamage,
  createHealthState,
  isInvulnerable,
  restoreWithInvuln,
  tickInvuln,
  type HealthState
} from '../../src/simulation/health';

/** Matches the game's INVULN_DURATION; the exact value is not under test. */
const INVULN = 1.5;

describe('damage, invulnerability, and life loss', () => {
  it('blocks damage during the invulnerability window', () => {
    const hurt = applyDamage(createHealthState(3), 1.5);
    expect(hurt.applied).toBe(true);
    expect(hurt.health.lives).toBe(2);
    expect(isInvulnerable(hurt.health)).toBe(true);

    const blocked = applyDamage(hurt.health, 1.5);
    expect(blocked.applied).toBe(false);
    expect(blocked.health.lives).toBe(2);
  });

  it('expires the invulnerability window over simulation time', () => {
    const hurt = applyDamage(createHealthState(3), 1.0).health;
    const mid = tickInvuln(hurt, 0.6);
    expect(mid.invuln).toBeCloseTo(0.4);
    expect(isInvulnerable(mid)).toBe(true);

    const done = tickInvuln(mid, 0.4);
    expect(done.invuln).toBe(0);
    expect(isInvulnerable(done)).toBe(false);

    // Clamps at zero rather than going negative.
    expect(tickInvuln(done, 5).invuln).toBe(0);
  });

  it('decrements lives to zero and triggers game over exactly once', () => {
    let health = createHealthState(2);
    health = applyDamage(health, 0).health; // invuln 0 -> immediate re-hit possible
    expect(health.lives).toBe(1);
    health = applyDamage(health, 0).health;
    expect(health.lives).toBe(0);
    expect(health.gameOver).toBe(true);

    const after = applyDamage(health, 1);
    expect(after.applied).toBe(false);
    expect(after.health.gameOver).toBe(true);
  });

  it('restores lives with a fresh invulnerability window on respawn', () => {
    const restored = restoreWithInvuln(3, 1.5);
    expect(restored.lives).toBe(3);
    expect(restored.invuln).toBe(1.5);
    expect(restored.gameOver).toBe(false);
  });
});

/**
 * TASK-026.
 *
 * Mercy invincibility exists so that one projectile hit does not immediately
 * become several. Falling out of the world or touching a lethal hazard is not
 * damage for it to absorb: the player has unambiguously left the playfield and
 * the respawn runs either way, so letting the window swallow the life loss made
 * a pit a free teleport back to the last checkpoint.
 */
describe('lethal damage ignores the invulnerability window', () => {
  it('costs a life even while invulnerable, unlike ordinary damage', () => {
    const invulnerable: HealthState = { lives: 3, invuln: 0.8, gameOver: false };

    // Ordinary damage is absorbed...
    const absorbed = applyDamage(invulnerable, INVULN);
    expect(absorbed.applied).toBe(false);
    expect(absorbed.health.lives).toBe(3);

    // ...but falling into a pit is not.
    const lethal = applyLethalDamage(invulnerable, INVULN);
    expect(lethal.applied).toBe(true);
    expect(lethal.health.lives).toBe(2);
  });

  it('starts a fresh invulnerability window on the respawn', () => {
    const result = applyLethalDamage({ lives: 3, invuln: 0.8, gameOver: false }, INVULN);
    expect(result.health.invuln).toBe(INVULN);
  });

  it('ends the run when the last life goes, with no lingering invulnerability', () => {
    const result = applyLethalDamage({ lives: 1, invuln: 0.8, gameOver: false }, INVULN);
    expect(result.applied).toBe(true);
    expect(result.health).toEqual({ lives: 0, invuln: 0, gameOver: true });
  });

  it('does nothing once the run is already over', () => {
    const over: HealthState = { lives: 0, invuln: 0, gameOver: true };
    const result = applyLethalDamage(over, INVULN);
    expect(result.applied).toBe(false);
    expect(result.health).toBe(over);
  });

  it('behaves identically to ordinary damage when not invulnerable', () => {
    const healthy: HealthState = { lives: 3, invuln: 0, gameOver: false };
    expect(applyLethalDamage(healthy, INVULN)).toEqual(applyDamage(healthy, INVULN));
  });
});
