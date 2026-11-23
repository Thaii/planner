/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register'
import { toast } from 'sonner'

/** When a new version has downloaded, show a "Refresh" button instead of waiting for the next launch. */
let reg: ServiceWorkerRegistration | undefined

/** "Check for updates" button: ask for the newest version now. If there is one, the usual Refresh toast appears. */
export async function checkForUpdates() {
  if (!navigator.onLine) { toast("You're offline – connect to the internet and try again"); return }
  if (!reg) { toast('Reloading to get the latest version…'); setTimeout(() => location.reload(), 600); return }
  toast('Checking for updates…', { id: 'update-check' })
  try { await reg.update() } catch { /* fall through */ }
  setTimeout(() => {
    if (reg?.waiting || reg?.installing) return toast.dismiss('update-check')
    toast("You're on the latest version", { id: 'update-check' })
  }, 2500)
}

export function setupUpdates() {
  const update = registerSW({
    onNeedRefresh() {
      toast('A new version is ready', { duration: Infinity, id: 'update', action: { label: 'Refresh', onClick: () => update(true) } })
    },
    onRegisteredSW(_url, r) {
      if (!r) return
      reg = r
      // Look for updates when the app comes back to the front, and hourly while it stays open.
      const check = () => { if (navigator.onLine) r.update().catch(() => {}) }
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check() })
      setInterval(check, 60 * 60 * 1000)
    },
  })
}
