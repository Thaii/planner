import type { DayPart, Settings } from './types'

type G = Pick<Settings, 'name'> & Partial<Pick<Settings, 'greetings' | 'dayParts' | 'greeting'>>

export const PARTS: [DayPart, string][] = [['morning', 'Morning'], ['afternoon', 'Afternoon'], ['evening', 'Evening']]
export const STANDARD: Record<DayPart, string> = { morning: 'Good morning, {name}.', afternoon: 'Good afternoon, {name}.', evening: 'Good evening, {name}.' }
export const DEFAULT_PARTS: Record<DayPart, number> = { morning: 5, afternoon: 12, evening: 17 }

/** Which part of the day it is. Evening runs past midnight until morning starts. */
export function dayPart(st: Pick<G, 'dayParts'>, now = new Date()): DayPart {
  const p = { ...DEFAULT_PARTS, ...(st.dayParts || {}) }, h = now.getHours()
  return h >= p.morning && h < p.afternoon ? 'morning' : h >= p.afternoon && h < p.evening ? 'afternoon' : 'evening'
}

/** Put the name in, and tidy up if there's no name ("Hi, ." → "Hi."). */
export const fill = (t: string, name: string) =>
  t.replace(/\{name\}/gi, name || '').replace(/\s+([,.!?])/g, '$1').replace(/,\s*([.!?]|$)/, '$1').replace(/\s{2,}/g, ' ').trim()

// One random pick per part of the day per app session, so it doesn't change every minute.
const picks = new Map<string, string>()

export function greeting(st: G, now = new Date()) {
  const part = dayPart(st, now)
  const list = (st.greetings?.[part] || []).map((x) => x.trim()).filter(Boolean)
  const legacy = !st.greetings && (st.greeting || '').trim()
  let t: string
  if (list.length) {
    const key = part + '|' + list.join('\n')
    t = picks.get(key) ?? list[Math.floor(Math.random() * list.length)]
    picks.set(key, t)
  } else t = legacy || STANDARD[part]
  return fill(t, st.name)
}

/** Title as [first words, last word] – the last word is drawn in the accent colour. */
export function plannerTitle(st: Pick<Settings, 'name' | 'nameInTitle'> & Partial<Pick<Settings, 'titleMode' | 'customTitle'>>): [string, string] {
  const n = (st.name || '').trim()
  const mode = st.titleMode || (st.nameInTitle === false ? 'life' : 'name')
  if (mode === 'custom' && (st.customTitle || '').trim()) {
    const w = st.customTitle!.trim().split(/\s+/)
    return w.length > 1 ? [w.slice(0, -1).join(' '), w[w.length - 1]] : ['', w[0]]
  }
  return mode === 'name' && n ? [`${n}'s`, 'Planner'] : ['Life', 'Planner']
}
