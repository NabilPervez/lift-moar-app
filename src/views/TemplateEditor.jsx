import { useState } from 'react'
import Header from '../components/Header'
import Pill from '../components/Pill'
import ExercisePickerModal from '../components/ExercisePickerModal'
import { exById } from '../lib/exercises'
import { uid } from '../lib/storage'

export default function TemplateEditor({ template, exercises, onSave, onCancel, onCreateExercise }) {
  const isNew = !template
  const [name, setName] = useState(template ? template.name : '')
  const [list, setList] = useState(template ? template.exercises.map((e) => ({ ...e })) : [])
  const [showPicker, setShowPicker] = useState(false)

  const addExercise = (exerciseId) => {
    setList((l) => [...l, { exerciseId, targetSets: 3, reps: 8, rest: 90 }])
    setShowPicker(false)
  }
  const removeExercise = (idx) => setList((l) => l.filter((_, i) => i !== idx))
  const updateField = (idx, field, val) =>
    setList((l) => l.map((e, i) => (i === idx ? { ...e, [field]: val } : e)))
  const move = (idx, dir) =>
    setList((l) => {
      const arr = [...l]
      const j = idx + dir
      if (j < 0 || j >= arr.length) return arr
      ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
      return arr
    })

  const canSave = name.trim().length > 0 && list.length > 0

  return (
    <div className="pb-28">
      <Header title={isNew ? 'New Template' : 'Edit Template'} onBack={onCancel} />
      <div className="px-4 space-y-5">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Template name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push Day"
            className="w-full mt-1 bg-surface-800 border border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
          />
        </div>

        <div className="space-y-3">
          {list.map((item, idx) => {
            const ex = exById(exercises, item.exerciseId) || { name: 'Unknown', muscles: [] }
            return (
              <div key={idx} className="bg-surface-800 rounded-2xl p-4 border border-white/5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold">{ex.name}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ex.muscles.map((m) => (
                        <Pill key={m} label={m} styleKey={m} small />
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      aria-label="Move up"
                      onClick={() => move(idx, -1)}
                      className="tap w-8 h-8 text-gray-500 hover:text-white"
                    >
                      &#8593;
                    </button>
                    <button
                      aria-label="Move down"
                      onClick={() => move(idx, 1)}
                      className="tap w-8 h-8 text-gray-500 hover:text-white"
                    >
                      &#8595;
                    </button>
                    <button
                      aria-label={`Remove ${ex.name}`}
                      onClick={() => removeExercise(idx)}
                      className="tap w-8 h-8 text-red-400 hover:text-red-300"
                    >
                      &#10005;
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-semibold">Sets</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={item.targetSets}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        updateField(idx, 'targetSets', Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-full bg-surface-700 rounded-lg p-2 text-center num focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-semibold">Reps</label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={item.reps}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) =>
                        updateField(idx, 'reps', Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-full bg-surface-700 rounded-lg p-2 text-center num focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-semibold">Rest</label>
                    <select
                      value={item.rest}
                      onChange={(e) => updateField(idx, 'rest', Number(e.target.value))}
                      className="w-full bg-surface-700 rounded-lg p-2 text-center num focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value={30}>30s</option>
                      <option value={45}>45s</option>
                      <option value={60}>60s</option>
                      <option value={90}>90s</option>
                      <option value={120}>120s</option>
                      <option value={150}>150s</option>
                    </select>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <button
          onClick={() => setShowPicker(true)}
          className="w-full border-2 border-dashed border-white/10 text-gray-400 hover:text-white hover:border-white/20 font-semibold py-3 rounded-xl tap"
        >
          + Add Exercise
        </button>

        <button
          disabled={!canSave}
          onClick={() =>
            onSave({
              id: template ? template.id : uid('tmpl'),
              name: name.trim(),
              exercises: list,
            })
          }
          className={`w-full font-bold py-4 rounded-xl text-lg ${
            canSave ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-surface-700 text-gray-600'
          }`}
        >
          Save Template
        </button>
      </div>

      {showPicker && (
        <ExercisePickerModal
          exercises={exercises}
          onSelect={addExercise}
          onClose={() => setShowPicker(false)}
          onCreateExercise={onCreateExercise}
        />
      )}
    </div>
  )
}
