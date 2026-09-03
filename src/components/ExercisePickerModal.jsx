import { useState } from 'react'
import Pill from './Pill'

export default function ExercisePickerModal({ exercises, onSelect, onClose, onCreateExercise, title }) {
  const [query, setQuery] = useState('')
  const filtered = exercises.filter((e) =>
    e.name.toLowerCase().includes(query.toLowerCase()),
  )
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="slide-up bg-surface-800 rounded-t-3xl w-full max-w-md p-5 h-[75vh] flex flex-col safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4 flex-shrink-0"></div>
        <h3 className="font-bold text-lg mb-3 flex-shrink-0">{title || 'Choose an exercise'}</h3>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises..."
          className="w-full bg-surface-700 rounded-xl px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0"
        />
        <div className="overflow-y-auto flex-1 space-y-2">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onSelect(ex.id)}
              className="w-full text-left bg-surface-700 hover:bg-surface-600 rounded-xl p-3 tap"
            >
              <div className="font-semibold">{ex.name}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {ex.muscles.map((m) => (
                  <Pill key={m} label={m} styleKey={m} small />
                ))}
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-gray-500 italic text-sm">No matches.</p>}
        </div>
        {onCreateExercise && (
          <button
            onClick={onCreateExercise}
            className="mt-3 flex-shrink-0 w-full border-2 border-dashed border-white/10 text-gray-400 hover:text-white font-semibold py-3 rounded-xl tap"
          >
            + Create New Exercise
          </button>
        )}
      </div>
    </div>
  )
}
