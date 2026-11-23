import { TimePicker } from './ui/time-picker'
import * as React from 'react'
import { create } from 'zustand'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { Button } from './ui/button'
import { Input, Select, Textarea } from './ui/field'
import { getS } from '@/lib/store'
import { DOWN, weekOrder } from '@/lib/date'
import { wsDay } from '@/lib/logic'
import { cn } from '@/lib/utils'

/* ---------- one app-wide bottom drawer (Vaul) ---------- */
interface SheetState { node: React.ReactNode | null; title: string; key: number }
const useSheet = create<SheetState>(() => ({ node: null, title: '', key: 0 }))
export const openSheet = (node: React.ReactNode, title = 'Dialog') => useSheet.setState({ node, title, key: Date.now() })
export const closeSheet = () => useSheet.setState({ node: null })

export function SheetHost() {
  const { node, title, key } = useSheet()
  return (
    <Dialog.Root open={!!node} onOpenChange={(o) => !o && closeSheet()}>
      <Dialog.Portal>
        <Dialog.Overlay className="vaul-ov pop-ov" />
        {/* Centred card, like the welcome. Class name kept from the old bottom sheet so styles and tests still match. */}
        <div className="pop-wrap">
          <Dialog.Content className="vaul-ct pop-ct" aria-describedby={undefined}
            // Taps on a notification (Undo, Refresh) shouldn't count as "tapping outside" and close this.
            onPointerDownOutside={(e) => { if ((e.target as Element | null)?.closest?.('[data-sonner-toaster]')) e.preventDefault() }}
            onInteractOutside={(e) => { if ((e.target as Element | null)?.closest?.('[data-sonner-toaster]')) e.preventDefault() }}>
            <Dialog.Title className="sr-only">{title}</Dialog.Title>
            <Dialog.Close className="absolute top-3.5 right-3.5 z-10 grid size-8 place-items-center rounded-full text-mute hover:bg-soft" aria-label="Close"><X className="size-4" /></Dialog.Close>
            <div key={key} className="overflow-auto px-6 pt-6 pb-6">{node}</div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/* ---------- generic form ---------- */
export type FieldType = 'text' | 'textarea' | 'date' | 'time' | 'number' | 'select' | 'label' | 'days' | 'color' | 'tel' | 'email'
type Values = Record<string, any>
export interface Field {
  k: string; l: string; t?: FieldType; v?: unknown; ph?: string; half?: boolean; rows?: number
  o?: [string | number, string][]; min?: number; max?: number; step?: string; list?: string[]
  /** For time fields: the earlier time this one follows (e.g. an end time after 'time'). */
  after?: string
  /** Extra help shown under the field, e.g. prompts that fill it in. */
  help?: (v: Values, set: (k: string, val: unknown) => void) => React.ReactNode
}
export interface FormSpec {
  title: string; fields: Field[]
  /** Return false to keep the drawer open (e.g. validation failed). */
  onSave: (v: Values) => void | false
  onDelete?: () => void
  extra?: (v: Values, set: (k: string, val: unknown) => void) => React.ReactNode
}

function FormBody({ spec }: { spec: FormSpec }) {
  const [vals, setVals] = React.useState<Values>(() => Object.fromEntries(spec.fields.map((f) => [f.k, f.v ?? (f.t === 'days' ? [] : '')])))
  const set = (k: string, val: unknown) => setVals((p) => ({ ...p, [k]: val }))
  const s = getS()
  const firstRef = React.useRef<HTMLInputElement>(null)
  React.useEffect(() => { if (!('ontouchstart' in window)) setTimeout(() => firstRef.current?.focus(), 250) }, [])
  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      // Start from everything (including values set by `extra`), then tidy the declared fields.
      const out: Values = { ...vals }
      spec.fields.forEach((f) => { const v = vals[f.k]; out[f.k] = f.t === 'number' ? (v === '' ? '' : +v) : typeof v === 'string' ? v.trim() : v })
      if (spec.onSave(out) !== false) closeSheet()
    }}>
      <h3 className="mb-3 text-[21px]">{spec.title}</h3>
      <div className="flex flex-wrap gap-2.5">
        {spec.fields.map((f, i) => {
          const id = 'f_' + f.k, v = vals[f.k]
          let inp: React.ReactNode
          if (f.t === 'textarea') inp = <Textarea id={id} rows={f.rows || 4} placeholder={f.ph} value={v} onChange={(e) => set(f.k, e.target.value)} />
          else if (f.t === 'time') inp = <TimePicker id={id} value={v || ''} onChange={(x) => set(f.k, x)} after={f.after ? vals[f.after] : undefined} />
          else if (f.t === 'select') inp = <Select id={id} value={String(v)} onChange={(e) => set(f.k, e.target.value)}>{f.o!.map(([a, b]) => <option key={a} value={a}>{b}</option>)}</Select>
          else if (f.t === 'label') inp = <Select id={id} value={v || ''} onChange={(e) => set(f.k, e.target.value)}><option value="">No label</option>{s.settings.labels.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</Select>
          else if (f.t === 'days') inp = (
            <div id={id} className="flex flex-wrap gap-1.5">
              {weekOrder(wsDay(s)).map((d) => {
                const on = (v as number[]).includes(d)
                return <button type="button" key={d} onClick={() => set(f.k, on ? (v as number[]).filter((x) => x !== d) : [...v, d])}
                  className={cn('size-9 rounded-full border text-[13px] font-semibold', on ? 'border-accent bg-accent text-on-accent' : 'border-line bg-soft')}>{DOWN[d].slice(0, 2)}</button>
              })}
            </div>)
          else inp = (
            <>
              <Input id={id} ref={i === 0 ? firstRef : undefined} type={f.t || 'text'} placeholder={f.ph} value={v ?? ''} min={f.min} max={f.max} step={f.step}
                list={f.list ? 'dl_' + f.k : undefined} onChange={(e) => set(f.k, e.target.value)} className={f.t === 'color' ? 'h-10 p-1' : ''} />
              {f.list && <datalist id={'dl_' + f.k}>{f.list.map((x) => <option key={x} value={x} />)}</datalist>}
            </>)
          return (
            <div key={f.k} className={f.half ? 'w-[calc(50%-5px)]' : 'w-full'}>
              <label htmlFor={id} className="mb-1 block text-[12.5px] font-medium text-mute">{f.l}</label>
              {inp}
              {f.help?.(vals, set)}
            </div>
          )
        })}
      </div>
      {spec.extra?.(vals, set)}
      <div className="mt-4 flex items-center gap-2">
        {spec.onDelete && <Button type="button" variant="danger" onClick={() => confirmBox('Delete this?', spec.onDelete!)}>Delete</Button>}
        <span className="flex-1" />
        <Button type="button" onClick={closeSheet}>Cancel</Button>
        <Button variant="primary" type="submit">Save</Button>
      </div>
    </form>
  )
}
export const openForm = (spec: FormSpec) => openSheet(<FormBody spec={spec} />, spec.title)

export function confirmBox(message: string, onYes: () => void, label = 'Delete') {
  openSheet(
    <div>
      <h3 className="mb-3 text-[21px]">{message}</h3>
      <div className="mt-4 flex gap-2"><span className="flex-1" />
        <Button onClick={closeSheet}>Cancel</Button>
        <Button variant="primary" className="bg-danger" onClick={() => { closeSheet(); onYes() }}>{label}</Button>
      </div>
    </div>, message)
}
