import { LS_KEYS, loadLS, saveLS } from './storage'

export function getSettings() {
  return loadLS(LS_KEYS.settings, {}) || {}
}

export function patchSettings(patch) {
  saveLS(LS_KEYS.settings, { ...getSettings(), ...patch })
}
