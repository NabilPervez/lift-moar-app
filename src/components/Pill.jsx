import { MUSCLE_STYLE } from '../lib/constants'

export default function Pill({ label, styleKey, small }) {
  const st = MUSCLE_STYLE[styleKey] || {
    bg: 'bg-gray-500/15',
    text: 'text-gray-300',
    ring: 'ring-gray-500/30',
    dot: 'bg-gray-400',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${
        small ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } rounded-full font-semibold ring-1 ${st.bg} ${st.text} ${st.ring}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`}></span>
      {label}
    </span>
  )
}
