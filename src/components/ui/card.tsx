import * as React from 'react'
import { cn } from '@/lib/utils'

export function Card({ className, ...p }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn('rounded-card border border-line bg-card px-4 py-3.5 shadow-card min-w-0', className)} {...p} />
}
export function CardHeader({ title, action, className }: { title: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <header className={cn('mb-2 flex items-center gap-2', className)}>
      <span className="lbl flex-1">{title}</span>
      {action}
    </header>
  )
}
export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="py-1.5 text-[13.5px] text-mute">{children}</div>
}
