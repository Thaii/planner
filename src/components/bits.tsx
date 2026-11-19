import * as React from 'react'
import { X, CornerUpRight } from 'lucide-react'
import { Check } from './ui/check'
import { useS } from '@/lib/store'
import { fmt, t12, type DateStr } from '@/lib/date'
import { idById, isMin, isRep, kept, lab, labColor, type TaskOcc } from '@/lib/logic'
import { REPEATS, MOODS, MOODW } from '@/lib/constants'
import { deleteTask, logHabit, setWell, skipTask, toggleTask } from '@/lib/actions'
import { taskForm } from '@/lib/forms'
import type { Habit } from '@/lib/types'
import { cn } from '@/lib/utils'

export function PageHead({ crumb, title, right }: { crumb: string; title: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <div className="crumb">{crumb}</div>
      <div className="flex flex-wrap items-end gap-2.5"><h1 className="flex-1 text-[30px] leading-tight">{title}</h1>{right}</div>
    </div>
  )
}

export function TaskRow({ x, compact }: { x: TaskOcc; compact?: boolean }) {
  const s = useS()
  const { k, occ, done, over, more } = x
  const sub = [
    over ? <span key="o" className="text-danger">{isRep(k) ? 'overdue' : 'from'} {fmt(occ, { day: 'numeric', month: 'short' })}{more ? ` (+${more})` : ''}</span> : null,
    isRep(k) ? '↻ ' + REPEATS.find((r) => r[0] === k.repeat)![1].toLowerCase() : null,
    k.time ? t12(k.time) : null,
  ].filter(Boolean)
  return (
    <div className={cn('row', done && 'done', compact && 'gap-1.5 py-1 text-[12.5px]')}>
      <Check on={done} onClick={() => toggleTask(k.id, occ)} label={k.title} className={compact ? 'size-[17px]' : ''} />
      {lab(s, k.label) && <span className="lamp-warm size-2 flex-none rounded-full" style={{ background: labColor(s, k.label) }} />}
      <button className="min-w-0 flex-1 text-left" onClick={() => taskForm(k.id)}>
        <div className="tt font-medium break-words">{k.title}</div>
        {!compact && sub.length > 0 && <div className="text-[12.5px] text-mute">{sub.reduce<React.ReactNode[]>((a, n, i) => (i ? [...a, ' · ', n] : [n]), [])}</div>}
      </button>
      {!compact && isRep(k) && !done && <button className="p-1 text-mute" title="Skip this one" aria-label="Skip this one" onClick={() => skipTask(k.id, occ)}><CornerUpRight className="size-4" /></button>}
      {!compact && <button className="p-1 text-mute" aria-label="Delete" onClick={() => deleteTask(k.id)}><X className="size-4" /></button>}
    </div>
  )
}

export function HabitRow({ h, d }: { h: Habit; d: DateStr }) {
  const s = useS()
  const k = kept(h, d), mn = isMin(h, d), idn = idById(s, h.identity)
  const pill = 'whitespace-nowrap rounded-full border border-line bg-card px-3 py-1 text-xs font-semibold'
  return (
    <div className={cn('row', k && 'done')}>
      <div className="min-w-0 flex-1">
        <div className="tt font-medium">{h.name}</div>
        <div className="text-[12.5px] text-mute">
          {[h.cue, h.min && 'Min: ' + h.min].filter(Boolean).join(' · ')}
          {idn && <span className="text-accent">{h.cue || h.min ? ' · ' : ''}vote for {idn.name}</span>}
        </div>
      </div>
      {h.min && <button className={cn(pill, mn && 'border-accent bg-accent-soft text-accent')} onClick={() => logHabit(h.id, d, 'm')}>Min</button>}
      <button className={cn(pill, k && !mn && 'border-accent bg-accent text-on-accent')} onClick={() => logHabit(h.id, d, 1)}>Done</button>
    </div>
  )
}

const Drop = ({ on, small }: { on: boolean; small?: boolean }) => (
  <svg viewBox="0 0 16 20" className={small ? 'h-3.5 w-[11px]' : 'h-5 w-4'}><path d="M8 1C8 1 2 8.5 2 12.5a6 6 0 0 0 12 0C14 8.5 8 1 8 1z" fill={on ? 'var(--accent)' : 'none'} stroke="var(--accent)" strokeWidth="1.4" /></svg>
)
export function Drops({ d, small }: { d: DateStr; small?: boolean }) {
  const s = useS()
  const tgt = s.settings.water || 8, n = s.well[d]?.water || 0
  return (
    <div className={cn('flex items-center', small ? 'gap-0.5' : 'flex-wrap gap-[3px]')}>
      {Array.from({ length: Math.max(tgt, n) }, (_, i) => (
        <button key={i} aria-label={`${i + 1} glasses`} onClick={() => setWell(d, 'water', n === i + 1 ? i : i + 1)}><Drop on={i < n} small={small} /></button>
      ))}
      {!small && <span className="ml-1.5 text-[12.5px] text-mute">{n} / {tgt}</span>}
    </div>
  )
}

export function Moods({ d, small }: { d: DateStr; small?: boolean }) {
  const s = useS()
  const m = s.well[d]?.mood
  return (
    <div className={cn('flex', small ? 'gap-0.5' : 'gap-1.5')}>
      {MOODS.map((e, i) => (
        <button key={i} aria-label={MOODW[i + 1]} aria-pressed={m === i + 1} onClick={() => setWell(d, 'mood', i + 1)}
          className={cn('rounded-full border-[1.5px] border-transparent opacity-55 grayscale', small ? 'size-6 text-sm' : 'size-[38px] text-[22px]', m === i + 1 && 'border-accent bg-accent-soft opacity-100 grayscale-0')}>{e}</button>
      ))}
    </div>
  )
}
