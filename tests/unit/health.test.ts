import { describe, expect, it } from 'vitest';
import {
  applyDamage,
  createHealthState,
  isInvulnerable,
  restoreWithInvuln,
  tickInvuln
} from '../../src/simulation/health';

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
