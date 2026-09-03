import { DEFAULT_EXERCISES, exById, makeDefaultTemplates } from './exercises'

/**
 * Seed history used for a fresh install so the app isn't empty on first open.
 * It's a realistic ~10-week Upper/Lower/Bodyweight block (RPE 7-8, alternating
 * home and 24H Fitness gym days) with progressive overload, one deload week,
 * and a deliberately flat accessory so the Progress "Quick Read" has something
 * of each kind to say. Purely generated + deterministic.
 */

const TEMPLATES = makeDefaultTemplates()
const tmplById = (id) => TEMPLATES.find((t) => t.id === id)

const round = (w, step) => Math.round(w / step) * step

// base weight (week 0), weekly increment, working-rep target, weight rounding step
const PROG = {
  ex_db_ohp: { base: 25, inc: 1.25, reps: 8, step: 2.5 },
  ex_bent_row: { base: 45, inc: 1.5, reps: 10, step: 2.5 },
  ex_db_curl: { base: 22.5, inc: 1.25, reps: 10, step: 2.5 },
  ex_oh_tricep_ext: { base: 20, inc: 1.25, reps: 10, step: 2.5 },
  ex_lateral_raise: { base: 15, inc: 0, reps: 12, step: 2.5 }, // intentionally flat
  ex_shrugs: { base: 45, inc: 2, reps: 12, step: 5 },
  ex_plank: { base: 0, inc: 0, reps: 45, step: 1 },
  ex_goblet_squat: { base: 30, inc: 1.5, reps: 8, step: 2.5 },
  ex_glute_bridges: { base: 40, inc: 2.5, reps: 10, step: 5 },
  ex_db_rev_lunge: { base: 25, inc: 1, reps: 10, step: 2.5 },
  ex_calf_raise: { base: 0, inc: 0, reps: 15, step: 1 },
  ex_dead_bug: { base: 0, inc: 0, reps: 10, step: 1 },
  ex_side_plank: { base: 0, inc: 0, reps: 40, step: 1 },
  ex_bw_squat: { base: 0, inc: 0, reps: 22, step: 1 },
  ex_bw_rev_lunge: { base: 0, inc: 0, reps: 12, step: 1 },
  ex_pushup: { base: 0, inc: 0, reps: 15, step: 1 },
  ex_pike_push_ups: { base: 0, inc: 0, reps: 9, step: 1 },
  ex_arnold_press: { base: 20, inc: 1.25, reps: 10, step: 2.5 },
  ex_lat_pulldown: { base: 70, inc: 4, reps: 10, step: 5 },
  ex_seated_cable_row: { base: 55, inc: 3, reps: 10, step: 5 },
  ex_machine_chest_press: { base: 40, inc: 3, reps: 10, step: 5 },
  ex_barbell_shrugs: { base: 80, inc: 3, reps: 10, step: 5 },
  ex_chest_fly: { base: 10, inc: 1, reps: 10, step: 2.5 },
  ex_tricep_pushdowns: { base: 35, inc: 2, reps: 10, step: 5 },
  ex_hammer_curl: { base: 20, inc: 1.25, reps: 10, step: 2.5 },
  ex_leg_press: { base: 140, inc: 12, reps: 10, step: 10 },
  ex_leg_extensions: { base: 70, inc: 4, reps: 10, step: 5 },
  ex_seated_leg_curls: { base: 55, inc: 3, reps: 10, step: 5 },
  ex_hip_adductions: { base: 90, inc: 4, reps: 10, step: 5 },
  ex_back_extensions: { base: 45, inc: 3, reps: 10, step: 5 },
  ex_hanging_leg_raises: { base: 0, inc: 0, reps: 10, step: 1 },
}

const WEEKS = 10
const DELOAD_WEEK = 6

// Anchor near "today" (2026-09-03 in-app) and walk back to a Monday.
function firstMonday() {
  const anchor = new Date('2026-09-02T18:30:00')
  const d = new Date(anchor)
  d.setDate(d.getDate() - WEEKS * 7)
  while (d.getDay() !== 1) d.setDate(d.getDate() - 1)
  return d
}

function setsFor(exerciseId, week, seed) {
  const p = PROG[exerciseId] || { base: 0, inc: 0, reps: 10, step: 2.5 }
  const deload = week === DELOAD_WEEK
  let w = p.base + p.inc * week
  if (deload) w *= 0.85
  // small deterministic wobble so lines aren't perfectly straight
  const wobble = p.base > 0 ? ((seed * 7 + week * 13) % 5) - 2 : 0
  w = p.base > 0 ? Math.max(p.step, round(w + wobble, p.step)) : 0
  const rpe = deload ? 6 : week < 3 ? 7 : 8
  const reps = deload ? p.reps + 2 : p.reps
  const mk = (r, e) => ({
    weight: p.base > 0 ? String(w) : '',
    reps: String(r),
    rpe: String(e),
    completed: true,
  })
  return [mk(reps, rpe), mk(reps, rpe), mk(Math.max(1, reps - 1), rpe)]
}

function workout(templateId, date, week) {
  const t = tmplById(templateId)
  return {
    name: t.name,
    date: date.toISOString(),
    exercises: t.exercises.map((item, i) => {
      const meta = exById(DEFAULT_EXERCISES, item.exerciseId) || { name: '', muscles: [] }
      return {
        exerciseId: item.exerciseId,
        name: meta.name,
        muscles: meta.muscles,
        rest: item.rest,
        reps: item.reps,
        sets: setsFor(item.exerciseId, week, i + 1),
      }
    }),
  }
}

function build() {
  const start = firstMonday()
  const cutoff = new Date('2026-09-03T00:00:00')
  const out = []
  for (let wk = 0; wk < WEEKS + 1; wk++) {
    // a two-week block training at 24H Fitness (brings Leg Press / Lat Pulldown
    // into the picture), otherwise training at home
    const gym = wk === 4 || wk === 5
    const plan = [
      { off: 0, id: gym ? 'tmpl_upper_24h' : 'tmpl_upper_day' },
      { off: 1, id: gym ? 'tmpl_lower_24h' : 'tmpl_lower_day' },
      { off: 2, id: gym ? 'tmpl_upper_24h' : 'tmpl_upper_day' },
      { off: 3, id: gym ? 'tmpl_lower_24h' : 'tmpl_lower_day' },
      { off: 4, id: 'tmpl_bodyweight_day' },
    ]
    for (const p of plan) {
      const d = new Date(start)
      d.setDate(d.getDate() + wk * 7 + p.off)
      d.setHours(7 + (p.off % 3), 15, 0, 0)
      if (d >= cutoff) continue
      // skip the occasional session so the streak looks human
      if ((wk * 5 + p.off) % 11 === 4) continue
      out.push(workout(p.id, d, wk))
    }
  }
  return out
}

export const DEFAULT_HISTORY = build()
