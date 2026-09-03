import { useEffect, useState } from 'react'
import BottomNav from './components/BottomNav'
import NewExerciseModal from './components/NewExerciseModal'
import ScheduleView from './views/ScheduleView'
import TemplatesView from './views/TemplatesView'
import TemplateEditor from './views/TemplateEditor'
import ExerciseLibraryManager from './views/ExerciseLibraryManager'
import HistoryView from './views/HistoryView'
import DashboardView from './views/DashboardView'
import SettingsView from './views/SettingsView'
import ActiveWorkout from './views/ActiveWorkout'
import Onboarding from './components/Onboarding'
import { LS_KEYS, loadLS, saveLS, uid } from './lib/storage'
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

export default function App() {
  const [exercises, setExercises] = useState(() => loadLS(LS_KEYS.exercises, DEFAULT_EXERCISES))
  const [templates, setTemplates] = useState(
    () => loadLS(LS_KEYS.templates, null) || makeDefaultTemplates(),
  )
  const [schedule, setSchedule] = useState(
    () => loadLS(LS_KEYS.schedule, null) || makeDefaultSchedule(),
  )
  const [history, setHistory] = useState(() => loadLS(LS_KEYS.history, DEFAULT_HISTORY))
  const [theme, setThemeState] = useState(getStoredTheme)
  const [onboarded, setOnboarded] = useState(() => !!getSettings().onboarded)

  const [view, setView] = useState('schedule')
  const [editingTemplate, setEditingTemplate] = useState(undefined)
  const [managingExercises, setManagingExercises] = useState(false)
  const [creatingExerciseFromPicker, setCreatingExerciseFromPicker] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [activeWorkout, setActiveWorkout] = useState(null)

  useEffect(() => saveLS(LS_KEYS.exercises, exercises), [exercises])
  useEffect(() => saveLS(LS_KEYS.templates, templates), [templates])
  useEffect(() => saveLS(LS_KEYS.schedule, schedule), [schedule])
  useEffect(() => saveLS(LS_KEYS.history, history), [history])

  const setTheme = (t) => {
    setThemeState(t)
    applyTheme(t)
    saveTheme(t)
  }

  const startWorkout = (template) => {
    const initExercises = template.exercises.map((item) => {
      const ex = exById(exercises, item.exerciseId) || { name: 'Exercise', muscles: [] }
      return {
        exerciseId: item.exerciseId,
        name: ex.name,
        muscles: ex.muscles,
        rest: item.rest || 90,
        reps: item.reps,
        sets: Array.from({ length: item.targetSets }).map(() => ({
          weight: '',
          reps: '',
          rpe: '',
          completed: false,
        })),
      }
    })
    setActiveWorkout({ name: template.name, exercises: initExercises })
  }

  const finishWorkout = (wo) => {
    setHistory((h) => [...h, { ...wo, date: new Date().toISOString() }])
    setActiveWorkout(null)
  }

  const deleteWorkout = (workout) => setHistory((h) => h.filter((w) => w !== workout))
  const clearHistory = () => setHistory([])
  const loadSampleHistory = () => {
    setHistory(DEFAULT_HISTORY)
    return DEFAULT_HISTORY.length
  }

  const finishOnboarding = () => {
    setOnboarded(true)
    patchSettings({ onboarded: true })
  }
  const replayOnboarding = () => {
    setOnboarded(false)
    patchSettings({ onboarded: false })
  }

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
    setTemplates((ts) => ts.filter((t) => t.id !== id))
    setSchedule((s) => {
      const next = { ...s }
      Object.keys(next).forEach((d) => {
        if (next[d] === id) next[d] = null
      })
      return next
    })
  }
  const assignDay = (day, tmplId) => setSchedule((s) => ({ ...s, [day]: tmplId }))

  const createExercise = (ex) => setExercises((list) => [...list, ex])
  const deleteExercise = (id) => setExercises((list) => list.filter((e) => e.id !== id))

  if (!onboarded) {
    return <Onboarding onDone={finishOnboarding} />
  }

  if (activeWorkout) {
    return (
      <ActiveWorkout
        workout={activeWorkout}
        exercises={exercises}
        history={history}
        onFinish={finishWorkout}
        onCancel={() => setActiveWorkout(null)}
      />
    )
  }

  if (showHistory) {
    return (
      <div className="max-w-md mx-auto min-h-screen">
        <HistoryView
          history={history}
          exercises={exercises}
          onBack={() => setShowHistory(false)}
          onDeleteWorkout={deleteWorkout}
        />
      </div>
    )
  }

  if (managingExercises) {
    return (
      <ExerciseLibraryManager
        exercises={exercises}
        onCreate={createExercise}
        onDelete={deleteExercise}
        onBack={() => setManagingExercises(false)}
      />
    )
  }

  if (editingTemplate !== undefined) {
    return (
      <div>
        <TemplateEditor
          template={editingTemplate}
          exercises={exercises}
          onSave={saveTemplate}
          onCancel={() => setEditingTemplate(undefined)}
          onCreateExercise={() => setCreatingExerciseFromPicker(true)}
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
  }

  return (
    <div className="max-w-md mx-auto min-h-screen">
      {view === 'schedule' && (
        <ScheduleView
          schedule={schedule}
          templates={templates}
          premadeTemplates={PREMADE_TEMPLATES}
          exercises={exercises}
          onAssign={assignDay}
          onStart={startWorkout}
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
          onManageExercises={() => setManagingExercises(true)}
        />
      )}
      {view === 'dashboard' && (
        <DashboardView
          history={history}
          exercises={exercises}
          theme={theme}
          onOpenHistory={() => setShowHistory(true)}
          onDeleteWorkout={deleteWorkout}
        />
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
      <BottomNav view={view} setView={setView} />
    </div>
  )
}
