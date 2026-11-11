import Dexie from 'dexie'

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
export const SCHEMA_VERSION = 3


/**
 * Storage (2026-11-11): IndexedDB (Dexie) is the source of truth; localStorage
 * is a best-effort mirror + fallback.
 *
 * Why: localStorage is ~5 MB, synchronous, and the first thing iOS evicts.
 * IndexedDB gets far more quota and is kept by navigator.storage.persist().
 *
 * How: the app's code stays synchronous. `hydrateStorage()` runs once before
 * React renders and loads every key from IndexedDB into an in-memory cache.
 * `loadLS` reads the cache (falling back to localStorage); `saveLS` updates
 * the cache, writes IndexedDB, and mirrors to localStorage. A save is only
 * reported as failed if BOTH stores reject it.
 */
const db = new Dexie('lift-more')
db.version(1).stores({ kv: 'key' })

const cache = new Map()
let idbOk = false

function emitFail(key) {
  try {
    window.dispatchEvent(new CustomEvent('lift:save-failed', { detail: { key } }))
  } catch {
    /* no window */
  }
}

/** Load IndexedDB into memory; first run copies existing localStorage over. */
let abandoned = false
/** Called if hydration took too long: the app has started on localStorage. */
export function abandonHydrate() {
  abandoned = true
}

export async function hydrateStorage() {
  try {
    const rows = await db.kv.toArray()
    // too late — the app already booted from localStorage; stay on it this
    // session rather than swap data out from under the UI
    if (abandoned) return
    if (rows.length) {
      for (const r of rows) cache.set(r.key, r.value)
    } else {
      // one-time migration: localStorage → IndexedDB, nothing deleted
      const toCopy = []
      for (const key of Object.values(LS_KEYS)) {
        const raw = localStorage.getItem(key)
        if (raw == null) continue
        try {
          const value = JSON.parse(raw)
          cache.set(key, value)
          toCopy.push({ key, value })
        } catch {
          /* corrupt entry — leave it in localStorage untouched */
        }
      }
      if (toCopy.length) await db.kv.bulkPut(toCopy)
    }
    idbOk = true
  } catch {
    idbOk = false // private mode / blocked — localStorage-only, as before
  }
}

export function storageBackend() {
  return idbOk ? 'indexeddb' : 'localstorage'
}

export function loadLS(key, fallback) {
  if (cache.has(key)) {
    const v = cache.get(key)
    return v == null ? fallback : v
  }
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch (e) {
    return fallback
  }
}

// Returns true if the value is held somewhere durable. Fires `lift:save-failed`
// only when every store rejected it, so the app can warn instead of losing data.
export function saveLS(key, value) {
  cache.set(key, value)
  let lsOk = true
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    lsOk = false
  }
  if (idbOk) {
    db.kv.put({ key, value }).catch(() => {
      if (!lsOk) emitFail(key)
    })
    return true
  }
  if (!lsOk) emitFail(key)
  return lsOk
}

export function removeLS(key) {
  cache.delete(key)
  try {
    localStorage.removeItem(key)
  } catch (e) {
    /* ignore */
  }
  if (idbOk) db.kv.delete(key).catch(() => {})
}

/**
 * Ask the browser to keep this origin's storage (so iOS/Android won't evict it
 * under pressure). Safe to call repeatedly; resolves to whether it's persisted.
 */
export async function requestPersistentStorage() {
  try {
    if (!navigator.storage || !navigator.storage.persist) return false
    if (await navigator.storage.persisted()) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export function uid(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
