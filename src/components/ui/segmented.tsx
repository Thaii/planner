import { cn } from '@/lib/utils'

export function Segmented<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: [T, string][]; className?: string }) {
  return (
    <div role="tablist" className={cn('mb-3 flex overflow-x-auto rounded-xl border border-line bg-soft p-[3px]', className)}>
      {options.map(([v, l]) => (
        <button type="button" key={v} role="tab" aria-selected={v === value} onClick={() => onChange(v)}
          className={cn('flex-1 whitespace-nowrap rounded-[9px] px-2 py-1.5 text-[13.5px] text-mute', v === value && 'bg-card font-semibold text-ink shadow-card')}>
          {l}
        </button>
      ))}
    </div>
  )
}
