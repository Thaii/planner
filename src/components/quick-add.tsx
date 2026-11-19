import type { ComponentType } from 'react'
import { CheckSquare, CalendarClock, Repeat2, Target, NotebookPen, ShoppingCart } from 'lucide-react'
import { closeSheet, openForm, openSheet } from './sheet'
import { eventForm, goalForm, habitForm, taskForm } from '@/lib/forms'
import { useUI, go } from '@/lib/ui'
import { today } from '@/lib/date'
import { update } from '@/lib/store'
import { uid } from '@/lib/utils'
import { Button } from './ui/button'

export function quickAdd() {
  const ui = useUI.getState(), day = ui.view === 'day' ? ui.date : today()
  const items: [string, ComponentType<{ className?: string }>, () => void][] = [
    ['To-do', CheckSquare, () => taskForm(undefined, day)],
    ['Event', CalendarClock, () => eventForm(undefined, day)],
    ['Habit', Repeat2, () => habitForm()],
    ['Goal', Target, () => goalForm()],
    ['Brain dump', NotebookPen, () => openForm({ title: 'Brain dump', fields: [{ k: 't', l: "What's on your mind?", t: 'textarea', rows: 3 }], onSave: (v) => { if (!v.t) return false; update((d) => { d.inbox.push({ id: uid(), text: v.t }) }); go('today') } })],
    ['Grocery', ShoppingCart, () => openForm({ title: 'Add to the grocery list', fields: [{ k: 'n', l: 'Items, one per line', t: 'textarea', rows: 4 }], onSave: (v) => update((d) => { String(v.n).split('\n').map((x) => x.trim()).filter(Boolean).forEach((name) => d.grocery.push({ id: uid(), name, done: false })) }) })],
  ]
  openSheet(
    <div>
      <h3 className="mb-3 text-[21px]">Quick add</h3>
      <div className="grid grid-cols-3 gap-2.5">
        {items.map(([n, Icon, run]) => (
          <button key={n} onClick={run} className="flex flex-col items-center gap-1.5 rounded-[14px] border border-line bg-soft px-1.5 py-3.5 text-[13.5px] font-medium">
            <Icon className="size-5.5 text-accent" />{n}
          </button>
        ))}
      </div>
      <div className="mt-4 flex"><span className="flex-1" /><Button onClick={closeSheet}>Close</Button></div>
    </div>, 'Quick add')
}
