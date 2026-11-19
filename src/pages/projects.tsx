import { X } from 'lucide-react'
import { create } from 'zustand'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { AutoTextarea, InlineAdd } from '@/components/ui/field'
import { Progress } from '@/components/ui/progress'
import { Segmented } from '@/components/ui/segmented'
import { PageHead } from '@/components/bits'
import { openForm } from '@/components/sheet'
import { getS, useS, update } from '@/lib/store'
import { fmt } from '@/lib/date'
import { lab, labColor, tint } from '@/lib/logic'
import type { Project } from '@/lib/types'
import { cn, uid } from '@/lib/utils'

const useP = create<{ id: string | null; filter: 'active' | 'paused' | 'done' | 'all' }>(() => ({ id: null, filter: 'active' }))

function projectForm(id?: string) {
  const p = id ? getS().projects.find((x) => x.id === id) : undefined
  openForm({
    title: p ? 'Edit project' : 'New project',
    fields: [
      { k: 'name', l: 'Project', v: p?.name, ph: 'e.g. House, room by room' },
      { k: 'label', l: 'Colour label', t: 'label', v: p?.label, half: true },
      { k: 'due', l: 'Due', t: 'date', v: p?.due, half: true },
      { k: 'status', l: 'Status', t: 'select', o: [['active', 'Active'], ['paused', 'Paused'], ['done', 'Done']], v: p?.status || 'active' },
    ],
    onSave: (v) => {
      if (!v.name) return false
      let newId = id
      update((d) => { const x = id && d.projects.find((z) => z.id === id); if (x) Object.assign(x, v); else { newId = uid(); d.projects.push({ id: newId, tasks: [], ...v } as unknown as Project) } })
      useP.setState({ id: newId || null })
    },
    onDelete: id ? () => { update((d) => { d.projects = d.projects.filter((z) => z.id !== id) }); useP.setState({ id: null }) } : undefined,
  })
}

export function ProjectsPage() {
  const s = useS()
  const { id, filter } = useP()
  const p = id ? s.projects.find((x) => x.id === id) : undefined
  if (p) {
    const n = p.tasks.length, dn = p.tasks.filter((t) => t.done).length
    const setTasks = (fn: (t: Project['tasks']) => void) => update((d) => { const x = d.projects.find((z) => z.id === p.id); if (x) fn(x.tasks) })
    return (
      <div>
        <Button variant="link" className="text-[13.5px]" onClick={() => useP.setState({ id: null })}>← All projects</Button>
        <PageHead crumb="Grow · Project" title={p.name} right={<Button onClick={() => projectForm(p.id)}>Edit</Button>} />
        <div className="mb-1.5 text-[13.5px] text-mute">{p.due ? 'Due ' + fmt(p.due, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' : ''}{dn} of {n} steps · {p.status || 'active'}</div>
        <div className="mb-3.5"><Progress value={n ? (dn / n) * 100 : 0} /></div>
        <div className="grid gap-3 min-[760px]:grid-cols-2">
          <Card><CardHeader title="Steps" />
            <div className="rows">{p.tasks.length ? p.tasks.map((t) => (
              <div key={t.id} className={cn('row', t.done && 'done')}>
                <Check on={t.done} label={t.text} onClick={() => setTasks((l) => { const x = l.find((z) => z.id === t.id)!; x.done = !x.done })} />
                <div className="tt flex-1">{t.text}</div>
                <button className="p-1 text-mute" aria-label="Remove step" onClick={() => setTasks((l) => { l.splice(l.findIndex((z) => z.id === t.id), 1) })}><X className="size-4" /></button>
              </div>
            )) : <Empty>Break it into small steps. Only the next one needs to be clear.</Empty>}</div>
            <InlineAdd placeholder="Add a step" onAdd={(v) => setTasks((l) => { l.push({ id: uid(), text: v, done: false }) })} />
          </Card>
          <Card><CardHeader title="Notes" />
            <AutoTextarea rows={8} className="bg-transparent" placeholder="Ideas, links, decisions…" value={p.notes || ''} onSave={(v) => update((d) => { const x = d.projects.find((z) => z.id === p.id); if (x) x.notes = v })} />
          </Card>
        </div>
      </div>
    )
  }
  const list = s.projects.filter((x) => filter === 'all' || (x.status || 'active') === filter)
  return (
    <div>
      <PageHead crumb="Grow" title="Projects" />
      <Segmented value={filter} onChange={(f) => useP.setState({ filter: f })} options={[['active', 'Active'], ['paused', 'Paused'], ['done', 'Done'], ['all', 'All']]} />
      <div className="grid gap-3 min-[760px]:grid-cols-2 min-[1100px]:grid-cols-3">
        {list.map((x) => {
          const n = x.tasks.length, dn = x.tasks.filter((t) => t.done).length
          return (
            <button key={x.id} onClick={() => useP.setState({ id: x.id })} className="rounded-card border border-line bg-card px-4 py-3.5 text-left shadow-card">
              {lab(s, x.label) && <span className="rounded-full px-2.5 py-0.5 text-[11px]" style={{ background: tint(labColor(s, x.label), 25) }}>{lab(s, x.label)!.name}</span>}
              <h2 className="mt-1.5 mb-0.5 text-xl">{x.name}</h2>
              <div className="text-[12.5px] text-mute">{x.due ? 'Due ' + fmt(x.due, { day: 'numeric', month: 'short', year: 'numeric' }) : 'No due date'} · {dn}/{n} steps</div>
              <div className="mt-2"><Progress value={n ? (dn / n) * 100 : 0} /></div>
            </button>
          )
        })}
      </div>
      {!list.length && <Empty>Projects hold the bigger things – a renovation, a launch, a move – broken into steps.</Empty>}
      <Button variant="primary" className="mt-3" onClick={() => projectForm()}>+ New project</Button>
    </div>
  )
}
