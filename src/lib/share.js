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

/** One performed set, e.g. "35 x 10 @ RPE 8" or "12 reps @ RPE 7" (bodyweight). */
function fmtSet(s, bodyweight) {
  const rpe = s.rpe ? ` @ RPE ${s.rpe}` : ''
  const loadless = bodyweight || (!s.weight && s.reps)
  if (loadless) return `${s.reps} rep${s.reps === 1 ? '' : 's'}${rpe}`
  if (s.weight && s.reps) return `${s.weight} x ${s.reps}${rpe}`
  if (s.weight) return `${s.weight} lb${rpe}`
  return `done${rpe}`
}

/**
 * Plain-text training log for a finished workout — copy / SMS / WhatsApp / export.
 * Reads set by set with RPE so it stands on its own as a record someone else
 * (a coach, a training partner, future you) can follow.
 */
export function buildShareText(summary) {
  const { name, notes, durationMs, totalVolume, completedSets, avgRpe, prs, lifts } = summary
  const lines = []

  lines.push(name)
  const when = stampLine(summary)
  if (when) lines.push(when)

  const bits = []
  if (durationMs) bits.push(formatDuration(durationMs))
  bits.push(`${totalVolume.toLocaleString()} lb moved`)
  bits.push(`${completedSets} set${completedSets === 1 ? '' : 's'}`)
  bits.push(`${lifts.length} exercise${lifts.length === 1 ? '' : 's'}`)
  if (avgRpe) bits.push(`avg RPE ${avgRpe}`)
  lines.push(bits.join(' | '))

  if (notes) lines.push(`Session notes: ${notes}`)

  if (prs.length) {
    lines.push('')
    lines.push(`New PR${prs.length === 1 ? '' : 's'}:`)
    for (const pr of prs) {
      const set = pr.topSet && pr.topSet.reps ? `${pr.topSet.weight}x${pr.topSet.reps} ` : ''
      lines.push(`  ${pr.name}: ${set}(e1RM ${pr.e1rm})`)
    }
  }

  if (lifts.length) {
    lines.push('')
    lines.push('Format: weight x reps @ RPE  (RPE = how hard the set felt, 10 = no reps left):')
    for (const l of lifts) {
      lines.push('')
      const tags = [...(l.muscles || [])]
      if (l.bodyweight) tags.push('bodyweight')
      lines.push(`${l.name}${tags.length ? ` [${tags.join(', ')}]` : ''}`)

      const detail = l.setDetail && l.setDetail.length ? l.setDetail : null
      if (detail) {
        detail.forEach((s, i) => lines.push(`  Set ${i + 1}: ${fmtSet(s, l.bodyweight)}`))
      } else {
        lines.push(`  ${l.sets} set${l.sets === 1 ? '' : 's'}`)
      }

      const tail = []
      if (!l.bodyweight && l.volume > 0) tail.push(`volume ${l.volume.toLocaleString()} lb`)
      if (l.e1rm > 0) tail.push(`best e1RM ${l.e1rm}`)
      if (tail.length) lines.push(`  (${tail.join(', ')})`)
      if (l.notes) lines.push(`  Note: ${l.notes}`)
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
