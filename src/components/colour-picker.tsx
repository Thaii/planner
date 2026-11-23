import * as React from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

type Mode = 'hex' | 'rgb' | 'hsl'
const RAINBOW = 'conic-gradient(#e57373,#ffb74d,#fff176,#81c784,#64b5f6,#9575cd,#e57373)'

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const toRgb = (hex: string) => { const n = parseInt(hex.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255] }
const toHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('')
function toHsl(hex: string) {
  const [r, g, b] = toRgb(hex).map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn
  if (!d) return [0, 0, Math.round(l * 100)]
  const s = d / (1 - Math.abs(2 * l - 1))
  const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [Math.round((h * 60 + 360) % 360), Math.round(s * 100), Math.round(l * 100)]
}
function fromHsl(h: number, s: number, l: number) {
  s /= 100; l /= 100
  const k = (n: number) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return toHex(f(0) * 255, f(8) * 255, f(4) * 255)
}
const validHex = (v: string) => { const x = v.trim().replace(/^#?/, '#'); return /^#[0-9a-f]{6}$/i.test(x) ? x.toLowerCase() : /^#[0-9a-f]{3}$/i.test(x) ? ('#' + x.slice(1).split('').map((c) => c + c).join('')).toLowerCase() : null }

const MODES: [Mode, string][] = [['hex', 'HEX'], ['rgb', 'RGB'], ['hsl', 'HSL']]
const FIELDS: Record<Exclude<Mode, 'hex'>, [string, number][]> = { rgb: [['R', 255], ['G', 255], ['B', 255]], hsl: [['H', 360], ['S %', 100], ['L %', 100]] }

/** "Any colour" button: opens a small picker that starts on HEX, with clear HEX / RGB / HSL tabs and the system colour wheel as an extra. */
export function ColourPicker({ value, onChange, active, className, label = 'Pick any colour' }: { value: string; onChange: (hex: string) => void; active?: boolean; className?: string; label?: string }) {
  const [mode, setMode] = React.useState<Mode>('hex')
  const [hex, setHex] = React.useState(value)
  const [nums, setNums] = React.useState<string[]>([])
  const cur = validHex(hex) || value
  const sync = (h: string, m = mode) => { setHex(h); setNums((m === 'hsl' ? toHsl(h) : toRgb(h)).map(String)) }
  const pick = (h: string) => { sync(h); onChange(h) }
  const setNum = (i: number, v: string) => {
    const n = [...nums]; n[i] = v; setNums(n)
    if (n.every((x) => x !== '' && !isNaN(+x))) {
      const [a, b, c] = n.map(Number), max = FIELDS[mode as 'rgb'][i][1]
      if (+v > max) return
      const h = mode === 'rgb' ? toHex(a, b, c) : fromHsl(clamp(a, 0, 360), clamp(b, 0, 100), clamp(c, 0, 100))
      setHex(h); onChange(h)
    }
  }
  const field = 'h-10 w-full rounded-xl border border-line bg-field px-2.5 font-mono text-[14px] outline-none focus:border-accent'
  return (
    <Popover.Root onOpenChange={(o) => { if (o) { setMode('hex'); sync(value, 'hex') } }}>
      <Popover.Trigger title={label} aria-label={label} className={cn('relative grid place-items-center overflow-hidden rounded-full', className)} style={{ background: active ? value : RAINBOW }}>
        {!active && <span className="pointer-events-none text-[15px] font-bold text-white [text-shadow:0_1px_2px_rgba(0,0,0,.4)]">+</span>}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={8} collisionPadding={12} className="z-[80] w-[272px] rounded-[20px] border border-line bg-card p-3.5 text-ink shadow-[0_16px_44px_rgba(0,0,0,.18)]">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="size-10 flex-none rounded-full border border-line" style={{ background: cur }} />
            <div className="min-w-0 flex-1"><div className="text-[13.5px] font-semibold">Your own colour</div><div className="text-[12px] text-mute">Type a code, or use the wheel</div></div>
          </div>
          <div className="mb-1.5 text-[12px] font-semibold text-mute">Enter it as</div>
          <div role="tablist" aria-label="Colour code format" className="mb-2.5 flex rounded-full border border-line bg-soft p-1">
            {MODES.map(([m, n]) => (
              <button key={m} role="tab" type="button" aria-selected={mode === m} onClick={() => { setMode(m); sync(cur, m) }}
                className={cn('flex-1 rounded-full py-1.5 text-[12.5px] font-bold', mode === m ? 'bg-card shadow-sm' : 'text-mute')}>{n}</button>
            ))}
          </div>
          {mode === 'hex' ? (
            <label className="block">
              <span className="sr-only">HEX code</span>
              <input autoFocus className={field} value={hex} placeholder="#ea95b4" spellCheck={false}
                onChange={(e) => { setHex(e.target.value); const h = validHex(e.target.value); if (h) onChange(h) }} />
              <span className="mt-1 block text-[11.5px] text-mute">{validHex(hex) ? 'Like #ea95b4 – six letters and numbers' : 'Keep typing – a HEX code has six letters and numbers'}</span>
            </label>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {FIELDS[mode].map(([n, max], i) => (
                <label key={n} className="block">
                  <span className="mb-1 block text-[11.5px] font-semibold text-mute">{n} <span className="font-normal">0–{max}</span></span>
                  <input className={field} inputMode="numeric" value={nums[i] ?? ''} onChange={(e) => setNum(i, e.target.value.replace(/[^\d]/g, ''))} />
                </label>
              ))}
            </div>
          )}
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-[13px] font-semibold hover:border-accent">
            <Palette className="size-4" />Open the colour wheel
            <input type="color" className="sr-only" value={cur} onChange={(e) => pick(e.target.value)} />
          </label>
          <Popover.Close className="mt-2 w-full rounded-xl bg-accent py-2 text-[13.5px] font-bold text-on-accent">Done</Popover.Close>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
