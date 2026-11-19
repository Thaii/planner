import { Pencil } from 'lucide-react'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InlineAdd } from '@/components/ui/field'
import { Num } from '@/components/ui/num'
import { Progress } from '@/components/ui/progress'
import { PageHead, HabitRow } from '@/components/bits'
import { Stat, StatGrid } from '@/components/stat'
import { useS, update } from '@/lib/store'
import { go } from '@/lib/ui'
import { addD, DOWN, fmt, pd, range, today, ym, ds } from '@/lib/date'
import { hDue, hMomentum, hRate, hSched, hStreak, hStreakN, isMin, kept, momentum, votesOn } from '@/lib/logic'
import { cycleHabit } from '@/lib/actions'
import { habitForm, identityForm } from '@/lib/forms'
import { cn, uid } from '@/lib/utils'
import { create } from 'zustand'

const useMonth = create<{ m: string }>(() => ({ m: ym(today()) }))

export function HabitsPage() {
  const s = useS()
  const m = useMonth((x) => x.m)
  const t = today(), [y, mo] = m.split('-').map(Number), n = new Date(y, mo, 0).getDate(), days = range(m + '-01', n)
  const l30 = hRate(s, range(addD(t, -29), 30)), thisM = hRate(s, range(ym(t) + '-01', +t.slice(8)))
  const dueT = s.habits.filter((h) => h.mode !== 'weekly' && hDue(h, t))
  const best = Math.max(0, ...s.habits.map((h) => { const [k, u] = hStreakN(s, h); return u === 'd' ? k : 0 }))
  const shift = (k: number) => { const x = pd(m + '-01'); x.setMonth(x.getMonth() + k); useMonth.setState({ m: ym(ds(x)) }) }
  const monthName = pd(m + '-01').toLocaleDateString('en-AU', { month: 'long' })
  return (
    <div>
      <PageHead crumb={'Grow · ' + fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })} title="Habits" />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="icon" aria-label="Previous month" onClick={() => shift(-1)}>‹</Button>
        <h2 className="text-[21px]">{pd(m + '-01').toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</h2>
        <Button size="icon" aria-label="Next month" onClick={() => shift(1)}>›</Button>
        <Button size="mono" onClick={() => go('wellness')}>Wellness</Button>
      </div>
      {s.habits.length > 0 && (
        <StatGrid>
          <Stat label="Last 30 days" value={<Num value={l30.pct} suffix="%" />} note={`${l30.done} of ${l30.due} due`} />
          <Stat label="Momentum" value={<Num value={momentum(s)} />} note={`A miss dents it, never resets it · ${thisM.pct}% this month`} />
          <Stat label="Due today" value={`${dueT.filter((h) => kept(h, t)).length}/${dueT.length}`} note="Tick them on your dashboard" />
          <Stat label="Best streak (days)" value={<Num value={best} />} note="On your strongest habit" highlight />
        </StatGrid>
      )}
      <div className="mb-3 grid gap-3 min-[760px]:grid-cols-2">
        <Card><CardHeader title="Who you're becoming" />
          {s.identities.map((x) => (
            <button key={x.id} onClick={() => identityForm(x.id)} className="flex w-full items-center gap-2.5 border-t border-line py-2 text-left first:border-t-0">
              <div className="min-w-0 flex-1">
                <div className="font-serif text-[19px] leading-tight">I'm {x.name}.</div>
                <div className="text-[12.5px] text-mute">{x.does || 'Tap to add what this person does'} · {s.habits.filter((h) => h.identity === x.id).length} habits</div>
              </div>
              <div className="min-w-[52px] text-center"><b className="block font-serif text-2xl font-normal text-accent"><Num value={range(addD(t, -29), 30).reduce((a, d) => a + votesOn(s, x.id, d), 0)} /></b><span className="text-[10.5px] text-mute">votes, 30 days</span></div>
            </button>
          ))}
          {s.identities.length < 3 && <InlineAdd placeholder="e.g. a fit person" onAdd={(v) => update((d) => { d.identities.push({ id: uid(), name: v.replace(/^i'?m\s+/i, ''), does: '' }) })} />}
          <p className="mt-1.5 mb-0 text-[12.5px] text-mute">Every habit you keep is a vote for who you're becoming. Pick which identity each habit builds when you edit it.</p>
        </Card>
        <Card><CardHeader title="Today" action={<span className="text-[12.5px] text-mute">Min or Done</span>} />
          <div className="rows">{s.habits.filter((h) => hDue(h, t)).map((h) => <HabitRow key={h.id} h={h} d={t} />)}</div>
          {!s.habits.some((h) => hDue(h, t)) && <Empty>Nothing due today.</Empty>}
        </Card>
      </div>
      <Card className="mb-3"><CardHeader title={'Habit tracker · ' + monthName} action={<span className="text-[12.5px] text-mute">Tap a square: full, then minimum, then clear.</span>} />
        {s.habits.length ? (
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-[3px] text-[11px]">
              <thead><tr><th />{days.map((d) => <th key={d} className={cn('font-mono text-[10px] font-medium text-mute', d === t && 'text-danger')}>{+d.slice(8)}</th>)}<th /></tr></thead>
              <tbody>{s.habits.map((h) => (
                <tr key={h.id}>
                  <td className="sticky left-0 z-1 max-w-[150px] truncate bg-card pr-2 text-[13px]"><button onClick={() => habitForm(h.id)} className="text-left">{h.name}</button></td>
                  {days.map((d) => {
                    const on = kept(h, d), mn = isMin(h, d), fut = d > t
                    return <td key={d}><button disabled={fut} aria-label={`${h.name} ${fmt(d)}${on ? (mn ? ', minimum' : ', done') : ''}`} onClick={() => cycleHabit(h.id, d)}
                      className={cn('size-[21px] rounded-[5px] border border-line bg-card', fut && 'opacity-35', d === t && 'shadow-[0_0_0_2px_var(--danger)]', on && !mn && 'border-accent bg-accent', mn && 'border-accent bg-accent-soft')}
                      style={on && !mn && h.color ? { background: h.color, borderColor: h.color } : undefined} /></td>
                  })}
                  <td className="pl-1.5 font-mono text-[10.5px] whitespace-nowrap text-danger">{hStreakN(s, h)[0] ? hStreak(s, h) : ''}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <Empty>Add a habit to start tracking. Each one keeps its own rhythm, so a rest day never breaks a streak.</Empty>}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {s.habits.map((h) => <button key={h.id} onClick={() => habitForm(h.id)} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-[12.5px]">{h.name} <span className="text-mute">· {hSched(s, h, DOWN)}</span><Pencil className="size-3 text-mute" /></button>)}
        </div>
        <InlineAdd placeholder="Add a habit to track" onAdd={(v) => update((d) => { d.habits.push({ id: uid(), name: v, mode: 'days', days: [0, 1, 2, 3, 4, 5, 6], perWeek: 3, created: today(), log: {} }) })} />
      </Card>
      {s.habits.length > 0 && <>
        <div className="lbl mt-4 mb-2">How each one is going</div>
        <StatGrid>
          {s.habits.map((h) => {
            const d30 = range(addD(t, -29), 30)
            let got: number, of: number
            if (h.mode === 'weekly') { of = Math.round((h.perWeek || 1) * 30 / 7); got = Math.min(d30.filter((d) => kept(h, d)).length, of) }
            else { const due = d30.filter((d) => hDue(h, d) && !(h.created && d < h.created)); of = due.length; got = due.filter((d) => kept(h, d)).length }
            const p = of ? Math.round((got / of) * 100) : 0
            return (
              <div key={h.id} className="rounded-card border border-line bg-card px-3.5 py-3">
                <div className="font-medium">{h.name}</div>
                <small className="text-xs text-mute">{hSched(s, h, DOWN)} · {hStreak(s, h)} · momentum {hMomentum(h)}</small>
                <div className="my-2"><Progress value={p} color={h.color} /></div>
                <small className="text-xs text-mute">{p}% of the last 30 days</small>
              </div>
            )
          })}
        </StatGrid>
      </>}
    </div>
  )
}
