import { type ContainerDef, type Rect } from '../levels/levelSchema';

/**
 * Destructible containers (crates). Solid terrain until destroyed by player
 * fire, after which they are passable - so they can never permanently trap
 * the player (F5). Pure and unit-testable.
 */

export interface ContainerState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  health: number;
  scoreValue: number;
  destroyed: boolean;
}

export function createContainerState(def: ContainerDef): ContainerState {
  return { ...def, destroyed: false };
}

export function createContainerStates(defs: readonly ContainerDef[]): ContainerState[] {
  return defs.map(createContainerState);
}

/** Apply one hit; the container is destroyed at zero health. */
export function damageContainer(container: ContainerState, amount: number): ContainerState {
  if (container.destroyed) {
    return container;
  }
  const health = container.health - amount;
  if (health <= 0) {
    return { ...container, health: 0, destroyed: true };
  }
  return { ...container, health };
}

/** Intact containers act as solid terrain; destroyed ones are passable. */
export function solidContainerRects(containers: readonly ContainerState[]): Rect[] {
  return containers
    .filter((c) => !c.destroyed)
    .map((c) => ({ x: c.x, y: c.y, width: c.width, height: c.height }));
}
