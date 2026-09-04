import { useState } from 'react'

const todayISO = () => new Date().toISOString().slice(0, 10)

export default function LogBodyweightModal({ initial, onSave, onClose }) {
  const [weight, setWeight] = useState(initial ? String(initial) : '')
  const [date, setDate] = useState(todayISO())
  const num = parseFloat(weight)
  const canSave = Number.isFinite(num) && num > 0

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="slide-up bg-surface-800 rounded-t-3xl w-full max-w-md p-5 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4" />
        <h3 className="font-bold text-lg mb-4">Log bodyweight</h3>

        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Weight (lb)</label>
        <input
          type="number"
          inputMode="decimal"
          autoFocus
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder="e.g. 182.5"
          className="w-full mt-1 mb-4 bg-surface-700 rounded-xl px-4 py-3 num text-lg outline-none focus:ring-2 focus:ring-blue-500"
        />

        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</label>
        <input
          type="date"
          value={date}
          max={todayISO()}
          onChange={(e) => setDate(e.target.value)}
          className="w-full mt-1 mb-5 bg-surface-700 rounded-xl px-4 py-3 num outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          disabled={!canSave}
          onClick={() => onSave(num, new Date(date + 'T12:00:00').toISOString())}
          className={`w-full font-bold py-4 rounded-xl ${
            canSave ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-surface-700 text-gray-600'
          }`}
        >
          Save
        </button>
      </div>
    </div>
  )
}
