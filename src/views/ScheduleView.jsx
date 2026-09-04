import { useMemo, useState } from 'react'
import Header from '../components/Header'
import TargetingBars from '../components/TargetingBars'
import WeeklyCoverage from '../components/WeeklyCoverage'
import TemplatePickerPage from './TemplatePickerPage'
import { DAYS } from '../lib/constants'
import { muscleLoad } from '../lib/exercises'

export default function ScheduleView({
  schedule,
  templates,
  premadeTemplates,
  exercises,
  history,
  onAssign,
  onStart,
  onRepeatLast,
}) {
  const [pickerDay, setPickerDay] = useState(null)
  const todayName = DAYS[(new Date().getDay() + 6) % 7]

  const resolve = (id) =>
    id ? templates.find((t) => t.id === id) || premadeTemplates.find((t) => t.id === id) || null : null

  const weekTemplates = useMemo(
    () => DAYS.map((d) => resolve(schedule[d])).filter(Boolean),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schedule, templates, premadeTemplates],
  )

  const last = history && history.length ? history[history.length - 1] : null

  return (
    <div className="pb-28">
      <Header title="Schedule" subtitle="Your training week at a glance" />

      <div className="px-4 space-y-3">
        {last && (
          <button
            onClick={() => onRepeatLast(last)}
            className="rise-in w-full text-left bg-surface-800 border border-white/5 rounded-2xl p-4 tap active:bg-white/5 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                  Repeat last workout
                </div>
                <div className="font-bold text-lg">{last.name}</div>
              </div>
              <span className="text-blue-400 font-bold text-lg">&#8635;</span>
            </div>
          </button>
        )}

        <div className="rise-in" style={{ animationDelay: '40ms' }}>
          <WeeklyCoverage weekTemplates={weekTemplates} exercises={exercises} />
        </div>

        {DAYS.map((day, idx) => {
          const tmpl = resolve(schedule[day])
          const isToday = day === todayName
          const load = tmpl ? muscleLoad(tmpl.exercises, exercises) : []
          const totalSets = tmpl
            ? tmpl.exercises.reduce((s, e) => s + (Number(e.targetSets) || 0), 0)
            : 0
          return (
            <div
              key={day}
              className={`rise-in rounded-2xl p-4 border ${
                isToday ? 'border-blue-500/40 bg-blue-500/5' : 'border-white/5 bg-surface-800'
              }`}
              style={{ animationDelay: `${Math.min(idx + 2, 7) * 45}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-bold uppercase tracking-wider ${
                      isToday ? 'text-blue-400' : 'text-gray-500'
                    }`}
                  >
                    {day}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded-full">
                      TODAY
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setPickerDay(day)}
                  className="text-xs font-semibold text-gray-400 hover:text-white tap px-2"
                >
                  {tmpl ? 'Change' : 'Assign'}
                </button>
              </div>
              {tmpl ? (
                <div>
                  <div className="font-bold text-lg">{tmpl.name}</div>
                  <div className="text-gray-500 text-xs mb-3">
                    {tmpl.premade ? `${tmpl.theme} · ` : ''}
                    {tmpl.exercises.length} exercises · {totalSets} sets
                  </div>
                  <TargetingBars items={load} limit={5} labelWidth="w-16" />
                  <button
                    onClick={() => onStart(tmpl)}
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-transform text-white font-bold py-3 rounded-xl"
                  >
                    Start Workout
                  </button>
                </div>
              ) : (
                <div className="text-gray-600 italic text-sm py-2">Rest day</div>
              )}
            </div>
          )
        })}
      </div>

      {pickerDay && (
        <TemplatePickerPage
          day={pickerDay}
          currentId={schedule[pickerDay] || null}
          userTemplates={templates}
          premadeTemplates={premadeTemplates}
          exercises={exercises}
          onAssign={onAssign}
          onClose={() => setPickerDay(null)}
        />
      )}
    </div>
  )
}
