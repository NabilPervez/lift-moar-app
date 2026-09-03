import { MUSCLE_STYLE } from '../lib/constants'

/**
 * Horizontal "how hard does this hit each muscle" bar chart.
 * `items` is a sorted array of [muscleName, count] pairs.
 */
export default function TargetingBars({ items, limit = 6, labelWidth = 'w-16' }) {
  if (!items || !items.length) return null
  const max = items[0][1] || 1
  return (
    <div className="space-y-1">
      {items.slice(0, limit).map(([m, count]) => {
        const st = MUSCLE_STYLE[m] || {}
        return (
          <div key={m} className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold ${labelWidth} flex-shrink-0 ${st.text || 'text-gray-400'}`}
            >
              {m}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-surface-700 overflow-hidden">
              <div
                className={`h-full rounded-full ${st.dot || 'bg-gray-400'}`}
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="num text-[10px] text-gray-500 w-3 text-right">{count}</span>
          </div>
        )
      })}
    </div>
  )
}
