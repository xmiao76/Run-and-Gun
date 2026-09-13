/**
 * MCP server for the game bridge: transport wiring only.
 *
 * Speaks newline-delimited JSON-RPC 2.0 on stdio. The protocol logic lives in
 * `scripts/lib/jsonrpc.mjs` and the tools in `scripts/lib/mcpTools.mjs`, both
 * of which are unit-tested without spawning this process.
 *
 *   node scripts/mcp-server.mjs
 *   TARGET_URL=http://localhost:4173 node scripts/mcp-server.mjs
 *
 * No new dependencies: node:process plus the Playwright already used by the
 * other drivers.
 */

import { createDispatcher, createLineDecoder, errorResponse, PARSE_ERROR } from './lib/jsonrpc.mjs';
import { createTools, toolListPayload } from './lib/mcpTools.mjs';
import { log } from './lib/browser.mjs';

/**
 * stdout carries the protocol and nothing else. One stray `console.log` from
 * any module in the import graph corrupts the stream and the client drops the
 * connection, so redirect it before anything else can run.
 */
console.log = (...args) => log(...args);
console.info = (...args) => log(...args);
console.warn = (...args) => log(...args);

/** Protocol revisions this server knows how to speak. */
const SUPPORTED_PROTOCOLS = ['2024-11-05', '2025-03-26', '2025-06-18'];
const LATEST_PROTOCOL = '2025-06-18';

const { tools, dispose } = createTools();
const byName = new Map(tools.map((t) => [t.name, t]));

const handlers = {
  initialize: (params) => ({
    // Echo the client's revision when we know it, so an older client is not
    // forced onto a newer one it cannot parse.
    protocolVersion: SUPPORTED_PROTOCOLS.includes(params.protocolVersion)
      ? params.protocolVersion
      : LATEST_PROTOCOL,
    // ONLY tools. Advertising resources or prompts without handlers makes the
    // client call resources/list and fail the connection on the missing method.
    capabilities: { tools: {} },
    serverInfo: { name: 'iron-echo', version: '0.1.0' }
  }),

  // Notifications: the dispatcher never responds to these, they just must not
  // come back as "method not found".
  'notifications/initialized': () => undefined,
  'notifications/cancelled': () => undefined,

  ping: () => ({}),

  'tools/list': () => toolListPayload(tools),

  'tools/call': async (params) => {
    const tool = byName.get(params.name);
    if (!tool) {
      // A tool error is a RESULT with isError, not a JSON-RPC error: the model
      // is meant to see it and adapt, rather than the call failing outright.
      return {
        content: [{ type: 'text', text: `no such tool: ${params.name}` }],
        isError: true
      };
    }
    try {
      const result = await tool.handler(params.arguments ?? {});
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      return {
        content: [{ type: 'text', text: `${tool.name} failed: ${err?.message ?? err}` }],
        isError: true
      };
    }
  }
};

const dispatch = createDispatcher(handlers);
const decode = createLineDecoder();

function send(response) {
  if (response !== null && response !== undefined) {
    process.stdout.write(JSON.stringify(response) + '\n');
  }
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  for (const entry of decode(chunk)) {
    if (entry.parseError) {
      send(errorResponse(null, PARSE_ERROR, 'invalid JSON'));
      continue;
    }
    void dispatch(entry.message).then(send, (err) => log(`dispatch failed: ${err?.message ?? err}`));
  }
});

async function shutdown() {
  await dispose().catch(() => undefined);
  process.exit(0);
}

process.stdin.on('end', () => void shutdown());
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

log('iron-echo MCP server ready on stdio');
