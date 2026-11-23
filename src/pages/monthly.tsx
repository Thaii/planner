import { toast } from 'sonner'
import * as React from 'react'
import { Sections } from '@/components/sections'
import { X } from 'lucide-react'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { AutoTextarea, InlineAdd } from '@/components/ui/field'
import { PageHead } from '@/components/bits'
import { useS, update, undoable } from '@/lib/store'
import { go, openDay, useUI } from '@/lib/ui'
import { ds, DOWN, fmt, pad, pd, today, weekOrder, ym, type DateStr } from '@/lib/date'
import { ensureMonth, eventsOn, labColor, monthOf, tasksOn, workoutsOn, wsDay } from '@/lib/logic'
import { monthTodo } from '@/lib/actions'
import type { State } from '@/lib/types'
import { cn, uid } from '@/lib/utils'
import { Ico } from '@/components/doodles'

/** Little markers for what kind of day it is – quicker than colouring, and they don't clash with event colours. */
export const DAY_STICKERS: [string, string][] = [['💰', 'Payday'], ['🌴', 'Holiday'], ['🛌', 'Rest day'], ['⭐', 'Big day'], ['🎂', 'Birthday'], ['🕒', 'Appointment']]

/** Month grid. `mini` is the small version used on the Yearly page. */
export function MonthGrid({ s, y, mo, mini, colorMode, stamp }: { s: State; y: number; mo: number; mini?: boolean; colorMode?: boolean; stamp?: string | null }) {
  const first = new Date(y, mo, 1), off = (first.getDay() - wsDay(s) + 7) % 7, n = new Date(y, mo + 1, 0).getDate(), t = today()
  return (
    <div className={cn('grid grid-cols-7', mini ? 'gap-px' : 'gap-[5px]')}>
      {weekOrder(wsDay(s)).map((i) => <div key={i} className={cn('text-center font-mono text-mute uppercase', mini ? 'text-[8.5px]' : 'py-1 text-[10.5px]')}>{mini ? DOWN[i][0] : DOWN[i]}</div>)}
      {Array.from({ length: off }, (_, i) => <span key={'o' + i} />)}
      {Array.from({ length: n }, (_, i) => {
        const d = ds(new Date(y, mo, i + 1)), ev = eventsOn(s, d)
        if (mini) {
          const bd = ev.some((e) => e.repeat === 'yearly')
          return <button key={d} title={ev.map((e) => e.title).join(', ')} onClick={() => go('monthly', { monthRef: d })}
            className={cn('rounded-[5px] py-0.5 text-center text-[10px]', ev.length && 'bg-accent-soft font-bold', bd && 'text-danger', d === t && 'bg-accent font-bold text-on-accent')}>{i + 1}</button>
        }
        const tk = tasksOn(s, d).filter((x) => !x.over), wo = workoutsOn(s, d), stk = stickersOn(s, d)
        const items = ev.map((e) => [e.title, e.ro ? '#8a857d' : labColor(s, e.label) || 'var(--accent)'] as const).concat(wo.map((w) => [w.name, '#e0916b'] as const))
        return (
          <button key={d} onClick={() => (colorMode ? stampDay(d, stamp ?? null) : openDay(d))} aria-label={[fmt(d, { weekday: 'long', day: 'numeric', month: 'long' }), ...stk.map((e) => DAY_STICKERS.find((x) => x[0] === e)?.[1] || e)].join(', ')}
            className={cn('relative flex min-h-[60px] min-w-0 flex-col gap-0.5 overflow-hidden rounded-[9px] border border-line bg-soft p-[3px] text-left min-[600px]:min-h-[78px] min-[600px]:p-[5px]', d === t && 'border-accent bg-card shadow-[inset_0_0_0_1.5px_var(--accent)]')}
            >
            <b className="text-[13px] font-semibold">{i + 1}</b>
            {stk.length > 0 && <span className="absolute right-[3px] bottom-[3px] flex -space-x-1 min-[600px]:top-[5px] min-[600px]:bottom-auto min-[600px]:right-[5px] min-[600px]:space-x-0.5">
              {stk.slice(0, 3).map((e, j) => <Ico key={e} e={e} className={cn('size-[16px] text-[12px] leading-none min-[600px]:size-[22px] min-[600px]:text-[16px]', j === 2 && 'max-[599px]:hidden')} />)}
            </span>}
            <div className="flex flex-wrap gap-0.5 min-[600px]:block">
              {items.slice(0, 2).map(([x, c], j) => (
                <div key={j} className="flex items-center gap-1 overflow-hidden text-[10.5px] whitespace-nowrap"><i className="lamp-warm size-2 flex-none rounded-full" style={{ background: c }} /><span className="hidden truncate min-[600px]:inline">{x}</span></div>
              ))}
              {items.length > 2 && <div className="hidden text-[10px] text-mute min-[600px]:block">+{items.length - 2} more</div>}
            </div>
            {tk.length > 0 && <div className="mt-auto font-mono text-[10px] text-mute">{tk.filter((x) => x.done).length}/{tk.length}</div>}
          </button>
        )
      })}
    </div>
  )
}

/** A day's stickers (older saves kept one as a plain string). */
export const stickersOn = (s: State, d: DateStr): string[] => { const v = monthOf(s, ym(d)).stickers?.[d]; return !v ? [] : Array.isArray(v) ? v : [v] }

/** Sticker mode: tap a day to add the chosen sticker, tap again to take it off. */
function stampDay(d: DateStr, e: string | null) {
  if (!e) { toast('Pick a sticker first, then tap the days'); return }
  update((st) => {
    const m = ensureMonth(st, ym(d)), cur = stickersOn(st, d)
    const next = cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]
    m.stickers = m.stickers || {}
    if (next.length) m.stickers[d] = next; else delete m.stickers[d]
  })
}

const REFL: [string, string][] = [['well', 'What went well'], ['achieve', 'An achievement'], ['challenge', 'A challenge'], ['learned', 'What I learned'], ['change', 'One change for next month']]

export function MonthlyPage() {
  const s = useS()
  const { monthRef, colorMode } = useUI()
  const r = pd(monthRef), y = r.getFullYear(), mo = r.getMonth(), key = `${y}-${pad(mo + 1)}`, m = monthOf(s, key)
  const used = DAY_STICKERS.filter(([e]) => Object.values(m.stickers || {}).some((v) => (Array.isArray(v) ? v : [v]).includes(e)))
  const [stamp, setStamp] = React.useState<string | null>(null)
  const shift = (n: number) => { const x = pd(monthRef); x.setDate(1); x.setMonth(x.getMonth() + n); useUI.setState({ monthRef: ds(x) }) }
  return (
    <div>
      <PageHead crumb={'Plan · ' + fmt(today(), { weekday: 'long', day: 'numeric', month: 'long' })} title="Monthly" />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="icon" aria-label="Previous month" onClick={() => shift(-1)}>‹</Button>
        <h2 className="text-[21px]">{r.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</h2>
        <Button size="icon" aria-label="Next month" onClick={() => shift(1)}>›</Button>
        <Button size="mono" onClick={() => useUI.setState({ monthRef: today() })}>This month</Button>
        <Button size="mono" onClick={() => go('weekly')}>Weekly</Button>
        <span className="flex-1" />
        <Button size={colorMode ? 'md' : 'mono'} variant={colorMode ? 'primary' : 'outline'} onClick={() => useUI.setState({ colorMode: !colorMode })}>{colorMode ? 'Done' : 'Add stickers'}</Button>
      </div>
      {colorMode && (
        <div className="mb-2 rounded-2xl bg-accent-soft px-3 py-2.5">
          <div className="mb-2 text-[13px]">{stamp ? <>Tap days to add <b>{DAY_STICKERS.find((x) => x[0] === stamp)![1]}</b>. Tap a day again to take it off.</> : 'Pick a sticker, then tap as many days as you like.'}</div>
          <div className="flex flex-wrap gap-1.5">
            {DAY_STICKERS.map(([e, n]) => (
              <button key={e} aria-pressed={stamp === e} onClick={() => setStamp(stamp === e ? null : e)}
                className={cn('flex items-center gap-1.5 rounded-full border-[1.5px] bg-card px-2.5 py-1 text-[13px]', stamp === e ? 'border-accent font-semibold' : 'border-transparent')}>
                <Ico e={e} className="size-[20px] text-[15px] leading-none" />{n}
              </button>
            ))}
          </div>
        </div>
      )}
      <Sections page="monthly" items={[
        { id: 'calendar', title: "The month", icon: '📅', desc: "Your month at a glance", wide: true, node: (<>
      <Card>
        <MonthGrid s={s} y={y} mo={mo} colorMode={colorMode} stamp={stamp} />
        {used.length > 0 && <div className="mt-2.5 flex flex-wrap gap-1.5">{used.map(([e, n]) => <span key={e} className="flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-[12.5px]"><Ico e={e} className="size-[18px] text-[14px] leading-none" />{n}</span>)}</div>}
      </Card>
        </>) },
        { id: 'todo', title: "Month to-do", icon: '✅', desc: "Things to get done this month", node: (<>
        <Card><CardHeader title="Month to-do" />
          <div className="rows">{m.todo.length ? m.todo.map((i) => (
            <div key={i.id} className={cn('row', i.done && 'done')}><Check on={!!i.done} onClick={() => monthTodo(key, (l) => { const x = l.find((z) => z.id === i.id); if (x) x.done = !x.done })} /><div className="tt flex-1">{i.text}</div>
              <button className="p-1 text-mute" aria-label="Remove" onClick={() => undoable('Removed', (d) => { const mm = ensureMonth(d, key); mm.todo = mm.todo.filter((z) => z.id !== i.id) })}><X className="size-4" /></button></div>
          )) : <Empty>Things to get done this month.</Empty>}</div>
          <InlineAdd placeholder="Add to this month" onAdd={(t) => monthTodo(key, (l) => { l.push({ id: uid(), text: t, done: false }) })} />
        </Card>
        </>) },
        { id: 'refl', title: "Monthly reflection", icon: '💭', desc: "Look back on the month", hide: true, node: (<>
        <Card><CardHeader title="Monthly reflection" />
          {REFL.map(([k, l]) => (
            <div key={k}><div className="lbl mt-2 mb-1 text-mute">{l}</div>
              <AutoTextarea rows={2} className="min-h-[44px] bg-transparent" value={m.refl[k] || ''} onSave={(v) => update((d) => { ensureMonth(d, key).refl[k] = v })} /></div>
          ))}
        </Card>
        </>) },
      ]} />
    </div>
  )
}
