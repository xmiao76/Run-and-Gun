/**
 * The MCP tool surface: schemas and handlers, separated from the transport.
 *
 * Kept out of `mcp-server.mjs` so the tool list can be asserted in a unit test
 * without spawning anything, and out of `scripts/lib/bridge.mjs` so the HTTP
 * server does not drag MCP concepts around with it.
 */

import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { closeSession, log, openGame, launch, DEFAULT_BASE } from './browser.mjs';
import { act, command, getState, settleSceneSwap, waitForScene } from './bridge.mjs';

const REPORT_PATH = join('docs', 'eval', 'report.md');

/** An object schema with an explicit `properties` map, even when empty. */
function schema(properties = {}, required = []) {
  return { type: 'object', properties, required };
}

/**
 * Trim a runtime snapshot to what a turn-by-turn player needs.
 *
 * A full `LevelRuntime` carries every enemy, every enemy projectile and every
 * subcomponent - a couple of KB of JSON per call. Returning that on every step
 * burns an agent's context for no benefit, so `verbose` has to be asked for.
 */
export function compactState(state) {
  if (!state) {
    return null;
  }
  const r = state.runtime ?? {};
  if (state.scene !== 'level') {
    return { scene: state.scene, runtime: r };
  }
  return {
    scene: state.scene,
    level: r.level,
    stepIndex: r.stepIndex,
    playerX: r.playerX,
    playerY: r.playerY,
    grounded: r.grounded,
    lives: r.lives,
    weapon: r.weapon,
    score: r.score,
    enemyCount: r.enemyCount,
    enemyProjectileCount: r.enemyProjectileCount,
    nearestEnemyX: (r.enemies ?? []).reduce(
      (best, e) => (best === null || Math.abs(e.x - r.playerX) < Math.abs(best - r.playerX) ? e.x : best),
      null
    ),
    bossActive: r.bossActive,
    bossHealth: r.bossHealth,
    bossVulnerable: r.bossVulnerable,
    subcomponentsAlive: r.subcomponentsAlive,
    ending: r.ending,
    deaths: (r.deaths ?? []).length
  };
}

/**
 * Tool definitions. `handler` is separate from the schema so the schema half
 * can be asserted without a browser.
 */
export function createTools() {
  // Lazily created: launching Chromium at module load would make `initialize`
  // take seconds, and a client that times out on the handshake never gets to
  // call a tool at all.
  let browser = null;
  let session = null;
  const evalJobs = new Map();
  let nextJobId = 1;

  async function ensureSession(base, autopilot) {
    if (session) {
      return session;
    }
    browser ??= await launch({ headless: true });
    session = await openGame(browser, {
      base: base ?? process.env.TARGET_URL ?? DEFAULT_BASE,
      manualClock: true,
      autopilot: autopilot ? '1' : null
    });
    return session;
  }

  function requireSession() {
    if (!session) {
      throw new Error('no run in progress: call game_start first');
    }
    return session;
  }

  const tools = [
    {
      name: 'game_start',
      description:
        'Start a fresh run under the manual clock and return the first state. The clock is frozen: nothing moves until game_act advances it, so there is no time pressure between calls.',
      inputSchema: schema({
        level: { type: 'integer', enum: [1, 2], description: 'Which level to play.' },
        checkpoint: {
          type: 'string',
          enum: ['start', 'mid', 'preboss'],
          description: 'Where in the level to begin. Spawn triggers ahead of it stay armed.'
        },
        lives: { type: 'integer', enum: [3, 5, 10, 30], description: 'Starting lives (default 30).' },
        autopilot: { type: 'boolean', description: 'Let the built-in AI pilot play instead of you.' },
        base: { type: 'string', description: 'Base URL of the game (defaults to TARGET_URL).' }
      }),
      handler: async (params) => {
        const level = params.level ?? 1;
        const active = await ensureSession(params.base, params.autopilot === true);
        await command(active.page, level === 2 ? 'startLevel2' : 'startLevel1');
        await waitForScene(active.page, 'level');
        await command(active.page, 'startAtCheckpoint', {
          id: params.checkpoint ?? 'start',
          lives: params.lives ?? 30
        });
        return compactState(await getState(active.page));
      }
    },
    {
      name: 'game_state',
      description: 'Read the current game state without advancing the simulation.',
      inputSchema: schema({
        verbose: { type: 'boolean', description: 'Return the full runtime snapshot instead of the compact projection.' }
      }),
      handler: async (params) => {
        const state = await getState(requireSession().page);
        return params.verbose ? state : compactState(state);
      }
    },
    {
      name: 'game_act',
      description:
        'Apply inputs and advance the simulation. Holds are applied first, then releases, then taps; then the clock advances by `steps` (60 steps = 1 second). Returns the state afterwards.',
      inputSchema: schema({
        hold: {
          type: 'array',
          items: { type: 'string', enum: ['left', 'right', 'aimUp', 'aimDown', 'crouch', 'drop'] },
          description: 'Directions to hold down.'
        },
        release: {
          type: 'array',
          items: { type: 'string', enum: ['left', 'right', 'aimUp', 'aimDown', 'crouch', 'drop', 'jump', 'fire'] },
          description: 'Held actions to let go of.'
        },
        tap: {
          type: 'array',
          items: { type: 'string', enum: ['jump', 'fire'] },
          description: 'Edge-triggered actions to press once.'
        },
        steps: { type: 'integer', description: 'Simulation steps to advance (default 30, i.e. half a second).' },
        verbose: { type: 'boolean', description: 'Return the full runtime snapshot instead of the compact projection.' }
      }),
      handler: async (params) => {
        const active = requireSession();
        const result = await act(
          active.page,
          { hold: params.hold, release: params.release, tap: params.tap },
          params.steps ?? 30
        );
        if (result?.result?.ended) {
          await settleSceneSwap(active.page);
        }
        return {
          steps: result?.result?.steps ?? 0,
          ended: result?.result?.ended ?? null,
          state: params.verbose ? result?.state : compactState(result?.state)
        };
      }
    },
    {
      name: 'game_command',
      description:
        'Escape hatch: call a raw debug-bridge command (confirmMenu, gotoTitle, teleportPlayer, defeatBoss...). Prefer game_act for ordinary play; these are setup and test affordances, not honest play.',
      inputSchema: schema(
        {
          name: { type: 'string', description: 'Bridge command name.' },
          payload: { description: 'Command payload, if the command takes one.' }
        },
        ['name']
      ),
      handler: async (params) => command(requireSession().page, params.name, params.payload)
    },
    {
      name: 'run_eval',
      description:
        'Start a batch self-play evaluation in the background and return a job id immediately. A full matrix takes longer than a tool call may block for, so poll eval_status and then read read_findings.',
      inputSchema: schema({
        quick: { type: 'boolean', description: 'Run the 12-config subset instead of the full matrix.' },
        filter: { type: 'string', description: 'Only run configs whose description contains this substring.' }
      }),
      handler: async (params) => {
        // Spawn node directly rather than an npm script: on Windows the npm
        // shim is a .cmd and would need a shell.
        const require = createRequire(import.meta.url);
        const args = [join('scripts', 'eval', 'index.mjs')];
        if (params.quick) {
          args.push('--quick');
        }
        if (params.filter) {
          args.push('--filter', params.filter);
        }
        const id = `eval-${nextJobId++}`;
        const child = spawn(process.execPath, args, { cwd: require('node:process').cwd(), stdio: ['ignore', 'pipe', 'pipe'] });
        const job = { id, done: false, code: null, summary: null, output: '' };
        evalJobs.set(id, job);
        const collect = (buf) => {
          job.output += buf.toString('utf8');
          const match = job.output.match(/EVAL runs=.*/g);
          if (match) {
            job.summary = match[match.length - 1];
          }
        };
        child.stdout.on('data', collect);
        child.stderr.on('data', collect);
        child.on('close', (code) => {
          job.done = true;
          job.code = code;
        });
        return { jobId: id, started: true };
      }
    },
    {
      name: 'eval_status',
      description: 'Check a run_eval job: whether it has finished, its exit code, and its summary line.',
      inputSchema: schema({ jobId: { type: 'string', description: 'Id returned by run_eval.' } }, ['jobId']),
      handler: async (params) => {
        const job = evalJobs.get(params.jobId);
        if (!job) {
          throw new Error(`no such eval job: ${params.jobId}`);
        }
        return { jobId: job.id, done: job.done, exitCode: job.code, summary: job.summary };
      }
    },
    {
      name: 'read_findings',
      description: 'Read the latest evaluation report (docs/eval/report.md).',
      inputSchema: schema(),
      handler: async () => {
        try {
          return { report: readFileSync(REPORT_PATH, 'utf8') };
        } catch {
          throw new Error(`no report at ${REPORT_PATH}: run run_eval first`);
        }
      }
    }
  ];

  async function dispose() {
    await closeSession(session);
    session = null;
    await browser?.close().catch(() => undefined);
    browser = null;
  }

  return { tools, dispose, log };
}

/** The `tools/list` payload: schemas only, no handlers. */
export function toolListPayload(tools) {
  return {
    tools: tools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }))
  };
}
