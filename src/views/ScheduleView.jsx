import { useState } from 'react'
import Header from '../components/Header'
import TargetingBars from '../components/TargetingBars'
import { DAYS } from '../lib/constants'
import { muscleLoad } from '../lib/exercises'

export default function ScheduleView({ schedule, templates, exercises, onAssign, onStart }) {
  const [pickerDay, setPickerDay] = useState(null)
  const todayName = DAYS[(new Date().getDay() + 6) % 7]

  return (
    <div className="pb-28">
      <Header title="Schedule" subtitle="Your training week at a glance" />
      <div className="px-4 space-y-3">
        {DAYS.map((day) => {
          const tmplId = schedule[day]
          const tmpl = tmplId ? templates.find((t) => t.id === tmplId) : null
          const isToday = day === todayName
          const load = tmpl ? muscleLoad(tmpl.exercises, exercises) : []
          const totalSets = tmpl
            ? tmpl.exercises.reduce((s, e) => s + (Number(e.targetSets) || 0), 0)
            : 0
          return (
            <div
              key={day}
              className={`rounded-2xl p-4 border ${
                isToday ? 'border-blue-500/40 bg-blue-500/5' : 'border-white/5 bg-surface-800'
              }`}
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
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/60"
          onClick={() => setPickerDay(null)}
        >
          <div
            className="slide-up bg-surface-800 rounded-t-3xl w-full max-w-md p-5 safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-700 rounded-full mx-auto mb-4"></div>
            <h3 className="font-bold text-lg mb-4">Assign a template to {pickerDay}</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              <button
                onClick={() => {
                  onAssign(pickerDay, null)
                  setPickerDay(null)
                }}
                className="w-full text-left px-4 py-3 rounded-xl bg-surface-700 hover:bg-surface-600 text-gray-400 italic"
              >
                Rest day
              </button>
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onAssign(pickerDay, t.id)
                    setPickerDay(null)
                  }}
                  className="w-full text-left px-4 py-3 rounded-xl bg-surface-700 hover:bg-surface-600 font-semibold"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
