import { Plus } from 'lucide-react'
import { Button } from './ui/button'
import { Empty } from './ui/card'
import { TaskRow } from './bits'
import { closeSheet, openSheet } from './sheet'
import { Ico } from './doodles'
import { useS } from '@/lib/store'
import { go } from '@/lib/ui'
import { fmt, t12, today, type DateStr } from '@/lib/date'
import { eventsOn, labColor, tasksOn, workoutsOn } from '@/lib/logic'
import { eventForm, taskForm } from '@/lib/forms'
import { DAY_STICKERS, stickersOn } from '@/pages/monthly'

/** A quick look at one day from the month grid: what's on, the to-dos, and a way into the full day. */
function DayPeek({ d }: { d: DateStr }) {
  const s = useS()
  const ev = eventsOn(s, d), wo = workoutsOn(s, d), tk = tasksOn(s, d).filter((x) => !x.over), stk = stickersOn(s, d)
  const isToday = d === today()
  const timed = ev.filter((e) => e.time), allDay = ev.filter((e) => !e.time)
  const Row = ({ e }: { e: (typeof ev)[number] }) => (
    <button className="row w-full text-left" disabled={e.ro} onClick={() => eventForm(e.id)}>
      <span className="w-[74px] flex-none font-mono text-[11.5px] text-mute">{e.time ? t12(e.time) + (e.end ? '–' + t12(e.end) : '') : 'All day'}</span>
      <span className="lamp-warm size-2 flex-none rounded-full" style={{ background: e.ro ? '#8a857d' : labColor(s, e.label) || 'var(--accent)' }} />
      <span className="min-w-0 flex-1">
        <span className="tt block font-medium break-words">{e.title}</span>
        {(e.loc || e.cal) && <span className="block text-[12px] text-mute">{[e.loc, e.cal && 'from ' + e.cal].filter(Boolean).join(' · ')}</span>}
      </span>
    </button>
  )
  return (
    <div data-testid="day-peek">
      <div className="lbl text-mute">{isToday ? 'Today' : fmt(d, { weekday: 'long' })}</div>
      <h3 className="mt-0.5 mb-2 flex items-center gap-2 pr-8 text-[22px]">
        {fmt(d, { day: 'numeric', month: 'long', year: 'numeric' })}
        {stk.map((x) => <Ico key={x} e={x} className="size-[22px] text-[16px]" />)}
      </h3>
      {stk.length > 0 && <div className="-mt-1 mb-2 text-[12.5px] text-mute">{stk.map((x) => DAY_STICKERS.find((y) => y[0] === x)?.[1] || x).join(' · ')}</div>}

      <div className="lbl mt-3 mb-1 text-mute">What's on</div>
      {ev.length === 0 && wo.length === 0 ? <Empty>Nothing booked – a free day.</Empty> : (
        <div>
          {allDay.map((e) => <Row key={e.id + d} e={e} />)}
          {timed.map((e) => <Row key={e.id + d} e={e} />)}
          {wo.map((w) => (
            <div key={w.id} className="row">
              <span className="w-[74px] flex-none font-mono text-[11.5px] text-mute">{w.time ? t12(w.time) : 'Any time'}</span>
              <span className="lamp-warm size-2 flex-none rounded-full" style={{ background: labColor(s, w.label) || '#e0916b' }} />
              <span className="tt flex-1 font-medium">{w.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="lbl mt-4 mb-1 text-mute">To-dos{tk.length > 0 && ` · ${tk.filter((x) => x.done).length} of ${tk.length} done`}</div>
      {tk.length === 0 ? <div className="py-1 text-[13.5px] text-mute">No to-dos for this day.</div> : tk.map((x) => <TaskRow key={x.k.id + x.occ} x={x} compact />)}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="md" onClick={() => eventForm(undefined, d)}><Plus className="size-4" /> Event</Button>
        <Button size="md" onClick={() => taskForm(undefined, d)}><Plus className="size-4" /> To-do</Button>
        <span className="flex-1" />
        <Button size="md" variant="primary" onClick={() => { closeSheet(); if (isToday) go('today'); else go('day', { date: d }) }}>Plan this day</Button>
      </div>
    </div>
  )
}

export const dayPeek = (d: DateStr) => openSheet(<DayPeek d={d} />, fmt(d, { weekday: 'long', day: 'numeric', month: 'long' }))
