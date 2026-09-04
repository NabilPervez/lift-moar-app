import { useMemo, useState } from 'react'
import Header from '../components/Header'
import Pill from '../components/Pill'
import WorkoutDetailModal from '../components/WorkoutDetailModal'
import ConsistencyCard from '../components/ConsistencyCard'
import BodyweightCard from '../components/BodyweightCard'
import LiftLineChart from '../components/LiftLineChart'
import { exById } from '../lib/exercises'
import {
  muscleGroupVolumeSeries,
  exerciseHistoryOptions,
  specificLiftSeries,
  quickRead,
} from '../lib/analytics'

const TONE = {
  good: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  watch: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  flag: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
}
const TONE_LABEL = { good: 'GOOD', watch: 'WATCH', flag: 'FLAG' }

function ChartCard({ title, subtitle, empty, children }) {
  return (
    <div className="bg-surface-800 rounded-2xl p-4 border border-white/5">
      <div className="mb-3">
        <div className="font-bold">{title}</div>
        {subtitle && <div className="text-gray-500 text-xs mt-0.5">{subtitle}</div>}
      </div>
      {empty ? (
        <p className="text-gray-600 italic text-sm py-10 text-center">{empty}</p>
      ) : (
        children
      )}
    </div>
  )
}

export default function DashboardView({
  history,
  exercises,
  bodyweight,
  theme,
  onOpenHistory,
  onDeleteWorkout,
  onOpenExercise,
  onLogBodyweight,
  onDeleteBodyweight,
}) {
  const reads = useMemo(() => quickRead(history, exercises), [history, exercises])
  const muscleVol = useMemo(() => muscleGroupVolumeSeries(history, exercises), [history, exercises])
  const options = useMemo(() => exerciseHistoryOptions(history, exercises), [history, exercises])

  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const selectedId = selected || (options[0] && options[0].id) || null
  const specific = useMemo(
    () => (selectedId ? specificLiftSeries(history, exercises, selectedId) : null),
    [history, exercises, selectedId],
  )
  const selectedName = options.find((o) => o.id === selectedId)?.name || 'lift'

  const hasHistory = history.length > 0
  const muscleVolHasData = muscleVol.datasets.some((d) => d.data.some((v) => v > 0))
  const specificHasData = specific && specific.data.some((v) => v !== null)
  const recent = history.slice().reverse().slice(0, 5)

  return (
    <div className="pb-28">
      <Header title="Progress" subtitle="Volume and lift trends from your logged workouts" />

      <div className="px-4 space-y-4">
        <ConsistencyCard history={history} />

        {/* Quick Read */}
        <div className="bg-surface-800 rounded-2xl p-4 border border-white/5">
          <div className="font-bold mb-1">Quick Read</div>
          <div className="text-gray-500 text-xs mb-3">
            Automatic callouts on trends, plateaus, and data anomalies
          </div>
          <div className="space-y-2">
            {reads.map((r, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <span
                  className={`mt-0.5 flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ${TONE[r.tone]}`}
                >
                  {TONE_LABEL[r.tone]}
                </span>
                <div>
                  <div className="text-sm font-semibold">{r.title}</div>
                  <div className="text-gray-500 text-xs">{r.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <BodyweightCard
          entries={bodyweight}
          theme={theme}
          onLog={onLogBodyweight}
          onDelete={onDeleteBodyweight}
        />

        {/* Muscle Group Volume Over Time */}
        <ChartCard
          title="Muscle Group Volume Over Time"
          subtitle="Best set (weight × reps) summed per muscle group, per workout"
          empty={
            !hasHistory
              ? 'Log a workout to see volume trends.'
              : !muscleVolHasData
                ? 'No completed sets with weight and reps yet.'
                : null
          }
        >
          <LiftLineChart
            theme={theme}
            labels={muscleVol.labels}
            datasets={muscleVol.datasets}
          />
        </ChartCard>

        {/* Specific Lift Progression */}
        <div className="bg-surface-800 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div className="font-bold">Lift Progression</div>
              <div className="text-gray-500 text-xs mt-0.5">
                Top weight per session · tap the name for full history
              </div>
            </div>
            {options.length > 0 && (
              <select
                aria-label="Choose a lift"
                value={selectedId || ''}
                onChange={(e) => setSelected(e.target.value)}
                className="bg-surface-700 rounded-lg p-2 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 max-w-[45%]"
              >
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {!specificHasData ? (
            <p className="text-gray-600 italic text-sm py-10 text-center">
              {hasHistory ? 'Not enough data for this lift yet.' : 'Log a workout to track a lift.'}
            </p>
          ) : (
            <>
              <LiftLineChart
                theme={theme}
                legend={false}
                beginAtZero={false}
                labels={specific.labels}
                datasets={[{ label: selectedName, data: specific.data }]}
              />
              {selectedId && (
                <button
                  onClick={() => onOpenExercise(selectedId)}
                  className="tap-sm min-h-0 text-xs font-bold text-blue-400 hover:text-blue-300 mt-2"
                >
                  Open {selectedName} →
                </button>
              )}
            </>
          )}
        </div>

        {/* Recent Workouts */}
        <div className="bg-surface-800 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold">Recent Workouts</div>
            {history.length > recent.length && (
              <button
                onClick={onOpenHistory}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 tap px-1"
              >
                View all ({history.length}) →
              </button>
            )}
          </div>
          {recent.length === 0 ? (
            <p className="text-gray-600 italic text-sm py-4 text-center">No workouts logged yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((w, i) => {
                const sets = w.exercises.reduce(
                  (s, e) => s + e.sets.filter((x) => x.completed).length,
                  0,
                )
                const muscles = Array.from(
                  new Set(
                    w.exercises.flatMap(
                      (e) => (exById(exercises, e.exerciseId) || { muscles: e.muscles || [] }).muscles || [],
                    ),
                  ),
                ).slice(0, 4)
                return (
                  <div
                    key={w.id || `${w.date}-${i}`}
                    className="bg-surface-700 rounded-xl flex items-stretch overflow-hidden"
                  >
                    <button
                      onClick={() => setDetail(w)}
                      className="flex-1 text-left p-3 tap active:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm">{w.name}</div>
                        <div className="text-gray-500 text-xs num">
                          {new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          {' · '}
                          {sets} sets
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {muscles.map((m) => (
                          <Pill key={m} label={m} styleKey={m} small />
                        ))}
                      </div>
                    </button>
                    {onDeleteWorkout && (
                      <button
                        aria-label={`Delete ${w.name}`}
                        onClick={() => onDeleteWorkout(w)}
                        className="tap w-11 flex items-center justify-center text-red-400 hover:bg-red-500/10 border-l border-white/5 flex-shrink-0"
                      >
                        &#128465;
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {detail && (
        <WorkoutDetailModal
          workout={detail}
          exercises={exercises}
          onClose={() => setDetail(null)}
          onDelete={onDeleteWorkout}
          onOpenExercise={onOpenExercise}
        />
      )}
    </div>
  )
}
