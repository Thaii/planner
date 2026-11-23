import { MaybePal } from './pals'
import * as React from 'react'
import { create } from 'zustand'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { markDone } from '@/lib/actions'
import { getS, replaceState, update } from '@/lib/store'
import { Check } from 'lucide-react'
import { pad, today, type DateStr } from '@/lib/date'
import { ring, stopRing, unlockAudio } from '@/lib/sound'

// Kept for older imports.
export { unlockAudio }
export const chime = () => ring()

/**
 * Full-screen "start N minutes" timer. Used for Next up (5 min), self-care and dopamine menu items.
 * kind decides what "Log it" marks as done.
 */
interface Five { open: boolean; kind: string; id: string; d: DateStr; occ?: DateStr; title: string; lead: string; mins: number; end: number; left: number; run: boolean; ended: boolean }
const useFive = create<Five>(() => ({ open: false, kind: '', id: '', d: '', title: '', lead: '', mins: 5, end: 0, left: 300, run: false, ended: false }))

export function startFive(o: { kind: string; id: string; d?: DateStr; occ?: DateStr; title: string; mins?: number; lead?: string }) {
  const mins = o.mins || 5
  unlockAudio(); stopRing()
  useFive.setState({ open: true, kind: o.kind, id: o.id, d: o.d || today(), occ: o.occ, title: o.title, mins, lead: o.lead || 'Just five minutes. Starting is the hard part.', end: Date.now() + mins * 60000, left: mins * 60, run: true, ended: false })
}

export function FiveTimer() {
  const f = useFive()
  React.useEffect(() => {
    if (!f.open || !f.run) return
    const iv = setInterval(() => {
      const st = useFive.getState(), left = Math.max(0, Math.round((st.end - Date.now()) / 1000))
      if (left <= 0) {
        clearInterval(iv); ring(st.title ? '“' + st.title + '”' : 'Your timer')
        if (st.kind !== 'self' && st.kind !== 'dopa') update((d) => { const t = today(); d.focus[t] = (d.focus[t] || 0) + st.mins })
        useFive.setState({ left: 0, run: false, ended: true })
      } else useFive.setState({ left })
    }, 500)
    return () => clearInterval(iv)
  }, [f.open, f.run])
  if (!f.open) return null
  const close = () => { stopRing(); useFive.setState({ open: false, run: false }) }
  const care = f.kind === 'self' || f.kind === 'dopa'
  /** Mark it done (early or at the end). Undo puts everything back and reopens the timer, paused. */
  const log = () => {
    stopRing()
    const before = getS(), timer = { ...useFive.getState() }
    const left = timer.ended ? 0 : Math.max(0, Math.round((timer.end - Date.now()) / 1000))
    // Finishing early still counts the minutes actually spent (the end of the timer already counted the rest).
    if (!timer.ended && !care) { const spent = Math.ceil((timer.mins * 60 - left) / 60); if (spent > 0) update((d) => { const t = today(); d.focus[t] = (d.focus[t] || 0) + spent }) }
    markDone(f.kind, f.id, f.d, f.occ); close()
    toast(care ? 'Logged. Looking after yourself counts.' : timer.ended ? 'Logged. Momentum is built from exactly this.' : 'Done – nice work.', {
      action: { label: 'Undo', onClick: () => { replaceState(before); useFive.setState({ ...timer, open: true, run: false, left: timer.ended ? 0 : left }) } },
    })
  }
  const dessert = f.kind === 'dopa' && getS().dopa.find((x) => x.id === f.id)?.course === 'dessert'
  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-bg p-6 text-center">
      <span className="lbl text-accent">{f.lead}</span>
      <h2 className="mt-2 max-w-[560px] text-[28px]">{f.title}</h2>
      <MaybePal name="pom" size={110} className="mt-4" />
      <div className="my-5 font-mono text-[clamp(64px,18vw,120px)] leading-none" aria-live="polite">
        {f.ended ? (f.kind === 'dopa' ? "Time's up." : 'Nice.') : `${Math.floor(f.left / 60)}:${pad(f.left % 60)}`}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {!f.ended ? (
          <>
            <Button size="lg" className="min-w-[100px] px-4" onClick={() => f.run ? useFive.setState({ run: false, left: Math.max(0, Math.round((f.end - Date.now()) / 1000)) }) : (unlockAudio(), useFive.setState({ run: true, end: Date.now() + f.left * 1000 }))}>{f.run ? 'Pause' : 'Resume'}</Button>
            <Button size="lg" variant="primary" className="min-w-[100px] px-4" onClick={log}><Check className="size-4" />{care ? 'I did it' : 'Done'}</Button>
            <Button size="lg" className="min-w-[100px] px-4" onClick={close}>Stop</Button>
          </>
        ) : (
          <>
            <Button size="lg" variant="primary" className="min-w-[100px] px-4" onClick={log}><Check className="size-4" />{care ? 'I did it' : 'Mark done'}</Button>
            {!dessert && <Button size="lg" className="min-w-[100px] px-4" onClick={() => { stopRing(); useFive.setState({ end: Date.now() + 600000, left: 600, run: true, ended: false }) }}>+10 minutes</Button>}
            <Button size="lg" className="min-w-[100px] px-4" onClick={close}>Stop here</Button>
          </>
        )}
      </div>
    </div>
  )
}
