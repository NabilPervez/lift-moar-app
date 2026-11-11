import { useRef, useState } from 'react'
import Header from '../components/Header'
import ConfirmButton from '../components/ConfirmButton'
import { getSettings, patchSettings } from '../lib/settings'
import { canNotify, ensureNotifyPermission } from '../lib/notify'

import { lastBackupLabel, parseBackup } from '../lib/backup'

export default function SettingsView({
  theme,
  setTheme,
  history,
  onExport,
  onImport,
  onOpenHistory,
  onLoadSample,
  onClearHistory,
  onReplayIntro,
}) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState(null)
  const [pendingImport, setPendingImport] = useState(null)
  const [prefs, setPrefs] = useState(() => getSettings())
  const [notifyState, setNotifyState] = useState(() =>
    canNotify() ? Notification.permission : 'unsupported',
  )

  const setPref = (patch) => {
    patchSettings(patch)
    setPrefs((p) => ({ ...p, ...patch }))
  }

  const requestAlerts = async () => {
    const ok = await ensureNotifyPermission()
    setNotifyState(canNotify() ? Notification.permission : 'unsupported')
    setPref({ notifyAsked: true })
    flash(ok ? 'Rest alerts enabled.' : 'Notification permission not granted.', ok ? 'ok' : 'err')
  }

  const flash = (text, tone = 'ok') => {
    setMsg({ text, tone })
    setTimeout(() => setMsg(null), 4000)
  }

  const doExport = () => {
    const n = onExport()
    flash(`Backed up ${n} workout${n === 1 ? '' : 's'} plus your exercises and plan.`)
  }

  const onPickFile = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      setPendingImport(parseBackup(JSON.parse(text)))
      setMsg(null)
    } catch (err) {
      flash(err.message || 'Could not read that file.', 'err')
    }
  }

  const applyImport = () => {
    const added = onImport(pendingImport)
    setPendingImport(null)
    flash(
      added
        ? `Added ${added} workout${added === 1 ? '' : 's'}. Nothing was overwritten.`
        : 'Everything in that file is already here.',
    )
  }

  return (
    <div className="pb-28">
      <Header title="Settings" />
      <div className="px-4 space-y-6">
        {/* Appearance */}
        <section>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Appearance
          </div>
          <div className="bg-surface-800 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Theme</div>
                <div className="text-gray-500 text-sm">Dark or light</div>
              </div>
              <div className="flex bg-surface-700 rounded-xl p-1">
                {['dark', 'light'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${
                      theme === t ? 'bg-blue-600 text-white' : 'text-gray-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Preferences
          </div>
          <div className="bg-surface-800 rounded-2xl border border-white/5 divide-y divide-white/5">
            <div className="px-4 py-4 flex items-center justify-between">
              <div>
                <div className="font-semibold">Haptics</div>
                <div className="text-gray-500 text-sm">Vibrate on set complete & PRs</div>
              </div>
              <button
                role="switch"
                aria-checked={prefs.haptics !== false}
                onClick={() => setPref({ haptics: prefs.haptics === false })}
                className={`w-12 h-7 rounded-full p-0.5 transition-colors flex-shrink-0 ${
                  prefs.haptics !== false ? 'bg-blue-600' : 'bg-surface-600'
                }`}
              >
                <span
                  className={`block w-6 h-6 rounded-full bg-white transition-transform ${
                    prefs.haptics !== false ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
            <div className="px-4 py-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">Rest timer alerts</div>
                <div className="text-gray-500 text-sm">
                  {notifyState === 'granted'
                    ? 'On — you\'ll be notified when rest ends'
                    : notifyState === 'denied'
                      ? 'Blocked in your browser settings'
                      : notifyState === 'unsupported'
                        ? 'Not supported on this device'
                        : 'Get a notification when a rest timer finishes'}
                </div>
              </div>
              {notifyState === 'default' && (
                <button
                  onClick={requestAlerts}
                  className="tap-sm min-h-0 text-xs font-bold text-white bg-blue-600 px-3 py-2 rounded-lg flex-shrink-0"
                >
                  Enable
                </button>
              )}
            </div>
          </div>
        </section>

        {/* History data */}
        <section>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Workout History
          </div>
          <div className="bg-surface-800 rounded-2xl border border-white/5 divide-y divide-white/5">
            <button
              onClick={onOpenHistory}
              className="w-full text-left px-4 py-4 flex items-center justify-between tap"
            >
              <div>
                <div className="font-semibold">View workout history</div>
                <div className="text-gray-500 text-sm">
                  {history.length} logged · tap a workout for full set detail
                </div>
              </div>
              <span className="text-gray-500 text-lg">›</span>
            </button>
            <button onClick={doExport} className="w-full text-left px-4 py-4 tap">
              <div className="font-semibold">Back up everything (JSON)</div>
              <div className="text-gray-500 text-sm">Workouts, exercises, plan and bodyweight · {lastBackupLabel()}</div>
            </button>
            <button
              onClick={() => fileRef.current && fileRef.current.click()}
              className="w-full text-left px-4 py-4 tap"
            >
              <div className="font-semibold">Restore from backup</div>
              <div className="text-gray-500 text-sm">Merges into what's here — never overwrites</div>
            </button>
            <div className="px-4 py-4">
              <div className="font-semibold">Load sample data</div>
              <div className="text-gray-500 text-sm mb-2">
                Replace history with the demo training block
              </div>
              <ConfirmButton
                onConfirm={() => {
                  const n = onLoadSample()
                  flash(`Loaded ${n} sample workout${n === 1 ? '' : 's'}.`)
                }}
                confirmLabel={`Replace ${history.length} workout${history.length === 1 ? '' : 's'}? Tap again`}
                className="tap text-sm font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2.5 rounded-xl"
                armedClassName="tap text-sm font-bold text-white bg-blue-600 px-4 py-2.5 rounded-xl"
              >
                Load sample data
              </ConfirmButton>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={onPickFile}
            className="hidden"
          />
          {pendingImport && (
            <div className="mt-2 bg-surface-800 border border-blue-500/30 rounded-xl p-3 flex items-center justify-between gap-3">
              <div className="text-sm">
                Merge <span className="font-bold num">{pendingImport.history.length}</span> workouts into your{' '}
                <span className="font-bold num">{history.length}</span>?
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => setPendingImport(null)}
                  className="tap text-xs font-bold text-gray-400 px-3 py-2 rounded-lg bg-surface-700"
                >
                  Cancel
                </button>
                <button
                  onClick={applyImport}
                  className="tap text-xs font-bold text-white px-3 py-2 rounded-lg bg-blue-600"
                >
                  Merge
                </button>
              </div>
            </div>
          )}
          {msg && (
            <p
              className={`text-sm mt-2 font-medium ${
                msg.tone === 'err' ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {msg.text}
            </p>
          )}
        </section>

        {/* About */}
        <section>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">About</div>
          <div className="bg-surface-800 rounded-2xl border border-white/5">
            <button onClick={onReplayIntro} className="w-full text-left px-4 py-4 tap">
              <div className="font-semibold">Replay the intro</div>
              <div className="text-gray-500 text-sm">See the walkthrough of how the app works</div>
            </button>
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <div className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">
            Danger zone
          </div>
          <div className="bg-surface-800 rounded-2xl border border-red-500/20 p-4">
            <ConfirmButton
              onConfirm={() => {
                onClearHistory()
                flash('All workout history deleted.')
              }}
              confirmLabel={`Delete all ${history.length}? Tap again to confirm`}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3 rounded-xl tap"
              armedClassName="w-full bg-red-600 text-white font-bold py-3 rounded-xl tap"
            >
              Delete all workout history
            </ConfirmButton>
          </div>
        </section>

        <p className="text-center text-xs text-gray-500 pt-2">
          Made by{' '}
          <a
            href="https://nabilpervezconsulting.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gray-400 hover:text-blue-400 underline underline-offset-2"
          >
            nabilpervezconsulting.com
          </a>
        </p>
      </div>
    </div>
  )
}
