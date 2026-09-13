/**
 * Browser + page setup shared by every driver script.
 *
 * Before this existed, all 26 `scripts/*.mjs` probes repeated the same six
 * lines: launch chromium, open a 960x540 page, build a `?debug=1` URL, wait for
 * the bridge, and collect page errors. The agent server, the MCP server and the
 * evaluation harness all go through here instead.
 *
 * Logging rule: this module and everything under `scripts/lib/` writes to
 * stderr only. The MCP server shares it and speaks JSON-RPC on stdout, where a
 * stray `console.log` corrupts the protocol stream.
 */

import { chromium } from '@playwright/test';

export const VIEWPORT = { width: 960, height: 540 };
export const DEFAULT_BASE = 'http://localhost:4173';

/** localStorage key the game validates its settings from. */
const SETTINGS_KEY = 'operation-iron-echo:settings:v1';
const SETTINGS_VERSION = 1;

/** Log to stderr: stdout belongs to the MCP protocol stream. */
export function log(...args) {
  process.stderr.write(args.map(String).join(' ') + '\n');
}

/**
 * Build the debug URL a driver should drive against.
 *
 * `debug` is required for the bridge to exist at all; `renderer=canvas` is what
 * every headless script uses; `manualClock` hands the clock to the caller.
 */
export function gameUrl(base = DEFAULT_BASE, options = {}) {
  const { manualClock = false, autopilot = null, renderer = 'canvas', extra = {} } = options;
  const url = new URL(base);
  url.searchParams.set('debug', '1');
  if (renderer) {
    url.searchParams.set('renderer', renderer);
  }
  if (manualClock) {
    url.searchParams.set('manualClock', '1');
  }
  if (autopilot !== null) {
    url.searchParams.set('autopilot', String(autopilot));
  }
  for (const [key, value] of Object.entries(extra)) {
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/**
 * The settings blob to seed before the page scripts run.
 *
 * This matters more than it looks: the shipped default is 30 starting lives, so
 * a run that does not force a lower count effectively never reaches the
 * game-over path, and any evaluation of that path silently measures nothing.
 */
export function settingsBlob(overrides = {}) {
  return JSON.stringify({
    version: SETTINGS_VERSION,
    musicVolume: 0,
    sfxVolume: 0,
    mute: true,
    reducedFlash: false,
    controls: 'keyboard',
    bestScore: 0,
    startingLives: 30,
    ...overrides
  });
}

export async function launch(options = {}) {
  const { headless = true, channel } = options;
  return chromium.launch({ headless, ...(channel ? { channel } : {}) });
}

/**
 * Open the game on a fresh context and wait for the bridge.
 *
 * A fresh context per run is deliberate: localStorage (settings, best score)
 * and the Phaser registry (`autopilot`, `currentLevelIndex`, `lastScore`) both
 * survive a plain re-navigation, so reusing one would leak state between runs.
 */
export async function openGame(browser, options = {}) {
  const { base = DEFAULT_BASE, settings = {}, ...urlOptions } = options;
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (e) => errors.push({ kind: 'pageerror', text: String(e) }));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push({ kind: 'console', text: msg.text() });
    }
  });

  await page.addInitScript(
    ([key, blob]) => {
      try {
        window.localStorage.setItem(key, blob);
      } catch {
        // Private-mode or blocked storage: the game falls back to defaults.
      }
    },
    [SETTINGS_KEY, settingsBlob(settings)]
  );

  const url = gameUrl(base, urlOptions);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  // Fail fast on the wrong target or a build without the debug bridge.
  await page.waitForFunction(() => !!window.__GAME_DEBUG__, undefined, { timeout: 20_000 });

  return { context, page, errors, url };
}

export async function closeSession(session) {
  if (!session) {
    return;
  }
  await session.context?.close().catch(() => undefined);
}
