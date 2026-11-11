import { Suspense, lazy, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
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
import { LS_KEYS, loadLS, saveLS, removeLS, uid, requestPersistentStorage } from './lib/storage'
import { backupIsDue, downloadBackup, mergeById, mergeHistory } from './lib/backup'
import {
  DEFAULT_EXERCISES,
  buildSessionExercise,
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

export default function App() {
  const [exercises, setExercises] = useState(() => loadLS(LS_KEYS.exercises, DEFAULT_EXERCISES))
  const [templates, setTemplates] = useState(
    () => loadLS(LS_KEYS.templates, null) || makeDefaultTemplates(),
  )
  const [schedule, setSchedule] = useState(
    () => loadLS(LS_KEYS.schedule, null) || makeDefaultSchedule(),
  )
  const [history, setHistory] = useState(() => loadLS(LS_KEYS.history, []))
  const [bodyweight, setBodyweight] = useState(() => loadLS(LS_KEYS.bodyweight, []))
  const [theme, setThemeState] = useState(getStoredTheme)
  const [onboarded, setOnboarded] = useState(() => !!getSettings().onboarded)

  const [view, setViewState] = useState(() => {
    // manifest shortcuts open /?view=dashboard etc.
    const v = new URLSearchParams(window.location.search).get('view')
    return ['schedule', 'templates', 'dashboard', 'settings'].includes(v) ? v : 'schedule'
  })
  const [editingTemplate, setEditingTemplateState] = useState(undefined)
  const [managingExercises, setManagingExercisesState] = useState(false)
  const [creatingExerciseFromPicker, setCreatingExerciseFromPicker] = useState(false)
  const [showHistory, setShowHistoryState] = useState(false)
  const [activeSession, setActiveSession] = useState(() => loadLS(LS_KEYS.activeWorkout, null))
  const [detailExerciseId, setDetailExerciseId] = useState(null)
  const [toast, setToast] = useState(null)
  const toastSeq = useRef(0)

  useEffect(() => { saveLS(LS_KEYS.exercises, exercises) }, [exercises])
  useEffect(() => { saveLS(LS_KEYS.templates, templates) }, [templates])
  useEffect(() => { saveLS(LS_KEYS.schedule, schedule) }, [schedule])
  useEffect(() => { saveLS(LS_KEYS.history, history) }, [history])
  useEffect(() => { saveLS(LS_KEYS.bodyweight, bodyweight) }, [bodyweight])

  const showToast = (message, actionLabel, onAction, sticky = false) =>
    setToast({ id: ++toastSeq.current, message, actionLabel, onAction, sticky })
  const dismissToast = () => setToast(null)

  /* ---------------- navigation + view transitions ----------------
     Every screen change goes through `go`, which wraps the state update in a
     same-document View Transition where supported (Chrome/Edge/Safari 18+).
     `direction` drives the slide (forward = deeper, back = up a level, tab =
     sideways cross-fade). Falls back to an instant swap + CSS fade elsewhere,
     and to no motion under prefers-reduced-motion. (Nabil, 2026-11-11) */
  const go = (fn, direction = 'tab') => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduce) {
      fn()
      return
    }
    document.documentElement.dataset.nav = direction
    const t = document.startViewTransition(() => flushSync(fn))
    t.finished.finally(() => delete document.documentElement.dataset.nav)
  }
  const TAB_ORDER = ['schedule', 'templates', 'dashboard', 'settings']
  const setView = (v) =>
    go(() => setViewState(v), TAB_ORDER.indexOf(v) < TAB_ORDER.indexOf(view) ? 'back' : 'forward')
  const setShowHistory = (on) => go(() => setShowHistoryState(on), on ? 'forward' : 'back')
  const setManagingExercises = (on) =>
    go(() => setManagingExercisesState(on), on ? 'forward' : 'back')
  const setEditingTemplate = (t) =>
    go(() => setEditingTemplateState(t), t === undefined ? 'back' : 'forward')

  /* ---------------- data safety ---------------- */
  useEffect(() => {
    const onFail = () =>
      showToast(
        "Couldn't save — your phone's storage is full. Back up now.",
        'Back up',
        () => downloadBackup({ history, exercises, templates, schedule, bodyweight }),
        true,
      )
    window.addEventListener('lift:save-failed', onFail)
    return () => window.removeEventListener('lift:save-failed', onFail)
  })

  // Monthly backup nudge, once per launch, only with real data on the device.
  useEffect(() => {
    // never interrupt a workout or the celebration screen
    if (activeSession || !onboarded || !backupIsDue(history.length)) return
    const t = setTimeout(
      () =>
        showToast(
          `Protect your ${history.length} workouts — back up?`,
          'Back up',
          () => downloadBackup({ history, exercises, templates, schedule, bodyweight }),
        ),
      2500,
    )
    patchSettings({ backupSnoozedAt: Date.now() })
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Service-worker update: never reload mid-workout. Hold the update until
  // there's no active session, then offer it.
  const [updateReady, setUpdateReady] = useState(null)
  useEffect(() => {
    const onUpdate = (e) => setUpdateReady(() => e.detail.update)
    window.addEventListener('lift:update-ready', onUpdate)
    return () => window.removeEventListener('lift:update-ready', onUpdate)
  }, [])
  useEffect(() => {
    if (!updateReady || activeSession) return
    showToast('New version of Lift More ready', 'Reload', () => updateReady(true), true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateReady, activeSession])

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
    // first real data on the device → ask the browser not to evict it
    requestPersistentStorage()
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
  const exportBackup = () => downloadBackup({ history, exercises, templates, schedule, bodyweight })
  const importBackup = (data) => {
    const { merged, added } = mergeHistory(history, data.history)
    setHistory(merged)
    // bring back any exercises the old workouts reference, so charts resolve
    if (data.exercises.length) setExercises((list) => mergeById(list, data.exercises))
    if (data.bodyweight.length) setBodyweight((list) => mergeById(list, data.bodyweight))
    return added
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
  /* Exercises are ARCHIVED, never deleted (2026-11-11): logged history points
     at exercise ids, so deleting one orphaned its progress chart, and
     re-creating it minted a new id that split the history in two. */
  const activeExercises = useMemo(() => exercises.filter((e) => !e.archived), [exercises])
  const createExercise = (ex) => {
    const key = (ex.name || '').trim().toLowerCase()
    const archived = exercises.find((e) => e.archived && e.name.trim().toLowerCase() === key)
    if (archived) {
      // same name as an archived one → bring it back with its full history
      setExercises((list) =>
        list.map((e) => (e.id === archived.id ? { ...e, ...ex, id: e.id, archived: false } : e)),
      )
      showToast(`Restored ${archived.name} with its history`)
      return
    }
    setExercises((list) => [...list, ex])
  }
  const deleteExercise = (id) => {
    if (!exercises.some((e) => e.id === id)) return
    const setArchived = (val) =>
      setExercises((list) => list.map((e) => (e.id === id ? { ...e, archived: val } : e)))
    setArchived(true)
    showToast('Exercise archived — history kept', 'Undo', () => setArchived(false))
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
        exercises={activeExercises}
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
          exercises={activeExercises}
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
            onExport={exportBackup}
            onImport={importBackup}
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

  // Every screen opens at the top (Cisco rule, Serenity lesson).
  useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
  }, [screenKey])

  return (
    <>
      <div key={screenKey} className="screen-fade app-screen">
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
