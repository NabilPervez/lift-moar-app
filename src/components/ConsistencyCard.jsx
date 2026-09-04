import { useMemo } from 'react'
import { consistency } from '../lib/analytics'

const LEVEL = ['bg-surface-700', 'bg-emerald-500/40', 'bg-emerald-500/70', 'bg-emerald-400']

export default function ConsistencyCard({ history }) {
  const c = useMemo(() => consistency(history, 12), [history])
  if (!history.length) return null

  return (
    <div className="bg-surface-800 rounded-2xl border border-white/5 p-4">
      <div className="font-bold mb-3">Consistency</div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Stat value={c.weekStreak} label={c.weekStreak === 1 ? 'week streak' : 'week streak'} accent="text-emerald-400" />
        <Stat value={c.thisWeek} label="this week" />
        <Stat value={c.thisMonth} label="this month" />
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="grid grid-rows-7 grid-flow-col gap-[3px] w-max">
          {c.heatmap.map((d, i) => (
            <div
              key={i}
              title={d.count >= 0 ? new Date(d.date).toLocaleDateString() : ''}
              className={`w-[10px] h-[10px] rounded-[2px] ${
                d.count < 0 ? 'opacity-0' : LEVEL[Math.min(d.count, LEVEL.length - 1)]
              }`}
            />
          ))}
        </div>
      </div>
      <div className="text-[10px] text-gray-500 mt-2">Last {c.weeks} weeks · {c.totalWorkouts} workouts total</div>
    </div>
  )
}

function Stat({ value, label, accent }) {
  return (
    <div className="bg-surface-700 rounded-xl p-3 text-center">
      <div className={`num font-black text-xl ${accent || ''}`}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</div>
    </div>
  )
}
