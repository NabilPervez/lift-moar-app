export const LS_KEYS = {
  exercises: 'flt_exercises_v1',
  templates: 'flt_templates_v1',
  schedule: 'flt_schedule_v1',
  history: 'flt_history_v1',
  settings: 'flt_settings_v1',
  schema: 'flt_schema_v',
  activeWorkout: 'flt_active_v1',
  bodyweight: 'flt_bodyweight_v1',
}

// Bump when makeDefault* content changes in a way existing installs should pick up.
export const SCHEMA_VERSION = 2

export function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    return fallback
  }
}

export function saveLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    /* storage full or unavailable — ignore */
  }
}

export function removeLS(key) {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    /* ignore */
  }
}

export function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
