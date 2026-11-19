/** Dates are stored as local 'YYYY-MM-DD' strings throughout the app. */
export type DateStr = string

export const pad = (n: number) => String(n).padStart(2, '0')
export const ds = (d: Date): DateStr => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const pd = (s: DateStr) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}
export const today = () => ds(new Date())
export const addD = (s: DateStr, n: number) => {
  const d = pd(s)
  d.setDate(d.getDate() + n)
  return ds(d)
}
export const diffD = (a: DateStr, b: DateStr) => Math.round((pd(b).getTime() - pd(a).getTime()) / 864e5)
export const dow = (s: DateStr) => pd(s).getDay()
export const ym = (s: DateStr) => s.slice(0, 7)
export const range = (a: DateStr, n: number) => Array.from({ length: n }, (_, i) => addD(a, i))
export const mins = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}
export const nowMins = () => {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}
export const DOWN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const fmt = (s: DateStr, o: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  pd(s).toLocaleDateString('en-AU', o)
export const t12 = (t?: string) => {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  return ((h % 12) || 12) + (m ? ':' + pad(m) : '') + (h < 12 ? 'am' : 'pm')
}
/** Week starts on Monday (1) or Sunday (0). */
export const weekStartOf = (s: DateStr, wsDay: 0 | 1) => {
  const d = pd(s)
  d.setDate(d.getDate() - ((d.getDay() - wsDay + 7) % 7))
  return ds(d)
}
export const weekOrder = (wsDay: 0 | 1) => (wsDay === 1 ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6])
