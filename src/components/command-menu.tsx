import { Command } from 'cmdk'
import { useEffect } from 'react'
import { go, useUI, openDay } from '@/lib/ui'
import { getS } from '@/lib/store'
import { NAVGROUPS } from '@/lib/nav'
import { allEvents, nextUp } from '@/lib/logic'
import { fmt, today } from '@/lib/date'
import { eventForm, goalForm, habitForm, taskForm } from '@/lib/forms'
import { startFive } from './five'
import { quickAdd } from './quick-add'

interface Item { label: string; sub?: string; run: () => void }
function groups(): [string, Item[]][] {
  const s = getS()
  const pages = NAVGROUPS.flatMap(([g, items]) => items.map(([v, n]) => ({ label: n, sub: g, run: () => go(v) })))
  const doItems: Item[] = [
    { label: 'New to-do', sub: 'Quick add', run: () => taskForm(undefined, today()) },
    { label: 'New event', sub: 'Quick add', run: () => eventForm(undefined, today()) },
    { label: 'New habit', sub: 'Quick add', run: () => habitForm() },
    { label: 'New goal', sub: 'Quick add', run: () => goalForm() },
    { label: 'Quick add…', sub: 'Quick add', run: quickAdd },
    { label: 'Start 5 minutes on next up', sub: 'Focus', run: () => { const n = nextUp(getS(), today()); if (n) startFive({ kind: n.kind, id: n.id, occ: n.occ, title: n.title }) } },
  ]
  const idx: Item[] = []
  s.tasks.forEach((t) => idx.push({ label: t.title, sub: 'To-do' + (t.date ? ' · ' + fmt(t.date) : ''), run: () => taskForm(t.id) }))
  allEvents(s).forEach((e) => idx.push({ label: e.title, sub: 'Event · ' + fmt(e.date), run: () => (e.ro ? openDay(e.date) : eventForm(e.id)) }))
  s.habits.forEach((h) => idx.push({ label: h.name, sub: 'Habit', run: () => habitForm(h.id) }))
  s.goals.forEach((g) => idx.push({ label: g.title, sub: 'Goal · ' + (g.area || ''), run: () => goalForm(g.id) }))
  s.inbox.forEach((i) => idx.push({ label: i.text, sub: 'Brain dump', run: () => go('today') }))
  return [['Jump to', pages], ['Do', doItems], ['In your planner', idx.slice(0, 600)]]
}

export function CommandMenu() {
  const open = useUI((u) => u.cmdOpen)
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); useUI.setState((u) => ({ cmdOpen: !u.cmdOpen })) } }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [])
  const gs = open ? groups() : []
  return (
    <Command.Dialog open={open} onOpenChange={(o) => useUI.setState({ cmdOpen: o })} label="Search and jump" loop>
      <Command.Input placeholder="Search your planner or jump to a page…" />
      <Command.List>
        <Command.Empty>No results.</Command.Empty>
        {gs.map(([name, items]) => (
          <Command.Group key={name} heading={name}>
            {items.map((it, i) => (
              <Command.Item key={name + i} value={`${it.label} · ${it.sub || ''} ${name[0]}${i}`} onSelect={() => { useUI.setState({ cmdOpen: false }); setTimeout(it.run, 30) }}>
                <span>{it.label}</span>{it.sub && <small>{it.sub}</small>}
              </Command.Item>
            ))}
          </Command.Group>
        ))}
      </Command.List>
    </Command.Dialog>
  )
}
