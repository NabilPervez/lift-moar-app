import { useEffect, useMemo, useRef, useState } from 'react'
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
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import RestTimer from '../components/RestTimer'
import SwapModal from '../components/SwapModal'
import TargetingBars from '../components/TargetingBars'
import WorkoutExerciseCard from '../components/WorkoutExerciseCard'
import { exById, muscleLoad } from '../lib/exercises'
import { uid } from '../lib/storage'
import { playChime } from '../lib/audio'

const withKeys = (wo) => ({
  ...wo,
  exercises: wo.exercises.map((e) => (e.key ? e : { ...e, key: uid('we') })),
})

export default function ActiveWorkout({ workout, exercises, history, onFinish, onCancel }) {
  const [wo, setWo] = useState(() => withKeys(workout))
  const [swapKey, setSwapKey] = useState(null)
  const [restLeft, setRestLeft] = useState(0)
  const [restTotal, setRestTotal] = useState(90)
  const [flash, setFlash] = useState(false)
  const timerRef = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    if (restLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    timerRef.current = setInterval(() => {
      setRestLeft((v) => {
        if (v <= 1) {
          clearInterval(timerRef.current)
          playChime()
          setFlash(true)
          setTimeout(() => setFlash(false), 950)
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restLeft > 0])

  const getPrev = (exerciseId, setIndex) => {
    for (let i = history.length - 1; i >= 0; i--) {
      const ex = history[i].exercises.find((e) => e.exerciseId === exerciseId)
      if (ex && ex.sets[setIndex] && ex.sets[setIndex].completed) return ex.sets[setIndex]
    }
    return null
  }

  const updateSet = (eIdx, sIdx, field, value) => {
    setWo((w) => ({
      ...w,
      exercises: w.exercises.map((ex, i) =>
        i !== eIdx
          ? ex
          : { ...ex, sets: ex.sets.map((s, j) => (j !== sIdx ? s : { ...s, [field]: value })) },
      ),
    }))
  }

  const toggleComplete = (eIdx, sIdx) => {
    setWo((w) => {
      const ex = w.exercises[eIdx]
      const set = ex.sets[sIdx]
      const nowComplete = !set.completed
      const next = {
        ...w,
        exercises: w.exercises.map((e, i) =>
          i !== eIdx
            ? e
            : {
                ...e,
                sets: e.sets.map((s, j) => (j !== sIdx ? s : { ...s, completed: nowComplete })),
              },
        ),
      }
      if (nowComplete) {
        setRestTotal(ex.rest || 90)
        setRestLeft(ex.rest || 90)
      }
      return next
    })
  }

  const addSet = (eIdx) =>
    setWo((w) => ({
      ...w,
      exercises: w.exercises.map((e, i) =>
        i !== eIdx
          ? e
          : { ...e, sets: [...e.sets, { weight: '', reps: '', rpe: '', completed: false }] },
      ),
    }))
  const removeSet = (eIdx, sIdx) =>
    setWo((w) => ({
      ...w,
      exercises: w.exercises.map((e, i) =>
        i !== eIdx ? e : { ...e, sets: e.sets.filter((_, j) => j !== sIdx) },
      ),
    }))

  const doSwap = (newEx) => {
    setWo((w) => ({
      ...w,
      exercises: w.exercises.map((e) =>
        e.key !== swapKey ? e : { ...e, exerciseId: newEx.id, name: newEx.name, muscles: newEx.muscles },
      ),
    }))
    setSwapKey(null)
  }

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    setWo((w) => {
      const from = w.exercises.findIndex((e) => e.key === active.id)
      const to = w.exercises.findIndex((e) => e.key === over.id)
      if (from < 0 || to < 0) return w
      return { ...w, exercises: arrayMove(w.exercises, from, to) }
    })
  }

  const muscleSummary = useMemo(() => muscleLoad(wo.exercises, exercises), [wo, exercises])
  const swapTarget = swapKey && wo.exercises.find((e) => e.key === swapKey)

  return (
    <div className="pb-32">
      {flash && (
        <div className="fixed inset-0 z-50 bg-emerald-400 flash-cue pointer-events-none"></div>
      )}
      <div className="px-4 pt-6 pb-3 safe-top sticky top-0 bg-surface z-20 border-b border-white/5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-black tracking-tight text-blue-400">{wo.name}</h2>
          <button onClick={onCancel} className="tap text-red-400 font-semibold text-sm">
            Cancel
          </button>
        </div>
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Targeting
        </div>
        <TargetingBars items={muscleSummary} limit={10} labelWidth="w-20" />
      </div>

      <div className="px-4 mt-4">
        <p className="text-[11px] text-gray-500 mb-3">
          Hold the <span className="text-gray-400 font-bold">⋮⋮</span> handle to drag an exercise into
          a new order.
        </p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext
            items={wo.exercises.map((e) => e.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {wo.exercises.map((exercise, eIdx) => (
                <WorkoutExerciseCard
                  key={exercise.key}
                  exercise={exercise}
                  eIdx={eIdx}
                  exercises={exercises}
                  getPrev={getPrev}
                  updateSet={updateSet}
                  toggleComplete={toggleComplete}
                  addSet={addSet}
                  removeSet={removeSet}
                  onSwap={setSwapKey}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <div className="px-4 mt-6">
        <button
          onClick={() => onFinish(wo)}
          className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-transform text-white font-bold py-4 rounded-xl shadow-lg text-lg"
        >
          Finish Workout
        </button>
      </div>

      {restLeft > 0 && (
        <RestTimer
          seconds={restLeft}
          total={restTotal}
          onDismiss={() => setRestLeft(0)}
          onAdjust={(d) => setRestLeft((v) => Math.max(0, v + d))}
        />
      )}

      {swapTarget && (
        <SwapModal
          exercise={
            exById(exercises, swapTarget.exerciseId) || {
              name: swapTarget.name,
              muscles: swapTarget.muscles,
              id: swapTarget.exerciseId,
            }
          }
          exercises={exercises}
          onSelect={doSwap}
          onClose={() => setSwapKey(null)}
        />
      )}
    </div>
  )
}
