import * as React from 'react'
import { ChevronDown, Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InlineAdd } from '@/components/ui/field'
import { Num } from '@/components/ui/num'
import { PageHead, HabitRow } from '@/components/bits'
import { Stat, StatGrid } from '@/components/stat'
import { MaybePal } from '@/components/pals'
import { getS, useS, update } from '@/lib/store'
import { go } from '@/lib/ui'
import { addD, DOWN, fmt, pd, range, today, ym, ds } from '@/lib/date'
import { hDue, hMomentum, hRate, hSched, idById, isMin, kept, momentum, votesOn, weekStart } from '@/lib/logic'
import { cycleHabit } from '@/lib/actions'
import { habitForm, identityForm } from '@/lib/forms'
import type { Habit, State } from '@/lib/types'
import { cn, uid } from '@/lib/utils'
import { create } from 'zustand'

const useMonth = create<{ m: string }>(() => ({ m: ym(today()) }))

/** Every habit gets a colour so rows are easy to tell apart (its own colour if you picked one). */
const HCOL = ['#e07fa6', '#6fae7a', '#6f8fd6', '#cf9c3f', '#9f88c8', '#4fa59b', '#e09a6b', '#d98c8c']
const colourOf = (s: State, h: Habit) => h.color || HCOL[s.habits.indexOf(h) % HCOL.length]

/** How often a habit was kept when due over the last 30 days. */
function rate30(h: Habit) {
  const t = today(), d30 = range(addD(t, -29), 30)
  let got: number, of: number
  if (h.mode === 'weekly') { of = Math.round((h.perWeek || 1) * 30 / 7); got = Math.min(d30.filter((d) => kept(h, d)).length, of) }
  else { const due = d30.filter((d) => hDue(h, d) && !(h.created && d < h.created)); of = due.length; got = due.filter((d) => kept(h, d)).length }
  return of ? Math.round((got / of) * 100) : 0
}

const newHabit = (name: string) => update((d) => { d.habits.push({ id: uid(), name, mode: 'days', days: [0, 1, 2, 3, 4, 5, 6], perWeek: 3, created: today(), log: {} }) })

/** Today's habits: still-to-do first; done ones fold away once there are lots. */
function TodayCard({ s }: { s: State }) {
  const t = today()
  const due = s.habits.filter((h) => hDue(h, t))
  const todo = due.filter((h) => !kept(h, t)), done = due.filter((h) => kept(h, t))
  const [showDone, setShowDone] = React.useState(false)
  const fold = due.length > 5 && done.length > 0
  return (
    <Card>
      <CardHeader title="Today" pal="sprig" action={<span className="rounded-full bg-tint-sky px-2.5 py-0.5 text-[12.5px] font-bold">{done.length}/{due.length} done</span>} />
      <div className="rows">
        {todo.map((h) => <HabitRow key={h.id} h={h} d={t} />)}
        {(!fold || showDone) && done.map((h) => <HabitRow key={h.id} h={h} d={t} />)}
      </div>
      {fold && (
        <button className="mt-2 flex w-full items-center justify-center gap-1 rounded-full bg-tint-mint py-1.5 text-[13px] font-bold" onClick={() => setShowDone(!showDone)}>
          {showDone ? 'Hide' : 'Show'} {done.length} done <ChevronDown className={cn('size-4 transition-transform', showDone && 'rotate-180')} />
        </button>
      )}
      {!due.length && <Empty>Nothing due today – enjoy the rest.</Empty>}
      {due.length > 0 && !todo.length && <div className="mt-2 rounded-2xl bg-tint-mint px-3 py-2 text-[13.5px] font-semibold">All done for today. Lovely work.</div>}
    </Card>
  )
}

/** The list you manage habits from: clear Edit buttons, colour dots and how each one is going. */
function YourHabits({ s }: { s: State }) {
  return (
    <Card>
      <CardHeader title={`Your habits · ${s.habits.length}`} action={<Button size="sm" variant="primary" onClick={() => habitForm()}><Plus className="size-3.5" />New habit</Button>} />
      <div className="flex flex-col gap-1.5">
        {s.habits.map((h) => {
          const c = colourOf(s, h), p = rate30(h), idn = idById(s, h.identity)
          return (
            <div key={h.id} className="flex items-center gap-3 rounded-2xl bg-soft px-3 py-2">
              <span className="size-3 flex-none rounded-full" style={{ background: c }} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{h.name}</div>
                <div className="truncate text-[12px] text-mute">{hSched(s, h, DOWN)}{idn ? ` · ${idn.name}` : ''} · momentum {hMomentum(h)}</div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-card" title={`${p}% of the last 30 days`}><div className="h-full rounded-full" style={{ width: p + '%', background: c }} /></div>
              </div>
              <span className="w-10 text-right text-[12px] font-bold text-mute">{p}%</span>
              <Button size="sm" onClick={() => habitForm(h.id)} aria-label={'Edit ' + h.name}><Pencil className="size-3.5" />Edit</Button>
            </div>
          )
        })}
      </div>
      {!s.habits.length && <Empty>No habits yet. Add one below – start tiny.</Empty>}
      <InlineAdd placeholder="Quick add a habit (you can edit it after)" onAdd={(v) => { newHabit(v); toast(`Added “${v}”`, { action: { label: 'Edit details', onClick: () => { const h = [...getS().habits].reverse().find((x) => x.name === v); if (h) habitForm(h.id) } } }) }} />
      <p className="mt-1.5 mb-0 text-[12px] text-mute">The bar shows how often you kept it when it was due over the last 30 days.</p>
    </Card>
  )
}

export function HabitsPage() {
  const s = useS()
  const m = useMonth((x) => x.m)
  const t = today(), [y, mo] = m.split('-').map(Number), n = new Date(y, mo, 0).getDate(), days = range(m + '-01', n)
  const l30 = hRate(s, range(addD(t, -29), 30)), thisM = hRate(s, range(ym(t) + '-01', +t.slice(8)))
  const dueT = s.habits.filter((h) => h.mode !== 'weekly' && hDue(h, t))
  const wk = range(weekStart(s, t), 7).filter((d) => d <= t)
  const thisWeek = wk.reduce((a, d) => a + s.habits.filter((h) => kept(h, d)).length, 0)
  const shift = (k: number) => { const x = pd(m + '-01'); x.setMonth(x.getMonth() + k); useMonth.setState({ m: ym(ds(x)) }) }
  const monthName = pd(m + '-01').toLocaleDateString('en-AU', { month: 'long' })
  return (
    <div>
      <PageHead crumb={'Grow · ' + fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })} title="Habits" />
      {s.habits.length > 0 && (
        <StatGrid>
          <Stat tint="mint" label="Last 30 days" value={<Num value={l30.pct} suffix="%" />} note={`${l30.done} of ${l30.due} kept when due`} />
          <Stat tint="peach" label="Momentum" value={<Num value={momentum(s)} />} note={`A miss dents it, never resets it · ${thisM.pct}% this month`} icon={<MaybePal name="sprig" size={34} />} />
          <Stat tint="sky" label="Due today" value={`${dueT.filter((h) => kept(h, t)).length}/${dueT.length}`} note="Tick them below or on Today" />
          <Stat tint="butter" label="This week" value={<Num value={thisWeek} />} note={`habit${thisWeek === 1 ? '' : 's'} kept so far`} icon={<MaybePal name="twinkle" size={34} />} />
        </StatGrid>
      )}
      <div className="mb-3 grid items-start gap-3 min-[900px]:grid-cols-2">
        <TodayCard s={s} />
        <YourHabits s={s} />
      </div>

      <Card className="mb-3">
        <CardHeader title={'Habit tracker · ' + monthName} action={
          <span className="flex items-center gap-1">
            <Button size="icon" className="size-8" aria-label="Previous month" onClick={() => shift(-1)}>‹</Button>
            <span className="min-w-[76px] text-center text-[13px] font-semibold">{pd(m + '-01').toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}</span>
            <Button size="icon" className="size-8" aria-label="Next month" onClick={() => shift(1)}>›</Button>
          </span>
        } />
        {s.habits.length ? (
          <>
            <div className="max-h-[440px] overflow-auto rounded-2xl">
              <table className="border-separate border-spacing-[3px] text-[11px]">
                <thead className="sticky top-0 z-2 bg-card"><tr><th className="sticky left-0 z-3 bg-card" />{days.map((d) => <th key={d} className={cn('font-mono text-[10px] font-medium text-mute', d === t && 'text-accent font-bold')}>{+d.slice(8)}</th>)}</tr></thead>
                <tbody>{s.habits.map((h, i) => {
                  const c = colourOf(s, h)
                  return (
                    <tr key={h.id} className={i % 2 ? '' : '[&>td]:bg-soft/60'}>
                      <td className="sticky left-0 z-1 max-w-[150px] rounded-l-lg bg-card pr-2 pl-1.5">
                        <button onClick={() => habitForm(h.id)} className="flex max-w-[140px] items-center gap-1.5 text-left text-[13px]" title={'Edit ' + h.name}>
                          <span className="size-2.5 flex-none rounded-full" style={{ background: c }} /><span className="truncate">{h.name}</span>
                        </button>
                      </td>
                      {days.map((d) => {
                        const on = kept(h, d), mn = isMin(h, d), fut = d > t
                        return <td key={d}><button disabled={fut} aria-label={`${h.name} ${fmt(d)}${on ? (mn ? ', minimum' : ', done') : ''}`} onClick={() => cycleHabit(h.id, d)}
                          className={cn('size-[21px] rounded-[6px] border border-line bg-card', fut && 'opacity-35', d === t && 'ring-2 ring-accent/50')}
                          style={on ? (mn ? { background: `color-mix(in srgb, ${c} 30%, var(--card))`, borderColor: c } : { background: c, borderColor: c }) : undefined} /></td>
                      })}
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
            <p className="mt-2 mb-0 text-[12px] text-mute">Tap a square: full, then minimum (pale), then clear. Tap a habit's name to edit it.</p>
          </>
        ) : <Empty>Add a habit to start tracking. Each one keeps its own rhythm, so a rest day never counts against you.</Empty>}
      </Card>

      <Card className="mb-3"><CardHeader title="Who you're becoming" pal="twinkle" />
        <div className="grid gap-2 min-[760px]:grid-cols-3">
          {s.identities.map((x) => (
            <button key={x.id} onClick={() => identityForm(x.id)} className="flex items-center gap-2.5 rounded-2xl bg-tint-lav px-3.5 py-2.5 text-left">
              <div className="min-w-0 flex-1">
                <div className="font-serif text-[18px] leading-tight">I'm {x.name}.</div>
                <div className="text-[12.5px] text-mute">{x.does || 'Tap to add what this person does'} · {s.habits.filter((h) => h.identity === x.id).length} habits</div>
              </div>
              <div className="min-w-[48px] text-center"><b className="block font-serif text-2xl font-normal text-accent"><Num value={range(addD(t, -29), 30).reduce((a, d) => a + votesOn(s, x.id, d), 0)} /></b><span className="text-[10.5px] text-mute">votes</span></div>
              <Pencil className="size-3.5 flex-none text-mute" />
            </button>
          ))}
        </div>
        {s.identities.length < 3 && <InlineAdd placeholder="Add who you're becoming, e.g. a calm person" onAdd={(v) => update((d) => { d.identities.push({ id: uid(), name: v.replace(/^i'?m\s+/i, ''), does: '' }) })} />}
        <p className="mt-1.5 mb-0 text-[12.5px] text-mute">Every habit you keep is a vote for who you're becoming. Pick which one each habit builds when you edit it. Votes are from the last 30 days.</p>
      </Card>
      <Button size="mono" onClick={() => go('wellness')}>Wellness</Button>
    </div>
  )
}
