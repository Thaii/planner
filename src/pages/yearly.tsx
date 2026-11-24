import { Sections } from '@/components/sections'
import * as React from 'react'
import { Plus, X } from 'lucide-react'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { AutoTextarea, CommitInput, InlineAdd } from '@/components/ui/field'
import { Progress } from '@/components/ui/progress'
import { Segmented } from '@/components/ui/segmented'
import { Stat, StatGrid } from '@/components/stat'
import { Ico } from '@/components/doodles'
import { PageHead } from '@/components/bits'
import { dayPeek } from '@/components/day-peek'
import { MonthGrid } from './monthly'
import { useS, update } from '@/lib/store'
import { go, useUI } from '@/lib/ui'
import { addD, ds, fmt, pad, pd, today, type DateStr } from '@/lib/date'
import { monthOf } from '@/lib/logic'
import { goalForm } from '@/lib/forms'
import { keyDates, monthTheme, pixelValue, untilLabel, yearStats, type PixelMode } from '@/lib/year'
import type { State, YearPlan } from '@/lib/types'
import { cn, uid } from '@/lib/utils'
import { toast } from 'sonner'
import { compress, PhotoViewer } from '@/components/photos'

const MONTH = (i: number, o: 'long' | 'short' = 'long') => new Date(2000, i, 1).toLocaleDateString('en-AU', { month: o })
const ensureY = (d: State, y: number): YearPlan => (d.years[y] = d.years[y] || { review: {} })

/* ---------- Coming up: the next big dates ---------- */
function ComingUp({ s }: { s: State }) {
  const t = today(), list = keyDates(s, t, addD(t, 365), { payday: true }).slice(0, 7)
  return (
    <Card><CardHeader title="Coming up" />
      {list.length === 0 ? <Empty>No big dates yet. Birthdays from your calendar, trips, project due dates and holiday stickers will count down here.</Empty> : (
        <div>
          {list.map((k, i) => (
            <button key={i} className="row w-full text-left" onClick={() => dayPeek(k.d)}>
              <Ico e={k.e} className="size-[22px] text-[17px]" />
              <span className="min-w-0 flex-1"><span className="tt block font-medium break-words">{k.t}</span>
                <span className="block text-[12px] text-mute">{fmt(k.d, { weekday: 'short', day: 'numeric', month: 'short' })}</span></span>
              <span className={cn('flex-none rounded-full px-2.5 py-0.5 text-[12px] font-semibold', k.d <= addD(t, 7) ? 'bg-accent-soft text-ink' : 'bg-soft text-mute')}>{untilLabel(t, k.d)}</span>
            </button>
          ))}
        </div>
      )}
    </Card>
  )
}

/* ---------- This year's big goals ---------- */
function YearGoals({ s, y }: { s: State; y: number }) {
  const pinned = s.years[y]?.goals || []
  const goals = s.goals.filter((g) => pinned.includes(g.id) || g.target?.startsWith(y + '-'))
  const others = s.goals.filter((g) => !g.done && !goals.includes(g))
  const [picking, setPicking] = React.useState(false)
  return (
    <Card><CardHeader title={`Big goals for ${y}`} />
      {goals.length === 0 ? <Empty>Pick three to five things that would make this a great year. Small and real beats big and vague.</Empty> : (
        <div className="flex flex-col gap-2.5">
          {goals.map((g) => (
            <div key={g.id} className="flex items-start gap-2">
              <button className="min-w-0 flex-1 text-left" onClick={() => goalForm(g.id)}>
                <div className="flex items-baseline gap-2"><span className={cn('tt flex-1 font-medium break-words', g.done && 'text-mute line-through')}>{g.title}</span><span className="font-mono text-[11px] text-mute">{g.done ? 'done' : (g.pct || 0) + '%'}</span></div>
                <div className="mt-1"><Progress value={g.done ? 100 : g.pct || 0} /></div>
                {g.next && !g.done && <div className="mt-1 text-[12.5px] text-mute">Next: {g.next}</div>}
              </button>
              {pinned.includes(g.id) && <button className="p-1 text-mute" aria-label={'Take ' + g.title + ' off this year'} onClick={() => update((d) => { const yp = ensureY(d, y); yp.goals = (yp.goals || []).filter((x) => x !== g.id) })}><X className="size-4" /></button>}
            </div>
          ))}
        </div>
      )}
      <InlineAdd placeholder={`A goal for ${y}…`} onAdd={(t) => update((d) => {
        const id = uid(); d.goals.push({ id, title: t, area: d.settings.goalAreas[0], pct: 0, target: `${y}-12-31` })
        const yp = ensureY(d, y); yp.goals = [...(yp.goals || []), id]
      })} />
      {others.length > 0 && (picking ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {others.map((g) => <Button key={g.id} size="sm" onClick={() => { update((d) => { const yp = ensureY(d, y); yp.goals = [...(yp.goals || []), g.id] }); setPicking(false) }}>{g.title}</Button>)}
          <Button size="sm" variant="link" onClick={() => setPicking(false)}>Cancel</Button>
        </div>
      ) : <Button variant="link" className="mt-2 text-[13px]" onClick={() => setPicking(true)}>Add one of your existing goals</Button>)}
    </Card>
  )
}

/* ---------- Quarters ---------- */
function Quarters({ s, y }: { s: State; y: number }) {
  const t = today(), curQ = pd(t).getFullYear() === y ? Math.floor(pd(t).getMonth() / 3) + 1 : 0
  const qs = s.years[y]?.quarters || {}
  const ensureQ = (d: State, q: number) => { const yp = ensureY(d, y); yp.quarters = yp.quarters || {}; return (yp.quarters[q] = yp.quarters[q] || { items: [] }) }
  return (
    <Card><CardHeader title="Quarter by quarter" />
      <p className="mt-0 mb-2.5 text-[13px] text-mute">Twelve months is a long way off. Give each quarter one focus and a few milestones – small enough to actually see.</p>
      <div className="grid gap-2.5 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-4">
        {[1, 2, 3, 4].map((q) => {
          const Q = qs[q] || { items: [] }, done = Q.items.filter((i) => i.done).length
          return (
            <div key={q} className={cn('rounded-xl border border-line bg-soft p-3', q === curQ && 'border-accent bg-card shadow-[inset_0_0_0_1.5px_var(--accent)]')}>
              <div className="mb-1 flex items-baseline gap-2">
                <b className="font-serif text-[16px] font-normal">Q{q}</b>
                <span className="flex-1 text-[12px] text-mute">{MONTH((q - 1) * 3, 'short')} – {MONTH(q * 3 - 1, 'short')}{q === curQ ? ' · now' : ''}</span>
                {Q.items.length > 0 && <span className="font-mono text-[11px] text-mute">{done}/{Q.items.length}</span>}
              </div>
              <CommitInput value={Q.focus || ''} placeholder="Focus, e.g. Get fit" aria-label={`Q${q} focus`} className="mb-1.5 bg-card px-2.5 py-1.5 text-[14px] font-semibold"
                onCommit={(v) => update((d) => { ensureQ(d, q).focus = v.trim() })} />
              {Q.items.map((i) => (
                <div key={i.id} className={cn('row gap-1.5 py-1 text-[13px]', i.done && 'done')}>
                  <Check on={!!i.done} label={i.text} className="size-[17px]" onClick={() => update((d) => { const x = ensureQ(d, q).items.find((z) => z.id === i.id); if (x) x.done = !x.done })} />
                  <span className="tt flex-1 break-words">{i.text}</span>
                  <button className="p-0.5 text-mute" aria-label="Remove" onClick={() => update((d) => { const Qd = ensureQ(d, q); Qd.items = Qd.items.filter((z) => z.id !== i.id) })}><X className="size-3.5" /></button>
                </div>
              ))}
              <InlineAdd className="mt-1" placeholder="Add a milestone…" onAdd={(text) => update((d) => { ensureQ(d, q).items.push({ id: uid(), text }) })} />
            </div>
          )
        })}
      </div>
    </Card>
  )
}

/* ---------- Year at a glance ---------- */
function Glance({ s, y }: { s: State; y: number }) {
  const kd = keyDates(s, `${y}-01-01`, `${y}-12-31`)
  const curM = today().startsWith(y + '-') ? pd(today()).getMonth() : -1
  return (
    <Card><CardHeader title="Year at a glance" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2.5">
        {Array.from({ length: 12 }, (_, i) => {
          const mk = `${y}-${pad(i + 1)}`, list = kd.filter((k) => k.d.startsWith(mk))
          return (
            <div key={i} className={cn('flex flex-col rounded-xl border border-line bg-soft p-2.5', i === curM && 'border-accent bg-card')}>
              <button className="mb-0.5 text-left font-serif text-[15px] hover:text-accent" onClick={() => go('monthly', { monthRef: mk + '-01' })} aria-label={'Open ' + MONTH(i)}>{MONTH(i)}</button>
              <CommitInput value={monthTheme(s, y, i)} placeholder="Theme for the month" aria-label={MONTH(i) + ' theme'}
                className="mb-1.5 border-0 bg-transparent px-0 py-0.5 text-[12.5px] italic"
                onCommit={(v) => update((d) => { const yp = ensureY(d, y); yp.themes = { ...(yp.themes || {}), [pad(i + 1)]: v.trim() } })} />
              <MonthGrid s={s} y={y} mo={i} mini />
              <div className="mt-2 flex flex-col gap-0.5">
                {list.slice(0, 4).map((k, j) => (
                  <button key={j} className="flex items-center gap-1.5 text-left text-[12px]" onClick={() => dayPeek(k.d)}>
                    <span className="w-5 flex-none font-mono text-[10.5px] text-mute">{+k.d.slice(8)}</span>
                    <Ico e={k.e} className="size-[15px] text-[11px]" /><span className="truncate">{k.t}</span>
                  </button>
                ))}
                {list.length > 4 && <button className="text-left text-[11px] text-mute" onClick={() => go('monthly', { monthRef: mk + '-01' })}>+{list.length - 4} more</button>}
              </div>
            </div>
          )
        })}
      </div>
      <p className="mt-2 mb-0 text-[12.5px] text-mute">Tap a day for what's on. Big dates come from yearly calendar events, trips, project and goal dates, and holiday, birthday and big-day stickers.</p>
    </Card>
  )
}

/* ---------- Year in pixels ---------- */
const PIX_LEGEND: Record<PixelMode, [string, string]> = { mood: ['Low', 'Great'], energy: ['Drained', 'Buzzing'], habits: ['None kept', 'All kept'] }
function Pixels({ s, y }: { s: State; y: number }) {
  const [mode, setMode] = React.useState<PixelMode>('mood')
  const t = today()
  const col = (v: number | null) => (v === null ? undefined : `color-mix(in oklab, var(--accent) ${Math.round(18 + v * 82)}%, var(--card))`)
  let logged = 0
  const rows = Array.from({ length: 12 }, (_, mo) => {
    const n = new Date(y, mo + 1, 0).getDate()
    return Array.from({ length: 31 }, (_, i) => {
      if (i >= n) return { d: '', v: null as number | null, future: false }
      const d: DateStr = ds(new Date(y, mo, i + 1)), future = d > t, v = future ? null : pixelValue(s, d, mode)
      if (v !== null) logged++
      return { d, v, future }
    })
  })
  return (
    <Card><CardHeader title="Year in pixels" />
      <Segmented value={mode} onChange={setMode} options={[['mood', 'Mood'], ['energy', 'Energy'], ['habits', 'Habits']]} className="max-w-[340px]" />
      <div className="overflow-x-auto">
        <div className="grid min-w-[300px] grid-cols-[26px_repeat(31,minmax(0,1fr))] gap-[2px]" role="grid" aria-label={'Year in pixels: ' + mode}>
          <span />{Array.from({ length: 31 }, (_, i) => <span key={i} className={cn('text-center font-mono text-[8.5px] text-mute', i % 5 !== 0 && 'max-[600px]:invisible')}>{i + 1}</span>)}
          {rows.map((r, mo) => (
            <React.Fragment key={mo}>
              <span className="self-center font-mono text-[9.5px] text-mute uppercase">{MONTH(mo, 'short').slice(0, 3)}</span>
              {r.map((c, i) => c.d ? (
                <button key={i} onClick={() => dayPeek(c.d)} aria-label={fmt(c.d, { day: 'numeric', month: 'long' }) + (c.v === null ? ', nothing logged' : '')}
                  className={cn('aspect-square rounded-[3px] border border-line/60', c.v === null && 'bg-soft', c.future && 'opacity-40', c.d === t && 'ring-[1.5px] ring-ink/60')}
                  style={{ background: col(c.v) }} />
              ) : <span key={i} />)}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[12px] text-mute">
        {PIX_LEGEND[mode][0]}{[0, 0.25, 0.5, 0.75, 1].map((v) => <i key={v} className="inline-block size-3 rounded-[3px] border border-line/60" style={{ background: col(v) }} />)}{PIX_LEGEND[mode][1]}
        <span className="flex-1" />
        <span>{logged ? `${logged} days logged` : mode === 'habits' ? 'Tick habits to fill this in.' : 'Fill in the Check-in on your Dashboard to colour a day.'}</span>
      </div>
    </Card>
  )
}

/* ---------- Year in numbers ---------- */
function Numbers({ s, y }: { s: State; y: number }) {
  const st = yearStats(s, y)
  return (
    <Card><CardHeader title={`${y} in numbers`} />
      <StatGrid className="mb-0 min-[760px]:grid-cols-2 min-[1100px]:grid-cols-3">
        <Stat label="To-dos done" value={st.todos} tint="mint" />
        <Stat label="Habit ticks" value={st.habitTicks} tint="lav" />
        <Stat label="Days checked in" value={st.checkins} tint="sky" />
        <Stat label="Average mood" value={st.avgMood ? st.avgMood.toFixed(1) + ' / 5' : '–'} tint="peach" />
        <Stat label="Goals finished" value={st.goalsDone} tint="butter" />
        <Stat label="Trips" value={st.trips} note={st.gratitude ? `${st.gratitude} days of gratitude` : undefined} />
      </StatGrid>
    </Card>
  )
}

/* ---------- Year in review ---------- */
const REVIEW: [string, string, string][] = [
  ['win', 'Biggest win', 'The thing you\'d tell a friend about first'],
  ['proud', 'Proud of', 'Including the small, quiet ones'],
  ['memory', 'Best memory', 'A moment you want to keep'],
  ['lesson', 'Biggest lesson', 'What this year taught you'],
  ['drop', 'Leaving behind', 'A habit, worry or "should" you\'re done with'],
  ['carry', 'Carrying into next year', 'What worked and is worth keeping'],
]
function Review({ s, y }: { s: State; y: number }) {
  const yy = s.years[y] || { review: {} }
  const monthWins = Array.from({ length: 12 }, (_, i) => { const r = monthOf(s, `${y}-${pad(i + 1)}`).refl; return [i, r.well || r.achieve || ''] as const }).filter(([, w]) => w)
  return (
    <Card><CardHeader title="Year in review" />
      {monthWins.length > 0 && (
        <div className="mb-3">
          <div className="lbl mb-1.5 text-mute">From your monthly reflections</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {monthWins.map(([i, w]) => (
              <button key={i} onClick={() => go('monthly', { monthRef: `${y}-${pad(i + 1)}-01` })} className="w-[180px] flex-none rounded-xl bg-tint-butter px-3 py-2 text-left text-[12.5px]">
                <div className="lbl mb-0.5 text-mute">{MONTH(i, 'short')}</div><div className="line-clamp-3">{w}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-3 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-3">
        {REVIEW.map(([k, l, hint]) => (
          <div key={k} className="rounded-xl border border-line bg-soft p-3">
            <div className="text-[14px] font-semibold">{l}</div>
            <div className="mb-1.5 text-[12px] text-mute">{hint}</div>
            <AutoTextarea rows={3} className="bg-card" value={yy.review[k] || ''} onSave={(v) => update((d) => { ensureY(d, y).review[k] = v })} />
          </div>
        ))}
      </div>
    </Card>
  )
}

export function YearlyPage() {
  const s = useS()
  const ref = useUI((u) => u.yearRef)
  const [view, setView] = React.useState<number | null>(null)
  const y = pd(ref).getFullYear(), yy = s.years[y] || { review: {} }, vis = s.vision[y] || []
  const shift = (n: number) => { const x = pd(ref); x.setDate(1); x.setFullYear(x.getFullYear() + n); useUI.setState({ yearRef: ds(x) }) }
  return (
    <div>
      <PageHead crumb={'Plan · ' + y} title="Yearly" />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="icon" aria-label="Previous year" onClick={() => shift(-1)}>‹</Button>
        <h2 className="text-[21px]">{y}</h2>
        <Button size="icon" aria-label="Next year" onClick={() => shift(1)}>›</Button>
        {y !== pd(today()).getFullYear() && <Button size="mono" onClick={() => useUI.setState({ yearRef: today() })}>This year</Button>}
        <Button size="mono" onClick={() => go('monthly')}>Monthly</Button>
        <Button size="mono" onClick={() => go('goals')}>Goals</Button>
      </div>
      {view !== null && vis[view] && <PhotoViewer photos={vis} i={view} onIndex={setView} />}
      <Sections page="yearly" items={[
        { id: 'word', title: 'Word of the year', icon: '🌟', desc: 'One word to check your choices against', node: (
          <Card><CardHeader title="Word of the year" />
            <p className="mt-0 mb-2 text-[13px] text-mute">One word for how you want this year to feel – something to check your choices against.</p>
            <CommitInput value={yy.word || ''} placeholder="e.g. Calm, Brave, Growth" aria-label="Word of the year" className="px-4 py-2.5 font-serif text-[22px]"
              onCommit={(v) => update((d) => { ensureY(d, y).word = v.trim() })} />
          </Card>) },
        { id: 'coming', title: 'Coming up', icon: '⏳', desc: 'Countdown to birthdays, trips and big dates', node: <ComingUp s={s} /> },
        { id: 'goals', title: 'Big goals', icon: '🎯', desc: "This year's three to five big goals", node: <YearGoals s={s} y={y} /> },
        { id: 'numbers', title: 'Year in numbers', icon: '📊', desc: 'To-dos done, habit ticks, average mood', node: <Numbers s={s} y={y} /> },
        { id: 'quarters', title: 'Quarter by quarter', icon: '🗓️', desc: 'A focus and milestones for each quarter', wide: true, node: <Quarters s={s} y={y} /> },
        { id: 'glance', title: 'Year at a glance', icon: '📅', desc: 'All twelve months with their big dates', wide: true, node: <Glance s={s} y={y} /> },
        { id: 'pixels', title: 'Year in pixels', icon: '🟪', desc: 'Every day coloured by mood, energy or habits', wide: true, node: <Pixels s={s} y={y} /> },
        { id: 'vision', title: 'Vision board', icon: '🖼️', desc: 'Photos of what you are working towards', wide: true, node: (
          <Card><CardHeader title="Vision board" />
            <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
              {vis.map((v) => (
                <figure key={v.id} className="m-0">
                  <button className="block w-full" aria-label={'Open ' + (v.cap || 'photo')} onClick={() => setView(vis.indexOf(v))}>
                    <img src={v.img} alt={v.cap || 'Vision board photo'} className="lamp-warm block aspect-square w-full rounded-xl object-cover" />
                  </button>
                  <figcaption className="mt-1 flex items-center gap-1">
                    <CommitInput value={v.cap} placeholder="Caption" className="border-0 bg-transparent px-1 py-0.5 text-xs" onCommit={(c) => update((d) => { const x = (d.vision[y] || []).find((z) => z.id === v.id); if (x) x.cap = c })} />
                    <button className="p-1 text-mute" aria-label="Remove photo" onClick={() => update((d) => { d.vision[y] = (d.vision[y] || []).filter((z) => z.id !== v.id) })}><X className="size-4" /></button>
                  </figcaption>
                </figure>
              ))}
              {vis.length < 12 && (
                <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-[1.5px] border-dashed border-line text-center text-[13px] text-mute">
                  <span className="flex items-center gap-1"><Plus className="size-4" /> Add photo</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                    const files = [...(e.target.files || [])].slice(0, 12 - vis.length)
                    for (const f of files) {
                      try { const img = await compress(f); update((d) => { (d.vision[y] = d.vision[y] || []).push({ id: uid(), img, cap: '' }) }) } catch { toast("Couldn't read that image") }
                    }
                    e.target.value = ''
                  }} />
                </label>
              )}
            </div>
            <p className="mt-1.5 mb-0 text-[12.5px] text-mute">Photos are shrunk and kept inside your planner, up to twelve a year.</p>
          </Card>) },
        { id: 'review', title: 'Year in review', icon: '📝', desc: 'Wins, lessons, best memories and what to carry forward', wide: true, hide: true, node: <Review s={s} y={y} /> },
      ]} />
    </div>
  )
}
