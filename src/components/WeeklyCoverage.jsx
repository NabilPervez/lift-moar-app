import { useMemo } from 'react'
import { m as Motion, useReducedMotion } from 'framer-motion'
import { MUSCLES, MUSCLE_STYLE } from '../lib/constants'
import { muscleLoad } from '../lib/exercises'

/**
 * Whole-week muscle-group coverage: every muscle, counted by how many
 * exercises across all scheduled days hit it. Untrained muscles stay on the
 * chart (faint) so gaps in the week are obvious.
 */
export default function WeeklyCoverage({ weekTemplates, exercises }) {
  const reduce = useReducedMotion()

  const { rows, totalExercises, trainingDays, maxCount } = useMemo(() => {
    const refs = weekTemplates.flatMap((t) => t.exercises)
    const counts = Object.fromEntries(MUSCLES.map((name) => [name, 0]))
    for (const [name, c] of muscleLoad(refs, exercises)) counts[name] = c
    const list = MUSCLES.map((name) => [name, counts[name]]).sort((a, b) => b[1] - a[1])
    return {
      rows: list,
      totalExercises: refs.length,
      trainingDays: weekTemplates.length,
      maxCount: list[0]?.[1] || 1,
    }
  }, [weekTemplates, exercises])

  if (trainingDays === 0) return null

  const untrained = rows.filter(([, c]) => c === 0).map(([name]) => name)

  return (
    <div className="bg-surface-800 rounded-2xl border border-white/5 p-4">
      <div className="font-bold">Weekly Muscle Coverage</div>
      <div className="text-gray-500 text-xs mb-3">
        {totalExercises} exercises across {trainingDays} training day{trainingDays === 1 ? '' : 's'}
      </div>

      <div className="space-y-1.5">
        {rows.map(([name, count], i) => {
          const st = MUSCLE_STYLE[name] || {}
          const pct = count ? Math.max(6, (count / maxCount) * 100) : 0
          return (
            <div key={name} className={`flex items-center gap-2 ${count ? '' : 'opacity-40'}`}>
              <span
                className={`text-[11px] font-semibold w-20 flex-shrink-0 ${st.text || 'text-gray-400'}`}
              >
                {name}
              </span>
              <div className="flex-1 h-2 rounded-full bg-surface-700 overflow-hidden">
                <Motion.div
                  className={`h-full rounded-full ${st.dot || 'bg-gray-500'}`}
                  initial={reduce ? false : { width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay: 0.05 + i * 0.03 }}
                />
              </div>
              <span className="num text-[10px] text-gray-500 w-4 text-right">{count}</span>
            </div>
          )
        })}
      </div>

      {untrained.length > 0 && untrained.length < MUSCLES.length && (
        <div className="text-[11px] text-gray-500 mt-3">
          Not hit this week: <span className="text-gray-400">{untrained.join(', ')}</span>
        </div>
      )}
    </div>
  )
}
