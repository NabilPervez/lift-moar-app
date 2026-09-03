import { useRef, useState } from 'react'
import Header from '../components/Header'

const EXPORT_VERSION = 1

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function normalizeImport(parsed) {
  const arr = Array.isArray(parsed) ? parsed : parsed && parsed.history
  if (!Array.isArray(arr)) throw new Error('No history array found in file.')
  const clean = arr.filter(
    (w) => w && typeof w === 'object' && w.date && Array.isArray(w.exercises),
  )
  if (!clean.length) throw new Error('File contained no valid workouts.')
  return clean
}

export default function SettingsView({ theme, setTheme, history, setHistory, onOpenHistory }) {
  const fileRef = useRef(null)
  const [msg, setMsg] = useState(null)

  const flash = (text, tone = 'ok') => {
    setMsg({ text, tone })
    setTimeout(() => setMsg(null), 4000)
  }

  const doExport = () => {
    const payload = {
      app: 'lift-moar',
      type: 'history',
      version: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      count: history.length,
      history,
    }
    const stamp = new Date().toISOString().slice(0, 10)
    download(`lift-moar-history-${stamp}.json`, JSON.stringify(payload, null, 2))
    flash(`Exported ${history.length} workout${history.length === 1 ? '' : 's'}.`)
  }

  const onPickFile = async (e) => {
    const file = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const workouts = normalizeImport(JSON.parse(text))
      const ok = window.confirm(
        `Import ${workouts.length} workout${workouts.length === 1 ? '' : 's'}? ` +
          `This replaces your current history (${history.length}).`,
      )
      if (!ok) return
      setHistory(workouts)
      flash(`Imported ${workouts.length} workout${workouts.length === 1 ? '' : 's'}.`)
    } catch (err) {
      flash(err.message || 'Could not read that file.', 'err')
    }
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
              <div className="font-semibold">Export history (JSON)</div>
              <div className="text-gray-500 text-sm">Download a backup of every logged workout</div>
            </button>
            <button
              onClick={() => fileRef.current && fileRef.current.click()}
              className="w-full text-left px-4 py-4 tap"
            >
              <div className="font-semibold">Import history (JSON)</div>
              <div className="text-gray-500 text-sm">Replace history from a previously exported file</div>
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={onPickFile}
            className="hidden"
          />
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
      </div>
    </div>
  )
}
