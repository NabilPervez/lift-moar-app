import { useState } from 'react'
import { AnimatePresence, m, useReducedMotion } from 'framer-motion'

const SLIDES = [
  {
    icon: '▦',
    title: 'Functional Lift Tracker',
    body: 'Plan your training week, run guided sessions, and watch your numbers move — all on your phone. No account, nothing in the cloud: every workout lives in this browser and only this browser.',
  },
  {
    icon: '☰',
    title: 'Templates & schedule',
    body: 'Build reusable workout templates (sets, reps, rest per exercise) and drop them onto days of the week. Each day shows colour-coded muscle-group pills so you can see your split at a glance. A full Upper / Lower / Bodyweight plan is already loaded.',
  },
  {
    icon: '⏱',
    title: 'Run a session',
    body: 'Start a workout and log weight, reps and RPE set by set. Your previous numbers sit right next to each input, a rest timer counts down with a chime, and you can swap any exercise mid-session for a same-muscle alternative.',
  },
  {
    icon: '↗',
    title: 'Read your progress',
    body: 'The Progress tab turns your history into charts — muscle-group volume over time and per-lift weight progression. "Quick Read" auto-tags each trend good, watch or flag so plateaus and odd data entries surface on their own.',
  },
  {
    icon: '⚙',
    title: 'Your data stays yours',
    body: 'Tap any logged workout for a full set-by-set breakdown. Export or import your whole history as JSON from Settings, switch between dark and light themes, and load or clear the sample data whenever you like.',
  },
]

export default function Onboarding({ onDone }) {
  const [[i, dir], setStep] = useState([0, 0])
  const reduce = useReducedMotion()
  const last = i === SLIDES.length - 1
  const s = SLIDES[i]
  const go = (delta) => setStep(([cur]) => [cur + delta, delta])
  const shift = reduce ? 0 : 24

  return (
    <div className="fixed inset-0 z-50 bg-surface flex flex-col safe-top safe-bottom">
      <div className="flex justify-end px-4 pt-3">
        <button onClick={onDone} className="tap text-sm font-semibold text-gray-500 hover:text-white px-2">
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <m.div
            key={i}
            custom={dir}
            initial={{ opacity: 0, x: dir >= 0 ? shift : -shift }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir >= 0 ? -shift : shift }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-blue-600/15 ring-1 ring-blue-500/30 flex items-center justify-center text-4xl text-blue-400 mb-8">
              {s.icon}
            </div>
            <h2 className="text-2xl font-black tracking-tight mb-3">{s.title}</h2>
            <p className="text-gray-400 leading-relaxed max-w-sm">{s.body}</p>
          </m.div>
        </AnimatePresence>
      </div>

      <div className="px-8 pb-8">
        <div className="flex justify-center gap-2 mb-6">
          {SLIDES.map((_, idx) => (
            <m.span
              key={idx}
              className={`h-1.5 rounded-full ${idx === i ? 'bg-blue-500' : 'bg-surface-600'}`}
              animate={{ width: idx === i ? 24 : 6 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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
