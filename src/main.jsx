import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { runMigrations } from './lib/migrations'
import { abandonHydrate, hydrateStorage } from './lib/storage'
import { applyStoredTheme } from './lib/theme'
import '@fontsource-variable/inter'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

// Load IndexedDB into memory before anything reads storage. Bounded so a
// stuck IndexedDB can never leave the app on a blank screen.
async function boot() {
  const done = await Promise.race([
    hydrateStorage().then(() => true),
    new Promise((r) => setTimeout(() => r(false), 2500)),
  ])
  if (!done) abandonHydrate()
  runMigrations()
  applyStoredTheme()
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

// Prompt-style SW updates: the app decides when it's safe to reload (never
// mid-workout). See App.jsx `lift:update-ready`.
const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('lift:update-ready', { detail: { update: updateSW } }))
  },
})

boot()
