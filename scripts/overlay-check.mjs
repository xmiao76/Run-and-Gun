import { chromium } from '@playwright/test';

/** Verify the ?keys=1 input diagnostic renders and classifies keys correctly. */
const BASE = process.argv[2] ?? 'http://localhost:4173';

async function main() {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
  await page.goto(`${BASE}/?keys=1&debug=1`);
  await page.waitForSelector('[data-key-overlay]', { timeout: 15_000 });

  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  await page.keyboard.press('z');
  await page.keyboard.press('x');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('q');
  await page.waitForTimeout(400);

  const text = await page.locator('[data-key-overlay]').textContent();
  console.log('--- overlay contents ---');
  console.log(text);

  const ok =
    /code=KeyZ .* -> jump/.test(text ?? '') &&
    /code=KeyX .* -> fire/.test(text ?? '') &&
    /code=ArrowRight .* -> right/.test(text ?? '') &&
    /code=KeyQ .* -> IGNORED/.test(text ?? '');
  console.log('\noverlay classification:', ok ? 'OK' : 'FAIL');

  await page.screenshot({ path: 'test-results/shots/key-overlay.png' });
  await browser.close();
  process.exitCode = ok ? 0 : 1;
}
void main();
