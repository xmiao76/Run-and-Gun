/**
 * Attract mode: the arcade convention where an idle title screen starts a
 * demo. The idle delay is decided here, purely, so the suppression rules are
 * unit-testable without a browser.
 */

/** How long a real visitor waits on the title before the demo starts (ms). */
export const ATTRACT_DELAY_MS = 15_000;

/**
 * The delay before the demo starts, or null when attract mode is suppressed.
 *
 * Suppressed whenever the game is being driven by anything but a person
 * sitting at the title: the debug bridge, the manual clock, or `?autopilot`
 * (which short-circuits the title anyway). A demo that fired during an
 * automated run would hijack the scene out from under the driver, so the rule
 * is "a human watches the demo, a machine never does".
 *
 * The single exception is the `attractMs` override, which forces the demo on
 * with a chosen delay even under automation - that is the seam the e2e suite
 * drives, the same way `?debug` is the seam it drives everything else through.
 */
export function attractDelayMs(search: string, debugEnabled: boolean, manualClock: boolean): number | null {
  const params = new URLSearchParams(search);
  const override = params.get('attractMs');
  if (override !== null) {
    const ms = Number(override);
    return Number.isFinite(ms) && ms >= 0 ? ms : null;
  }
  if (debugEnabled || manualClock || params.has('autopilot')) {
    return null;
  }
  return ATTRACT_DELAY_MS;
}
