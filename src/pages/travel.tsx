import { Sections } from '@/components/sections'
import * as React from 'react'
import { X, MapPin } from 'lucide-react'
import { create } from 'zustand'
import { toast } from 'sonner'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { InlineAdd } from '@/components/ui/field'
import { PageHead } from '@/components/bits'
import { openForm, type Field } from '@/components/sheet'
import { getS, update, undoable, useS } from '@/lib/store'
import { diffD, fmt, today } from '@/lib/date'
import { CURR, money } from '@/lib/food'
import type { Trip } from '@/lib/types'
import { cn, uid } from '@/lib/utils'

const useT = create<{ id: string | null }>(() => ({ id: null }))
type ListKey = 'todo' | 'itin' | 'pack' | 'places' | 'book' | 'budget' | 'journal'
const KEYS: ListKey[] = ['todo', 'itin', 'pack', 'places', 'book', 'budget', 'journal']
const PACK = ['Passport / ID', 'Phone & charger', 'Wallet & cards', 'Medications', 'Toiletries', 'Sleepwear', 'Underwear & socks', 'Outfits', 'Comfortable shoes', 'Travel adaptor', 'Headphones', 'Sunglasses', 'Sun cream']

const setTrip = (id: string, fn: (t: Trip) => void) => update((d) => { const t = d.trips.find((x) => x.id === id); if (t) { KEYS.forEach((k) => { const r = t as unknown as Record<string, unknown[]>; r[k] = r[k] || [] }); fn(t) } })

function tripForm(id?: string) {
  const t = id ? getS().trips.find((x) => x.id === id) : undefined
  openForm({
    title: t ? 'Edit trip' : 'New trip',
    fields: [
      { k: 'name', l: 'Trip', v: t?.name, ph: 'e.g. Lisbon' }, { k: 'dest', l: 'Destination', v: t?.dest },
      { k: 'start', l: 'From', t: 'date', v: t?.start, half: true }, { k: 'end', l: 'To', t: 'date', v: t?.end, half: true },
      { k: 'currency', l: 'Budget currency', t: 'select', o: CURR.map(([c, s]) => [c, s + ' ' + c]), v: t?.currency || 'AUD', half: true },
      { k: 'total', l: 'Total budget (optional)', t: 'number', step: '0.01', v: t?.total, half: true },
    ],
    onSave: (v) => {
      if (!v.name) return false
      if (t) setTrip(t.id, (x) => Object.assign(x, v))
      else { const nid = uid(); update((d) => { d.trips.push({ id: nid, ...v, todo: [], itin: [], pack: [], places: [], book: [], budget: [], journal: [] } as unknown as Trip) }); useT.setState({ id: nid }) }
    },
    onDelete: t ? () => { useT.setState({ id: null }); undoable('Trip deleted', (d) => { d.trips = d.trips.filter((x) => x.id !== t.id) }) } : undefined,
  })
}

function subForm(tid: string, k: 'itin' | 'book' | 'budget' | 'journal', id?: string) {
  const tr = getS().trips.find((x) => x.id === tid)!
  const i = id ? (tr[k] as { id: string }[]).find((x) => x.id === id) as Record<string, string> | undefined : undefined
  const F: Record<typeof k, Field[]> = {
    itin: [{ k: 'day', l: 'Day', v: i?.day, half: true }, { k: 'text', l: 'Plan', t: 'textarea', rows: 2, v: i?.text }],
    book: [{ k: 'what', l: 'What', v: i?.what }, { k: 'ref', l: 'Details / ref', t: 'textarea', rows: 3, v: i?.ref }],
    budget: [{ k: 'item', l: 'Item', v: i?.item, half: true }, { k: 'amount', l: 'Amount', t: 'number', step: '0.01', v: i?.amount, half: true }],
    journal: [{ k: 'date', l: 'Date', t: 'date', v: i?.date || today() }, { k: 'text', l: 'Entry', t: 'textarea', rows: 6, v: i?.text }],
  }
  openForm({
    title: { itin: 'Itinerary', book: 'Booking', budget: 'Budget item', journal: 'Journal entry' }[k],
    fields: F[k],
    onSave: (v) => {
      if (!(v.text || v.what || v.item)) { toast('Add some details'); return false }
      setTrip(tid, (t) => { const arr = t[k] as { id: string }[]; const x = id && arr.find((z) => z.id === id); if (x) Object.assign(x, v); else arr.push({ id: uid(), ...v }) })
    },
    onDelete: id ? () => setTrip(tid, (t) => { (t[k] as { id: string }[]).splice((t[k] as { id: string }[]).findIndex((z) => z.id === id), 1) }) : undefined,
  })
}

function Del({ tid, k, id }: { tid: string; k: ListKey; id: string }) {
  return <button className="p-1 text-mute" aria-label="Remove" onClick={(e) => { e.stopPropagation(); setTrip(tid, (t) => { const a = t[k] as { id: string }[]; a.splice(a.findIndex((z) => z.id === id), 1) }) }}><X className="size-4" /></button>
}

/** Clickable row that can hold its own delete button (a button can't sit inside a button). */
function ClickRow({ onOpen, children }: { onOpen: () => void; children: React.ReactNode }) {
  return <div role="button" tabIndex={0} className="row cursor-pointer" onClick={onOpen} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}>{children}</div>
}

function TwoAdd({ a, b, aw, onAdd, aMode }: { a: string; b: string; aw: string; onAdd: (x: string, y: string) => void; aMode?: 'numeric' | 'decimal' }) {
  const [x, setX] = React.useState(''), [y, setY] = React.useState('')
  return (
    <form className="mt-2 flex items-center gap-1.5" onSubmit={(e) => { e.preventDefault(); if (!x.trim() && !y.trim()) return; onAdd(x.trim(), y.trim()); setX(''); setY('') }}>
      <input className={cn('min-w-0 border-0 border-b border-line bg-transparent px-0.5 py-1.5 outline-none focus:border-accent', aw)} placeholder={a} value={x} inputMode={aMode} onChange={(e) => setX(e.target.value)} />
      <input className="min-w-0 flex-1 border-0 border-b border-line bg-transparent px-0.5 py-1.5 outline-none focus:border-accent" placeholder={b} value={y} onChange={(e) => setY(e.target.value)} />
      <button className="grid size-7.5 flex-none place-items-center rounded-full border border-line bg-card text-lg leading-none" aria-label="Add">+</button>
    </form>
  )
}

export function TravelPage() {
  const s = useS()
  const sel = useT((t) => t.id)
  const tr = s.trips.find((x) => x.id === sel) || s.trips[0]
  const pills = (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {s.trips.map((x) => (
        <button key={x.id} onClick={() => useT.setState({ id: x.id })}
          className={cn('rounded-full border px-3 py-1 text-[13px]', tr && x.id === tr.id ? 'border-accent bg-accent text-on-accent' : 'border-line bg-card')}>{x.name}</button>
      ))}
      <button className="rounded-full border border-dashed border-line px-3 py-1 text-[13px]" onClick={() => tripForm()}>+ New trip</button>
    </div>
  )
  if (!tr) return <div><PageHead crumb="Enjoy" title="Travel" />{pills}<Empty>Plan your next getaway – itinerary, packing, bookings, budget and a journal, all on one page.</Empty></div>
  const id = tr.id, c = tr.currency || 'AUD'
  const L = <K extends ListKey>(k: K) => (tr[k] || []) as Trip[K]
  const tot = L('budget').reduce((a, i) => a + (+i.amount || 0), 0)
  const days = tr.start && tr.start > today() ? diffD(today(), tr.start) : 0
  return (
    <div>
      <PageHead crumb="Enjoy" title="Travel" />
      {pills}
      <Card className="mb-3 flex flex-wrap items-center gap-2.5">
        <div className="flex-1">
          <h2 className="text-2xl">{tr.name}</h2>
          {tr.dest && <div className="text-[13px] text-mute">{tr.dest}</div>}
        </div>
        <span className="font-mono text-[12px] text-mute">
          {tr.start ? fmt(tr.start, { day: 'numeric', month: 'short' }) : ''}{tr.end ? ' to ' + fmt(tr.end, { day: 'numeric', month: 'short' }) : ''}
          {days ? ` · in ${days} day${days === 1 ? '' : 's'}` : ''}
        </span>
        <span className="rounded-full border border-line px-2.5 py-0.5 text-[12px]">{(CURR.find((x) => x[0] === c) || [c, c])[1]} {c}</span>
        <Button onClick={() => tripForm(id)}>Edit</Button>
      </Card>

        <Sections page="trip" items={[
          { id: 'plan', title: "Trip planner", icon: '🧾', desc: "Flights, stays and what is booked", node: (<>
        <Card>
          <CardHeader title="Trip planner" action={<span className="text-[12.5px] text-mute">{L('todo').filter((i) => i.status === 'booked').length}/{L('todo').length} booked</span>} />
          <div className="rows">{L('todo').map((i) => (
            <div key={i.id} className="row">
              <div className="tt flex-1">{i.text}</div>
              <button className={cn('rounded-full border px-2.5 py-0.5 text-[12px] font-semibold', i.status === 'booked' ? 'border-accent bg-accent text-on-accent' : 'border-line text-mute')}
                onClick={() => setTrip(id, (t) => { const x = t.todo.find((z) => z.id === i.id)!; x.status = x.status === 'booked' ? 'todo' : 'booked' })}>{i.status === 'booked' ? 'Booked' : 'To do'}</button>
              <Del tid={id} k="todo" id={i.id} />
            </div>
          ))}</div>
          <InlineAdd placeholder="Flights, stays, insurance…" onAdd={(t) => setTrip(id, (x) => { x.todo.push({ id: uid(), text: t, status: 'todo' }) })} />
        </Card>
          </>) },
          { id: 'pack', title: "Packing list", icon: '🧳', desc: "Tick things off as you pack", node: (<>
        <Card>
          <CardHeader title="Packing list" action={<span className="text-[12.5px] text-mute">{L('pack').filter((i) => i.done).length}/{L('pack').length}</span>} />
          <div className="rows">{L('pack').map((i) => (
            <div key={i.id} className={cn('row', i.done && 'done')}>
              <Check on={i.done} label={i.text} onClick={() => setTrip(id, (t) => { const x = t.pack.find((z) => z.id === i.id)!; x.done = !x.done })} />
              <div className="tt flex-1">{i.text}</div>
              <Del tid={id} k="pack" id={i.id} />
            </div>
          ))}</div>
          <InlineAdd placeholder="Add an item" onAdd={(t) => setTrip(id, (x) => { x.pack.push({ id: uid(), text: t, done: false }) })} />
          {!L('pack').length && <Button variant="link" className="mt-2 text-[13px]" onClick={() => setTrip(id, (x) => { PACK.forEach((t) => x.pack.push({ id: uid(), text: t, done: false })) })}>Add a starter packing list</Button>}
        </Card>
          </>) },
          { id: 'budget', title: "Travel budget", icon: '💰', desc: "Spending against your budget", node: (<>
        <Card>
          <CardHeader title="Travel budget" />
          <div className="rows">{L('budget').map((i) => (
            <ClickRow key={i.id} onOpen={() => subForm(id, 'budget', i.id)}>
              <div className="tt flex-1">{i.item}</div>
              <span className="font-mono text-[12.5px]">{money(+i.amount, c)}</span>
              <Del tid={id} k="budget" id={i.id} />
            </ClickRow>
          ))}</div>
          <TwoAdd a="What" b="Amount" aw="flex-1" onAdd={(w, a) => w && setTrip(id, (x) => { x.budget.push({ id: uid(), item: w, amount: parseFloat(a.replace(/[^\d.-]/g, '')) || 0 }) })} />
          <div className="mt-2.5 flex justify-between font-semibold"><span>Total</span><span className="font-mono">{money(tot, c)}</span></div>
          {!!+(tr.total || 0) && (
            <div className="flex justify-between text-[13px]">
              <span className="text-mute">Budget {money(+tr.total!, c)}</span>
              <span className={tot > +tr.total! ? 'text-danger' : 'text-mute'}>{tot > +tr.total! ? money(tot - +tr.total!, c) + ' over' : money(+tr.total! - tot, c) + ' left'}</span>
            </div>
          )}
        </Card>
          </>) },
          { id: 'itin', title: "Itinerary sketch", icon: '🗺️', desc: "A rough plan for each day", hide: true, node: (<>
        <Card>
          <CardHeader title="Itinerary sketch" />
          <div className="rows">{L('itin').map((i) => (
            <ClickRow key={i.id} onOpen={() => subForm(id, 'itin', i.id)}>
              <span className="w-12 flex-none font-mono text-[11.5px] text-mute">Day {i.day}</span>
              <div className="tt flex-1 whitespace-pre-wrap">{i.text}</div>
              <Del tid={id} k="itin" id={i.id} />
            </ClickRow>
          ))}</div>
          <TwoAdd key={L('itin').length} a="Day" b="Plan" aw="w-12" aMode="numeric" onAdd={(d, t) => t && setTrip(id, (x) => { x.itin.push({ id: uid(), day: d || String(x.itin.length + 1), text: t }) })} />
        </Card>
          </>) },
          { id: 'places', title: "Places & restaurants", icon: '📍', desc: "Spots to visit, linked to Maps", hide: true, node: (<>
        <Card>
          <CardHeader title="Places & restaurants" />
          <div className="rows">{L('places').map((i) => (
            <div key={i.id} className="row">
              <MapPin className="size-4 flex-none text-accent" />
              <a className="tt flex-1" href={'https://maps.google.com/?q=' + encodeURIComponent(i.text + (tr.dest ? ', ' + tr.dest : ''))} target="_blank" rel="noreferrer">{i.text}</a>
              <Del tid={id} k="places" id={i.id} />
            </div>
          ))}</div>
          <InlineAdd placeholder="Add a place" onAdd={(t) => setTrip(id, (x) => { x.places.push({ id: uid(), text: t }) })} />
        </Card>
          </>) },
          { id: 'book', title: "Activities & booking info", icon: '🎟️', desc: "Booking references in one place", hide: true, node: (<>
        <Card>
          <CardHeader title="Activities & booking info" />
          <div className="rows">{L('book').map((i) => (
            <ClickRow key={i.id} onOpen={() => subForm(id, 'book', i.id)}>
              <span className="w-24 flex-none truncate font-mono text-[11.5px]">{i.what}</span>
              <div className="min-w-0 flex-1 truncate text-[13px]">{i.ref}</div>
              <Del tid={id} k="book" id={i.id} />
            </ClickRow>
          ))}</div>
          <TwoAdd a="What" b="Details / ref" aw="w-24" onAdd={(w, r) => setTrip(id, (x) => { x.book.push({ id: uid(), what: w || 'Booking', ref: r }) })} />
        </Card>
          </>) },
          { id: 'journal', title: "Journal", icon: '📔', desc: "Capture moments while they are fresh", hide: true, wide: true, node: (<>
      <Card>
        <CardHeader title="Journal" action={<Button variant="link" className="text-[12.5px]" onClick={() => subForm(id, 'journal')}>+ Entry</Button>} />
        <div className="rows">
          {L('journal').slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).map((i) => (
            <button key={i.id} className="row block w-full text-left" onClick={() => subForm(id, 'journal', i.id)}>
              <div className="lbl text-mute">{i.date ? fmt(i.date, { weekday: 'long', day: 'numeric', month: 'short' }) : ''}</div>
              <div className="whitespace-pre-wrap">{i.text}</div>
            </button>
          ))}
        </div>
        {!L('journal').length && <Empty>Capture the moments while they are fresh.</Empty>}
      </Card>
          </>) },
        ]} />
    </div>
  )
}
