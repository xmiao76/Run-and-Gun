import { describe, expect, it } from 'vitest';
import { getBossDef } from '../../src/balance/bosses';
import {
  activateBoss,
  bossHasSubcomponents,
  createBossState,
  damageBoss,
  phaseSubcomponentCount,
  stepBoss
} from '../../src/simulation/bosses';

const DT = 1 / 60;
const PX = 2600;
const PY = 440;

describe('Reactor Warden phase gating', () => {
  it('exposes two phases of destructible subcomponents', () => {
    const def = getBossDef('reactorWarden');
    expect(bossHasSubcomponents(def)).toBe(true);
    expect(def.phaseCount).toBe(2);
    expect(phaseSubcomponentCount(def, 0)).toBe(2);
    expect(phaseSubcomponentCount(def, 1)).toBe(2);
  });

  it('stays immune while the current phase subcomponents are alive', () => {
    let b = activateBoss(createBossState('reactorWarden'));
    for (let i = 0; i < 300; i++) {
      b = stepBoss(b, PX, PY, DT, false).boss; // subcomponents NOT cleared
    }
    expect(b.vulnerable).toBe(false);
    expect(damageBoss(b, 99).applied).toBe(false);
  });

  it('becomes vulnerable after the phase subcomponents are cleared, then advances phase', () => {
    let b = activateBoss(createBossState('reactorWarden'));
    let reachedVuln = false;
    for (let i = 0; i < 600 && !reachedVuln; i++) {
      const r = stepBoss(b, PX, PY, DT, true);
      b = r.boss;
      if (b.vulnerable) {
        reachedVuln = true;
      }
    }
    expect(reachedVuln).toBe(true);
    expect(damageBoss(b, 1).applied).toBe(true);
    for (let i = 0; i < 300 && b.phase === 0; i++) {
      b = stepBoss(b, PX, PY, DT, true).boss;
    }
    expect(b.phase).toBe(1);
  });

  it('cannot deadlock: no state persists beyond a few seconds across phases', () => {
    let b = activateBoss(createBossState('reactorWarden'));
    let maxTimer = 0;
    for (let i = 0; i < 3000; i++) {
      const r = stepBoss(b, PX + (i % 100), PY, DT, true);
      b = r.boss;
      maxTimer = Math.max(maxTimer, b.stateTimer);
    }
    expect(maxTimer).toBeLessThan(4);
  });

  it('dies exactly once after the final phase core is depleted', () => {
    const def = getBossDef('reactorWarden');
    let b = activateBoss(createBossState('reactorWarden'));
    let applied = 0;
    for (let i = 0; i < 40000 && b.state !== 'dead'; i++) {
      const r = stepBoss(b, PX, PY, DT, true);
      b = r.boss;
      if (b.vulnerable) {
        const dmg = damageBoss(b, 1);
        if (dmg.applied) {
          applied += 1;
          b = dmg.boss;
        }
      }
    }
    expect(b.state).toBe('dead');
    expect(applied).toBe(def.health);
  });
});
