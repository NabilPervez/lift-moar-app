import { useEffect, useState } from 'react'
import { formatDuration } from '../lib/analytics'
import { buzz, HAPTIC } from '../lib/haptics'
import { buildShareText, copyText, downloadText, shareFilename, smsHref, whatsappHref } from '../lib/share'

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

export default function WorkoutSummary({ summary, onDone }) {
  const { name, durationMs, totalVolume, completedSets, prs, lifts } = summary
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    buzz(prs.length ? HAPTIC.pr : HAPTIC.complete)
  }, [prs.length])

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
          What you lifted
        </div>
        {lifts.length === 0 ? (
          <p className="text-gray-600 italic text-sm">No completed sets logged.</p>
        ) : (
          <div className="bg-surface-800 rounded-2xl border border-white/5 divide-y divide-white/5">
            {lifts.map((l, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{l.name}</div>
                  <div className="text-gray-500 text-xs num">
                    {l.sets} set{l.sets === 1 ? '' : 's'}
                    {l.topSet ? ` · top ${l.topSet.weight}×${l.topSet.reps}` : ''}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="num font-bold">{l.volume.toLocaleString()}</div>
                  <div className="text-[10px] text-gray-500 uppercase">lb vol</div>
                </div>
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
