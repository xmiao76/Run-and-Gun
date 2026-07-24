import { describe, expect, it } from 'vitest';
import { MAX_PARTICLES, spawnParticles, stepParticles } from '../../src/simulation/particles';

const DT = 1 / 60;

describe('particle spawning (deterministic)', () => {
  it('identical spawn calls produce identical particles', () => {
    const a = spawnParticles([], [{ kind: 'burst', x: 10, y: 20 }], 1);
    const b = spawnParticles([], [{ kind: 'burst', x: 10, y: 20 }], 1);
    expect(a.particles).toEqual(b.particles);
    expect(a.nextId).toBe(b.nextId);
  });

  it('spawns 4 sparks, 8 burst particles, 2 muzzle puffs, 1 beacon', () => {
    expect(spawnParticles([], [{ kind: 'spark', x: 0, y: 0 }], 1).particles).toHaveLength(4);
    expect(spawnParticles([], [{ kind: 'burst', x: 0, y: 0 }], 1).particles).toHaveLength(8);
    expect(spawnParticles([], [{ kind: 'muzzle', x: 0, y: 0, angleDeg: -90 }], 1).particles).toHaveLength(2);
    expect(spawnParticles([], [{ kind: 'beacon', x: 0, y: 0 }], 1).particles).toHaveLength(1);
  });

  it('muzzle puffs travel along the aim angle and the beacon is static', () => {
    const muzzle = spawnParticles([], [{ kind: 'muzzle', x: 0, y: 0, angleDeg: -90 }], 1).particles;
    for (const p of muzzle) {
      expect(p.vy).toBeLessThan(0); // upward
    }
    const beacon = spawnParticles([], [{ kind: 'beacon', x: 5, y: 6 }], 1).particles[0];
    expect(beacon.vx).toBe(0);
    expect(beacon.vy).toBe(0);
    expect(beacon.ttl).toBeCloseTo(1.2);
  });
});

describe('particle lifetime and cap', () => {
  it('expires exactly when ttl runs out', () => {
    let particles = spawnParticles([], [{ kind: 'spark', x: 0, y: 0 }], 1).particles;
    // Spark ttl is 0.25s = 15 steps; alive at 14, gone at 16.
    for (let i = 0; i < 14; i++) {
      particles = stepParticles(particles, DT);
    }
    expect(particles.length).toBe(4);
    for (let i = 0; i < 2; i++) {
      particles = stepParticles(particles, DT);
    }
    expect(particles.length).toBe(0);
  });

  it('moves particles and applies gravity only to bursts', () => {
    const spark = spawnParticles([], [{ kind: 'spark', x: 0, y: 0 }], 1).particles[0];
    const burst = spawnParticles([], [{ kind: 'burst', x: 0, y: 0 }], 1).particles[0];
    const steppedSpark = stepParticles([spark], DT)[0];
    const steppedBurst = stepParticles([burst], DT)[0];
    expect(steppedSpark.vy).toBe(spark.vy);
    expect(steppedBurst.vy).toBeGreaterThan(burst.vy);
    expect(steppedSpark.x).toBeCloseTo(spark.x + spark.vx * DT);
  });

  it('caps at MAX_PARTICLES, culling the oldest first', () => {
    const particles = spawnParticles([], [{ kind: 'beacon', x: 0, y: 0 }], 1).particles;
    const firstId = particles[0].id;
    const many = Array.from({ length: 30 }, () => ({ kind: 'burst' as const, x: 0, y: 0 }));
    const r = spawnParticles(particles, many, 2);
    expect(r.particles.length).toBeLessThanOrEqual(MAX_PARTICLES);
    expect(r.particles.some((p) => p.id === firstId)).toBe(false);
  });
});
