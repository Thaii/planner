import type { CalEvent, Repeat } from './types'
import { addD, diffD, dow, ds, pad, pd, today, type DateStr } from './date'
import { uid } from './utils'

/** How far back and ahead an imported calendar reaches. */
const BACK = 730, AHEAD = 800, MAX_EVENTS = 4000
const WD = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

interface Raw {
  uid?: string; title?: string; loc?: string; status?: string
  date?: DateStr; time?: string; allDay?: boolean; endDate?: DateStr; endTime?: string
  rrule?: string; ex: DateStr[]; rid?: DateStr
}

/** "20261124", "20261124T093000" or "20261124T093000Z" → local date and time. UTC times are moved to this device's time zone. */
function parseDT(val: string): { d: DateStr; t: string } | null {
  const m = val.match(/(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2}))?/)
  if (!m) return null
  if (m[4] && /Z$/.test(val.trim())) {
    const x = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[5], +m[6]))
    return { d: ds(x), t: pad(x.getHours()) + ':' + pad(x.getMinutes()) }
  }
  return { d: `${m[1]}-${m[2]}-${m[3]}`, t: m[4] ? `${m[5]}:${m[6]}` : '' }
}

interface Rule { freq: string; iv: number; count?: number; until?: DateStr; byday: { n: number; wd: number }[]; bymd: number[]; bymonth: number[]; other: boolean }
function parseRule(r: string): Rule {
  const g = (k: string) => (r.match(new RegExp('(?:^|;)' + k + '=([^;]+)')) || [])[1]
  const until = g('UNTIL')
  return {
    freq: g('FREQ') || '', iv: Math.max(1, +(g('INTERVAL') || 1)), count: g('COUNT') ? +g('COUNT')! : undefined,
    until: until ? parseDT(until)?.d : undefined,
    byday: (g('BYDAY') || '').split(',').filter(Boolean).map((x) => { const m = x.match(/^([+-]?\d+)?([A-Z]{2})$/); return { n: m?.[1] ? +m[1] : 0, wd: WD.indexOf(m?.[2] || '') } }).filter((x) => x.wd >= 0),
    bymd: (g('BYMONTHDAY') || '').split(',').filter(Boolean).map(Number),
    bymonth: (g('BYMONTH') || '').split(',').filter(Boolean).map(Number),
    // Parts we don't understand: fall back to showing just the first date rather than guessing.
    other: /(?:^|;)(BYSETPOS|BYYEARDAY|BYWEEKNO|BYHOUR|BYMINUTE)=/.test(r) || !['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(g('FREQ') || ''),
  }
}

/** Is `d` the nth (or nth-from-last, when negative) of its weekday in its month? */
function nthOk(d: Date, n: number) {
  if (!n) return true
  const day = d.getDate(), last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  return n > 0 ? Math.ceil(day / 7) === n : Math.ceil((last - day + 1) / 7) === -n
}
function dayOk(r: Rule, start: Date, x: Date) {
  const mdOk = (md: number[]) => { const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); return md.some((v) => (v > 0 ? v : last + v + 1) === x.getDate()) }
  if (r.bymd.length) return mdOk(r.bymd)
  if (r.byday.length) return r.byday.some((b) => b.wd === x.getDay() && nthOk(x, b.n))
  return x.getDate() === start.getDate()
}

/** Every date the rule lands on, from the first date up to `hi`. EXDATEs still count towards COUNT, as the standard says. */
function expand(start: DateStr, r: Rule, hi: DateStr): DateStr[] {
  const out: DateStr[] = [], s0 = pd(start), end = r.until && r.until < hi ? r.until : hi
  const wsMon = (d: DateStr) => addD(d, -((dow(d) + 6) % 7))
  let n = 0
  for (let d = start, i = 0; d <= end && i < 20000; d = addD(d, 1), i++) {
    const x = pd(d)
    let ok = false
    if (r.freq === 'DAILY') ok = diffD(start, d) % r.iv === 0 && (!r.byday.length || r.byday.some((b) => b.wd === x.getDay()))
    else if (r.freq === 'WEEKLY') ok = (diffD(wsMon(start), wsMon(d)) / 7) % r.iv === 0 && (r.byday.length ? r.byday.some((b) => b.wd === x.getDay()) : x.getDay() === s0.getDay())
    else if (r.freq === 'MONTHLY') ok = ((x.getFullYear() - s0.getFullYear()) * 12 + x.getMonth() - s0.getMonth()) % r.iv === 0 && dayOk(r, s0, x)
    else if (r.freq === 'YEARLY') ok = (x.getFullYear() - s0.getFullYear()) % r.iv === 0 && (r.bymonth.length ? r.bymonth.includes(x.getMonth() + 1) : x.getMonth() === s0.getMonth()) && dayOk(r, s0, x)
    if (d === start) ok = true // DTSTART is always the first occurrence
    if (!ok) continue
    out.push(d)
    if (r.count && ++n >= r.count) break
  }
  return out
}

/** The planner's own simple repeats, when the rule fits one exactly (keeps saves small). */
function simpleRepeat(r: Rule, start: DateStr): Repeat | null {
  const wd = dow(start), days = r.byday.map((b) => b.wd).sort().join(','), plain = !r.byday.some((b) => b.n) && !r.bymd.length && !r.bymonth.length
  if (!plain) {
    if (r.freq === 'MONTHLY' && r.iv === 1 && !r.byday.length && !r.bymonth.length && r.bymd.length === 1 && r.bymd[0] === pd(start).getDate()) return 'monthly'
    return null
  }
  if ((r.freq === 'DAILY' || r.freq === 'WEEKLY') && r.iv === 1 && days === '1,2,3,4,5' && wd > 0 && wd < 6) return 'weekdays'
  if (r.freq === 'DAILY' && r.iv === 1 && !days) return 'daily'
  if (r.freq === 'WEEKLY' && (!days || days === String(wd))) return r.iv === 1 ? 'weekly' : r.iv === 2 ? 'fortnightly' : null
  if (r.freq === 'MONTHLY' && r.iv === 1 && !days) return 'monthly'
  if (r.freq === 'YEARLY' && r.iv === 1 && !days) return 'yearly'
  return null
}

/**
 * Read a .ics calendar file into planner events (about two years back and two years ahead).
 * Handles cancelled events, removed or moved single occurrences of a repeating event (EXDATE / RECURRENCE-ID),
 * repeats that end after a number of times (COUNT), and repeats on several days a week or "2nd Tuesday" style.
 */
export function parseICS(txt: string): { name: string; events: CalEvent[] } {
  const lines = txt.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
  const unesc = (s: string) => s.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim()
  const raws: Raw[] = []
  let ev: Raw | null = null, name = '', depth = 0
  for (const l of lines) {
    if (l.startsWith('X-WR-CALNAME:')) name = unesc(l.slice(13))
    if (l === 'BEGIN:VEVENT') { ev = { ex: [] }; depth = 0; continue }
    if (l === 'END:VEVENT') { if (ev) raws.push(ev); ev = null; continue }
    if (!ev) continue
    // Skip anything nested inside the event, such as reminders (VALARM), which have their own SUMMARY.
    if (l.startsWith('BEGIN:')) { depth++; continue }
    if (l.startsWith('END:')) { depth--; continue }
    if (depth > 0) continue
    const i = l.indexOf(':'); if (i < 0) continue
    const head = l.slice(0, i), key = head.split(';')[0], val = l.slice(i + 1)
    if (key === 'UID') ev.uid = val.trim()
    else if (key === 'SUMMARY') ev.title = unesc(val)
    else if (key === 'LOCATION') ev.loc = unesc(val).slice(0, 80)
    else if (key === 'STATUS') ev.status = val.trim().toUpperCase()
    else if (key === 'RRULE') ev.rrule = val.trim()
    else if (key === 'DTSTART') { const p = parseDT(val); if (p) { ev.date = p.d; ev.time = p.t; ev.allDay = !p.t || /VALUE=DATE(?!-)/.test(head) } }
    else if (key === 'DTEND') { const p = parseDT(val); if (p) { ev.endDate = p.d; ev.endTime = p.t } }
    else if (key === 'RECURRENCE-ID') ev.rid = parseDT(val)?.d
    else if (key === 'EXDATE') val.split(',').forEach((v) => { const p = parseDT(v); if (p) ev!.ex.push(p.d) })
  }

  // A changed or cancelled single occurrence comes as its own event with the same UID and a RECURRENCE-ID:
  // hide that date on the repeating event, then show the changed copy (unless it was cancelled).
  const masters = new Map<string, Raw>()
  raws.forEach((r) => { if (r.uid && !r.rid && r.rrule) masters.set(r.uid, r) })
  raws.forEach((r) => { if (r.rid && r.uid) masters.get(r.uid)?.ex.push(r.rid) })

  const t = today(), lo = addD(t, -BACK), hi = addD(t, AHEAD)
  const out: CalEvent[] = []
  const base = (r: Raw, date: DateStr): CalEvent => {
    const e: CalEvent = { id: uid(), ro: true, title: r.title || '(No title)', date }
    if (r.time) e.time = r.time
    if (r.endTime && r.endDate === r.date) e.end = r.endTime
    if (r.loc) e.loc = r.loc
    return e
  }
  for (const r of raws) {
    if (!r.date || r.status === 'CANCELLED') continue
    if (r.rrule && !r.rid) {
      const rule = parseRule(r.rrule)
      if (rule.other) { if (r.date >= lo && r.date <= hi) out.push(base(r, r.date)); continue }
      const dates = expand(r.date, rule, hi)
      if (!dates.length) continue
      const finite = !!(rule.count || rule.until), last = dates[dates.length - 1]
      if (finite && last < lo) continue // finished long ago
      const ex = new Set(r.ex)
      const rep = simpleRepeat(rule, r.date)
      if (rep) {
        const e = base(r, r.date)
        e.repeat = rep
        if (finite) e.until = last
        if (ex.size) e.skips = Object.fromEntries([...ex].map((d) => [d, true]))
        out.push(e)
      } else {
        // Patterns the planner can't store as one repeat (e.g. Tue and Thu, 2nd Tuesday): add each date.
        dates.filter((d) => d >= lo && !ex.has(d)).forEach((d) => out.push(base(r, d)))
      }
      continue
    }
    // One-off events. All-day events over several days show on each day (up to two months).
    let last = r.date
    if (r.allDay && r.endDate && r.endDate > r.date) last = addD(r.endDate, -1)
    else if (!r.allDay && r.endDate && r.endDate > r.date) last = r.endDate
    const span = Math.min(diffD(r.date, last), 60)
    for (let k = 0; k <= span; k++) {
      const d = addD(r.date, k)
      if (d < lo || d > hi) continue
      const e = base(r, d)
      if (k > 0) { delete e.time; delete e.end }
      out.push(e)
    }
  }

  // Very large calendars: keep the events closest to today rather than whichever happened to come first in the file.
  const dist = (e: CalEvent) => (e.repeat && e.date < t && (!e.until || e.until >= t) ? 0 : Math.abs(diffD(t, e.date)))
  const kept = out.length > MAX_EVENTS ? [...out].sort((a, b) => dist(a) - dist(b)).slice(0, MAX_EVENTS) : out
  return { name, events: kept.sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')) }
}
