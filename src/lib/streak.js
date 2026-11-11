/**
 * Streaks for the celebration screen (2026-11-11).
 * Lifting isn't daily, so the headline streak is WEEKS in a row with ≥1
 * workout. `weekDots` marks which days of the current Mon–Sun week trained.
 */
const DAY = 86400000

function weekStart(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const dow = (x.getDay() + 6) % 7 // Mon = 0
  return x.getTime() - dow * DAY
}

export function weekStreak(dates, now = Date.now()) {
  const weeks = new Set(dates.map((d) => weekStart(d)))
  let cur = weekStart(now)
  let n = 0
  while (weeks.has(cur)) {
    n++
    cur -= 7 * DAY
  }
  return n
}

export function weekDots(dates, now = Date.now()) {
  const start = weekStart(now)
  const days = new Set(
    dates
      .map((d) => new Date(d))
      .filter((d) => d.getTime() >= start)
      .map((d) => (d.getDay() + 6) % 7),
  )
  const today = (new Date(now).getDay() + 6) % 7
  return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, i) => ({
    label,
    done: days.has(i),
    today: i === today,
  }))
}

export function workoutsThisWeek(dates, now = Date.now()) {
  const start = weekStart(now)
  return dates.filter((d) => new Date(d).getTime() >= start).length
}
