import type { CalEvent, Repeat } from './types'
import { addD, ds, pad, today } from './date'
import { uid } from './utils'

/** Read a .ics calendar file into planner events. Keeps roughly a year back and two years ahead. */
export function parseICS(txt: string): { name: string; events: CalEvent[] } {
  const lines = txt.replace(/\r?\n[ \t]/g, '').split(/\r?\n/)
  let ev: Partial<CalEvent> | null = null, name = ''
  const out: CalEvent[] = []
  const lo = addD(today(), -400), hi = addD(today(), 800)
  const unesc = (s: string) => s.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1')
  for (const l of lines) {
    if (l.startsWith('X-WR-CALNAME:')) name = unesc(l.slice(13))
    if (l === 'BEGIN:VEVENT') ev = { id: uid(), ro: true }
    else if (l === 'END:VEVENT') {
      if (ev && ev.date && ev.title !== undefined) {
        const rep = ev.repeat && ev.repeat !== 'none'
        if (rep ? !ev.until || ev.until >= lo : ev.date >= lo && ev.date <= hi) out.push(ev as CalEvent)
      } else if (ev && ev.date) { ev.title = '(No title)'; out.push(ev as CalEvent) }
      ev = null
    } else if (ev) {
      const i = l.indexOf(':'); if (i < 0) continue
      const key = l.slice(0, i).split(';')[0], val = l.slice(i + 1)
      if (key === 'SUMMARY') ev.title = unesc(val)
      else if (key === 'LOCATION') ev.loc = unesc(val).slice(0, 80)
      else if (key === 'DTSTART' || key === 'DTEND') {
        const m = val.match(/(\d{4})(\d{2})(\d{2})(T(\d{2})(\d{2}))?/); if (!m) continue
        let d: string, t = ''
        if (m[4] && val.endsWith('Z')) { const x = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[5], +m[6])); d = ds(x); t = pad(x.getHours()) + ':' + pad(x.getMinutes()) }
        else { d = m[1] + '-' + m[2] + '-' + m[3]; if (m[4]) t = m[5] + ':' + m[6] }
        if (key === 'DTSTART') { ev.date = d; ev.time = t } else if (t && d === ev.date) ev.end = t
      } else if (key === 'RRULE') {
        const g = (r: string) => (val.match(new RegExp(r + '=([^;]+)')) || [])[1]
        const f = g('FREQ'), iv = g('INTERVAL') || '1', by = g('BYDAY'), u = g('UNTIL')
        ev.repeat = (f === 'DAILY' && iv === '1' ? 'daily' : f === 'WEEKLY' ? (by === 'MO,TU,WE,TH,FR' ? 'weekdays' : iv === '2' ? 'fortnightly' : iv === '1' ? 'weekly' : 'none')
          : f === 'MONTHLY' && iv === '1' ? 'monthly' : f === 'YEARLY' ? 'yearly' : 'none') as Repeat
        if (u) ev.until = u.slice(0, 4) + '-' + u.slice(4, 6) + '-' + u.slice(6, 8)
      } else if (key === 'EXDATE') {
        const m = val.match(/(\d{4})(\d{2})(\d{2})/)
        if (m) { ev.skips = ev.skips || {}; ev.skips[m[1] + '-' + m[2] + '-' + m[3]] = true }
      }
    }
  }
  return { name, events: out.slice(0, 3000) }
}
