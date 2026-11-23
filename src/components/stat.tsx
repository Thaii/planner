import * as React from 'react'
import { cn } from '@/lib/utils'

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('stat-grid mb-3 grid grid-cols-2 gap-2.5 min-[760px]:grid-cols-4', className)}>{children}</div>
}
/** `tint`: a soft pastel background (Cute style; a quiet soft colour in Classic). */
export function Stat({ label, value, note, highlight, tint, icon }: { label: string; value: React.ReactNode; note?: React.ReactNode; highlight?: boolean; tint?: 'mint' | 'sky' | 'butter' | 'lav' | 'peach'; icon?: React.ReactNode }) {
  const bg = tint && { mint: 'bg-tint-mint', sky: 'bg-tint-sky', butter: 'bg-tint-butter', lav: 'bg-tint-lav', peach: 'bg-tint-peach' }[tint]
  return (
    <div className={cn('stat relative rounded-card border border-line bg-card px-3.5 py-3', (bg || highlight) && 'stat-set', highlight && 'border-transparent bg-accent-soft', bg && 'border-transparent ' + bg)}>
      {icon && <span className="absolute top-2.5 right-2.5">{icon}</span>}
      <span className={cn('lbl', highlight && 'text-accent')}>{label}</span>
      <b className="mt-1 block font-serif text-[30px] leading-tight font-normal">{value}</b>
      {note && <small className="text-xs text-mute">{note}</small>}
    </div>
  )
}
