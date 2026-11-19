import { pad } from './date'
export const fmtSleep = (h?: number) => { if (h == null) return ''; const m = Math.round(h * 60); return Math.floor(m / 60) + 'h ' + pad(m % 60) + 'm' }
/** Accepts "7h 20m", "7:20" or "7.5". */
export function parseSleep(v: string): number | undefined {
  const s = v.trim().toLowerCase()
  if (!s) return undefined
  let m = s.match(/^(\d+)\s*h(?:ours?)?\s*(\d+)?\s*m?/)
  if (m) return +m[1] + (+m[2] || 0) / 60
  m = s.match(/^(\d+):(\d{1,2})$/)
  if (m) return +m[1] + +m[2] / 60
  const n = parseFloat(s)
  return isNaN(n) ? undefined : n
}
