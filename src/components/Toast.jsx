import { useEffect } from 'react'

/**
 * Transient bottom toast with an optional action (used for "Deleted · Undo").
 * `toast` is { id, message, actionLabel?, onAction? } or null.
 */
export default function Toast({ toast, onDismiss, bottomOffset = 0 }) {
  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(onDismiss, 5000)
    return () => clearTimeout(t)
  }, [toast, onDismiss])

  if (!toast) return null

  return (
    <div
      className="fixed left-0 right-0 z-40 px-4 pointer-events-none"
      style={{ bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom, 0px) + 12px)` }}
    >
      <div className="max-w-md mx-auto pointer-events-auto slide-up bg-surface-700 border border-white/10 shadow-2xl shadow-black/50 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{toast.message}</span>
        {toast.actionLabel && (
          <button
            onClick={() => {
              toast.onAction?.()
              onDismiss()
            }}
            className="tap-sm text-sm font-bold text-blue-400 hover:text-blue-300 flex-shrink-0 min-h-0 px-1"
          >
            {toast.actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
