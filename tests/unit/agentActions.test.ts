import { describe, expect, test } from 'vitest';

import {
  actCommands,
  HOLD_COMMANDS,
  RELEASE_COMMANDS,
  TAP_COMMANDS
} from '../../scripts/lib/bridge.mjs';

/**
 * The action vocabulary exists in two places and cannot be merged: the drivers
 * need it as `.mjs` (the repo has no @types/node, so `scripts/` stays JS), and
 * the Playwright helper needs it as TypeScript inside the test build. This test
 * is the seam that keeps them honest - it pins the mapping, so a rename on
 * either side has to be made on both.
 */

describe('agent action vocabulary', () => {
  test('every hold action maps to its bridge command', () => {
    expect(HOLD_COMMANDS).toEqual({
      left: 'holdLeft',
      right: 'holdRight',
      aimUp: 'holdAimUp',
      aimDown: 'holdAimDown',
      crouch: 'holdCrouch',
      drop: 'holdDrop'
    });
  });

  test('every hold action has a matching release', () => {
    const releases: Record<string, string> = RELEASE_COMMANDS;
    for (const action of Object.keys(HOLD_COMMANDS)) {
      expect(releases[action]).toBeDefined();
    }
    // Taps release too: a jump or fire press has to be let go of.
    for (const action of Object.keys(TAP_COMMANDS)) {
      expect(releases[action]).toBeDefined();
    }
  });

  test('taps are the edge-triggered actions', () => {
    expect(TAP_COMMANDS).toEqual({ jump: 'jumpPress', fire: 'firePress' });
  });
});

describe('actCommands', () => {
  test('orders holds, then releases, then taps', () => {
    const commands = actCommands({ tap: ['fire'], release: ['left'], hold: ['right'] });
    expect(commands).toEqual(['holdRight', 'releaseLeft', 'firePress']);
  });

  test('a hold and a release of the same action nets to released', () => {
    expect(actCommands({ hold: ['left'], release: ['left'] })).toEqual(['holdLeft', 'releaseLeft']);
  });

  test('an empty spec asks for nothing', () => {
    expect(actCommands({})).toEqual([]);
    expect(actCommands()).toEqual([]);
  });

  test('an unknown action is rejected with a 400, not silently dropped', () => {
    expect(() => actCommands({ hold: ['sideways'] })).toThrow(/unknown hold action: sideways/);
    expect(() => actCommands({ release: ['sideways'] })).toThrow(/unknown release action/);
    expect(() => actCommands({ tap: ['left'] })).toThrow(/unknown tap action: left/);

    // The status rides on the error so the HTTP server can surface it unchanged.
    try {
      actCommands({ hold: ['nope'] });
      throw new Error('expected actCommands to reject an unknown action');
    } catch (e) {
      expect((e as { status?: number }).status).toBe(400);
    }
  });

  test('crouch and drop are part of the vocabulary', () => {
    expect(actCommands({ hold: ['crouch', 'drop'] })).toEqual(['holdCrouch', 'holdDrop']);
  });
});
