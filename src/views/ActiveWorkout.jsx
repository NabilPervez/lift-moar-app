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
import ConfirmButton from '../components/ConfirmButton'
import WorkoutSummary from './WorkoutSummary'
import { exById, muscleLoad } from '../lib/exercises'
import { computeWorkoutSummary } from '../lib/analytics'
import { uid } from '../lib/storage'
import { getSettings, patchSettings } from '../lib/settings'
import { playChime } from '../lib/audio'
import { buzz, HAPTIC } from '../lib/haptics'
import { ensureNotifyPermission, notifyRestOver } from '../lib/notify'

const normalize = (s) => ({
  id: s.id || uid('wo'),
  name: s.name,
  templateId: s.templateId || null,
  startedAt: s.startedAt || Date.now(),
  notes: s.notes || '',
  restEndsAt: s.restEndsAt || null,
  restTotal: s.restTotal || 90,
  exercises: s.exercises.map((e) => ({
    ...e,
    key: e.key || uid('we'),
    notes: e.notes || '',
  })),
})

export default function ActiveWorkout({ session, exercises, history, onChange, onFinish, onCancel, onOpenExercise }) {
  const [wo, setWo] = useState(() => normalize(session))
  const [swapKey, setSwapKey] = useState(null)
  const [now, setNow] = useState(() => Date.now())
  const [flash, setFlash] = useState(false)
  const [showNote, setShowNote] = useState(!!session.notes)
  const [summary, setSummary] = useState(null)
  const [dragTip, setDragTip] = useState(() => !getSettings().dragTipSeen)
  const firedRef = useRef(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // persist every change so a reload / crash resumes the session
  useEffect(() => {
    if (!summary) onChange(wo)
  }, [wo, summary, onChange])

  // visual countdown ticker — only runs while a rest is pending
  useEffect(() => {
    if (!wo.restEndsAt) return undefined
    setNow(Date.now())
    const i = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(i)
  }, [wo.restEndsAt])

  // fire the "rest over" cue exactly when it ends (survives backgrounding: the
  // timeout fires on unthrottle, and the notification lands if the tab's hidden)
  useEffect(() => {
    if (!wo.restEndsAt || firedRef.current === wo.restEndsAt) return undefined
    const ms = wo.restEndsAt - Date.now()
    if (ms <= 0) {
      firedRef.current = wo.restEndsAt
      setWo((w) => ({ ...w, restEndsAt: null }))
      return undefined
    }
    const target = wo.restEndsAt
    const t = setTimeout(() => {
      firedRef.current = target
      playChime()
      buzz([0, 90, 60, 90])
      notifyRestOver(`${wo.name} — next set`)
      setFlash(true)
      setTimeout(() => setFlash(false), 900)
      setWo((w) => (w.restEndsAt === target ? { ...w, restEndsAt: null } : w))
    }, ms)
    return () => clearTimeout(t)
  }, [wo.restEndsAt, wo.name])

  const remaining = wo.restEndsAt ? Math.max(0, Math.ceil((wo.restEndsAt - now) / 1000)) : 0

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

  const updateExercise = (eIdx, field, value) =>
    setWo((w) => ({
      ...w,
      exercises: w.exercises.map((e, i) => (i !== eIdx ? e : { ...e, [field]: value })),
    }))

  const startRest = (rest) => {
    if (getSettings().notifyAsked !== true) {
      patchSettings({ notifyAsked: true })
      ensureNotifyPermission()
    }
    firedRef.current = null
    setWo((w) => ({ ...w, restTotal: rest || 90, restEndsAt: Date.now() + (rest || 90) * 1000 }))
  }

  const toggleComplete = (eIdx, sIdx) => {
    setWo((w) => {
      const ex = w.exercises[eIdx]
      const nowComplete = !ex.sets[sIdx].completed
      const next = {
        ...w,
        exercises: w.exercises.map((e, i) =>
          i !== eIdx
            ? e
            : { ...e, sets: e.sets.map((s, j) => (j !== sIdx ? s : { ...s, completed: nowComplete })) },
        ),
      }
      return next
    })
    const ex = wo.exercises[eIdx]
    if (!ex.sets[sIdx].completed) {
      buzz(HAPTIC.complete)
      startRest(ex.rest || 90)
    }
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

  const dismissDragTip = () => {
    setDragTip(false)
    patchSettings({ dragTipSeen: true })
  }

  const muscleSummary = useMemo(() => muscleLoad(wo.exercises, exercises), [wo, exercises])
  const swapTarget = swapKey && wo.exercises.find((e) => e.key === swapKey)

  const finish = () => {
    const named = {
      ...wo,
      exercises: wo.exercises.map((e) => {
        const meta = exById(exercises, e.exerciseId)
        return { ...e, name: meta ? meta.name : e.name, muscles: meta ? meta.muscles : e.muscles }
      }),
    }
    setSummary(computeWorkoutSummary(named, history, wo.startedAt))
    setWo(named)
  }

  if (summary) {
    return (
      <WorkoutSummary
        summary={summary}
        onDone={() =>
          onFinish({
            id: wo.id,
            name: wo.name,
            notes: wo.notes,
            durationMs: Date.now() - wo.startedAt,
            exercises: wo.exercises,
          })
        }
      />
    )
  }

  return (
    <div className="pb-40">
      {flash && (
        <div className="fixed top-0 inset-x-0 h-1.5 bg-emerald-400 z-50 flash-cue pointer-events-none" />
      )}

      <div className="px-4 pt-6 pb-3 safe-top sticky top-0 bg-surface z-20 border-b border-white/5">
        <div className="flex justify-between items-center mb-3 gap-2">
          <h2 className="text-xl font-black tracking-tight text-blue-400 truncate">{wo.name}</h2>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setShowNote((v) => !v)}
              aria-label="Session note"
              className={`tap w-8 h-8 flex items-center justify-center rounded-full ${
                showNote || wo.notes ? 'text-blue-400' : 'text-gray-500'
              }`}
            >
              &#9998;
            </button>
            <ConfirmButton
              onConfirm={onCancel}
              confirmLabel="Discard?"
              className="tap text-red-400 font-semibold text-sm px-2"
              armedClassName="tap text-white bg-red-600 font-bold text-xs px-2 py-1 rounded-lg"
            >
              Cancel
            </ConfirmButton>
          </div>
        </div>
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
          Targeting
        </div>
        <TargetingBars items={muscleSummary} limit={10} labelWidth="w-20" />
        {showNote && (
          <textarea
            value={wo.notes}
            onChange={(e) => setWo((w) => ({ ...w, notes: e.target.value }))}
            placeholder="Session notes (sleep, energy, gym, bodyweight…)"
            rows={2}
            className="w-full bg-surface-700 rounded-lg p-2 text-sm mt-3 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        )}
      </div>

      <div className="px-4 mt-4">
        {dragTip && wo.exercises.length > 1 && (
          <div className="flex items-center justify-between gap-2 text-[11px] text-gray-500 mb-3 bg-surface-800 border border-white/5 rounded-lg px-3 py-2">
            <span>
              Tip: hold the <span className="text-gray-400 font-bold">⋮⋮</span> handle to reorder. Tap
              a lift name for its history.
            </span>
            <button onClick={dismissDragTip} aria-label="Dismiss tip" className="text-gray-400 font-bold px-1">
              &times;
            </button>
          </div>
        )}
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
                  updateExercise={updateExercise}
                  toggleComplete={toggleComplete}
                  addSet={addSet}
                  removeSet={removeSet}
                  onSwap={setSwapKey}
                  onOpenExercise={onOpenExercise}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* sticky bottom bar: rest timer (when resting) sits above the Finish button */}
      <div className="fixed bottom-0 inset-x-0 z-30 px-4 pb-3 pt-2 bg-gradient-to-t from-surface via-surface to-transparent safe-bottom">
        {remaining > 0 && (
          <div className="mb-2">
            <RestTimer
              seconds={remaining}
              total={wo.restTotal}
              onDismiss={() => setWo((w) => ({ ...w, restEndsAt: null }))}
              onAdjust={(d) =>
                setWo((w) => {
                  if (!w.restEndsAt) return w
                  firedRef.current = null
                  return { ...w, restEndsAt: Math.max(Date.now(), w.restEndsAt + d * 1000) }
                })
              }
            />
          </div>
        )}
        <button
          onClick={finish}
          className="max-w-md mx-auto w-full block bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-transform text-white font-bold py-4 rounded-xl shadow-lg text-lg"
        >
          Finish Workout
        </button>
      </div>

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
