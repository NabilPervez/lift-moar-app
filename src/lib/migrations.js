import { LS_KEYS, SCHEMA_VERSION, loadLS, saveLS } from './storage'
import { DEFAULT_EXERCISES, makeDefaultTemplates, makeDefaultSchedule } from './exercises'

/**
 * Merge `defaults` into `current` by id:
 *  - existing entries keep their position and any user edits (current wins on
 *    conflicting fields), but gain fields the default added (e.g. equipment)
 *  - defaults not present in `current` are appended
 */
function mergeById(current, defaults) {
  const byId = new Map(defaults.map((d) => [d.id, d]))
  const merged = current.map((c) => {
    const d = byId.get(c.id)
    byId.delete(c.id)
    return d ? { ...d, ...c } : c
  })
  for (const d of byId.values()) merged.push(d)
  return merged
}

/**
 * One-time data migrations, run before the app reads localStorage.
 *
 * v1 -> v2: fold in the expanded exercise library and the provided
 * templates/weekly schedule, without touching logged history.
 */
export function runMigrations() {
  let from
  try {
    from = loadLS(LS_KEYS.schema, null)
  } catch {
    return
  }
  if (from === SCHEMA_VERSION) return

  const storedExercises = loadLS(LS_KEYS.exercises, null)
  const storedTemplates = loadLS(LS_KEYS.templates, null)
  const storedHistory = loadLS(LS_KEYS.history, null)
  const freshInstall =
    from === null && !storedExercises && !storedTemplates && !storedHistory

  if (!freshInstall) {
    saveLS(LS_KEYS.exercises, mergeById(storedExercises || [], DEFAULT_EXERCISES))
    saveLS(LS_KEYS.templates, mergeById(storedTemplates || [], makeDefaultTemplates()))
    saveLS(LS_KEYS.schedule, makeDefaultSchedule())
  }

  saveLS(LS_KEYS.schema, SCHEMA_VERSION)
}
