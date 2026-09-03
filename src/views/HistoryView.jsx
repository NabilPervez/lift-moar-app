import { useState } from 'react'
import Header from '../components/Header'
import Pill from '../components/Pill'
import WorkoutDetailModal from '../components/WorkoutDetailModal'
import { exById } from '../lib/exercises'

export default function HistoryView({ history, exercises, onBack }) {
  const [detail, setDetail] = useState(null)

  return (
    <div className="pb-28">
      <Header title="History" subtitle={`${history.length} workouts logged`} onBack={onBack} />
      <div className="px-4 space-y-3">
        {history.length === 0 ? (
          <p className="text-gray-500 italic">No workouts logged yet.</p>
        ) : (
          history
            .slice()
            .reverse()
            .map((w, i) => {
              const totalSets = w.exercises.reduce(
                (s, e) => s + e.sets.filter((x) => x.completed).length,
                0,
              )
              const muscleSet = Array.from(
                new Set(
                  w.exercises.flatMap(
                    (e) =>
                      (exById(exercises, e.exerciseId) || { muscles: e.muscles || [] }).muscles ||
                      e.muscles ||
                      [],
                  ),
                ),
              )
              return (
                <button
                  key={i}
                  onClick={() => setDetail(w)}
                  className="w-full text-left bg-surface-800 p-4 rounded-2xl border border-white/5 tap active:scale-[0.99] transition-transform"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-lg">{w.name}</div>
                      <div className="text-gray-500 text-sm">
                        {new Date(w.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="num font-bold text-emerald-400">{totalSets}</div>
                      <div className="text-[10px] text-gray-500 uppercase">sets</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {muscleSet.slice(0, 6).map((m) => (
                      <Pill key={m} label={m} styleKey={m} small />
                    ))}
                  </div>
                </button>
              )
            })
        )}
      </div>

      {detail && (
        <WorkoutDetailModal workout={detail} exercises={exercises} onClose={() => setDetail(null)} />
      )}
    </div>
  )
}
