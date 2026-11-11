import { formatDuration } from './analytics'
import { APP_URL } from './share'

/**
 * Renders a 1080×1350 "brag card" PNG for the native share sheet (Instagram,
 * Messages, WhatsApp…). Pure canvas, no deps, works offline. (2026-11-11)
 */
const W = 1080
const H = 1350

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export async function renderShareCard({ summary, streak }) {
  try {
    await document.fonts?.ready
  } catch {
    /* ignore */
  }
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')
  const font = (wt, px) => `${wt} ${px}px "Inter Variable", Inter, system-ui, sans-serif`

  // energy gradient background
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#2f6bff')
  g.addColorStop(0.55, '#7b5cff')
  g.addColorStop(1, '#ff4fa3')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)

  // soft blobs
  ctx.globalAlpha = 0.18
  ctx.fillStyle = '#fff'
  ctx.beginPath(); ctx.arc(900, 180, 260, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(120, 1180, 220, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 1

  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.font = font(800, 150)
  ctx.fillText('🏆', W / 2, 260)
  ctx.font = font(800, 84)
  ctx.fillText('Workout crushed!', W / 2, 400)
  ctx.font = font(500, 40)
  ctx.globalAlpha = 0.9
  ctx.fillText(summary.name || 'Lift More session', W / 2, 462)
  ctx.globalAlpha = 1

  // stat card
  roundRect(ctx, 80, 540, W - 160, 420, 48)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  const stats = [
    { v: formatDuration(summary.durationMs), l: 'TIME', col: '#2f6bff' },
    { v: summary.totalVolume.toLocaleString(), l: 'LB LIFTED', col: '#7b5cff' },
    { v: String(summary.completedSets), l: 'SETS', col: '#12b76a' },
  ]
  stats.forEach((s, i) => {
    const cx = 80 + ((W - 160) / 3) * (i + 0.5)
    ctx.fillStyle = s.col
    ctx.font = font(800, 72)
    ctx.fillText(s.v, cx, 720)
    ctx.fillStyle = '#64748b'
    ctx.font = font(600, 28)
    ctx.fillText(s.l, cx, 774)
  })
  ctx.fillStyle = '#0f172a'
  ctx.font = font(700, 44)
  const prLine = summary.prs.length
    ? `⭐ ${summary.prs.length} new PR${summary.prs.length === 1 ? '' : 's'}`
    : '💪 Another one in the bank'
  ctx.fillText(prLine, W / 2, 880)

  if (streak > 1) {
    ctx.fillStyle = '#fff'
    ctx.font = font(800, 64)
    ctx.fillText(`🔥 ${streak}-week streak`, W / 2, 1090)
  }

  ctx.font = font(600, 36)
  ctx.globalAlpha = 0.9
  ctx.fillText('Tracked with Lift More · ' + APP_URL.replace(/^https?:\/\//, '').replace(/\/$/, ''), W / 2, 1270)
  ctx.globalAlpha = 1

  return new Promise((resolve) => c.toBlob(resolve, 'image/png'))
}

/** Native share with the image; falls back to downloading the PNG. */
export async function shareCard({ summary, streak, text }) {
  const blob = await renderShareCard({ summary, streak })
  if (!blob) return 'failed'
  const file = new File([blob], 'lift-more-workout.png', { type: 'image/png' })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text, title: 'My Lift More workout' })
      return 'shared'
    } catch (e) {
      if (e && e.name === 'AbortError') return 'cancelled'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'lift-more-workout.png'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return 'downloaded'
}
