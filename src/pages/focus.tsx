import { create } from 'zustand'
import { toast } from 'sonner'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import { PageHead } from '@/components/bits'
import { ring, stopRing, unlockAudio } from '@/lib/sound'
import { getS, update, useS } from '@/lib/store'
import { addD, dow, DOWN, pad, range, today } from '@/lib/date'
import { tasksOn } from '@/lib/logic'
import { plannerTitle } from '@/lib/greeting'
import { cn } from '@/lib/utils'

/** Lives outside the page so the timer keeps running while you move around the planner. */
interface F { len: number; left: number; run: boolean; end: number; task: string }
const useF = create<F>(() => ({ len: 25, left: 25 * 60, run: false, end: 0, task: '' }))
let iv: ReturnType<typeof setInterval> | undefined
const clock = (n: number) => Math.floor(n / 60) + ':' + pad(n % 60)
const resetTitle = () => { document.title = plannerTitle(getS().settings).filter(Boolean).join(' ') }

function tick() {
  const f = useF.getState()
  const left = Math.max(0, Math.round((f.end - Date.now()) / 1000))
  useF.setState({ left })
  document.title = clock(left) + ' · Focus'
  if (left <= 0) {
    clearInterval(iv)
    const t = today()
    update((d) => { d.focus[t] = (d.focus[t] || 0) + f.len })
    useF.setState({ run: false, left: f.len * 60 })
    resetTitle(); ring(f.task ? 'Focus on “' + f.task + '”' : 'Your focus session')
    toast('Focus session done – nice work. Take a short break.')
  }
}
function startPause() {
  const f = useF.getState()
  if (f.run) { clearInterval(iv); useF.setState({ run: false }); resetTitle(); return }
  unlockAudio()
  useF.setState({ run: true, end: Date.now() + f.left * 1000 })
  clearInterval(iv); iv = setInterval(tick, 500); tick()
}
function reset(len = useF.getState().len) { stopRing(); clearInterval(iv); useF.setState({ len, left: len * 60, run: false }); resetTitle() }

const R = 96, C = 2 * Math.PI * R

export function FocusPage() {
  const s = useS()
  const f = useF()
  const t = today()
  const week = range(addD(t, -6), 7)
  const max = Math.max(25, ...week.map((d) => s.focus[d] || 0))
  const open = tasksOn(s, t).filter((x) => !x.done).map((x) => x.k.title)
  return (
    <div>
      <PageHead crumb="Focus" title="Focus timer" />
      <div className="grid gap-3 min-[900px]:grid-cols-[minmax(0,460px)_1fr]">
        <Card className="text-center">
          <Segmented value={String(f.len)} onChange={(v) => !f.run && reset(+v)} options={[['15', '15 min'], ['25', '25 min'], ['45', '45 min'], ['60', '60 min']]} />
          <svg viewBox="0 0 220 220" className="mx-auto my-2 w-[min(240px,70vw)]" role="img" aria-label={clock(f.left) + ' left'}>
            <circle cx="110" cy="110" r={R} fill="none" stroke="var(--soft)" strokeWidth="10" />
            <circle cx="110" cy="110" r={R} fill="none" stroke="var(--accent)" strokeWidth="10" strokeLinecap="round" transform="rotate(-90 110 110)"
              strokeDasharray={C} strokeDashoffset={C * (1 - f.left / (f.len * 60))} style={{ transition: 'stroke-dashoffset .5s linear' }} />
            <text x="110" y="122" textAnchor="middle" fill="var(--ink)" style={{ font: '400 40px var(--font-mono)' }}>{clock(f.left)}</text>
          </svg>
          <Input list="focusTasks" placeholder="What are you focusing on?" value={f.task} onChange={(e) => useF.setState({ task: e.target.value })} className="mb-3 text-center" />
          <datalist id="focusTasks">{open.map((x) => <option key={x} value={x} />)}</datalist>
          <div className="flex justify-center gap-2">
            <Button variant="primary" size="lg" onClick={startPause}>{f.run ? 'Pause' : f.left < f.len * 60 ? 'Resume' : 'Start'}</Button>
            <Button size="lg" onClick={() => reset()}>Reset</Button>
          </div>
          <p className="mb-0 text-[13px] text-mute">Focused today: <b className="text-ink">{s.focus[t] || 0} min</b>. Minutes from Next up timers count too.</p>
        </Card>
        <Card>
          <CardHeader title="Last 7 days" action={<span className="text-[12.5px] text-mute">{week.reduce((a, d) => a + (s.focus[d] || 0), 0)} min</span>} />
          <div className="flex h-40 items-end gap-2">
            {week.map((d) => {
              const m = s.focus[d] || 0
              return (
                <div key={d} className="flex flex-1 flex-col items-center gap-1">
                  <span className="font-mono text-[10.5px] text-mute">{m || ''}</span>
                  <div className={cn('w-full rounded-md', d === t ? 'bg-accent' : 'bg-accent/45')} style={{ height: Math.max(3, (m / max) * 110) }} />
                  <span className={cn('text-[11px] text-mute', d === t && 'font-bold text-accent')}>{DOWN[dow(d)].slice(0, 2)}</span>
                </div>
              )
            })}
          </div>
          <p className="mb-0 text-[13px] text-mute">Stuck starting? Pick the smallest piece, set 15 minutes and only promise yourself that. Stopping when it rings is allowed.</p>
        </Card>
      </div>
    </div>
  )
}
