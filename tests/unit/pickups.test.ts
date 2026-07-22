import { describe, expect, it } from 'vitest';
import { collectPickups, createPickup } from '../../src/simulation/pickups';

describe('weapon pickup collection', () => {
  it('collects an overlapping pickup and reports the weapon to switch to', () => {
    const pickups = [createPickup('p1', 150, 456, 'scatter')];
    const result = collectPickups(pickups, 152, 452, 22, 32);
    expect(result.collected).toHaveLength(1);
    expect(result.collected[0].weapon).toBe('scatter');
    expect(result.pickups[0].collected).toBe(true);
  });

  it('does not collect a pickup the player does not overlap', () => {
    const pickups = [createPickup('p1', 300, 456, 'rapid')];
    const result = collectPickups(pickups, 100, 452, 22, 32);
    expect(result.collected).toHaveLength(0);
    expect(result.pickups[0].collected).toBe(false);
  });

  it('never re-collects an already collected pickup', () => {
    const pickups = [createPickup('p1', 150, 456, 'scatter')];
    const first = collectPickups(pickups, 152, 452, 22, 32);
    const second = collectPickups(first.pickups, 152, 452, 22, 32);
    expect(second.collected).toHaveLength(0);
  });
});
