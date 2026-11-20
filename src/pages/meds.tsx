import * as React from 'react'
import { Pencil, Pill, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TimePicker } from '@/components/ui/time-picker'
import { openForm } from '@/components/sheet'
import { getS, undoable, update, useS } from '@/lib/store'
import { addD, dow, DOWN, fmt, mins, minsLabel, nowMins, pad, range, t12, today, type DateStr } from '@/lib/date'
import type { DoseLog, Med, State } from '@/lib/types'
import { cn, uid } from '@/lib/utils'

/* ---------- Helpers ---------- */

const SLOTS: [string, string][] = [['08:00', 'Morning'], ['12:00', 'Midday'], ['18:00', 'Evening'], ['21:00', 'Bedtime']]
/** "08:00" → "Morning · 8am"; other times just the time. */
export const slotLabel = (t: string) => { const s = SLOTS.find((x) => x[0] === t); return s ? `${s[1]} · ${t12(t)}` : t12(t) }
const GRACE = 60 // minutes after a dose's time before it counts as "not taken yet"

const dueOn = (m: Med, d: DateStr) => !m.paused && !m.asNeeded && (m.days?.length ? m.days.includes(dow(d)) : true)
const per = (m: Med) => Math.max(1, m.perDose || 1)
const tracking = (m: Med) => m.count !== undefined && m.count !== '' && !isNaN(+m.count)
/** Roughly how many days the supply lasts at the planned rate (null when unknown, e.g. as-needed). */
export function daysLeft(m: Med) {
  if (!tracking(m)) return null
  const perWeek = per(m) * m.times.length * (m.days?.length || 7)
  if (!perWeek) return null
  return Math.floor(+m.count! / (perWeek / 7))
}
const low = (m: Med) => { if (!tracking(m)) return false; const d = daysLeft(m); return d !== null ? d <= 7 : +m.count! <= 3 }

function changeCount(d: State, id: string, by: number) {
  const m = d.meds.find((x) => x.id === id)
  if (m && tracking(m)) m.count = Math.max(0, +m.count! + by)
}

/** Tick a scheduled dose: taken now (uses one dose from the supply), or untick it. */
function toggleTaken(m: Med, d: DateStr, time: string) {
  const k = m.id + '|' + time
  update((s) => {
    const log = (s.medLog[d] = s.medLog[d] || {})
    const cur = log[k]
    if (cur?.s === 'taken') { delete log[k]; changeCount(s, m.id, per(m)) }
    else {
      log[k] = { s: 'taken', at: d === today() ? nowMins() : mins(time), note: cur?.note }
      changeCount(s, m.id, -per(m))
    }
  })
  const after = getS().meds.find((x) => x.id === m.id)
  if (after && getS().medLog[d]?.[k]?.s === 'taken' && low(after)) toast(`${after.name} is running low – ${after.count} left`)
}
function skip(m: Med, d: DateStr, time: string) {
  const k = m.id + '|' + time
  update((s) => {
    const log = (s.medLog[d] = s.medLog[d] || {})
    if (log[k]?.s === 'taken') changeCount(s, m.id, per(m))
    if (log[k]?.s === 'skipped') delete log[k]; else log[k] = { s: 'skipped', at: nowMins(), note: log[k]?.note }
  })
}
function tookOne(m: Med) {
  const d = today(), k = m.id + '|n' + Date.now().toString(36)
  update((s) => { (s.medLog[d] = s.medLog[d] || {})[k] = { s: 'taken', at: nowMins() }; changeCount(s, m.id, -per(m)) })
  toast(`Logged ${m.name} at ${minsLabel(nowMins())}`, {
    action: { label: 'Undo', onClick: () => update((s) => { if (s.medLog[d]?.[k]) { delete s.medLog[d][k]; changeCount(s, m.id, per(m)) } }) },
  })
}
/** When an as-needed med was last taken, looking back a fortnight. */
function lastTaken(s: State, m: Med): { d: DateStr; at: number } | null {
  for (let i = 0; i < 14; i++) {
    const d = addD(today(), -i)
    const hits = Object.entries(s.medLog[d] || {}).filter(([k, v]) => k.startsWith(m.id + '|') && v.s === 'taken').map(([, v]) => v.at)
    if (hits.length) return { d, at: Math.max(...hits) }
  }
  return null
}
const ago = (d: DateStr, at: number) => d === today() ? 'today ' + minsLabel(at) : d === addD(today(), -1) ? 'yesterday ' + minsLabel(at) : fmt(d, { weekday: 'short', day: 'numeric' }) + ' ' + minsLabel(at)

function noteForm(m: Med, d: DateStr, key: string) {
  const v = getS().medLog[d]?.[key]
  openForm({
    title: m.name + ' – note',
    fields: [{ k: 'note', l: 'How did it go? (side effects, how you felt…)', t: 'textarea', rows: 3, v: v?.note }],
    onSave: (x) => update((s) => { const e = s.medLog[d]?.[key]; if (e) e.note = String(x.note || '').trim() || undefined }),
  })
}

/* ---------- Add / edit ---------- */

function TimesEditor({ times, onChange }: { times: string[]; onChange: (t: string[]) => void }) {
  const [adding, setAdding] = React.useState('')
  const sorted = [...times].sort()
  const add = (t: string) => { if (t && !times.includes(t)) onChange([...times, t].sort()); setAdding('') }
  return (
    <div className="mb-3">
      <span className="mb-1.5 block text-[12.5px] font-medium text-mute">When do you take it?</span>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {SLOTS.map(([t, l]) => {
          const on = times.includes(t)
          return <button type="button" key={t} aria-pressed={on} onClick={() => onChange(on ? times.filter((x) => x !== t) : [...times, t].sort())}
            className={cn('rounded-full border px-3 py-1 text-[13px]', on ? 'border-accent bg-accent text-on-accent' : 'border-line bg-card')}>{l} · {t12(t)}</button>
        })}
      </div>
      {sorted.filter((t) => !SLOTS.some((s) => s[0] === t)).map((t) => (
        <span key={t} className="mr-1.5 mb-1.5 inline-flex items-center gap-1 rounded-full border border-accent bg-accent px-2.5 py-0.5 text-[13px] text-on-accent">
          {t12(t)}<button type="button" aria-label={'Remove ' + t12(t)} onClick={() => onChange(times.filter((x) => x !== t))}><X className="size-3.5" /></button>
        </span>
      ))}
      <div className="flex items-center gap-1.5">
        <div className="flex-1"><TimePicker value={adding} onChange={(t) => (t ? add(t) : setAdding(''))} placeholder="Add another time" /></div>
      </div>
    </div>
  )
}

export function medForm(id?: string) {
  const m = id ? getS().meds.find((x) => x.id === id) : undefined
  openForm({
    title: m ? 'Edit medication' : 'Add a medication',
    fields: [
      { k: 'name', l: 'Name', v: m?.name, ph: 'e.g. Vitamin D, Ritalin, Ventolin' },
      { k: 'dose', l: 'Dose', v: m?.dose, ph: 'e.g. 10 mg, 1 tablet', half: true },
      { k: 'type', l: 'Taken', t: 'select', o: [['sched', 'On a schedule'], ['prn', 'As needed']], v: m?.asNeeded ? 'prn' : 'sched', half: true },
      { k: 'days', l: 'Which days (scheduled only)', t: 'days', v: m?.days?.length ? m.days : [0, 1, 2, 3, 4, 5, 6] },
      { k: 'count', l: 'How many you have (optional)', t: 'number', min: 0, v: m?.count, half: true, ph: 'e.g. 30' },
      { k: 'perDose', l: 'How many per dose', t: 'number', min: 1, max: 20, v: m?.perDose || 1, half: true },
      { k: 'notes', l: 'Notes', t: 'textarea', rows: 2, v: m?.notes, ph: 'With food, what it is for, who prescribed it…' },
    ],
    extra: (v, set) => (v.type ?? (m?.asNeeded ? 'prn' : 'sched')) === 'sched'
      ? <TimesEditor times={v.times ?? m?.times ?? ['08:00']} onChange={(t) => set('times', t)} />
      : <p className="mt-0 text-[13px] text-mute">Tap <b>Took one</b> on Today whenever you take it, and it shows when you last had it.</p>,
    onSave: (v) => {
      if (!v.name) return false
      const asNeeded = v.type === 'prn'
      const times = asNeeded ? [] : ((v.times ?? m?.times ?? ['08:00']) as string[])
      if (!asNeeded && !times.length) { toast('Pick at least one time'); return false }
      const o: Partial<Med> = {
        name: v.name, dose: v.dose, asNeeded, days: v.days, times, notes: v.notes,
        count: v.count === '' || v.count === undefined ? '' : +v.count, perDose: Math.max(1, +v.perDose || 1),
      }
      update((d) => { const x = id && d.meds.find((z) => z.id === id); if (x) Object.assign(x, o); else d.meds.push({ id: uid(), since: today(), ...o } as Med) })
    },
    onDelete: id ? () => undoable('Medication removed (its history stays)', (d) => { d.meds = d.meds.filter((z) => z.id !== id) }) : undefined,
  })
}

function refill(m: Med) {
  openForm({
    title: 'Refill ' + m.name,
    fields: [{ k: 'n', l: 'How many did you get?', t: 'number', min: 1, v: '' }],
    onSave: (v) => { const n = +v.n; if (!n) return false; update((d) => { const x = d.meds.find((z) => z.id === m.id); if (x) x.count = (tracking(x) ? +x.count! : 0) + n }); toast(`${m.name}: added ${n}`) },
  })
}

/* ---------- Today card ---------- */

export function MedsToday({ d }: { d: DateStr }) {
  const s = useS()
  const isT = d === today(), nm = nowMins()
  const doses = s.meds.filter((m) => dueOn(m, d)).flatMap((m) => m.times.map((t) => ({ m, t }))).sort((a, b) => a.t.localeCompare(b.t))
  const prn = s.meds.filter((m) => m.asNeeded && !m.paused)
  const lows = s.meds.filter((m) => !m.paused && low(m))
  const log = s.medLog[d] || {}
  const done = doses.filter(({ m, t }) => log[m.id + '|' + t]).length
  return (
    <Card>
      <CardHeader title="Medications" action={
        <span className="flex items-center gap-3">
          {!!doses.length && <span className="text-[12.5px] text-mute">{done}/{doses.length}</span>}
          <Button variant="link" className="text-[12.5px]" onClick={() => medForm()}>+ Add</Button>
        </span>
      } />
      {!s.meds.length && <Empty>Track medications, vitamins or supplements – tick them off, see when you last took something, and get a heads-up before you run out.</Empty>}
      <div className="rows">
        {doses.map(({ m, t }) => {
          const k = m.id + '|' + t, e: DoseLog | undefined = log[k]
          const late = isT && !e && nm > mins(t) + GRACE
          return (
            <div key={k} className={cn('row', e?.s === 'taken' && 'done', e?.s === 'skipped' && 'opacity-60')}>
              <button aria-label={(e?.s === 'taken' ? 'Untick ' : 'Took ') + m.name + ' ' + t12(t)} aria-pressed={e?.s === 'taken'} onClick={() => toggleTaken(m, d, t)}
                className={cn('grid size-6 flex-none place-items-center rounded-full border-[1.5px]', e?.s === 'taken' ? 'border-accent bg-accent text-on-accent' : 'border-line')}>
                {e?.s === 'taken' ? '✓' : <Pill className="size-3.5 text-mute" />}
              </button>
              <div className="min-w-0 flex-1">
                <div className="tt truncate">{m.name}{m.dose && <span className="text-[12.5px] text-mute"> · {m.dose}</span>}</div>
                <div className={cn('text-[12px]', late ? 'font-semibold text-warn' : 'text-mute')}>
                  {slotLabel(t)}
                  {e?.s === 'taken' && ` · taken ${minsLabel(e.at)}`}{e?.s === 'skipped' && ' · skipped'}{late && ' · not taken yet'}
                  {e?.note && <span className="italic"> · “{e.note}”</span>}
                </div>
              </div>
              {e ? <button className="p-1 text-mute" aria-label="Add a note" onClick={() => noteForm(m, d, k)}><Pencil className="size-3.5" /></button>
                : <Button size="sm" variant="ghost" className="text-[12px] text-mute" onClick={() => skip(m, d, t)}>Skip</Button>}
            </div>
          )
        })}
        {isT && prn.map((m) => {
          const last = lastTaken(s, m)
          return (
            <div key={m.id} className="row">
              <span className="grid size-6 flex-none place-items-center rounded-full border-[1.5px] border-dashed border-line"><Pill className="size-3.5 text-mute" /></span>
              <div className="min-w-0 flex-1">
                <div className="tt truncate">{m.name}{m.dose && <span className="text-[12.5px] text-mute"> · {m.dose}</span>}</div>
                <div className="text-[12px] text-mute">As needed · {last ? 'last ' + ago(last.d, last.at) : 'not taken lately'}</div>
              </div>
              <Button size="sm" onClick={() => tookOne(m)}><Plus className="size-3.5" />Took one</Button>
            </div>
          )
        })}
      </div>
      {!!lows.length && (
        <div className="mt-2.5 rounded-xl bg-[color-mix(in_srgb,var(--warn)_14%,transparent)] px-3 py-2 text-[13px]">
          {lows.map((m) => { const dl = daysLeft(m); return <div key={m.id}><b>{m.name}</b> is running low: {m.count} left{dl !== null ? ` (about ${dl} day${dl === 1 ? '' : 's'})` : ''}. <button className="text-accent underline" onClick={() => refill(m)}>Refilled</button></div> })}
        </div>
      )}
    </Card>
  )
}

/* ---------- Wellness section: list + monthly history ---------- */

function cellState(s: State, m: Med, d: DateStr) {
  if (d > today() || (m.since && d < m.since) || !dueOn(m, d)) return 'none'
  const log = s.medLog[d] || {}
  const es = m.times.map((t) => log[m.id + '|' + t])
  const taken = es.filter((e) => e?.s === 'taken').length, skipped = es.filter((e) => e?.s === 'skipped').length
  if (taken === m.times.length) return 'all'
  if (d === today()) return taken ? 'some' : 'open'
  if (taken) return 'some'
  if (skipped) return 'skipped'
  return 'missed'
}
const CELL: Record<string, string> = {
  all: 'bg-accent border-accent', some: 'bg-accent/40 border-accent', skipped: 'bg-soft border-line [background-image:repeating-linear-gradient(45deg,var(--line)_0_2px,transparent_2px_5px)]',
  missed: 'border-warn border-[1.5px] bg-transparent', open: 'border-line bg-soft', none: 'border-transparent bg-transparent',
}

export function MedsSection() {
  const s = useS()
  const [ref, setRef] = React.useState(() => today().slice(0, 7))
  const [y, mo] = ref.split('-').map(Number)
  const n = new Date(y, mo, 0).getDate()
  const days = range(ref + '-01', n)
  const sched = s.meds.filter((m) => !m.asNeeded)
  const step = (k: number) => { const dt = new Date(y, mo - 1 + k, 1); setRef(dt.getFullYear() + '-' + pad(dt.getMonth() + 1)) }
  const notes = Object.entries(s.medLog).filter(([d]) => d.startsWith(ref)).flatMap(([d, l]) => Object.entries(l).filter(([, v]) => v.note).map(([k, v]) => ({ d, k, v })))
    .sort((a, b) => b.d.localeCompare(a.d))
  return (
    <div className="mb-3 grid gap-3 min-[900px]:grid-cols-[1fr_1.4fr]">
      <Card>
        <CardHeader title="Medications" action={<Button variant="link" className="text-[12.5px]" onClick={() => medForm()}>+ Add</Button>} />
        <div className="rows">
          {s.meds.map((m) => {
            const dl = daysLeft(m)
            return (
              <div key={m.id} className={cn('row', m.paused && 'opacity-55')}>
                <button className="min-w-0 flex-1 text-left" onClick={() => medForm(m.id)}>
                  <div className="tt">{m.name}{m.dose && <span className="text-[12.5px] text-mute"> · {m.dose}</span>}</div>
                  <div className="text-[12px] text-mute">
                    {m.asNeeded ? 'As needed' : m.times.map(t12).join(', ') + (m.days?.length && m.days.length < 7 ? ' · ' + m.days.map((i) => DOWN[i]).join(' ') : ' · every day')}
                    {tracking(m) && <span className={low(m) ? 'font-semibold text-warn' : ''}> · {m.count} left{dl !== null ? ` (~${dl} days)` : ''}</span>}
                  </div>
                </button>
                {tracking(m) && <Button size="sm" onClick={() => refill(m)}>Refill</Button>}
                <Button size="sm" variant="ghost" className="text-[12px]" onClick={() => update((d) => { const x = d.meds.find((z) => z.id === m.id); if (x) x.paused = !x.paused })}>{m.paused ? 'Resume' : 'Pause'}</Button>
              </div>
            )
          })}
        </div>
        {!s.meds.length && <Empty>Add the medications, vitamins or supplements you take.</Empty>}
        <p className="mb-0 text-[12px] text-mute">Pause something you've stopped for now – it leaves Today but keeps its history.</p>
      </Card>
      <Card>
        <CardHeader title="History" action={
          <span className="flex items-center gap-1">
            <Button size="icon" className="size-8" aria-label="Previous month" onClick={() => step(-1)}>‹</Button>
            <span className="min-w-[88px] text-center text-[13px]">{fmt(ref + '-01', { month: 'short', year: 'numeric' })}</span>
            <Button size="icon" className="size-8" aria-label="Next month" onClick={() => step(1)}>›</Button>
          </span>
        } />
        {sched.length ? (
          <div className="overflow-x-auto">
            <div className="grid min-w-[560px] items-center gap-[3px]" style={{ gridTemplateColumns: `minmax(80px,1.2fr) repeat(${n}, minmax(12px,1fr))` }}>
              <span />
              {days.map((d) => <span key={d} className={cn('text-center font-mono text-[9px] text-mute', d === today() && 'font-bold text-accent')}>{+d.slice(8)}</span>)}
              {sched.map((m) => [
                <span key={m.id} className="truncate text-[12.5px]">{m.name}</span>,
                ...days.map((d) => { const c = cellState(s, m, d); return <span key={m.id + d} title={`${m.name} · ${fmt(d)} · ${c}`} className={cn('mx-auto aspect-square w-full max-w-4 rounded-[4px] border', CELL[c])} /> }),
              ])}
            </div>
          </div>
        ) : <Empty>Scheduled medications show here day by day.</Empty>}
        <div className="mt-2.5 flex flex-wrap gap-3 text-[11.5px] text-mute">
          {[['all', 'All taken'], ['some', 'Some'], ['skipped', 'Skipped'], ['missed', 'Missed']].map(([k, l]) => <span key={k} className="flex items-center gap-1"><span className={cn('size-3 rounded-[3px] border', CELL[k])} />{l}</span>)}
        </div>
        {!!notes.length && (
          <div className="mt-3 border-t border-line pt-2">
            <div className="lbl mb-1 text-mute">Notes this month</div>
            {notes.slice(0, 8).map(({ d, k, v }) => {
              const m = s.meds.find((x) => x.id === k.split('|')[0])
              return <div key={d + k} className="text-[13px]"><span className="text-mute">{fmt(d, { day: 'numeric', month: 'short' })} · {m?.name || 'Removed'} –</span> {v.note}</div>
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
