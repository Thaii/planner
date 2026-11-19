/** Greeting that follows the clock: morning 5–11, afternoon 12–16, evening from 17 until 5am. */
export function greeting(name: string, now = new Date()) {
  const h = now.getHours()
  const g = h >= 5 && h < 12 ? 'Good morning' : h >= 12 && h < 17 ? 'Good afternoon' : 'Good evening'
  return g + (name ? ', ' + name : '') + '.'
}

/** "Thai's Planner", or "Your Planner" until a name is set. */
export function plannerName(name: string) {
  const n = name.trim()
  return n ? `${n}'s` : 'Your'
}
