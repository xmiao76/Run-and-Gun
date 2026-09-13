import { describe, expect, it } from 'vitest';

import {
  bridgeCarries,
  bridgeGaps,
  createBridgeStates,
  isBridgeSolid,
  solidBridgeRects,
  stepBridge,
  type BridgeState
} from '../../src/simulation/bridges';
import { validateLevel } from '../../src/levels/levelLoader';
import { LEVELS } from '../../src/levels/levels';

const DT = 1 / 60;

function bridge(over: Partial<BridgeState> = {}): BridgeState {
  return {
    id: 'b1',
    x: 500,
    y: 480,
    width: 120,
    height: 12,
    triggerDelay: 0.2,
    collapseDelay: 1,
    stage: 'intact',
    timer: 0,
    ...over
  };
}

/** Run a bridge for `seconds` with a constant load and report the end state. */
function run(state: BridgeState, seconds: number, loaded: boolean): BridgeState {
  let b = state;
  for (let i = 0; i < Math.round(seconds / DT); i++) {
    b = stepBridge(b, DT, loaded);
  }
  return b;
}

describe('collapsing bridge', () => {
  it('stays intact and solid while nobody stands on it', () => {
    const b = run(bridge(), 10, false);
    expect(b.stage).toBe('intact');
    expect(isBridgeSolid(b)).toBe(true);
  });

  it('commits to failing after the trigger delay under load', () => {
    const b = run(bridge(), 0.3, true);
    expect(b.stage).toBe('failing');
  });

  it('is still solid while it fails - that is the crossing window', () => {
    const failing = run(bridge(), 0.3, true);
    expect(isBridgeSolid(failing)).toBe(true);
    // Halfway through the collapse window it must still carry the player.
    const halfway = run(failing, 0.4, true);
    expect(halfway.stage).toBe('failing');
    expect(isBridgeSolid(halfway)).toBe(true);
  });

  it('is gone once the collapse window elapses, and stays gone', () => {
    const b = run(bridge(), 0.3 + 1.1, true);
    expect(b.stage).toBe('gone');
    expect(isBridgeSolid(b)).toBe(false);
    expect(run(b, 5, false).stage).toBe('gone');
  });

  it('keeps failing after the player steps off, because it is committed', () => {
    // The set piece only works if crossing is a decision. Triggering it and
    // retreating must NOT reset it, or a player could poke it safely forever.
    const triggered = run(bridge(), 0.3, true);
    expect(triggered.stage).toBe('failing');
    const abandoned = run(triggered, 1.1, false);
    expect(abandoned.stage).toBe('gone');
  });

  it('un-stresses when weight comes off before it commits', () => {
    // Before the trigger delay elapses, stepping off is a genuine reprieve.
    const partly = run(bridge(), 0.1, true);
    expect(partly.stage).toBe('intact');
    expect(partly.timer).toBeGreaterThan(0);
    const relieved = stepBridge(partly, DT, false);
    expect(relieved.stage).toBe('intact');
    expect(relieved.timer).toBe(0);
  });

  it('gives the player the full authored window to get across', () => {
    // The window is what makes it fair: at the player's run speed the span
    // must be crossable once triggered.
    const b = bridge({ triggerDelay: 0, collapseDelay: 1 });
    const triggered = stepBridge(b, DT, true);
    expect(triggered.stage).toBe('failing');
    const almost = run(triggered, 0.9, true);
    expect(isBridgeSolid(almost)).toBe(true);
  });

  it('is immutable: stepping never edits the state handed to it', () => {
    const b = bridge();
    stepBridge(b, DT, true);
    expect(b.stage).toBe('intact');
    expect(b.timer).toBe(0);
  });
});

describe('bridge geometry', () => {
  it('contributes solid terrain only while it stands', () => {
    const states = [bridge({ id: 'a' }), bridge({ id: 'b', stage: 'gone' })];
    const rects = solidBridgeRects(states);
    expect(rects).toHaveLength(1);
    expect(rects[0].x).toBe(500);
  });

  it('reports every span as a gap to a route planner, whatever its stage', () => {
    // Deliberate: the pilot builds geometry once at level start, so an intact
    // bridge must still be treated as a possible hole.
    const gaps = bridgeGaps([bridge({ id: 'a' }), bridge({ id: 'b', x: 900, stage: 'gone' })]);
    expect(gaps).toEqual([
      { x0: 500, x1: 620 },
      { x0: 900, x1: 1020 }
    ]);
  });

  it('detects the player standing on the span', () => {
    const b = bridge();
    expect(bridgeCarries(b, 520, 20, 480)).toBe(true);
    // Beside it.
    expect(bridgeCarries(b, 300, 20, 480)).toBe(false);
    // Above it, mid-jump.
    expect(bridgeCarries(b, 520, 20, 400)).toBe(false);
  });

  it('never reports a collapsed span as carrying anyone', () => {
    expect(bridgeCarries(bridge({ stage: 'gone' }), 520, 20, 480)).toBe(false);
  });
});

describe('bridge level data', () => {
  it('creates states from definitions with the authored timings', () => {
    const states = createBridgeStates([
      { id: 'x', x: 10, y: 20, width: 100, height: 12, triggerDelay: 0.1, collapseDelay: 2 }
    ]);
    expect(states[0].stage).toBe('intact');
    expect(states[0].collapseDelay).toBe(2);
  });

  it('rejects a malformed bridge', () => {
    const level = { ...LEVELS[0] };
    const issues = validateLevel({
      ...level,
      bridges: [
        // zero width, negative delay, and a collapse window of zero - which
        // would drop the player the instant they stepped on.
        { id: '', x: 10, y: 20, width: 0, height: 12, triggerDelay: -1, collapseDelay: 0 }
      ]
    });
    const paths = issues.map((i) => i.path);
    expect(paths).toContain('level.bridges[0].id');
    expect(paths).toContain('level.bridges[0]');
    expect(paths).toContain('level.bridges[0].triggerDelay');
    expect(paths).toContain('level.bridges[0].collapseDelay');
  });

  it('accepts a well-formed bridge', () => {
    const level = { ...LEVELS[0] };
    const issues = validateLevel({
      ...level,
      bridges: [{ id: 'ok', x: 200, y: 480, width: 120, height: 12, triggerDelay: 0.2, collapseDelay: 1.2 }]
    });
    expect(issues.filter((i) => i.path.startsWith('level.bridges'))).toEqual([]);
  });
});
