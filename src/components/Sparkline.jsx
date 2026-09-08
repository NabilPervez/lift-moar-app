import { useId } from 'react'

/**
 * Dependency-free SVG sparkline. No rAF, no canvas — the line is drawn with a
 * CSS stroke-dashoffset animation (`pathLength="1"` normalises the length) so a
 * throttled tab can never leave it half-drawn: the resting state is the full
 * line. Pass 2+ numeric `values`; fewer renders nothing.
 */
export default function Sparkline({
  values = [],
  width = 240,
  height = 44,
  color = '#3b82f6',
  strokeWidth = 2,
  animate = true,
}) {
  const id = useId().replace(/[:]/g, '')
  const pts = values.filter((v) => Number.isFinite(v))
  if (pts.length < 2) return null

  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const span = max - min || 1
  const pad = strokeWidth + 2
  const stepX = width / (pts.length - 1)

  const xy = pts.map((v, i) => {
    const x = i * stepX
    const y = height - pad - ((v - min) / span) * (height - pad * 2)
    return [x, y]
  })

  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width.toFixed(1)} ${height} L0 ${height} Z`
  const [lx, ly] = xy[xy.length - 1]
  const [px, py] = xy[0]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#fill-${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="1"
        className={animate ? 'spark-draw' : undefined}
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={px} cy={py} r={strokeWidth + 0.5} fill={color} opacity="0.35" />
      <circle cx={lx} cy={ly} r={strokeWidth + 1.5} fill={color} />
    </svg>
  )
}
