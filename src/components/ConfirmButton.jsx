import { useEffect, useState } from 'react'

/**
 * A button that requires a second tap to fire. First tap "arms" it (showing
 * `confirmLabel` with `armedClassName`); a second tap within 3s calls
 * `onConfirm`. Used for destructive actions instead of window.confirm().
 */
export default function ConfirmButton({
  children,
  confirmLabel,
  onConfirm,
  className = '',
  armedClassName = '',
  ariaLabel,
  stopPropagation = true,
}) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return undefined
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={armed ? armedClassName || className : className}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation()
        if (armed) {
          onConfirm()
          setArmed(false)
        } else {
          setArmed(true)
        }
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  )
}
