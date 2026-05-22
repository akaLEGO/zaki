// Single source of truth for the app version, derived from package.json so
// bumping one file is enough. Vite supports JSON imports natively.
//
// Format guide:
//   0.x.y-beta.N  → closed beta phase
//   0.x.y-rc.N    → release candidate before public launch
//   1.0.0         → first public release (no beta tag)
//   N.x.y         → subsequent feature releases

import pkg from '../../package.json';

export const APP_VERSION = pkg.version as string;

/**
 * Friendly version shown in the UI.
 *
 *   0.5.0-beta.1 → "Beta 0.5.1"
 *   0.5.0-rc.2   → "RC 0.5.2"
 *   1.0.0        → "v1.0.0"
 */
export const DISPLAY_VERSION: string = (() => {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-(beta|rc|alpha)\.(\d+))?$/.exec(APP_VERSION);
  if (!m) return APP_VERSION;
  const [, major, minor, _patch, tag, iter] = m;
  if (tag === 'beta') return `Beta ${major}.${minor}.${iter}`;
  if (tag === 'rc')   return `RC ${major}.${minor}.${iter}`;
  if (tag === 'alpha') return `Alpha ${major}.${minor}.${iter}`;
  return `v${APP_VERSION}`;
})();

/** Is this build a pre-release (beta / rc / alpha)? */
export const IS_PRERELEASE = /-(beta|rc|alpha)\./.test(APP_VERSION);
