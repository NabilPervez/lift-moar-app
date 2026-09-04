import { useMemo, useState } from 'react'
import LiftLineChart from './LiftLineChart'
import LogBodyweightModal from './LogBodyweightModal'
import { bodyweightSeries, fmtDate } from '../lib/analytics'

const arrow = (n) => (n > 0 ? '▲' : n < 0 ? '▼' : '·')

export default function BodyweightCard({ entries, theme, onLog, onDelete }) {
  const [logging, setLogging] = useState(false)
  const [showList, setShowList] = useState(false)
  const s = useMemo(() => bodyweightSeries(entries), [entries])

  return (
    <div className="bg-surface-800 rounded-2xl border border-white/5 p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="font-bold">Bodyweight</div>
        <button
          onClick={() => setLogging(true)}
          className="tap-sm min-h-0 text-xs font-bold text-blue-400 hover:text-blue-300 px-1"
        >
          + Log
        </button>
      </div>

      {s.latest == null ? (
        <p className="text-gray-600 italic text-sm py-3">No entries yet — log your weight to track it here.</p>
      ) : (
        <>
          <div className="flex items-end gap-3 mb-3">
            <div className="num font-black text-3xl">{s.latest}</div>
            <div className="text-xs text-gray-500 mb-1">lb</div>
            {s.change7 != null && (
              <div className={`text-xs mb-1 ${s.change7 <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {arrow(s.change7)} {Math.abs(s.change7)} / 7d
              </div>
            )}
            {s.change30 != null && (
              <div className={`text-xs mb-1 ${s.change30 <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {arrow(s.change30)} {Math.abs(s.change30)} / 30d
              </div>
            )}
          </div>

          {s.data.length > 1 && (
            <LiftLineChart
              theme={theme}
              legend={false}
              beginAtZero={false}
              height="h-40"
              labels={s.labels}
              datasets={[{ label: 'Bodyweight', data: s.data, color: '#10b981' }]}
            />
          )}

          <button
            onClick={() => setShowList((v) => !v)}
            className="text-[11px] text-gray-500 hover:text-gray-300 mt-2"
          >
            {showList ? 'Hide entries' : `All ${entries.length} entries`}
          </button>
          {showList && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {entries
                .slice()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm num py-1">
                    <span className="text-gray-400">{fmtDate(e.date)}</span>
                    <span className="font-semibold">{e.weight} lb</span>
                    <button
                      onClick={() => onDelete(e.id)}
                      aria-label="Delete entry"
                      className="tap-sm min-h-0 text-red-400 text-xs px-2"
                    >
                      &#128465;
                    </button>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {logging && (
        <LogBodyweightModal
          initial={s.latest}
          onClose={() => setLogging(false)}
          onSave={(w, date) => {
            onLog(w, date)
            setLogging(false)
          }}
        />
      )}
    </div>
  )
}
