import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import LedgerApp from './LedgerApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LedgerApp />
  </StrictMode>,
)

// Register Service Worker (installable PWA)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // Keep silent in production
    })
  })
}
