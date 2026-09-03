import { m } from 'framer-motion'
import { formatDuration } from '../lib/analytics'
import { fadeUp, staggerParent } from '../lib/motion'

function Stat({ value, label, accent }) {
  return (
    <m.div
      variants={fadeUp}
      className="bg-surface-800 rounded-2xl border border-white/5 p-4 text-center"
    >
      <div className={`num font-black text-2xl ${accent || ''}`}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wide mt-1">{label}</div>
    </m.div>
  )
}

export default function WorkoutSummary({ summary, onDone }) {
  const { name, durationMs, totalVolume, completedSets, prs, lifts } = summary

  return (
    <m.div
      className="min-h-screen pb-28"
      variants={staggerParent}
      initial="hidden"
      animate="show"
    >
      <m.div variants={fadeUp} className="px-4 pt-10 pb-4 safe-top text-center">
        <m.div
          className="text-4xl mb-2"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
        >
          🏁
        </m.div>
        <h1 className="text-2xl font-black tracking-tight">Workout Complete</h1>
        <p className="text-gray-500 text-sm mt-1">{name}</p>
      </m.div>

      <div className="px-4 grid grid-cols-2 gap-3 mb-3">
        <Stat value={formatDuration(durationMs)} label="Duration" />
        <Stat value={completedSets} label="Sets Done" accent="text-emerald-400" />
        <Stat value={totalVolume.toLocaleString()} label="Total Weight (lb)" />
        <Stat
          value={prs.length}
          label={prs.length === 1 ? 'Personal Record' : 'Personal Records'}
          accent={prs.length ? 'text-amber-400' : 'text-gray-500'}
        />
      </div>

      {prs.length > 0 && (
        <m.div variants={fadeUp} className="px-4 mb-3">
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
        </m.div>
      )}

      <m.div variants={fadeUp} className="px-4">
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
      </m.div>

      <m.div variants={fadeUp} className="px-4 mt-6">
        <button
          onClick={onDone}
          className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-transform text-white font-bold py-4 rounded-xl text-lg"
        >
          Done
        </button>
      </m.div>
    </m.div>
  )
}
