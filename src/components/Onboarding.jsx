import { useState } from 'react'

const SLIDES = [
  {
    icon: '▦',
    title: 'Functional Lift Tracker',
    body: 'Plan your training week, run guided sessions, and watch your numbers move — all on your phone. No account, nothing in the cloud: every workout lives in this browser and only this browser.',
  },
  {
    icon: '☰',
    title: 'Templates & schedule',
    body: 'Build reusable workout templates (sets, reps, rest per exercise) and drop them onto days of the week. Each day shows colour-coded muscle-group bars so you can see your split at a glance. A full Upper / Lower / Bodyweight plan is already loaded.',
  },
  {
    icon: '⏱',
    title: 'Run a session',
    body: 'Start a workout and log weight, reps and RPE set by set. Your previous numbers sit right next to each input, a rest timer counts down with a chime, and you can drag exercises into a new order or swap one for a same-muscle alternative.',
  },
  {
    icon: '↗',
    title: 'Read your progress',
    body: 'The Progress tab turns your history into charts — muscle-group volume over time and per-lift weight progression. "Quick Read" auto-tags each trend good, watch or flag so plateaus and odd data entries surface on their own.',
  },
  {
    icon: '⚙',
    title: 'Your data stays yours',
    body: 'Every finished workout gets a summary with personal records. Tap any logged workout for a full set-by-set breakdown, export or import your whole history as JSON from Settings, and switch between dark and light themes.',
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
          <div className="w-20 h-20 rounded-3xl bg-blue-600/15 ring-1 ring-blue-500/30 flex items-center justify-center text-4xl text-blue-400 mb-8">
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
            {last ? 'Get started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
