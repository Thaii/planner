import * as React from 'react'
import { X } from 'lucide-react'
import { Button } from './ui/button'
import { Input, Select } from './ui/field'
import { Segmented } from './ui/segmented'
import { closeSheet, openSheet } from './sheet'
import { getS, update } from '@/lib/store'
import { DEFAULT_PARTS, fill, PARTS, plannerTitle, STANDARD } from '@/lib/greeting'
import type { DayPart, Settings } from '@/lib/types'
import { cn } from '@/lib/utils'

type Mode = NonNullable<Settings['titleMode']>
const hourLabel = (h: number) => (h % 12 || 12) + (h < 12 ? 'am' : 'pm')
/** Hours each part can start at, kept in order so morning < afternoon < evening. */
const RANGE: Record<DayPart, number[]> = { morning: [3, 4, 5, 6, 7, 8, 9, 10], afternoon: [11, 12, 13, 14], evening: [15, 16, 17, 18, 19, 20, 21] }
const IDEAS: Record<DayPart, string> = { morning: 'e.g. Rise and shine, {name}!', afternoon: 'e.g. Keep it up, {name}.', evening: 'e.g. Time to wind down, {name}.' }

function PartEditor({ part, label, list, from, until, name, onList, onFrom }: {
  part: DayPart; label: string; list: string[]; from: number; until: number; name: string
  onList: (l: string[]) => void; onFrom: (h: number) => void
}) {
  const [draft, setDraft] = React.useState('')
  const ref = React.useRef<HTMLInputElement>(null)
  const add = () => { const t = draft.trim(); if (t) { onList([...list, t]); setDraft('') } }
  /** Drop {name} in where the cursor is (or at the end), with sensible spacing. */
  const insertName = () => {
    const el = ref.current, at = el?.selectionStart ?? draft.length, end = el?.selectionEnd ?? at
    const before = draft.slice(0, at), after = draft.slice(end)
    const tok = (before && !/[\s(]$/.test(before) ? ' ' : '') + '{name}' + (after && !/^[\s,.!?)]/.test(after) ? ' ' : '')
    const next = before + tok + after
    setDraft(next)
    requestAnimationFrame(() => { if (!el) return; const p = (before + tok).length; el.focus(); el.setSelectionRange(p, p) })
  }
  return (
    <div className="border-t border-line pt-3 pb-1">
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <b className="font-serif text-[17px] font-normal">{label}</b>
        <span className="flex items-center gap-1 text-[12.5px] text-mute">
          from
          <Select aria-label={label + ' starts at'} className="w-auto px-2 py-1 text-[12.5px]" value={from} onChange={(e) => onFrom(+e.target.value)}>
            {RANGE[part].map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </Select>
          until {hourLabel(until)}
        </span>
      </div>
      {list.length ? (
        <div className="flex flex-col gap-1">
          {list.map((g, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-soft px-2.5 py-1.5 text-[14px]">
              <span className="flex-1">{fill(g, name) || g}</span>
              <button type="button" className="p-0.5 text-mute" aria-label={'Remove ' + g} onClick={() => onList(list.filter((_, j) => j !== i))}><X className="size-4" /></button>
            </div>
          ))}
        </div>
      ) : <div className="text-[13px] text-mute">Using the standard: <i>{fill(STANDARD[part], name)}</i></div>}
      <div className="mt-1.5 flex gap-1.5">
        <Input ref={ref} value={draft} placeholder={IDEAS[part]} aria-label={'Add a ' + label.toLowerCase() + ' greeting'} className="py-1.5 text-[14px]"
          onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} />
        <Button type="button" size="sm" className="whitespace-nowrap" onClick={insertName} aria-label="Insert your name">+ Name</Button>
        <Button type="button" size="sm" variant="primary" onClick={add} disabled={!draft.trim()}>Add</Button>
      </div>
      {draft.includes('{') && <div className="mt-1 text-[12px] text-mute">Shows as: <b className="font-normal text-ink">{fill(draft, name) || '…'}</b></div>}
      {list.length > 1 && <div className="mt-1 text-[12px] text-mute">One of these {list.length} is picked at random each time you open the planner.</div>}
    </div>
  )
}

function PersonaliseSheet() {
  const st = getS().settings
  const [name, setName] = React.useState(st.name || '')
  const [mode, setMode] = React.useState<Mode>(st.titleMode || (st.nameInTitle === false ? 'life' : 'name'))
  const [custom, setCustom] = React.useState(st.customTitle || '')
  const [greets, setGreets] = React.useState<Record<DayPart, string[]>>(st.greetings || { morning: [], afternoon: [], evening: [] })
  const [parts, setParts] = React.useState<Record<DayPart, number>>({ ...DEFAULT_PARTS, ...(st.dayParts || {}) })
  const n = name.trim()
  const title = plannerTitle({ name: n, nameInTitle: true, titleMode: mode, customTitle: custom })
  const until: Record<DayPart, number> = { morning: parts.afternoon, afternoon: parts.evening, evening: parts.morning }
  const save = () => {
    update((d) => {
      Object.assign(d.settings, {
        name: n, titleMode: mode, customTitle: custom.trim(), nameInTitle: mode === 'name',
        greetings: greets, dayParts: parts, greeting: '', nameAsked: true,
      })
    })
    closeSheet()
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); save() }}>
      <h3 className="mb-3 text-[21px]">Your name, title and greetings</h3>

      <label className="mb-3 block"><span className="mb-1 block text-[12.5px] font-medium text-mute">What should we call you? (optional)</span>
        <Input value={name} placeholder="Your first name" onChange={(e) => setName(e.target.value)} /></label>

      <span className="mb-1 block text-[12.5px] font-medium text-mute">Planner title</span>
      <Segmented value={mode} onChange={(v) => setMode(v as Mode)} options={[['name', n ? `${n}'s Planner` : "Your name's"], ['life', 'Life Planner'], ['custom', 'Your own']]} />
      {mode === 'custom' && <Input value={custom} placeholder="e.g. Sarah's Planner, The Daily Plan, Brain HQ" aria-label="Your own title" maxLength={32} className="-mt-1.5 mb-2" onChange={(e) => setCustom(e.target.value)} />}
      {mode === 'name' && !n && <p className="-mt-1.5 mb-2 text-[12.5px] text-mute">Add your name above to use it – until then it says Life Planner.</p>}
      <div className="mb-4 text-[13px] text-mute">Shows as <b className="font-serif text-[18px] font-normal text-ink">{title[0]} <span className="text-accent">{title[1]}</span></b></div>

      <span className="block text-[12.5px] font-medium text-mute">Greetings</span>
      <p className="mt-0.5 mb-2 text-[12.5px] text-mute">Add as many as you like for each part of the day and one is picked at random. Tap <b>+ Name</b> where you want your name to go. Leave a part empty for the standard greeting.</p>
      {PARTS.map(([p, l]) => (
        <PartEditor key={p} part={p} label={l} list={greets[p]} from={parts[p]} until={until[p]} name={n}
          onList={(list) => setGreets((g) => ({ ...g, [p]: list }))} onFrom={(h) => setParts((x) => ({ ...x, [p]: h }))} />
      ))}
      <button type="button" className={cn('mt-1 text-[12.5px] text-mute underline', JSON.stringify(parts) === JSON.stringify(DEFAULT_PARTS) && 'invisible')}
        onClick={() => setParts({ ...DEFAULT_PARTS })}>Back to the standard times (5am, 12pm, 5pm)</button>

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" onClick={closeSheet}>Cancel</Button>
        <Button type="submit" variant="primary">Save</Button>
      </div>
    </form>
  )
}

/** Name, title and greeting settings. Opened from the greeting's pencil and Customise → Your pages. */
export function personaliseForm() {
  openSheet(<PersonaliseSheet />, 'Your name, title and greetings')
}
