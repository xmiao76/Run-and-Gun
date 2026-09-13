import { describe, expect, it } from 'vitest';

import { bossFrame, BOSS_FRAME_STEPS } from '../../src/art/bossArt';
import { enemyFrame, ENEMY_FRAME_STEPS } from '../../src/art/enemyArt';
import { selectPlayerPose } from '../../src/art/playerPose';
import { SPRITE_SPECS } from '../../src/art/sprites';

/**
 * TASK-035: animation is a function of simulation state and simulation step
 * only. These pin the mapping so a wall-time clock can never sneak back in.
 */

describe('enemyFrame', () => {
  it('alternates the idle cycle on simulation steps', () => {
    const runner = { kind: 'runner' as const, state: 'approach' as const, telegraphing: false };
    expect(enemyFrame(runner, 0)).toBe('art/enemy-runner');
    expect(enemyFrame(runner, ENEMY_FRAME_STEPS)).toBe('art/enemy-runner-b');
    expect(enemyFrame(runner, ENEMY_FRAME_STEPS * 2)).toBe('art/enemy-runner');
  });

  it('uses the attack frame through the whole wind-up and the shot itself', () => {
    const sentry = { kind: 'sentry' as const, state: 'telegraph' as const, telegraphing: true };
    expect(enemyFrame(sentry, 0)).toBe('art/enemy-sentry-fire');
    expect(enemyFrame({ ...sentry, state: 'fire' }, 0)).toBe('art/enemy-sentry-fire');
  });

  it('goes back to the idle cycle the step the attack ends', () => {
    const sentry = { kind: 'sentry' as const, state: 'idle' as const, telegraphing: false };
    expect(enemyFrame(sentry, 0)).toBe('art/enemy-sentry');
  });

  it('gives every archetype three distinct frames', () => {
    for (const kind of ['runner', 'sentry', 'grenadier', 'drone'] as const) {
      const a = enemyFrame({ kind, state: 'idle', telegraphing: false }, 0);
      const b = enemyFrame({ kind, state: 'idle', telegraphing: false }, ENEMY_FRAME_STEPS);
      const fire = enemyFrame({ kind, state: 'telegraph', telegraphing: true }, 0);
      expect(new Set([a, b, fire]).size, `${kind} frames are not distinct`).toBe(3);
    }
  });
});

describe('bossFrame', () => {
  it('alternates the idle on simulation steps for both bosses', () => {
    expect(bossFrame('siegeWalker', 0)).toBe('art/boss-siege-walker');
    expect(bossFrame('siegeWalker', BOSS_FRAME_STEPS)).toBe('art/boss-siege-walker-b');
    expect(bossFrame('reactorWarden', 0)).toBe('art/boss-reactor-warden');
    expect(bossFrame('reactorWarden', BOSS_FRAME_STEPS)).toBe('art/boss-reactor-warden-b');
  });
});

describe('boss idle frames actually differ', () => {
  it('gives every boss two visibly different frames', () => {
    // `bossFrame` returning two different KEYS proves nothing if the two
    // sprites are identical - which is exactly what happens when a derived
    // frame pulses the wrong row range. Compare the pixels, not the names.
    for (const id of ['siegeWalker', 'reactorWarden', 'ashSentinel'] as const) {
      const a = SPRITE_SPECS[bossFrame(id, 0) as keyof typeof SPRITE_SPECS];
      const b = SPRITE_SPECS[bossFrame(id, BOSS_FRAME_STEPS) as keyof typeof SPRITE_SPECS];
      expect(a, id).toBeDefined();
      expect(b, id).toBeDefined();
      expect(a.rows.join('|'), `${id} frames are identical`).not.toBe(b.rows.join('|'));
    }
  });
});

describe('player run cycle', () => {
  const running = { dying: false, hurt: false, crouching: false, grounded: true, speedX: 200, aimUp: false };

  it('walks all four frames in order', () => {
    const poses = [0, 1, 2, 3].map((runFrame) => selectPlayerPose({ ...running, runFrame }));
    expect(poses).toEqual(['run-a', 'run-c', 'run-b', 'run-d']);
  });

  it('loops after the fourth frame', () => {
    expect(selectPlayerPose({ ...running, runFrame: 4 })).toBe('run-a');
    expect(selectPlayerPose({ ...running, runFrame: 5 })).toBe('run-c');
  });

  it('still lets higher-priority states override the run cycle', () => {
    expect(selectPlayerPose({ ...running, runFrame: 1, crouching: true })).toBe('crouch');
    expect(selectPlayerPose({ ...running, runFrame: 1, grounded: false })).toBe('jump');
  });
});
