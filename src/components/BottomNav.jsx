const ITEMS = [
  { key: 'schedule', label: 'Schedule', icon: '▦' },
  { key: 'templates', label: 'Templates', icon: '☰' },
  { key: 'history', label: 'History', icon: '⏱' },
  { key: 'dashboard', label: 'Progress', icon: '↗' },
]

export default function BottomNav({ view, setView }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 bg-surface-800/95 backdrop-blur border-t border-white/5 safe-bottom z-30"
    >
      <div className="max-w-md mx-auto grid grid-cols-4">
        {ITEMS.map((it) => (
          <button
            key={it.key}
            aria-label={it.label}
            onClick={() => setView(it.key)}
            className={`tap flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
              view === it.key ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            <span className="text-lg leading-none">{it.icon}</span>
            <span className="text-[11px] font-semibold tracking-wide">{it.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
