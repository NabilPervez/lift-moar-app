import { useEffect, useMemo, useRef, useState } from 'react'
import { formatDuration, liftRecentTrend } from '../lib/analytics'
import { buzz, HAPTIC } from '../lib/haptics'
import { buildShareText, copyText, downloadText, shareFilename, smsHref, whatsappHref } from '../lib/share'
import { celebrate } from '../lib/celebrate'
import Sparkline from '../components/Sparkline'
import { weekDots, weekStreak, workoutsThisWeek } from '../lib/streak'
import { shareCard } from '../lib/shareCard'
import liftCompleteSound from '../assets/lift-complete.mp3'

// Module scope so React 18 StrictMode's double-mount (dev) — and any later
// re-render — doesn't re-fire the sound or the celebration. Keyed on the
// session's finish time so a genuinely new workout celebrates again.
let celebratedFor = null

const RISE = '#10b981'
const FALL = '#f59e0b'
const FLAT = '#3b82f6'

/** Counts a number up from 0 (eased) — the Duolingo "XP ticking" feel. */
function useCountUp(target, delay = 0, ms = 900) {
  const [v, setV] = useState(0)
  const raf = useRef(0)
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce || !target) {
      setV(target)
      return undefined
    }
    let start
    const t = setTimeout(() => {
      const step = (now) => {
        if (start === undefined) start = now
        const p = Math.min(1, (now - start) / ms)
        setV(Math.round(target * (1 - Math.pow(1 - p, 3))))
        if (p < 1) raf.current = requestAnimationFrame(step)
      }
      raf.current = requestAnimationFrame(step)
    }, delay)
    return () => {
      clearTimeout(t)
      cancelAnimationFrame(raf.current)
    }
  }, [target, delay, ms])
  return v
}

function StatChip({ value, display, label, icon, tint, delay }) {
  const n = useCountUp(typeof value === 'number' ? value : 0, delay + 200)
  return (
    <div
      className="chip-in rounded-2xl p-3 text-center border-2 min-w-0"
      style={{ animationDelay: `${delay}ms`, borderColor: tint, background: `color-mix(in srgb, ${tint} 8%, #fff)`, boxShadow: `0 4px 0 color-mix(in srgb, ${tint} 25%, transparent)` }}
    >
      <div className="text-xl leading-none mb-1" aria-hidden="true">{icon}</div>
      <div className="num font-extrabold text-2xl truncate" style={{ color: tint }}>
        {display ?? n.toLocaleString()}
      </div>
      <div className="text-[13px] font-semibold text-gray-500 mt-0.5">{label}</div>
    </div>
  )
}

function ShareAction({ icon, label, href, onClick, accent }) {
  const className = `tap flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-colors ${
    accent
      ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15'
      : 'bg-surface-800 border-white/5 hover:bg-white/5'
  }`
  const content = (
    <>
      <span className="text-xl leading-none">{icon}</span>
      <span className="text-[11px] font-semibold text-gray-300">{label}</span>
    </>
  )
  // Real <a> navigation for sms:/https: links — far more reliably honoured by
  // mobile browsers and popup blockers than a JS-triggered window.open().
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={className}>
        {content}
      </a>
    )
  }
  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  )
}

function LiftTrend({ trend }) {
  if (!trend) return null
  if (trend.isFirst) {
    return (
      <div className="mt-2 text-[11px] text-gray-500 italic">
        First time logging this — the trend line starts next session.
      </div>
    )
  }
  const { delta, metricLabel, sessions, values } = trend
  const color = delta > 0 ? RISE : delta < 0 ? FALL : FLAT
  const deltaText =
    delta > 0
      ? `+${delta} ${metricLabel}`
      : delta < 0
        ? `${delta} ${metricLabel}`
        : `no change`
  const deltaClass =
    delta > 0 ? 'text-emerald-400' : delta < 0 ? 'text-amber-400' : 'text-gray-500'

  return (
    <div className="mt-2.5">
      <Sparkline values={values} color={color} height={40} />
      <div className="flex items-center justify-between mt-1 text-[11px]">
        <span className="text-gray-500">
          last {sessions} session{sessions === 1 ? '' : 's'} · {metricLabel}
        </span>
        <span className={`num font-semibold ${deltaClass}`}>
          {delta > 0 ? '↑ ' : delta < 0 ? '↓ ' : ''}
          {deltaText}
        </span>
      </div>
    </div>
  )
}

export default function WorkoutSummary({ summary, history = [], onDone }) {
  const { name, durationMs, totalVolume, completedSets, prs, lifts } = summary
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  // per-lift progression across the last 4 sessions, today included
  const trends = useMemo(() => {
    const map = {}
    for (const l of lifts) {
      if (!l.exerciseId) continue
      map[l.exerciseId] = liftRecentTrend(history, l.exerciseId, l, 4)
    }
    return map
  }, [lifts, history])

  // Sound + haptics + particle celebration, exactly once per finished session.
  // The setTimeout(0) clears StrictMode's synchronous mount→unmount→mount (dev):
  // the first pass's timer is cancelled by its cleanup, the surviving pass's
  // runs. The module guard then blocks any later re-fire (a re-render, tabbing
  // back) while still resetting for a genuinely new session.
  useEffect(() => {
    if (celebratedFor === summary.date) return
    const kickoff = setTimeout(() => {
      if (celebratedFor === summary.date) return
      celebratedFor = summary.date

      try {
        const audio = new Audio(liftCompleteSound)
        audio.volume = 0.65
        audio.play().catch(() => {})
      } catch (e) {
        /* no Audio support — silent */
      }

      buzz(prs.length ? HAPTIC.pr : HAPTIC.complete)
      celebrate({ pr: prs.length > 0 })
    }, 0)
    return () => clearTimeout(kickoff)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary.date])

  const shareText = buildShareText(summary)

  const handleCopy = async () => {
    const ok = await copyText(shareText)
    if (ok) {
      buzz(HAPTIC.tick)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    }
  }
  const handleSave = () => {
    downloadText(shareFilename(summary), shareText)
    buzz(HAPTIC.tick)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const priorDates = history.map((w) => w.date)
  const allDates = [...priorDates, summary.date || new Date().toISOString()]
  const streak = weekStreak(allDates)
  const dots = weekDots(allDates)
  const thisWeek = workoutsThisWeek(allDates)
  const headline = prs.length
    ? prs.length === 1
      ? 'New personal record!'
      : `${prs.length} new personal records!`
    : streak > 1
      ? 'Workout crushed!'
      : 'Great work today!'
  const [shareState, setShareState] = useState(null)
  const handleShareImage = async () => {
    buzz(HAPTIC.tick)
    setShareState('working')
    const r = await shareCard({ summary, streak, text: shareText })
    setShareState(r === 'downloaded' ? 'saved' : r === 'shared' ? 'shared' : null)
    setTimeout(() => setShareState(null), 2200)
  }

  return (
    <div className="min-h-screen pb-10">
      {/* Hero — Duolingo-style: big friendly badge, warm headline, one idea. */}
      <div className="relative overflow-hidden bg-hero px-4 pt-12 pb-16 safe-top text-center rounded-b-[2.5rem]">
        <div aria-hidden="true" className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/15" />
        <div aria-hidden="true" className="absolute -bottom-20 -left-12 w-48 h-48 rounded-full bg-white/10" />
        <div className="relative">
          <div className="bob inline-block">
            <div className="badge-pop w-28 h-28 mx-auto rounded-full bg-white shadow-xl ring-4 ring-[color:var(--gold-bright)] flex items-center justify-center text-6xl">
              {prs.length ? '🏆' : '💪'}
            </div>
          </div>
          <h1 className="chip-in text-3xl font-extrabold tracking-tight mt-5" style={{ animationDelay: '250ms', color: '#fff' }}>
            {headline}
          </h1>
          <p className="chip-in text-white/90 text-base mt-1" style={{ animationDelay: '330ms', color: 'rgba(255,255,255,.9)' }}>
            {name} · workout #{history.length + 1}
          </p>
        </div>
      </div>

      {/* Stat chips overlap the hero */}
      <div className="px-4 -mt-10 relative grid grid-cols-3 gap-2.5 mb-4">
        <StatChip display={formatDuration(durationMs)} label="Time" icon="⏱" tint="var(--brand)" delay={420} />
        <StatChip value={totalVolume} label="lb lifted" icon="🏋️" tint="var(--gold-deep)" delay={500} />
        <StatChip value={completedSets} label="Sets" icon="✅" tint="var(--brand-deep)" delay={580} />
      </div>

      {/* Streak */}
      <div className="px-4 mb-4 chip-in" style={{ animationDelay: '680ms' }}>
        <div className="bg-surface-800 rounded-2xl border border-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="flame text-2xl" aria-hidden="true">🔥</span>
              <div>
                <div className="font-extrabold text-lg leading-tight" style={{ color: 'var(--fire)' }}>
                  {streak > 1 ? `${streak}-week streak` : 'Streak started!'}
                </div>
                <div className="text-gray-500 text-[13px]">
                  {thisWeek} workout{thisWeek === 1 ? '' : 's'} this week
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {dots.map((d, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${d.done ? 'dot-fill text-white' : 'bg-surface-700 text-gray-400'} ${d.today ? 'ring-2 ring-offset-2' : ''}`}
                  style={{
                    ...(d.done ? { background: 'var(--fire)', color: '#fff', animationDelay: `${780 + i * 70}ms` } : {}),
                    ...(d.today ? { '--tw-ring-color': 'var(--fire)' } : {}),
                  }}
                >
                  {d.done ? '✓' : ''}
                </div>
                <span className="text-[13px] text-gray-500 font-semibold">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PR cards */}
      {prs.length > 0 && (
        <div className="px-4 mb-4 space-y-2">
          {prs.map((pr, i) => (
            <div
              key={i}
              className="chip-in rounded-2xl p-4 flex items-center gap-3 border-2"
              style={{ animationDelay: `${900 + i * 120}ms`, borderColor: 'var(--gold)', background: 'var(--gold-soft)' }}
            >
              <span className="text-3xl" aria-hidden="true">⭐</span>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold truncate" style={{ color: 'var(--gold-deep)' }}>{pr.name}</div>
                <div className="num text-[13px]" style={{ color: 'var(--gold-deep)' }}>
                  {pr.topSet ? `${pr.topSet.weight} × ${pr.topSet.reps}` : ''} · est. 1RM {pr.e1rm} lb
                </div>
              </div>
              <span className="text-[13px] font-extrabold px-2.5 py-1 rounded-full" style={{ background: 'var(--gold)', color: '#fff' }}>
                PR
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Share — invite, image-first */}
      <div className="px-4 mb-5 chip-in" style={{ animationDelay: '1000ms' }}>
        <div className="rounded-2xl p-4 text-center border-2 border-dashed" style={{ borderColor: 'var(--brand)', background: 'var(--brand-soft)' }}>
          <div className="font-extrabold text-lg" style={{ color: 'var(--brand-deep)' }}>Share your win 🎉</div>
          <p className="text-[13px] text-gray-500 mb-3">
            Tag a friend — training is easier with a crew.
          </p>
          <button
            onClick={handleShareImage}
            disabled={shareState === 'working'}
            className="btn-shine w-full text-white font-extrabold py-4 rounded-2xl text-lg"
            style={{ background: 'var(--gold)', boxShadow: '0 6px 0 var(--gold-deep)', color: '#1d1300' }}
          >
            {shareState === 'working'
              ? 'Making your card…'
              : shareState === 'saved'
                ? '✓ Image saved'
                : shareState === 'shared'
                  ? '✓ Shared!'
                  : '📸 Share workout card'}
          </button>
          <div className="grid grid-cols-4 gap-2 mt-3">
            <ShareAction icon={copied ? '✓' : '📋'} label={copied ? 'Copied' : 'Copy'} onClick={handleCopy} />
            <ShareAction icon="💬" label="Text" href={smsHref(shareText)} onClick={() => buzz(HAPTIC.tick)} />
            <ShareAction icon="🟢" label="WhatsApp" href={whatsappHref(shareText)} onClick={() => buzz(HAPTIC.tick)} />
            <ShareAction icon={saved ? '✓' : '⬇'} label={saved ? 'Saved' : 'Save log'} onClick={handleSave} />
          </div>
        </div>
      </div>

      <div className="px-4 rise-in" style={{ animationDelay: '260ms' }}>
        <div className="text-[13px] font-bold text-gray-500 mb-2">
          What you lifted · recent progress
        </div>
        {lifts.length === 0 ? (
          <p className="text-gray-600 italic text-sm">No completed sets logged.</p>
        ) : (
          <div className="bg-surface-800 rounded-2xl border border-white/5 divide-y divide-white/5">
            {lifts.map((l, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{l.name}</div>
                    <div className="text-gray-500 text-xs num">
                      {l.sets} set{l.sets === 1 ? '' : 's'}
                      {l.topSet && l.topSet.reps
                        ? l.bodyweight
                          ? ` · top ${l.topSet.reps} reps`
                          : ` · top ${l.topSet.weight}×${l.topSet.reps}`
                        : ''}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="num font-bold">
                      {l.bodyweight ? 'BW' : l.volume > 0 ? l.volume.toLocaleString() : '—'}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase">
                      {l.bodyweight ? 'bodyweight' : 'lb vol'}
                    </div>
                  </div>
                </div>
                <LiftTrend trend={trends[l.exerciseId]} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-24" />
      <div className="fixed bottom-0 left-0 right-0 px-4 pt-3 pb-4 safe-bottom bg-surface/90 backdrop-blur z-20">
        <button
          onClick={onDone}
          className="max-w-md mx-auto block w-full text-white font-extrabold py-4 rounded-2xl text-lg"
          style={{ background: 'var(--brand)', boxShadow: '0 6px 0 var(--brand-deep)', color: '#fff' }}
        >
          Continue
        </button>
      </div>
    </div>
  )
}
