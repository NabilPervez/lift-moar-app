import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { runMigrations } from './lib/migrations'
import { applyStoredTheme } from './lib/theme'
import '@fontsource-variable/inter'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

runMigrations()
applyStoredTheme()

// Prompt-style SW updates: the app decides when it's safe to reload (never
// mid-workout). See App.jsx `lift:update-ready`.
const updateSW = registerSW({
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent('lift:update-ready', { detail: { update: updateSW } }))
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
