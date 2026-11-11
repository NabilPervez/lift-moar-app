import { LS_KEYS, SCHEMA_VERSION, loadLS, saveLS } from './storage'
import { DEFAULT_EXERCISES, makeDefaultTemplates, makeDefaultSchedule } from './exercises'
import { patchSettings } from './settings'

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

export const isSeedWorkout = (w) => typeof w?.id === 'string' && w.id.startsWith('wo_seed_')

/**
 * One-time data migrations, run before the app reads localStorage.
 * Rule (2026-11-11): migrations NEVER overwrite user-owned data (history,
 * schedule, custom exercises). They only add.
 *
 * v1 -> v2: fold in the expanded exercise library + provided templates.
 * v2 -> v3: strip generated sample workouts once real ones exist (they were
 *           polluting PRs and trends), and switch everyone to the light theme.
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
  const storedSchedule = loadLS(LS_KEYS.schedule, null)
  const storedHistory = loadLS(LS_KEYS.history, null)
  const freshInstall =
    from === null && !storedExercises && !storedTemplates && !storedHistory

  if (!freshInstall) {
    saveLS(LS_KEYS.exercises, mergeById(storedExercises || [], DEFAULT_EXERCISES))
    saveLS(LS_KEYS.templates, mergeById(storedTemplates || [], makeDefaultTemplates()))
    // only seed a schedule if the user has none — never replace theirs
    if (!storedSchedule) saveLS(LS_KEYS.schedule, makeDefaultSchedule())

    if (Array.isArray(storedHistory) && storedHistory.some((w) => !isSeedWorkout(w))) {
      saveLS(LS_KEYS.history, storedHistory.filter((w) => !isSeedWorkout(w)))
    }
  }

  if (from === null || from < 3) patchSettings({ theme: 'light' })

  saveLS(LS_KEYS.schema, SCHEMA_VERSION)
}
