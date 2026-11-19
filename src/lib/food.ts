import { toast } from 'sonner'
import { getS, update } from './store'
import { range } from './date'
import { uid } from './utils'

/** Put names on the grocery list, skipping anything already on it or marked In in the pantry. */
export function addToGrocery(names: string[]) {
  const s = getS()
  const have = new Set(s.grocery.filter((g) => !g.done).map((g) => g.name.toLowerCase()))
  const inP = s.pantry.filter((p) => p.status === 'in').map((p) => p.name.toLowerCase())
  let added = 0, skipped = 0
  const add: string[] = []
  names.map((n) => n.trim()).filter(Boolean).forEach((n) => {
    const l = n.toLowerCase()
    if (inP.some((p) => l === p || (p.length > 3 && l.includes(p)))) { skipped++; return }
    if (have.has(l)) return
    have.add(l); add.push(n); added++
  })
  update((d) => { add.forEach((name) => d.grocery.push({ id: uid(), name, done: false })) })
  toast(`Added ${added} item${added === 1 ? '' : 's'}${skipped ? ` · left off ${skipped} you have in` : ''}`)
}

export const ingredients = (ing?: string) => (ing || '').split('\n').map((x) => x.trim()).filter(Boolean)

export function weekToGrocery(ws: string) {
  const s = getS(), names = new Set<string>()
  range(ws, 7).forEach((d) => Object.values(s.meals[d] || {}).forEach((m) => {
    const r = s.recipes.find((r) => r.name.toLowerCase() === String(m).toLowerCase())
    if (r) ingredients(r.ing).forEach((i) => names.add(i))
  }))
  if (!names.size) return toast('No meals this week match a saved recipe')
  addToGrocery([...names])
}

export function copyLastWeek(ws: string) {
  let n = 0
  update((d) => {
    range(ws, 7).forEach((day) => {
      const [y, m, dd] = day.split('-').map(Number)
      const prev = new Date(y, m - 1, dd - 7)
      const pk = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-${String(prev.getDate()).padStart(2, '0')}`
      const src = d.meals[pk]; if (!src) return
      const cur = (d.meals[day] = d.meals[day] || {})
      ;(['breakfast', 'lunch', 'dinner', 'snacks'] as const).forEach((k) => { if (!cur[k] && src[k]) { cur[k] = src[k]; n++ } })
    })
  })
  toast(n ? `Copied ${n} meals into the empty slots` : 'Nothing to copy – last week is empty or this week is full')
}

export async function copyText(text: string, ok: string) {
  try { await navigator.clipboard.writeText(text); toast(ok); return true } catch { return false }
}

export const CURR: [string, string][] = [['AUD', 'A$'], ['EUR', '€'], ['GBP', '£'], ['USD', 'US$'], ['NZD', 'NZ$']]
export const money = (n: number, c = 'AUD') => {
  try { return new Intl.NumberFormat('en-AU', { style: 'currency', currency: c, currencyDisplay: 'narrowSymbol' }).format(n || 0) } catch { return (n || 0).toFixed(2) }
}
