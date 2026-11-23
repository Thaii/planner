import * as React from 'react'
import { cn } from '@/lib/utils'
import { MaybePal, usePals, Pal, type PalName } from '@/components/pals'

export function Card({ className, ...p }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn('rounded-card border border-line bg-card px-4 py-3.5 shadow-card min-w-0', className)} {...p} />
}
/** `pal` adds a little character before the title in the Cute style. */
export function CardHeader({ title, action, className, pal, level }: { title: React.ReactNode; action?: React.ReactNode; className?: string; pal?: PalName; level?: number }) {
  return (
    <header className={cn('mb-2 flex items-center gap-2', className)}>
      {pal && <MaybePal name={pal} size={34} level={level} className="-my-1.5" />}
      <span className="lbl flex-1">{title}</span>
      {action}
    </header>
  )
}
export function Empty({ children }: { children: React.ReactNode }) {
  const pals = usePals()
  if (pals) return <div className="flex items-center gap-2.5 py-1.5 text-[13.5px] text-mute"><Pal name="snoozy" size={42} /><div>{children}</div></div>
  return <div className="py-1.5 text-[13.5px] text-mute">{children}</div>
}
