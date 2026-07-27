import { chromium } from '@playwright/test';

/**
 * Proves a plain reload cannot serve a stale entry point: on the second load
 * (browser cache warm, normal reload - NOT a hard reload) the HTML must still be
 * revalidated with the server, while the content-hashed bundle may come from
 * cache. That combination is what makes a deploy take effect without Ctrl+F5.
 */
const BASE = process.argv[2] ?? 'https://run-and-gun.pages.dev';

async function main() {
  const browser = await chromium.launch({ channel: 'msedge' });
  // One context for both loads so the HTTP cache is shared and warm.
  const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
  const page = await context.newPage();

  const record = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url === `${BASE}/` || /assets\/index-.*\.js$/.test(url)) {
      record.push({
        url: url.replace(BASE, ''),
        status: res.status(),
        fromCache: await res.serverAddr().then((a) => a === null).catch(() => null)
      });
    }
  });

  console.log('--- first load (cold cache) ---');
  await page.goto(BASE, { waitUntil: 'networkidle' });
  const firstBundle = await page.evaluate(() =>
    Array.from(document.querySelectorAll('script[src]')).map((s) => s.getAttribute('src'))
  );
  console.log('bundle referenced:', firstBundle.join(', '));
  record.splice(0);

  console.log('--- second load: plain reload, warm cache ---');
  await page.reload({ waitUntil: 'networkidle' });
  for (const r of record) {
    console.log(`  ${r.url}  status=${r.status}  servedFromCacheWithoutNetwork=${r.fromCache}`);
  }

  const html = record.find((r) => r.url === '/');
  const htmlRevalidated = html !== undefined && html.fromCache === false;
  console.log('\nentry point revalidated on a plain reload:', htmlRevalidated ? 'YES (fixes apply without hard reload)' : 'NO');

  // And the game still runs after the cached load.
  await page.waitForSelector('canvas', { timeout: 15_000 });
  const title = await page.title();
  console.log('game loaded from warm cache:', title);

  await browser.close();
  process.exitCode = htmlRevalidated ? 0 : 1;
}
void main();
