import { useEffect, useMemo, useState } from 'react'
import { formatDuration, liftRecentTrend } from '../lib/analytics'
import { buzz, HAPTIC } from '../lib/haptics'
import { buildShareText, copyText, downloadText, shareFilename, smsHref, whatsappHref } from '../lib/share'
import { celebrate } from '../lib/celebrate'
import Sparkline from '../components/Sparkline'
import liftCompleteSound from '../assets/lift-complete.mp3'

// Module scope so React 18 StrictMode's double-mount (dev) — and any later
// re-render — doesn't re-fire the sound or the celebration. Keyed on the
// session's finish time so a genuinely new workout celebrates again.
let celebratedFor = null

const RISE = '#10b981'
const FALL = '#f59e0b'
const FLAT = '#3b82f6'

function Stat({ value, label, accent, delay }) {
  return (
    <div
      className="bg-surface-800 rounded-2xl border border-white/5 p-4 text-center rise-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`num font-black text-2xl ${accent || ''}`}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">{label}</div>
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

  return (
    <div className="min-h-screen pb-28">
      <div className="px-4 pt-10 pb-4 safe-top text-center rise-in">
        <div className="text-4xl mb-2 pop-in">🏁</div>
        <h1 className="text-2xl font-black tracking-tight">Workout Complete</h1>
        <p className="text-gray-500 text-sm mt-1">{name}</p>
      </div>

      <div className="px-4 grid grid-cols-2 gap-3 mb-3">
        <Stat value={formatDuration(durationMs)} label="Duration" delay={60} />
        <Stat value={completedSets} label="Sets Done" accent="text-emerald-400" delay={100} />
        <Stat value={totalVolume.toLocaleString()} label="Total Weight (lb)" delay={140} />
        <Stat
          value={prs.length}
          label={prs.length === 1 ? 'Personal Record' : 'Personal Records'}
          accent={prs.length ? 'text-amber-400' : 'text-gray-500'}
          delay={180}
        />
      </div>

      {prs.length > 0 && (
        <div className="px-4 mb-3 rise-in" style={{ animationDelay: '220ms' }}>
          <div className="bg-amber-500/10 ring-1 ring-amber-500/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⭐</span>
              <span className="font-bold text-amber-300">
                {prs.length} new personal record{prs.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="space-y-1.5">
              {prs.map((pr, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{pr.name}</span>
                  <span className="num text-gray-400">
                    {pr.topSet ? `${pr.topSet.weight}×${pr.topSet.reps}` : ''} · e1RM {pr.e1rm}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 rise-in" style={{ animationDelay: '260ms' }}>
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
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

      <div className="px-4 mt-4 rise-in" style={{ animationDelay: '290ms' }}>
        <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Share this session
        </div>
        <div className="grid grid-cols-4 gap-2">
          <ShareAction icon={copied ? '✓' : '📋'} label={copied ? 'Copied' : 'Copy'} onClick={handleCopy} />
          <ShareAction icon="💬" label="Text" href={smsHref(shareText)} onClick={() => buzz(HAPTIC.tick)} />
          <ShareAction
            icon="💬"
            label="WhatsApp"
            href={whatsappHref(shareText)}
            accent
            onClick={() => buzz(HAPTIC.tick)}
          />
          <ShareAction icon={saved ? '✓' : '⬇'} label={saved ? 'Saved' : 'Save'} onClick={handleSave} />
        </div>
      </div>

      <div className="px-4 mt-6 rise-in" style={{ animationDelay: '320ms' }}>
        <button
          onClick={onDone}
          className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-transform text-white font-bold py-4 rounded-xl text-lg"
        >
          Done
        </button>
      </div>
    </div>
  )
}
