import { useEffect, useRef } from 'react'
import { useReward } from 'partycles'

// Base burst is always one of these; a PR adds fireworks then mortar on top.
const BASE = ['confetti', 'galaxy']

/**
 * One-shot celebration overlay. Mounted by lib/celebrate.js into its OWN React
 * root outside <StrictMode>, so partycles' create/unmount-root lifecycle never
 * races the app's render pass. Fires on mount, then calls onDone once the last
 * burst has had time to finish so the host can tear the root down.
 */
export default function Celebration({ pr = false, onDone }) {
  const ref = useRef(null)
  const base = useRef(BASE[Math.floor(Math.random() * BASE.length)]).current

  const confetti = useReward(ref, 'confetti', { particleCount: 55, spread: 100 })
  const galaxy = useReward(ref, 'galaxy', { particleCount: 45 })
  const fireworks = useReward(ref, 'fireworks', { particleCount: 5, spread: 160 })
  const mortar = useReward(ref, 'mortar', { particleCount: 40, spread: 120 })

  useEffect(() => {
    const timers = []
    ;(base === 'galaxy' ? galaxy : confetti).reward()
    if (pr) {
      timers.push(setTimeout(() => fireworks.reward(), 450))
      timers.push(setTimeout(() => mortar.reward(), 900))
    }
    timers.push(setTimeout(() => onDone && onDone(), pr ? 5200 : 3800))
    return () => timers.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: '50%',
        top: '26%',
        width: 4,
        height: 4,
        pointerEvents: 'none',
        zIndex: 80,
      }}
    />
  )
}
