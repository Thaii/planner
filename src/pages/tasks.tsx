import * as React from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { CommitInput, InlineAdd, Input } from '@/components/ui/field'
import { PageHead } from '@/components/bits'
import { startFive } from '@/components/five'
import { chooseForDay } from '@/components/chooser'
import { useS, update, getS } from '@/lib/store'
import { addD, fmt, mins, minsLabel, nowMins, today, type DateStr } from '@/lib/date'
import { eventsOn, isRep, tasksOn } from '@/lib/logic'
import { addTask, setPrio, skipTask, togglePrio, toggleTask } from '@/lib/actions'
import type { DayPlan, State } from '@/lib/types'
import { cn } from '@/lib/utils'

/** One thing to do today: a Top 3 priority ('p:0'…) or a to-do ('t:<id>'). */
interface Todo { key: string; kind: 'prio' | 'task'; id: string; occ?: DateStr; title: string; done: boolean; over?: boolean; rep?: boolean; step?: string; prioN?: number }

function todos(s: State, d: DateStr): Todo[] {
  const out: Todo[] = [], p = s.prio[d]
  const prioTitles = new Set<string>()
  p?.items.forEach((t, i) => {
    if (!t?.trim()) return
    prioTitles.add(t.trim().toLowerCase())
    out.push({ key: 'p:' + i, kind: 'prio', id: String(i), title: t, done: !!p.done?.[i], prioN: i + 1 })
  })
  const occs = tasksOn(s, d)
  for (const x of occs) {
    if (prioTitles.has(x.k.title.trim().toLowerCase())) continue // already showing as a priority
    // A repeating to-do missed earlier and also due today: show it once (today's).
    if (x.over && isRep(x.k) && occs.some((y) => y.k.id === x.k.id && !y.over)) continue
    out.push({ key: 't:' + x.k.id + (isRep(x.k) ? ':' + x.occ : ''), kind: 'task', id: x.k.id, occ: x.occ, title: x.k.title, done: x.done, over: x.over, rep: isRep(x.k), step: x.k.step })
  }
  return out
}

const CAP = { low: 2, ok: 3, good: 4 } as const
const ENERGY_VAL = { low: 25, ok: 55, good: 85 } as const

/** Sort open items: chosen "now" → the dreaded one → priorities → overdue → the rest. */
function plan(list: Todo[], dp: DayPlan) {
  const open = list.filter((x) => !x.done)
  const rank = (x: Todo) => (x.kind === 'prio' ? 0 : x.over ? 1 : 2)
  const sorted = open.map((x, i) => ({ x, i })).sort((a, b) => rank(a.x) - rank(b.x) || a.i - b.i).map((o) => o.x)
  const now = sorted.find((x) => x.key === dp.now) || sorted.find((x) => x.key === dp.dread) || sorted[0]
  const rest = sorted.filter((x) => x !== now), cap = CAP[dp.energy || 'ok']
  return { now, next: rest.slice(0, cap), later: rest.slice(cap), done: list.filter((x) => x.done) }
}

const setPlan = (d: DateStr, fn: (p: DayPlan) => void) => update((st) => { st.dayPlan = st.dayPlan || {}; fn((st.dayPlan[d] = st.dayPlan[d] || {})) })

function finish(x: Todo, d: DateStr) {
  if (x.kind === 'prio') {
    togglePrio(d, +x.id)
    // A priority that's also a to-do: tick both, so the Dashboard agrees.
    const k = getS().tasks.find((t) => !t.done && !isRep(t) && t.title.trim().toLowerCase() === x.title.trim().toLowerCase())
    if (k && !x.done) toggleTask(k.id, d)
  } else toggleTask(x.id, x.occ || d)
}

/* ---------- time available ---------- */
function useMinute() {
  const [, set] = React.useState(0)
  React.useEffect(() => { const iv = setInterval(() => set((n) => n + 1), 30000); return () => clearInterval(iv) }, [])
}
function TimeLeft({ s, d }: { s: State; d: DateStr }) {
  useMinute()
  if (d !== today()) return null
  const n = nowMins()
  const ev = eventsOn(s, d).filter((e) => e.time).map((e) => ({ t: e.title, a: mins(e.time!), b: e.end && mins(e.end) > mins(e.time!) ? mins(e.end) : mins(e.time!) + 60 })).sort((a, b) => a.a - b.a)
  const cur = ev.find((e) => e.a <= n && n < e.b), nxt = ev.find((e) => e.a > n)
  const dur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ' ' + (m % 60) + 'm' : ''}` : `${m}m`)
  let txt: React.ReactNode
  if (cur) txt = <><b className="text-danger">On now:</b> {cur.t} until {minsLabel(cur.b)}{nxt ? <> · then {nxt.t} at {minsLabel(nxt.a)}</> : null}</>
  else if (nxt) txt = <><b>Free until {minsLabel(nxt.a)}</b> ({dur(nxt.a - n)}), then {nxt.t}</>
  else txt = n < 21 * 60 ? <><b>Nothing else booked today.</b> The rest of the day is yours.</> : <>It's getting late – anything left can wait for tomorrow.</>
  return <div className="mb-3 rounded-[12px] bg-tint-sky px-3.5 py-2.5 text-[13.5px]" data-testid="time-left">⏳ {txt}</div>
}

/* ---------- Plan my day ---------- */
const WIN_IDEAS = ['My top 3 are done', 'I started the thing I was avoiding', 'I got outside', 'I stopped work on time', 'I ate a proper lunch']
function PlanMyDay({ s, d, list, onDone }: { s: State; d: DateStr; list: Todo[]; onDone: () => void }) {
  const dp = s.dayPlan?.[d] || {}, p = s.prio[d] || { items: ['', '', ''], done: [] }
  const [step, setStep] = React.useState(0)
  const [win, setWin] = React.useState(dp.win || '')
  const [stepTxt, setStepTxt] = React.useState(dp.dreadStep || '')
  const open = list.filter((x) => !x.done)
  const STEPS = ['How’s your energy?', 'What has to happen today?', 'Anything you’re dreading?', 'What would make today a win?']
  const finishPlan = () => {
    setPlan(d, (x) => { x.win = win.trim(); x.asked = true; x.skipped = false; x.dreadStep = stepTxt.trim() || undefined })
    const dk = getS().dayPlan?.[d]?.dread
    if (dk?.startsWith('t:') && stepTxt.trim()) update((st) => { const k = st.tasks.find((t) => t.id === dk.split(':')[1]); if (k && !k.step) k.step = stepTxt.trim() })
    onDone(); toast('Your day is planned. One thing at a time.')
  }
  return (
    <Card className="border-accent" data-testid="plan-my-day">
      <div className="lbl text-mute">Plan my day · {step + 1} of 4</div>
      <h3 className="mt-0.5 mb-2 text-[20px]">{STEPS[step]}</h3>
      <div className="mb-3 flex gap-1.5">{STEPS.map((_, i) => <span key={i} className={cn('h-1.5 flex-1 rounded-full', i <= step ? 'bg-accent' : 'bg-soft')} />)}</div>

      {step === 0 && (
        <div className="grid grid-cols-3 gap-2">
          {([['low', '🪫', 'Low', 'Small steps today'], ['ok', '🔋', 'Okay', 'A normal day'], ['good', '⚡', 'Good', 'Up for a lot']] as const).map(([k, e, l, sub]) => (
            <button key={k} aria-pressed={dp.energy === k} onClick={() => {
              setPlan(d, (x) => { x.energy = k })
              if (getS().well?.[d]?.energy == null) update((st) => { st.well[d] = { ...(st.well[d] || {}), energy: ENERGY_VAL[k] } })
              setStep(1)
            }} className={cn('rounded-xl border px-2 py-3 text-center', dp.energy === k ? 'border-accent bg-accent-soft' : 'border-line bg-soft')}>
              <div className="text-[22px]">{e}</div><div className="font-semibold">{l}</div><div className="text-[11.5px] text-mute">{sub}</div>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (<>
        <p className="mt-0 mb-2 text-[13.5px] text-mute">Your top 3 for today. {dp.energy === 'low' ? 'Low-energy day – one must-do is plenty.' : 'Three is the most – fewer is fine.'}</p>
        {[0, 1, 2].map((i) => (
          <div key={i} className="mb-1.5 flex items-center gap-2">
            <span className="grid size-[22px] flex-none place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">{i + 1}</span>
            <CommitInput value={p.items[i] || ''} aria-label={`Priority ${i + 1}`} placeholder={i === 0 ? 'The one that has to happen' : 'Optional'} onCommit={(v) => setPrio(d, i, v.trim())} />
          </div>
        ))}
        <Button size="sm" className="mt-1" onClick={() => chooseForDay(d)}>Help me choose from my week</Button>
      </>)}

      {step === 2 && (<>
        <p className="mt-0 mb-2 text-[13.5px] text-mute">The thing you keep avoiding often drains the whole day. Pick it and it goes first – just five minutes to get it moving.</p>
        {open.length === 0 ? <p className="text-[13.5px]">Nothing on the list yet.</p> : (
          <div className="flex flex-wrap gap-1.5">
            {open.map((x) => (
              <button key={x.key} aria-pressed={dp.dread === x.key} onClick={() => setPlan(d, (y) => { y.dread = y.dread === x.key ? undefined : x.key })}
                className={cn('rounded-full border px-3 py-1.5 text-left text-[13px]', dp.dread === x.key ? 'border-accent bg-accent-soft font-semibold' : 'border-line')}>{x.title}</button>
            ))}
          </div>
        )}
        {dp.dread && (<>
          <label className="lbl mt-3 mb-1 block text-mute" htmlFor="pd-step">Smallest first step? (optional)</label>
          <Input id="pd-step" value={stepTxt} onChange={(e) => setStepTxt(e.target.value)} placeholder="e.g. Open the email and read it" />
        </>)}
      </>)}

      {step === 3 && (<>
        <p className="mt-0 mb-2 text-[13.5px] text-mute">A finish line, so “enough” is clear. Keep it small and real.</p>
        <Input value={win} onChange={(e) => setWin(e.target.value)} aria-label="Today will feel like a win if" placeholder="Today will feel like a win if…" />
        <div className="mt-2 flex flex-wrap gap-1.5">{WIN_IDEAS.map((w) => <button key={w} onClick={() => setWin(w)} className="rounded-full bg-soft px-2.5 py-1 text-[12px] text-mute">{w}</button>)}</div>
      </>)}

      <div className="mt-4 flex items-center gap-2">
        {step > 0 ? <Button onClick={() => setStep(step - 1)}>Back</Button> : <Button variant="link" onClick={() => { setPlan(d, (x) => { x.skipped = true }); onDone() }}>Not now</Button>}
        <span className="flex-1" />
        {step < 3 ? <Button variant={step === 0 ? 'link' : 'primary'} onClick={() => setStep(step + 1)}>{step === 0 ? 'Skip' : step === 2 && !dp.dread ? 'Nothing really' : 'Next'}</Button>
          : <Button variant="primary" onClick={finishPlan}>Done</Button>}
      </div>
    </Card>
  )
}

/* ---------- rows ---------- */
function Row({ x, d, dp, quiet }: { x: Todo; d: DateStr; dp: DayPlan; quiet?: boolean }) {
  return (
    <div className={cn('row items-start', x.done && 'done')}>
      <Check round={x.kind === 'prio'} on={x.done} label={x.title} onClick={() => finish(x, d)} />
      <span className="min-w-0 flex-1">
        <span className={cn('tt block break-words', !quiet && 'font-medium')}>{x.title}</span>
        <span className="block text-[11.5px] text-mute">
          {[x.prioN && `Priority ${x.prioN}`, x.over && 'Carried over', dp.dread === x.key && 'The one you’re dreading', x.step && 'First step: ' + x.step].filter(Boolean).join(' · ')}
        </span>
      </span>
      {!x.done && (
        <span className="flex flex-none gap-1">
          <Button size="sm" variant="link" className="text-[12px]" onClick={() => setPlan(d, (p) => { p.now = x.key })}>Do now</Button>
          {x.kind === 'task' && (
            <Button size="sm" variant="link" className="text-[12px] text-mute" onClick={() => {
              if (x.rep) skipTask(x.id, x.occ || d)
              else { update((st) => { const k = st.tasks.find((t) => t.id === x.id); if (k) k.date = addD(d, 1) }); toast('Moved to tomorrow. Not today doesn’t mean never.') }
            }}>Not today</Button>
          )}
        </span>
      )}
    </div>
  )
}

export function TasksPage() {
  const s = useS(), d = today()
  const dp = s.dayPlan?.[d] || {}
  const [planning, setPlanning] = React.useState(false)
  const [showLater, setShowLater] = React.useState(false)
  const [showDone, setShowDone] = React.useState(false)
  const list = todos(s, d), pl = plan(list, dp)
  const ask = planning || (!dp.asked && !dp.skipped)
  const n = pl.now
  const nowSub = n && (dp.dread === n.key
    ? (dp.dreadStep ? 'First step: ' + dp.dreadStep + '. ' : '') + 'You picked this as the one you’re dreading – get it moving first and the rest of the day gets lighter.'
    : n.step ? 'First step: ' + n.step : dp.energy === 'low' ? 'Low-energy day: just the first five minutes counts.' : n.over ? 'Carried over – let’s get it off the list.' : '')

  return (
    <div className="mx-auto max-w-[760px]">
      <PageHead crumb={'Home · ' + fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })} title="Today's tasks" />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {!ask && <Button size="mono" onClick={() => setPlanning(true)}>{dp.asked ? 'Re-plan my day' : 'Plan my day'}</Button>}
        {dp.energy && !ask && <span className="text-[12.5px] text-mute">Energy: {dp.energy === 'low' ? '🪫 low' : dp.energy === 'ok' ? '🔋 okay' : '⚡ good'}</span>}
      </div>

      {ask && <div className="mb-3"><PlanMyDay s={s} d={d} list={list} onDone={() => setPlanning(false)} /></div>}

      {dp.win && (
        <button onClick={() => setPlan(d, (p) => { p.winDone = !p.winDone })} className={cn('mb-3 flex w-full items-center gap-2.5 rounded-[12px] px-3.5 py-2.5 text-left text-[14px]', dp.winDone ? 'bg-tint-mint' : 'bg-tint-butter')}>
          <span className="text-[18px]">{dp.winDone ? '🎉' : '🏁'}</span>
          <span className="flex-1"><span className="lbl block text-mute">{dp.winDone ? 'Today was a win' : 'Today’s a win if'}</span>{dp.win}</span>
          <span className="text-[11.5px] text-mute">{dp.winDone ? 'Tap to undo' : 'Tap when it’s true'}</span>
        </button>
      )}

      <TimeLeft s={s} d={d} />

      {n ? (
        <Card className="hero hero-pad mb-3 border-0 bg-accent text-on-accent in-data-[theme=dark]:border in-data-[theme=dark]:border-accent/45 in-data-[theme=dark]:bg-accent-soft in-data-[theme=dark]:text-ink" data-testid="now">
          <span className="lbl opacity-85 in-data-[theme=dark]:text-accent">Now{n.prioN ? ` · priority ${n.prioN}` : ''}</span>
          <h2 className="mt-1.5 mb-0.5 text-[26px] leading-tight break-words">{n.title}</h2>
          {nowSub && <div className="text-[13px] opacity-85">{nowSub}</div>}
          <div className="mt-3.5 flex flex-wrap gap-2">
            <button className="btn rounded-[10px] bg-on-accent px-3.5 py-2 text-[13.5px] font-semibold text-accent in-data-[theme=dark]:bg-accent in-data-[theme=dark]:text-on-accent"
              onClick={() => startFive({ kind: n.kind, id: n.id, occ: n.occ, d, title: n.title, lead: dp.dread === n.key ? 'Just five minutes on the hard one. You can stop after that.' : undefined })}>Start 5 minutes</button>
            <button className="btn rounded-[10px] bg-on-accent/15 px-3.5 py-2 text-[13.5px] font-medium in-data-[theme=dark]:bg-soft" onClick={() => { finish(n, d); setPlan(d, (p) => { if (p.now === n.key) p.now = undefined }) }}>Mark done</button>
          </div>
        </Card>
      ) : (
        <Card className="hero hero-pad mb-3">
          <span className="lbl text-mute">Now</span>
          <h2 className="mt-1.5 text-[24px]">{list.length ? 'All done for today.' : 'Nothing on the list yet.'}</h2>
          <div className="text-[13px] text-mute">{list.length ? 'Rest counts too. Anything else can wait for tomorrow.' : 'Add a to-do below, or plan your day to set a top 3.'}</div>
        </Card>
      )}

      <Card className="mb-3"><CardHeader title="Up next" action={pl.next.length ? <span className="text-[12px] text-mute">{dp.energy === 'low' ? 'Kept short – low-energy day' : ''}</span> : undefined} />
        {pl.next.length ? pl.next.map((x) => <Row key={x.key} x={x} d={d} dp={dp} />) : <Empty>{n ? 'Just the one thing. Nice and simple.' : 'Nothing waiting.'}</Empty>}
        <InlineAdd placeholder="Add a to-do for today" onAdd={(t) => addTask(t, d)} />
        {pl.later.length > 0 && (<>
          <button className="mt-2.5 flex items-center gap-1 text-[13px] font-semibold text-mute" aria-expanded={showLater} onClick={() => setShowLater((v) => !v)}>
            <ChevronDown className={cn('size-4 transition-transform', showLater && 'rotate-180')} /> Later today ({pl.later.length})
          </button>
          {showLater && pl.later.map((x) => <Row key={x.key} x={x} d={d} dp={dp} quiet />)}
        </>)}
        {pl.done.length > 0 && (<>
          <button className="mt-2.5 flex items-center gap-1 text-[13px] font-semibold text-mute" aria-expanded={showDone} onClick={() => setShowDone((v) => !v)}>
            <ChevronDown className={cn('size-4 transition-transform', showDone && 'rotate-180')} /> Done today ({pl.done.length})
          </button>
          {showDone && pl.done.map((x) => <Row key={x.key} x={x} d={d} dp={dp} quiet />)}
        </>)}
      </Card>
      <p className="text-center text-[12px] text-mute">Same to-dos and top 3 as your Dashboard – just one thing at a time. <Plus className="inline size-3" /> Quick add works here too.</p>
    </div>
  )
}
