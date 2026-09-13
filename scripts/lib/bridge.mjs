/**
 * The agent-facing action vocabulary and the calls that drive it.
 *
 * Single source of truth for the action -> bridge-command mapping. The HTTP
 * agent server used to carry its own copy (its comment admitted it mirrored
 * `tests/e2e/helpers/gameDriver.ts`), which is the one real duplication in the
 * driver layer. The typed Playwright helper keeps a separate copy because it is
 * TypeScript inside the test build and cannot import a `.mjs` module;
 * `tests/unit/agentActions.test.ts` asserts the two agree.
 */

export const HOLD_COMMANDS = {
  left: 'holdLeft',
  right: 'holdRight',
  aimUp: 'holdAimUp',
  aimDown: 'holdAimDown',
  crouch: 'holdCrouch',
  drop: 'holdDrop'
};

export const RELEASE_COMMANDS = {
  left: 'releaseLeft',
  right: 'releaseRight',
  aimUp: 'releaseAimUp',
  aimDown: 'releaseAimDown',
  crouch: 'releaseCrouch',
  drop: 'releaseDrop',
  jump: 'jumpRelease',
  fire: 'fireRelease'
};

export const TAP_COMMANDS = { jump: 'jumpPress', fire: 'firePress' };

/** Error carrying a 400 status so HTTP callers can surface it unchanged. */
function badAction(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

/**
 * Flatten an act spec into ordered bridge input commands.
 *
 * Holds, then releases, then taps: `{hold:['left'], release:['left']}` nets to
 * released, and a tap always lands on the step that follows it.
 */
export function actCommands(spec = {}) {
  const commands = [];
  for (const a of spec.hold ?? []) {
    if (!HOLD_COMMANDS[a]) throw badAction(`unknown hold action: ${a}`);
    commands.push(HOLD_COMMANDS[a]);
  }
  for (const a of spec.release ?? []) {
    if (!RELEASE_COMMANDS[a]) throw badAction(`unknown release action: ${a}`);
    commands.push(RELEASE_COMMANDS[a]);
  }
  for (const a of spec.tap ?? []) {
    if (!TAP_COMMANDS[a]) throw badAction(`unknown tap action: ${a}`);
    commands.push(TAP_COMMANDS[a]);
  }
  return commands;
}

export async function getState(page) {
  return page.evaluate(() => window.__GAME_DEBUG__?.getState() ?? null);
}

export async function command(page, name, payload) {
  return page.evaluate(
    ([n, p]) => window.__GAME_DEBUG__?.command(n, p) ?? null,
    [name, payload]
  );
}

export async function input(page, name) {
  return page.evaluate((n) => window.__GAME_DEBUG__?.input(n), name);
}

/**
 * Apply inputs and advance the simulation in ONE page evaluate.
 *
 * Atomicity is the point: under the manual clock nothing moves between calls,
 * but a split call still lets real frames render in between, which is how the
 * five-step muzzle-particle race bit `polish.spec` once already.
 *
 * Returns the bridge result (including `ended`) alongside the snapshot taken
 * before any frame could process a queued scene swap.
 */
export async function act(page, spec = {}, steps = 1) {
  const commands = actCommands(spec);
  return page.evaluate(
    ([cmds, n]) => {
      const bridge = window.__GAME_DEBUG__;
      if (!bridge) {
        return null;
      }
      for (const c of cmds) {
        bridge.input(c);
      }
      const result = bridge.command('advanceSteps', n);
      return { result, state: bridge.getState() };
    },
    [commands, steps]
  );
}

/**
 * Wait out a queued scene swap.
 *
 * Phaser's `scene.start` only queues; the Scene Manager processes the queue and
 * runs the new scene's `create()` on a later frame, so `getState().scene` keeps
 * reporting the old scene for up to two animation frames. The render loop still
 * runs under `?manualClock`, so waiting on frames works there too.
 */
export async function settleSceneSwap(page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  );
}

/** Wait until the bridge reports the given scene, settling the swap first. */
export async function waitForScene(page, scene, timeoutMs = 10_000) {
  await settleSceneSwap(page);
  await page.waitForFunction((k) => window.__GAME_DEBUG__?.getState()?.scene === k, scene, {
    timeout: timeoutMs
  });
  return getState(page);
}
