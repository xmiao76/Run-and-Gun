import { createServer } from 'node:http';

import { gameUrl, launch, log, VIEWPORT } from './lib/browser.mjs';
import { act, actCommands, command as bridgeCommand, getState as bridgeState, input as bridgeInput } from './lib/bridge.mjs';

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

/**
 * The URL builder and the action vocabulary both live in `scripts/lib/` now, so
 * this server, the MCP server and the evaluation harness cannot drift apart.
 * `actCommands` already throws errors carrying `status: 400`, which the handler
 * wrapper below surfaces unchanged.
 */
const AGENT_URL_OPTIONS = { manualClock: true, renderer: 'canvas' };

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
  page = await browser.newPage({ viewport: VIEWPORT });
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
  return bridgeState(page);
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
    const result = await enqueue(() => bridgeCommand(page, body.name, body.payload));
    sendJson(res, 200, { result });
    return;
  }

  if (path === '/input') {
    if (typeof body.name !== 'string') {
      throw httpError(400, 'missing input name');
    }
    await enqueue(() => bridgeInput(page, body.name));
    sendJson(res, 200, { ok: true });
    return;
  }

  if (path === '/step') {
    const n = Number.isFinite(body.n) ? Math.floor(body.n) : 1;
    const result = await enqueue(() => act(page, {}, n));
    sendJson(res, 200, result?.state ?? { error: 'bridge returned no state' });
    return;
  }

  if (path === '/act') {
    // Validate the vocabulary before touching the page, so an unknown action is
    // a clean 400 rather than a half-applied input batch.
    actCommands(body);
    const n = Number.isFinite(body.n) ? Math.floor(body.n) : 1;
    const result = await enqueue(() => act(page, body, n));
    sendJson(res, 200, result?.state ?? { error: 'bridge returned no state' });
    return;
  }

  if (path === '/goto') {
    const target = gameUrl(typeof body.url === 'string' && body.url ? body.url : TARGET_URL, AGENT_URL_OPTIONS);
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

browser = await launch({ headless: HEADLESS });
const startTarget = gameUrl(TARGET_URL, AGENT_URL_OPTIONS);
await startPage(startTarget);
// stderr, not stdout: `scripts/lib/` is shared with the MCP server, whose
// stdout carries the JSON-RPC stream.
log(`agent-server listening on http://localhost:${PORT}`);
log(`  target: ${startTarget}`);
log('  GET /health | GET /state | POST /command /input /step /act /goto');
server.listen(PORT);
