import { setupUpdates } from './lib/pwa-update'
import { setupSync } from './lib/gsync'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './emoji-font.css'
import './index.css'
import App from './App.tsx'
import { loadState } from './lib/store'
import { viewFromHash } from './lib/ui'

viewFromHash()
loadState().finally(() => {
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
  setupUpdates()
  setupSync()
})
