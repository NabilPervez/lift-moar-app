import Pill from './Pill'

export default function SwapModal({ exercise, exercises, onSelect, onClose }) {
  const primary = exercise.muscles[0]
  const exact = exercises.filter((e) => e.id !== exercise.id && e.muscles[0] === primary)
  const related = exercises.filter(
    (e) =>
      e.id !== exercise.id &&
      e.muscles[0] !== primary &&
      e.muscles.some((m) => exercise.muscles.includes(m)),
  )
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="slide-up bg-surface-800 rounded-t-3xl w-full max-w-md p-5 h-[70vh] flex flex-col safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4 flex-shrink-0"></div>
        <h3 className="font-bold text-lg flex-shrink-0">Swap &quot;{exercise.name}&quot;</h3>
        <p className="text-gray-500 text-sm mb-3 flex-shrink-0">
          Same primary muscle: <span className="font-semibold text-gray-300">{primary}</span>
        </p>
        <div className="overflow-y-auto flex-1 space-y-4">
          <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Best matches
            </div>
            <div className="space-y-2">
              {exact.length === 0 && <p className="text-gray-600 italic text-sm">None found.</p>}
              {exact.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => onSelect(ex)}
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
            </div>
          </div>
          {related.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Related
              </div>
              <div className="space-y-2">
                {related.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => onSelect(ex)}
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
