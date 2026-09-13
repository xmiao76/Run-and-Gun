/**
 * Cosmetic particle effects (pure, deterministic).
 *
 * Short-lived visual juice: muzzle puffs, hit sparks, death bursts, and a
 * respawn beacon. All velocities come from fixed tables (no randomness) so
 * the simulation stays reproducible and the soak test stays heap-flat. The
 * scene owns rendering; this module owns lifetimes and movement.
 */

export type ParticleKind = 'muzzle' | 'spark' | 'burst' | 'beacon' | 'explosion';

export interface Particle {
  id: number;
  kind: ParticleKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Remaining lifetime (s). */
  ttl: number;
  /** Initial lifetime (s), for fade rendering. */
  maxTtl: number;
  size: number;
}

export interface ParticleSpawn {
  kind: ParticleKind;
  x: number;
  y: number;
  /** Travel direction for muzzle puffs (degrees, 0 = right). */
  angleDeg?: number;
}

/** Hard cap; oldest particles are culled first (same style as projectile pools). */
export const MAX_PARTICLES = 128;

const SPARK_VECTORS: readonly (readonly [number, number])[] = [
  [-140, -140],
  [140, -140],
  [-140, 140],
  [140, 140]
];

const BURST_SPEED = 180;
const BURST_GRAVITY = 400;
const MUZZLE_SPEED = 120;
/**
 * A death explosion is a burst with a shape: two rings at different speeds and
 * lifetimes, so it blooms outward and trails instead of expanding as one flat
 * ribbon of squares. Still fixed tables, still no randomness.
 */
const EXPLOSION_INNER_SPEED = 90;
const EXPLOSION_OUTER_SPEED = 260;

function fan(count: number, speed: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    out.push([Math.cos(angle) * speed, Math.sin(angle) * speed]);
  }
  return out;
}

export function spawnParticles(
  existing: readonly Particle[],
  spawns: readonly ParticleSpawn[],
  nextId: number
): { particles: Particle[]; nextId: number } {
  const created: Particle[] = [];
  let id = nextId;
  const push = (kind: ParticleKind, x: number, y: number, vx: number, vy: number, ttl: number, size: number): void => {
    created.push({ id: id++, kind, x, y, vx, vy, ttl, maxTtl: ttl, size });
  };

  for (const s of spawns) {
    if (s.kind === 'muzzle') {
      const base = ((s.angleDeg ?? 0) * Math.PI) / 180;
      for (const offset of [-0.26, 0.26]) {
        push('muzzle', s.x, s.y, Math.cos(base + offset) * MUZZLE_SPEED, Math.sin(base + offset) * MUZZLE_SPEED, 0.08, 3);
      }
    } else if (s.kind === 'spark') {
      for (const [vx, vy] of SPARK_VECTORS) {
        push('spark', s.x, s.y, vx, vy, 0.25, 3);
      }
    } else if (s.kind === 'burst') {
      for (const [vx, vy] of fan(8, BURST_SPEED)) {
        push('burst', s.x, s.y, vx, vy, 0.5, 4);
      }
    } else if (s.kind === 'explosion') {
      // Outer ring: fast, short-lived, small - the blast front.
      for (const [vx, vy] of fan(10, EXPLOSION_OUTER_SPEED)) {
        push('explosion', s.x, s.y, vx, vy, 0.32, 3);
      }
      // Inner ring: slow, long-lived, fat - the fireball that lingers, offset
      // half a segment so the two rings do not sit on the same spokes.
      for (const [vx, vy] of fan(6, EXPLOSION_INNER_SPEED)) {
        push('explosion', s.x, s.y, vy, vx, 0.6, 6);
      }
      // A bright motionless core for the first instant of the blast.
      push('explosion', s.x, s.y, 0, 0, 0.18, 10);
    } else {
      push('beacon', s.x, s.y, 0, 0, 1.2, 6);
    }
  }

  const particles = [...existing, ...created].slice(-MAX_PARTICLES);
  return { particles, nextId: id };
}

/** Advance particles; expired ones are removed. Bursts fall with light gravity. */
export function stepParticles(particles: readonly Particle[], dt: number): Particle[] {
  const out: Particle[] = [];
  for (const p of particles) {
    const ttl = p.ttl - dt;
    if (ttl <= 0) {
      continue;
    }
    const vy = p.kind === 'burst' || p.kind === 'explosion' ? p.vy + BURST_GRAVITY * dt : p.vy;
    out.push({ ...p, x: p.x + p.vx * dt, y: p.y + vy * dt, vy, ttl });
  }
  return out;
}
