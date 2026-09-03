import { useState } from 'react'
import Header from '../components/Header'
import TemplateSummaryCard from '../components/TemplateSummaryCard'

export default function TemplatePickerPage({
  day,
  currentId,
  userTemplates,
  premadeTemplates,
  exercises,
  onAssign,
  onClose,
}) {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const match = (t) =>
    !query || t.name.toLowerCase().includes(query) || (t.theme || '').toLowerCase().includes(query)

  const users = userTemplates.filter(match)
  const premade = premadeTemplates.filter(match)

  const pick = (id) => {
    onAssign(day, id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 bg-surface overflow-y-auto screen-fade">
      <div className="max-w-md mx-auto min-h-screen pb-16">
        <Header title={`Assign · ${day}`} subtitle="Pick a workout for this day" onBack={onClose} />

        <div className="px-4">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search workouts..."
            className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={() => pick(null)}
            className={`w-full text-left px-4 py-4 rounded-2xl mb-6 border tap ${
              currentId == null
                ? 'border-blue-500/40 bg-blue-500/5 text-blue-300'
                : 'border-white/5 bg-surface-800 text-gray-400'
            }`}
          >
            <span className="font-semibold italic">Rest day</span>
          </button>

          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">
              Your Templates
            </h2>
            <span className="text-xs text-gray-600 num">{users.length}</span>
          </div>
          <div className="space-y-3 mb-8">
            {users.length === 0 && (
              <p className="text-gray-600 italic text-sm">No matching templates.</p>
            )}
            {users.map((t) => (
              <TemplateSummaryCard
                key={t.id}
                template={t}
                exercises={exercises}
                onClick={() => pick(t.id)}
                actions={
                  currentId === t.id ? (
                    <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full self-start">
                      CURRENT
                    </span>
                  ) : null
                }
              />
            ))}
          </div>

          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">Pre-Made</h2>
            <span className="text-xs text-gray-600 num">{premade.length}</span>
          </div>
          <div className="space-y-3">
            {premade.length === 0 && (
              <p className="text-gray-600 italic text-sm">No matching workouts.</p>
            )}
            {premade.map((t) => (
              <TemplateSummaryCard
                key={t.id}
                template={t}
                exercises={exercises}
                onClick={() => pick(t.id)}
                actions={
                  currentId === t.id ? (
                    <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full self-start">
                      CURRENT
                    </span>
                  ) : null
                }
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
