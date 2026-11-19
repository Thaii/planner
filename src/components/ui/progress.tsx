export function Progress({ value, color }: { value: number; color?: string }) {
  return (
    <div className="h-[7px] overflow-hidden rounded-full bg-soft">
      <i className="block h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  )
}
