import { launch, openGame, closeSession, log } from './lib/browser.mjs';
import { command, waitForScene } from './lib/bridge.mjs';

const browser = await launch({});
const s = await openGame(browser, {
  base: 'http://localhost:4173',
  manualClock: true,
  settings: { scanlines: true, mute: true, musicVolume: 0, sfxVolume: 0 }
});
const { page } = s;
await waitForScene(page, 'title');
await page.screenshot({ path: 'test-results/scan-01-title.png' });

await command(page, 'startLevel1');
await waitForScene(page, 'level');
await command(page, 'advanceSteps', 120);
await page.screenshot({ path: 'test-results/scan-02-l1.png' });

// zoomed crop: draw the centre 240x135 at 4x for texture detail
await page.evaluate(() => {
  const canvas = document.querySelector('canvas');
  canvas.style.transformOrigin = '480px 270px';
  canvas.style.transform = 'scale(4)';
});
await page.screenshot({ path: 'test-results/scan-03-zoom.png' });

log('errors=' + s.errors.length);
await closeSession(s); await browser.close();
