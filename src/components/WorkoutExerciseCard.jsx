import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Pill from './Pill'
import { exById } from '../lib/exercises'

export default function WorkoutExerciseCard({
  exercise,
  eIdx,
  exercises,
  getPrev,
  updateSet,
  toggleComplete,
  addSet,
  removeSet,
  onSwap,
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.key })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  }

  const exMeta = exById(exercises, exercise.exerciseId) || {
    name: exercise.name,
    muscles: exercise.muscles || [],
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface-800 rounded-2xl p-4 shadow-lg border ${
        isDragging ? 'border-blue-500/50 opacity-90' : 'border-white/5'
      }`}
    >
      <div className="flex justify-between items-start mb-1 gap-2">
        <div className="flex items-start gap-1.5 min-w-0">
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${exMeta.name}`}
            className="tap -ml-1 -mt-1 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
          >
            <span className="text-lg leading-none">&#8942;&#8942;</span>
          </button>
          <h3 className="text-lg font-bold truncate">{exMeta.name}</h3>
        </div>
        <button
          onClick={() => onSwap(exercise.key)}
          aria-label={`Swap ${exMeta.name}`}
          className="tap text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-full flex-shrink-0"
        >
          &#8646; Swap
        </button>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {exMeta.muscles.map((m) => (
          <Pill key={m} label={m} styleKey={m} small />
        ))}
      </div>

      <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">
        <div className="col-span-1 text-center">Set</div>
        <div className="col-span-3 text-center">Prev</div>
        <div className="col-span-3 text-center">lbs</div>
        <div className="col-span-2 text-center">Reps</div>
        <div className="col-span-2 text-center">RPE</div>
        <div className="col-span-1 text-center"></div>
      </div>

      {exercise.sets.map((set, sIdx) => {
        const prev = getPrev(exercise.exerciseId, sIdx)
        const isDone = set.completed
        return (
          <div
            key={sIdx}
            className={`grid grid-cols-12 gap-2 items-center mb-2 py-1 rounded-lg ${
              isDone ? 'bg-emerald-500/10' : ''
            }`}
          >
            <div className="col-span-1 text-center font-bold num text-gray-400">{sIdx + 1}</div>
            <div className="col-span-3 text-center text-gray-500 text-xs num">
              {prev ? `${prev.weight}×${prev.reps}` : '—'}
            </div>
            <div className="col-span-3">
              <input
                type="number"
                inputMode="decimal"
                aria-label={`Weight for set ${sIdx + 1}`}
                className="w-full bg-surface-700 rounded-lg p-2 text-center num focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={prev ? String(prev.weight) : '0'}
                value={set.weight}
                onFocus={(e) => e.target.select()}
                onChange={(e) => updateSet(eIdx, sIdx, 'weight', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                inputMode="numeric"
                aria-label={`Reps for set ${sIdx + 1}`}
                className="w-full bg-surface-700 rounded-lg p-2 text-center num focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={String(exercise.reps || 6)}
                value={set.reps}
                onFocus={(e) => e.target.select()}
                onChange={(e) => updateSet(eIdx, sIdx, 'reps', e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                inputMode="numeric"
                aria-label={`RPE for set ${sIdx + 1}`}
                className="w-full bg-surface-700 rounded-lg p-2 text-center num focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="8"
                value={set.rpe}
                onFocus={(e) => e.target.select()}
                onChange={(e) => updateSet(eIdx, sIdx, 'rpe', e.target.value)}
              />
            </div>
            <div className="col-span-1 flex justify-center">
              <button
                aria-label={
                  isDone ? `Mark set ${sIdx + 1} incomplete` : `Mark set ${sIdx + 1} complete`
                }
                onClick={() => toggleComplete(eIdx, sIdx)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  isDone ? 'bg-emerald-500 text-white' : 'bg-surface-600 text-transparent'
                }`}
              >
                &#10003;
              </button>
            </div>
          </div>
        )
      })}

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => addSet(eIdx)}
          className="tap flex-1 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 py-2 rounded-lg"
        >
          + Add Set
        </button>
        {exercise.sets.length > 1 && (
          <button
            onClick={() => removeSet(eIdx, exercise.sets.length - 1)}
            className="tap flex-1 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 py-2 rounded-lg"
          >
            - Remove Set
          </button>
        )}
      </div>
    </div>
  )
}
