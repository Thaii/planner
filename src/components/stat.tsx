import * as React from 'react'
import { cn } from '@/lib/utils'

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-3 grid grid-cols-2 gap-2.5 min-[760px]:grid-cols-4', className)}>{children}</div>
}
export function Stat({ label, value, note, highlight }: { label: string; value: React.ReactNode; note?: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn('rounded-card border border-line bg-card px-3.5 py-3', highlight && 'border-transparent bg-accent-soft')}>
      <span className={cn('lbl', highlight && 'text-accent')}>{label}</span>
      <b className="mt-1 block font-serif text-[30px] leading-tight font-normal">{value}</b>
      {note && <small className="text-xs text-mute">{note}</small>}
    </div>
  )
}
