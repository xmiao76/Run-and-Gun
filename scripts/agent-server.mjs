import { createServer } from 'node:http';
import { chromium } from '@playwright/test';

/**
 * Local HTTP driver server for agent-controlled play.
 *
 * Keeps ONE headless browser page open for the server's lifetime, pointed at
 * the game with the debug bridge + manual clock enabled, and exposes the same
 * control surface the Playwright `GameDriver` uses. An external agent (an LLM
 * loop, an MCP tool, or a person with curl) reads structured state and drives
 * gameplay with plain HTTP - no screenshots, no real-time races, because the
 * manual clock means the game only advances when `/step` or `/act` says so.
 *
 * Usage:
 *   node scripts/agent-server.mjs
 *   TARGET_URL=http://localhost:4173 PORT=8787 HEADLESS=0 node scripts/agent-server.mjs
 *
 * Endpoints (JSON in/out):
 *   GET  /health            -> { ok, url, scene }
 *   GET  /state             -> full bridge getState() snapshot
 *   POST /command {name, payload?} -> { result }   raw bridge command
 *   POST /input   {name}           -> { ok }       raw bridge input
 *   POST /step    {n}              -> state after advanceSteps(n)
 *   POST /act     {hold?, release?, tap?, n} -> state (atomic input+step)
 *   POST /goto    {url?}           -> { ok, url }  re-navigate (resets session)
 *
 * No new dependencies: node:http plus the already-present Playwright.
 */

const TARGET_URL = process.env.TARGET_URL ?? 'https://run-and-gun.pages.dev';
const PORT = Number(process.env.PORT ?? 8787);
const HEADLESS = (process.env.HEADLESS ?? '1') !== '0';
const MAX_BODY_BYTES = 64 * 1024;

/** Build the debug-enabled, manual-clock URL the agent always drives against. */
function gameUrl(base) {
  const u = new URL(base);
  u.searchParams.set('debug', '1');
  u.searchParams.set('renderer', 'canvas');
  u.searchParams.set('manualClock', '1');
  return u.toString();
}

// Map the agent-facing action names onto the bridge's input commands
// (mirrors tests/e2e/helpers/gameDriver.ts so docs can be shared).
const HOLD_COMMANDS = { left: 'holdLeft', right: 'holdRight', aimUp: 'holdAimUp', aimDown: 'holdAimDown' };
const RELEASE_COMMANDS = {
  left: 'releaseLeft',
  right: 'releaseRight',
  aimUp: 'releaseAimUp',
  aimDown: 'releaseAimDown',
  jump: 'jumpRelease',
  fire: 'fireRelease'
};
const TAP_COMMANDS = { jump: 'jumpPress', fire: 'firePress' };

function actCommands(spec) {
  const commands = [];
  for (const a of spec.hold ?? []) {
    if (!HOLD_COMMANDS[a]) throw httpError(400, `unknown hold action: ${a}`);
    commands.push(HOLD_COMMANDS[a]);
  }
  for (const a of spec.release ?? []) {
    if (!RELEASE_COMMANDS[a]) throw httpError(400, `unknown release action: ${a}`);
    commands.push(RELEASE_COMMANDS[a]);
  }
  for (const a of spec.tap ?? []) {
    if (!TAP_COMMANDS[a]) throw httpError(400, `unknown tap action: ${a}`);
    commands.push(TAP_COMMANDS[a]);
  }
  return commands;
}

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/** Serialized handler queue: one page means one request at a time, and /act stays atomic. */
let queue = Promise.resolve();
function enqueue(work) {
  const run = queue.then(work);
  queue = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY_BYTES) {
        reject(httpError(413, 'body too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(httpError(400, 'invalid JSON body'));
      }
    });
    req.on('error', () => reject(httpError(400, 'request stream error')));
  });
}

function sendJson(res, status, body) {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(data);
}

let browser;
let page;

async function startPage(url) {
  page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  // Fail fast if the bridge never appears (wrong target, build without debug).
  await page.waitForFunction(() => !!window.__GAME_DEBUG__, undefined, { timeout: 20_000 });
}

async function closePage() {
  if (page) {
    await page.close().catch(() => undefined);
    page = undefined;
  }
}

async function getState() {
  return page.evaluate(() => window.__GAME_DEBUG__?.getState() ?? null);
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  const path = url.pathname;

  if (req.method === 'GET' && path === '/health') {
    const state = await enqueue(() => getState());
    sendJson(res, 200, { ok: true, url: page.url(), scene: state?.scene ?? null });
    return;
  }

  if (req.method === 'GET' && path === '/state') {
    const state = await enqueue(() => getState());
    sendJson(res, 200, state ?? { error: 'bridge returned no state' });
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'method not allowed' });
    return;
  }

  const body = await readBody(req);

  if (path === '/command') {
    if (typeof body.name !== 'string') {
      throw httpError(400, 'missing command name');
    }
    const result = await enqueue(() =>
      page.evaluate(([n, p]) => window.__GAME_DEBUG__?.command(n, p) ?? null, [body.name, body.payload])
    );
    sendJson(res, 200, { result });
    return;
  }

  if (path === '/input') {
    if (typeof body.name !== 'string') {
      throw httpError(400, 'missing input name');
    }
    await enqueue(() => page.evaluate((n) => window.__GAME_DEBUG__?.input(n), body.name));
    sendJson(res, 200, { ok: true });
    return;
  }

  if (path === '/step') {
    const n = Number.isFinite(body.n) ? Math.floor(body.n) : 1;
    const state = await enqueue(() =>
      page.evaluate((steps) => {
        const bridge = window.__GAME_DEBUG__;
        if (!bridge) return null;
        bridge.command('advanceSteps', steps);
        return bridge.getState();
      }, n)
    );
    sendJson(res, 200, state ?? { error: 'bridge returned no state' });
    return;
  }

  if (path === '/act') {
    const commands = actCommands(body);
    const n = Number.isFinite(body.n) ? Math.floor(body.n) : 1;
    const state = await enqueue(() =>
      page.evaluate(([cmds, steps]) => {
        const bridge = window.__GAME_DEBUG__;
        if (!bridge) return null;
        for (const c of cmds) {
          bridge.input(c);
        }
        bridge.command('advanceSteps', steps);
        return bridge.getState();
      }, [commands, n])
    );
    sendJson(res, 200, state ?? { error: 'bridge returned no state' });
    return;
  }

  if (path === '/goto') {
    const target = gameUrl(typeof body.url === 'string' && body.url ? body.url : TARGET_URL);
    await enqueue(async () => {
      await closePage();
      await startPage(target);
    });
    sendJson(res, 200, { ok: true, url: target });
    return;
  }

  sendJson(res, 404, { error: `no such endpoint: ${path}` });
}

const server = createServer((req, res) => {
  handle(req, res).catch((err) => {
    const status = err?.status ?? 500;
    sendJson(res, status, { error: err?.message ?? 'internal error' });
  });
});

async function shutdown(code) {
  server.close();
  await closePage();
  await browser?.close().catch(() => undefined);
  process.exit(code);
}

process.on('SIGINT', () => void shutdown(0));
process.on('SIGTERM', () => void shutdown(0));

browser = await chromium.launch({ headless: HEADLESS });
const startTarget = gameUrl(TARGET_URL);
await startPage(startTarget);
console.log(`agent-server listening on http://localhost:${PORT}`);
console.log(`  target: ${startTarget}`);
console.log('  GET /health | GET /state | POST /command /input /step /act /goto');
server.listen(PORT);
