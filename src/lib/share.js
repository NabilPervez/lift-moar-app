import { formatDuration } from './analytics'

export const APP_URL = 'https://lift-more.netlify.app/'

const fmtDate = (d) =>
  d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
const fmtTime = (d) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

/**
 * "Sat, Sep 7, 2026, 3:19 PM - 3:37 PM" when we know when the session began,
 * otherwise just the moment it finished.
 */
function stampLine(summary) {
  const end = summary.date ? new Date(summary.date) : null
  if (!end || Number.isNaN(+end)) return null
  const start = summary.startedAt ? new Date(summary.startedAt) : null
  const sameDay = start && !Number.isNaN(+start) && start.toDateString() === end.toDateString()
  if (sameDay) return `${fmtDate(end)}, ${fmtTime(start)} - ${fmtTime(end)}`
  return `${fmtDate(end)}, ${fmtTime(end)}`
}

/** Plain-text recap of a finished workout, suitable for copy/SMS/WhatsApp/export. */
export function buildShareText(summary) {
  const { name, durationMs, totalVolume, completedSets, prs, lifts } = summary
  const lines = []

  lines.push(name)
  const when = stampLine(summary)
  if (when) lines.push(when)

  const bits = []
  if (durationMs) bits.push(formatDuration(durationMs))
  bits.push(`${totalVolume.toLocaleString()} lb moved`)
  bits.push(`${completedSets} set${completedSets === 1 ? '' : 's'}`)
  lines.push(bits.join(' | '))

  if (prs.length) {
    lines.push('')
    lines.push(`${prs.length} PR${prs.length === 1 ? '' : 's'}:`)
    for (const pr of prs) {
      lines.push(`  ${pr.name}: ${pr.topSet ? `${pr.topSet.weight}x${pr.topSet.reps}` : `e1RM ${pr.e1rm}`}`)
    }
  }

  if (lifts.length) {
    lines.push('')
    lines.push('Lifted:')
    for (const l of lifts) {
      const top =
        l.topSet && l.topSet.reps
          ? l.bodyweight
            ? `, top ${l.topSet.reps} reps`
            : `, top ${l.topSet.weight}x${l.topSet.reps}`
          : ''
      lines.push(`- ${l.name}: ${l.sets} set${l.sets === 1 ? '' : 's'}${top}`)
    }
  }

  lines.push('')
  lines.push('Track Your Own Sets, See Your Progress, Privately at:')
  lines.push(APP_URL)
  return lines.join('\n')
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (e) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch (e2) {
      return false
    }
  }
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent)

/** `sms:` deep link pre-filled with a body — the user still has to hit send. */
export function smsHref(text) {
  return `sms:${isIos() ? '&' : '?'}body=${encodeURIComponent(text)}`
}

/** wa.me deep link — opens the WhatsApp app (or web) with the message drafted. */
export function whatsappHref(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function shareFilename(summary) {
  // Local date and time, not UTC — a 9pm session shouldn't be filed under tomorrow.
  const d = summary.date ? new Date(summary.date) : new Date()
  const p = (n) => String(n).padStart(2, '0')
  const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
  const slug = (summary.name || 'workout').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `lift-more-${stamp}-${slug}.txt`
}
