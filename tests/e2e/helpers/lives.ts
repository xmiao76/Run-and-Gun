/**
 * Helpers for tests whose subject involves the life count.
 *
 * Not a spec file: Playwright only collects `*.spec.ts`, so this is safe here.
 *
 * A test should never hardcode the default starting lives - that default is a
 * product decision that has already changed once. Either seed the value the test
 * needs, or assert the life *change* rather than an absolute number.
 */

type Page = import('@playwright/test').Page;

const SETTINGS_KEY = 'operation-iron-echo:settings:v1';

/**
 * Pin the starting-lives setting, then reload so the game picks it up.
 * Requires the page to already be on the game origin.
 */
export async function seedStartingLives(page: Page, lives: number): Promise<void> {
  await page.evaluate(
    ([key, value]) => {
      const raw = window.localStorage.getItem(key as string);
      const settings = raw ? (JSON.parse(raw) as Record<string, unknown>) : { version: 1 };
      settings.startingLives = value;
      window.localStorage.setItem(key as string, JSON.stringify(settings));
    },
    [SETTINGS_KEY, lives] as const
  );
  await page.reload();
}

/** The current life count reported by the running scene. */
export async function currentLives(page: Page): Promise<number> {
  const lives = await page.evaluate(() => {
    const r = window.__GAME_DEBUG__?.getState()?.runtime as { lives?: number } | null | undefined;
    return r?.lives;
  });
  if (typeof lives !== 'number') {
    throw new Error('runtime did not report a life count');
  }
  return lives;
}

/** Wait until exactly `count` lives remain. */
export function waitForLives(page: Page, count: number): Promise<unknown> {
  return page.waitForFunction((expected) => {
    const r = window.__GAME_DEBUG__?.getState()?.runtime as { lives?: number } | null | undefined;
    return r?.lives === expected;
  }, count);
}
