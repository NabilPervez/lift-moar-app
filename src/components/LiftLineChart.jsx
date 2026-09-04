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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

export const PALETTE = ['#3b82f6', '#f59e0b', '#10b981', '#f43f5e', '#a855f7', '#14b8a6']

const chartTheme = (theme) =>
  theme === 'light'
    ? { grid: 'rgba(15,23,42,0.08)', tick: '#64748b', legend: '#475569', ttBg: '#ffffff', ttBorder: '#e2e8f0', ttTitle: '#0f172a', ttBody: '#334155' }
    : { grid: 'rgba(255,255,255,0.05)', tick: '#6b7280', legend: '#9ca3af', ttBg: '#1a2233', ttBorder: '#232d42', ttTitle: '#f3f4f6', ttBody: '#d1d5db' }

export function baseOptions(theme, opts = {}) {
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

export function toLineData({ labels, datasets }) {
  return {
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.data,
      borderColor: ds.color || PALETTE[i % PALETTE.length],
      backgroundColor: (ds.color || PALETTE[i % PALETTE.length]) + '22',
      tension: 0.3,
      spanGaps: true,
      pointRadius: 3,
      pointHoverRadius: 5,
      borderWidth: 2,
    })),
  }
}

/** Convenience: a themed line chart in a fixed-height responsive box. */
export default function LiftLineChart({ labels, datasets, theme, legend, beginAtZero, height = 'h-56' }) {
  return (
    <div className={`relative ${height} w-full`}>
      <Line
        data={toLineData({ labels, datasets })}
        options={baseOptions(theme, { legend, beginAtZero })}
      />
    </div>
  )
}
