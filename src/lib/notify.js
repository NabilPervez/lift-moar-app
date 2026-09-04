/**
 * Best-effort local notifications for the rest timer. If permission isn't
 * granted (or the API is missing) callers fall back to the in-app chime/flash.
 */
export function canNotify() {
  return typeof Notification !== 'undefined'
}

export async function ensureNotifyPermission() {
  if (!canNotify()) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    return (await Notification.requestPermission()) === 'granted'
  } catch (e) {
    return false
  }
}

export function notifyRestOver(body) {
  if (!canNotify() || Notification.permission !== 'granted') return
  if (!document.hidden) return // in-app cue already handled it
  try {
    const n = new Notification('Rest complete', {
      body: body || 'Time for your next set.',
      icon: '/pwa-192.png',
      badge: '/favicon-32.png',
      tag: 'lift-moar-rest',
      renotify: true,
      silent: false,
    })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch (e) {
    /* ignore */
  }
}
