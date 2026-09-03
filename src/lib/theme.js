import { getSettings, patchSettings } from './settings'

export const THEMES = ['dark', 'light']
const DEFAULT_THEME = 'dark'

export function getStoredTheme() {
  const t = getSettings().theme
  return THEMES.includes(t) ? t : DEFAULT_THEME
}

export function saveTheme(theme) {
  patchSettings({ theme })
}

export function applyTheme(theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f0f4f8' : '#0a0f1a')
}

/** Called once at startup (before React renders) to avoid a flash. */
export function applyStoredTheme() {
  applyTheme(getStoredTheme())
}
