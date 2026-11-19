import type { Settings } from './types'

/** Time-based greeting: morning 5–11, afternoon 12–16, evening from 17 until 5am. A custom greeting replaces it. */
export function greeting(st: Pick<Settings, 'name' | 'greeting'>, now = new Date()) {
  const custom = (st.greeting || '').trim()
  if (custom) return custom.replace(/\{name\}/gi, st.name || '').replace(/\s+([,.!?])/g, '$1').replace(/,\s*([.!?]|$)/, '$1')
  const h = now.getHours()
  const g = h >= 5 && h < 12 ? 'Good morning' : h >= 12 && h < 17 ? 'Good afternoon' : 'Good evening'
  return g + (st.name ? ', ' + st.name : '') + '.'
}

/** Title: "Thai's Planner" when a name is set and shown, otherwise "Life Planner". */
export function plannerTitle(st: Pick<Settings, 'name' | 'nameInTitle'>) {
  const n = (st.name || '').trim()
  return n && st.nameInTitle !== false ? [`${n}'s`, 'Planner'] : ['Life', 'Planner']
}
