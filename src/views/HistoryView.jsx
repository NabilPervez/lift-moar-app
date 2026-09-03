import { useState } from 'react'
import Header from '../components/Header'
import Pill from '../components/Pill'
import WorkoutDetailModal from '../components/WorkoutDetailModal'
import ConfirmButton from '../components/ConfirmButton'
import { exById } from '../lib/exercises'

export default function HistoryView({ history, exercises, onBack, onDeleteWorkout }) {
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
                <div
                  key={`${w.date}-${i}`}
                  className="bg-surface-800 rounded-2xl border border-white/5 flex items-stretch overflow-hidden"
                >
                  <button
                    onClick={() => setDetail(w)}
                    className="flex-1 text-left p-4 tap active:bg-white/5 transition-colors"
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
                  {onDeleteWorkout && (
                    <ConfirmButton
                      ariaLabel={`Delete ${w.name}`}
                      onConfirm={() => onDeleteWorkout(w)}
                      confirmLabel="Delete?"
                      className="tap w-12 flex items-center justify-center text-red-400 hover:bg-red-500/10 border-l border-white/5 flex-shrink-0"
                      armedClassName="tap w-16 text-xs font-bold flex items-center justify-center text-white bg-red-600 border-l border-white/5 flex-shrink-0"
                    >
                      &#128465;
                    </ConfirmButton>
                  )}
                </div>
              )
            })
        )}
      </div>

      {detail && (
        <WorkoutDetailModal
          workout={detail}
          exercises={exercises}
          onClose={() => setDetail(null)}
          onDelete={onDeleteWorkout}
        />
      )}
    </div>
  )
}
