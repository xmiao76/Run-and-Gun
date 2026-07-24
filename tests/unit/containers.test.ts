import { describe, expect, it } from 'vitest';
import {
  createContainerStates,
  damageContainer,
  solidContainerRects
} from '../../src/simulation/containers';

const defs = [
  { id: 'c1', x: 100, y: 456, width: 24, height: 24, health: 3, scoreValue: 50 },
  { id: 'c2', x: 200, y: 456, width: 24, height: 24, health: 1, scoreValue: 50 }
];

describe('destructible containers (F5)', () => {
  it('act as solid until destroyed, then become passable', () => {
    const containers = createContainerStates(defs);
    expect(solidContainerRects(containers)).toHaveLength(2);

    containers[0] = damageContainer(containers[0], 1);
    expect(containers[0].destroyed).toBe(false);
    expect(containers[0].health).toBe(2);
    expect(solidContainerRects(containers)).toHaveLength(2);

    containers[0] = damageContainer(containers[0], 2);
    expect(containers[0].destroyed).toBe(true);
    expect(solidContainerRects(containers)).toHaveLength(1);

    // Further damage is a no-op on a destroyed container.
    expect(damageContainer(containers[0], 5).health).toBe(0);
  });

  it('destroyed containers never re-solidify', () => {
    const containers = createContainerStates(defs);
    const destroyed = damageContainer(containers[1], 99);
    expect(destroyed.destroyed).toBe(true);
    expect(solidContainerRects([destroyed])).toHaveLength(0);
  });
});
