import { useEffect, useState } from 'react'
import { getSettings, patchSettings } from '../lib/settings'

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream

/** Dismissible "add to home screen" prompt — native on Android, an instruction card on iOS. */
export default function A2HSBanner() {
  const [deferred, setDeferred] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isStandalone()) return undefined
    const dismissedAt = getSettings().a2hsDismissedAt || 0
    if (Date.now() - dismissedAt < 1000 * 60 * 60 * 24 * 14) return undefined // snooze 2 weeks

    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)

    let iosTimer
    if (isIos()) iosTimer = setTimeout(() => setShow(true), 1500)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      clearTimeout(iosTimer)
    }
  }, [])

  if (!show) return null

  const dismiss = () => {
    setShow(false)
    patchSettings({ a2hsDismissedAt: Date.now() })
  }

  const install = async () => {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    setDeferred(null)
    dismiss()
  }

  return (
    <div className="fixed left-0 right-0 z-30 px-4" style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 8px)' }}>
      <div className="max-w-md mx-auto slide-up bg-surface-700 border border-blue-500/30 rounded-xl p-3 flex items-center gap-3 shadow-2xl shadow-black/50">
        <div className="w-9 h-9 rounded-lg bg-blue-600/15 ring-1 ring-blue-500/30 flex items-center justify-center text-blue-400 text-lg flex-shrink-0">
          ↓
        </div>
        <div className="flex-1 min-w-0 text-sm">
          {deferred ? (
            <span>Install Lift Moar for full-screen, offline access.</span>
          ) : (
            <span>
              Add to Home Screen: tap <span className="font-bold">Share</span> then{' '}
              <span className="font-bold">Add to Home Screen</span>.
            </span>
          )}
        </div>
        {deferred && (
          <button
            onClick={install}
            className="tap-sm min-h-0 text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-lg flex-shrink-0"
          >
            Install
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="tap-sm min-h-0 text-gray-400 font-bold px-1 flex-shrink-0"
        >
          &times;
        </button>
      </div>
    </div>
  )
}
