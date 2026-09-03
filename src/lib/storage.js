export const LS_KEYS = {
  exercises: 'flt_exercises_v1',
  templates: 'flt_templates_v1',
  schedule: 'flt_schedule_v1',
  history: 'flt_history_v1',
}

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

export function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
