import { cleanId } from '@/lib/logic'
import { IdentityNameHelper, IdentityDoesHelper } from '@/components/identity-helper'
import { toast } from 'sonner'
import { WhyHelper } from '@/components/why-helper'
import { accentColor } from './theme'
import { openForm } from '@/components/sheet'
import { getS, update } from './store'
import { fmt, today, type DateStr } from './date'
import { REPEATS } from './constants'
import { cap, uid } from './utils'
import type { Repeat } from './types'

const del = <T extends { id: string }>(arr: T[], id: string) => { const i = arr.findIndex((x) => x.id === id); if (i >= 0) arr.splice(i, 1) }

export function taskForm(id?: string, date?: DateStr) {
  const t = id ? getS().tasks.find((x) => x.id === id) : undefined
  openForm({
    title: t ? 'Edit to-do' : 'New to-do',
    fields: [
      { k: 'title', l: 'To-do', v: t?.title, ph: 'What needs doing?' },
      { k: 'date', l: 'Date (blank = anytime)', t: 'date', v: t ? t.date : date ?? today(), half: true },
      { k: 'time', l: 'Time (optional)', t: 'time', v: t?.time, half: true },
      { k: 'repeat', l: 'Repeat', t: 'select', o: REPEATS, v: t?.repeat || 'none', half: true },
      { k: 'label', l: 'Colour label', t: 'label', v: t?.label, half: true },
      { k: 'step', l: 'First physical step', v: t?.step, ph: 'e.g. open the laptop and the expenses folder' },
      { k: 'notes', l: 'Notes', t: 'textarea', rows: 2, v: t?.notes },
    ],
    onSave: (v) => {
      if (!v.title) return false
      if (v.repeat !== 'none' && !v.date) v.date = today()
      update((d) => { const x = id && d.tasks.find((k) => k.id === id); if (x) Object.assign(x, v); else d.tasks.push({ id: uid(), order: Date.now(), ...v } as any) })
    },
    onDelete: id ? () => update((d) => del(d.tasks, id)) : undefined,
  })
}

export function eventForm(id?: string, date?: DateStr) {
  const e = id ? getS().events.find((x) => x.id === id) : undefined
  openForm({
    title: e ? 'Edit event' : 'New event',
    fields: [
      { k: 'title', l: 'Title', v: e?.title, ph: 'Appointment, birthday, catch-up…' },
      { k: 'date', l: 'Date', t: 'date', v: e?.date || date || today(), half: true },
      { k: 'repeat', l: 'Repeat', t: 'select', o: REPEATS, v: e?.repeat || 'none', half: true },
      { k: 'time', l: 'Start', t: 'time', v: e?.time, half: true },
      { k: 'end', l: 'End', t: 'time', v: e?.end, half: true, after: 'time' },
      { k: 'label', l: 'Colour label', t: 'label', v: e?.label },
      { k: 'loc', l: 'Where', v: e?.loc },
      { k: 'notes', l: 'Notes', t: 'textarea', rows: 2, v: e?.notes },
    ],
    onSave: (v) => {
      if (!v.title || !v.date) return false
      update((d) => { const x = id && d.events.find((k) => k.id === id); if (x) Object.assign(x, v); else d.events.push({ id: uid(), ...v, repeat: v.repeat as Repeat } as any) })
    },
    onDelete: id ? () => update((d) => del(d.events, id)) : undefined,
  })
}

export function mealForm(date: DateStr) {
  const s = getS(), m = s.meals[date] || {}, names = s.recipes.map((r) => r.name)
  openForm({
    title: 'Meals · ' + fmt(date, { weekday: 'long', day: 'numeric', month: 'short' }),
    fields: (['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((k) => ({ k, l: cap(k), v: m[k], list: names })),
    onSave: (v) => update((d) => { d.meals[date] = v }),
  })
}

export function habitForm(id?: string) {
  const s = getS(), h = id ? s.habits.find((x) => x.id === id) : undefined
  openForm({
    title: h ? 'Edit habit' : 'New habit',
    fields: [
      { k: 'name', l: 'Habit', v: h?.name, ph: 'e.g. Read 20 pages', help: () => <p className="mt-1 mb-0 text-[12px] text-mute">Twice a day, like brushing your teeth? Make two habits – “Brush teeth (AM)” and “Brush teeth (PM)” – so each gets its own tick.</p> },
      { k: 'mode', l: 'How often', t: 'select', o: [['days', 'On set days'], ['weekly', 'A number of times a week']], v: h?.mode || 'days', half: true },
      { k: 'perWeek', l: 'Times a week', t: 'number', min: 1, max: 7, v: h?.perWeek || 3, half: true },
      { k: 'days', l: 'Days (for “on set days”)', t: 'days', v: h?.days || [0, 1, 2, 3, 4, 5, 6] },
      { k: 'twice', l: 'Times a day', t: 'select', o: [['', 'Once'], ['1', 'Morning and evening']], v: h?.twice ? '1' : '', half: true,
        help: () => <p className="mt-1 mb-0 text-[12px] text-mute">Morning and evening gives it AM and PM ticks – handy for brushing teeth. One tick counts as the minimum.</p> },
      { k: 'after', l: 'Do it right after…', t: 'select', half: true, v: h?.after || '',
        o: [['', 'Nothing – on its own'], ...s.habits.filter((x) => x.id !== id).flatMap((x) => x.twice
          ? [[x.id + ':am', x.name + ' (morning)'], [x.id + ':pm', x.name + ' (evening)']] as [string, string][]
          : [[x.id, x.name]] as [string, string][])],
        help: () => <p className="mt-1 mb-0 text-[12px] text-mute">Link it to a habit you already do, like flossing after brushing. It shows under that habit and pops up once it's done.</p> },
      { k: 'min', l: 'Minimum for bad days', v: h?.min, ph: 'e.g. 2 pages, 1 glass, 5 minutes', help: () => <p className="mt-1 mb-0 text-[12px] text-mute">If you miss a day, Today suggests just the minimum next time, so one slip doesn't turn into two.</p> },
      { k: 'cue', l: 'Cue – when you will do it', v: h?.cue, ph: 'e.g. after lunch' },
      { k: 'identity', l: 'Builds who you are becoming', t: 'select', o: [['', 'None'], ...s.identities.map((x) => [x.id, cap(x.name)] as [string, string])], v: h?.identity || '', half: true },
      { k: 'color', l: 'Colour', t: 'color', v: h?.color || accentColor(s.settings), half: true },
    ],
    onSave: (v) => {
      if (!v.name) return false
      v.perWeek = Math.max(1, Math.min(7, +v.perWeek || 1))
      v.twice = v.twice === '1'
      v.after = v.after || undefined
      // No loops: a habit can't come after a habit that comes after it.
      if (v.after && id) { let p = s.habits.find((x) => x.id === v.after.split(':')[0]); for (let i = 0; p && i < 10; i++) { if (p.id === id) { toast("That would make a loop – pick a different habit to follow."); return false } p = s.habits.find((x) => x.id === p!.after?.split(':')[0]) } }
      update((d) => { const x = id && d.habits.find((k) => k.id === id); if (x) Object.assign(x, v); else d.habits.push({ id: uid(), created: today(), log: {}, ...v } as any) })
    },
    onDelete: id ? () => update((d) => del(d.habits, id)) : undefined,
  })
}

export function goalForm(id?: string, area?: string) {
  const s = getS(), g = id ? s.goals.find((x) => x.id === id) : undefined, areas = s.settings.goalAreas
  openForm({
    title: g ? 'Update goal' : 'New goal',
    fields: [
      { k: 'title', l: 'Goal', v: g?.title },
      { k: 'area', l: 'Area of life', t: 'select', o: areas.map((a) => [a, a]), v: g?.area || area || areas[0], half: true },
      { k: 'pct', l: 'Progress %', t: 'number', min: 0, max: 100, v: g?.pct || 0, half: true },
      { k: 'target', l: 'Target date', t: 'date', v: g?.target, half: true },
      { k: 'next', l: 'Next small step', v: g?.next, half: true, ph: 'Something you could do this week' },
      { k: 'why', l: 'Why it matters to you', t: 'textarea', rows: 3, v: g?.why, ph: 'The reason that will keep you going on a hard day', help: (v, set) => <WhyHelper why={v.why} area={v.area} onChange={(x) => set('why', x)} /> },
      { k: 'obstacle', l: 'What might get in the way?', t: 'textarea', rows: 2, v: g?.obstacle, ph: 'e.g. Too tired after work' },
      { k: 'plan', l: 'If that happens, I will…', t: 'textarea', rows: 2, v: g?.plan, ph: 'e.g. Do a 10-minute walk instead of skipping' },
    ],
    onSave: (v) => {
      if (!v.title) return false
      v.pct = Math.max(0, Math.min(100, +v.pct || 0))
      if (v.pct === 100) v.done = true
      update((d) => { const x = id && d.goals.find((k) => k.id === id); if (x) Object.assign(x, v); else d.goals.push({ id: uid(), ...v } as any) })
    },
    onDelete: id ? () => update((d) => del(d.goals, id)) : undefined,
  })
}

export function identityForm(id?: string) {
  const x = id ? getS().identities.find((i) => i.id === id) : undefined
  if (id && !x) return
  openForm({
    title: x ? 'Who you are becoming' : 'Who are you becoming?',
    fields: [
      { k: 'name', l: "I'm…", v: x?.name, ph: 'someone who moves every day', help: (v, set) => <IdentityNameHelper value={v.name || ''} onChange={(n) => set('name', n)} /> },
      { k: 'does', l: 'What this person does', t: 'textarea', rows: 2, v: x?.does, ph: 'Walks every day, eats real food', help: (v, set) => <IdentityDoesHelper name={cleanId(v.name || '')} value={v.does || ''} onChange={(n) => set('does', n)} /> },
    ],
    onSave: (v) => {
      if (!v.name?.trim()) return false
      const name = cleanId(v.name)
      update((d) => { const i = id && d.identities.find((k) => k.id === id); if (i) { i.name = name; i.does = v.does } else d.identities.push({ id: uid(), name, does: v.does || '' }) })
    },
    onDelete: id ? () => update((d) => { d.identities = d.identities.filter((i) => i.id !== id); d.habits.forEach((h) => { if (h.identity === id) h.identity = '' }) }) : undefined,
  })
}
