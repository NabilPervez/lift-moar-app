import { useMemo, useState } from 'react'
import Header from '../components/Header'
import Pill from '../components/Pill'
import NewExerciseModal from '../components/NewExerciseModal'

export default function ExerciseLibraryManager({ exercises, onCreate, onDelete, onOpenExercise, onBack }) {
  const [showNew, setShowNew] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return exercises
    return exercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.equipment || '').toLowerCase().includes(q) ||
        e.muscles.some((m) => m.toLowerCase().includes(q)),
    )
  }, [exercises, query])

  return (
    <div className="pb-28">
      <Header title="Exercise Library" subtitle={`${exercises.length} exercises`} onBack={onBack} />
      <div className="px-4 space-y-3 mb-4">
        <button
          onClick={() => setShowNew(true)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl tap"
        >
          + Add Exercise
        </button>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, muscle, or equipment..."
          className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="px-4 space-y-2">
        {filtered.length === 0 && (
          <p className="text-gray-500 italic text-sm">No matches.</p>
        )}
        {filtered.map((ex) => (
          <div
            key={ex.id}
            className="bg-surface-800 rounded-xl flex items-stretch justify-between border border-white/5 overflow-hidden"
          >
            <button
              onClick={() => onOpenExercise?.(ex.id)}
              className="flex-1 text-left p-3 tap active:bg-white/5 transition-colors min-w-0"
            >
              <div className="font-semibold">
                {ex.name}
                {ex.equipment && (
                  <span className="text-gray-500 font-normal text-xs ml-2">{ex.equipment}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {ex.muscles.map((m) => (
                  <Pill key={m} label={m} styleKey={m} small />
                ))}
              </div>
            </button>
            <button
              aria-label={`Delete ${ex.name}`}
              onClick={() => onDelete(ex.id)}
              className="tap w-11 flex items-center justify-center text-red-400 hover:bg-red-500/10 border-l border-white/5 flex-shrink-0"
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
