import Pill from './Pill'
import { exById } from '../lib/exercises'
import { formatDuration } from '../lib/analytics'

export default function WorkoutDetailModal({
  workout,
  exercises,
  onClose,
  onDelete,
  onRepeat,
  onOpenExercise,
}) {
  if (!workout) return null

  const date = new Date(workout.date).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const completedSets = workout.exercises.reduce(
    (n, e) => n + e.sets.filter((s) => s.completed).length,
    0,
  )
  const volume = workout.exercises.reduce(
    (v, e) =>
      v +
      e.sets.reduce(
        (sv, s) =>
          sv + (s.completed ? (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0) : 0),
        0,
      ),
    0,
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="slide-up bg-surface-800 rounded-t-3xl w-full max-w-md p-5 max-h-[90vh] flex flex-col safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4 flex-shrink-0"></div>

        <div className="flex items-start justify-between gap-3 flex-shrink-0">
          <div>
            <h3 className="font-black text-xl tracking-tight">{workout.name}</h3>
            <p className="text-gray-500 text-sm mt-0.5">
              {date}
              {workout.durationMs ? ` · ${formatDuration(workout.durationMs)}` : ''}
            </p>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="tap text-gray-400 hover:text-white text-sm font-semibold"
          >
            Close
          </button>
        </div>

        <div className="flex gap-4 mt-3 mb-4 flex-shrink-0">
          <div>
            <div className="num font-bold text-emerald-400">{completedSets}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">sets done</div>
          </div>
          <div>
            <div className="num font-bold">{Math.round(volume).toLocaleString()}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">lb volume</div>
          </div>
          <div>
            <div className="num font-bold">{workout.exercises.length}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wide">exercises</div>
          </div>
        </div>

        {workout.notes && (
          <div className="bg-surface-700 rounded-xl p-3 text-sm text-gray-300 mb-3 flex-shrink-0 whitespace-pre-wrap">
            {workout.notes}
          </div>
        )}

        <div className="overflow-y-auto flex-1 space-y-3">
          {workout.exercises.map((ex, i) => {
            const meta = exById(exercises, ex.exerciseId) || { name: ex.name, muscles: ex.muscles || [] }
            return (
              <div key={i} className="bg-surface-700 rounded-2xl p-4">
                <button
                  onClick={() => onOpenExercise?.(ex.exerciseId)}
                  className="font-bold text-left hover:text-blue-300"
                >
                  {meta.name}
                </button>
                <div className="flex flex-wrap gap-1 mt-1 mb-3">
                  {(meta.muscles || []).map((m) => (
                    <Pill key={m} label={m} styleKey={m} small />
                  ))}
                </div>
                {ex.notes && (
                  <div className="text-xs text-gray-400 mb-2 whitespace-pre-wrap">{ex.notes}</div>
                )}

                <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  <div className="col-span-2 text-center">Set</div>
                  <div className="col-span-4 text-center">Weight</div>
                  <div className="col-span-3 text-center">Reps</div>
                  <div className="col-span-3 text-center">RPE</div>
                </div>
                {ex.sets.map((s, j) => (
                  <div
                    key={j}
                    className={`grid grid-cols-12 gap-2 items-center py-1 rounded-lg num text-sm ${
                      s.completed ? 'bg-emerald-500/10' : 'opacity-40'
                    }`}
                  >
                    <div className="col-span-2 text-center font-bold text-gray-400">{j + 1}</div>
                    <div className="col-span-4 text-center">{s.weight === '' || s.weight == null ? '—' : `${s.weight} lb`}</div>
                    <div className="col-span-3 text-center">{s.reps === '' || s.reps == null ? '—' : s.reps}</div>
                    <div className="col-span-3 text-center">{s.rpe === '' || s.rpe == null ? '—' : s.rpe}</div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        <div className="flex gap-2 pt-3 flex-shrink-0">
          {onRepeat && (
            <button
              onClick={() => {
                onRepeat(workout)
                onClose()
              }}
              className="tap flex-1 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 py-3 rounded-xl"
            >
              &#8635; Repeat
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => {
                onDelete(workout)
                onClose()
              }}
              className="tap flex-1 text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 py-3 rounded-xl"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
