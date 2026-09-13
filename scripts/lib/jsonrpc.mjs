/**
 * JSON-RPC 2.0 over newline-delimited stdio: the pure half.
 *
 * MCP uses newline-delimited JSON, NOT the LSP `Content-Length` framing, so a
 * message is one line and a line is one message. Two things routinely break a
 * hand-rolled server and both are handled here rather than in the wiring:
 *
 *  - stdin does not arrive in message-sized pieces. A chunk can carry half a
 *    message, several messages, or a message plus half the next one, so the
 *    decoder buffers and only emits on a newline.
 *  - a NOTIFICATION (no `id`) must produce no response at all. Replying to one
 *    is a protocol violation and some clients drop the connection over it.
 *
 * Keeping this separate from the server means the whole protocol surface is
 * unit-testable against a scripted byte stream, with no child process.
 */

export const PARSE_ERROR = -32700;
export const INVALID_REQUEST = -32600;
export const METHOD_NOT_FOUND = -32601;
export const INTERNAL_ERROR = -32603;

/**
 * Buffering line decoder.
 *
 * Returns one entry per complete line: `{ message }` for valid JSON, or
 * `{ parseError: true, raw }` for a line that will not parse, which the caller
 * answers with a -32700. Blank lines are skipped; a trailing `\r` is stripped
 * so CRLF streams work.
 */
export function createLineDecoder() {
  let buffer = '';
  return function decode(chunk) {
    buffer += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    const out = [];
    let newline = buffer.indexOf('\n');
    while (newline !== -1) {
      const line = buffer.slice(0, newline).replace(/\r$/, '').trim();
      buffer = buffer.slice(newline + 1);
      if (line.length > 0) {
        try {
          out.push({ message: JSON.parse(line) });
        } catch {
          out.push({ parseError: true, raw: line });
        }
      }
      newline = buffer.indexOf('\n');
    }
    return out;
  };
}

export function errorResponse(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}

/**
 * Build a dispatcher over a `{ method: handler }` map.
 *
 * Returns the response object, or `null` when nothing should be written -
 * which is the case for every notification, and is the whole reason this
 * returns a value instead of writing directly.
 */
export function createDispatcher(handlers) {
  return async function dispatch(message) {
    if (message === null || typeof message !== 'object' || message.jsonrpc !== '2.0') {
      return errorResponse(message?.id ?? null, INVALID_REQUEST, 'expected a JSON-RPC 2.0 message');
    }
    const isNotification = message.id === undefined || message.id === null;
    const handler = handlers[message.method];

    if (isNotification) {
      // Run it if we know it, stay silent either way.
      if (handler) {
        try {
          await handler(message.params ?? {});
        } catch {
          // A notification has no channel to report failure on.
        }
      }
      return null;
    }

    if (!handler) {
      return errorResponse(message.id, METHOD_NOT_FOUND, `method not found: ${message.method}`);
    }

    try {
      return { jsonrpc: '2.0', id: message.id, result: await handler(message.params ?? {}) };
    } catch (err) {
      return errorResponse(message.id, INTERNAL_ERROR, err?.message ?? 'internal error');
    }
  };
}
