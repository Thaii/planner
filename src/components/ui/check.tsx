import { Check as Tick } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Tick box. Plain button so it works inside lists without form semantics. */
export function Check({ on, onClick, round, label, className }: { on: boolean; onClick: () => void; round?: boolean; label?: string; className?: string }) {
  return (
    <button
      type="button" role="checkbox" aria-checked={on} aria-label={label} onClick={onClick}
      className={cn('grid size-5 flex-none place-items-center border-[1.5px] transition-colors', round ? 'rounded-full' : 'rounded-md',
        on ? 'border-accent bg-accent text-on-accent' : 'border-mute/60 bg-card', className)}
    >
      {on && <Tick className="size-3" strokeWidth={3} />}
    </button>
  )
}
