import { Sections } from '@/components/sections'
import { X } from 'lucide-react'
import { create } from 'zustand'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { InlineAdd } from '@/components/ui/field'
import { Progress } from '@/components/ui/progress'
import { PageHead } from '@/components/bits'
import { useS, update, undoable } from '@/lib/store'
import { go } from '@/lib/ui'
import { fmt } from '@/lib/date'
import { goalForm } from '@/lib/forms'
import { cn, uid } from '@/lib/utils'
import { toast } from 'sonner'

const useArea = create<{ a: string | null }>(() => ({ a: null }))

export function GoalsPage() {
  const s = useS()
  const areas = s.settings.goalAreas
  const sel = useArea((x) => x.a)
  const cur = sel && areas.includes(sel) ? sel : areas[0]
  const inArea = s.goals.filter((g) => (g.area || areas[0]) === cur)
  const active = s.goals.filter((g) => !g.done && g.pct)
  return (
    <div>
      <PageHead crumb="Grow" title="Goals" />
      <div className="mb-3 flex flex-wrap gap-2"><Button size="mono" onClick={() => go('yearly')}>Yearly</Button><Button size="mono" onClick={() => go('projects')}>Projects</Button></div>
      <Sections page="goals" items={[
        { id: 'list', title: "My goals", icon: '🏔️', desc: "Your goals by area of life", node: (<>
      <Card><CardHeader title="My goals" action={<span className="text-[12.5px] text-mute">Open a goal to add progress and a next step</span>} />
        <div className="mb-2 flex flex-wrap gap-1.5">
          {areas.map((a) => (
            <button key={a} onClick={() => useArea.setState({ a })} className={cn('rounded-full border border-line bg-card px-3 py-1 text-[12.5px]', a === cur && 'border-accent bg-accent-soft font-semibold')}>
              {a} · {s.goals.filter((g) => (g.area || areas[0]) === a).length}
            </button>
          ))}
        </div>
        <div className="rows">
          {inArea.length ? inArea.map((g) => (
            <div key={g.id} className={cn('row', g.done && 'done')}>
              <Check on={!!g.done} label={g.title} onClick={() => { update((d) => { const x = d.goals.find((z) => z.id === g.id)!; x.done = !x.done; if (x.done && !x.pct) x.pct = 100 }); if (!g.done) toast('Goal achieved 🎉') }} />
              <button className="min-w-0 flex-1 text-left" onClick={() => goalForm(g.id)}>
                <div className="tt font-medium">{g.title}</div>
                {(g.next || g.target) && <div className="text-[12.5px] text-mute">{[g.next && 'Next: ' + g.next, g.target && 'by ' + fmt(g.target, { day: 'numeric', month: 'short', year: 'numeric' })].filter(Boolean).join(' · ')}</div>}
              </button>
              <span className="text-[12.5px] text-mute">{g.pct ? g.pct + '%' : '–'}</span>
              <button className="p-1 text-mute" aria-label="Delete goal" onClick={() => undoable('Goal deleted', (d) => { d.goals = d.goals.filter((z) => z.id !== g.id) })}><X className="size-4" /></button>
            </div>
          )) : <Empty>No goals in this area yet.</Empty>}
        </div>
        <InlineAdd placeholder={`Add a ${cur.toLowerCase()} goal`} onAdd={(t) => update((d) => { d.goals.push({ id: uid(), title: t, area: cur, pct: 0 }) })} />
      </Card>
        </>) },
        { id: 'where', title: "Where you are", icon: '📍', desc: "Progress for every goal", node: (<>
      <Card><CardHeader title="Where you are" />
        <div className="grid grid-cols-2 gap-2.5 min-[760px]:grid-cols-4">
          {areas.map((a) => { const g = s.goals.filter((x) => (x.area || areas[0]) === a); return (
            <div key={a} className="rounded-card bg-soft px-3.5 py-3"><span className="lbl text-mute">{a}</span><b className="mt-1 block font-serif text-[30px] font-normal">{g.filter((x) => x.done).length}/{g.length}</b></div>
          ) })}
        </div>
        {active.map((g) => (
          <div key={g.id} className="mt-2.5">
            <div className="flex text-[13px]"><span className="flex-1">{g.title} <span className="text-mute">· {g.area}</span></span><span>{g.pct}%</span></div>
            <div className="mt-1"><Progress value={g.pct || 0} /></div>
          </div>
        ))}
      </Card>
        </>) },
      ]} />
    </div>
  )
}
