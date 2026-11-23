import { SyncCard } from '@/components/sync-ui'
import { checkForUpdates } from '@/lib/pwa-update'
import { AppIconPicker } from '@/components/app-icon-picker'
import { ColourPicker } from '@/components/colour-picker'
import { Pal } from '@/components/pals'
import { askNotify, testSound } from '@/lib/sound'
import { replayWelcome } from '@/components/welcome'
import { waterForm } from '@/components/water-form'
import { ml } from '@/lib/water'
import * as React from 'react'
import { GripVertical, RotateCw, X } from 'lucide-react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { CommitInput, InlineAdd, Select, Textarea } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import { PageHead } from '@/components/bits'
import { closeSheet, confirmBox, openSheet } from '@/components/sheet'
import { personaliseForm } from '@/components/personalise'
import { exportBackup, getS, importBackup, replaceState, undoable, update, useS } from '@/lib/store'
import { tint } from '@/lib/logic'
import { defaults } from '@/lib/defaults'
import { ACCENTS, ALL_ACCENTS, CUTE_ACCENTS, CARDS_DEF, DAY_THEMES, NIGHT_THEMES, PAPERS, type Palette } from '@/lib/constants'
import { accentColor, isNight } from '@/lib/theme'
import { deviceUses24, hourLabel, today } from '@/lib/date'
import { parseICS } from '@/lib/ics'
import { greeting, plannerTitle } from '@/lib/greeting'
import type { Settings, ThemeMode } from '@/lib/types'
import { useUI } from '@/lib/ui'
import { cn, uid } from '@/lib/utils'

const setS = (fn: (s: Settings) => void) => update((d) => fn(d.settings))
const hours = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

/** One draggable card row: drag by the grip (mouse, finger, or Space + arrow keys). */
function CardRow({ id, on, i }: { id: string; on: boolean; i: number }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id })
  const name = (CARDS_DEF.find((x) => x[0] === id) || [id, id])[1]
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('row relative bg-card', !on && 'opacity-60', isDragging && 'z-10 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,.14)] opacity-100')}>
      <button ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={'Drag to reorder ' + name}
        className="-ml-1 grid size-8 cursor-grab touch-none place-items-center rounded-lg text-mute active:cursor-grabbing"><GripVertical className="size-4" /></button>
      <Check on={on} label={'Show ' + name} onClick={() => setS((st) => { st.cards[i].on = !st.cards[i].on })} />
      <div className="tt flex-1">{name}</div>
    </div>
  )
}

function YourDay() {
  const s = useS().settings
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const onEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setS((st) => {
      const from = st.cards.findIndex((c) => c.id === active.id), to = st.cards.findIndex((c) => c.id === over.id)
      st.cards = arrayMove(st.cards, from, to)
    })
  }
  return (
    <Card>
      <CardHeader title="Your day" />
      <p className="mt-0 text-[13.5px] text-mute">Switch off what you don't use, and drag by the grip to put the rest in the order you want to read them. Hiding a card never deletes what's in it.</p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={onEnd}>
        <SortableContext items={s.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="rows">
            {s.cards.map((c, i) => <CardRow key={c.id} id={c.id} on={c.on} i={i} />)}
          </div>
        </SortableContext>
      </DndContext>
      <div className="mt-2 flex flex-wrap gap-x-4">
        <Button variant="link" className="text-[13px]" onClick={() => undoable('Dashboard reset', (d) => { d.settings.cards = defaults().settings.cards })}>Reset the dashboard</Button>
        <Button variant="link" className="text-[13px]" onClick={replayWelcome}>Show the welcome again</Button>
        {s.trayHidden && <Button variant="link" className="text-[13px]" onClick={() => setS((st) => { st.trayHidden = false })}>Bring back "Add to your day"</Button>}
      </div>
    </Card>
  )
}

function TimerSound() {
  const s = useS().settings
  const perm = typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  return (
    <Card>
      <CardHeader title="Timers" />
      <p className="mt-0 text-[13.5px] text-mute">What happens when a 5-minute start, Focus, self-care or dopamine timer ends.</p>
      <div className="lbl mb-1.5 text-mute">Sound</div>
      <Segmented value={s.sound || 'gentle'} onChange={(v) => setS((st) => { st.sound = v as 'gentle' | 'repeat' | 'off' })}
        options={[['gentle', 'A few chimes'], ['repeat', 'Keep ringing'], ['off', 'Silent']]} />
      <p className="-mt-1.5 text-[13px] text-mute">{{ gentle: 'A soft bell three times, then quiet.', repeat: 'Rings every few seconds until you tap something (up to 2 minutes).', off: 'No sound – the screen and tab title still let you know.' }[s.sound || 'gentle']}</p>
      <Button size="sm" onClick={testSound}>Test the sound</Button>
      <div className="row mt-3 border-0 px-0">
        <Check on={!!s.timerNotify && perm === 'granted'} label="Notify me when I'm in another tab or app" onClick={async () => {
          if (s.timerNotify && perm === 'granted') return setS((st) => { st.timerNotify = false })
          const ok = await askNotify()
          if (ok) setS((st) => { st.timerNotify = true }); else toast(perm === 'unsupported' ? "This browser can't show notifications" : 'Notifications are blocked – allow them for this site in your browser settings')
        }} />
        <div className="flex-1"><div className="tt">Notify me when I'm in another tab or app</div>
          <div className="text-[12.5px] text-mute">Shows a system notification while the planner is open in the background. Phones may pause timers once the screen locks.</div></div>
      </div>
    </Card>
  )
}

function Pages() {
  const s = useS().settings
  return (
    <div className="grid gap-3 min-[900px]:grid-cols-2">
      <Card>
        <CardHeader title="You" />
        <div className="rows">
          <div className="row"><div className="flex-1"><div className="text-[12.5px] text-mute">Planner title</div><div className="font-serif text-lg">{plannerTitle(s).filter(Boolean).join(' ')}</div></div></div>
          <div className="row"><div className="flex-1"><div className="text-[12.5px] text-mute">Greeting</div><div className="font-serif text-lg">{greeting(s)}</div></div></div>
        </div>
        <Button className="mt-2" onClick={personaliseForm}>Change name, title and greetings</Button>
      </Card>
      <Card>
        <CardHeader title="Calendar" />
        <div className="lbl mb-1.5 text-mute">Time format</div>
        <Segmented value={s.clock || (deviceUses24() ? '24' : '12')} onChange={(v) => setS((st) => { st.clock = v as '12' | '24' })} options={[['12', '12-hour · 2:30pm'], ['24', '24-hour · 14:30']]} />
        <div className="lbl mb-1.5 text-mute">Weeks start on</div>
        <Segmented value={String(s.weekStart)} onChange={(v) => setS((st) => { st.weekStart = +v as 0 | 1 })} options={[['1', 'Monday'], ['0', 'Sunday']]} />
        <div className="flex flex-wrap gap-2.5">
          <label className="w-[calc(50%-5px)]"><span className="mb-1 block text-[12.5px] font-medium text-mute">Schedule starts</span>
            <Select value={s.dayStart} onChange={(e) => setS((st) => { st.dayStart = +e.target.value })}>{hours(0, 11).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}</Select></label>
          <label className="w-[calc(50%-5px)]"><span className="mb-1 block text-[12.5px] font-medium text-mute">Schedule ends</span>
            <Select value={s.dayEnd} onChange={(e) => setS((st) => { st.dayEnd = +e.target.value })}>{hours(13, 24).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}</Select></label>
          <div className="w-full"><span className="mb-1 block text-[12.5px] font-medium text-mute">Water goal</span>
            <div className="flex items-center gap-2"><span className="flex-1 text-[14px]">{ml(s.waterGoal || 2000)} a day · each drop is {ml(s.glass || 250)}</span><Button size="sm" onClick={waterForm}>Change</Button></div></div>
        </div>
      </Card>
      <TimerSound />
      <Card>
        <CardHeader title="Goal areas" />
        <div className="rows">
          {s.goalAreas.map((a, i) => (
            <div key={i + a} className="row">
              <CommitInput value={a} aria-label="Area name" className="flex-1" onCommit={(v) => v.trim() && update((d) => {
                const old = d.settings.goalAreas[i]; d.settings.goalAreas[i] = v.trim()
                d.goals.forEach((g) => { if (g.area === old) g.area = v.trim() })
              })} />
              <button className="p-1 text-mute disabled:opacity-30" aria-label={'Remove ' + a} disabled={s.goalAreas.length < 2}
                onClick={() => update((d) => { const gone = d.settings.goalAreas.splice(i, 1)[0]; d.goals.forEach((g) => { if (g.area === gone) g.area = d.settings.goalAreas[0] }) })}><X className="size-4" /></button>
            </div>
          ))}
        </div>
        <InlineAdd placeholder="Add an area of life" onAdd={(v) => setS((st) => { if (!st.goalAreas.includes(v)) st.goalAreas.push(v) })} />
        <p className="mb-0 text-[12.5px] text-mute">Removing an area moves its goals into the first one.</p>
      </Card>
    </div>
  )
}

/** Switch style. Cute starts on its own themes; going back restores the classic ones you had. */
function setStyle(v: 'classic' | 'cute') {
  setS((st) => {
    if ((st.style || 'classic') === v) return
    if (v === 'cute') {
      st.classicThemes = { day: st.dayTheme, night: st.nightTheme, themeAccent: st.themeAccent }
      st.dayTheme = 'cuteBlush'; st.nightTheme = 'cutePlum'; st.themeAccent = true
    } else {
      const c = st.classicThemes
      st.dayTheme = c?.day && !c.day.startsWith('cute') ? c.day : 'linen'
      st.nightTheme = c?.night && !c.night.startsWith('cute') ? c.night : 'ember'
      st.themeAccent = c?.themeAccent ?? false
    }
    st.style = v
  })
}

function ThemeGrid({ themes, k }: { themes: Record<string, Palette>; k: 'dayTheme' | 'nightTheme' }) {
  const s = useS().settings
  const acc = accentColor(s)
  return (
    <div className="mb-3.5 grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-2">
      {Object.entries(themes).filter(([, p]) => !!p.cute === (s.style === 'cute')).map(([id, p]) => (
        <button key={id} onClick={() => setS((st) => { st[k] = id })} aria-pressed={s[k] === id}
          className={cn('rounded-xl border-2 p-2 text-left', s[k] === id ? 'border-accent' : 'border-transparent')} style={{ background: p.bg, color: p.ink }}>
          <div className="flex items-center justify-between rounded-lg px-2 py-1.5 font-serif" style={{ background: p.card, border: `1px solid ${p.line}` }}>
            Aa<i className="size-3.5 rounded-full" style={{ background: (s.themeAccent || p.lockAccent) && p.accent ? p.accent : acc }} />
          </div>
          <div className="mt-1.5 text-[13px] font-semibold">{p.n}</div>
          <small className="block text-[11.5px]" style={{ color: p.mute }}>{p.d}</small>
        </button>
      ))}
    </div>
  )
}

function Look() {
  const s = useS().settings
  const custom = /^#[0-9a-f]{6}$/i.test(s.accent)
  return (
    <Card>
      <CardHeader title="How it looks" />
      <div className="lbl mb-1.5 text-mute">Style</div>
      <div className="mb-3 grid gap-2 min-[520px]:grid-cols-2">
        {([['classic', 'Classic', 'Calm and clean, with serif headings', null], ['cute', 'Cute', 'Rounded and soft, with the planner pals', 'snoozy']] as const).map(([v, n, d, pal]) => {
          const on = (s.style || 'classic') === v
          return (
            <button key={v} aria-pressed={on} onClick={() => setStyle(v)}
              className={cn('flex items-center gap-3 rounded-2xl border-2 p-3 text-left', on ? 'border-accent bg-accent-soft' : 'border-line bg-card')}>
              {pal ? <Pal name={pal} size={46} /> : <span className="grid size-[46px] flex-none place-items-center rounded-xl bg-soft font-[DM_Serif_Display,serif] text-2xl">Aa</span>}
              <span><span className="block font-semibold">{n}</span><span className="block text-[12.5px] text-mute">{d}</span></span>
            </button>
          )
        })}
      </div>
      {s.style === 'cute' && (
        <div className="row mb-2 border-0 px-0">
          <Check on={s.pals !== false} label="Show the planner pals" onClick={() => setS((st) => { st.pals = st.pals === false })} />
          <div className="flex-1"><div className="tt">Show the planner pals</div><div className="text-[12.5px] text-mute">Snoozy, Pip, Dewy and friends on Today, in empty spots and on the timer.</div></div>
          <span className="flex -space-x-2"><Pal name="pip" size={30} /><Pal name="dewy" size={30} level={0.75} /><Pal name="sprig" size={30} /></span>
        </div>
      )}
      <div className="lbl mb-1.5 text-mute">When to use night</div>
      <Segmented value={s.theme} onChange={(v) => setS((st) => { st.theme = v as ThemeMode })} options={[['light', 'Always day'], ['dark', 'Always night'], ['schedule', 'By time'], ['auto', 'Match device']]} />
      {s.theme === 'schedule' && (
        <div className="mb-3 flex gap-2.5">
          <label className="flex-1"><span className="mb-1 block text-[12.5px] font-medium text-mute">Night starts</span>
            <Select value={s.nightFrom} onChange={(e) => setS((st) => { st.nightFrom = +e.target.value })}>{hours(0, 23).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}</Select></label>
          <label className="flex-1"><span className="mb-1 block text-[12.5px] font-medium text-mute">Day starts</span>
            <Select value={s.nightTo} onChange={(e) => setS((st) => { st.nightTo = +e.target.value })}>{hours(0, 23).map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}</Select></label>
        </div>
      )}
      <p className="mt-0 text-[13px] text-mute">Right now you're seeing your <b className="text-ink">{isNight(s) ? 'night' : 'day'}</b> theme.</p>
      <div className="lbl mt-3.5 mb-2 text-mute">Day theme</div>
      <ThemeGrid themes={DAY_THEMES} k="dayTheme" />
      <div className="lbl mb-2 text-mute">Night theme</div>
      <ThemeGrid themes={NIGHT_THEMES} k="nightTheme" />
      <div className="row border-0">
        <Check on={s.themeAccent} label="Use each theme's own colour" onClick={() => setS((st) => { st.themeAccent = !st.themeAccent })} />
        <div className="flex-1"><div className="tt">Use each theme's own colour</div><div className="text-[12.5px] text-mute">Off: the colour you pick below is used everywhere. Picking a colour turns this off. Lamp always keeps its amber.</div></div>
      </div>
      <div className="lbl mt-3 mb-1.5 text-mute">Colour · {s.themeAccent ? 'from your theme' : custom ? 'Your own ' + s.accent.toUpperCase() : (ALL_ACCENTS[s.accent] || ACCENTS.blush)[0]}</div>
      <div className="mb-3.5 flex flex-wrap gap-2">
        {Object.entries(s.style === 'cute' ? CUTE_ACCENTS : ACCENTS).map(([k, [n, c]]) => (
          <button key={k} aria-label={n} title={n} aria-pressed={!s.themeAccent && s.accent === k} onClick={() => setS((st) => { st.accent = k; st.themeAccent = false })}
            className={cn('size-8 rounded-full ring-offset-2 ring-offset-card', !s.themeAccent && s.accent === k && 'ring-2 ring-ink')} style={{ background: c }} />
        ))}
        {/* Any colour you like: our own picker (HEX first, with RGB and HSL tabs), shown as a rainbow until a custom colour is chosen. */}
        <ColourPicker value={accentColor(s)} active={!s.themeAccent && custom} className={cn('size-8 ring-offset-2 ring-offset-card', !s.themeAccent && custom && 'ring-2 ring-ink')}
          onChange={(h) => setS((st) => { st.accent = h; st.themeAccent = false })} />
      </div>
      <div className="lbl mb-1.5 text-mute">App icon</div>
      <div className="mb-3.5"><AppIconPicker /></div>
      <div className="lbl mb-1.5 text-mute">Paper</div>
      <Segmented value={s.paper} onChange={(v) => setS((st) => { st.paper = v })} options={PAPERS} />
      <div className="lbl mb-1.5 text-mute">The day's schedule</div>
      <Segmented value={s.schedView || 'timeline'} onChange={(v) => setS((st) => { st.schedView = v as 'timeline' | 'list' })} options={[['timeline', 'Timeline'], ['list', 'Simple list']]} />
      <p className="-mt-1.5 text-[13px] text-mute">{(s.schedView || 'timeline') === 'timeline' ? 'The timeline draws the hours of the day with a line showing where you are in it.' : 'The simple list shows what is on in time order, with past items faded and what is on now marked.'}</p>
      <Button variant="link" className="text-[13px]" onClick={() => undoable('Look reset', (d) => {
        const def = defaults().settings
        ;(['theme', 'accent', 'paper', 'dayTheme', 'nightTheme', 'nightFrom', 'nightTo', 'themeAccent', 'schedView'] as const).forEach((k) => { (d.settings as unknown as Record<string, unknown>)[k] = def[k] })
      })}>Reset the look</Button>
    </Card>
  )
}

/** Soft, readable label colours (pink, blush, apricot, honey, sage, seafoam, cornflower, lilac). */
const LABEL_COLOURS = ['#e07fa6', '#d98c8c', '#e09a6b', '#cf9c3f', '#6fae7a', '#4fa59b', '#6f8fd6', '#9f88c8']

function Colours() {
  const s = useS().settings
  const setL = (id: string, fn: (l: { name: string; color: string }) => void) => setS((st) => { const l = st.labels.find((x) => x.id === id); if (l) fn(l) })
  const add = () => setS((st) => {
    const used = new Set(st.labels.map((l) => l.color.toLowerCase()))
    st.labels.push({ id: uid(), name: 'New colour', color: LABEL_COLOURS.find((c) => !used.has(c)) || LABEL_COLOURS[st.labels.length % 8] })
  })
  return (
    <Card>
      <CardHeader title="Colour coding" />
      <p className="mt-0 text-[13.5px] text-mute">Give anything in your calendar a colour and it carries that colour through the day, the week, the month and the year. Rename these to match your own life.</p>
      <div className="rows">
        {s.labels.map((l) => {
          const custom = !LABEL_COLOURS.includes(l.color.toLowerCase())
          return (
            <div key={l.id} className="row flex-wrap gap-y-2">
              <span className="lamp-warm w-[76px] flex-none truncate rounded-md px-2 py-1 text-center text-[12px]" style={{ background: tint(l.color, 24), color: `color-mix(in srgb, ${l.color} 60%, var(--ink))` }}>{l.name}</span>
              <CommitInput value={l.name} aria-label="Colour name" className="min-w-[90px] flex-1 border-0 bg-transparent px-1" onCommit={(v) => v.trim() && setL(l.id, (x) => { x.name = v.trim() })} />
              <div className="flex items-center gap-1 max-[560px]:order-last max-[560px]:w-full max-[560px]:justify-between">
                {LABEL_COLOURS.map((c) => (
                  <button key={c} aria-label={'Use this colour for ' + l.name} aria-pressed={l.color.toLowerCase() === c} onClick={() => setL(l.id, (x) => { x.color = c })}
                    className={cn('size-7 rounded-full border-2', l.color.toLowerCase() === c ? 'border-ink' : 'border-transparent')}
                    style={{ background: tint(c, 30), boxShadow: `inset 0 0 0 1.5px ${c}` }} />
                ))}
                <ColourPicker value={l.color} active={custom} label={'Any colour for ' + l.name} className={cn('size-7 border-2', custom ? 'border-ink' : 'border-transparent')} onChange={(h) => setL(l.id, (x) => { x.color = h })} />
              </div>
              <button className="p-1 text-mute" aria-label={'Delete ' + l.name}
                onClick={() => undoable(`Deleted ${l.name}`, (d) => { d.settings.labels = d.settings.labels.filter((x) => x.id !== l.id) })}><X className="size-4" /></button>
            </div>
          )
        })}
      </div>
      <Button className="mt-3" onClick={add}>Add a colour</Button>
      <p className="mb-0 text-[12.5px] text-mute">Deleting a colour never deletes what was using it. The colour just comes off.</p>
    </Card>
  )
}

function download(name: string, text: string) {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  a.download = name; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

function restore(text: string) {
  try { importBackup(text); toast('Planner restored'); return true } catch { toast("That doesn't look like a planner backup"); return false }
}

function RestoreSheet() {
  const [t, setT] = React.useState('')
  return (
    <div>
      <h3 className="mb-1 text-[21px]">Restore from a backup</h3>
      <p className="mt-0 text-[13px] text-mute">Paste the text from <b>Copy a full backup</b> (this app or the original Claude version), or choose a backup file. This replaces what's on this device.</p>
      <Textarea rows={8} value={t} onChange={(e) => setT(e.target.value)} placeholder='{"app":"life-planner", …}' aria-label="Backup text" />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="cursor-pointer text-[13.5px] text-accent underline">
          Choose a file<input type="file" accept=".json,application/json,text/plain" className="sr-only"
            onChange={async (e) => { const f = e.target.files?.[0]; if (f && restore(await f.text())) closeSheet() }} />
        </label>
        <span className="flex-1" />
        <Button onClick={closeSheet}>Cancel</Button>
        <Button variant="primary" disabled={!t.trim()} onClick={() => restore(t) && closeSheet()}>Restore</Button>
      </div>
    </div>
  )
}

function Data() {
  const s = useS()
  const icsRef = React.useRef<HTMLInputElement>(null)
  const onIcs = async (f?: File) => {
    if (!f) return
    try {
      const r = parseICS(await f.text())
      if (!r.events.length) return void toast('No events found in that file')
      const nm = r.name || f.name.replace(/\.ics$/i, '')
      update((d) => { d.ics[nm.replace(/[^\w-]/g, '_').slice(0, 40) || 'cal'] = { name: nm, events: r.events, at: Date.now() } })
      toast(`Imported ${r.events.length} events from ${nm}`)
    } catch { toast("Couldn't read that file") }
    if (icsRef.current) icsRef.current.value = ''
  }
  const copy = async () => {
    const t = exportBackup()
    try { await navigator.clipboard.writeText(t); toast('Backup copied – paste it somewhere safe') }
    catch { openSheet(<div><h3 className="mb-1 text-[21px]">Your backup</h3><p className="mt-0 text-[13px] text-mute">Select all and copy this somewhere safe.</p><Textarea rows={10} readOnly value={t} /><div className="mt-3 flex justify-end"><Button onClick={closeSheet}>Close</Button></div></div>, 'Your backup') }
  }
  return (
    <div className="grid gap-3 min-[900px]:grid-cols-2">
      <SyncCard />
      <Card>
        <CardHeader title="Calendars" />
        <p className="mt-0 text-[13.5px] text-mute">Bring in a calendar file (.ics) exported from Google Calendar, Apple Calendar or Outlook. Its events show read-only; import the file again to refresh it. Live Google Calendar sync is coming with sign-in.</p>
        <input ref={icsRef} type="file" accept=".ics,text/calendar" className="sr-only" id="icsFile" onChange={(e) => onIcs(e.target.files?.[0])} />
        <Button onClick={() => icsRef.current?.click()}>Import a calendar file</Button>
        <div className="rows mt-2">
          {Object.entries(s.ics).map(([k, c]) => (
            <div key={k} className="row">
              <div className="flex-1"><div className="tt">{c.name}</div><div className="text-[12.5px] text-mute">{c.events.length} events · imported {new Date(c.at).toLocaleDateString('en-AU')}</div></div>
              <Button size="sm" onClick={() => update((d) => { delete d.ics[k] })}>Remove</Button>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardHeader title="Your data" />
        <p className="mt-0 text-[13.5px] text-mute">Everything is saved privately on <b className="text-ink">this device</b> – nothing is sent anywhere. Keep a backup now and then, and use it to move your planner to another device or bring it over from the Claude version.</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => download(`life-planner-backup-${today()}.json`, exportBackup())}>Download a backup</Button>
          <Button onClick={copy}>Copy a full backup</Button>
          <Button onClick={() => openSheet(<RestoreSheet />, 'Restore from a backup')}>Restore from a backup</Button>
        </div>
        <div className="mt-4 border-t border-line pt-3">
          <Button variant="danger" onClick={() => confirmBox("Erase your whole planner? This can't be undone.", () => {
            const keep = getS().settings
            replaceState({ ...defaults(), settings: { ...defaults().settings, dayTheme: keep.dayTheme, nightTheme: keep.nightTheme, theme: keep.theme } })
            toast('Planner erased')
          }, 'Erase')}>Erase everything</Button>
        </div>
      </Card>
    </div>
  )
}

export function SettingsPage() {
  const tab = useUI((u) => u.setTab) || 'day'
  return (
    <div>
      <PageHead crumb="Account" title="Customise" />
      <Segmented value={tab} onChange={(v) => useUI.setState({ setTab: v })}
        options={[['day', 'Your day'], ['pages', 'Your pages'], ['look', 'How it looks'], ['colours', 'Colour coding'], ['data', 'Calendars & data']]} />
      {tab === 'day' && <YourDay />}
      {tab === 'pages' && <Pages />}
      {tab === 'look' && <Look />}
      {tab === 'colours' && <Colours />}
      {tab === 'data' && <Data />}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[12.5px] text-mute">
        <span>This version: {new Date(__BUILD__).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
        <Button size="sm" onClick={checkForUpdates}><RotateCw className="size-3.5" />Check for updates</Button>
      </div>
    </div>
  )
}
