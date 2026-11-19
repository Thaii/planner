import * as React from 'react'
import { create } from 'zustand'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { markDone } from '@/lib/actions'
import { getS, update } from '@/lib/store'
import { pad, today, type DateStr } from '@/lib/date'

/**
 * Full-screen "start N minutes" timer. Used for Next up (5 min), self-care and dopamine menu items.
 * kind decides what "Log it" marks as done.
 */
interface Five { open: boolean; kind: string; id: string; d: DateStr; occ?: DateStr; title: string; lead: string; mins: number; end: number; left: number; run: boolean; ended: boolean }
const useFive = create<Five>(() => ({ open: false, kind: '', id: '', d: '', title: '', lead: '', mins: 5, end: 0, left: 300, run: false, ended: false }))

let audio: AudioContext | null = null
/** Browsers only allow sound after a tap, so call this from the button that starts a timer. */
export function unlockAudio() { try { audio = audio || new AudioContext(); audio.resume() } catch { /* no audio */ } }
export function chime() {
  try {
    if (!audio) return
    ;[0, 0.25, 0.5].forEach((d, i) => {
      const o = audio!.createOscillator(), g = audio!.createGain()
      o.frequency.value = [660, 880, 990][i]
      g.gain.setValueAtTime(0.0001, audio!.currentTime + d)
      g.gain.exponentialRampToValueAtTime(0.2, audio!.currentTime + d + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, audio!.currentTime + d + 0.6)
      o.connect(g).connect(audio!.destination); o.start(audio!.currentTime + d); o.stop(audio!.currentTime + d + 0.7)
    })
  } catch { /* no audio */ }
}

export function startFive(o: { kind: string; id: string; d?: DateStr; occ?: DateStr; title: string; mins?: number; lead?: string }) {
  try { audio = audio || new AudioContext() } catch { /* ignore */ }
  const mins = o.mins || 5
  useFive.setState({ open: true, kind: o.kind, id: o.id, d: o.d || today(), occ: o.occ, title: o.title, mins, lead: o.lead || 'Just five minutes. Starting is the hard part.', end: Date.now() + mins * 60000, left: mins * 60, run: true, ended: false })
}

export function FiveTimer() {
  const f = useFive()
  React.useEffect(() => {
    if (!f.open || !f.run) return
    const iv = setInterval(() => {
      const st = useFive.getState(), left = Math.max(0, Math.round((st.end - Date.now()) / 1000))
      if (left <= 0) {
        clearInterval(iv); chime()
        if (st.kind !== 'self' && st.kind !== 'dopa') update((d) => { const t = today(); d.focus[t] = (d.focus[t] || 0) + st.mins })
        useFive.setState({ left: 0, run: false, ended: true })
      } else useFive.setState({ left })
    }, 500)
    return () => clearInterval(iv)
  }, [f.open, f.run])
  if (!f.open) return null
  const close = () => useFive.setState({ open: false, run: false })
  const log = () => { markDone(f.kind, f.id, f.d, f.occ); close(); toast(f.kind === 'self' || f.kind === 'dopa' ? 'Logged. Looking after yourself counts.' : 'Logged. Momentum is built from exactly this.') }
  const dessert = f.kind === 'dopa' && getS().dopa.find((x) => x.id === f.id)?.course === 'dessert'
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-bg p-6 text-center">
      <span className="lbl text-accent">{f.lead}</span>
      <h2 className="mt-2 max-w-[560px] text-[28px]">{f.title}</h2>
      <div className="my-5 font-mono text-[clamp(64px,18vw,120px)] leading-none" aria-live="polite">
        {f.ended ? (f.kind === 'dopa' ? "Time's up." : 'Nice.') : `${Math.floor(f.left / 60)}:${pad(f.left % 60)}`}
      </div>
      <div className="flex flex-wrap justify-center gap-2.5">
        {!f.ended ? (
          <>
            <Button onClick={() => f.run ? useFive.setState({ run: false, left: Math.max(0, Math.round((f.end - Date.now()) / 1000)) }) : useFive.setState({ run: true, end: Date.now() + f.left * 1000 })}>{f.run ? 'Pause' : 'Resume'}</Button>
            <Button size="mono" onClick={close}>Stop</Button>
          </>
        ) : (
          <>
            <Button variant="primary" onClick={log}>{f.kind === 'self' || f.kind === 'dopa' ? 'I did it' : 'Log it'}</Button>
            {!dessert && <Button onClick={() => useFive.setState({ end: Date.now() + 600000, left: 600, run: true, ended: false })}>+10 minutes</Button>}
            <Button size="mono" onClick={close}>Stop here</Button>
          </>
        )}
      </div>
    </div>
  )
}
