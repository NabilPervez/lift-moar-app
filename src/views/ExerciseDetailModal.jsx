import { useMemo, useState } from 'react'
import Pill from '../components/Pill'
import LiftLineChart from '../components/LiftLineChart'
import { exById } from '../lib/exercises'
import { exerciseStats, fmtDate } from '../lib/analytics'

export default function ExerciseDetailModal({ exerciseId, exercises, history, theme, onClose }) {
  const [metric, setMetric] = useState('weight') // 'weight' | 'e1rm'
  const meta = exById(exercises, exerciseId) || { name: 'Exercise', muscles: [] }
  const stats = useMemo(
    () => exerciseStats(history, exercises, exerciseId),
    [history, exercises, exerciseId],
  )

  const hasData = stats.sessionCount > 0

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="slide-up bg-surface-800 rounded-t-3xl w-full max-w-md p-5 max-h-[88vh] flex flex-col safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4 flex-shrink-0" />

        <div className="flex items-start justify-between gap-3 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="font-black text-xl tracking-tight truncate">{meta.name}</h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {meta.equipment && (
                <span className="text-gray-500 text-xs">{meta.equipment}</span>
              )}
              {meta.muscles.map((m) => (
                <Pill key={m} label={m} styleKey={m} small />
              ))}
            </div>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="tap text-gray-400 hover:text-white text-sm font-semibold flex-shrink-0"
          >
            Close
          </button>
        </div>

        {!hasData ? (
          <p className="text-gray-500 italic text-sm py-10 text-center">
            No logged sessions yet. Do this lift in a workout and it'll show up here.
          </p>
        ) : (
          <div className="overflow-y-auto flex-1 mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-700 rounded-xl p-3 text-center">
                <div className="num font-black text-lg">
                  {stats.bestSet ? `${stats.bestSet.weight}×${stats.bestSet.reps}` : '—'}
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide">best set</div>
              </div>
              <div className="bg-surface-700 rounded-xl p-3 text-center">
                <div className="num font-black text-lg text-amber-400">{stats.bestE1rm || '—'}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide">est. 1RM</div>
              </div>
              <div className="bg-surface-700 rounded-xl p-3 text-center">
                <div className="num font-black text-lg">{stats.sessionCount}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wide">sessions</div>
              </div>
            </div>

            <div className="bg-surface-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-sm">Progression</div>
                <div className="flex bg-surface-800 rounded-lg p-0.5">
                  {[
                    ['weight', 'Top weight'],
                    ['e1rm', 'Est. 1RM'],
                  ].map(([k, label]) => (
                    <button
                      key={k}
                      onClick={() => setMetric(k)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold ${
                        metric === k ? 'bg-blue-600 text-white' : 'text-gray-400'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <LiftLineChart
                theme={theme}
                legend={false}
                beginAtZero={false}
                height="h-48"
                labels={stats.series.labels}
                datasets={[
                  {
                    label: metric === 'weight' ? 'Top weight' : 'Est. 1RM',
                    data: metric === 'weight' ? stats.series.weight : stats.series.e1rm,
                  },
                ]}
              />
            </div>

            <div>
              <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Session history
              </div>
              <div className="bg-surface-700 rounded-2xl divide-y divide-white/5">
                {stats.sessions
                  .slice()
                  .reverse()
                  .map((s, i) => (
                    <div key={i} className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{fmtDate(s.date)}</span>
                        <span className="text-gray-500 text-xs num">
                          {s.volume.toLocaleString()} lb · e1RM {s.e1rm}
                        </span>
                      </div>
                      <div className="text-gray-400 text-xs num mt-1">
                        {s.sets.map((set, j) => (
                          <span key={j}>
                            {j > 0 && '  ·  '}
                            {set.weight}×{set.reps}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
