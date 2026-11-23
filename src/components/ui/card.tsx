import * as React from 'react'
import { cn } from '@/lib/utils'
import { usePals, Pal, type PalName } from '@/components/pals'

export function Card({ className, ...p }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn('rounded-card border border-line bg-card px-4 py-3.5 shadow-card min-w-0', className)} {...p} />
}
/** `pal` adds a little character before the title in the Cute style. */
export function CardHeader({ title, action, className, pal, level }: { title: React.ReactNode; action?: React.ReactNode; className?: string; pal?: PalName; level?: number }) {
  return (
    <header className={cn('mb-2 flex items-center gap-2', className)}>
      {pal && <PalBubble name={pal} level={level} />}
      <span className="lbl flex-1">{title}</span>
      {action}
    </header>
  )
}
const BUBBLE: Partial<Record<PalName, string>> = { twinkle: 'bg-tint-butter', sprig: 'bg-tint-mint', pip: 'bg-tint-peach', dewy: 'bg-tint-sky', snoozy: 'bg-tint-lav', bellsy: 'bg-tint-lav' }
/** A pal on a little pastel bubble, for card headers. */
function PalBubble({ name, level }: { name: PalName; level?: number }) {
  if (!usePals()) return null
  return <span className={cn('pal-bubble -my-2 size-10 flex-none', BUBBLE[name])}><Pal name={name} size={34} level={level} /></span>
}
export function Empty({ children }: { children: React.ReactNode }) {
  const pals = usePals()
  if (pals) return <div className="tinted lav my-1 flex items-center gap-2.5 text-[13.5px] text-ink/75"><Pal name="snoozy" size={46} /><div>{children}</div></div>
  return <div className="py-1.5 text-[13.5px] text-mute">{children}</div>
}
