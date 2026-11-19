import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = ({ className, ...p }: React.ComponentProps<'input'>) => <input className={cn('field', className)} {...p} />
export const Textarea = ({ className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea className={cn('field', className)} {...p} />
export const Select = ({ className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement>) => <select className={cn('field', className)} {...p} />

/** Saves on blur/enter rather than on every keystroke, so typing never fights re-renders. */
export function CommitInput({ value, onCommit, className, ...p }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & { value: string; onCommit: (v: string) => void }) {
  const [v, setV] = React.useState(value)
  React.useEffect(() => setV(value), [value])
  return (
    <input
      className={cn('field', className)} value={v} onChange={(e) => setV(e.target.value)}
      onBlur={() => v !== value && onCommit(v)} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} {...p}
    />
  )
}
/** Textarea that saves after a short pause in typing. */
export function AutoTextarea({ value, onSave, className, ...p }: Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> & { value: string; onSave: (v: string) => void }) {
  const [v, setV] = React.useState(value)
  const t = React.useRef<ReturnType<typeof setTimeout>>(undefined)
  const focused = React.useRef(false)
  React.useEffect(() => { if (!focused.current) setV(value) }, [value])
  return (
    <textarea
      className={cn('field', className)} value={v}
      onFocus={() => (focused.current = true)} onBlur={() => { focused.current = false; clearTimeout(t.current); if (v !== value) onSave(v) }}
      onChange={(e) => { const x = e.target.value; setV(x); clearTimeout(t.current); t.current = setTimeout(() => onSave(x), 450) }} {...p}
    />
  )
}

/** Underlined one-line add field with a round + button. */
export function InlineAdd({ placeholder, onAdd, children, className }: { placeholder: string; onAdd: (text: string) => void; children?: React.ReactNode; className?: string }) {
  const [v, setV] = React.useState('')
  return (
    <form className={cn('mt-2 flex items-center gap-1.5', className)} onSubmit={(e) => { e.preventDefault(); const t = v.trim(); if (t) { onAdd(t); setV('') } }}>
      {children}
      <input className="min-w-0 flex-1 border-0 border-b border-line bg-transparent px-0.5 py-1.5 outline-none focus:border-accent" placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} />
      <button className="grid size-7.5 flex-none place-items-center rounded-full border border-line bg-card text-lg leading-none" aria-label="Add">+</button>
    </form>
  )
}
