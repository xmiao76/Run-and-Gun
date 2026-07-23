import { describe, expect, it } from 'vitest';
import { closedDoorRects, createDoorState, stepDoor } from '../../src/simulation/doors';
import { type DoorDef } from '../../src/levels/levelSchema';

const DOOR: DoorDef = {
  id: 'd1',
  rect: { x: 500, y: 384, width: 16, height: 96 },
  openTrigger: { x: 420, y: 440, width: 40, height: 40 }
};

describe('doors', () => {
  it('start closed and act as solid', () => {
    const d = createDoorState(DOOR);
    expect(d.open).toBe(false);
    expect(closedDoorRects([d])).toHaveLength(1);
  });

  it('open while the player overlaps the trigger, closing otherwise', () => {
    let d = createDoorState(DOOR);
    d = stepDoor(d, 430, 450, 22, 32); // inside trigger
    expect(d.open).toBe(true);
    expect(closedDoorRects([d])).toHaveLength(0);

    d = stepDoor(d, 100, 450, 22, 32); // away from trigger
    expect(d.open).toBe(false);
    expect(closedDoorRects([d])).toHaveLength(1);
  });
});
