import type { State, Task, CalEvent, Habit, Workout, Freq, WeekPlan, MonthPlan } from './types'
import { type DateStr, addD, diffD, dow, pd, range, today, weekStartOf, ym } from './date'

export const wsDay = (s: State): 0 | 1 => (s.settings.weekStart === 0 ? 0 : 1)
export const weekStart = (s: State, d: DateStr) => weekStartOf(d, wsDay(s))

/* ---------- recurrence ---------- */
export function occurs(it: { date: DateStr; repeat?: string; until?: DateStr; skips?: Record<string, boolean> }, d: DateStr) {
  if (!it.date || d < it.date) return false
  if (it.until && d > it.until) return false
  if (it.skips && it.skips[d]) return false
  const n = diffD(it.date, d)
  switch (it.repeat || 'none') {
    case 'none': return d === it.date
    case 'daily': return true
    case 'weekdays': { const w = dow(d); return w > 0 && w < 6 }
    case 'weekly': return n % 7 === 0
    case 'fortnightly': return n % 14 === 0
    case 'monthly': return pd(d).getDate() === pd(it.date).getDate()
    case 'yearly': return d.slice(5) === it.date.slice(5)
  }
  return false
}
export const isRep = (k: Task) => !!k.repeat && k.repeat !== 'none'

export const allEvents = (s: State): CalEvent[] =>
  s.events.concat(...Object.values(s.ics || {}).map((c) => (c.events || []).map((e) => ({ ...e, ro: true, cal: c.name }))))
export const eventsOn = (s: State, d: DateStr) => allEvents(s).filter((e) => occurs(e, d)).sort((a, b) => (a.time || '').localeCompare(b.time || ''))
export const workoutsOn = (s: State, d: DateStr): Workout[] => s.workouts.filter((w) => (w.days || []).includes(dow(d)))

export interface TaskOcc { k: Task; occ: DateStr; done: boolean; over?: boolean; more?: number }
/** Tasks for a day. Today also shows unfinished one-off tasks carried over, and one overdue line per repeating task. */
export function tasksOn(s: State, d: DateStr): TaskOcc[] {
  const t = today(), out: TaskOcc[] = []
  for (const k of s.tasks) {
    if (!isRep(k)) {
      if (!k.date) { if (d === t && (!k.done || k.doneOn === t)) out.push({ k, occ: '', done: !!k.done }) }
      else if (d === t) {
        if (!k.done && k.date <= t) out.push({ k, occ: k.date, done: false, over: k.date < t })
        else if (k.done && (k.date === t || k.doneOn === t)) out.push({ k, occ: k.date, done: true })
      } else if (k.date === d) out.push({ k, occ: d, done: !!k.done })
    } else if (d === t) {
      const from = k.date > addD(t, -21) ? k.date : addD(t, -21), missed: DateStr[] = []
      for (let x = from; x < t; x = addD(x, 1)) if (occurs(k, x) && !(k.doneDates || {})[x]) missed.push(x)
      if (missed.length) out.push({ k, occ: missed[0], done: false, over: true, more: missed.length - 1 })
      if (occurs(k, t)) out.push({ k, occ: t, done: !!(k.doneDates || {})[t] })
    } else if (occurs(k, d)) out.push({ k, occ: d, done: !!(k.doneDates || {})[d] })
  }
  return out.sort((a, b) => Number(a.done) - Number(b.done) || Number(!!b.over) - Number(!!a.over) || (a.k.order || 0) - (b.k.order || 0))
}

/* ---------- weeks & months (read without creating) ---------- */
export const weekOf = (s: State, ws: DateStr): WeekPlan => {
  const w = s.weeks[ws]
  return { prio: w?.prio || ['', '', ''], pdone: w?.pdone || [], goals: w?.goals || [], todo: w?.todo || [] }
}
export const ensureWeek = (d: State, ws: DateStr) => (d.weeks[ws] = { ...weekOf(d, ws), ...(d.weeks[ws] || {}) })
export const monthOf = (s: State, m: string): MonthPlan => {
  const x = s.months[m]
  return { todo: x?.todo || [], refl: x?.refl || {}, colors: x?.colors || {} }
}
export const ensureMonth = (d: State, m: string) => (d.months[m] = { ...monthOf(d, m), ...(d.months[m] || {}) })

/* ---------- habits ---------- */
export const kept = (h: Habit, d: DateStr) => !!(h.log && h.log[d])
export const isMin = (h: Habit, d: DateStr) => !!h.log && h.log[d] === 'm'
export const hDue = (h: Habit, d: DateStr) => (h.mode === 'weekly' ? true : (h.days || []).includes(dow(d)))
export const hWeekCount = (s: State, h: Habit, d: DateStr) => range(weekStart(s, d), 7).filter((x) => kept(h, x)).length
export function hStreakN(s: State, h: Habit): [number, 'd' | 'wk'] {
  const t = today()
  let n = 0
  if (h.mode === 'weekly') {
    let ws = weekStart(s, t)
    for (let i = 0; i < 104; i++) { if (hWeekCount(s, h, ws) >= (h.perWeek || 1)) n++; else if (i > 0) break; ws = addD(ws, -7) }
    return [n, 'wk']
  }
  let d = t
  for (let i = 0; i < 730; i++) {
    if (hDue(h, d)) { if (kept(h, d)) n++; else if (d !== t) break }
    d = addD(d, -1)
    if (h.created && d < h.created) break
  }
  return [n, 'd']
}
export const hStreak = (s: State, h: Habit) => { const [n, u] = hStreakN(s, h); return `${n} in a row${u === 'wk' ? ' (weeks)' : ''}` }
export function hSched(s: State, h: Habit, DOWN: string[]) {
  if (h.mode === 'weekly') return `${h.perWeek || 1}× a week`
  const days = h.days || []
  if (days.length === 7) return 'Every day'
  if (days.length === 5 && [1, 2, 3, 4, 5].every((i) => days.includes(i))) return 'Weekdays'
  const order = wsDay(s) === 1 ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6]
  return order.filter((i) => days.includes(i)).map((i) => DOWN[i]).join(', ') || 'No days set'
}
export function hRate(s: State, days: DateStr[]) {
  let due = 0, done = 0
  s.habits.forEach((h) => {
    if (h.mode === 'weekly') {
      const exp = Math.round((h.perWeek || 1) * days.length / 7), got = days.filter((d) => kept(h, d)).length
      due += exp; done += Math.min(got, exp)
    } else days.forEach((d) => { if (h.created && d < h.created) return; if (hDue(h, d)) { due++; if (kept(h, d)) done++ } })
  })
  return { due, done, pct: due ? Math.round((done / due) * 100) : 0 }
}
/** Momentum: rises with every kept day (less for a minimum), dents on a miss, never resets to zero. */
export function hMomentum(h: Habit) {
  const t = today()
  let m = 0
  for (let i = 59; i >= 0; i--) {
    const d = addD(t, -i)
    if (h.created && d < h.created) continue
    if (h.mode === 'weekly') { if (kept(h, d)) m = Math.min(100, m * 0.9 + (isMin(h, d) ? 8 : 12)); else if (d !== t) m *= 0.97; continue }
    if (!hDue(h, d)) continue
    if (kept(h, d)) m = m * 0.85 + (isMin(h, d) ? 10 : 15)
    else if (d !== t) m *= 0.85
  }
  return Math.round(Math.min(100, m))
}
export const momentum = (s: State) => (s.habits.length ? Math.round(s.habits.reduce((a, h) => a + hMomentum(h), 0) / s.habits.length) : 0)
export const idById = (s: State, id?: string) => s.identities.find((x) => x.id === id)
export const votesOn = (s: State, iid: string, d: DateStr) =>
  s.habits.filter((h) => h.identity === iid && kept(h, d)).length + (s.settings.taskIdentity === iid ? tasksOn(s, d).filter((x) => x.done).length : 0)

/* ---------- wellbeing ---------- */
export function lowEnergy(s: State) {
  const t = today()
  const l = range(addD(t, -4), 5).map((d) => s.well[d]?.energy).filter((v): v is number => v != null)
  return l.length >= 3 && l.slice(-3).every((v) => v < 35)
}
export function roughDay(s: State, d: DateStr) {
  const w = s.well[d] || {}
  return (!!w.mood && w.mood <= 2) || (w.energy != null && w.energy < 35) || lowEnergy(s)
}

/* ---------- next up ---------- */
export interface NextUp { kind: 'prio' | 'habit' | 'task'; id: string; occ?: DateStr; eyebrow: string; title: string; sub?: string; min?: string }
export function nextUp(s: State, d: DateStr): NextUp | null {
  const p = s.prio[d] || { items: [], done: [] }
  const ti = idById(s, s.settings.taskIdentity)
  for (let i = 0; i < 3; i++)
    if ((p.items[i] || '').trim() && !(p.done || [])[i])
      return { kind: 'prio', id: String(i), eyebrow: (i === 0 ? 'Must-do' : `Priority ${i + 1}`) + (ti ? ' · as ' + ti.name : ''), title: p.items[i] }
  const low = lowEnergy(s)
  const h = s.habits.find((h) => hDue(h, d) && !kept(h, d))
  if (h) {
    const idn = idById(s, h.identity)
    return {
      kind: 'habit', id: h.id, eyebrow: 'Next habit' + (idn ? ' · as ' + idn.name : ''), title: low && h.min ? h.min : h.name, min: h.min,
      sub: low && h.min ? 'Low-energy day: the minimum counts.' : h.cue ? 'Cue: ' + h.cue : h.min ? 'Bad day? The minimum is: ' + h.min : '',
    }
  }
  const t = tasksOn(s, d).find((x) => !x.done)
  if (t) return { kind: 'task', id: t.k.id, occ: t.occ, eyebrow: 'Next to-do', title: t.k.title, sub: t.k.step ? 'First step: ' + t.k.step : '' }
  return null
}

/* ---------- home jobs ---------- */
export function periodKey(s: State, f: Freq, d: DateStr) {
  if (f === 'daily') return d
  if (f === 'weekly') return weekStart(s, d)
  if (f === 'fortnightly') return 'F' + Math.floor(diffD('2024-01-01', weekStart(s, d)) / 14)
  if (f === 'quarterly') return d.slice(0, 4) + 'Q' + (Math.floor((+d.slice(5, 7) - 1) / 3) + 1)
  return ym(d)
}

/* ---------- labels ---------- */
export const lab = (s: State, id?: string) => s.settings.labels.find((l) => l.id === id)
export const labColor = (s: State, id?: string) => lab(s, id)?.color || ''
export const tint = (c: string, p = 18) => (c ? `color-mix(in srgb, ${c} ${p}%, var(--card))` : 'var(--soft)')

/** Days in a row you did something: kept a habit or ticked a to-do. Today counts once you've done something; until then the streak runs to yesterday. */
export function dayStreak(s: State): number {
  const active = (d: DateStr) =>
    s.habits.some((h) => kept(h, d)) ||
    s.tasks.some((t) => t.doneOn === d || !!t.doneDates?.[d]) ||
    Object.values(s.prio[d]?.done || {}).some(Boolean)
  let d = today(), n = 0
  if (!active(d)) d = addD(d, -1)
  while (active(d) && n < 3650) { n++; d = addD(d, -1) }
  return n
}
