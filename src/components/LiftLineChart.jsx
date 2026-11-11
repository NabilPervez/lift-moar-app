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

// Green + gold family (2026-11-11). Ordered so neighbours contrast:
// brand green, gold, slate, sage, bronze, deep forest.
export const PALETTE = ['#1a7a4c', '#d99a0b', '#64748b', '#7fb89a', '#8a5d00', '#0f4a2f']

const chartTheme = (theme) =>
  theme === 'light'
    ? { grid: 'rgba(18,32,24,0.06)', tick: '#6b7468', legend: '#3c463f', ttBg: '#ffffff', ttBorder: '#e0ddcf', ttTitle: '#122018', ttBody: '#3c463f' }
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
        labels: { color: c.legend, font: { size: 13, weight: 500 }, boxWidth: 14, boxHeight: 3, padding: 14 },
        align: 'start',
      },
      tooltip: {
        backgroundColor: c.ttBg,
        borderColor: c.ttBorder,
        borderWidth: 1,
        titleColor: c.ttTitle,
        bodyColor: c.ttBody,
        padding: 10,
        cornerRadius: 10,
        boxPadding: 4,
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: c.tick, font: { size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 5 } },
      y: {
        grid: { color: c.grid },
        border: { display: false },
        ticks: { color: c.tick, font: { size: 11 }, maxTicksLimit: 5 },
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
      backgroundColor: (ds.color || PALETTE[i % PALETTE.length]) + '1f',
      // single series gets a soft area fill; multi-series stays as clean lines
      fill: datasets.length === 1 ? 'origin' : false,
      tension: 0.35,
      cubicInterpolationMode: 'monotone',
      spanGaps: true,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHitRadius: 12,
      borderWidth: 2.5,
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
