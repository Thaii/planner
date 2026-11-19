import { toast } from 'sonner'
import { update, getS, undoable } from './store'
import { today, type DateStr } from './date'
import { ensureMonth, ensureWeek, hDue, idById, isRep, kept } from './logic'
import { uid } from './utils'
import { confetti } from './confetti'

export function toggleTask(id: string, occ: DateStr) {
  update((d) => {
    const k = d.tasks.find((t) => t.id === id)
    if (!k) return
    if (isRep(k)) { k.doneDates = k.doneDates || {}; if (k.doneDates[occ]) delete k.doneDates[occ]; else k.doneDates[occ] = 1 }
    else { k.done = !k.done; k.doneOn = k.done ? today() : '' }
  })
}
export function skipTask(id: string, occ: DateStr) {
  update((d) => { const k = d.tasks.find((t) => t.id === id); if (k) { k.skips = k.skips || {}; k.skips[occ] = true } })
  toast('Skipped that one – the rest still repeat')
}
export const deleteTask = (id: string) => undoable('To-do deleted', (d) => { d.tasks = d.tasks.filter((t) => t.id !== id) })
export const addTask = (title: string, date: DateStr) => update((d) => { d.tasks.push({ id: uid(), title, date, repeat: 'none', order: Date.now() }) })

export function celebrate(d: DateStr) {
  const s = getS(), due = s.habits.filter((h) => hDue(h, d) && h.mode !== 'weekly')
  if (due.length && due.every((h) => kept(h, d))) { confetti(); toast('Every habit kept today. That is who you are now.') }
}
/** Log a habit as full (1) or minimum ('m'). Tapping the same again clears it. */
export function logHabit(id: string, d: DateStr, v: 1 | 'm') {
  let logged = false
  update((st) => {
    const h = st.habits.find((x) => x.id === id)
    if (!h) return
    h.log = h.log || {}
    if (h.log[d] === v) delete h.log[d]
    else { h.log[d] = v; logged = true }
  })
  if (logged) {
    const s = getS(), h = s.habits.find((x) => x.id === id), idn = idById(s, h?.identity)
    if (idn) toast('A vote for ' + idn.name + '.')
    celebrate(d)
  }
}
/** Tracker square: full → minimum (if the habit has one) → clear. */
export function cycleHabit(id: string, d: DateStr) {
  update((st) => {
    const h = st.habits.find((x) => x.id === id)
    if (!h) return
    h.log = h.log || {}
    const c = h.log[d]
    if (!c) h.log[d] = 1
    else if (c !== 'm' && h.min) h.log[d] = 'm'
    else delete h.log[d]
  })
  if (getS().habits.find((x) => x.id === id)?.log[d] === 1) celebrate(d)
}
export function togglePrio(d: DateStr, i: number) {
  update((st) => { const p = (st.prio[d] = st.prio[d] || { items: ['', '', ''], done: [] }); p.done = p.done || []; p.done[i] = !p.done[i] })
}
export function setPrio(d: DateStr, i: number, v: string) {
  update((st) => { const p = (st.prio[d] = st.prio[d] || { items: ['', '', ''], done: [] }); p.items[i] = v })
}
export function toggleWorkout(id: string, d: DateStr) {
  update((st) => { const w = st.workouts.find((x) => x.id === id); if (w) { w.log = w.log || {}; if (w.log[d]) delete w.log[d]; else w.log[d] = 1 } })
}
export function setWell(d: DateStr, k: 'mood' | 'energy' | 'water' | 'sleep', v: number | undefined) {
  update((st) => { const w = (st.well[d] = st.well[d] || {}); if (k === 'mood' && w.mood === v) w.mood = undefined; else (w as any)[k] = v; if (k === 'energy') w.e100 = 1 })
}
export function weekItem(ws: DateStr, list: 'todo' | 'goals', fn: (items: { id: string; text: string; done?: boolean }[]) => void) {
  update((st) => fn(ensureWeek(st, ws)[list]))
}
export function monthTodo(m: string, fn: (items: { id: string; text: string; done?: boolean }[]) => void) {
  update((st) => fn(ensureMonth(st, m).todo))
}
export function markDone(kind: string, id: string, d: DateStr, occ?: DateStr) {
  if (kind === 'prio') update((st) => { const p = (st.prio[d] = st.prio[d] || { items: ['', '', ''], done: [] }); p.done = p.done || []; p.done[+id] = true })
  else if (kind === 'habit') { update((st) => { const h = st.habits.find((x) => x.id === id); if (h) { h.log = h.log || {}; h.log[d] = 1 } }); celebrate(d) }
  else if (kind === 'task') update((st) => {
    const k = st.tasks.find((t) => t.id === id)
    if (!k) return
    if (isRep(k)) { k.doneDates = k.doneDates || {}; k.doneDates[occ || d] = 1 } else { k.done = true; k.doneOn = today() }
  })
  else if (kind === 'self') update((st) => { const l = (st.selfLog[d] = st.selfLog[d] || []); if (!l.includes(id)) l.push(id) })
  else if (kind === 'dopa') update((st) => { const l = (st.dopaLog[d] = st.dopaLog[d] || []); if (!l.includes(id)) l.push(id) })
}
