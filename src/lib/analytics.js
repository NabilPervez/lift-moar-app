import { exById } from './exercises'

/**
 * Analytics helpers for the Progress dashboard.
 *
 * All series are derived from the `history` array (persisted under the
 * `flt_history_v1` localStorage key). Each history entry looks like:
 *
 *   {
 *     name: string,
 *     date: ISO string,
 *     exercises: [
 *       { exerciseId, name, muscles, rest, reps,
 *         sets: [{ weight, reps, rpe, completed }] }
 *     ]
 *   }
 */

export const MUSCLE_GROUPS = {
  'Upper Pull': ['Back', 'Biceps'],
  'Upper Push': ['Chest', 'Shoulders', 'Triceps'],
  'Lower Body': ['Quads', 'Hamstrings', 'Glutes', 'Calves'],
  Core: ['Core'],
}

const toNum = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

function completedSets(entryEx) {
  return (entryEx.sets || []).filter(
    (s) => s.completed && toNum(s.weight) > 0 && toNum(s.reps) > 0,
  )
}

/** Best single set for an exercise, scored by weight x reps. */
function bestSetVolume(entryEx) {
  let best = 0
  for (const s of completedSets(entryEx)) {
    best = Math.max(best, toNum(s.weight) * toNum(s.reps))
  }
  return best
}

/** Heaviest working weight logged for an exercise in a session. */
function maxWeight(entryEx) {
  let best = 0
  for (const s of completedSets(entryEx)) best = Math.max(best, toNum(s.weight))
  return best
}

function musclesFor(entryEx, exercises) {
  const meta = exById(exercises, entryEx.exerciseId)
  return (meta && meta.muscles) || entryEx.muscles || []
}

function nameFor(entryEx, exercises) {
  const meta = exById(exercises, entryEx.exerciseId)
  return (meta && meta.name) || entryEx.name || ''
}

export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatDuration(ms) {
  if (ms == null || !Number.isFinite(ms)) return '—'
  const totalMin = Math.max(1, Math.round(ms / 60000))
  if (totalMin < 60) return `${totalMin} min`
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

const epley = (w, r) => w * (1 + r / 30)

/** Best estimated 1-rep-max across an exercise entry's completed sets. */
export function bestE1RM(entryEx) {
  let best = 0
  for (const s of entryEx.sets || []) {
    if (!s.completed) continue
    const w = toNum(s.weight)
    const r = toNum(s.reps)
    if (w > 0 && r > 0) best = Math.max(best, epley(w, r))
  }
  return best
}

/**
 * Post-workout recap: duration, total volume, sets, PRs and a per-lift summary.
 * `priorHistory` must NOT include the workout being summarised.
 */
export function computeWorkoutSummary(workout, priorHistory, startedAt) {
  const durationMs = startedAt ? Date.now() - startedAt : null
  let totalVolume = 0
  let completedSets = 0
  const prs = []
  const lifts = []

  for (const ex of workout.exercises) {
    const done = (ex.sets || []).filter(
      (s) => s.completed && toNum(s.weight) > 0 && toNum(s.reps) > 0,
    )
    completedSets += (ex.sets || []).filter((s) => s.completed).length
    const vol = done.reduce((v, s) => v + toNum(s.weight) * toNum(s.reps), 0)
    totalVolume += vol
    const topSet = done.length
      ? done.reduce((b, s) => (toNum(s.weight) >= toNum(b.weight) ? s : b))
      : null
    const top = topSet ? { weight: toNum(topSet.weight), reps: toNum(topSet.reps) } : null

    if (done.length) {
      lifts.push({ name: ex.name || '', sets: done.length, volume: Math.round(vol), topSet: top })
    }

    const thisBest = bestE1RM(ex)
    if (thisBest > 0) {
      let priorBest = 0
      for (const w of priorHistory) {
        for (const pe of w.exercises) {
          if (pe.exerciseId === ex.exerciseId) priorBest = Math.max(priorBest, bestE1RM(pe))
        }
      }
      if (priorBest > 0 && thisBest > priorBest * 1.001) {
        prs.push({ name: ex.name || '', e1rm: Math.round(thisBest), topSet: top })
      }
    }
  }

  return {
    name: workout.name,
    durationMs,
    totalVolume: Math.round(totalVolume),
    completedSets,
    prs,
    lifts,
  }
}

function sortedByDate(history) {
  return history.slice().sort((a, b) => new Date(a.date) - new Date(b.date))
}

/* ============================== PER-EXERCISE HISTORY ============================== */

/** Every session that logged completed sets of one exercise, oldest first. */
export function exerciseSessions(history, exerciseId) {
  return sortedByDate(history)
    .map((w) => {
      const ex = w.exercises.find((e) => e.exerciseId === exerciseId)
      if (!ex) return null
      const done = completedSets(ex)
      if (!done.length) return null
      const volume = done.reduce((v, s) => v + toNum(s.weight) * toNum(s.reps), 0)
      return {
        date: w.date,
        workoutName: w.name,
        sets: done.map((s) => ({ weight: toNum(s.weight), reps: toNum(s.reps), rpe: s.rpe })),
        topWeight: maxWeight(ex),
        e1rm: Math.round(bestE1RM(ex)),
        volume: Math.round(volume),
      }
    })
    .filter(Boolean)
}

/** Headline stats + progression series for one exercise. */
export function exerciseStats(history, exercises, exerciseId) {
  const sessions = exerciseSessions(history, exerciseId)
  let bestWeight = 0
  let bestReps = 0
  let bestE1rm = 0
  for (const s of sessions) {
    for (const set of s.sets) {
      if (set.weight > bestWeight || (set.weight === bestWeight && set.reps > bestReps)) {
        bestWeight = set.weight
        bestReps = set.reps
      }
    }
    bestE1rm = Math.max(bestE1rm, s.e1rm)
  }
  return {
    name: nameFor({ exerciseId }, exercises),
    sessionCount: sessions.length,
    lastDate: sessions.length ? sessions[sessions.length - 1].date : null,
    bestSet: bestWeight ? { weight: bestWeight, reps: bestReps } : null,
    bestE1rm,
    sessions,
    series: {
      labels: sessions.map((s) => fmtDate(s.date)),
      weight: sessions.map((s) => s.topWeight),
      e1rm: sessions.map((s) => s.e1rm),
    },
  }
}

/* ============================== CONSISTENCY ============================== */

function startOfWeek(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)) // Monday
  return x
}
const dayKey = (d) => {
  const x = new Date(d)
  return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`
}

/**
 * Training consistency: this week / month counts, the current run of
 * consecutive weeks with at least one workout, and a per-day heatmap for the
 * last `weeks` weeks (Mon-first).
 */
export function consistency(history, weeks = 12) {
  const now = new Date()
  const weekStart = startOfWeek(now)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const byDay = new Map()
  const weekSet = new Set()
  let thisWeek = 0
  let thisMonth = 0

  for (const w of history) {
    const d = new Date(w.date)
    byDay.set(dayKey(d), (byDay.get(dayKey(d)) || 0) + 1)
    weekSet.add(+startOfWeek(d))
    if (d >= weekStart) thisWeek++
    if (d >= monthStart) thisMonth++
  }

  // consecutive weeks back from this one (or last one) with a workout
  let weekStreak = 0
  const cursor = new Date(weekStart)
  if (!weekSet.has(+cursor)) cursor.setDate(cursor.getDate() - 7) // grace: allow streak to hold mid-week
  while (weekSet.has(+cursor)) {
    weekStreak++
    cursor.setDate(cursor.getDate() - 7)
  }

  const gridStart = new Date(weekStart)
  gridStart.setDate(gridStart.getDate() - 7 * (weeks - 1))
  const heatmap = []
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(gridStart)
    d.setDate(d.getDate() + i)
    heatmap.push({ date: +d, count: d > now ? -1 : byDay.get(dayKey(d)) || 0 })
  }

  return { thisWeek, thisMonth, weekStreak, totalWorkouts: history.length, heatmap, weeks }
}

/* ============================== BODYWEIGHT ============================== */

export function bodyweightSeries(entries) {
  const sorted = (entries || [])
    .filter((e) => Number.isFinite(toNum(e.weight)) && toNum(e.weight) > 0)
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date))
  if (!sorted.length) return { labels: [], data: [], latest: null, change7: null, change30: null }

  const latest = sorted[sorted.length - 1]
  const at = (daysAgo) => {
    const cutoff = Date.now() - daysAgo * 86400000
    let match = null
    for (const e of sorted) {
      if (new Date(e.date).getTime() <= cutoff) match = e
      else break
    }
    return match
  }
  const chg = (ref) => (ref ? Math.round((toNum(latest.weight) - toNum(ref.weight)) * 10) / 10 : null)

  return {
    labels: sorted.map((e) => fmtDate(e.date)),
    data: sorted.map((e) => toNum(e.weight)),
    latest: toNum(latest.weight),
    latestDate: latest.date,
    change7: chg(at(7)),
    change30: chg(at(30)),
  }
}

/**
 * Muscle-group volume over time.
 * For each logged workout, sum the best-set volume (weight x reps) of every
 * exercise that touches the group.
 */
export function muscleGroupVolumeSeries(history, exercises) {
  const hist = sortedByDate(history)
  const labels = hist.map((w) => fmtDate(w.date))
  const datasets = Object.entries(MUSCLE_GROUPS).map(([group, targets]) => {
    const data = hist.map((w) => {
      let total = 0
      for (const ex of w.exercises) {
        const ms = musclesFor(ex, exercises)
        if (ms.some((m) => targets.includes(m))) total += bestSetVolume(ex)
      }
      // null (not 0) on days the group wasn't trained, so each line connects
      // its real sessions instead of sawtoothing down to the axis
      return total > 0 ? Math.round(total) : null
    })
    return { label: group, data }
  })
  return { labels, datasets }
}

/**
 * Upper-body lift progression — heaviest working weight per session for a set
 * of dumbbell-style movements, matched loosely by exercise name.
 */
const UPPER_SPECS = [
  { label: 'Bent Over Rows', match: (n) => /rows?\b/i.test(n) && !/renegade/i.test(n) },
  { label: 'Bicep Curls', match: (n) => /curl/i.test(n) && !/leg|nordic/i.test(n) },
  { label: 'Shrugs', match: (n) => /shrug/i.test(n) },
  { label: 'Overhead Press', match: (n) => /overhead press|arnold press|\bohp\b/i.test(n) },
]

export function upperBodyProgressionSeries(history, exercises) {
  const hist = sortedByDate(history)
  const labels = hist.map((w) => fmtDate(w.date))
  const datasets = UPPER_SPECS.map((spec) => {
    const data = hist.map((w) => {
      let best = null
      for (const ex of w.exercises) {
        if (!spec.match(nameFor(ex, exercises))) continue
        const mw = maxWeight(ex)
        if (mw > 0) best = best === null ? mw : Math.max(best, mw)
      }
      return best
    })
    return { label: spec.label, data }
  }).filter((ds) => ds.data.some((v) => v !== null))
  return { labels, datasets }
}

/** Exercises that appear in history, ranked by how many sessions logged them. */
export function exerciseHistoryOptions(history, exercises) {
  const counts = {}
  for (const w of history) {
    for (const ex of w.exercises) {
      if (completedSets(ex).length) {
        counts[ex.exerciseId] = (counts[ex.exerciseId] || 0) + 1
      }
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([id, sessions]) => {
      const meta = exById(exercises, id)
      return { id, name: (meta && meta.name) || id, sessions }
    })
}

/** Heaviest working weight over time for one specific exercise. */
export function specificLiftSeries(history, exercises, exerciseId) {
  const hist = sortedByDate(history).filter((w) =>
    w.exercises.some((e) => e.exerciseId === exerciseId && completedSets(e).length),
  )
  const labels = hist.map((w) => fmtDate(w.date))
  const data = hist.map((w) => {
    const ex = w.exercises.find((e) => e.exerciseId === exerciseId)
    return ex ? maxWeight(ex) : null
  })
  return { labels, data }
}

/**
 * "Quick Read" — a short list of plain-language callouts with a tone of
 * `good` | `watch` | `flag`, derived entirely from the logged data.
 */
export function quickRead(history, exercises) {
  const items = []
  const hist = sortedByDate(history)

  if (hist.length < 2) {
    const remaining = 2 - hist.length
    items.push({
      tone: 'watch',
      title: 'Not enough data yet',
      detail: `Log ${remaining} more workout${remaining === 1 ? '' : 's'} to unlock trend analysis.`,
    })
    return items
  }

  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length

  const climbing = []
  const dropped = []
  const flat = []

  const { datasets } = muscleGroupVolumeSeries(history, exercises)
  for (const ds of datasets) {
    const series = ds.data.filter((v) => v > 0)
    if (series.length < 4) continue
    // average the last 2 sessions vs the 3 before that, so a single
    // heavy/light day (or a gym-vs-home swing) doesn't dominate
    const recent = mean(series.slice(-2))
    const baseline = mean(series.slice(-5, -2))
    if (!baseline) continue
    const change = (recent - baseline) / baseline
    if (change >= 0.04) climbing.push({ label: ds.label, pct: Math.round(change * 100) })
    else if (change <= -0.12) dropped.push({ label: ds.label, pct: Math.round(-change * 100) })
    else flat.push(ds.label)
  }

  // strongest mover of each kind, individually
  climbing.sort((a, b) => b.pct - a.pct)
  dropped.sort((a, b) => b.pct - a.pct)
  if (climbing[0]) {
    items.push({
      tone: 'good',
      title: `${climbing[0].label} volume climbing`,
      detail: `Recent sessions up ${climbing[0].pct}% vs the block before${
        climbing.length > 1 ? ` (also ${climbing.slice(1).map((c) => c.label).join(', ')})` : ''
      }.`,
    })
  }
  if (dropped[0]) {
    items.push({
      tone: 'flag',
      title: `${dropped[0].label} volume down`,
      detail: `Recent sessions down ${dropped[0].pct}% vs the block before${
        dropped.length > 1 ? ` (also ${dropped.slice(1).map((c) => c.label).join(', ')})` : ''
      }.`,
    })
  }
  // all flat groups roll up into a single line
  if (flat.length) {
    items.push({
      tone: 'watch',
      title: flat.length === 1 ? `${flat[0]} holding flat` : `${flat.length} groups holding flat`,
      detail: `${flat.join(', ')} — steady load for a while now; consider a bump.`,
    })
  }

  const anomalies = []
  for (const w of hist) {
    for (const ex of w.exercises) {
      for (const s of ex.sets || []) {
        if (!s.completed) continue
        const wt = toNum(s.weight)
        const rp = toNum(s.reps)
        if (wt > 1500 || rp > 60) {
          anomalies.push(`${nameFor(ex, exercises)} on ${fmtDate(w.date)} (${s.weight}x${s.reps})`)
        }
      }
    }
  }
  if (anomalies.length) {
    items.push({
      tone: 'flag',
      title: 'Check these entries',
      detail: anomalies.slice(0, 3).join('; '),
    })
  }

  return items
}
