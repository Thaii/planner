import { getS } from './store'

/**
 * Timer sounds for the 5-minute starter, Focus, self-care and dopamine timers.
 * Gentle: a two-note bell, three times. Repeat: keeps ringing until stopped (max 2 minutes). Off: silent.
 * Also vibrates (Android), flashes the tab title, and shows a notification if the page isn't in front.
 */
let ctx: AudioContext | null = null
let loop: ReturnType<typeof setTimeout> | undefined
let flash: ReturnType<typeof setInterval> | undefined
let savedTitle = ''

/** Browsers only allow sound after a tap: call this from the button that starts a timer. */
export function unlockAudio() {
  try { ctx = ctx || new AudioContext(); if (ctx.state !== 'running') void ctx.resume() } catch { /* no audio */ }
}

/** One soft "ding-dong": two bell-like notes with a few overtones and a long fade. */
function bell() {
  if (!ctx) return
  const t0 = ctx.currentTime + 0.02
  const master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination)
  ;[[784, 0], [1047, 0.42]].forEach(([f, d]) => {
    ;[[1, 0.6], [2, 0.18], [3.01, 0.08]].forEach(([mult, vol]) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain()
      o.type = 'sine'; o.frequency.value = f * mult
      g.gain.setValueAtTime(0.0001, t0 + d)
      g.gain.exponentialRampToValueAtTime(vol, t0 + d + 0.015)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 1.6)
      o.connect(g).connect(master); o.start(t0 + d); o.stop(t0 + d + 1.7)
    })
  })
}

function startFlash(msg: string) {
  if (flash) return
  savedTitle = document.title
  let on = false
  flash = setInterval(() => { on = !on; document.title = on ? msg : savedTitle }, 900)
  const done = () => { if (document.visibilityState === 'visible' && document.hasFocus()) stopRing() }
  // Stop flashing once they're looking at the page again.
  addEventListener('focus', done, { once: true }); document.addEventListener('pointerdown', stopRing, { once: true })
}

async function notify(title: string, body: string) {
  if (!getS().settings.timerNotify || typeof Notification === 'undefined' || Notification.permission !== 'granted') return
  if (document.visibilityState === 'visible' && document.hasFocus()) return
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.showNotification(title, { body, tag: 'timer', icon: 'icon-192.png' })
    else new Notification(title, { body, tag: 'timer', icon: 'icon-192.png' })
  } catch { /* notifications unavailable */ }
}

/** Play the end-of-timer alert the user chose. `what` is used in the notification. */
export function ring(what = 'Your timer') {
  const mode = getS().settings.sound || 'gentle'
  stopRing()
  startFlash("⏰ Time's up")
  void notify("⏰ Time's up", what + ' has finished.')
  try { navigator.vibrate?.(mode === 'off' ? 0 : [300, 150, 300, 150, 300]) } catch { /* no vibration */ }
  if (mode === 'off') return
  unlockAudio()
  let n = 0
  const max = mode === 'repeat' ? 48 : 3 // repeat: up to ~2 minutes
  const go = () => { bell(); if (++n < max) loop = setTimeout(go, 2400) }
  go()
}

/** Stop any ringing and the title flashing. */
export function stopRing() {
  clearTimeout(loop); loop = undefined
  if (flash) { clearInterval(flash); flash = undefined; if (savedTitle) document.title = savedTitle }
  try { navigator.vibrate?.(0) } catch { /* ignore */ }
}

/** For the "Test sound" button. */
export function testSound() { unlockAudio(); stopRing(); const mode = getS().settings.sound || 'gentle'; if (mode !== 'off') bell(); try { navigator.vibrate?.(200) } catch { /* ignore */ } }

export async function askNotify(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  return (await Notification.requestPermission()) === 'granted'
}
