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

function sortedByDate(history) {
  return history.slice().sort((a, b) => new Date(a.date) - new Date(b.date))
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
    if (change >= 0.04) {
      items.push({
        tone: 'good',
        title: `${ds.label} volume climbing`,
        detail: `Recent sessions are up ${Math.round(change * 100)}% vs the block before.`,
      })
    } else if (change <= -0.12) {
      items.push({
        tone: 'flag',
        title: `${ds.label} volume down`,
        detail: `Recent sessions are down ${Math.round(-change * 100)}% vs the block before.`,
      })
    } else {
      items.push({
        tone: 'watch',
        title: `${ds.label} holding flat`,
        detail: `Within ${Math.round(Math.abs(change) * 100)}% of the block before — time for a load bump.`,
      })
    }
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
