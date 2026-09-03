import { useEffect, useMemo, useRef, useState } from 'react'
import Pill from '../components/Pill'
import RestTimer from '../components/RestTimer'
import SwapModal from '../components/SwapModal'
import { MUSCLE_STYLE } from '../lib/constants'
import { exById } from '../lib/exercises'
import { playChime } from '../lib/audio'

export default function ActiveWorkout({ workout, exercises, history, onFinish, onCancel }) {
  const [wo, setWo] = useState(workout)
  const [swapIdx, setSwapIdx] = useState(null)
  const [restLeft, setRestLeft] = useState(0)
  const [restTotal, setRestTotal] = useState(90)
  const [flash, setFlash] = useState(false)
  const timerRef = useRef(null)

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

  const openSwap = (eIdx) => setSwapIdx(eIdx)
  const doSwap = (newEx) => {
    setWo((w) => ({
      ...w,
      exercises: w.exercises.map((e, i) =>
        i !== swapIdx ? e : { ...e, exerciseId: newEx.id, name: newEx.name, muscles: newEx.muscles },
      ),
    }))
    setSwapIdx(null)
  }

  const muscleSummary = useMemo(() => {
    const counts = {}
    wo.exercises.forEach((e) => {
      const ex = exById(exercises, e.exerciseId) || { muscles: e.muscles || [] }
      ;(ex.muscles || e.muscles || []).forEach((m) => {
        counts[m] = (counts[m] || 0) + 1
      })
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [wo, exercises])
  const maxCount = muscleSummary.length ? muscleSummary[0][1] : 1

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
        <div className="space-y-1">
          {muscleSummary.map(([m, count]) => {
            const st = MUSCLE_STYLE[m]
            return (
              <div key={m} className="flex items-center gap-2">
                <span className={`text-xs font-semibold w-20 flex-shrink-0 ${st.text}`}>{m}</span>
                <div className="flex-1 h-1.5 rounded-full bg-surface-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${st.dot}`}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  ></div>
                </div>
                <span className="num text-[10px] text-gray-500 w-4 text-right">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {wo.exercises.map((exercise, eIdx) => {
          const exMeta = exById(exercises, exercise.exerciseId) || {
            name: exercise.name,
            muscles: exercise.muscles || [],
          }
          return (
            <div key={eIdx} className="bg-surface-800 rounded-2xl p-4 shadow-lg border border-white/5">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-bold">{exMeta.name}</h3>
                <button
                  onClick={() => openSwap(eIdx)}
                  aria-label={`Swap ${exMeta.name}`}
                  className="tap text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 px-3 py-1.5 rounded-full flex-shrink-0"
                >
                  &#8646; Swap
                </button>
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {exMeta.muscles.map((m) => (
                  <Pill key={m} label={m} styleKey={m} small />
                ))}
              </div>

              <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                <div className="col-span-1 text-center">Set</div>
                <div className="col-span-3 text-center">Prev</div>
                <div className="col-span-3 text-center">lbs</div>
                <div className="col-span-2 text-center">Reps</div>
                <div className="col-span-2 text-center">RPE</div>
                <div className="col-span-1 text-center"></div>
              </div>

              {exercise.sets.map((set, sIdx) => {
                const prev = getPrev(exercise.exerciseId, sIdx)
                const isDone = set.completed
                return (
                  <div
                    key={sIdx}
                    className={`grid grid-cols-12 gap-2 items-center mb-2 py-1 rounded-lg ${
                      isDone ? 'bg-emerald-500/10' : ''
                    }`}
                  >
                    <div className="col-span-1 text-center font-bold num text-gray-400">
                      {sIdx + 1}
                    </div>
                    <div className="col-span-3 text-center text-gray-500 text-xs num">
                      {prev ? `${prev.weight}×${prev.reps}` : '—'}
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        inputMode="decimal"
                        aria-label={`Weight for set ${sIdx + 1}`}
                        className="w-full bg-surface-700 rounded-lg p-2 text-center num focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder={prev ? String(prev.weight) : '0'}
                        value={set.weight}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateSet(eIdx, sIdx, 'weight', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        aria-label={`Reps for set ${sIdx + 1}`}
                        className="w-full bg-surface-700 rounded-lg p-2 text-center num focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder={String(exercise.reps || 6)}
                        value={set.reps}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateSet(eIdx, sIdx, 'reps', e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        aria-label={`RPE for set ${sIdx + 1}`}
                        className="w-full bg-surface-700 rounded-lg p-2 text-center num focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="8"
                        value={set.rpe}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateSet(eIdx, sIdx, 'rpe', e.target.value)}
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <button
                        aria-label={
                          isDone
                            ? `Mark set ${sIdx + 1} incomplete`
                            : `Mark set ${sIdx + 1} complete`
                        }
                        onClick={() => toggleComplete(eIdx, sIdx)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          isDone ? 'bg-emerald-500 text-white' : 'bg-surface-600 text-transparent'
                        }`}
                      >
                        &#10003;
                      </button>
                    </div>
                  </div>
                )
              })}

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => addSet(eIdx)}
                  className="tap flex-1 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 py-2 rounded-lg"
                >
                  + Add Set
                </button>
                {exercise.sets.length > 1 && (
                  <button
                    onClick={() => removeSet(eIdx, exercise.sets.length - 1)}
                    className="tap flex-1 text-xs font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 py-2 rounded-lg"
                  >
                    - Remove Set
                  </button>
                )}
              </div>
            </div>
          )
        })}
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

      {swapIdx !== null && (
        <SwapModal
          exercise={
            exById(exercises, wo.exercises[swapIdx].exerciseId) || {
              name: wo.exercises[swapIdx].name,
              muscles: wo.exercises[swapIdx].muscles,
              id: wo.exercises[swapIdx].exerciseId,
            }
          }
          exercises={exercises}
          onSelect={doSwap}
          onClose={() => setSwapIdx(null)}
        />
      )}
    </div>
  )
}
