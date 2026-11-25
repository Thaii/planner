import type { State } from './types'
import { addD, diffD, pd, type DateStr } from './date'
import { allEvents, hRate } from './logic'

export interface KeyDate { d: DateStr; t: string; e: string; kind: 'birthday' | 'yearly' | 'trip' | 'sticker' | 'project' | 'goal' | 'event' | 'payday' }

/** Stickers worth seeing on the year view (payday and appointments repeat too often to be "big dates"). */
const BIG_STICKERS: Record<string, string> = { '🌴': 'Holiday', '⭐': 'Big day', '🎂': 'Birthday', '🛌': 'Rest day' }

/**
 * The dates that shape a year: birthdays and other yearly dates, trips, holiday/big-day stickers,
 * project due dates, goal target dates and one-off all-day events (several days in a row show once).
 * Paydays only when asked for (the countdown shows the next one).
 */
export function keyDates(s: State, from: DateStr, to: DateStr, opts: { payday?: boolean } = {}): KeyDate[] {
  const out: KeyDate[] = []
  const inR = (d?: string) => !!d && d >= from && d <= to
  const y0 = pd(from).getFullYear(), y1 = pd(to).getFullYear()
  const seen = new Set<string>()
  for (const e of allEvents(s)) {
    if (e.repeat === 'yearly') {
      for (let y = y0; y <= y1; y++) {
        const d = y + e.date.slice(4)
        if (d >= e.date && inR(d) && !(e.skips?.[d]) && (!e.until || d <= e.until)) {
          const bday = /birthday|b'?day|bday/i.test(e.title)
          out.push({ d, t: e.title, e: bday ? '🎂' : '📅', kind: bday ? 'birthday' : 'yearly' })
        }
      }
    } else if ((!e.repeat || e.repeat === 'none') && !e.time && inR(e.date)) {
      // All-day one-offs (holidays, trips from a calendar). Skip the 2nd, 3rd… day of a run.
      if (seen.has(e.title + addD(e.date, -1))) { seen.add(e.title + e.date); continue }
      seen.add(e.title + e.date)
      out.push({ d: e.date, t: e.title, e: '📅', kind: 'event' })
    }
  }
  for (const tr of s.trips || []) if (inR(tr.start)) out.push({ d: tr.start!, t: tr.name + (tr.dest && tr.dest !== tr.name ? ' – ' + tr.dest : ''), e: '🧳', kind: 'trip' })
  for (const p of s.projects || []) if (p.status !== 'done' && inR(p.due)) out.push({ d: p.due!, t: p.name + ' due', e: '📌', kind: 'project' })
  for (const g of s.goals || []) if (!g.done && inR(g.target)) out.push({ d: g.target!, t: g.title, e: '🎯', kind: 'goal' })
  let pay: DateStr | undefined
  for (const [m, plan] of Object.entries(s.months || {})) {
    if (m < from.slice(0, 7) || m > to.slice(0, 7)) continue
    for (const [d, v] of Object.entries(plan.stickers || {})) {
      if (!inR(d)) continue
      for (const st of Array.isArray(v) ? v : [v]) {
        if (BIG_STICKERS[st] && !(st === '🎂' && out.some((x) => x.d === d && x.kind === 'birthday'))) out.push({ d, t: BIG_STICKERS[st], e: st, kind: 'sticker' })
        if (st === '💰' && (!pay || d < pay)) pay = d
      }
    }
  }
  if (opts.payday && pay) out.push({ d: pay, t: 'Payday', e: '💰', kind: 'payday' })
  return out.sort((a, b) => a.d.localeCompare(b.d) || a.t.localeCompare(b.t))
}

/** "today", "tomorrow", "in 5 days", "in 3 weeks", "in 2 months". */
export function untilLabel(from: DateStr, d: DateStr) {
  const n = diffD(from, d)
  if (n <= 0) return 'today'
  if (n === 1) return 'tomorrow'
  if (n < 14) return `in ${n} days`
  if (n < 60) return `in ${Math.round(n / 7)} weeks`
  return `in ${Math.round(n / 30.4)} months`
}

export type PixelMode = 'mood' | 'energy' | 'habits'
/** One value per day, 0–1 (or null when nothing was logged), for the year-in-pixels grid. */
export function pixelValue(s: State, d: DateStr, mode: PixelMode): number | null {
  if (mode === 'habits') {
    const r = hRate(s, [d])
    return r.due ? r.done / r.due : null
  }
  const v = s.well?.[d]?.[mode]
  if (typeof v !== 'number') return null
  // Mood is 1–5 (faces); energy is a 0–100 slider.
  return mode === 'energy' ? Math.max(0, Math.min(1, v / 100)) : v > 0 ? (v - 1) / 4 : null
}

/** Totals for one calendar year. */
export function yearStats(s: State, y: number) {
  const inY = (d?: string) => !!d && d.startsWith(y + '-')
  let todos = 0
  for (const k of s.tasks) {
    if (k.repeat && k.repeat !== 'none') todos += Object.keys(k.doneDates || {}).filter(inY).length
    else if (k.done && inY(k.doneOn || k.date)) todos++
  }
  let habitTicks = 0
  for (const h of s.habits) habitTicks += Object.keys(h.log || {}).filter(inY).length
  const wellDays = Object.entries(s.well || {}).filter(([d]) => inY(d))
  const moods = wellDays.map(([, w]) => w.mood).filter((m): m is number => typeof m === 'number' && m > 0)
  const trips = (s.trips || []).filter((t) => inY(t.start)).length
  const goalsDone = (s.goals || []).filter((g) => g.done && (!g.target || inY(g.target))).length
  const gratitude = Object.entries(s.journal?.grat || {}).filter(([d, l]) => inY(d) && l.length).length
  return { todos, habitTicks, checkins: wellDays.length, avgMood: moods.length ? moods.reduce((a, b) => a + b, 0) / moods.length : 0, trips, goalsDone, gratitude }
}

/** Month themes and stickers sit in the month plan; this reads the theme without creating the month. */
export const monthTheme = (s: State, y: number, mo: number) => s.years[y]?.themes?.[String(mo + 1).padStart(2, '0')] || ''
