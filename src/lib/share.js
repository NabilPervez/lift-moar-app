import { formatDuration } from './analytics'

export const APP_URL = 'https://lift-moar.netlify.app/'

/** Plain-text recap of a finished workout, suitable for copy/SMS/WhatsApp/export. */
export function buildShareText(summary) {
  const { name, date, durationMs, totalVolume, completedSets, prs, lifts } = summary
  const lines = []

  const when = date
    ? new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : null
  lines.push(`🏋️ ${name}${when ? ` — ${when}` : ''}`)

  const bits = []
  if (durationMs) bits.push(formatDuration(durationMs))
  bits.push(`${totalVolume.toLocaleString()} lb moved`)
  bits.push(`${completedSets} set${completedSets === 1 ? '' : 's'}`)
  lines.push(bits.join(' · '))

  if (prs.length) {
    lines.push('')
    lines.push(`⭐ ${prs.length} PR${prs.length === 1 ? '' : 's'}:`)
    for (const pr of prs) {
      lines.push(`  ${pr.name} — ${pr.topSet ? `${pr.topSet.weight}×${pr.topSet.reps}` : `e1RM ${pr.e1rm}`}`)
    }
  }

  if (lifts.length) {
    lines.push('')
    lines.push('Lifted:')
    for (const l of lifts) {
      lines.push(
        `• ${l.name} — ${l.sets} set${l.sets === 1 ? '' : 's'}${
          l.topSet ? `, top ${l.topSet.weight}×${l.topSet.reps}` : ''
        }`,
      )
    }
  }

  lines.push('')
  lines.push('Tracked with Lift Moar 🏋️')
  lines.push(`Log your own: ${APP_URL}`)
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
  const stamp = (summary.date ? new Date(summary.date) : new Date()).toISOString().slice(0, 10)
  const slug = (summary.name || 'workout').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return `lift-moar-${stamp}-${slug}.txt`
}
