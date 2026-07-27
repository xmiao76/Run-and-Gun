import { chromium } from '@playwright/test';

/**
 * Deeper Edge diagnostic: headed real-profile-like session, plain URL (no debug
 * params, as a real player uses), click-to-focus first, then press X and report
 * exactly what the page observed.
 */
const channel = process.argv[2] ?? 'msedge';
const BASE = process.argv[3] ?? 'https://run-and-gun.pages.dev';

async function main() {
  const browser = await chromium.launch({ channel, headless: false });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push('console: ' + m.text());
  });

  // Plain URL: exactly what a player loads.
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForSelector('canvas', { timeout: 20_000 });
  await page.waitForTimeout(1200);

  const env = await page.evaluate(() => ({
    ua: navigator.userAgent,
    renderer: (() => {
      try {
        const c = document.createElement('canvas');
        const gl = c.getContext('webgl2') || c.getContext('webgl');
        if (!gl) return 'NO WEBGL';
        const dbg = gl.getExtension('WEBGL_debug_renderer_info');
        return dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : 'webgl (renderer masked)';
      } catch (e) {
        return 'error: ' + String(e);
      }
    })(),
    debugBridge: typeof window.__GAME_DEBUG__,
    activeElement: document.activeElement ? document.activeElement.tagName : 'none'
  }));
  console.log(`[${channel}] ua:`, env.ua);
  console.log(`[${channel}] webgl renderer:`, env.renderer);
  console.log(`[${channel}] __GAME_DEBUG__:`, env.debugBridge, '| activeElement:', env.activeElement);

  // Instrument what the page actually receives, including composition/IME.
  await page.evaluate(() => {
    window.__SEEN = [];
    const log = (tag) => (e) =>
      window.__SEEN.push({
        tag,
        code: e.code ?? null,
        key: e.key ?? null,
        isComposing: e.isComposing ?? null,
        repeat: e.repeat ?? null
      });
    window.addEventListener('keydown', log('keydown'), true);
    window.addEventListener('compositionstart', log('compositionstart'), true);
    window.addEventListener('blur', () => window.__SEEN.push({ tag: 'window-blur' }), true);
  });

  // Start the game like a player: click, then Enter.
  await page.mouse.click(480, 270);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'test-results/shots/edge-after-start.png' });

  // Hold X and capture the frame while it should be firing.
  await page.keyboard.down('x');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/shots/edge-firing.png' });
  await page.keyboard.up('x');

  const seen = await page.evaluate(() => window.__SEEN);
  console.log(`[${channel}] events:`, JSON.stringify(seen));
  console.log(`[${channel}] errors:`, JSON.stringify(errors));

  await browser.close();
}
void main();
