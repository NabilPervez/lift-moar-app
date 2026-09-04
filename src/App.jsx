import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import BottomNav from './components/BottomNav'
import NewExerciseModal from './components/NewExerciseModal'
import Toast from './components/Toast'
import A2HSBanner from './components/A2HSBanner'
import ScheduleView from './views/ScheduleView'
import TemplatesView from './views/TemplatesView'
import TemplateEditor from './views/TemplateEditor'
import ExerciseLibraryManager from './views/ExerciseLibraryManager'
import HistoryView from './views/HistoryView'
import SettingsView from './views/SettingsView'
import ActiveWorkout from './views/ActiveWorkout'
import Onboarding from './components/Onboarding'
import { LS_KEYS, loadLS, saveLS, removeLS, uid } from './lib/storage'
import {
  DEFAULT_EXERCISES,
  exById,
  makeDefaultSchedule,
  makeDefaultTemplates,
} from './lib/exercises'
import { DEFAULT_HISTORY } from './lib/mockHistory'
import { PREMADE_TEMPLATES } from './lib/premadeTemplates'
import { applyTheme, getStoredTheme, saveTheme } from './lib/theme'
import { getSettings, patchSettings } from './lib/settings'

// Chart.js-heavy views load on demand
const DashboardView = lazy(() => import('./views/DashboardView'))
const ExerciseDetailModal = lazy(() => import('./views/ExerciseDetailModal'))

const buildSessionExercise = (item, exercises) => {
  const ex = exById(exercises, item.exerciseId) || { name: item.name || 'Exercise', muscles: [] }
  return {
    key: uid('we'),
    exerciseId: item.exerciseId,
    name: ex.name,
    muscles: ex.muscles,
    rest: item.rest || 90,
    reps: item.reps,
    notes: '',
    sets: Array.from({ length: item.targetSets || 3 }).map(() => ({
      weight: '',
      reps: '',
      rpe: '',
      completed: false,
    })),
  }
}

export default function App() {
  const [exercises, setExercises] = useState(() => loadLS(LS_KEYS.exercises, DEFAULT_EXERCISES))
  const [templates, setTemplates] = useState(
    () => loadLS(LS_KEYS.templates, null) || makeDefaultTemplates(),
  )
  const [schedule, setSchedule] = useState(
    () => loadLS(LS_KEYS.schedule, null) || makeDefaultSchedule(),
  )
  const [history, setHistory] = useState(() => loadLS(LS_KEYS.history, DEFAULT_HISTORY))
  const [bodyweight, setBodyweight] = useState(() => loadLS(LS_KEYS.bodyweight, []))
  const [theme, setThemeState] = useState(getStoredTheme)
  const [onboarded, setOnboarded] = useState(() => !!getSettings().onboarded)

  const [view, setView] = useState('schedule')
  const [editingTemplate, setEditingTemplate] = useState(undefined)
  const [managingExercises, setManagingExercises] = useState(false)
  const [creatingExerciseFromPicker, setCreatingExerciseFromPicker] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [activeSession, setActiveSession] = useState(() => loadLS(LS_KEYS.activeWorkout, null))
  const [detailExerciseId, setDetailExerciseId] = useState(null)
  const [toast, setToast] = useState(null)
  const toastSeq = useRef(0)

  useEffect(() => saveLS(LS_KEYS.exercises, exercises), [exercises])
  useEffect(() => saveLS(LS_KEYS.templates, templates), [templates])
  useEffect(() => saveLS(LS_KEYS.schedule, schedule), [schedule])
  useEffect(() => saveLS(LS_KEYS.history, history), [history])
  useEffect(() => saveLS(LS_KEYS.bodyweight, bodyweight), [bodyweight])

  const showToast = (message, actionLabel, onAction) =>
    setToast({ id: ++toastSeq.current, message, actionLabel, onAction })
  const dismissToast = () => setToast(null)

  const setTheme = (t) => {
    setThemeState(t)
    applyTheme(t)
    saveTheme(t)
  }

  /* ---------------- workouts ---------------- */
  const beginSession = (session) => {
    setActiveSession(session)
    saveLS(LS_KEYS.activeWorkout, session)
  }

  const startWorkout = (template) => {
    beginSession({
      id: uid('wo'),
      name: template.name,
      templateId: template.id || null,
      startedAt: Date.now(),
      notes: '',
      restEndsAt: null,
      restTotal: 90,
      exercises: template.exercises.map((item) => buildSessionExercise(item, exercises)),
    })
  }

  const startWorkoutFromHistory = (past) => {
    beginSession({
      id: uid('wo'),
      name: past.name,
      templateId: null,
      startedAt: Date.now(),
      notes: '',
      restEndsAt: null,
      restTotal: 90,
      exercises: past.exercises.map((pe) => {
        const meta = exById(exercises, pe.exerciseId) || {}
        const src = pe.sets && pe.sets.length ? pe.sets : [{}]
        return {
          key: uid('we'),
          exerciseId: pe.exerciseId,
          name: meta.name || pe.name,
          muscles: meta.muscles || pe.muscles || [],
          rest: pe.rest || 90,
          reps: pe.reps,
          notes: '',
          sets: src.map((s) => ({
            weight: s.weight ?? '',
            reps: s.reps ?? '',
            rpe: '',
            completed: false,
          })),
        }
      }),
    })
  }

  const persistSession = (session) => {
    setActiveSession(session)
    saveLS(LS_KEYS.activeWorkout, session)
  }

  const finishWorkout = (finished) => {
    setHistory((h) => [...h, { ...finished, date: new Date().toISOString() }])
    setActiveSession(null)
    removeLS(LS_KEYS.activeWorkout)
  }

  const cancelWorkout = () => {
    setActiveSession(null)
    removeLS(LS_KEYS.activeWorkout)
  }

  const deleteWorkout = (workout) => {
    setHistory((h) => {
      const idx = h.indexOf(workout)
      if (idx < 0) return h
      const next = h.slice()
      next.splice(idx, 1)
      showToast('Workout deleted', 'Undo', () =>
        setHistory((cur) => {
          const restored = cur.slice()
          restored.splice(Math.min(idx, restored.length), 0, workout)
          return restored
        }),
      )
      return next
    })
  }
  const clearHistory = () => {
    const snapshot = history
    setHistory([])
    showToast('All history deleted', 'Undo', () => setHistory(snapshot))
  }
  const loadSampleHistory = () => {
    setHistory(DEFAULT_HISTORY)
    return DEFAULT_HISTORY.length
  }

  /* ---------------- bodyweight ---------------- */
  const logBodyweight = (weight, date) =>
    setBodyweight((b) => [...b, { id: uid('bw'), weight, date }])
  const deleteBodyweight = (id) =>
    setBodyweight((b) => {
      const entry = b.find((e) => e.id === id)
      if (!entry) return b
      showToast('Entry deleted', 'Undo', () => setBodyweight((cur) => [...cur, entry]))
      return b.filter((e) => e.id !== id)
    })

  /* ---------------- onboarding ---------------- */
  const finishOnboarding = () => {
    setOnboarded(true)
    patchSettings({ onboarded: true })
  }
  const replayOnboarding = () => {
    setOnboarded(false)
    patchSettings({ onboarded: false })
  }

  /* ---------------- templates ---------------- */
  const saveTemplate = (tmpl) => {
    setTemplates((ts) => {
      const exists = ts.some((t) => t.id === tmpl.id)
      return exists ? ts.map((t) => (t.id === tmpl.id ? tmpl : t)) : [...ts, tmpl]
    })
    setEditingTemplate(undefined)
  }
  const duplicateTemplate = (src) => {
    const copy = {
      id: uid('tmpl'),
      name: `${src.name}${src.premade ? '' : ' (copy)'}`,
      exercises: src.exercises.map((e) => ({ ...e })),
    }
    setTemplates((ts) => [...ts, copy])
    setEditingTemplate(copy)
  }
  const deleteTemplate = (id) => {
    const tmpl = templates.find((t) => t.id === id)
    const idx = templates.findIndex((t) => t.id === id)
    if (idx < 0) return
    const scheduleSnapshot = schedule
    setTemplates((ts) => ts.filter((t) => t.id !== id))
    setSchedule((s) => {
      const next = { ...s }
      Object.keys(next).forEach((d) => {
        if (next[d] === id) next[d] = null
      })
      return next
    })
    showToast('Template deleted', 'Undo', () => {
      setTemplates((ts) => {
        const restored = ts.slice()
        restored.splice(Math.min(idx, restored.length), 0, tmpl)
        return restored
      })
      setSchedule(scheduleSnapshot)
    })
  }
  const reorderTemplates = (nextOrder) => setTemplates(nextOrder)
  const assignDay = (day, tmplId) => setSchedule((s) => ({ ...s, [day]: tmplId }))

  /* ---------------- exercises ---------------- */
  const createExercise = (ex) => setExercises((list) => [...list, ex])
  const deleteExercise = (id) => {
    const ex = exercises.find((e) => e.id === id)
    const idx = exercises.findIndex((e) => e.id === id)
    if (idx < 0) return
    setExercises((list) => list.filter((e) => e.id !== id))
    showToast('Exercise removed', 'Undo', () =>
      setExercises((list) => {
        const restored = list.slice()
        restored.splice(Math.min(idx, restored.length), 0, ex)
        return restored
      }),
    )
  }
  const openExercise = (id) => setDetailExerciseId(id)

  /* ---------------- screen resolution ---------------- */
  let screenKey
  let screenEl

  if (!onboarded) {
    screenKey = 'onboarding'
    screenEl = <Onboarding onDone={finishOnboarding} />
  } else if (activeSession) {
    screenKey = 'workout'
    screenEl = (
      <ActiveWorkout
        session={activeSession}
        exercises={exercises}
        history={history}
        onChange={persistSession}
        onFinish={finishWorkout}
        onCancel={cancelWorkout}
        onOpenExercise={openExercise}
      />
    )
  } else if (showHistory) {
    screenKey = 'history'
    screenEl = (
      <div className="max-w-md mx-auto min-h-screen">
        <HistoryView
          history={history}
          exercises={exercises}
          onBack={() => setShowHistory(false)}
          onDeleteWorkout={deleteWorkout}
          onRepeat={startWorkoutFromHistory}
          onOpenExercise={openExercise}
        />
      </div>
    )
  } else if (managingExercises) {
    screenKey = 'exercise-library'
    screenEl = (
      <ExerciseLibraryManager
        exercises={exercises}
        onCreate={createExercise}
        onDelete={deleteExercise}
        onOpenExercise={openExercise}
        onBack={() => setManagingExercises(false)}
      />
    )
  } else if (editingTemplate !== undefined) {
    screenKey = 'template-editor'
    screenEl = (
      <div>
        <TemplateEditor
          template={editingTemplate}
          exercises={exercises}
          onSave={saveTemplate}
          onCancel={() => setEditingTemplate(undefined)}
          onCreateExercise={() => setCreatingExerciseFromPicker(true)}
          onOpenExercise={openExercise}
        />
        {creatingExerciseFromPicker && (
          <NewExerciseModal
            onClose={() => setCreatingExerciseFromPicker(false)}
            onCreate={(ex) => {
              createExercise(ex)
              setCreatingExerciseFromPicker(false)
            }}
          />
        )}
      </div>
    )
  } else {
    screenKey = `tab:${view}`
    screenEl = (
      <div className="max-w-md mx-auto min-h-screen">
        {view === 'schedule' && (
          <ScheduleView
            schedule={schedule}
            templates={templates}
            premadeTemplates={PREMADE_TEMPLATES}
            exercises={exercises}
            history={history}
            onAssign={assignDay}
            onStart={startWorkout}
            onRepeatLast={startWorkoutFromHistory}
          />
        )}
        {view === 'templates' && (
          <TemplatesView
            templates={templates}
            premadeTemplates={PREMADE_TEMPLATES}
            exercises={exercises}
            schedule={schedule}
            onNew={() => setEditingTemplate(null)}
            onEdit={(t) => setEditingTemplate(t)}
            onDelete={deleteTemplate}
            onDuplicate={duplicateTemplate}
            onReorder={reorderTemplates}
            onManageExercises={() => setManagingExercises(true)}
          />
        )}
        {view === 'dashboard' && (
          <Suspense
            fallback={<div className="px-4 pt-10 text-gray-500 text-sm">Loading charts…</div>}
          >
            <DashboardView
              history={history}
              exercises={exercises}
              bodyweight={bodyweight}
              theme={theme}
              onOpenHistory={() => setShowHistory(true)}
              onDeleteWorkout={deleteWorkout}
              onOpenExercise={openExercise}
              onLogBodyweight={logBodyweight}
              onDeleteBodyweight={deleteBodyweight}
            />
          </Suspense>
        )}
        {view === 'settings' && (
          <SettingsView
            theme={theme}
            setTheme={setTheme}
            history={history}
            setHistory={setHistory}
            onOpenHistory={() => setShowHistory(true)}
            onLoadSample={loadSampleHistory}
            onClearHistory={clearHistory}
            onReplayIntro={replayOnboarding}
          />
        )}
      </div>
    )
  }

  const onTab = screenKey.startsWith('tab:')

  return (
    <>
      <div key={screenKey} className="screen-fade">
        {screenEl}
      </div>
      {onTab && <BottomNav view={view} setView={setView} />}
      {onTab && <A2HSBanner />}
      <Toast toast={toast} onDismiss={dismissToast} bottomOffset={onTab ? 64 : 0} />
      {detailExerciseId && (
        <Suspense fallback={null}>
          <ExerciseDetailModal
            exerciseId={detailExerciseId}
            exercises={exercises}
            history={history}
            theme={theme}
            onClose={() => setDetailExerciseId(null)}
          />
        </Suspense>
      )}
    </>
  )
}
