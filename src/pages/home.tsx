import * as React from 'react'
import { Pencil } from 'lucide-react'
import { create } from 'zustand'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { InlineAdd } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import { PageHead } from '@/components/bits'
import { openForm } from '@/components/sheet'
import { getS, update, undoable, useS } from '@/lib/store'
import { addD, dow, DOWN, fmt, range, today } from '@/lib/date'
import { periodKey, weekStart } from '@/lib/logic'
import { FREQS, PERIOD_WORD } from '@/lib/constants'
import type { Chore, Freq } from '@/lib/types'
import { go } from '@/lib/ui'
import { useFood } from './food'
import { cn, uid } from '@/lib/utils'

type Tab = 'jobs' | 'contacts' | 'inv'
const useHome = create<{ tab: Tab }>(() => ({ tab: 'jobs' }))

function choreForm(id: string) {
  const c = getS().chores.find((x) => x.id === id)
  if (!c) return
  openForm({
    title: 'Home job',
    fields: [{ k: 'name', l: 'Job', v: c.name }, { k: 'freq', l: 'How often', t: 'select', o: FREQS, v: c.freq }],
    onSave: (v) => { if (!v.name) return false; update((d) => { const x = d.chores.find((z) => z.id === id); if (x) Object.assign(x, v) }) },
    onDelete: () => undoable('Home job deleted', (d) => { d.chores = d.chores.filter((z) => z.id !== id) }),
  })
}
function roomForm(i: number) {
  openForm({
    title: 'Room or job',
    fields: [{ k: 'n', l: 'Name', v: getS().clean.rooms[i] }],
    onSave: (v) => { if (!v.n) return false; update((d) => { d.clean.rooms[i] = v.n }) },
    // Removing a row shifts the indexes the log uses, so this week's ticks are cleared.
    onDelete: () => undoable('Removed from the cleaning schedule', (d) => { d.clean.rooms.splice(i, 1); d.clean.log = {} }),
  })
}
function contactForm(id?: string) {
  const c = id ? getS().contacts.find((x) => x.id === id) : undefined
  openForm({
    title: c ? 'Edit contact' : 'New contact',
    fields: [
      { k: 'name', l: 'Name', v: c?.name }, { k: 'role', l: 'Who they are', v: c?.role, ph: 'Plumber, GP, vet…' },
      { k: 'phone', l: 'Phone', t: 'tel', v: c?.phone, half: true }, { k: 'email', l: 'Email', t: 'email', v: c?.email, half: true },
      { k: 'notes', l: 'Notes', t: 'textarea', rows: 2, v: c?.notes },
    ],
    onSave: (v) => { if (!v.name) return false; update((d) => { const x = id && d.contacts.find((z) => z.id === id); if (x) Object.assign(x, v); else d.contacts.push({ id: uid(), ...v } as never) }) },
    onDelete: id ? () => undoable('Contact deleted', (d) => { d.contacts = d.contacts.filter((z) => z.id !== id) }) : undefined,
  })
}
function invForm(id?: string) {
  const c = id ? getS().inventory.find((x) => x.id === id) : undefined
  openForm({
    title: c ? 'Edit item' : 'New item',
    fields: [
      { k: 'item', l: 'Item', v: c?.item }, { k: 'loc', l: 'Where it lives', v: c?.loc, half: true }, { k: 'qty', l: 'Quantity', v: c?.qty, half: true },
      { k: 'bought', l: 'Bought', t: 'date', v: c?.bought, half: true }, { k: 'warranty', l: 'Warranty until', t: 'date', v: c?.warranty, half: true },
      { k: 'notes', l: 'Notes (model, serial, value)', t: 'textarea', rows: 2, v: c?.notes },
    ],
    onSave: (v) => { if (!v.item) return false; update((d) => { const x = id && d.inventory.find((z) => z.id === id); if (x) Object.assign(x, v); else d.inventory.push({ id: uid(), ...v } as never) }) },
    onDelete: id ? () => undoable('Item deleted', (d) => { d.inventory = d.inventory.filter((z) => z.id !== id) }) : undefined,
  })
}

function Cleaning() {
  const s = useS(), t = today(), ws = weekStart(s, t), lg = s.clean.log[ws] || {}, wk = range(ws, 7)
  const tick = (k: string) => update((d) => {
    const l = (d.clean.log[ws] = d.clean.log[ws] || {})
    if (l[k]) delete l[k]; else l[k] = 1
    Object.keys(d.clean.log).forEach((key) => { if (key < addD(ws, -56)) delete d.clean.log[key] })
  })
  return (
    <Card>
      <CardHeader title="Cleaning schedule" action={<span className="text-[12.5px] text-mute">Tap a square</span>} />
      <div className="overflow-x-auto">
        <div className="grid min-w-[290px] items-center gap-1 sm:gap-1.5" style={{ gridTemplateColumns: 'minmax(70px,1.4fr) repeat(7, minmax(26px,1fr))' }}>
          <span />
          {wk.map((d) => <div key={d} className={cn('text-center text-[11px] leading-tight text-mute', d === t && 'font-bold text-accent')}>{DOWN[dow(d)].slice(0, 2)}<br />{+d.slice(8)}</div>)}
          {s.clean.rooms.map((r, ri) => (
            <React.Fragment key={ri}>
              <button className="truncate text-left text-[13px]" onClick={() => roomForm(ri)}>{r}</button>
              {wk.map((d) => {
                const k = ri + '|' + dow(d), on = !!lg[k]
                return <button key={d} aria-label={`${r} ${DOWN[dow(d)]}`} aria-pressed={on} onClick={() => tick(k)}
                  className={cn('mx-auto size-6.5 sm:size-7 rounded-lg border', on ? 'border-accent bg-accent' : 'border-line bg-soft', d === t && 'ring-2 ring-accent/40')} />
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
      <InlineAdd placeholder="Add a room or job" onAdd={(v) => update((d) => { d.clean.rooms.push(v) })} />
      <p className="mb-0 text-[12.5px] text-mute">Starts fresh each week. Tap a room's name to rename or remove it.</p>
    </Card>
  )
}

function ChoreAdd() {
  const [f, setF] = React.useState<Freq>('weekly')
  return (
    <InlineAdd placeholder="Add a home job" onAdd={(name) => update((d) => { d.chores.push({ id: uid(), name, freq: f, log: {} } as Chore) })}>
      <select aria-label="How often" className="field w-auto py-1.5 text-[13px]" value={f} onChange={(e) => setF(e.target.value as Freq)}>
        {FREQS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </InlineAdd>
  )
}

function Jobs() {
  const s = useS(), t = today()
  return (
    <>
      <div className="mb-3 grid gap-3 min-[760px]:grid-cols-[1.6fr_1fr]">
        <Cleaning />
        <Card>
          <CardHeader title="Grocery list" action={<Button variant="link" className="text-[12.5px]" onClick={() => { useFood.setState({ tab: 'grocery' }); go('food') }}>Open</Button>} />
          <div className="text-[13.5px] text-mute">{s.grocery.filter((g) => !g.done).length} items still to buy.</div>
          <InlineAdd placeholder="Add to the list" onAdd={(v) => update((d) => { d.grocery.push({ id: uid(), name: v, done: false }) })} />
        </Card>
      </div>
      <Card>
        <CardHeader title="Home jobs" />
        <p className="mt-0 text-[12.5px] text-mute">Repeating jobs clear themselves when the day, week, fortnight, month or quarter turns over.</p>
        {FREQS.map(([f, l]) => {
          const list = s.chores.filter((c) => c.freq === f)
          if (!list.length) return null
          const dn = list.filter((c) => (c.log || {})[periodKey(s, f, t)]).length
          return (
            <div key={f}>
              <div className="lbl mt-3 mb-0.5 text-mute">{l} · {dn}/{list.length} done {PERIOD_WORD[f]}</div>
              <div className="rows">
                {list.map((c) => {
                  const on = !!(c.log || {})[periodKey(s, f, t)]
                  return (
                    <div key={c.id} className={cn('row', on && 'done')}>
                      <Check on={on} label={c.name} onClick={() => update((d) => { const x = d.chores.find((z) => z.id === c.id)!; x.log = x.log || {}; const k = periodKey(d, x.freq, t); if (x.log[k]) delete x.log[k]; else x.log[k] = 1 })} />
                      <div className="tt flex-1">{c.name}</div>
                      <button className="p-1 text-mute" aria-label={'Edit ' + c.name} onClick={() => choreForm(c.id)}><Pencil className="size-3.5" /></button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {!s.chores.length && <Empty>Add the jobs that keep the house running – bins, sheets, gutters, smoke alarms.</Empty>}
        <ChoreAdd />
      </Card>
    </>
  )
}

const dfmt = (d: string) => fmt(d, { day: 'numeric', month: 'short', year: 'numeric' })

export function HomePage() {
  const s = useS()
  const tab = useHome((h) => h.tab)
  return (
    <div>
      <PageHead crumb={'Live · ' + fmt(today(), { weekday: 'long', day: 'numeric', month: 'long' })} title="Home" />
      <Segmented value={tab} onChange={(v) => useHome.setState({ tab: v })} options={[['jobs', 'Jobs & cleaning'], ['contacts', 'Contacts'], ['inv', 'Inventory']]} />
      {tab === 'jobs' && <Jobs />}
      {tab === 'contacts' && (
        <Card>
          <CardHeader title="Important contacts" action={<Button variant="link" className="text-[12.5px]" onClick={() => contactForm()}>+ Contact</Button>} />
          <div className="rows">
            {s.contacts.map((c) => (
              <div key={c.id} className="row">
                <button className="flex-1 text-left" onClick={() => contactForm(c.id)}>
                  <div className="tt">{c.name}{c.role && <span className="text-[12.5px] text-mute"> · {c.role}</span>}</div>
                  {c.notes && <div className="text-[12.5px] text-mute">{c.notes}</div>}
                </button>
                {c.phone && <a className="text-[13px] text-accent underline" href={'tel:' + c.phone.replace(/\s/g, '')}>{c.phone}</a>}
                {c.email && <a className="text-[13px] text-accent underline max-[520px]:hidden" href={'mailto:' + c.email}>Email</a>}
              </div>
            ))}
          </div>
          {!s.contacts.length && <Empty>Plumber, vet, GP, landlord, school…</Empty>}
        </Card>
      )}
      {tab === 'inv' && (
        <Card>
          <CardHeader title="Household inventory" action={<Button variant="link" className="text-[12.5px]" onClick={() => invForm()}>+ Item</Button>} />
          <div className="rows">
            {s.inventory.map((c) => {
              const expired = c.warranty && c.warranty < today()
              return (
                <button key={c.id} className="row w-full text-left" onClick={() => invForm(c.id)}>
                  <div className="flex-1">
                    <div className="tt">{c.item}{c.qty && <span className="text-[12.5px] text-mute"> ×{c.qty}</span>}</div>
                    <div className="text-[12.5px] text-mute">
                      {[c.loc, c.bought && 'Bought ' + dfmt(c.bought)].filter(Boolean).join(' · ')}
                      {c.warranty && <span className={expired ? 'text-danger' : ''}>{c.loc || c.bought ? ' · ' : ''}{expired ? 'Warranty ended ' : 'Warranty to '}{dfmt(c.warranty)}</span>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          {!s.inventory.length && <Empty>Appliances, valuables, spares and warranties.</Empty>}
        </Card>
      )}
    </div>
  )
}
