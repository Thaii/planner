import NumberFlow from '@number-flow/react'

/** Animated number (NumberFlow): ticks over instead of jumping when the value changes. */
export function Num({ value, suffix, decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  return <NumberFlow value={value} suffix={suffix} format={{ maximumFractionDigits: decimals }} />
}
