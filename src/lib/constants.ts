import type { Repeat, Freq } from './types'

export const REPEATS: [Repeat, string][] = [['none', 'Does not repeat'], ['daily', 'Daily'], ['weekdays', 'Weekdays'], ['weekly', 'Weekly'], ['fortnightly', 'Fortnightly'], ['monthly', 'Monthly'], ['yearly', 'Yearly']]
export const FREQS: [Freq, string][] = [['daily', 'Daily'], ['weekly', 'Weekly'], ['fortnightly', 'Fortnightly'], ['monthly', 'Monthly'], ['quarterly', 'Quarterly']]
export const MOODS = ['😞', '😕', '😐', '🙂', '😄']
export const MOODW = ['', 'Low', 'Meh', 'Okay', 'Good', 'Great']

export const ACCENTS: Record<string, [string, string]> = {
  blush: ['Blush', '#d4848f'], sage: ['Sage', '#7f9c7a'], cornflower: ['Cornflower', '#6f8fd6'], lilac: ['Lilac', '#9f88c8'], honey: ['Honey', '#cf9c3f'],
  peach: ['Peach', '#e0916b'], seafoam: ['Seafoam', '#55a39b'], mocha: ['Mocha', '#9a7b66'], graphite: ['Graphite', '#6b7280'],
}

export interface Palette { n: string; d: string; bg: string; card: string; ink: string; mute: string; line: string; soft: string; field?: string; accent?: string; lockAccent?: boolean
  /** Part of the Cute style; `pure` keeps the accent exactly as given at night (no dimming). */
  cute?: boolean; pure?: boolean
  /** Text colour on the accent, when white wouldn't read (e.g. a butter-yellow accent). */
  onAccent?: string }

/** Cute style themes: soft pastels by day, two cosy nights. */
export const CUTE_DAY: Record<string, Palette> = {
  cuteBlush: { n: 'Strawberry milk', d: 'Cream and blush', cute: true, bg: '#fff8f3', card: '#ffffff', ink: '#4a3b45', mute: '#7a6872', line: '#f1e2da', soft: '#fcefea', field: '#fff5f0', accent: '#ea95b4' },
  cuteLilac: { n: 'Lilac dream', d: 'Lavender and mint', cute: true, bg: '#f8f5ff', card: '#ffffff', ink: '#3f3651', mute: '#706685', line: '#e7e0f5', soft: '#f1ecfb', field: '#f8f5ff', accent: '#7e57c2' },
  cuteMint: { n: 'Mint tea', d: 'Fresh mint and cream', cute: true, bg: '#f3faf5', card: '#ffffff', ink: '#34443b', mute: '#66786d', line: '#d9eee1', soft: '#e9f6ee', field: '#f3faf5', accent: '#7cc5a0' },
  cutePeach: { n: 'Peach sorbet', d: 'Peach and apricot', cute: true, bg: '#fff7f1', card: '#ffffff', ink: '#4a3a33', mute: '#7d6a60', line: '#f5e0d2', soft: '#fdede2', field: '#fff5ee', accent: '#f0a07f' },
  cuteBlue: { n: 'Blueberry milk', d: 'Soft sky blue', cute: true, bg: '#f4f7ff', card: '#ffffff', ink: '#343c52', mute: '#69718a', line: '#dde5f6', soft: '#eaf0fc', field: '#f4f7ff', accent: '#88a9e6' },
  cuteLemon: { n: 'Lemon meringue', d: 'Butter yellow and cream', cute: true, bg: '#fffcef', card: '#ffffff', ink: '#48412c', mute: '#7a7258', line: '#f1e8cb', soft: '#faf4da', field: '#fffcf0', accent: '#ecc95f', onAccent: '#48412c' },
}
export const CUTE_NIGHT: Record<string, Palette> = {
  cutePlum: { n: 'Cosy night', d: 'Plum and rose', cute: true, pure: true, bg: '#241c2a', card: '#33293b', ink: '#f7ebf1', mute: '#c7b6c1', line: '#46394f', soft: '#3e3346', field: '#2b2231', accent: '#f4a7c0' },
  cuteHaze: { n: 'Lavender haze', d: 'Dusky lilac', cute: true, pure: true, bg: '#1f1c2e', card: '#2b2740', ink: '#f2eefc', mute: '#bdb5d8', line: '#3e3958', soft: '#363150', field: '#24213a', accent: '#c9b6f6' },
  cuteStarry: { n: 'Starry night', d: 'Navy and lamplight', cute: true, pure: true, bg: '#151b2e', card: '#1f2840', ink: '#eef2fb', mute: '#b4bed6', line: '#33405f', soft: '#2a3452', field: '#19203a', accent: '#ffd27a' },
}
export const DAY_THEMES: Record<string, Palette> = {
  linen: { n: 'Linen', d: 'Warm paper', bg: '#f7f4ef', card: '#ffffff', ink: '#2b2a28', mute: '#7d7870', line: '#e9e4dc', soft: '#f3efe9' },
  paper: { n: 'Paper', d: 'Crisp and neutral', bg: '#f5f6f8', card: '#ffffff', ink: '#1f2328', mute: '#6b7280', line: '#e4e7eb', soft: '#eff1f4' },
  sage: { n: 'Sage morning', d: 'Soft green calm', bg: '#edf1ea', card: '#fbfcf9', ink: '#26302a', mute: '#6b786e', line: '#dbe3d7', soft: '#e5ebe1', accent: '#6f9068' },
  coastal: { n: 'Coastal', d: 'Cool sea air', bg: '#edf2f6', card: '#fbfdfe', ink: '#1e2a34', mute: '#647788', line: '#d9e3ea', soft: '#e4ebf1', accent: '#5b86b0' },
  peach: { n: 'Peach', d: 'Rosy and warm', bg: '#fbf0ea', card: '#fffaf7', ink: '#3a2a24', mute: '#8a7066', line: '#f0ddd3', soft: '#f7e7df', accent: '#d98466' },
  butter: { n: 'Butter', d: 'Sunny, easy', bg: '#f9f5e6', card: '#fffdf5', ink: '#33301f', mute: '#7d7860', line: '#ebe3c8', soft: '#f3ecd6', accent: '#c4973a' },
  lavender: { n: 'Lavender', d: 'Light and dreamy', bg: '#f3f1f8', card: '#fdfcff', ink: '#2a2635', mute: '#767087', line: '#e3dfee', soft: '#ebe8f3', accent: '#8c7bc4' },
}
export const NIGHT_THEMES: Record<string, Palette> = {
  ember: { n: 'Ember', d: 'Warm and dim', bg: '#16130f', card: '#1f1b17', ink: '#e3d9cc', mute: '#988b7d', line: '#2f2924', soft: '#28231e', field: '#1a1713' },
  midnight: { n: 'Midnight', d: 'Deep navy', bg: '#0e1320', card: '#151b2a', ink: '#d9e0ee', mute: '#8490a8', line: '#242c3f', soft: '#1b2233', field: '#111726', accent: '#7f9be0' },
  forest: { n: 'Forest', d: 'Quiet green', bg: '#0f1511', card: '#162019', ink: '#d7e3d6', mute: '#859788', line: '#243027', soft: '#1c271f', field: '#121a14', accent: '#7fae86' },
  plum: { n: 'Plum', d: 'Velvet purple', bg: '#16111a', card: '#1f1824', ink: '#e5dae8', mute: '#9a899e', line: '#312737', soft: '#281f2d', field: '#1a141e', accent: '#b48fc9' },
  slate: { n: 'Slate', d: 'Neutral graphite', bg: '#131416', card: '#1b1c1f', ink: '#e1e1df', mute: '#8e8f92', line: '#2b2c30', soft: '#232427', field: '#17181a' },
  lamp: { n: 'Lamp', d: 'Low blue light for bedtime', bg: '#120c07', card: '#1a110b', ink: '#e6c6a0', mute: '#9c7b5b', line: '#2b1e13', soft: '#22170e', field: '#160f09', accent: '#c98a4b', lockAccent: true },
  ocean: { n: 'Deep ocean', d: 'Teal and dark', bg: '#0b1517', card: '#111e21', ink: '#d3e6e6', mute: '#7d9a9b', line: '#1f3134', soft: '#17272a', field: '#0e1a1c', accent: '#5fb3ad' },
}
export const PAPERS: [string, string][] = [['plain', 'Plain'], ['dot', 'Dot grid'], ['grid', 'Grid'], ['lined', 'Lined']]

export const CARDS_DEF: [string, string][] = [
  ['nextup', 'Next up'], ['identity', "Who I'm becoming"], ['schedule', "The day's schedule"], ['priorities', 'Top 3 priorities'], ['tasks', 'To-do list'],
  ['planned', 'From your week and month'], ['meals', 'Meals'], ['grocery', 'Grocery list'], ['habits', 'Habits'], ['checkin', 'Check-in'],
  ['intention', 'Intention'], ['gratitude', 'Gratitude'], ['upcoming', 'Upcoming'], ['home', 'Home jobs'], ['goals', 'Goals'],
  ['meds', 'Medications'], ['braindump', 'Brain dump'], ['dopamine', 'Dopamine menu'], ['note', 'Notebook'],
]
export const CARD_IDS = CARDS_DEF.map((c) => c[0])
/** The cards a brand-new planner starts with; the rest are a tap away in "Add to your day". */
export const MINIMAL = ['nextup', 'schedule', 'priorities', 'tasks', 'checkin']

export const PERIOD_WORD: Record<Freq, string> = { daily: 'today', weekly: 'this week', fortnightly: 'this fortnight', monthly: 'this month', quarterly: 'this quarter' }
Object.assign(DAY_THEMES, CUTE_DAY)
Object.assign(NIGHT_THEMES, CUTE_NIGHT)
