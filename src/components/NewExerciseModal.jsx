import { useState } from 'react'
import { MUSCLES, MUSCLE_STYLE } from '../lib/constants'
import { EQUIPMENT } from '../lib/exercises'
import { uid } from '../lib/storage'

export default function NewExerciseModal({ onCreate, onClose }) {
  const [name, setName] = useState('')
  const [equipment, setEquipment] = useState('Other')
  const [muscles, setMuscles] = useState([])
  const toggle = (m) =>
    setMuscles((ms) => (ms.includes(m) ? ms.filter((x) => x !== m) : [...ms, m]))
  const canSave = name.trim().length > 0 && muscles.length > 0
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="slide-up bg-surface-800 rounded-t-3xl w-full max-w-md p-5 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4"></div>
        <h3 className="font-bold text-lg mb-4">New Exercise</h3>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Exercise name"
          className="w-full bg-surface-700 rounded-xl px-4 py-3 mb-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Equipment
        </div>
        <select
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
          className="w-full bg-surface-700 rounded-xl px-4 py-3 mb-4 outline-none focus:ring-2 focus:ring-blue-500"
        >
          {EQUIPMENT.map((eq) => (
            <option key={eq} value={eq}>
              {eq}
            </option>
          ))}
        </select>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Target muscles
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          {MUSCLES.map((m) => {
            const active = muscles.includes(m)
            const st = MUSCLE_STYLE[m]
            return (
              <button
                key={m}
                onClick={() => toggle(m)}
                className={`px-3 py-2 rounded-full text-sm font-semibold ring-1 tap ${
                  active ? `${st.bg} ${st.text} ${st.ring}` : 'bg-surface-700 text-gray-500 ring-white/5'
                }`}
              >
                {m}
              </button>
            )
          })}
        </div>
        <button
          disabled={!canSave}
          onClick={() => onCreate({ id: uid('ex'), name: name.trim(), equipment, muscles })}
          className={`w-full font-bold py-4 rounded-xl ${
            canSave ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-surface-700 text-gray-600'
          }`}
        >
          Add to Library
        </button>
      </div>
    </div>
  )
}
