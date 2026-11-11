import { patchSettings, getSettings } from './settings'

/**
 * Full-device backup + merge-import (2026-11-11).
 * v2 backups carry the exercise library too, so an exercise that was later
 * archived or renamed still resolves in charts after a restore.
 */
export const BACKUP_VERSION = 2

function workoutKey(w) {
  return w.id || `${w.date}|${w.name}`
}

export function buildBackup({ history, exercises, templates, schedule, bodyweight }) {
  return {
    app: 'lift-more',
    type: 'backup',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    count: history.length,
    history,
    exercises,
    templates,
    schedule,
    bodyweight,
  }
}

export function downloadBackup(state) {
  const payload = buildBackup(state)
  const stamp = new Date().toISOString().slice(0, 10)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lift-more-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  patchSettings({ lastBackupAt: Date.now() })
  return payload.count
}

/** Accepts v1 (history only / bare array) and v2 (full) files. */
export function parseBackup(parsed) {
  const arr = Array.isArray(parsed) ? parsed : parsed && parsed.history
  if (!Array.isArray(arr)) throw new Error('No workout history found in file.')
  const history = arr.filter(
    (w) => w && typeof w === 'object' && w.date && Array.isArray(w.exercises),
  )
  if (!history.length) throw new Error('File contained no valid workouts.')
  return {
    history,
    exercises: Array.isArray(parsed?.exercises) ? parsed.exercises : [],
    bodyweight: Array.isArray(parsed?.bodyweight) ? parsed.bodyweight : [],
  }
}

/** Merge without losing anything: existing entries win, new ones are added. */
export function mergeHistory(current, incoming) {
  const seen = new Set(current.map(workoutKey))
  const added = incoming.filter((w) => !seen.has(workoutKey(w)))
  const merged = [...current, ...added].sort((a, b) => new Date(a.date) - new Date(b.date))
  return { merged, added: added.length }
}

export function mergeById(current, incoming) {
  const ids = new Set(current.map((x) => x.id))
  return [...current, ...incoming.filter((x) => x && x.id && !ids.has(x.id))]
}

const DAY = 86400000
/** True when there's real data worth protecting and no backup in 30 days. */
export function backupIsDue(historyLength) {
  if (historyLength < 3) return false
  const s = getSettings()
  const last = s.lastBackupAt || 0
  const snoozed = s.backupSnoozedAt || 0
  return Date.now() - Math.max(last, snoozed) > 30 * DAY
}

export function lastBackupLabel() {
  const last = getSettings().lastBackupAt
  if (!last) return 'Never backed up'
  const days = Math.floor((Date.now() - last) / DAY)
  return days === 0 ? 'Backed up today' : `Last backup ${days} day${days === 1 ? '' : 's'} ago`
}
