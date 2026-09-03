import { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import Header from '../components/Header'
import Pill from '../components/Pill'
import WorkoutDetailModal from '../components/WorkoutDetailModal'
import { exById } from '../lib/exercises'
import {
  muscleGroupVolumeSeries,
  upperBodyProgressionSeries,
  exerciseHistoryOptions,
  specificLiftSeries,
  quickRead,
} from '../lib/analytics'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const PALETTE = ['#3b82f6', '#f59e0b', '#10b981', '#f43f5e', '#a855f7', '#14b8a6']

const TONE = {
  good: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  watch: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  flag: 'bg-rose-500/15 text-rose-300 ring-rose-500/30',
}
const TONE_LABEL = { good: 'GOOD', watch: 'WATCH', flag: 'FLAG' }

const chartTheme = (theme) =>
  theme === 'light'
    ? { grid: 'rgba(15,23,42,0.08)', tick: '#64748b', legend: '#475569', ttBg: '#ffffff', ttBorder: '#e2e8f0', ttTitle: '#0f172a', ttBody: '#334155' }
    : { grid: 'rgba(255,255,255,0.05)', tick: '#6b7280', legend: '#9ca3af', ttBg: '#1a2233', ttBorder: '#232d42', ttTitle: '#f3f4f6', ttBody: '#d1d5db' }

const baseOptions = (theme, opts = {}) => {
  const c = chartTheme(theme)
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: opts.legend !== false,
        labels: { color: c.legend, font: { size: 11 }, boxWidth: 10, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: c.ttBg,
        borderColor: c.ttBorder,
        borderWidth: 1,
        titleColor: c.ttTitle,
        bodyColor: c.ttBody,
      },
    },
    scales: {
      x: { grid: { color: c.grid }, ticks: { color: c.tick, font: { size: 10 } } },
      y: {
        grid: { color: c.grid },
        ticks: { color: c.tick, font: { size: 10 } },
        beginAtZero: opts.beginAtZero !== false,
      },
    },
  }
}

function toLineData({ labels, datasets }) {
  return {
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      borderColor: PALETTE[i % PALETTE.length],
      backgroundColor: PALETTE[i % PALETTE.length] + '22',
      tension: 0.3,
      spanGaps: true,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2,
    })),
  }
}

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
        <div className="relative h-56 w-full">{children}</div>
      )}
    </div>
  )
}

export default function DashboardView({ history, exercises, theme, onOpenHistory }) {
  const reads = useMemo(() => quickRead(history, exercises), [history, exercises])
  const muscleVol = useMemo(() => muscleGroupVolumeSeries(history, exercises), [history, exercises])
  const upper = useMemo(() => upperBodyProgressionSeries(history, exercises), [history, exercises])
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
          <Line data={toLineData(muscleVol)} options={baseOptions(theme)} />
        </ChartCard>

        {/* Upper Body Lift Progression */}
        <ChartCard
          title="Upper Body Lift Progression"
          subtitle="Heaviest working weight (lbs) per session — rows, curls, shrugs, overhead press"
          empty={upper.datasets.length === 0 ? 'No matching upper-body lifts logged yet.' : null}
        >
          <Line data={toLineData(upper)} options={baseOptions(theme, { beginAtZero: false })} />
        </ChartCard>

        {/* Specific Lift Progression */}
        <div className="bg-surface-800 rounded-2xl p-4 border border-white/5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <div className="font-bold">Specific Lift Progression</div>
              <div className="text-gray-500 text-xs mt-0.5">Weight jumps across logged dates</div>
            </div>
            {options.length > 0 && (
              <select
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
            <div className="relative h-56 w-full">
              <Line
                data={toLineData({
                  labels: specific.labels,
                  datasets: [{ label: selectedName, data: specific.data }],
                })}
                options={baseOptions(theme, { legend: false, beginAtZero: false })}
              />
            </div>
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
                  <button
                    key={i}
                    onClick={() => setDetail(w)}
                    className="w-full text-left bg-surface-700 rounded-xl p-3 tap active:scale-[0.99] transition-transform"
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
                )
              })}
            </div>
          )}
        </div>
      </div>

      {detail && (
        <WorkoutDetailModal workout={detail} exercises={exercises} onClose={() => setDetail(null)} />
      )}
    </div>
  )
}
