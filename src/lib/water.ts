import type { Settings } from './types'

export const GLASSES: [number, string][] = [[200, 'Cup · 200 ml'], [250, 'Glass · 250 ml'], [330, 'Can · 330 ml'], [400, 'Big glass · 400 ml'], [500, 'Bottle · 500 ml'], [600, 'Bottle · 600 ml'], [750, 'Bottle · 750 ml'], [1000, 'Bottle · 1 L']]
export const GOALS = [1500, 2000, 2500, 3000, 3500]

/** 750 → "750 ml", 2000 → "2 L", 1750 → "1.75 L" */
export const ml = (n: number) => n < 1000 ? Math.round(n) + ' ml' : +(n / 1000).toFixed(2) + ' L'
/** How many drops make the goal (each drop is one glass), kept to a size that fits on a phone. */
export const dropsFor = (goal: number, glass: number) => Math.min(16, Math.max(1, Math.ceil(goal / glass)))
export const glassMl = (st: Pick<Settings, 'glass'>) => st.glass || 250
