import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Clock } from 'lucide-react'
import { is24, pad, t12 } from '@/lib/date'
import { cn } from '@/lib/utils'

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const HOURS24 = Array.from({ length: 24 }, (_, i) => i)
const MINS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
const QUICK = ['07:00', '08:00', '09:00', '12:00', '15:00', '17:00', '18:00', '19:00']
const p2 = (n: number) => String(n).padStart(2, '0')
const toHM = (t: string) => { if (!t) return null; const [h, m] = (t || '').split(':').map(Number); return isNaN(h) ? null : { h, m: m || 0 } }
const add = (t: string, mins: number) => { const x = toHM(t)!; const n = (x.h * 60 + x.m + mins) % 1440; return p2(Math.floor(n / 60)) + ':' + p2(n % 60) }
const dur = (m: number) => (m < 60 ? m + ' min' : m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : m / 60 + (m === 60 ? ' hour' : ' hours'))

/** One scrollable column; snaps and scrolls the chosen value into view when opened. */
function Col<T extends string | number>({ items, value, label, show, onPick }: { items: T[]; value: T | null; label: string; show: (v: T) => string; onPick: (v: T) => void }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[aria-selected="true"]')
    if (el && ref.current) ref.current.scrollTop = el.offsetTop - ref.current.clientHeight / 2 + el.clientHeight / 2
  }, [value])
  return (
    <div ref={ref} role="listbox" aria-label={label} className="h-44 flex-1 snap-y overflow-y-auto overscroll-contain rounded-xl bg-soft p-1 [scrollbar-width:none]">
      {items.map((v) => (
        <button type="button" key={String(v)} role="option" aria-selected={v === value} onClick={() => onPick(v)}
          className={cn('block w-full snap-center rounded-lg py-2 text-center font-mono text-[15px]', v === value ? 'bg-accent text-on-accent' : 'hover:bg-card')}>{show(v)}</button>
      ))}
    </div>
  )
}

/**
 * Tap to pick a time: quick suggestions, or scroll hour / minute / am-pm.
 * `after` (an earlier time like the start) turns the suggestions into "+30 min, +1 hour…".
 */
export function TimePicker({ id, value, onChange, after, placeholder = 'Pick a time' }: { id?: string; value: string; onChange: (v: string) => void; after?: string; placeholder?: string }) {
  const [open, setOpen] = React.useState(false)
  const cur = toHM(value)
  const h12 = cur ? cur.h % 12 || 12 : null
  const pm = cur ? cur.h >= 12 : null
  const set = (h: number, m: number, isPm: boolean) => onChange(p2((h % 12) + (isPm ? 12 : 0)) + ':' + p2(m))
  // Typed or older times may not be on a 5-minute step; show them in the list anyway.
  const mins = cur && !MINS.includes(cur.m) ? [...MINS, cur.m].sort((a, b) => a - b) : MINS
  const base = cur || { h: 9, m: 0 }
  const quick: [string, string][] = after && toHM(after)
    ? [15, 30, 45, 60, 90, 120].map((m) => [add(after, m), '+' + dur(m)])
    : QUICK.map((t) => [t, t12(t)])
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" id={id} className={cn('field flex items-center gap-2 text-left', !value && 'text-mute')}>
          <Clock className="size-4 flex-none opacity-60" /><span className="flex-1 truncate">{value ? t12(value) : placeholder}</span>
        </button>
      </Popover.Trigger>
      {/* No portal: the popover must stay inside the drawer or the drawer treats taps as "outside". */}
      <Popover.Content align="start" sideOffset={6} collisionPadding={12}
        className="z-[80] w-[min(320px,calc(100vw-24px))] rounded-2xl border border-line bg-card p-3 shadow-[0_12px_40px_rgba(0,0,0,.18)]">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {quick.map(([t, l]) => (
            <button type="button" key={t + l} onClick={() => { onChange(t); setOpen(false) }}
              className={cn('rounded-full border px-2.5 py-1 text-[12.5px]', value === t ? 'border-accent bg-accent text-on-accent' : 'border-line bg-card')}>
              {l}{after ? <span className="opacity-70"> · {t12(t)}</span> : null}
            </button>
          ))}
        </div>
        {is24() ? (
          <div className="flex gap-1.5">
            <Col label="Hour" items={HOURS24} value={cur ? cur.h : null} show={pad} onPick={(h) => onChange(p2(h) + ':' + p2(cur?.m ?? 0))} />
            <Col label="Minutes" items={mins} value={cur?.m ?? null} show={p2} onPick={(m) => onChange(p2(cur ? cur.h : base.h) + ':' + p2(m))} />
          </div>
        ) : <div className="flex gap-1.5">
          <Col label="Hour" items={HOURS} value={h12} show={String} onPick={(h) => set(h, cur?.m ?? 0, pm ?? base.h >= 12)} />
          <Col label="Minutes" items={mins} value={cur?.m ?? null} show={p2} onPick={(m) => set(h12 ?? (base.h % 12 || 12), m, pm ?? base.h >= 12)} />
          <Col label="am or pm" items={['am', 'pm']} value={pm === null ? null : pm ? 'pm' : 'am'} show={String}
            onPick={(x) => set(h12 ?? (base.h % 12 || 12), cur?.m ?? 0, x === 'pm')} />
        </div>}
        <div className="mt-2.5 flex items-center justify-between">
          <button type="button" className="text-[13px] text-mute underline" onClick={() => { onChange(''); setOpen(false) }}>No time</button>
          <button type="button" className="rounded-[10px] bg-accent px-4 py-1.5 text-[13.5px] font-semibold text-on-accent" onClick={() => setOpen(false)}>Done</button>
        </div>
      </Popover.Content>
    </Popover.Root>
  )
}
