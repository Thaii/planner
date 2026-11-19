import { closeSheet, openSheet } from '@/components/sheet'
import { Button } from '@/components/ui/button'
import { startFive } from '@/components/five'
import { getS, update } from './store'
import { today } from './date'
import { nextUp } from './logic'
import { pick } from './utils'
import type { DopaItem, SelfCare } from './types'

export const COURSES: [DopaItem['course'], string, string, string][] = [
  ['app', 'Appetizers', '🥟', 'Quick hits, 5 minutes or less. Good for a reset between tasks.'],
  ['main', 'Mains', '🍲', 'Bigger, more filling things that leave you feeling good after.'],
  ['side', 'Sides', '🥗', 'Pair these with a boring task to make it bearable.'],
  ['dessert', 'Desserts', '🍰', 'Tempting but easy to overdo. Always on a timer.'],
  ['special', 'Specials', '✨', 'Occasional treats to plan and look forward to.'],
]
export const TIERS: [SelfCare['tier'], string, string][] = [['quick', 'Quick', '5–10 min'], ['medium', 'Medium', '20–30 min'], ['big', 'Big', 'an hour or more']]

const logIn = (key: 'dopaLog' | 'selfLog', id: string, toggle = true) =>
  update((d) => { const t = today(), l = (d[key][t] = d[key][t] || []), i = l.indexOf(id); if (i >= 0) { if (toggle) l.splice(i, 1) } else l.push(id) })
export const dpDone = (id: string, d = today()) => (getS().dopaLog[d] || []).includes(id)
export const scDone = (id: string, d = today()) => (getS().selfLog[d] || []).includes(id)
export const logDopa = (id: string) => logIn('dopaLog', id)
export const logSelf = (id: string) => logIn('selfLog', id)

export function dpPick(course?: DopaItem['course'], not?: string) {
  const pool = getS().dopa.filter((i) => (course ? i.course === course : i.course !== 'dessert' && i.course !== 'special') && i.id !== not)
  const fresh = pool.filter((i) => !dpDone(i.id))
  return pick(fresh.length ? fresh : pool)
}
export function scPick(tier?: SelfCare['tier'], not?: string) {
  const pool = getS().selfcare.filter((i) => (!tier || i.tier === tier) && i.id !== not)
  const fresh = pool.filter((i) => !scDone(i.id))
  return pick(fresh.length ? fresh : pool)
}

export function showDopa(course?: DopaItem['course'], not?: string) {
  const item = dpPick(course, not)
  if (!item) return
  const c = COURSES.find((x) => x[0] === item.course)!
  const pairWithNext = () => {
    logIn('dopaLog', item.id, false); closeSheet()
    const n = nextUp(getS(), today())
    if (n) startFive({ kind: n.kind, id: n.id, occ: n.occ, title: n.title, lead: 'With a side of: ' + item.text })
  }
  openSheet(
    <div>
      <div className="lbl text-accent">{c[2]} {c[1]}</div>
      <h3 className="mt-2 mb-1 text-[28px]">{item.text}</h3>
      <p className="mt-0 text-[13px] text-mute">
        {item.course === 'side' ? 'Pair it with your next task and the task gets easier to start.' : item.course === 'dessert' ? `Enjoy it, on a ${item.mins || 15}-minute timer so it stays a treat.` : item.mins ? item.mins + ' minutes.' : ''}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.course === 'side' ? <Button variant="primary" onClick={pairWithNext}>Pair it with next up</Button>
          : item.mins ? <Button variant="primary" onClick={() => { closeSheet(); startFive({ kind: 'dopa', id: item.id, title: item.text, mins: item.mins, lead: item.course === 'dessert' ? 'Enjoy it. The timer will tell you when.' : 'Enjoy this one.' }) }}>Start {item.mins}-min timer</Button> : null}
        <Button onClick={() => { logIn('dopaLog', item.id, false); closeSheet() }}>I did it</Button>
        <Button onClick={() => showDopa(course, item.id)}>Pick again</Button>
      </div>
    </div>, 'Dopamine menu pick')
}

export function showSelfCare(tier?: SelfCare['tier'], not?: string) {
  const item = scPick(tier, not)
  if (!item) return
  openSheet(
    <div>
      <div className="lbl text-accent">Your pick{tier ? ' · ' + TIERS.find((x) => x[0] === tier)![1].toLowerCase() : ''}</div>
      <h3 className="mt-2 mb-1 text-[28px]">{item.text}</h3>
      <p className="mt-0 text-[13px] text-mute">{item.mins ? item.mins + ' minutes. ' : ''}Nothing else needs doing while you do this.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.mins > 0 && <Button variant="primary" onClick={() => { closeSheet(); startFive({ kind: 'self', id: item.id, title: item.text, mins: item.mins, lead: 'Time for you. Nothing else needs doing.' }) }}>Start {item.mins}-min timer</Button>}
        <Button onClick={() => { logIn('selfLog', item.id, false); closeSheet() }}>I did it</Button>
        <Button onClick={() => showSelfCare(tier, item.id)}>Pick again</Button>
      </div>
    </div>, 'Self-care pick')
}
