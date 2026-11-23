import { IcoBubble } from '@/components/doodles'
import * as React from 'react'
import { DndContext, DragOverlay, PointerSensor, KeyboardSensor, MouseSensor, TouchSensor, closestCorners, pointerWithin, useDroppable, type CollisionDetection, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ChevronsDown, ChevronsUp, ChevronUp, EyeOff, GripVertical } from 'lucide-react'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CARD_INFO } from '@/components/welcome'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { update } from '@/lib/store'
import { CARDS_DEF } from '@/lib/constants'
import type { State } from '@/lib/types'
import type { DateStr } from '@/lib/date'
import { cn } from '@/lib/utils'

type Render = (id: string) => React.ReactNode
/** Whatever is under the pointer wins (a card over its column); otherwise the nearest one. */
const collide: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  if (hits.length) return [...hits.filter((h) => !String(h.id).startsWith('col-')), ...hits.filter((h) => String(h.id).startsWith('col-'))]
  return closestCorners(args)
}
const nameOf = (id: string) => (CARDS_DEF.find((c) => c[0] === id) || [id, id])[1]

/** One card while arranging: a grip bar on top, the real card underneath (not clickable while arranging). */
function Item({ id, render, onHide }: { id: string; render: Render; onHide: () => void }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={cn('relative rounded-card ring-2 ring-accent/35 ring-offset-2 ring-offset-bg', isDragging && 'opacity-30')}>
      <div className="flex items-center gap-1 rounded-t-card bg-accent-soft px-2 py-1">
        <button ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={'Move ' + nameOf(id)} className="flex flex-1 cursor-grab touch-none items-center gap-1.5 py-1 text-left text-[12.5px] font-semibold active:cursor-grabbing">
          <GripVertical className="size-4 text-accent" />{nameOf(id)}
        </button>
        <button className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] text-mute hover:text-ink" onClick={onHide}><EyeOff className="size-3.5" />Hide</button>
      </div>
      <div className="pointer-events-none select-none [&>section]:rounded-t-none" aria-hidden>{render(id)}</div>
    </div>
  )
}

function Column({ id, items, render, onHide }: { id: string; items: string[]; render: Render; onHide: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={cn('flex min-h-[220px] min-w-0 flex-col gap-4 rounded-card border-2 border-dashed p-2 transition-colors', isOver ? 'border-accent bg-accent-soft/40' : 'border-line')}>
        {items.map((x) => <Item key={x} id={x} render={render} onHide={() => onHide(x)} />)}
        {!items.length && <div className="grid flex-1 place-items-center text-[13px] text-mute">Drop a card here</div>}
      </div>
    </SortableContext>
  )
}

/** Drag cards within and between the three columns. Done saves the layout; it stays put until arranged again. */
export function ArrangeGrid({ cols: start, render, onDone }: { cols: string[][]; d: DateStr; s: State; render: Render; onDone: () => void }) {
  const [cols, setCols] = React.useState(start)
  const [active, setActive] = React.useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  const colOf = (id: string) => id.startsWith('col-') ? +id.slice(4) : cols.findIndex((c) => c.includes(id))

  const onOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    const from = colOf(String(active.id)), to = colOf(String(over.id))
    if (from < 0 || to < 0 || from === to) return
    setCols((cs) => {
      const next = cs.map((c) => [...c])
      next[from] = next[from].filter((x) => x !== active.id)
      const at = String(over.id).startsWith('col-') ? next[to].length : Math.max(0, next[to].indexOf(String(over.id)))
      next[to].splice(at, 0, String(active.id))
      return next
    })
  }
  const onEnd = ({ active, over }: DragEndEvent) => {
    setActive(null)
    if (!over) return
    const c = colOf(String(active.id)), o = colOf(String(over.id))
    if (c === o && !String(over.id).startsWith('col-')) {
      setCols((cs) => cs.map((col, i) => i === c ? arrayMove(col, col.indexOf(String(active.id)), col.indexOf(String(over.id))) : col))
    }
  }
  const save = () => {
    update((d) => {
      const all = d.settings.cards
      const placed = cols.flatMap((col, ci) => col.map((id) => { const x = all.find((y) => y.id === id)!; x.col = ci; return x }))
      const ids = new Set(placed.map((x) => x.id))
      // Keep the top cards (Next up, Who I'm becoming) first, then the columns in reading order, then hidden ones.
      const top = all.filter((x) => !ids.has(x.id) && x.on), off = all.filter((x) => !ids.has(x.id) && !x.on)
      d.settings.cards = [...top, ...placed, ...off]
    })
    toast('Layout saved')
    onDone()
  }
  const hide = (id: string) => {
    setCols((cs) => cs.map((c) => c.filter((x) => x !== id)))
    update((d) => { const x = d.settings.cards.find((y) => y.id === id); if (x) x.on = false })
  }
  const reset = () => {
    update((d) => { d.settings.cards.forEach((x) => { delete x.col }) })
    toast('Back to the standard layout'); onDone()
  }
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl bg-accent-soft px-3.5 py-2.5 text-[13.5px]">
        <span className="flex-1">Drag cards by their bar to move them, even into another column. Tap <b>Done</b> to lock it in.</span>
        <Button size="sm" variant="ghost" onClick={reset}>Standard layout</Button>
        <Button size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" variant="primary" onClick={save}>Done</Button>
      </div>
      <DndContext sensors={sensors} collisionDetection={collide} onDragStart={(e: DragStartEvent) => setActive(String(e.active.id))} onDragOver={onOver} onDragEnd={onEnd} onDragCancel={() => setActive(null)}>
        <div className="grid grid-cols-[1.15fr_1fr_1fr] items-stretch gap-3">
          {cols.map((c, i) => <Column key={i} id={'col-' + i} items={c} render={render} onHide={hide} />)}
        </div>
        <DragOverlay>{active && <div className="rotate-1 rounded-card bg-card px-3 py-2 text-[13px] font-semibold shadow-[0_12px_32px_rgba(0,0,0,.2)]"><GripVertical className="mr-1 inline size-4 text-accent" />{nameOf(active)}</div>}</DragOverlay>
      </DndContext>
    </div>
  )
}

/* ---------- Phones and narrow screens: one list of card names ---------- */

function Row({ id, i, last, move, onHide }: { id: string; i: number; last: number; move: (from: number, to: number) => void; onHide: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const [icon] = CARD_INFO[id] || ['▫️']
  const btn = 'grid size-7 flex-none place-items-center rounded-lg border border-line bg-card text-mute disabled:opacity-30'
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('flex items-center gap-1 rounded-xl border border-line bg-card px-2 py-1', isDragging && 'z-10 shadow-[0_10px_28px_rgba(0,0,0,.18)] ring-2 ring-accent')}>
      {/* Hold anywhere on the name to pick it up (a quick swipe still scrolls the page). */}
      <div {...attributes} {...listeners} aria-label={'Hold and drag to move ' + nameOf(id)} className="flex min-w-0 flex-1 cursor-grab items-center gap-2 py-1.5 select-none [-webkit-touch-callout:none] active:cursor-grabbing">
        <GripVertical className="size-4 flex-none text-accent" />
        <IcoBubble e={icon} i={Object.keys(CARD_INFO).indexOf(id)} size={28} />
        <span className="truncate text-[13.5px] font-semibold">{nameOf(id)}</span>
      </div>
      <button className={btn} aria-label={'Move ' + nameOf(id) + ' to the top'} disabled={i === 0} onClick={() => move(i, 0)}><ChevronsUp className="size-4" /></button>
      <button className={btn} aria-label={'Move ' + nameOf(id) + ' up'} disabled={i === 0} onClick={() => move(i, i - 1)}><ChevronUp className="size-4" /></button>
      <button className={btn} aria-label={'Move ' + nameOf(id) + ' down'} disabled={i === last} onClick={() => move(i, i + 1)}><ChevronDown className="size-4" /></button>
      <button className={btn} aria-label={'Move ' + nameOf(id) + ' to the bottom'} disabled={i === last} onClick={() => move(i, last)}><ChevronsDown className="size-4" /></button>
      <button className={cn(btn, 'max-[460px]:hidden')} aria-label={'Hide ' + nameOf(id)} onClick={onHide}><EyeOff className="size-4" /></button>
    </div>
  )
}

/** Reorder Today's cards as a list: hold and drag, or the arrows. Done saves; it stays put until arranged again. */
export function ArrangeList({ items: start, onDone }: { items: string[]; onDone: () => void }) {
  const [items, setItems] = React.useState(start)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const move = (from: number, to: number) => setItems((x) => arrayMove(x, from, to))
  const top = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => { top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [])
  const save = () => {
    update((d) => {
      const all = d.settings.cards
      const placed = items.map((id) => all.find((y) => y.id === id)!)
      const ids = new Set(items)
      d.settings.cards = [...all.filter((x) => !ids.has(x.id) && x.on), ...placed, ...all.filter((x) => !ids.has(x.id) && !x.on)]
    })
    toast('Layout saved'); onDone()
  }
  return (
    <div>
      <div ref={top} className="mb-3 scroll-mt-3 rounded-xl bg-accent-soft px-3.5 py-2.5 text-[13.5px]">
        Hold a card's name and drag it, or use the arrows: <ChevronsUp className="inline size-3.5" /> top, <ChevronUp className="inline size-3.5" /> up, <ChevronDown className="inline size-3.5" /> down, <ChevronsDown className="inline size-3.5" /> bottom.
        <div className="mt-2 flex justify-end gap-2">
          <Button size="sm" onClick={onDone}>Cancel</Button>
          <Button size="sm" variant="primary" onClick={save}>Done</Button>
        </div>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCorners} modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={({ active, over }) => { if (over && active.id !== over.id) setItems((x) => arrayMove(x, x.indexOf(String(active.id)), x.indexOf(String(over.id)))) }}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {items.map((id, i) => <Row key={id} id={id} i={i} last={items.length - 1} move={move}
              onHide={() => { setItems((x) => x.filter((y) => y !== id)); update((d) => { const c = d.settings.cards.find((y) => y.id === id); if (c) c.on = false }) }} />)}
          </div>
        </SortableContext>
      </DndContext>
      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" onClick={onDone}>Cancel</Button>
        <Button size="sm" variant="primary" onClick={save}>Done</Button>
      </div>
    </div>
  )
}
