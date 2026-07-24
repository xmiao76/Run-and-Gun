import { describe, expect, it } from 'vitest';
import { createEnemyState, stepEnemy, telegraphAim } from '../../src/simulation/enemies';
import { getEnemyDef } from '../../src/balance/enemies';

const DT = 1 / 60;

function firedIntent(kind: 'runner' | 'sentry' | 'drone' | 'grenadier', ex: number, ey: number, px: number, py: number) {
  let e = createEnemyState('t1', kind, ex, ey);
  for (let i = 0; i < 200; i++) {
    const r = stepEnemy(e, px, py, DT, true);
    e = r.enemy;
    if (r.fireIntent) {
      return r.fireIntent;
    }
  }
  return null;
}

describe('telegraphAim matches the actual fire intent', () => {
  it('runner aims horizontally with its facing', () => {
    const e = createEnemyState('r1', 'runner', 300, 450);
    expect(telegraphAim(e, 500, 450).angleDeg).toBe(0);
    expect(telegraphAim(e, 100, 450).angleDeg).toBe(180);
  });

  it('sentry aims at the player (atan2)', () => {
    const e = createEnemyState('s1', 'sentry', 500, 450);
    const ta = telegraphAim(e, 500, 350);
    expect(ta.angleDeg).toBeCloseTo(-90);
  });

  it('drone aims steeply downward', () => {
    const e = createEnemyState('d1', 'drone', 500, 300);
    const ta = telegraphAim(e, 520, 480);
    expect(ta.angleDeg).toBeGreaterThan(45);
    expect(ta.angleDeg).toBeLessThan(90);
  });

  it('grenadier aims up-forward with its lob', () => {
    const e = createEnemyState('g1', 'grenadier', 500, 450);
    const ta = telegraphAim(e, 700, 450);
    expect(ta.angleDeg).toBeLessThan(0);
    expect(ta.angleDeg).toBeGreaterThan(-90);
  });

  it('the muzzle point equals the fire intent origin for every kind', () => {
    for (const kind of ['runner', 'sentry', 'drone', 'grenadier'] as const) {
      const e = createEnemyState('t', kind, 500, kind === 'drone' ? 300 : 450);
      const ta = telegraphAim(e, 620, 460);
      const def = getEnemyDef(kind);
      expect(ta.muzzleX).toBe(e.x + e.facing * (def.width / 2) || e.x + def.width / 2);
      expect(ta.muzzleY).toBe(e.y + def.height / 2);
    }
  });

  it('the aim direction matches a real fired shot for the runner', () => {
    const intent = firedIntent('runner', 300, 450, 432, 450);
    expect(intent).not.toBeNull();
    const ta = telegraphAim(createEnemyState('r1', 'runner', 300, 450), 432, 450);
    const intentAngle = (Math.atan2(intent!.vy, intent!.vx) * 180) / Math.PI;
    expect(ta.angleDeg).toBeCloseTo(intentAngle, 1);
  });
});
