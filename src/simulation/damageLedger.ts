/**
 * Per-step duplicate-hit protection.
 *
 * Damage events require source ownership and a per-step identifier so a single
 * attack cannot apply damage more than once to the same target in one
 * simulation step. The
 * ledger records (attackId, targetId) pairs and is cleared at the end of each
 * step; recordHit returns true only the first time a pair is seen.
 */

export interface DamageLedger {
  seen: Set<string>;
}

export function createDamageLedger(): DamageLedger {
  return { seen: new Set() };
}

function key(attackId: string, targetId: string): string {
  return attackId + '@' + targetId;
}

/**
 * Records a hit from `attackId` on `targetId`. Returns true the first time this
 * pair is seen in the current step (the hit should apply), and false on every
 * subsequent duplicate within the same step (the hit is suppressed).
 */
export function recordHit(ledger: DamageLedger, attackId: string, targetId: string): boolean {
  const k = key(attackId, targetId);
  if (ledger.seen.has(k)) {
    return false;
  }
  ledger.seen.add(k);
  return true;
}

/** Clears all recorded pairs; call once at the end of each simulation step. */
export function clearLedger(ledger: DamageLedger): void {
  ledger.seen.clear();
}

export function hitCount(ledger: DamageLedger): number {
  return ledger.seen.size;
}
