import { Sections } from '@/components/sections'
import { X } from 'lucide-react'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { CommitInput, InlineAdd } from '@/components/ui/field'
import { PageHead, TaskRow, Drops, Moods } from '@/components/bits'
import { useS, update, undoable } from '@/lib/store'
import { go, useUI } from '@/lib/ui'
import { addD, dow, DOWN, fmt, pd, range, t12, today, type DateStr } from '@/lib/date'
import { ensureWeek, eventsOn, labColor, tasksOn, tint, weekOf, weekStart, workoutsOn } from '@/lib/logic'
import { dayPeek } from '@/components/day-peek'
import { weekReset } from '@/components/week-reset'
import { Ico } from '@/components/doodles'
import { stickersOn } from './monthly'
import { dayLoad } from '@/lib/week'
import { keyDates, monthTheme } from '@/lib/year'
import { useViewportWidth } from '@/lib/use-width'
import type { State } from '@/lib/types'
import { addTask, toggleWorkout, weekItem } from '@/lib/actions'
import { eventForm } from '@/lib/forms'
import { cn, uid } from '@/lib/utils'
import type { Item } from '@/lib/types'

/** Four little bars: free, light, steady, full. */
function LoadMeter({ s, d }: { s: State; d: DateStr }) {
  const ld = dayLoad(s, d)
  return (
    <span className="flex items-center gap-1" title={ld.label} aria-label={'How full: ' + ld.label}>
      <span className="flex items-end gap-[2px]">{[1, 2, 3].map((i) => <i key={i} className={cn('block w-[4px] rounded-sm', i <= ld.level ? (ld.level === 3 ? 'bg-danger' : 'bg-accent') : 'bg-line')} style={{ height: 4 + i * 3 }} />)}</span>
      <span className={cn('text-[10.5px]', ld.level === 3 ? 'font-semibold text-danger' : 'text-mute')}>{ld.label}</span>
    </span>
  )
}

/** One day of the spread. `row` = phone layout (full width, stacked). */
function DayCol({ s, d, row }: { s: State; d: DateStr; row?: boolean }) {
  const t = today(), ev = eventsOn(s, d), tk = tasksOn(s, d).filter((x) => d === t || !x.over), wo = workoutsOn(s, d), stk = stickersOn(s, d)
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5 rounded-xl border border-line bg-card px-2 py-2.5', row && 'px-3', d === t && 'border-accent shadow-[inset_0_0_0_1.5px_var(--accent)]', d < t && 'opacity-80')}>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <button className="flex items-baseline gap-1.5 text-left" onClick={() => dayPeek(d)} aria-label={'Open ' + fmt(d, { weekday: 'long', day: 'numeric', month: 'long' })}>
          <span className="lbl">{DOWN[dow(d)]}</span><b className="font-serif text-xl font-normal">{+d.slice(8)}</b>{d === t && <span className="text-[11px] font-semibold text-accent">today</span>}
        </button>
        {stk.length > 0 && <span className="flex gap-0.5">{stk.map((e) => <Ico key={e} e={e} className="size-[18px] text-[13px]" />)}</span>}
        <span className={cn(row ? 'ml-auto' : 'basis-full')}><LoadMeter s={s} d={d} /></span>
      </div>
      {ev.map((e) => <button key={e.id} className="lamp-warm truncate rounded-md px-1.5 py-1 text-left text-[11.5px]" style={{ background: tint(e.ro ? '#8a857d' : labColor(s, e.label) || 'var(--accent)', 22) }} onClick={() => (e.ro ? dayPeek(d) : eventForm(e.id))}>{e.time ? t12(e.time) + ' ' : ''}{e.title}</button>)}
      {wo.map((x) => <button key={x.id} className="truncate rounded-md px-1.5 py-1 text-left text-[11.5px]" style={{ background: tint('#e0916b', 22) }} onClick={() => toggleWorkout(x.id, d)}>{x.log?.[d] ? '✓ ' : ''}{x.time ? t12(x.time) + ' ' : ''}{x.name}</button>)}
      <div className="rows">{tk.map((x) => <TaskRow key={x.k.id + x.occ} x={x} compact />)}</div>
      <InlineAdd placeholder="Add a to-do" className="mt-0.5 [&_input]:py-1 [&_input]:text-[12.5px] [&_button]:size-6 [&_button]:text-sm" onAdd={(txt) => addTask(txt, d)} />
      <div className={cn('mt-auto pt-1.5', row && 'flex flex-wrap items-center gap-3')}><Drops d={d} small /><div className={cn(!row && 'mt-1.5')}><Moods d={d} small /></div></div>
    </div>
  )
}

/** A one-line focus for the week, with the month theme, quarter focus and the week's big dates for context. */
function WeekFocus({ s, ws }: { s: State; ws: DateStr }) {
  const w = weekOf(s, ws), mid = pd(addD(ws, 3)), y = mid.getFullYear(), mo = mid.getMonth()
  const theme = monthTheme(s, y, mo), qf = s.years[y]?.quarters?.[Math.floor(mo / 3) + 1]?.focus
  const kd = keyDates(s, ws, addD(ws, 6))
  return (
    <Card><CardHeader title="This week's focus" />
      <CommitInput value={w.focus || ''} placeholder="One line for the week, e.g. Rest after a big week" aria-label="This week's focus" className="px-3.5 py-2 font-serif text-[18px]"
        onCommit={(v) => update((d) => { ensureWeek(d, ws).focus = v.trim() })} />
      {(theme || qf) && <div className="mt-1.5 text-[12.5px] text-mute">{[theme && `${mid.toLocaleDateString('en-AU', { month: 'long' })}: ${theme}`, qf && `Q${Math.floor(mo / 3) + 1}: ${qf}`].filter(Boolean).join(' · ')}</div>}
      {kd.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{kd.map((k, i) => (
        <button key={i} onClick={() => dayPeek(k.d)} className="flex items-center gap-1 rounded-full bg-tint-butter px-2.5 py-1 text-[12px]"><Ico e={k.e} className="size-[15px] text-[11px]" />{k.t} · {DOWN[dow(k.d)]}</button>
      ))}</div>}
    </Card>
  )
}

/** Invites the weekly reset from Friday on (or for any past week not yet closed); shows the look-back once done. */
function ResetCard({ s, ws }: { s: State; ws: DateStr }) {
  const w = weekOf(s, ws), t = today(), r = w.review
  const due = !r?.done && (addD(ws, 4) <= t)
  return (
    <Card className={cn(due && 'border-accent bg-accent-soft')}><CardHeader title="Weekly reset" />
      {r?.done ? (<>
        <div className="mb-2 text-[13px] text-mute">Done – next week is set up.</div>
        {r.well && <div className="mb-1 text-[13.5px]"><b>Went well:</b> {r.well}</div>}
        {r.hard && <div className="mb-1 text-[13.5px]"><b>Got in the way:</b> {r.hard}</div>}
        <Button size="sm" className="mt-1" onClick={() => weekReset(ws)}>Go through it again</Button>
      </>) : (<>
        <p className="mt-0 mb-2.5 text-[13.5px]">{due ? 'About ten minutes to close this week and set up the next one: look back, tidy up, look ahead, pick your top 3.' : 'Best done on Friday or the weekend: look back, tidy up, look ahead and set up next week.'}</p>
        <Button variant={due ? 'primary' : 'outline'} onClick={() => weekReset(ws)}>Start the reset</Button>
      </>)}
    </Card>
  )
}


function ItemList({ items, onToggle, onDelete, empty }: { items: Item[]; onToggle: (id: string) => void; onDelete: (id: string) => void; empty: string }) {
  return <div className="rows">{items.length ? items.map((i) => (
    <div key={i.id} className={cn('row', i.done && 'done')}><Check on={!!i.done} onClick={() => onToggle(i.id)} label={i.text} /><div className="tt flex-1">{i.text}</div>
      <button className="p-1 text-mute" aria-label="Remove" onClick={() => onDelete(i.id)}><X className="size-4" /></button></div>
  )) : <Empty>{empty}</Empty>}</div>
}

export function WeeklyPage() {
  const s = useS()
  const ref = useUI((u) => u.weekRef)
  const ws = weekStart(s, ref), w = weekOf(s, ws), t = today(), days = range(ws, 7)
  const narrow = useViewportWidth() < 760
  const carry = weekOf(s, addD(ws, -7)).todo.filter((i) => !i.done)
  const tog = (list: 'todo' | 'goals') => (id: string) => weekItem(ws, list, (l) => { const x = l.find((y) => y.id === id); if (x) x.done = !x.done })
  const rm = (list: 'todo' | 'goals') => (id: string) => undoable('Removed', (d) => { const wk = ensureWeek(d, ws); wk[list] = wk[list].filter((x) => x.id !== id) })
  return (
    <div>
      <PageHead crumb={'Plan · ' + fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })} title="Weekly" />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="icon" aria-label="Previous week" onClick={() => useUI.setState({ weekRef: addD(ws, -7) })}>‹</Button>
        <h2 className="text-[21px]">{fmt(ws, { day: 'numeric', month: 'short' })} to {fmt(addD(ws, 6), { day: 'numeric', month: 'short' })}</h2>
        <Button size="icon" aria-label="Next week" onClick={() => useUI.setState({ weekRef: addD(ws, 7) })}>›</Button>
        <Button size="mono" onClick={() => useUI.setState({ weekRef: today() })}>This week</Button>
        <Button size="mono" onClick={() => go('monthly')}>Monthly</Button>
      </div>
        <Sections page="weekly" items={[
          { id: 'focus', title: "This week's focus", icon: '🧭', desc: "One line for the week, with its big dates", node: <WeekFocus s={s} ws={ws} /> },
          { id: 'reset', title: "Weekly reset", icon: '🔄', desc: "Close the week and set up the next", node: <ResetCard s={s} ws={ws} /> },
          { id: 'prio', title: "Top 3 priorities", icon: '⭐', desc: "The three things that matter most this week", node: (<>
        <Card><CardHeader title="Top 3 priorities" />
          {[0, 1, 2].map((i) => (
            <div key={i} className={cn('flex items-center gap-2.5 py-1', w.pdone[i] && '[&_input]:text-mute [&_input]:line-through')}>
              <span className="grid size-[22px] flex-none place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">{i + 1}</span>
              <CommitInput value={w.prio[i] || ''} placeholder="This week, I will…" className="rounded-none border-0 border-b border-dashed border-line bg-transparent px-0.5"
                onCommit={(v) => update((d) => { ensureWeek(d, ws).prio[i] = v })} />
              <Check round on={!!w.pdone[i]} onClick={() => update((d) => { const wk = ensureWeek(d, ws); wk.pdone[i] = !wk.pdone[i] })} />
            </div>
          ))}
        </Card>
          </>) },
          { id: 'todo', title: "Week to-do", icon: '✅', desc: "Things for this week, any day", node: (<>
        <Card><CardHeader title="Week to-do" />
          {carry.length > 0 && ws <= weekStart(s, t) && (
            <div className="mb-1.5 flex items-center gap-2 rounded-[10px] bg-accent-soft px-2.5 py-2 text-[13px]">
              <span className="flex-1">{carry.length} unfinished from last week</span>
              <Button onClick={() => update((d) => { const p = ensureWeek(d, addD(ws, -7)), wk = ensureWeek(d, ws); p.todo.filter((i) => !i.done).forEach((i) => wk.todo.push({ id: uid(), text: i.text, done: false })); p.todo = p.todo.filter((i) => i.done) })}>Move all</Button>
            </div>
          )}
          <ItemList items={w.todo} onToggle={tog('todo')} onDelete={rm('todo')} empty="Things for this week, any day." />
          <InlineAdd placeholder="Add to this week" onAdd={(t) => weekItem(ws, 'todo', (l) => { l.push({ id: uid(), text: t, done: false }) })} />
        </Card>
          </>) },
          { id: 'goals', title: "Weekly goals", icon: '🎯', desc: "What would make this week a good one", hide: true, node: (<>
        <Card><CardHeader title="Weekly goals" />
          <ItemList items={w.goals} onToggle={tog('goals')} onDelete={rm('goals')} empty="What would make this a good week?" />
          <InlineAdd placeholder="Add a weekly goal" onAdd={(t) => weekItem(ws, 'goals', (l) => { l.push({ id: uid(), text: t, done: false }) })} />
        </Card>
          </>) },
          { id: 'spread', title: "The 7-day spread", icon: '🗓️', desc: "Each day side by side", wide: true, node: (<>
      <h2 className="mt-4 mb-2 text-[21px]">The 7-day <em className="text-accent">spread</em></h2>
      {narrow ? <div className="flex flex-col gap-2">{days.map((d) => <DayCol key={d} s={s} d={d} row />)}</div> : (
        <div className="overflow-x-auto pb-1">
          <div className="grid min-w-[980px] grid-cols-7 gap-2">{days.map((d) => <DayCol key={d} s={s} d={d} />)}</div>
        </div>
      )}
      <p className="mt-1.5 text-[12.5px] text-mute">Tap a day for what's on. The bars show how full a day is. Drops log water, faces log mood. <Button variant="link" className="text-[12.5px]" onClick={() => eventForm(undefined, ws)}>Add an event</Button></p>
          </>) },
        ]} />
    </div>
  )
}
