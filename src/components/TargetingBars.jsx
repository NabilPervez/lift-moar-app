import { useEffect, useState } from 'react'
import { MUSCLE_STYLE } from '../lib/constants'

/**
 * Horizontal "how hard does this hit each muscle" bar chart.
 * `items` is a sorted array of [muscleName, count] pairs.
 * Bars grow from zero on mount (CSS width transition, flipped after mount so
 * it can't get stuck) and ease smoothly when the data changes.
 */
export default function TargetingBars({ items, limit = 6, labelWidth = 'w-16' }) {
  const [fill, setFill] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setFill(true), 30)
    return () => clearTimeout(t)
  }, [])

  if (!items || !items.length) return null
  const max = items[0][1] || 1

  return (
    <div className="space-y-1">
      {items.slice(0, limit).map(([name, count], i) => {
        const st = MUSCLE_STYLE[name] || {}
        const pct = count ? Math.max(4, (count / max) * 100) : 0
        return (
          <div key={name} className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold ${labelWidth} flex-shrink-0 ${st.text || 'text-gray-400'}`}
            >
              {name}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-surface-700 overflow-hidden">
              <div
                className={`h-full rounded-full bar-fill ${st.dot || 'bg-gray-400'}`}
                style={{ width: fill ? `${pct}%` : 0, transitionDelay: `${i * 35}ms` }}
              />
            </div>
            <span className="num text-[10px] text-gray-500 w-3 text-right">{count}</span>
          </div>
        )
      })}
    </div>
  )
}
