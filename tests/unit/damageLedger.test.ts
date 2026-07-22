import { describe, expect, it } from 'vitest';
import { clearLedger, createDamageLedger, hitCount, recordHit } from '../../src/simulation/damageLedger';

describe('per-step duplicate-hit ledger', () => {
  it('records a hit once and blocks duplicates within the same step', () => {
    const ledger = createDamageLedger();
    expect(recordHit(ledger, 'attack1', 'enemy1')).toBe(true);
    expect(recordHit(ledger, 'attack1', 'enemy1')).toBe(false);
    expect(recordHit(ledger, 'attack1', 'enemy1')).toBe(false);
    expect(hitCount(ledger)).toBe(1);
  });

  it('treats different attacks and different targets as distinct', () => {
    const ledger = createDamageLedger();
    expect(recordHit(ledger, 'a1', 'e1')).toBe(true);
    expect(recordHit(ledger, 'a2', 'e1')).toBe(true);
    expect(recordHit(ledger, 'a1', 'e2')).toBe(true);
    expect(hitCount(ledger)).toBe(3);
  });

  it('clears between steps so the same attack can hit again next step', () => {
    const ledger = createDamageLedger();
    expect(recordHit(ledger, 'a1', 'e1')).toBe(true);
    clearLedger(ledger);
    expect(hitCount(ledger)).toBe(0);
    expect(recordHit(ledger, 'a1', 'e1')).toBe(true);
  });
});
