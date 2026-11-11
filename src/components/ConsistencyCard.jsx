import { useMemo } from 'react'
import { consistency } from '../lib/analytics'

const LEVEL = ['var(--surface-cell)', '#a9d3ba', '#3f9a6c', '#1a7a4c']

export default function ConsistencyCard({ history }) {
  const c = useMemo(() => consistency(history, 12), [history])
  if (!history.length) return null

  return (
    <div className="bg-surface-800 rounded-2xl border border-white/5 p-4">
      <div className="font-bold mb-3">Consistency</div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat value={c.weekStreak} label={c.weekStreak === 1 ? 'week streak' : 'week streak'} accent="text-gold" />
        <Stat value={c.thisWeek} label="this week" />
        <Stat value={c.thisMonth} label="this month" />
      </div>

      {/* fills the card width: 12 week columns × 7 day rows, square cells */}
      <div
        className="grid grid-rows-7 grid-flow-col gap-1"
        style={{ gridTemplateColumns: `repeat(${c.weeks}, minmax(0, 1fr))` }}
      >
        {c.heatmap.map((d, i) => (
          <div
            key={i}
            title={d.count >= 0 ? new Date(d.date).toLocaleDateString() : ''}
            className="aspect-square rounded-[4px]"
            style={{
              background: d.count < 0 ? 'transparent' : LEVEL[Math.min(d.count, LEVEL.length - 1)],
            }}
          />
        ))}
      </div>
      <div className="text-[13px] text-gray-500 mt-3">Last {c.weeks} weeks · {c.totalWorkouts} workouts total</div>
    </div>
  )
}

function Stat({ value, label, accent }) {
  return (
    <div className="rounded-xl p-3 text-center border" style={{ borderColor: 'rgb(var(--surface-600))' }}>
      <div className={`num font-extrabold text-2xl ${accent || ''}`}>{value}</div>
      <div className="text-[13px] text-gray-500">{label}</div>
    </div>
  )
}
