import Header from '../components/Header'
import TemplateSummaryCard from '../components/TemplateSummaryCard'
import { DAYS } from '../lib/constants'

export default function TemplatesView({
  templates,
  premadeTemplates,
  exercises,
  schedule,
  onNew,
  onEdit,
  onDelete,
  onDuplicate,
  onManageExercises,
}) {
  return (
    <div className="pb-28">
      <Header title="Templates" subtitle="Build and manage your routines" />
      <div className="px-4 flex gap-2 mb-6">
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

      {/* ---------- User-made ---------- */}
      <div className="px-4 mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Your Templates</h2>
        <span className="text-xs text-gray-600 num">{templates.length}</span>
      </div>
      <div className="px-4 space-y-3 mb-8">
        {templates.length === 0 && (
          <p className="text-gray-500 italic text-sm">
            None yet — create one, or duplicate a pre-made workout below.
          </p>
        )}
        {templates.map((t) => {
          const days = DAYS.filter((d) => schedule[d] === t.id)
          return (
            <TemplateSummaryCard
              key={t.id}
              template={t}
              exercises={exercises}
              actions={
                <>
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
                </>
              }
              footer={
                days.length ? (
                  <div className="text-xs text-blue-400 font-semibold">
                    Scheduled: {days.join(', ')}
                  </div>
                ) : null
              }
            />
          )
        })}
      </div>

      {/* ---------- Pre-made ---------- */}
      <div className="px-4 mb-2 flex items-baseline justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Pre-Made</h2>
        <span className="text-xs text-gray-600 num">{premadeTemplates.length}</span>
      </div>
      <div className="px-4 space-y-3">
        {premadeTemplates.map((t) => (
          <TemplateSummaryCard
            key={t.id}
            template={t}
            exercises={exercises}
            footer={
              <button
                onClick={() => onDuplicate(t)}
                className="tap w-full text-sm font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 py-2.5 rounded-xl"
              >
                + Duplicate to my templates
              </button>
            }
          />
        ))}
      </div>
    </div>
  )
}
