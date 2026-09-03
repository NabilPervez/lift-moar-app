// Shared framer-motion variants — subtle, professional: short easings, small
// offsets, gentle stagger. `MotionConfig reducedMotion="user"` at the app root
// keeps these opacity-only for anyone who prefers reduced motion.

const EASE = [0.16, 1, 0.3, 1]

export const fade = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.25, ease: EASE } },
}

export const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
}

export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.03 } },
}

export const listStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
}
