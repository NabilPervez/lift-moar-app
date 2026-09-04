import { useState } from 'react'

const SLIDES = [
  {
    icon: '▦',
    title: 'Plan your week',
    body: 'Build workout templates and drop them onto days. A full Upper / Lower / Bodyweight plan and 20 pre-made workouts are already loaded — and there\'s sample training history so the charts have something to show.',
  },
  {
    icon: '⏱',
    title: 'Log fast',
    body: 'Weight, reps and RPE per set. Your last numbers sit right next to each input — tap to copy. A rest timer runs in the background, and you can drag lifts to reorder or swap one mid-session.',
  },
  {
    icon: '↗',
    title: 'Watch it move',
    body: 'Every finished workout gets a summary with personal records. The Progress tab charts your volume, bodyweight and each lift over time, with plain-language callouts on what\'s working. Nothing leaves your phone.',
  },
]

export default function Onboarding({ onDone }) {
  const [[i, dir], setStep] = useState([0, 1])
  const last = i === SLIDES.length - 1
  const s = SLIDES[i]
  const go = (delta) => setStep(([cur]) => [cur + delta, delta])

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col safe-top safe-bottom">
      <div className="flex justify-end px-4 pt-3">
        <button
          onClick={onDone}
          className="tap text-sm font-semibold text-gray-500 hover:text-white px-2"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center overflow-hidden">
        <div
          key={i}
          className={`flex flex-col items-center ${dir >= 0 ? 'slide-in-right' : 'slide-in-left'}`}
        >
          <div className="w-24 h-24 rounded-[28px] bg-blue-600/15 ring-1 ring-blue-500/30 flex items-center justify-center text-5xl text-blue-400 mb-10">
            {s.icon}
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-3">{s.title}</h2>
          <p className="text-gray-400 leading-relaxed max-w-sm">{s.body}</p>
        </div>
      </div>

      <div className="px-8 pb-8">
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === i ? 'w-6 bg-blue-500' : 'w-1.5 bg-surface-600'
              }`}
            />
          ))}
        </div>
        <div className="flex gap-3">
          {i > 0 && (
            <button
              onClick={() => go(-1)}
              className="tap flex-1 bg-surface-700 hover:bg-surface-600 text-gray-200 font-bold py-3.5 rounded-xl"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (last ? onDone() : go(1))}
            className="tap flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl"
          >
            {last ? 'Start exploring' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
