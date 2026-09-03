import Header from '../components/Header'
import Pill from '../components/Pill'
import { DAYS } from '../lib/constants'
import { exById } from '../lib/exercises'

export default function TemplatesView({
  templates,
  exercises,
  schedule,
  onNew,
  onEdit,
  onDelete,
  onManageExercises,
}) {
  return (
    <div className="pb-28">
      <Header title="Templates" subtitle="Build and manage your routines" />
      <div className="px-4 flex gap-2 mb-5">
        <button
          onClick={onNew}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl tap"
        >
          + New Template
        </button>
        <button
          onClick={onManageExercises}
          className="flex-1 bg-surface-700 hover:bg-surface-600 text-gray-200 font-bold py-3 rounded-xl tap"
        >
          Exercise Library
        </button>
      </div>
      <div className="px-4 space-y-3">
        {templates.length === 0 && (
          <p className="text-gray-500 italic">No templates yet. Create one to get started.</p>
        )}
        {templates.map((t) => {
          const days = DAYS.filter((d) => schedule[d] === t.id)
          const muscleSet = Array.from(
            new Set(
              t.exercises.flatMap(
                (e) => (exById(exercises, e.exerciseId) || { muscles: [] }).muscles,
              ),
            ),
          )
          return (
            <div key={t.id} className="bg-surface-800 rounded-2xl p-4 border border-white/5">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-lg">{t.name}</div>
                  <div className="text-gray-500 text-sm">
                    {t.exercises.length} exercises
                    {days.length ? ` · ${days.join(', ')}` : ''}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    aria-label={`Edit ${t.name}`}
                    onClick={() => onEdit(t)}
                    className="tap w-9 h-9 flex items-center justify-center text-blue-400 rounded-full hover:bg-white/5"
                  >
                    &#9998;
                  </button>
                  <button
                    aria-label={`Delete ${t.name}`}
                    onClick={() => onDelete(t.id)}
                    className="tap w-9 h-9 flex items-center justify-center text-red-400 rounded-full hover:bg-white/5"
                  >
                    &#128465;
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {muscleSet.map((m) => (
                  <Pill key={m} label={m} styleKey={m} small />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
