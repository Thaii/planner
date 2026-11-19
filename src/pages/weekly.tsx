import { X } from 'lucide-react'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { CommitInput, InlineAdd } from '@/components/ui/field'
import { PageHead, TaskRow, Drops, Moods } from '@/components/bits'
import { useS, update, undoable } from '@/lib/store'
import { go, openDay, useUI } from '@/lib/ui'
import { addD, dow, DOWN, fmt, range, today } from '@/lib/date'
import { ensureWeek, eventsOn, labColor, tasksOn, tint, weekOf, weekStart, workoutsOn } from '@/lib/logic'
import { addTask, toggleWorkout, weekItem } from '@/lib/actions'
import { eventForm } from '@/lib/forms'
import { cn, uid } from '@/lib/utils'
import type { Item } from '@/lib/types'

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
      <div className="mb-3 grid gap-3 min-[760px]:grid-cols-2 min-[1100px]:grid-cols-3">
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
        <Card><CardHeader title="Weekly goals" />
          <ItemList items={w.goals} onToggle={tog('goals')} onDelete={rm('goals')} empty="What would make this a good week?" />
          <InlineAdd placeholder="Add a weekly goal" onAdd={(t) => weekItem(ws, 'goals', (l) => { l.push({ id: uid(), text: t, done: false }) })} />
        </Card>
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
      </div>
      <h2 className="mt-4 mb-2 text-[21px]">The 7-day <em className="text-accent">spread</em></h2>
      <div className="overflow-x-auto pb-1">
        <div className="grid min-w-[1080px] grid-cols-7 gap-2">
          {days.map((d) => {
            const ev = eventsOn(s, d), tk = tasksOn(s, d).filter((x) => d === t || !x.over), wo = workoutsOn(s, d)
            return (
              <div key={d} className={cn('flex min-w-0 flex-col gap-1.5 rounded-xl border border-line bg-card px-2 py-2.5', d === t && 'border-accent shadow-[inset_0_0_0_1.5px_var(--accent)]')}>
                <button className="flex items-baseline gap-1.5 text-left" onClick={() => openDay(d)}><span className="lbl">{DOWN[dow(d)]}</span><b className="font-serif text-xl font-normal">{+d.slice(8)}</b></button>
                {ev.map((e) => <button key={e.id} className="lamp-warm truncate rounded-md px-1.5 py-1 text-left text-[11px]" style={{ background: tint(e.ro ? '#8a857d' : labColor(s, e.label) || 'var(--accent)', 22) }} onClick={() => !e.ro && eventForm(e.id)}>{e.time ? e.time + ' ' : ''}{e.title}</button>)}
                {wo.map((x) => <button key={x.id} className="truncate rounded-md px-1.5 py-1 text-left text-[11px]" style={{ background: tint('#e0916b', 22) }} onClick={() => toggleWorkout(x.id, d)}>{x.log?.[d] ? '✓ ' : ''}{x.time ? x.time + ' ' : ''}{x.name}</button>)}
                <div className="rows">{tk.map((x) => <TaskRow key={x.k.id + x.occ} x={x} compact />)}</div>
                <InlineAdd placeholder="Add" className="mt-0.5 [&_input]:py-1 [&_input]:text-[12.5px] [&_button]:size-6 [&_button]:text-sm" onAdd={(t) => addTask(t, d)} />
                <div className="mt-auto pt-1.5"><Drops d={d} small /><div className="mt-1.5"><Moods d={d} small /></div></div>
              </div>
            )
          })}
        </div>
      </div>
      <p className="mt-1.5 text-[12.5px] text-mute">Tap a day's name to open it. Drops log water, faces log mood. <Button variant="link" className="text-[12.5px]" onClick={() => eventForm(undefined, ws)}>Add an event</Button></p>
    </div>
  )
}
