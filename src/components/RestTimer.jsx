import { formatTime } from '../lib/audio'

/**
 * Rest countdown. Purely presentational — the parent derives `seconds` from a
 * wall-clock `restEndsAt` so it stays accurate across backgrounding / reloads.
 * Rendered docked just above the sticky Finish bar (no fixed positioning of its
 * own) so it never covers page content.
 */
export default function RestTimer({ seconds, total, onDismiss, onAdjust }) {
  const pct = total > 0 ? Math.max(0, Math.min(1, seconds / total)) : 0
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <div className="max-w-md mx-auto slide-up bg-surface-700/95 backdrop-blur rounded-2xl border border-blue-500/30 shadow-2xl shadow-black/50 p-3 flex items-center gap-3">
      <div className="relative w-14 h-14 flex-shrink-0">
        <svg viewBox="0 0 64 64" className="w-14 h-14 -rotate-90">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#232d42" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            className="ring-progress"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center num font-bold text-sm">
          {formatTime(seconds)}
        </div>
      </div>
      <div className="flex-1">
        <div className="text-sm font-bold text-blue-300">Rest Timer</div>
        <div className="flex gap-1.5 mt-1">
          <button
            onClick={() => onAdjust(-15)}
            className="tap-sm text-xs bg-surface-600 px-2 py-1 rounded-lg font-semibold min-h-0"
          >
            -15s
          </button>
          <button
            onClick={() => onAdjust(15)}
            className="tap-sm text-xs bg-surface-600 px-2 py-1 rounded-lg font-semibold min-h-0"
          >
            +15s
          </button>
        </div>
      </div>
      <button
        aria-label="Skip rest"
        onClick={onDismiss}
        className="tap text-xs font-bold text-gray-400 hover:text-white bg-surface-600 px-3 py-2 rounded-xl"
      >
        Skip
      </button>
    </div>
  )
}
