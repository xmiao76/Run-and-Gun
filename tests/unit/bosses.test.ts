import { describe, expect, it } from 'vitest';
import { getBossDef } from '../../src/balance/bosses';
import { activateBoss, createBossState, damageBoss, SHOCKWAVE_RADIUS, shockwaveHits, stepBoss } from '../../src/simulation/bosses';

const DT = 1 / 60;
const PX = 2600;
const PY = 460;

function stepN(boss: ReturnType<typeof createBossState>, n: number) {
  let b = boss;
  for (let i = 0; i < n; i++) {
    b = stepBoss(b, PX, PY, DT).boss;
  }
  return b;
}

describe('Siege Walker phase transitions', () => {
  it('is inactive until activated, then enters and idles', () => {
    const b = createBossState('siegeWalker');
    expect(b.active).toBe(false);
    const active = activateBoss(b);
    expect(active.state).toBe('enter');
    const afterEnter = stepN(active, Math.ceil(0.6 / DT) + 1);
    expect(afterEnter.state).toBe('idle');
  });

  it('telegraphs before the first attack and the stomp yields a shockwave', () => {
    const b = stepN(activateBoss(createBossState('siegeWalker')), Math.ceil(0.6 / DT) + Math.ceil(0.3 / DT) + 1);
    expect(b.state).toBe('telegraph');
    expect(b.telegraphing).toBe(true);
    const def = getBossDef('siegeWalker');
    const result = stepBoss(b, PX, PY, Math.ceil(def.telegraphDuration / DT) * DT);
    expect(result.boss.state).toBe('attack');
    expect(result.action.kind).toBe('shockwave');
  });

  it('only takes damage during the vulnerable window', () => {
    let b = activateBoss(createBossState('siegeWalker'));
    const immune = damageBoss(b, 5);
    expect(immune.applied).toBe(false);

    // Drive three full attack cycles to reach the first vulnerable window.
    let vulnerableReached = false;
    for (let i = 0; i < 4000 && !vulnerableReached; i++) {
      const r = stepBoss(b, PX, PY, DT);
      b = r.boss;
      if (b.vulnerable) {
        vulnerableReached = true;
      }
    }
    expect(vulnerableReached).toBe(true);
    const hit = damageBoss(b, 3);
    expect(hit.applied).toBe(true);
    expect(hit.boss.health).toBe(getBossDef('siegeWalker').health - 3);
  });

  it('cannot deadlock: no state persists beyond a few seconds over a long run', () => {
    let b = activateBoss(createBossState('siegeWalker'));
    let maxTimer = 0;
    for (let i = 0; i < 2000; i++) {
      b = stepBoss(b, PX + (i % 200), PY, DT).boss;
      maxTimer = Math.max(maxTimer, b.stateTimer);
    }
    expect(maxTimer).toBeLessThan(4);
  });

  it('reaches dead exactly once when damaged to zero while vulnerable', () => {
    let b = activateBoss(createBossState('siegeWalker'));
    const def = getBossDef('siegeWalker');
    let applied = 0;
    for (let i = 0; i < 20000 && b.state !== 'dead'; i++) {
      const r = stepBoss(b, PX, PY, DT);
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

describe('shockwaveHits (honest stomp damage)', () => {
  it('hits a grounded player inside the radius', () => {
    expect(shockwaveHits(1000, 1000 + SHOCKWAVE_RADIUS - 1, true)).toBe(true);
    expect(shockwaveHits(1000, 1000 - SHOCKWAVE_RADIUS + 1, true)).toBe(true);
  });

  it('misses a grounded player outside the radius and exactly at the edge', () => {
    expect(shockwaveHits(1000, 1000 + SHOCKWAVE_RADIUS, true)).toBe(false);
    expect(shockwaveHits(1000, 1000 + SHOCKWAVE_RADIUS + 10, true)).toBe(false);
  });

  it('never hits an airborne player (jumping dodges the stomp)', () => {
    expect(shockwaveHits(1000, 1000, false)).toBe(false);
    expect(shockwaveHits(1000, 1000 + 50, false)).toBe(false);
  });
});
