/**
 * End-to-end check of the MCP server over a real stdio pipe.
 *
 * Drives the actual child process the way a client does: handshake, tool list,
 * then play Level 1 through the tools. Also asserts the thing that silently
 * kills a hand-rolled server - that NOTHING but protocol JSON reaches stdout.
 *
 *   node scripts/mcp-smoke.mjs [baseUrl]
 */
import { spawn } from 'node:child_process';

import { createLineDecoder } from './lib/jsonrpc.mjs';
import { log } from './lib/browser.mjs';

const BASE = process.argv[2] ?? 'http://localhost:4173';

const child = spawn(process.execPath, ['scripts/mcp-server.mjs'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: { ...process.env, TARGET_URL: BASE }
});

const decode = createLineDecoder();
const pending = new Map();
let unsolicited = 0;
let badStdout = 0;

child.stdout.on('data', (chunk) => {
  for (const entry of decode(chunk)) {
    if (entry.parseError) {
      badStdout += 1;
      log(`NON-PROTOCOL STDOUT: ${entry.raw}`);
      continue;
    }
    const resolve = pending.get(entry.message.id);
    if (resolve) {
      pending.delete(entry.message.id);
      resolve(entry.message);
    } else {
      unsolicited += 1;
      log(`UNSOLICITED: ${JSON.stringify(entry.message)}`);
    }
  }
});
child.stderr.on('data', () => {
  // Logs belong here; they are not part of the protocol.
});

let nextId = 1;
function request(method, params) {
  const id = nextId++;
  const message = { jsonrpc: '2.0', id, method, ...(params ? { params } : {}) };
  log(`--> ${JSON.stringify(message)}`);
  return new Promise((resolve) => {
    pending.set(id, resolve);
    child.stdin.write(JSON.stringify(message) + '\n');
  });
}
function notify(method) {
  const message = { jsonrpc: '2.0', method };
  log(`--> ${JSON.stringify(message)} (notification, expects no reply)`);
  child.stdin.write(JSON.stringify(message) + '\n');
}
function show(label, response) {
  const text = JSON.stringify(response);
  log(`<-- ${label}: ${text.length > 400 ? text.slice(0, 400) + '...' : text}`);
  return response;
}

const init = show('initialize', await request('initialize', {
  protocolVersion: '2025-06-18',
  capabilities: {},
  clientInfo: { name: 'mcp-smoke', version: '1.0.0' }
}));
if (!init.result?.capabilities?.tools) {
  throw new Error('initialize did not advertise tools');
}

notify('notifications/initialized');

const list = show('tools/list', await request('tools/list'));
log(`    ${list.result.tools.length} tools: ${list.result.tools.map((t) => t.name).join(', ')}`);

show('ping', await request('ping'));
show('unknown method', await request('resources/list'));

const started = show('tools/call game_start', await request('tools/call', {
  name: 'game_start',
  arguments: { level: 1, checkpoint: 'start', lives: 30 }
}));
if (started.result?.isError) {
  throw new Error('game_start failed: ' + started.result.content[0].text);
}

// Play: run right and fire for a few seconds of simulation.
let last = null;
for (let i = 0; i < 6; i++) {
  last = await request('tools/call', {
    name: 'game_act',
    arguments: i === 0 ? { hold: ['right'], tap: ['fire'], steps: 60 } : { tap: ['fire'], steps: 60 }
  });
}
show('tools/call game_act (x6)', last);
const state = JSON.parse(last.result.content[0].text);
log(`    playerX=${state.state.playerX} lives=${state.state.lives} score=${state.state.score}`);
if (!(state.state.playerX > 200)) {
  throw new Error('the player did not move through the MCP tools');
}

show('tools/call unknown tool', await request('tools/call', { name: 'nope', arguments: {} }));

child.stdin.end();
await new Promise((resolve) => child.on('close', resolve));

log('');
log(`unsolicited responses: ${unsolicited} (must be 0 - notifications must be silent)`);
log(`non-protocol stdout lines: ${badStdout} (must be 0)`);
if (unsolicited > 0 || badStdout > 0) {
  process.exit(1);
}
log('MCP SMOKE PASSED');
