import { openForm } from './sheet'
import { getS, update } from '@/lib/store'
import { dropsFor, GLASSES, GOALS, ml } from '@/lib/water'

export function waterForm() {
  const st = getS().settings
  const goal = st.waterGoal || 2000, glass = st.glass || 250
  const goals = GOALS.includes(goal) ? GOALS : [...GOALS, goal].sort((a, b) => a - b)
  const glasses = GLASSES.some(([g]) => g === glass) ? GLASSES : [...GLASSES, [glass, ml(glass)] as [number, string]].sort((a, b) => a[0] - b[0])
  openForm({
    title: 'Your water goal',
    fields: [
      { k: 'goal', l: 'How much a day', t: 'select', o: goals.map((g) => [g, ml(g)] as [number, string]), v: goal, half: true },
      { k: 'glass', l: 'What you drink from', t: 'select', o: glasses, v: glass, half: true },
      { k: 'custom', l: 'Or type your own amount (ml)', t: 'number', min: 250, max: 6000, step: '50', ph: 'e.g. 2750' },
    ],
    extra: (v) => {
      const g = +v.custom || +v.goal || goal, gl = +v.glass || glass
      return <p className="mt-0 text-[13px] text-mute">That's <b className="text-ink">{dropsFor(g, gl)} drops</b> a day – tap one each time you finish a {ml(gl)} {gl >= 500 ? 'bottle' : 'glass'}. Most adults aim for about 2 L, more in hot weather or when you exercise.</p>
    },
    onSave: (v) => {
      const g = +v.custom || +v.goal
      if (!g || g < 250) return false
      update((d) => { d.settings.waterGoal = g; d.settings.glass = +v.glass || 250; d.settings.water = dropsFor(g, d.settings.glass) })
    },
  })
}
