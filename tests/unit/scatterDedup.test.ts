import { describe, expect, it } from 'vitest';
import { createDamageLedger, recordHit } from '../../src/simulation/damageLedger';
import { createWeaponState, stepWeapon } from '../../src/simulation/weapons';

describe('scatter pellets and duplicate-hit protection (D5)', () => {
  it('a single attack cannot damage the same target twice in one step', () => {
    const ledger = createDamageLedger();
    // Simulate one projectile registering multiple overlapping callbacks.
    expect(recordHit(ledger, 'bullet-7', 'enemy-1')).toBe(true);
    expect(recordHit(ledger, 'bullet-7', 'enemy-1')).toBe(false);
    expect(recordHit(ledger, 'bullet-7', 'enemy-1')).toBe(false);
  });

  it('each scatter pellet is a distinct attack, so three overlapping pellets hit once each (no multiplication)', () => {
    const fired = stepWeapon(createWeaponState('scatter'), 0, { pressed: true, held: false });
    expect(fired.projectiles).toHaveLength(3);

    const ledger = createDamageLedger();
    const enemyId = 'enemy-1';
    let hits = 0;
    fired.projectiles.forEach((_pellet, index) => {
      // Scene assigns each projectile a unique attack id.
      const attackId = 'pb' + index;
      if (recordHit(ledger, attackId, enemyId)) {
        hits += 1;
      }
      // A second callback for the very same pellet this step is suppressed.
      expect(recordHit(ledger, attackId, enemyId)).toBe(false);
    });
    // Exactly one hit per pellet - three total - never more, never multiplied.
    expect(hits).toBe(3);
  });
});
