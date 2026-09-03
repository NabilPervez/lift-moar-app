import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { runMigrations } from './lib/migrations'
import { applyStoredTheme } from './lib/theme'
import './index.css'

runMigrations()
applyStoredTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
