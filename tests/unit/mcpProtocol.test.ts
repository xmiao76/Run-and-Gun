import { describe, expect, it } from 'vitest';

import {
  createDispatcher,
  createLineDecoder,
  errorResponse,
  METHOD_NOT_FOUND,
  PARSE_ERROR
} from '../../scripts/lib/jsonrpc.mjs';
import { compactState, toolListPayload, createTools } from '../../scripts/lib/mcpTools.mjs';

/**
 * The five things that reliably break a hand-rolled MCP server, pinned here so
 * the transport can be changed without discovering them again through a client
 * that simply refuses to connect:
 *
 *  1. stdin does not arrive in message-sized chunks
 *  2. a notification must produce NO response
 *  3. unknown methods must be -32601, not a crash
 *  4. every tool's inputSchema must be an object schema WITH a properties map
 *  5. nothing but protocol JSON may reach stdout
 */

describe('line decoder', () => {
  it('emits one message per line', () => {
    const decode = createLineDecoder();
    const out = decode('{"jsonrpc":"2.0","id":1,"method":"ping"}\n{"jsonrpc":"2.0","id":2,"method":"ping"}\n');
    expect(out).toHaveLength(2);
    expect(out[0].message.id).toBe(1);
    expect(out[1].message.id).toBe(2);
  });

  it('buffers a message split across chunks', () => {
    const decode = createLineDecoder();
    expect(decode('{"jsonrpc":"2.0","id":')).toEqual([]);
    expect(decode('7,"method":"pi')).toEqual([]);
    const out = decode('ng"}\n');
    expect(out).toHaveLength(1);
    expect(out[0].message).toEqual({ jsonrpc: '2.0', id: 7, method: 'ping' });
  });

  it('handles CRLF and blank lines', () => {
    const decode = createLineDecoder();
    const out = decode('\r\n{"jsonrpc":"2.0","id":1,"method":"ping"}\r\n\r\n');
    expect(out).toHaveLength(1);
    expect(out[0].message.id).toBe(1);
  });

  it('reports an unparseable line instead of throwing', () => {
    const decode = createLineDecoder();
    const out = decode('not json at all\n');
    expect(out[0].parseError).toBe(true);
    expect(errorResponse(null, PARSE_ERROR, 'invalid JSON').error.code).toBe(PARSE_ERROR);
  });

  it('keeps a trailing partial message for the next chunk', () => {
    const decode = createLineDecoder();
    const out = decode('{"jsonrpc":"2.0","id":1,"method":"ping"}\n{"jsonrpc":"2.0","id":2');
    expect(out).toHaveLength(1);
    expect(decode(',"method":"ping"}\n')[0].message.id).toBe(2);
  });
});

/** The dispatcher returns a result-or-error union; read it back loosely. */
interface RpcResponse {
  jsonrpc: string;
  id?: unknown;
  result?: unknown;
  error?: { code: number; message: string };
}
const asResponse = (value: unknown): RpcResponse | null => value as RpcResponse | null;

describe('dispatcher', () => {
  const dispatch = createDispatcher({
    ping: () => ({}),
    echo: (params: { value?: unknown }) => ({ value: params.value }),
    'notifications/initialized': () => undefined,
    boom: () => {
      throw new Error('handler exploded');
    }
  });

  it('answers a request with a result', async () => {
    expect(await dispatch({ jsonrpc: '2.0', id: 1, method: 'ping' })).toEqual({
      jsonrpc: '2.0',
      id: 1,
      result: {}
    });
  });

  it('passes params through', async () => {
    const response = await dispatch({ jsonrpc: '2.0', id: 2, method: 'echo', params: { value: 42 } });
    expect(response).toMatchObject({ result: { value: 42 } });
  });

  it('stays SILENT on a notification, even a known one', async () => {
    expect(await dispatch({ jsonrpc: '2.0', method: 'notifications/initialized' })).toBeNull();
    expect(await dispatch({ jsonrpc: '2.0', method: 'ping' })).toBeNull();
  });

  it('stays silent on an unknown notification rather than erroring', async () => {
    expect(await dispatch({ jsonrpc: '2.0', method: 'notifications/cancelled' })).toBeNull();
  });

  it('returns -32601 for an unknown method that has an id', async () => {
    const response = asResponse(await dispatch({ jsonrpc: '2.0', id: 3, method: 'resources/list' }));
    expect(response?.error?.code).toBe(METHOD_NOT_FOUND);
    expect(response?.id).toBe(3);
  });

  it('turns a throwing handler into an error response, not a crash', async () => {
    const response = asResponse(await dispatch({ jsonrpc: '2.0', id: 4, method: 'boom' }));
    expect(response?.error?.message).toContain('handler exploded');
  });

  it('rejects a message that is not JSON-RPC 2.0', async () => {
    const response = asResponse(await dispatch({ id: 5, method: 'ping' } as never));
    expect(response?.error?.code).toBeDefined();
  });
});

describe('tool schemas', () => {
  const { tools } = createTools();

  it('exposes the documented tool set', () => {
    expect(tools.map((t: { name: string }) => t.name)).toEqual([
      'game_start',
      'game_state',
      'game_act',
      'game_command',
      'run_eval',
      'eval_status',
      'read_findings'
    ]);
  });

  it('gives every tool an object schema with a properties map', () => {
    // The single most common reason a tool is listed but never callable.
    for (const tool of toolListPayload(tools).tools) {
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeTypeOf('object');
      expect(Array.isArray(tool.inputSchema.required)).toBe(true);
      expect(tool.description.length).toBeGreaterThan(0);
    }
  });

  it('keeps handlers out of the tools/list payload', () => {
    for (const tool of toolListPayload(tools).tools) {
      expect('handler' in tool).toBe(false);
    }
  });

  it('read_findings takes no arguments but still declares a properties map', () => {
    const readFindings = toolListPayload(tools).tools.find((t: { name: string }) => t.name === 'read_findings');
    expect(readFindings?.inputSchema).toEqual({ type: 'object', properties: {}, required: [] });
  });
});

describe('compactState', () => {
  const full = {
    scene: 'level',
    runtime: {
      level: 'fortress-interior',
      stepIndex: 120,
      playerX: 2749.5,
      playerY: 480,
      grounded: true,
      lives: 30,
      weapon: 'pulse',
      score: 450,
      enemyCount: 2,
      enemyProjectileCount: 1,
      enemies: [
        { id: 'a', kind: 'runner', state: 'approach', x: 2800, y: 450 },
        { id: 'b', kind: 'sentry', state: 'idle', x: 2600, y: 450 }
      ],
      enemyProjectiles: [{ x: 1, y: 2, vx: 3, vy: 4, arcGravity: 0 }],
      subcomponents: [{ id: 'n', x: 1, y: 2, width: 18, height: 18, alive: true }],
      subcomponentsAlive: 1,
      bossActive: true,
      bossHealth: 8,
      bossVulnerable: false,
      ending: null,
      deaths: [{ cause: 'pit', x: 1, y: 2, stepIndex: 3, costLife: true }]
    }
  };

  it('drops the per-entity arrays that would flood a session', () => {
    const compact = compactState(full) as Record<string, unknown>;
    expect(compact.enemies).toBeUndefined();
    expect(compact.enemyProjectiles).toBeUndefined();
    expect(compact.subcomponents).toBeUndefined();
    // ...while keeping the counts and the one derived fact that matters.
    expect(compact.enemyCount).toBe(2);
    expect(compact.nearestEnemyX).toBe(2800);
    expect(compact.deaths).toBe(1);
  });

  it('keeps what a player needs to decide the next move', () => {
    const compact = compactState(full) as Record<string, unknown>;
    expect(compact).toMatchObject({
      scene: 'level',
      playerX: 2749.5,
      lives: 30,
      weapon: 'pulse',
      bossActive: true,
      bossVulnerable: false,
      subcomponentsAlive: 1
    });
  });

  it('passes menu scenes through whole, since they are already small', () => {
    const results = { scene: 'results', runtime: { score: 10, bestScore: 20, final: false } };
    expect(compactState(results)).toEqual({ scene: 'results', runtime: results.runtime });
  });

  it('tolerates a missing state', () => {
    expect(compactState(null)).toBeNull();
  });
});
