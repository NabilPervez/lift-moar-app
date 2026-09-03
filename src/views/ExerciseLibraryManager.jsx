import { useState } from 'react'
import Header from '../components/Header'
import Pill from '../components/Pill'
import NewExerciseModal from '../components/NewExerciseModal'

export default function ExerciseLibraryManager({ exercises, onCreate, onDelete, onBack }) {
  const [showNew, setShowNew] = useState(false)
  return (
    <div className="pb-28">
      <Header title="Exercise Library" subtitle={`${exercises.length} exercises`} onBack={onBack} />
      <div className="px-4 mb-4">
        <button
          onClick={() => setShowNew(true)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl tap"
        >
          + Add Exercise
        </button>
      </div>
      <div className="px-4 space-y-2">
        {exercises.map((ex) => (
          <div
            key={ex.id}
            className="bg-surface-800 rounded-xl p-3 flex items-center justify-between border border-white/5"
          >
            <div>
              <div className="font-semibold">{ex.name}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {ex.muscles.map((m) => (
                  <Pill key={m} label={m} styleKey={m} small />
                ))}
              </div>
            </div>
            <button
              aria-label={`Delete ${ex.name}`}
              onClick={() => onDelete(ex.id)}
              className="tap w-9 h-9 flex items-center justify-center text-red-400 hover:bg-white/5 rounded-full flex-shrink-0"
            >
              &#128465;
            </button>
          </div>
        ))}
      </div>
      {showNew && (
        <NewExerciseModal
          onClose={() => setShowNew(false)}
          onCreate={(ex) => {
            onCreate(ex)
            setShowNew(false)
          }}
        />
      )}
    </div>
  )
}
