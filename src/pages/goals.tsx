import { Sections } from '@/components/sections'
import { ChevronDown, Pencil, Plus } from 'lucide-react'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { InlineAdd } from '@/components/ui/field'
import { PageHead } from '@/components/bits'
import { Stat, StatGrid } from '@/components/stat'
import { MaybePal } from '@/components/pals'
import { Num } from '@/components/ui/num'
import { useS, update, getS } from '@/lib/store'
import { go } from '@/lib/ui'
import { fmt, today } from '@/lib/date'
import { goalForm } from '@/lib/forms'
import type { Goal, State } from '@/lib/types'
import { cn, uid } from '@/lib/utils'
import { toast } from 'sonner'
import * as React from 'react'

/** One soft colour per area of life, in the order the areas are listed. */
const AREA_COL = ['#7FC49B', '#7DB4E6', '#E9A07A', '#A98FE0', '#E3B54A', '#E58FA5']
const areaCol = (s: State, a: string) => AREA_COL[Math.max(0, s.settings.goalAreas.indexOf(a)) % AREA_COL.length]
const areaOf = (s: State, g: Goal) => g.area || s.settings.goalAreas[0]

const toggleDone = (g: Goal) => {
  update((d) => { const x = d.goals.find((z) => z.id === g.id)!; x.done = !x.done; if (x.done) x.pct = 100 })
  if (!g.done) toast('Goal achieved 🎉')
}

function GoalRow({ s, g }: { s: State; g: Goal }) {
  const c = areaCol(s, areaOf(s, g)), pct = g.done ? 100 : g.pct || 0
  const sub = [g.next && 'Next: ' + g.next, g.target && 'by ' + fmt(g.target, { day: 'numeric', month: 'short', year: 'numeric' })].filter(Boolean).join(' · ')
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl bg-soft px-3 py-2.5', g.done && 'opacity-70')}>
      <Check on={!!g.done} label={g.title} onClick={() => toggleDone(g)} />
      <button className="min-w-0 flex-1 text-left" onClick={() => goalForm(g.id)}>
        <div className={cn('font-semibold', g.done && 'line-through')}>{g.title}</div>
        {g.why && <div className="line-clamp-1 text-[12.5px] text-mute italic">“{g.why}”</div>}
        {sub && <div className="truncate text-[12px] text-mute">{sub}</div>}
        {!g.why && !g.done && <div className="text-[12px] font-semibold text-accent">+ Add why it matters</div>}
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-card"><div className="h-full rounded-full transition-[width]" style={{ width: pct + '%', background: c }} /></div>
      </button>
      <span className="w-10 text-right text-[12px] font-bold text-mute">{pct}%</span>
      <Button size="sm" onClick={() => goalForm(g.id)} aria-label={'Edit ' + g.title}><Pencil className="size-3.5" />Edit</Button>
    </div>
  )
}

function YourGoals({ s }: { s: State }) {
  const [showDone, setShowDone] = React.useState(false)
  const areas = s.settings.goalAreas
  const open = s.goals.filter((g) => !g.done), done = s.goals.filter((g) => g.done)
  return (
    <Card>
      <CardHeader title={`Your goals · ${open.length}`} action={<Button size="sm" variant="primary" onClick={() => goalForm()}><Plus className="size-3.5" />New goal</Button>} />
      {open.length ? (
        <div className="flex flex-col gap-3.5">
          {areas.filter((a) => open.some((g) => areaOf(s, g) === a)).map((a) => (
            <div key={a}>
              <div className="mb-1.5 flex items-center gap-2 text-[13px] font-semibold"><span className="size-2.5 rounded-full" style={{ background: areaCol(s, a) }} />{a}<span className="font-normal text-mute">· {open.filter((g) => areaOf(s, g) === a).length}</span></div>
              <div className="flex flex-col gap-1.5">{open.filter((g) => areaOf(s, g) === a).map((g) => <GoalRow key={g.id} s={s} g={g} />)}</div>
            </div>
          ))}
        </div>
      ) : <Empty>{done.length ? 'Every goal is done – time to dream up the next one.' : 'No goals yet. Add one below, then open it to write why it matters.'}</Empty>}
      {done.length > 0 && (
        <div className="mt-3">
          <button className="flex items-center gap-1 text-[13px] font-semibold text-mute" onClick={() => setShowDone(!showDone)}>
            <ChevronDown className={cn('size-4 transition-transform', showDone && 'rotate-180')} />{done.length} achieved
          </button>
          {showDone && <div className="mt-1.5 flex flex-col gap-1.5">{done.map((g) => <GoalRow key={g.id} s={s} g={g} />)}</div>}
        </div>
      )}
      <InlineAdd placeholder="Quick add a goal (open it after to add the why)" onAdd={(t) => {
        update((d) => { d.goals.push({ id: uid(), title: t, area: areas[0], pct: 0 }) })
        toast(`Added “${t}”`, { action: { label: 'Add the why', onClick: () => { const g = [...getS().goals].reverse().find((x) => x.title === t); if (g) goalForm(g.id) } } })
      }} />
    </Card>
  )
}

function ByArea({ s }: { s: State }) {
  return (
    <Card><CardHeader title="By area of life" />
      <div className="flex flex-col gap-3">
        {s.settings.goalAreas.map((a) => {
          const g = s.goals.filter((x) => areaOf(s, x) === a), avg = g.length ? Math.round(g.reduce((t, x) => t + (x.done ? 100 : x.pct || 0), 0) / g.length) : 0
          return (
            <button key={a} className="text-left" onClick={() => goalForm(undefined, a)} title={`Add a ${a.toLowerCase()} goal`}>
              <div className="flex items-center gap-2 text-[13.5px]"><span className="size-2.5 rounded-full" style={{ background: areaCol(s, a) }} /><span className="flex-1 font-semibold">{a}</span><span className="text-mute">{g.length ? `${g.filter((x) => x.done).length}/${g.length} done · ${avg}%` : 'No goals yet · add one'}</span></div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full" style={{ width: avg + '%', background: areaCol(s, a) }} /></div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}

export function GoalsPage() {
  const s = useS(), t = today()
  const open = s.goals.filter((g) => !g.done), done = s.goals.filter((g) => g.done)
  const avg = open.length ? Math.round(open.reduce((a, g) => a + (g.pct || 0), 0) / open.length) : 0
  const next = open.filter((g) => g.target && g.target >= t).sort((a, b) => a.target!.localeCompare(b.target!))[0]
  return (
    <div>
      <PageHead crumb="Grow" title="Goals" right={<div className="flex gap-2"><Button size="mono" onClick={() => go('yearly')}>Yearly</Button><Button size="mono" onClick={() => go('projects')}>Projects</Button></div>} />
      <Sections page="goals" items={[
        { id: 'stats', title: 'Your numbers', icon: '📊', desc: 'Active, achieved, progress and the next deadline', wide: true, node: (
          <StatGrid>
            <Stat tint="mint" label="Active goals" value={<Num value={open.length} />} note={`across ${new Set(open.map((g) => areaOf(s, g))).size} area${new Set(open.map((g) => areaOf(s, g))).size === 1 ? '' : 's'} of life`} icon={<MaybePal name="summit" size={34} />} />
            <Stat tint="butter" label="Achieved" value={<Num value={done.length} />} note={done.length ? 'every one counts' : 'your first is on its way'} icon={<MaybePal name="champ" size={34} />} />
            <Stat tint="sky" label="Progress" value={<Num value={avg} suffix="%" />} note="average across active goals" icon={<MaybePal name="flaggy" size={34} />} />
            <Stat tint="peach" label="Next deadline" value={next ? fmt(next.target!, { day: 'numeric', month: 'short' }) : '–'} note={<span className="line-clamp-1">{next ? next.title : 'add a target date to a goal'}</span>} icon={<MaybePal name="sandy" size={34} />} />
          </StatGrid>
        ) },
        { id: 'list', title: 'Your goals', icon: '🏔️', desc: 'Every goal, grouped by area of life', wide: true, node: <YourGoals s={s} /> },
        { id: 'where', title: 'By area of life', icon: '📍', desc: 'How each area is going', wide: true, node: <ByArea s={s} /> },
      ]} />
    </div>
  )
}
