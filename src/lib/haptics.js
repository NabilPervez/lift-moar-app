import { getSettings } from './settings'

/**
 * Fire a short haptic pulse. Respects the `haptics` setting (default on) and
 * silently no-ops where the Vibration API is unavailable (iOS Safari, desktop).
 */
export function buzz(pattern = 10) {
  try {
    if (getSettings().haptics === false) return
    navigator.vibrate?.(pattern)
  } catch (e) {
    /* ignore */
  }
}

export const HAPTIC = {
  tick: 10,
  complete: 14,
  pr: [0, 45, 35, 45, 35, 60],
}
