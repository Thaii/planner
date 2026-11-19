import { X } from 'lucide-react'
import { create } from 'zustand'
import { toast } from 'sonner'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { CommitInput, InlineAdd, Textarea } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import { PageHead } from '@/components/bits'
import { openForm, openSheet, closeSheet } from '@/components/sheet'
import { getS, update, undoable, useS } from '@/lib/store'
import { addD, dow, DOWN, fmt, range, t12, today, weekOrder } from '@/lib/date'
import { labColor, weekStart, wsDay } from '@/lib/logic'
import { toggleWorkout } from '@/lib/actions'
import { addToGrocery, copyLastWeek, copyText, ingredients, weekToGrocery } from '@/lib/food'
import type { Workout } from '@/lib/types'
import { cn, uid } from '@/lib/utils'

type Tab = 'plan' | 'recipes' | 'grocery' | 'workouts'
export const useFood = create<{ tab: Tab; week: string | null }>(() => ({ tab: 'plan', week: null }))

const SLOTS = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner']] as const

function recipeForm(id?: string) {
  const r = id ? getS().recipes.find((x) => x.id === id) : undefined
  openForm({
    title: r ? 'Edit recipe' : 'New recipe',
    fields: [
      { k: 'name', l: 'Name', v: r?.name },
      { k: 'serves', l: 'Serves', v: r?.serves, half: true },
      { k: 'time', l: 'Time', v: r?.time, ph: 'e.g. 30 min', half: true },
      { k: 'ing', l: 'Ingredients, one per line', t: 'textarea', rows: 6, v: r?.ing },
      { k: 'method', l: 'Method', t: 'textarea', rows: 5, v: r?.method },
      { k: 'link', l: 'Link', v: r?.link },
    ],
    onSave: (v) => {
      if (!v.name) return false
      update((d) => { const x = id && d.recipes.find((z) => z.id === id); if (x) Object.assign(x, v); else d.recipes.push({ id: uid(), ...v } as never) })
    },
    onDelete: id ? () => undoable('Recipe deleted', (d) => { d.recipes = d.recipes.filter((z) => z.id !== id) }) : undefined,
  })
}

export function workoutForm(id?: string) {
  const w = id ? getS().workouts.find((x) => x.id === id) : undefined
  openForm({
    title: w ? 'Edit workout' : 'New workout',
    fields: [
      { k: 'name', l: 'Workout', v: w?.name, ph: 'Pilates, 5k run, upper body…' },
      { k: 'days', l: 'Days', t: 'days', v: w?.days || [1, 3, 5] },
      { k: 'time', l: 'Time', t: 'time', v: w?.time, half: true },
      { k: 'dur', l: 'Minutes', t: 'number', min: 5, max: 300, v: w?.dur || 45, half: true },
      { k: 'label', l: 'Colour label', t: 'label', v: w?.label || 'health' },
      { k: 'notes', l: 'Details', t: 'textarea', rows: 2, v: w?.notes },
    ],
    onSave: (v) => {
      if (!v.name) return false
      update((d) => { const x = id && d.workouts.find((z) => z.id === id); if (x) Object.assign(x, v); else d.workouts.push({ id: uid(), log: {}, ...v } as Workout) })
    },
    onDelete: id ? () => undoable('Workout deleted', (d) => { d.workouts = d.workouts.filter((z) => z.id !== id) }) : undefined,
  })
}

export function GroceryCard() {
  const s = useS()
  const open = s.grocery.filter((g) => !g.done), dn = s.grocery.filter((g) => g.done)
  const setG = (id: string, fn: (g: { done: boolean }) => void) => update((d) => { const x = d.grocery.find((z) => z.id === id); if (x) fn(x) })
  return (
    <Card>
      <CardHeader title="Grocery list" action={dn.length ? <Button variant="link" className="text-[12.5px]" onClick={() => undoable(`Cleared ${dn.length} bought`, (d) => { d.grocery = d.grocery.filter((g) => !g.done) })}>Clear {dn.length} bought</Button> : null} />
      <div className="rows">
        {open.concat(dn).map((g) => (
          <div key={g.id} className={cn('row', g.done && 'done')}>
            <Check on={g.done} label={g.name} onClick={() => setG(g.id, (x) => { x.done = !x.done })} />
            <div className="tt flex-1">{g.name}</div>
            <button className="p-1 text-mute" aria-label={'Remove ' + g.name} onClick={() => update((d) => { d.grocery = d.grocery.filter((z) => z.id !== g.id) })}><X className="size-4" /></button>
          </div>
        ))}
        {!s.grocery.length && <Empty>Nothing on the list.</Empty>}
      </div>
      <InlineAdd placeholder="Add an item" onAdd={(t) => update((d) => { d.grocery.push({ id: uid(), name: t, done: false }) })} />
      <div className="mt-2.5 flex flex-wrap gap-2">
        <Button onClick={() => { const l = getS().pantry.filter((p) => p.status !== 'in').map((p) => p.name); if (!l.length) return void toast('Every staple is marked In'); addToGrocery(l) }}>Add Low/Out staples</Button>
        <Button onClick={async () => {
          const t = getS().grocery.filter((g) => !g.done).map((g) => '• ' + g.name).join('\n')
          if (!(await copyText(t, 'List copied'))) openSheet(<div><h3 className="mb-2 text-[21px]">Grocery list</h3><Textarea rows={10} readOnly value={t} /><div className="mt-3 flex justify-end"><Button onClick={closeSheet}>Close</Button></div></div>, 'Grocery list')
        }}>Copy list</Button>
      </div>
    </Card>
  )
}

const PSTAT = { in: 'In', low: 'Low', out: 'Out' } as const
function PantryCard() {
  const s = useS()
  return (
    <Card>
      <CardHeader title="Pantry" action={<span className="text-[12.5px] text-mute">Tap In, Low or Out</span>} />
      <p className="mt-0 text-[13px] text-mute">The staples you keep in. When a recipe goes to your grocery list, anything marked In is left off.</p>
      <div className="rows">
        {s.pantry.map((p) => (
          <div key={p.id} className="row">
            <div className="tt flex-1">{p.name}</div>
            <button
              className={cn('rounded-full border px-2.5 py-0.5 text-[12px] font-semibold',
                p.status === 'in' ? 'border-[#7f9c7a] text-[#5d7d58]' : p.status === 'low' ? 'border-warn text-warn' : 'border-danger text-danger')}
              onClick={() => update((d) => { const x = d.pantry.find((z) => z.id === p.id)!; x.status = ({ in: 'low', low: 'out', out: 'in' } as const)[x.status] })}
            >{PSTAT[p.status]}</button>
            <button className="p-1 text-mute" aria-label={'Remove ' + p.name} onClick={() => update((d) => { d.pantry = d.pantry.filter((z) => z.id !== p.id) })}><X className="size-4" /></button>
          </div>
        ))}
      </div>
      <InlineAdd placeholder="Add a staple" onAdd={(t) => update((d) => { d.pantry.push({ id: uid(), name: t, status: 'in' }) })} />
    </Card>
  )
}

function MealPlan() {
  const s = useS()
  const ws = useFood((f) => f.week) || weekStart(s, today())
  const days = range(ws, 7), t = today()
  const names = s.recipes.map((r) => r.name)
  const setWeek = (n: number) => useFood.setState({ week: addD(ws, n) })
  return (
    <>
      <div className="mb-3 flex items-center gap-2">
        <Button size="icon" aria-label="Previous week" onClick={() => setWeek(-7)}>‹</Button>
        <h2 className="text-[22px]">{fmt(ws, { day: 'numeric', month: 'short' })} to {fmt(addD(ws, 6), { day: 'numeric', month: 'short' })}</h2>
        <Button size="icon" aria-label="Next week" onClick={() => setWeek(7)}>›</Button>
        {ws !== weekStart(s, t) && <Button size="mono" onClick={() => useFood.setState({ week: null })}>This week</Button>}
      </div>
      <Card className="mb-3">
        <CardHeader title="Weekly meal plan" action={<Button variant="link" className="text-[12.5px]" onClick={() => copyLastWeek(ws)}>Copy last week</Button>} />
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[640px] border-separate border-spacing-1 text-[13px]">
            <thead><tr><th />{days.map((d) => <th key={d} className={cn('lbl text-mute font-medium', d === t && 'text-accent')}>{DOWN[dow(d)]} {+d.slice(8)}</th>)}</tr></thead>
            <tbody>
              {SLOTS.map(([k, l]) => (
                <tr key={k}>
                  <td className="pr-1 text-[12.5px] text-mute">{l}</td>
                  {days.map((d) => (
                    <td key={d}>
                      <CommitInput list="recipeList" aria-label={`${l} ${fmt(d)}`} className="px-2 py-1.5 text-[13px]" value={(s.meals[d] || {})[k] || ''}
                        onCommit={(v) => update((st) => { st.meals[d] = { ...(st.meals[d] || {}), [k]: v.trim() } })} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <datalist id="recipeList">{names.map((n) => <option key={n} value={n} />)}</datalist>
        <div className="mt-2 flex flex-wrap gap-2"><Button onClick={() => weekToGrocery(ws)}>Send this week's recipes to the grocery list</Button></div>
        <p className="mb-0 text-[12.5px] text-mute">Type a saved recipe's name and its ingredients can go straight to your grocery list. Anything marked In in your pantry is left off.</p>
      </Card>
      <div className="grid gap-3 min-[760px]:grid-cols-2"><GroceryCard /><PantryCard /></div>
    </>
  )
}

function Recipes() {
  const s = useS()
  return (
    <Card>
      <CardHeader title="Recipes" action={<Button variant="link" className="text-[12.5px]" onClick={() => recipeForm()}>+ Recipe</Button>} />
      <div className="rows">
        {s.recipes.map((r) => (
          <div key={r.id} className="row">
            <button className="flex-1 text-left" onClick={() => recipeForm(r.id)}>
              <div className="tt">{r.name}</div>
              <div className="text-[12.5px] text-mute">{ingredients(r.ing).length} ingredients{r.time ? ' · ' + r.time : ''}{r.serves ? ' · serves ' + r.serves : ''}</div>
            </button>
            {r.link && <a className="text-[12.5px] text-accent underline" href={r.link} target="_blank" rel="noreferrer">Open</a>}
            <Button size="sm" onClick={() => addToGrocery(ingredients(r.ing))}>→ Grocery</Button>
          </div>
        ))}
      </div>
      {!s.recipes.length && <Empty>Save the meals you make again and again.</Empty>}
    </Card>
  )
}

function Workouts() {
  const s = useS()
  const t = today(), wk = range(weekStart(s, t), 7)
  return (
    <>
      <Card className="mb-3">
        <CardHeader title="Workout planner" action={<Button variant="link" className="text-[12.5px]" onClick={() => workoutForm()}>+ Workout</Button>} />
        <div className="rows">
          {s.workouts.map((w) => (
            <button key={w.id} className="row w-full text-left" onClick={() => workoutForm(w.id)}>
              <span className="h-8 w-1 rounded-full" style={{ background: labColor(s, w.label) || '#e0916b' }} />
              <div className="flex-1">
                <div className="tt">{w.name}</div>
                <div className="text-[12.5px] text-mute">{weekOrder(wsDay(s)).filter((i) => (w.days || []).includes(i)).map((i) => DOWN[i]).join(', ') || 'No days'}{w.time ? ' · ' + t12(w.time) : ''}{w.dur ? ' · ' + w.dur + ' min' : ''}</div>
              </div>
            </button>
          ))}
        </div>
        {!s.workouts.length && <Empty>Plan workouts on chosen days with a time and they land on your schedule.</Empty>}
      </Card>
      {!!s.workouts.length && (
        <Card>
          <CardHeader title="This week" action={<span className="text-[12.5px] text-mute">Tap to tick off</span>} />
          <div className="overflow-x-auto">
            <div className="grid min-w-[290px] items-center gap-1 sm:gap-1.5" style={{ gridTemplateColumns: 'minmax(70px,1.4fr) repeat(7, minmax(26px,1fr))' }}>
              <span />
              {wk.map((d) => <div key={d} className={cn('text-center text-[11px] leading-tight text-mute', d === t && 'font-bold text-accent')}>{DOWN[dow(d)]}<br />{+d.slice(8)}</div>)}
              {s.workouts.map((w) => [
                <div key={w.id} className="truncate text-[13px]">{w.name}</div>,
                ...wk.map((d) => (w.days || []).includes(dow(d))
                  ? <button key={w.id + d} aria-label={`${w.name} ${fmt(d)}`} aria-pressed={!!(w.log && w.log[d])} onClick={() => toggleWorkout(w.id, d)}
                      className={cn('mx-auto size-6.5 sm:size-7 rounded-lg border', w.log && w.log[d] ? 'border-accent bg-accent' : 'border-line bg-soft', d === t && 'ring-2 ring-accent/40')} />
                  : <span key={w.id + d} className="mx-auto size-1.5 rounded-full bg-line" />),
              ])}
            </div>
          </div>
        </Card>
      )}
    </>
  )
}

export function FoodPage() {
  const tab = useFood((f) => f.tab)
  return (
    <div>
      <PageHead crumb={'Live · ' + fmt(today(), { weekday: 'long', day: 'numeric', month: 'long' })} title="Food & fitness" />
      <Segmented value={tab} onChange={(v) => useFood.setState({ tab: v })} options={[['plan', 'Meal plan'], ['recipes', 'Recipes'], ['grocery', 'Grocery & pantry'], ['workouts', 'Workouts']]} />
      {tab === 'plan' && <MealPlan />}
      {tab === 'recipes' && <Recipes />}
      {tab === 'grocery' && <div className="grid gap-3 min-[760px]:grid-cols-2"><GroceryCard /><PantryCard /></div>}
      {tab === 'workouts' && <Workouts />}
    </div>
  )
}
