import { useViewportWidth } from '@/lib/use-width'
import { Ico, IcoBubble } from '@/components/doodles'
import * as React from 'react'
import { DndContext, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronsDown, ChevronsUp, ChevronUp, Eye, EyeOff, GripVertical, LayoutGrid, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { update, useS } from '@/lib/store'
import { cn } from '@/lib/utils'

/**
 * A page made of sections the user can reorder, hide and add back.
 * Pages start with only their essentials showing (`hide: true` = tucked away until added),
 * so a first visit never feels like a wall of cards.
 */
export interface Sec {
  id: string; title: string; icon: string; node: React.ReactNode
  /** One line shown in "Add to this page". */
  desc?: string
  /** Takes the full width on wide screens. */
  wide?: boolean
  /** Hidden until the user adds it (keeps first visits calm). */
  hide?: boolean
}

function useLayout(page: string, items: Sec[]) {
  const lay = useS().settings.layouts?.[page]
  const ids = items.map((x) => x.id)
  // Sections added in an update slot in where they'd sit by default (before the next section that follows them), not at the bottom.
  const order = lay ? ids.filter((id) => !lay.order.includes(id)).reduce((o, id) => {
    const after = ids.slice(ids.indexOf(id) + 1).find((x) => o.includes(x))
    return after ? [...o.slice(0, o.indexOf(after)), id, ...o.slice(o.indexOf(after))] : [...o, id]
  }, lay.order.filter((id) => ids.includes(id))) : ids
  // New sections added in an update show unless they're marked as extra.
  const hidden = new Set(lay ? [...lay.hidden, ...items.filter((x) => x.hide && !lay.order.includes(x.id)).map((x) => x.id)] : items.filter((x) => x.hide).map((x) => x.id))
  const save = (o: string[], h: Set<string>) => update((d) => { d.settings.layouts = { ...(d.settings.layouts || {}), [page]: { order: o, hidden: [...h] } } })
  return { order, hidden, save }
}

function Row({ sec, i, last, move, on, toggle }: { sec: Sec; i: number; last: number; move: (a: number, b: number) => void; on: boolean; toggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: sec.id })
  const btn = 'grid size-7 flex-none place-items-center rounded-lg border border-line bg-card text-mute disabled:opacity-30'
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('flex items-center gap-1 rounded-xl border border-line bg-card px-2 py-1', !on && 'opacity-55', isDragging && 'z-10 shadow-[0_10px_28px_rgba(0,0,0,.18)] ring-2 ring-accent')}>
      <div {...attributes} {...listeners} aria-label={'Hold and drag to move ' + sec.title} className="flex min-w-0 flex-1 cursor-grab items-center gap-2 py-1.5 select-none [-webkit-touch-callout:none] active:cursor-grabbing">
        <GripVertical className="size-4 flex-none text-accent" /><IcoBubble e={sec.icon} i={i} size={28} />
        <span className="truncate text-[13.5px] font-semibold">{sec.title}</span>
      </div>
      <button className={btn} aria-label={'Move ' + sec.title + ' to the top'} disabled={i === 0} onClick={() => move(i, 0)}><ChevronsUp className="size-4" /></button>
      <button className={btn} aria-label={'Move ' + sec.title + ' up'} disabled={i === 0} onClick={() => move(i, i - 1)}><ChevronUp className="size-4" /></button>
      <button className={btn} aria-label={'Move ' + sec.title + ' down'} disabled={i === last} onClick={() => move(i, i + 1)}><ChevronDown className="size-4" /></button>
      <button className={cn(btn, 'max-[400px]:hidden')} aria-label={'Move ' + sec.title + ' to the bottom'} disabled={i === last} onClick={() => move(i, last)}><ChevronsDown className="size-4" /></button>
      <button className={btn} aria-label={(on ? 'Hide ' : 'Show ') + sec.title} aria-pressed={!on} onClick={toggle}>{on ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</button>
    </div>
  )
}

function Arrange({ items, order: start, hidden: startHidden, onSave, onReset, onDone }: { items: Sec[]; order: string[]; hidden: Set<string>; onSave: (o: string[], h: Set<string>) => void; onReset: () => void; onDone: () => void }) {
  const [order, setOrder] = React.useState(start)
  const [hidden, setHidden] = React.useState(new Set(startHidden))
  const byId = new Map(items.map((x) => [x.id, x]))
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 4 } }), useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const move = (a: number, b: number) => setOrder((x) => arrayMove(x, a, b))
  return (
    <div className="mb-3 rounded-card bg-accent-soft p-3">
      <div className="mb-2 text-[13.5px]">Hold a name and drag, or use the arrows. The eye shows or hides a section – hidden ones wait in “Add to this page”.</div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={({ active, over }) => { if (over && active.id !== over.id) setOrder((x) => arrayMove(x, x.indexOf(String(active.id)), x.indexOf(String(over.id)))) }}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {order.map((id, i) => <Row key={id} sec={byId.get(id)!} i={i} last={order.length - 1} move={move} on={!hidden.has(id)}
              toggle={() => setHidden((h) => { const n = new Set(h); if (n.has(id)) n.delete(id); else n.add(id); return n })} />)}
          </div>
        </SortableContext>
      </DndContext>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="link" className="text-[13px]" onClick={() => { onReset(); onDone() }}>Back to the standard layout</Button>
        <span className="flex-1" />
        <Button size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" variant="primary" onClick={() => { onSave(order, hidden); toast('Layout saved'); onDone() }}>Done</Button>
      </div>
    </div>
  )
}

/** Big screens: drag the real cards around the page. Each card gets a grip bar; its contents can't be tapped while arranging. */
function CardItem({ sec, onHide }: { sec: Sec; onHide: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: sec.id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('relative min-w-0 rounded-card ring-2 ring-accent/35 ring-offset-2 ring-offset-bg', sec.wide && 'col-span-2', isDragging && 'z-10 opacity-80 shadow-[0_16px_40px_rgba(0,0,0,.2)]')}>
      <div className="flex items-center gap-1 rounded-t-card bg-accent-soft px-2 py-1">
        <button ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={'Move ' + sec.title} className="flex flex-1 cursor-grab touch-none items-center gap-1.5 py-1 text-left text-[13px] font-semibold active:cursor-grabbing">
          <GripVertical className="size-4 text-accent" /><Ico e={sec.icon} />{sec.title}
        </button>
        <button className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] text-mute hover:text-ink" onClick={onHide}><EyeOff className="size-3.5" />Hide</button>
      </div>
      <div className="pointer-events-none select-none [&>section]:rounded-t-none" aria-hidden>{sec.node}</div>
    </div>
  )
}

function ArrangeCards({ items, order: start, hidden: startHidden, onSave, onReset, onDone }: { items: Sec[]; order: string[]; hidden: Set<string>; onSave: (o: string[], h: Set<string>) => void; onReset: () => void; onDone: () => void }) {
  const [order, setOrder] = React.useState(start)
  const [hidden, setHidden] = React.useState(new Set(startHidden))
  const byId = new Map(items.map((x) => [x.id, x]))
  const shown = order.filter((id) => !hidden.has(id))
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 4 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  return (
    <div className="mb-3">
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-accent-soft px-3.5 py-2.5 text-[13.5px]">
        <span className="flex-1">Drag cards by their bar to move them around the page. <b>Hide</b> tucks one into “Add to this page”.</span>
        <Button size="sm" variant="ghost" onClick={() => { onReset(); onDone() }}>Standard layout</Button>
        <Button size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" variant="primary" onClick={() => { onSave(order, hidden); toast('Layout saved'); onDone() }}>Done</Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => { if (over && active.id !== over.id) setOrder((x) => arrayMove(x, x.indexOf(String(active.id)), x.indexOf(String(over.id)))) }}>
        <SortableContext items={shown} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 items-start gap-4">
            {shown.map((id) => <CardItem key={id} sec={byId.get(id)!} onHide={() => setHidden((h) => new Set(h).add(id))} />)}
          </div>
        </SortableContext>
      </DndContext>
      {[...hidden].filter((id) => byId.has(id)).length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[13px]">
          <span className="text-mute">Hidden:</span>
          {order.filter((id) => hidden.has(id)).map((id) => (
            <button key={id} className="flex items-center gap-1 rounded-full bg-soft px-2.5 py-1" onClick={() => setHidden((h) => { const n = new Set(h); n.delete(id); return n })}>
              <Ico e={byId.get(id)!.icon} /> {byId.get(id)!.title} <Plus className="size-3.5 text-accent" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Wide screens: full-width sections span both columns; the half-width ones between them stack in two
 *  independent columns (1st left, 2nd right, 3rd left…), so a long card never leaves a hole beside a short one. */
function Columns({ items }: { items: Sec[] }) {
  const blocks: (Sec | Sec[])[] = []
  for (const x of items) {
    if (x.wide) blocks.push(x)
    else if (Array.isArray(blocks.at(-1))) (blocks.at(-1) as Sec[]).push(x)
    else blocks.push([x])
  }
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((b) => Array.isArray(b) ? (
        <div key={b[0].id} className="grid grid-cols-2 items-start gap-3">
          {[0, 1].map((c) => <div key={c} className="flex min-w-0 flex-col gap-3">{b.filter((_, i) => i % 2 === c).map((x) => <div key={x.id} className="min-w-0">{x.node}</div>)}</div>)}
        </div>
      ) : <div key={b.id} className="min-w-0">{b.node}</div>)}
    </div>
  )
}

const useWide = () => useViewportWidth() >= 900

/** Renders a page's sections in the user's order, with an Arrange button and an "Add to this page" tray. */
export function Sections({ page, items, className }: { page: string; items: Sec[]; className?: string }) {
  const { order, hidden, save } = useLayout(page, items)
  const [arranging, setArranging] = React.useState(false)
  const [all, setAll] = React.useState(false)
  const byId = new Map(items.map((x) => [x.id, x]))
  const shown = order.filter((id) => !hidden.has(id)).map((id) => byId.get(id)!)
  const off = order.filter((id) => hidden.has(id)).map((id) => byId.get(id)!)
  const reset = () => update((d) => { if (d.settings.layouts) delete d.settings.layouts[page] })
  const wide = useWide()
  return (
    <div className={className}>
      <div className="mb-2 flex justify-end">
        {!arranging && <Button size="mono" onClick={() => setArranging(true)}><LayoutGrid className="size-3.5" />Arrange</Button>}
      </div>
      {arranging && !wide && <Arrange items={items} order={order} hidden={hidden} onSave={save} onReset={reset} onDone={() => setArranging(false)} />}
      {arranging && wide ? <ArrangeCards items={items} order={order} hidden={hidden} onSave={save} onReset={reset} onDone={() => setArranging(false)} /> :
      wide ? <Columns items={shown} /> :
      <div className="grid gap-3">
        {shown.map((x) => <div key={x.id} className="min-w-0">{x.node}</div>)}
      </div>}
      {off.length > 0 && !arranging && (
        <section className="mt-4 rounded-card border border-dashed border-line px-4 py-3.5">
          <div className="lbl mb-2 text-mute">Add to this page</div>
          <div className="grid gap-1.5 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-3">
            {(all ? off : off.slice(0, 4)).map((x, i) => (
              <button key={x.id} onClick={() => { const h = new Set(hidden); h.delete(x.id); save(order, h) }} className="flex items-center gap-2.5 rounded-xl bg-soft px-3 py-2 text-left hover:bg-accent-soft">
                <IcoBubble e={x.icon} i={i} />
                <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold">{x.title}</span>{x.desc && <span className="block truncate text-[12px] text-mute">{x.desc}</span>}</span>
                <Plus className="size-4 flex-none text-accent" />
              </button>
            ))}
          </div>
          {off.length > 4 && <button className="mt-2 text-[13px] text-accent underline" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${off.length}`}</button>}
        </section>
      )}
    </div>
  )
}
