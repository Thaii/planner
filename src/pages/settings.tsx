import * as React from 'react'
import { ArrowDown, ArrowUp, X } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { CommitInput, InlineAdd, Input, Select, Textarea } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import { PageHead } from '@/components/bits'
import { closeSheet, confirmBox, openSheet } from '@/components/sheet'
import { personaliseForm } from '@/components/personalise'
import { exportBackup, getS, importBackup, replaceState, update, useS } from '@/lib/store'
import { defaults } from '@/lib/defaults'
import { ACCENTS, CARDS_DEF, DAY_THEMES, NIGHT_THEMES, PAPERS, type Palette } from '@/lib/constants'
import { isNight } from '@/lib/theme'
import { pad, today } from '@/lib/date'
import { parseICS } from '@/lib/ics'
import { greeting, plannerTitle } from '@/lib/greeting'
import type { Settings, ThemeMode } from '@/lib/types'
import { useUI } from '@/lib/ui'
import { cn, uid } from '@/lib/utils'

const setS = (fn: (s: Settings) => void) => update((d) => fn(d.settings))
const hours = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i)

function YourDay() {
  const s = useS().settings
  const move = (i: number, n: number) => setS((st) => { const a = st.cards, j = i + n; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]] })
  return (
    <Card>
      <CardHeader title="Your day" />
      <p className="mt-0 text-[13.5px] text-mute">Switch off what you don't use and move the rest into the order you want to read them. Hiding a card never deletes what's in it.</p>
      <div className="rows">
        {s.cards.map((c, i) => (
          <div key={c.id} className={cn('row', !c.on && 'opacity-60')}>
            <Check on={c.on} label={'Show ' + c.id} onClick={() => setS((st) => { st.cards[i].on = !st.cards[i].on })} />
            <div className="tt flex-1">{(CARDS_DEF.find((x) => x[0] === c.id) || [c.id, c.id])[1]}</div>
            <Button size="icon" className="size-8" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-3.5" /></Button>
            <Button size="icon" className="size-8" aria-label="Move down" disabled={i === s.cards.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-3.5" /></Button>
          </div>
        ))}
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
          <div className="row"><div className="flex-1"><div className="text-[12.5px] text-mute">Planner title</div><div className="font-serif text-lg">{plannerTitle(s).join(' ')}</div></div></div>
          <div className="row"><div className="flex-1"><div className="text-[12.5px] text-mute">Greeting</div><div className="font-serif text-lg">{greeting(s)}</div></div></div>
        </div>
        <Button className="mt-2" onClick={personaliseForm}>Change name and greeting</Button>
      </Card>
      <Card>
        <CardHeader title="Calendar" />
        <div className="lbl mb-1.5 text-mute">Weeks start on</div>
        <Segmented value={String(s.weekStart)} onChange={(v) => setS((st) => { st.weekStart = +v as 0 | 1 })} options={[['1', 'Monday'], ['0', 'Sunday']]} />
        <div className="flex flex-wrap gap-2.5">
          <label className="w-[calc(50%-5px)]"><span className="mb-1 block text-[12.5px] font-medium text-mute">Schedule starts</span>
            <Select value={s.dayStart} onChange={(e) => setS((st) => { st.dayStart = +e.target.value })}>{hours(0, 11).map((h) => <option key={h} value={h}>{pad(h)}:00</option>)}</Select></label>
          <label className="w-[calc(50%-5px)]"><span className="mb-1 block text-[12.5px] font-medium text-mute">Schedule ends</span>
            <Select value={s.dayEnd} onChange={(e) => setS((st) => { st.dayEnd = +e.target.value })}>{hours(13, 24).map((h) => <option key={h} value={h}>{pad(h % 24)}:00</option>)}</Select></label>
          <label className="w-[calc(50%-5px)]"><span className="mb-1 block text-[12.5px] font-medium text-mute">Daily water target (glasses)</span>
            <Input type="number" min={1} max={20} value={s.water} onChange={(e) => { const n = +e.target.value; if (n >= 1 && n <= 20) setS((st) => { st.water = n }) }} /></label>
        </div>
      </Card>
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

function ThemeGrid({ themes, k }: { themes: Record<string, Palette>; k: 'dayTheme' | 'nightTheme' }) {
  const s = useS().settings
  const acc = (ACCENTS[s.accent] || ACCENTS.blush)[1]
  return (
    <div className="mb-3.5 grid grid-cols-[repeat(auto-fill,minmax(132px,1fr))] gap-2">
      {Object.entries(themes).map(([id, p]) => (
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
  return (
    <Card>
      <CardHeader title="How it looks" />
      <div className="lbl mb-1.5 text-mute">When to use night</div>
      <Segmented value={s.theme} onChange={(v) => setS((st) => { st.theme = v as ThemeMode })} options={[['light', 'Always day'], ['dark', 'Always night'], ['schedule', 'By time'], ['auto', 'Match device']]} />
      {s.theme === 'schedule' && (
        <div className="mb-3 flex gap-2.5">
          <label className="flex-1"><span className="mb-1 block text-[12.5px] font-medium text-mute">Night starts</span>
            <Select value={s.nightFrom} onChange={(e) => setS((st) => { st.nightFrom = +e.target.value })}>{hours(0, 23).map((h) => <option key={h} value={h}>{pad(h)}:00</option>)}</Select></label>
          <label className="flex-1"><span className="mb-1 block text-[12.5px] font-medium text-mute">Day starts</span>
            <Select value={s.nightTo} onChange={(e) => setS((st) => { st.nightTo = +e.target.value })}>{hours(0, 23).map((h) => <option key={h} value={h}>{pad(h)}:00</option>)}</Select></label>
        </div>
      )}
      <p className="mt-0 text-[13px] text-mute">Right now you're seeing your <b className="text-ink">{isNight(s) ? 'night' : 'day'}</b> theme.</p>
      <div className="lbl mt-3.5 mb-2 text-mute">Day theme</div>
      <ThemeGrid themes={DAY_THEMES} k="dayTheme" />
      <div className="lbl mb-2 text-mute">Night theme</div>
      <ThemeGrid themes={NIGHT_THEMES} k="nightTheme" />
      <div className="row border-0">
        <Check on={s.themeAccent} label="Use each theme's own colour" onClick={() => setS((st) => { st.themeAccent = !st.themeAccent })} />
        <div className="flex-1"><div className="tt">Use each theme's own colour</div><div className="text-[12.5px] text-mute">Off: the colour you pick below is used everywhere. Lamp always keeps its amber.</div></div>
      </div>
      <div className="lbl mt-3 mb-1.5 text-mute">Colour · {(ACCENTS[s.accent] || ACCENTS.blush)[0]}</div>
      <div className="mb-3.5 flex flex-wrap gap-2">
        {Object.entries(ACCENTS).map(([k, [n, c]]) => (
          <button key={k} aria-label={n} title={n} aria-pressed={s.accent === k} onClick={() => setS((st) => { st.accent = k })}
            className={cn('size-8 rounded-full ring-offset-2 ring-offset-card', s.accent === k && 'ring-2 ring-ink')} style={{ background: c }} />
        ))}
      </div>
      <div className="lbl mb-1.5 text-mute">Paper</div>
      <Segmented value={s.paper} onChange={(v) => setS((st) => { st.paper = v })} options={PAPERS} />
    </Card>
  )
}

function Colours() {
  const s = useS().settings
  const setL = (id: string, fn: (l: { name: string; color: string }) => void) => setS((st) => { const l = st.labels.find((x) => x.id === id); if (l) fn(l) })
  return (
    <Card>
      <CardHeader title="Colour coding" action={<Button variant="link" className="text-[12.5px]" onClick={() => setS((st) => { st.labels.push({ id: uid(), name: 'New label', color: '#8a8a8a' }) })}>+ Label</Button>} />
      <p className="mt-0 text-[13.5px] text-mute">Name your own labels and use them on to-dos, appointments, workouts and projects, and to colour days on the month.</p>
      <div className="rows">
        {s.labels.map((l) => (
          <div key={l.id} className="row">
            <input type="color" aria-label={'Colour for ' + l.name} value={l.color} onChange={(e) => setL(l.id, (x) => { x.color = e.target.value })} className="h-9 w-11 cursor-pointer rounded-lg border border-line bg-card p-0.5" />
            <CommitInput value={l.name} aria-label="Label name" className="flex-1" onCommit={(v) => v.trim() && setL(l.id, (x) => { x.name = v.trim() })} />
            <button className="p-1 text-mute" aria-label={'Remove ' + l.name} onClick={() => setS((st) => { st.labels = st.labels.filter((x) => x.id !== l.id) })}><X className="size-4" /></button>
          </div>
        ))}
      </div>
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
    </div>
  )
}
