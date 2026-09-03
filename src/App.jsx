import { useEffect, useState } from 'react'
import BottomNav from './components/BottomNav'
import NewExerciseModal from './components/NewExerciseModal'
import ScheduleView from './views/ScheduleView'
import TemplatesView from './views/TemplatesView'
import TemplateEditor from './views/TemplateEditor'
import ExerciseLibraryManager from './views/ExerciseLibraryManager'
import HistoryView from './views/HistoryView'
import DashboardView from './views/DashboardView'
import ActiveWorkout from './views/ActiveWorkout'
import { LS_KEYS, loadLS, saveLS } from './lib/storage'
import {
  DEFAULT_EXERCISES,
  exById,
  makeDefaultSchedule,
  makeDefaultTemplates,
} from './lib/exercises'

export default function App() {
  const [exercises, setExercises] = useState(() => loadLS(LS_KEYS.exercises, DEFAULT_EXERCISES))
  const [templates, setTemplates] = useState(
    () => loadLS(LS_KEYS.templates, null) || makeDefaultTemplates(),
  )
  const [schedule, setSchedule] = useState(() => {
    const t = loadLS(LS_KEYS.templates, null) || makeDefaultTemplates()
    return loadLS(LS_KEYS.schedule, null) || makeDefaultSchedule(t)
  })
  const [history, setHistory] = useState(() => loadLS(LS_KEYS.history, []))

  const [view, setView] = useState('schedule')
  const [editingTemplate, setEditingTemplate] = useState(undefined)
  const [managingExercises, setManagingExercises] = useState(false)
  const [creatingExerciseFromPicker, setCreatingExerciseFromPicker] = useState(false)
  const [activeWorkout, setActiveWorkout] = useState(null)

  useEffect(() => saveLS(LS_KEYS.exercises, exercises), [exercises])
  useEffect(() => saveLS(LS_KEYS.templates, templates), [templates])
  useEffect(() => saveLS(LS_KEYS.schedule, schedule), [schedule])
  useEffect(() => saveLS(LS_KEYS.history, history), [history])

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

  const saveTemplate = (tmpl) => {
    setTemplates((ts) => {
      const exists = ts.some((t) => t.id === tmpl.id)
      return exists ? ts.map((t) => (t.id === tmpl.id ? tmpl : t)) : [...ts, tmpl]
    })
    setEditingTemplate(undefined)
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
          exercises={exercises}
          onAssign={assignDay}
          onStart={startWorkout}
        />
      )}
      {view === 'templates' && (
        <TemplatesView
          templates={templates}
          exercises={exercises}
          schedule={schedule}
          onNew={() => setEditingTemplate(null)}
          onEdit={(t) => setEditingTemplate(t)}
          onDelete={deleteTemplate}
          onManageExercises={() => setManagingExercises(true)}
        />
      )}
      {view === 'history' && <HistoryView history={history} exercises={exercises} />}
      {view === 'dashboard' && <DashboardView history={history} exercises={exercises} />}
      <BottomNav view={view} setView={setView} />
    </div>
  )
}
