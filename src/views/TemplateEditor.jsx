import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Header from '../components/Header'
import Pill from '../components/Pill'
import ExercisePickerModal from '../components/ExercisePickerModal'
import { exById } from '../lib/exercises'
import { uid } from '../lib/storage'

const REST_OPTIONS = [30, 45, 60, 90, 120, 150]

function SortableRow({ id, item, exercises, updateField, removeExercise, onOpenExercise }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  }
  const ex = exById(exercises, item.exerciseId) || { name: 'Unknown', muscles: [] }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-surface-800 rounded-2xl p-4 border ${
        isDragging ? 'border-blue-500/50 opacity-90' : 'border-white/5'
      }`}
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className="flex items-start gap-1.5 min-w-0">
          <button
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            aria-label={`Reorder ${ex.name}`}
            className="tap -ml-1 -mt-1 w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
          >
            <span className="text-lg leading-none">&#8942;&#8942;</span>
          </button>
          <div className="min-w-0">
            <button
              onClick={() => onOpenExercise?.(item.exerciseId)}
              className="font-bold text-left truncate hover:text-blue-300"
            >
              {ex.name}
            </button>
            <div className="flex flex-wrap gap-1 mt-1">
              {ex.muscles.map((m) => (
                <Pill key={m} label={m} styleKey={m} small />
              ))}
            </div>
          </div>
        </div>
        <button
          aria-label={`Remove ${ex.name}`}
          onClick={removeExercise}
          className="tap w-8 h-8 text-red-400 hover:text-red-300 flex-shrink-0"
        >
          &#10005;
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 uppercase font-semibold">Sets</label>
          <input
            type="number"
            inputMode="numeric"
            value={item.targetSets}
            onFocus={(e) => e.target.select()}
            onChange={(e) => updateField('targetSets', Math.max(1, Number(e.target.value) || 1))}
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
            onChange={(e) => updateField('reps', Math.max(1, Number(e.target.value) || 1))}
            className="w-full bg-surface-700 rounded-lg p-2 text-center num focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 uppercase font-semibold">Rest</label>
          <select
            value={item.rest}
            onChange={(e) => updateField('rest', Number(e.target.value))}
            className="w-full bg-surface-700 rounded-lg p-2 text-center num focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {REST_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r}s
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

export default function TemplateEditor({
  template,
  exercises,
  onSave,
  onCancel,
  onCreateExercise,
  onOpenExercise,
}) {
  const isNew = !template
  const [name, setName] = useState(template ? template.name : '')
  const [list, setList] = useState(() =>
    template ? template.exercises.map((e) => ({ ...e, _k: uid('row') })) : [],
  )
  const [showPicker, setShowPicker] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const addExercise = (exerciseId) => {
    setList((l) => [...l, { exerciseId, targetSets: 3, reps: 8, rest: 90, _k: uid('row') }])
    setShowPicker(false)
  }
  const removeExercise = (k) => setList((l) => l.filter((e) => e._k !== k))
  const updateField = (k, field, val) =>
    setList((l) => l.map((e) => (e._k === k ? { ...e, [field]: val } : e)))
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    setList((l) => {
      const from = l.findIndex((e) => e._k === active.id)
      const to = l.findIndex((e) => e._k === over.id)
      return from < 0 || to < 0 ? l : arrayMove(l, from, to)
    })
  }

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

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={list.map((e) => e._k)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {list.map((item) => (
                <SortableRow
                  key={item._k}
                  id={item._k}
                  item={item}
                  exercises={exercises}
                  updateField={(field, val) => updateField(item._k, field, val)}
                  removeExercise={() => removeExercise(item._k)}
                  onOpenExercise={onOpenExercise}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

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
              exercises: list.map(({ _k, ...rest }) => rest),
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
