/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register'
import { toast } from 'sonner'

/** When a new version has downloaded, show a "Refresh" button instead of waiting for the next launch. */
export function setupUpdates() {
  const update = registerSW({
    onNeedRefresh() {
      toast('A new version is ready', { duration: Infinity, id: 'update', action: { label: 'Refresh', onClick: () => update(true) } })
    },
    onRegisteredSW(_url, reg) {
      if (!reg) return
      // Look for updates when the app comes back to the front, and hourly while it stays open.
      const check = () => { if (navigator.onLine) reg.update().catch(() => {}) }
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check() })
      setInterval(check, 60 * 60 * 1000)
    },
  })
}
