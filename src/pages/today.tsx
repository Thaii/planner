import { glassMl, ml } from '@/lib/water'
import * as React from 'react'
import { X, RotateCw, Pencil } from 'lucide-react'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { CommitInput, AutoTextarea, InlineAdd, Input } from '@/components/ui/field'
import { Num } from '@/components/ui/num'
import { Progress } from '@/components/ui/progress'
import { TaskRow, HabitRow, Drops, Moods } from '@/components/bits'
import { startFive } from '@/components/five'
import { useS, update, undoable } from '@/lib/store'
import { go, openDay } from '@/lib/ui'
import { addD, diffD, fmt, mins, nowMins, t12, hourLabel, minsLabel, today, ym, type DateStr } from '@/lib/date'
import {
  eventsOn, workoutsOn, tasksOn, hDue, kept, hRate, momentum, idById, votesOn, nextUp, lowEnergy, roughDay,
  weekStart, weekOf, monthOf, periodKey, labColor, tint,
} from '@/lib/logic'
import { addTask, logHabit, markDone, setPrio, setWell, togglePrio, toggleWorkout, weekItem, monthTodo } from '@/lib/actions'
import { eventForm, goalForm, mealForm } from '@/lib/forms'
import { PERIOD_WORD } from '@/lib/constants'
import { showDopa, scPick, logSelf } from '@/lib/menus'
import type { State } from '@/lib/types'
import { cap, uid, cn } from '@/lib/utils'
import { greeting } from '@/lib/greeting'
import { fmtSleep, parseSleep } from '@/lib/sleep'
import { personaliseForm } from '@/components/personalise'

const L = ({ children }: { children: React.ReactNode }) => <div className="lbl mt-3 mb-1 text-mute">{children}</div>

/* ---------- The day's schedule as an hour-by-hour timeline ---------- */
function Timeline({ d }: { d: DateStr }) {
  const s = useS()
  let st = s.settings.dayStart, en = Math.max(st + 4, s.settings.dayEnd)
  const H = 42, ev = eventsOn(s, d), wo = workoutsOn(s, d)
  type It = { t: string; s: number; e: number; c: string; tm: string; run?: () => void; col?: number; n?: number }
  const items: It[] = []
  ev.filter((e) => e.time).forEach((e) => {
    const a = mins(e.time!), b = e.end && mins(e.end) > a ? mins(e.end) : a + 30
    items.push({ t: e.title, s: a, e: b, c: e.ro ? '#8a857d' : labColor(s, e.label) || 'var(--accent)', tm: t12(e.time) + (e.end ? ' – ' + t12(e.end) : ''), run: e.ro ? undefined : () => eventForm(e.id) })
  })
  wo.filter((w) => w.time).forEach((w) => {
    const a = mins(w.time!)
    items.push({ t: (w.log?.[d] ? '✓ ' : '') + w.name, s: a, e: a + (w.dur || 45), c: labColor(s, w.label) || '#e0916b', tm: t12(w.time), run: () => toggleWorkout(w.id, d) })
  })
  // On phones, only show the hours that matter.
  if (typeof innerWidth !== 'undefined' && innerWidth < 760) {
    if (items.length) { st = Math.max(0, Math.min(...items.map((i) => Math.floor(i.s / 60))) - 1); en = Math.min(24, Math.max(...items.map((i) => Math.ceil(i.e / 60))) + 1) }
    else { const h = new Date().getHours(); st = Math.max(0, h - 1); en = Math.min(24, h + 3) }
  }
  const top0 = st * 60
  items.sort((a, b) => a.s - b.s)
  // Side-by-side columns for overlapping events.
  let grp: It[] = [], gEnd = -1
  const groups: It[][] = []
  items.forEach((it) => { if (it.s >= gEnd && grp.length) { groups.push(grp); grp = [] } grp.push(it); gEnd = Math.max(gEnd, it.e) })
  if (grp.length) groups.push(grp)
  groups.forEach((g) => { const cols: number[] = []; g.forEach((it) => { let c = cols.findIndex((e) => e <= it.s); if (c < 0) { c = cols.length; cols.push(0) } cols[c] = it.e; it.col = c }); g.forEach((it) => (it.n = cols.length)) })
  const nm = nowMins(), cur = d === today() ? items.find((i) => i.s <= nm && i.e > nm) : undefined
  const outside = items.filter((i) => i.e <= top0 || i.s >= en * 60)
  return (
    <>
      {cur && <div className="mb-2 text-[12.5px]"><b className="text-danger">On now:</b> {cur.t} until {minsLabel(cur.e)}</div>}
      {ev.filter((e) => !e.time).map((e) => (
        <button key={e.id} className="lamp-warm mb-1 block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px]" style={{ background: tint(e.ro ? '#8a857d' : labColor(s, e.label) || 'var(--accent)', 22) }} onClick={() => !e.ro && eventForm(e.id)}>{e.title} · all day</button>
      ))}
      {wo.filter((w) => !w.time).map((w) => (
        <button key={w.id} className="mb-1 block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px]" style={{ background: tint('#e0916b', 22) }} onClick={() => toggleWorkout(w.id, d)}>{w.log?.[d] ? '✓ ' : '🏃 '}{w.name}</button>
      ))}
      <div className="tl" style={{ height: (en - st) * H + 8 }}>
        {Array.from({ length: en - st + 1 }, (_, i) => <div key={i} className="hr" style={{ top: i * H }}><span>{hourLabel(st + i)}</span></div>)}
        {items.map((it, i) => {
          const a = Math.max(it.s, top0), b = Math.min(Math.max(it.e, a + 20), en * 60)
          if (b <= top0 || a >= en * 60) return null
          const tp = ((a - top0) / 60) * H, ht = Math.max(20, ((b - a) / 60) * H - 2)
          return (
            <button key={i} className="ev lamp-warm" onClick={it.run}
              style={{ top: tp, height: ht, left: `calc(44px + (100% - 44px) * ${it.col}/${it.n})`, width: `calc((100% - 44px)/${it.n} - 3px)`, background: tint(it.c, 20), borderColor: it.c }}>
              {ht < 34 ? <b className="block truncate font-medium"><small className="font-mono text-[10px] opacity-80">{it.tm.split(' – ')[0]}</small> {it.t}</b>
                : <><small className="block font-mono text-[10px] opacity-80">{it.tm}</small><b className="block font-medium">{it.t}</b></>}
            </button>
          )
        })}
        {d === today() && nm >= top0 && nm <= en * 60 && <div className="now" style={{ top: ((nm - top0) / 60) * H }}><span>{minsLabel(nm)}</span></div>}
      </div>
      {outside.length > 0 && <div className="mt-1.5 text-[12.5px] text-mute">Outside these hours: {outside.map((i) => i.tm + ' ' + i.t).join(', ')}</div>}
    </>
  )
}

/* ---------- The day's schedule as a plain list, in time order ---------- */
function ScheduleList({ d }: { d: DateStr }) {
  const s = useS()
  const ev = eventsOn(s, d), wo = workoutsOn(s, d)
  type It = { k: string; t: string; s: number; e: number; c: string; when: string; sub?: string; run?: () => void; done?: boolean }
  const all: It[] = [
    ...ev.map((e) => {
      const a = e.time ? mins(e.time) : -1, b = e.time ? (e.end && mins(e.end) > a ? mins(e.end) : a + 30) : -1
      return { k: e.id, t: e.title, s: a, e: b, c: e.ro ? '#8a857d' : labColor(s, e.label) || 'var(--accent)', when: e.time ? t12(e.time) + (e.end ? ' – ' + t12(e.end) : '') : 'All day', sub: e.loc, run: e.ro ? undefined : () => eventForm(e.id) }
    }),
    ...wo.map((w) => {
      const a = w.time ? mins(w.time) : -1
      return { k: w.id, t: w.name, s: a, e: a < 0 ? -1 : a + (w.dur || 45), c: labColor(s, w.label) || '#e0916b', when: w.time ? t12(w.time) : 'Any time', sub: (w.dur || 45) + ' min workout', run: () => toggleWorkout(w.id, d), done: !!w.log?.[d] }
    }),
  ].sort((a, b) => a.s - b.s)
  const nm = nowMins(), isT = d === today()
  if (!all.length) return <Empty>Nothing scheduled. Enjoy the space.</Empty>
  return (
    <div className="rows">
      {all.map((it) => {
        const past = isT && it.e >= 0 && it.e <= nm, now = isT && it.s >= 0 && it.s <= nm && it.e > nm
        return (
          <button key={it.k} onClick={it.run} className={cn('row w-full text-left', past && 'opacity-55')}>
            <span className="w-[74px] flex-none font-mono text-[11.5px] text-mute">{it.when}</span>
            <span className="h-8 w-1 flex-none rounded-full" style={{ background: it.c }} />
            <span className="min-w-0 flex-1">
              <span className={cn('tt block truncate', it.done && 'line-through')}>{it.done ? '✓ ' : ''}{it.t}</span>
              {it.sub && <span className="block truncate text-[12px] text-mute">{it.sub}</span>}
            </span>
            {now && <span className="rounded-full bg-danger px-2 py-0.5 text-[11px] font-semibold text-white">Now</span>}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Cards ---------- */
type CardFn = (p: { d: DateStr; s: State }) => React.ReactNode
const CARDS: Record<string, CardFn> = {
  schedule: ({ d, s }) => <Card><CardHeader title="The day's schedule" action={<Button variant="link" className="text-[12.5px]" onClick={() => eventForm(undefined, d)}>Add an event</Button>} />{s.settings.schedView === 'list' ? <ScheduleList d={d} /> : <Timeline d={d} />}</Card>,

  nextup: ({ d, s }) => {
    const n = nextUp(s, d)
    const cls = 'border-0 bg-accent text-on-accent shadow-[0_10px_30px_color-mix(in_srgb,var(--accent)_35%,transparent)] in-data-[theme=dark]:border in-data-[theme=dark]:border-accent/45 in-data-[theme=dark]:bg-accent-soft in-data-[theme=dark]:text-ink in-data-[theme=dark]:shadow-none'
    if (!n) return <Card className={cls}><span className="lbl opacity-85">Next up</span><h2 className="mt-1.5 text-[26px]">You're clear.</h2><div className="text-[13px] opacity-85">Everything for today is done. Rest counts too.</div></Card>
    const btn = 'rounded-[10px] px-3.5 py-2 text-[13.5px] font-medium bg-on-accent/15 in-data-[theme=dark]:bg-soft'
    return (
      <Card className={cls}>
        <span className="lbl opacity-85 in-data-[theme=dark]:text-accent">{n.eyebrow}</span>
        <h2 className="mt-1.5 mb-0.5 text-[26px] leading-tight">{n.title}</h2>
        {n.sub && <div className="text-[13px] opacity-85">{n.sub}</div>}
        <div className="mt-3.5 flex flex-wrap gap-2">
          <button className={cn(btn, 'bg-on-accent font-semibold text-accent in-data-[theme=dark]:bg-accent in-data-[theme=dark]:text-on-accent')} onClick={() => startFive({ kind: n.kind, id: n.id, occ: n.occ, d, title: n.title, lead: (() => { const idn = n.kind === 'habit' ? idById(s, s.habits.find((h) => h.id === n.id)?.identity) : idById(s, s.settings.taskIdentity); return idn ? `What would ${idn.name} do? Five minutes.` : undefined })() })}>Start 5 minutes</button>
          <button className={btn} onClick={() => markDone(n.kind, n.id, d, n.occ)}>{n.kind === 'habit' ? 'Done' : 'Mark done'}</button>
          {n.kind === 'habit' && n.min && <button className={btn} onClick={() => logHabit(n.id, d, 'm')}>Just the minimum</button>}
        </div>
      </Card>
    )
  },

  identity: ({ d, s }) => (
    <Card>
      <CardHeader title="Who I'm becoming" action={<Button variant="link" className="text-[12.5px]" onClick={() => go('habits')}>Edit</Button>} />
      <div>{s.identities.length ? s.identities.map((x) => {
        const v = votesOn(s, x.id, d)
        return (
          <div key={x.id} className="flex items-center gap-2.5 border-t border-line py-2 first:border-t-0">
            <div className="min-w-0 flex-1">
              <div className="font-serif text-[19px] leading-tight">I'm {x.name}.</div>
              {x.does && <div className="text-[12.5px] text-mute">{cap(x.name)}: {x.does[0].toLowerCase() + x.does.slice(1)}</div>}
            </div>
            <div className="min-w-[52px] text-center"><b className="block font-serif text-2xl font-normal text-accent"><Num value={v} /></b><span className="text-[10.5px] text-mute">vote{v === 1 ? '' : 's'}{d === today() ? ' today' : ''}</span></div>
          </div>
        )
      }) : <Empty>Add who you're becoming on the Habits page. Every habit you keep is a vote for it.</Empty>}</div>
    </Card>
  ),

  priorities: ({ d, s }) => {
    const p = s.prio[d] || { items: ['', '', ''], done: [] }
    return (
      <Card><CardHeader title="Top 3 priorities" />
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn('flex items-center gap-2.5 py-1', p.done?.[i] && '[&_input]:text-mute [&_input]:line-through')}>
            <span className="grid size-[22px] flex-none place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">{i + 1}</span>
            <CommitInput value={p.items[i] || ''} placeholder={`Priority ${i + 1}`} onCommit={(v) => setPrio(d, i, v)} className="rounded-none border-0 border-b border-dashed border-line bg-transparent px-0.5" />
            <Check round on={!!p.done?.[i]} onClick={() => togglePrio(d, i)} label={`Priority ${i + 1} done`} />
          </div>
        ))}
      </Card>
    )
  },

  tasks: ({ d, s }) => {
    const l = tasksOn(s, d)
    return (
      <Card><CardHeader title="To-do list" action={<span className="text-[12.5px] text-mute">{l.filter((x) => x.done).length}/{l.length}</span>} />
        <div className="rows">{l.length ? l.map((x) => <TaskRow key={x.k.id + x.occ} x={x} />) : <Empty>All clear.</Empty>}</div>
        <InlineAdd placeholder="Add a to-do" onAdd={(t) => addTask(t, d)} />
      </Card>
    )
  },

  planned: ({ d, s }) => {
    const ws = weekStart(s, d), w = weekOf(s, ws), m = monthOf(s, ym(d))
    return (
      <>
        <Card className="mb-3"><CardHeader title="Planned from your week" />
          <div className="rows">{w.todo.length ? w.todo.map((i) => (
            <div key={i.id} className={cn('row', i.done && 'done')}><Check on={!!i.done} onClick={() => weekItem(ws, 'todo', (l) => { const x = l.find((y) => y.id === i.id); if (x) x.done = !x.done })} /><div className="tt flex-1">{i.text}</div></div>
          )) : <Empty>Nothing set for this week.</Empty>}</div>
          <p className="mt-1.5 text-[12.5px] text-mute">Set in <Button variant="link" className="text-[12.5px]" onClick={() => go('weekly')}>Weekly</Button>. Ticking here ticks it there.</p>
        </Card>
        <Card><CardHeader title="Planned from your month" />
          <div className="rows">{m.todo.length ? m.todo.map((i) => (
            <div key={i.id} className={cn('row', i.done && 'done')}><Check on={!!i.done} onClick={() => monthTodo(ym(d), (l) => { const x = l.find((y) => y.id === i.id); if (x) x.done = !x.done })} /><div className="tt flex-1">{i.text}</div></div>
          )) : <Empty>Nothing set for this month.</Empty>}</div>
          <p className="mt-1.5 text-[12.5px] text-mute">Set in <Button variant="link" className="text-[12.5px]" onClick={() => go('monthly')}>Monthly</Button>.</p>
        </Card>
      </>
    )
  },

  habits: ({ d, s }) => {
    const hs = s.habits.filter((h) => hDue(h, d))
    return <Card><CardHeader title="Habits" action={<Button variant="link" className="text-[12.5px]" onClick={() => go('habits')}>Tracker</Button>} />
      <div className="rows">{hs.length ? hs.map((h) => <HabitRow key={h.id} h={h} d={d} />) : <Empty>{s.habits.length ? 'Rest day – nothing due.' : 'No habits yet.'}</Empty>}</div></Card>
  },

  meals: ({ d, s }) => {
    const m = s.meals[d] || {}
    return <Card><CardHeader title="Today's meals" action={<Button variant="link" className="text-[12.5px]" onClick={() => go('food')}>Plan the week</Button>} />
      {(['breakfast', 'lunch', 'dinner'] as const).map((k) => (
        <button key={k} className="flex w-full py-1.5 text-left" onClick={() => mealForm(d)}><span className="lbl w-[84px] text-mute">{k}</span><span className="flex-1">{m[k] || <span className="text-mute">—</span>}</span></button>
      ))}</Card>
  },

  grocery: ({ s }) => {
    const open = s.grocery.filter((g) => !g.done)
    return <Card><CardHeader title="Grocery list" action={<Button variant="link" className="text-[12.5px]" onClick={() => go('food')}>Full list</Button>} />
      <div className="text-[12.5px] text-mute">{open.length} item{open.length === 1 ? '' : 's'} still to buy.</div>
      <div className="rows">{open.slice(0, 5).map((g) => <div key={g.id} className="row"><Check on={false} onClick={() => update((st) => { const x = st.grocery.find((y) => y.id === g.id); if (x) x.done = true })} /><div className="tt flex-1">{g.name}</div></div>)}</div>
      <InlineAdd placeholder="Add to the list" onAdd={(t) => update((st) => { st.grocery.unshift({ id: uid(), name: t, done: false }) })} />
    </Card>
  },

  checkin: ({ d, s }) => {
    const w = s.well[d] || {}
    return <Card><CardHeader title="Check-in" action={<Button variant="link" className="text-[12.5px]" onClick={() => go('wellness')}>Wellness</Button>} />
      <Moods d={d} />
      <L>Water</L><Drops d={d} />
      <L>Energy · {w.energy ?? '–'}%</L>
      <input type="range" min={0} max={100} value={w.energy ?? 50} onChange={(e) => setWell(d, 'energy', +e.target.value)} className="w-full accent-[var(--accent)]" aria-label="Energy" />
      <L>Sleep last night</L>
      <CommitInput value={w.sleep != null ? fmtSleep(w.sleep) : ''} placeholder="e.g. 7h 20m" className="w-[140px]"
        onCommit={(v) => { const p = parseSleep(v); setWell(d, 'sleep', p) }} />
    </Card>
  },

  intention: ({ d, s }) => <Card><CardHeader title="Intention" />
    <AutoTextarea rows={2} className="min-h-[60px] bg-transparent" placeholder="One thing I want today to be about…" value={s.journal.intent[d] || ''}
      onSave={(v) => update((st) => { if (v.trim()) st.journal.intent[d] = v; else delete st.journal.intent[d] })} /></Card>,

  gratitude: ({ d, s }) => {
    const g = s.journal.grat[d] || []
    return <Card><CardHeader title="Gratitude" />
      <div className="rows">{g.length ? g.map((i) => <div key={i.id} className="row"><span>♡</span><div className="flex-1">{i.text}</div><button className="p-1 text-mute" aria-label="Remove" onClick={() => update((st) => { st.journal.grat[d] = (st.journal.grat[d] || []).filter((x) => x.id !== i.id) })}><X className="size-4" /></button></div>) : <Empty>Something good, however small.</Empty>}</div>
      <InlineAdd placeholder="Something good" onAdd={(t) => update((st) => { (st.journal.grat[d] = st.journal.grat[d] || []).push({ id: uid(), text: t }) })} /></Card>
  },

  upcoming: ({ d, s }) => {
    const out: [DateStr, string, string][] = []
    for (let i = 1; i <= 14 && out.length < 7; i++) { const x = addD(d, i); eventsOn(s, x).forEach((e) => out.length < 7 && out.push([x, e.title, e.ro ? '#8a857d' : labColor(s, e.label)])) }
    const goals = s.goals.filter((g) => !g.done && g.target && g.target >= d && diffD(d, g.target) <= 30)
    return <Card><CardHeader title="Upcoming" />
      <div className="rows">
        {out.map(([x, t, c], i) => <button key={i} className="row w-full text-left" onClick={() => openDay(x)}><span className="w-16 font-mono text-[11px] text-mute">{fmt(x, { weekday: 'short', day: 'numeric' })}</span>{c && <span className="lamp-warm size-2 rounded-full" style={{ background: c }} />}<span className="tt flex-1">{t}</span></button>)}
        {goals.map((g) => <div key={g.id} className="row"><span>◎</span><span className="tt flex-1">{g.title}</span><span className="text-[12.5px] text-mute">due {fmt(g.target!, { day: 'numeric', month: 'short' })}</span></div>)}
        {!out.length && !goals.length && <Empty>Nothing in the next two weeks.</Empty>}
      </div></Card>
  },

  home: ({ d, s }) => {
    const due = s.chores.filter((c) => !(c.log || {})[periodKey(s, c.freq, d)])
    return <Card><CardHeader title="Home jobs" action={<Button variant="link" className="text-[12.5px]" onClick={() => go('home')}>Home</Button>} />
      <div className="rows">{due.length ? due.slice(0, 6).map((c) => (
        <div key={c.id} className="row"><Check on={false} onClick={() => update((st) => { const x = st.chores.find((y) => y.id === c.id); if (x) { x.log = x.log || {}; x.log[periodKey(st, x.freq, d)] = 1 } })} /><div className="flex-1"><div className="tt">{c.name}</div><div className="text-[12.5px] text-mute">{PERIOD_WORD[c.freq]}</div></div></div>
      )) : <Empty>{s.chores.length ? 'All home jobs done for now.' : 'No home jobs set up yet.'}</Empty>}</div>
      {due.length > 6 && <div className="text-[12.5px] text-mute">+{due.length - 6} more</div>}</Card>
  },

  goals: ({ s }) => {
    const g = s.goals.filter((x) => !x.done).slice(0, 4)
    return <Card><CardHeader title="Goals" action={<Button variant="link" className="text-[12.5px]" onClick={() => go('goals')}>All goals</Button>} />
      {g.length ? g.map((x) => (
        <button key={x.id} className="block w-full border-t border-line py-2 text-left first-of-type:border-t-0" onClick={() => goalForm(x.id)}>
          <div className="flex items-center gap-2"><div className="tt flex-1 font-medium">{x.title}</div><span className="text-[12.5px] text-mute">{x.area}</span><b className="text-[13px] text-accent">{x.pct || 0}%</b></div>
          <div className="my-1.5"><Progress value={x.pct || 0} /></div>
          {x.next && <div className="text-[12.5px] text-mute">Next: {x.next}</div>}
        </button>
      )) : <Empty>No active goals.</Empty>}</Card>
  },

  braindump: ({ s }) => <Card><CardHeader title="Brain dump" action={<span className="text-[12.5px] text-mute">{s.inbox.length}</span>} />
    <div className="rows">{s.inbox.length ? s.inbox.map((i) => (
      <div key={i.id} className="row"><div className="flex-1">{i.text}</div>
        <Button size="sm" onClick={() => update((st) => { st.tasks.push({ id: uid(), title: i.text, date: today(), repeat: 'none', order: Date.now() }); st.inbox = st.inbox.filter((x) => x.id !== i.id) })}>→ Today</Button>
        <button className="p-1 text-mute" aria-label="Remove" onClick={() => undoable('Removed from brain dump', (st) => { st.inbox = st.inbox.filter((x) => x.id !== i.id) })}><X className="size-4" /></button></div>
    )) : <Empty>Get it out of your head. Sort it later.</Empty>}</div>
    <InlineAdd placeholder="Anything on your mind…" onAdd={(t) => update((st) => { st.inbox.push({ id: uid(), text: t }) })} /></Card>,

  dopamine: ({ s }) => {
    const n = nextUp(s, today())
    return <Card><CardHeader title="Dopamine menu" action={<Button variant="link" className="text-[12.5px]" onClick={() => go('dopamine')}>Menu</Button>} />
      <div className="mb-2 text-[13px] text-mute">Bored, stuck or reaching for your phone?</div>
      <div className="flex flex-wrap gap-1.5">
        <Button onClick={() => showDopa('app')}>🥟 Quick hit</Button>
        {n && <Button onClick={() => showDopa('side')} className="max-w-full truncate">🥗 Pair a side with “{n.title.length > 22 ? n.title.slice(0, 22) + '…' : n.title}”</Button>}
        <Button onClick={() => showDopa('main')}>🍲 Something bigger</Button>
      </div></Card>
  },

  note: ({ d, s }) => <Card><CardHeader title="Notebook" action={<Button variant="link" className="text-[12.5px]" onClick={() => go('notes')}>Notebook</Button>} />
    <AutoTextarea rows={3} className="min-h-[70px] bg-transparent" placeholder="Notes for the day…" value={s.daynotes[d] || ''}
      onSave={(v) => update((st) => { if (v.trim()) st.daynotes[d] = v; else delete st.daynotes[d] })} /></Card>,
}

/* ---------- Banners: don't miss twice, low energy, self-care nudge ---------- */
function Banners({ d, s }: { d: DateStr; s: State }) {
  const isT = d === today()
  const w = s.well[d] || {}
  const rough = isT && roughDay(s, d) && s.selfcare.length > 0 && !(s.selfLog[d] || []).length
  const [sug, setSug] = React.useState<string | undefined>()
  const auto = React.useMemo(() => (rough ? scPick(w.energy != null && w.energy < 35 ? 'quick' : undefined)?.id : undefined), [rough]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!isT) return null
  const y = addD(d, -1)
  const missed = s.habits.filter((h) => h.mode !== 'weekly' && hDue(h, y) && !kept(h, y) && !(h.created && y < h.created) && hDue(h, d) && !kept(h, d)).slice(0, 2)
  const pickItem = rough ? s.selfcare.find((i) => i.id === (sug || auto)) : undefined
  const box = 'mb-2 flex flex-wrap items-center gap-2 rounded-[10px] px-3 py-2 text-[13px]'
  return (
    <>
      {missed.map((h) => {
        const idn = idById(s, h.identity)
        return <div key={h.id} className={cn(box, 'bg-warn/20')}><span className="flex-1"><b>{idn ? cap(idn.name) + " doesn't miss twice." : "Don't miss twice."}</b> You skipped {h.name} yesterday. {h.min ? `The minimum today: ${h.min}.` : 'Any version counts today.'}</span>
          <Button onClick={() => logHabit(h.id, d, h.min ? 'm' : 1)}>{h.min ? 'Do the minimum' : 'Done'}</Button></div>
      })}
      {lowEnergy(s) && <div className={cn(box, 'bg-accent-soft')}><span><b>Low energy for a few days.</b> Minimums only today, and just your must-do. That still counts.</span></div>}
      {pickItem && <div className={cn(box, 'bg-accent-soft')}><span className="flex-1"><b>Be kind to yourself today.</b> From your self-care menu: {pickItem.text}{pickItem.mins ? ` (${pickItem.mins} min)` : ''}.</span>
        {pickItem.mins > 0 && <Button onClick={() => startFive({ kind: 'self', id: pickItem.id, title: pickItem.text, mins: pickItem.mins, lead: 'Time for you. Nothing else needs doing.' })}>Start</Button>}
        <Button onClick={() => logSelf(pickItem.id)}>Done</Button>
        <button className="p-1 text-mute" title="Suggest another" aria-label="Suggest another" onClick={() => setSug(scPick(undefined, pickItem.id)?.id)}><RotateCw className="size-4" /></button></div>}
    </>
  )
}

/* ---------- First-run: ask for a name ---------- */
function NameCard() {
  const [v, setV] = React.useState('')
  return (
    <Card className="mb-3 border-accent/50 bg-accent-soft">
      <div className="lbl text-accent">Welcome</div>
      <h2 className="mt-1 mb-1 text-[22px]">What should we call you?</h2>
      <p className="mt-0 mb-2.5 text-[13px] text-mute">It's used for your greeting and your planner's name. It stays on this device. Optional – skip it and it stays “Life Planner”.</p>
      <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); const n = v.trim(); if (n) update((st) => { st.settings.name = n; st.settings.nameAsked = true }) }}>
        <Input value={v} onChange={(e) => setV(e.target.value)} placeholder="Your first name" className="max-w-[260px] bg-card" aria-label="Your first name" autoComplete="given-name" />
        <Button variant="primary" type="submit">That's me</Button>
        <Button type="button" onClick={() => update((st) => { st.settings.nameAsked = true })}>Skip</Button>
        <Button type="button" variant="link" className="text-[13px]" onClick={personaliseForm}>More options</Button>
      </form>
    </Card>
  )
}

/* ---------- Page ---------- */
const LEFT = ['schedule'], MID = ['priorities', 'meals', 'grocery', 'upcoming', 'intention', 'note']

export function TodayPage({ d, isToday }: { d: DateStr; isToday?: boolean }) {
  const s = useS()
  const [wide, setWide] = React.useState(() => innerWidth >= 760)
  React.useEffect(() => { const r = () => setWide(innerWidth >= 760); addEventListener('resize', r); return () => removeEventListener('resize', r) }, [])
  const ids = (isToday ? s.settings.cards.filter((c) => c.on) : s.settings.cards).map((c) => c.id).filter((id) => CARDS[id])
  const hero: string[] = ids.filter((id) => id === 'nextup' || id === 'identity'), rest = ids.filter((id) => !hero.includes(id))
  const cols: string[][] = [[], [], []]
  if (!wide) cols[0] = rest
  else rest.forEach((id) => (LEFT.includes(id) ? cols[0] : MID.includes(id) ? cols[1] : cols[2]).push(id))
  const tk = tasksOn(s, d), hr = hRate(s, [d])
  const nav = (n: number) => { const nd = addD(d, n); openDay(nd) }
  return (
    <div>
      <div className="crumb">Home · {fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <h1 className="mt-0.5 mb-2.5 text-[30px]">{isToday ? 'Your day' : <>Your <em className="text-accent">day</em></>}</h1>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="icon" onClick={() => nav(-1)} aria-label="Previous day">‹</Button>
        <span className="lbl">{fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })}{isToday ? ' · today' : ''}</span>
        <Button size="icon" onClick={() => nav(1)} aria-label="Next day">›</Button>
        <Input type="date" value={d} onChange={(e) => e.target.value && openDay(e.target.value)} className="w-auto py-1.5" aria-label="Jump to date" />
        {!isToday && <Button size="mono" onClick={() => go('today')}>Today</Button>}
        <span className="flex-1" />
        <Button size="mono" onClick={() => go('settings', { setTab: 'day' })}>Customise</Button>
      </div>
      {isToday && <div className="group mt-2.5 mb-1 flex items-baseline gap-2"><div className="font-serif text-[34px] leading-tight">{greeting(s.settings)}</div><button className="rounded-md p-1 text-mute opacity-60 hover:opacity-100" aria-label="Change your name and greeting" title="Change your name and greeting" onClick={personaliseForm}><Pencil className="size-4" /></button></div>}
      <div className="mb-3.5 text-[13.5px] text-mute">
        <Num value={tk.filter((x) => x.done).length} /> of {tk.length} done · {ml((s.well[d]?.water || 0) * glassMl(s.settings))} water · <Num value={hr.pct} suffix="%" /> of habits · momentum <Num value={momentum(s)} />
      </div>
      {isToday && !s.settings.name && !s.settings.nameAsked && <NameCard />}
      <Banners d={d} s={s} />
      {hero.length > 0 && <div className={cn('mb-3 grid gap-3', hero.length === 2 && 'min-[760px]:grid-cols-[1.4fr_1fr]')}>{hero.map((id) => <div key={id} className="self-start">{CARDS[id]({ d, s })}</div>)}</div>}
      <div className="grid grid-cols-1 gap-3 min-[760px]:grid-cols-2 min-[1100px]:grid-cols-[1.15fr_1fr_1fr]">
        {cols.map((c, i) => (c.length || wide) && <div key={i} className="flex min-w-0 flex-col gap-3">{c.map((id) => <React.Fragment key={id}>{CARDS[id]({ d, s })}</React.Fragment>)}</div>)}
      </div>
      {isToday && <Button variant="link" className="mt-3 text-[13.5px]" onClick={() => go('settings', { setTab: 'day' })}>Customise today's cards</Button>}
    </div>
  )
}
