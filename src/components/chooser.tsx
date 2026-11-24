import * as React from 'react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Check } from './ui/check'
import { InlineAdd } from './ui/field'
import { closeSheet, openSheet } from './sheet'
import { getS, update } from '@/lib/store'
import { addD, dow, DOWN, fmt, range, type DateStr } from '@/lib/date'
import { ensureWeek, tasksOn, weekOf, weekStart } from '@/lib/logic'
import { addTask } from '@/lib/actions'
import { dayLoad } from '@/lib/week'
import type { State } from '@/lib/types'
import { cn, uid } from '@/lib/utils'

/** Something you could pick: where it came from, and any answers already known. */
export interface Cand { id: string; text: string; from: string; due?: boolean; waiting?: boolean; relief?: boolean; big?: boolean; on?: boolean }
type Flag = 'due' | 'waiting' | 'relief' | 'big'

const MAX = 15

function dedupe(list: Cand[]) {
  const seen = new Set<string>(), out: Cand[] = []
  for (const c of list) {
    const k = c.text.trim().toLowerCase()
    if (!k || seen.has(k)) continue
    seen.add(k); out.push(c)
  }
  return out
}

/** Next unfinished step of each active project, and each open goal's next step. */
function bigPicture(s: State): Cand[] {
  const out: Cand[] = []
  for (const p of s.projects || []) {
    if (p.status === 'done' || p.status === 'paused') continue
    const t = p.tasks.find((x) => !x.done)
    if (t) out.push({ id: uid(), text: t.text, from: 'Project · ' + p.name })
  }
  for (const g of s.goals || []) if (!g.done && g.next) out.push({ id: uid(), text: g.next, from: 'Goal · ' + g.title })
  return out
}

/** What could go in a week's top 3: what's already there, last week's unfinished priorities, the week to-do, dated to-dos, projects and goals. */
export function weekCands(s: State, ws: DateStr): Cand[] {
  const w = weekOf(s, ws), prev = weekOf(s, addD(ws, -7)), end = addD(ws, 6)
  const list: Cand[] = []
  w.prio.forEach((p, i) => { if (p && !w.pdone[i]) list.push({ id: uid(), text: p, from: 'Already in your top 3', on: true }) })
  prev.prio.forEach((p, i) => { if (p && !prev.pdone[i]) list.push({ id: uid(), text: p, from: 'Not finished last week', on: true }) })
  w.todo.filter((i) => !i.done).forEach((i) => list.push({ id: uid(), text: i.text, from: 'Week to-do', on: true }))
  for (const k of s.tasks) {
    if (k.done || (k.repeat && k.repeat !== 'none') || k.date > end) continue
    list.push({ id: uid(), text: k.title, from: k.date < ws ? 'Overdue to-do' : 'To-do on ' + DOWN[dow(k.date)], due: true, on: true })
  }
  return dedupe([...list, ...bigPicture(s)])
}

/** What could go in a day's top 3: this week's priorities and to-do, today's and overdue to-dos, yesterday's unfinished priorities, projects and goals. */
export function dayCands(s: State, d: DateStr): Cand[] {
  const ws = weekStart(s, d), w = weekOf(s, ws), p = s.prio[d], y = s.prio[addD(d, -1)]
  const list: Cand[] = []
  p?.items.forEach((x, i) => { if (x && !p.done?.[i]) list.push({ id: uid(), text: x, from: 'Already in your top 3', on: true }) })
  tasksOn(s, d).filter((x) => !x.done && (!x.k.repeat || x.k.repeat === 'none')).forEach((x) => list.push({ id: uid(), text: x.k.title, from: x.over ? 'Overdue to-do' : "Today's to-do", due: true, on: true }))
  y?.items.forEach((x, i) => { if (x && !y.done?.[i]) list.push({ id: uid(), text: x, from: 'Not finished yesterday', on: true }) })
  w.prio.forEach((x, i) => { if (x && !w.pdone[i]) list.push({ id: uid(), text: x, from: 'Week priority', on: true }) })
  w.todo.filter((i) => !i.done).forEach((i) => list.push({ id: uid(), text: i.text, from: 'Week to-do', on: true }))
  return dedupe([...list, ...bigPicture(s)])
}

const score = (c: Cand) => (c.due ? 4 : 0) + (c.waiting ? 3 : 0) + (c.relief ? 2 : 0)
const why = (c: Cand) => [c.due && 'deadline', c.waiting && 'someone waiting', c.relief && 'a relief'].filter(Boolean).join(' · ')

/** Top 3 by deadline, then people waiting, then relief; ties keep the list order (which puts what you'd already planned first). */
export function suggest(list: Cand[]) {
  const ranked = list.map((c, i) => ({ c, i })).sort((a, b) => score(b.c) - score(a.c) || a.i - b.i).map((x) => x.c)
  const picks = ranked.slice(0, 3).map((c) => c.id)
  const win = ranked.find((c) => !c.big && !picks.includes(c.id))
  return { picks, win: win?.id }
}

export interface ChooserResult { picks: string[]; win?: string }

/**
 * "Help me choose": dump → a few quick yes/no taps → a suggested top 3 you can change, plus one small win.
 * `scope` words the questions for a week or a day; `fullDays` lets it warn about big jobs on busy days.
 */
export function Chooser({ initial, scope, fullDays, onDone, onCancel }: {
  initial: Cand[]; scope: 'week' | 'day'; fullDays: string[]
  onDone: (r: ChooserResult) => void; onCancel?: () => void
}) {
  const [items, setItems] = React.useState<Cand[]>(() => initial.map((c, i) => ({ ...c, on: c.on ?? i < MAX })))
  const [step, setStep] = React.useState<0 | 1 | 2>(0)
  const [picks, setPicks] = React.useState<string[]>([])
  const [win, setWin] = React.useState<string | undefined>()
  const on = items.filter((c) => c.on)
  const set = (id: string, f: Flag) => setItems((l) => l.map((c) => (c.id === id ? { ...c, [f]: !c[f] } : c)))
  const toSuggest = (useAnswers: boolean) => {
    const r = useAnswers ? suggest(on) : { picks: [] as string[], win: undefined }
    setPicks(r.picks); setWin(r.win); setStep(2)
  }
  const togglePick = (id: string) => setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]))
  const byId = (id?: string) => items.find((c) => c.id === id)
  const bigPicked = picks.map(byId).filter((c) => c?.big)
  const Q: [Flag, string][] = [['due', scope === 'week' ? 'Deadline this week' : 'Due today'], ['waiting', "Someone's waiting"], ['relief', 'Relief to finish'], ['big', 'Big job']]

  return (
    <div data-testid="chooser">
      {step === 0 && (<>
        <p className="mt-0 mb-2 text-[13.5px] text-mute">Everything that could matter {scope === 'week' ? 'this week' : 'today'}, in one place. Untick anything that's clearly not now, and add anything missing.</p>
        {items.length === 0 && <p className="text-[13.5px]">Nothing on your lists yet – add a few things below.</p>}
        <div className="max-h-[46vh] overflow-y-auto">
          {items.map((c) => (
            <div key={c.id} className={cn('row', !c.on && 'opacity-55')}>
              <Check on={!!c.on} label={c.text} onClick={() => setItems((l) => l.map((x) => (x.id === c.id ? { ...x, on: !x.on } : x)))} />
              <span className="min-w-0 flex-1"><span className="tt block break-words">{c.text}</span><span className="block text-[11.5px] text-mute">{c.from}</span></span>
            </div>
          ))}
        </div>
        <InlineAdd placeholder="Add something else…" onAdd={(text) => setItems((l) => [...l, { id: uid(), text, from: 'Added just now', on: true }])} />
        {on.length > MAX && <p className="mb-0 text-[12.5px] text-mute">{on.length} ticked – that's a lot. Untick a few to keep the next step quick.</p>}
        <div className="mt-3.5 flex items-center gap-2">
          {onCancel && <Button onClick={onCancel}>Back</Button>}
          <span className="flex-1" />
          <Button variant="link" disabled={!on.length} onClick={() => toSuggest(false)}>I'll just pick</Button>
          <Button variant="primary" disabled={!on.length} onClick={() => setStep(1)}>Next</Button>
        </div>
      </>)}

      {step === 1 && (<>
        <p className="mt-0 mb-2 text-[13.5px] text-mute">Tap what's true. Leave the rest – no need to think hard.</p>
        <div className="max-h-[52vh] overflow-y-auto">
          {on.map((c) => (
            <div key={c.id} className="border-b border-dashed border-line py-2 last:border-0">
              <div className="tt mb-1.5 text-[14px] font-medium break-words">{c.text}</div>
              <div className="flex flex-wrap gap-1.5">
                {Q.map(([f, label]) => (
                  <button key={f} aria-pressed={!!c[f]} onClick={() => set(c.id, f)}
                    className={cn('rounded-full border px-2.5 py-1 text-[12px]', c[f] ? 'border-accent bg-accent-soft font-semibold text-ink' : 'border-line text-mute')}>{label}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3.5 flex items-center gap-2">
          <Button onClick={() => setStep(0)}>Back</Button><span className="flex-1" />
          <Button variant="primary" onClick={() => toSuggest(true)}>Suggest my top 3</Button>
        </div>
      </>)}

      {step === 2 && (<>
        <p className="mt-0 mb-2 text-[13.5px] text-mute">{picks.length ? `Here’s a suggestion. Tap to swap things in or out – you know your ${scope} best.` : 'Tap up to three.'}</p>
        <div className="max-h-[44vh] overflow-y-auto">
          {[...picks.map(byId).filter(Boolean) as Cand[], ...on.filter((c) => !picks.includes(c.id))].map((c) => {
            const n = picks.indexOf(c.id)
            return (
              <button key={c.id} onClick={() => togglePick(c.id)} aria-pressed={n >= 0} className={cn('row w-full text-left', n < 0 && 'opacity-70')}>
                <span className={cn('grid size-[22px] flex-none place-items-center rounded-full text-xs font-bold', n >= 0 ? 'bg-accent text-white' : 'border border-line text-mute')}>{n >= 0 ? n + 1 : ''}</span>
                <span className="min-w-0 flex-1"><span className="tt block break-words">{c.text}</span>
                  <span className="block text-[11.5px] text-mute">{n >= 0 && why(c) ? why(c) : c.from}</span></span>
              </button>
            )
          })}
        </div>
        {bigPicked.length > 0 && fullDays.length > 0 && (
          <p className="mt-2 mb-0 rounded-[10px] bg-tint-butter px-3 py-2 text-[12.5px]">
            {scope === 'day' ? 'Today looks full – a big job might not fit. Maybe swap it for something smaller, or just do its first step.' : `${fullDays.join(' and ')} ${fullDays.length > 1 ? 'look' : 'looks'} full – maybe not the big one on ${fullDays.length > 1 ? 'those days' : 'that day'}.`}
          </p>
        )}
        {(() => { const c = byId(win); return c && !picks.includes(c.id) ? (
          <div className="mt-2.5 flex items-center gap-2 rounded-[10px] bg-tint-mint px-3 py-2 text-[13px]">
            <span className="flex-1"><b>One small win to start:</b> {c.text}</span>
            <button className="text-[12px] text-mute underline" onClick={() => setWin(undefined)}>No thanks</button>
          </div>) : null })()}
        <p className="mt-2 mb-0 text-[12px] text-mute">The rest stay on your lists. Not {scope === 'week' ? 'this week' : 'today'} doesn't mean never.</p>
        <div className="mt-3.5 flex items-center gap-2">
          <Button onClick={() => setStep(on.some((c) => c.due || c.waiting || c.relief || c.big) ? 1 : 0)}>Back</Button><span className="flex-1" />
          <Button variant="primary" disabled={!picks.length} onClick={() => onDone({ picks: picks.map((id) => byId(id)!.text), win: win && !picks.includes(win) ? byId(win)?.text : undefined })}>Use these</Button>
        </div>
      </>)}
    </div>
  )
}

/** Keep a priority's tick only if the same text stays in the same slot. */
const keepDone = (oldItems: string[], oldDone: boolean[] | undefined, items: string[]) => items.map((t, i) => !!(t && oldItems[i] === t && oldDone?.[i]))
const fill3 = (picks: string[]) => [0, 1, 2].map((i) => picks[i] || '')

/** Open "Help me choose" for a week's top 3 (from the Weekly page). */
export function chooseForWeek(ws: DateStr) {
  const s = getS(), full = range(ws, 7).filter((d) => dayLoad(s, d).level === 3).map((d) => DOWN[dow(d)])
  openSheet(<Chooser initial={weekCands(s, ws)} scope="week" fullDays={full} onDone={({ picks, win }) => {
    update((d) => {
      const wk = ensureWeek(d, ws), items = fill3(picks)
      wk.pdone = keepDone(wk.prio, wk.pdone, items); wk.prio = items
      if (win && !wk.todo.some((x) => x.text === win)) wk.todo.unshift({ id: uid(), text: win, done: false })
    })
    closeSheet(); toast('Top 3 set for the week of ' + fmt(ws, { day: 'numeric', month: 'short' }))
  }} />, 'Help me choose')
}

/** Open "Help me choose" for a day's top 3, picking from the week (from the Dashboard). */
export function chooseForDay(d: DateStr) {
  const s = getS(), full = dayLoad(s, d).level === 3 ? ['Today'] : []
  openSheet(<Chooser initial={dayCands(s, d)} scope="day" fullDays={full} onDone={({ picks, win }) => {
    update((st) => {
      const old = st.prio[d] || { items: ['', '', ''], done: [] }, items = fill3(picks)
      st.prio[d] = { items, done: keepDone(old.items, old.done, items) }
    })
    const now = getS(), listed = now.tasks.some((k) => k.title === win && !k.done) || weekOf(now, weekStart(now, d)).todo.some((x) => x.text === win && !x.done)
    if (win && !listed) addTask(win, d)
    closeSheet(); toast(win ? `Top 3 set. Small win to start with: ${win}` : "Today's top 3 is set")
  }} />, 'Help me choose')
}
