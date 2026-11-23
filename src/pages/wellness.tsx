import { MaybePal } from '@/components/pals'
import { Sections } from '@/components/sections'
import { MedsSection } from './meds'
import { glassMl, ml } from '@/lib/water'
import * as React from 'react'
import { X, Play } from 'lucide-react'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { CommitInput, InlineAdd, Select } from '@/components/ui/field'
import { PageHead, Moods, Drops } from '@/components/bits'
import { openForm } from '@/components/sheet'
import { startFive } from '@/components/five'
import { useS, update, undoable } from '@/lib/store'
import { addD, diffD, fmt, range, today, type DateStr } from '@/lib/date'
import { hRate } from '@/lib/logic'
import { setWell } from '@/lib/actions'
import { MOODS, MOODW } from '@/lib/constants'
import { fmtSleep, parseSleep } from '@/lib/sleep'
import { TIERS, scDone, logSelf, showSelfCare } from '@/lib/menus'
import type { SelfCare, State } from '@/lib/types'
import { cn, uid } from '@/lib/utils'

/* ---------- 30-day summary with bars; gaps where nothing was logged ---------- */
function Summary({ s, k, label, max, big, small }: { s: State; k: 'mood' | 'energy' | 'water' | 'sleep'; label: string; max: number; big: (v: number) => string; small: (v: number) => string }) {
  const t = today(), days = range(addD(t, -29), 30)
  const get = (d: DateStr) => { const v = s.well[d]?.[k]; return v == null || (k === 'water' && !v) ? null : +v }
  const vals = days.map(get), have = vals.filter((v): v is number => v !== null)
  const prev = range(addD(t, -59), 30).map(get).filter((v): v is number => v !== null)
  const avg = have.length ? have.reduce((a, b) => a + b, 0) / have.length : null
  const pavg = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : null
  const dl = avg != null && pavg != null ? avg - pavg : null
  const W = 200, H = 50, bw = W / 30
  return (
    <div className="summary-box relative">
      <MaybePal name={({ mood: 'bloom', energy: 'zip', water: 'dewy', sleep: 'puff' } as const)[k]} level={0.6} size={34} className="absolute top-2.5 right-2.5" />
      <span className="lbl text-mute">{label}</span>
      <div className="font-serif text-2xl">{avg == null ? '–' : big(avg)}</div>
      <div className="text-xs text-mute">{dl == null ? `${have.length} of 30 days logged` : `${dl >= 0 ? '↑ up' : '↓ down'} ${small(Math.abs(Math.round(dl * 10) / 10))} on the 30 days before`}</div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-1.5 block h-auto w-full" role="img" aria-label={`${label}, last 30 days`}>
        {vals.map((v, i) => v === null ? null : (
          <rect key={i} x={i * bw + 0.8} y={H - Math.max(3, (Math.min(v, max) / max) * H)} width={bw - 1.6} height={Math.max(3, (Math.min(v, max) / max) * H)} rx={1.5} fill="var(--accent)" opacity={0.55 + 0.45 * Math.min(v, max) / max}>
            <title>{fmt(days[i])}: {small(v)}</title>
          </rect>
        ))}
      </svg>
    </div>
  )
}

/* ---------- Self-care menu ---------- */
function selfCareForm(i: SelfCare) {
  openForm({
    title: 'Self-care idea',
    fields: [
      { k: 'text', l: 'Idea', v: i.text },
      { k: 'tier', l: 'Effort', t: 'select', o: TIERS.map(([k, l, h]) => [k, `${l} (${h})`]), v: i.tier, half: true },
      { k: 'mins', l: 'Timer minutes (0 = no timer)', t: 'number', min: 0, max: 240, v: i.mins || 0, half: true },
    ],
    onSave: (v) => { if (!v.text) return false; update((d) => { const x = d.selfcare.find((z) => z.id === i.id); if (x) Object.assign(x, { text: v.text, tier: v.tier, mins: +v.mins || 0 }) }) },
    onDelete: () => update((d) => { d.selfcare = d.selfcare.filter((z) => z.id !== i.id) }),
  })
}
function SelfCareCard({ s }: { s: State }) {
  const t = today()
  const [tier, setTier] = React.useState<SelfCare['tier']>('quick')
  const d30 = range(addD(t, -29), 30), on = d30.filter((d) => (s.selfLog[d] || []).length)
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null)
  const mOn = avg(on.map((d) => s.well[d]?.mood).filter((v): v is number => !!v)), mOff = avg(d30.filter((d) => !(s.selfLog[d] || []).length).map((d) => s.well[d]?.mood).filter((v): v is number => !!v))
  return (
    <Card><CardHeader title="Self-care menu" pal="chai" action={<span className="text-[12.5px] text-mute">For the days you cannot decide</span>} />
      <div className="flex flex-wrap gap-1.5">
        <Button variant="primary" onClick={() => showSelfCare()}>Pick one for me</Button>
        {TIERS.map(([k, l]) => <Button key={k} onClick={() => showSelfCare(k)}>{l}</Button>)}
      </div>
      {TIERS.map(([k, l, hint]) => {
        const items = s.selfcare.filter((i) => i.tier === k)
        return (
          <div key={k}>
            <div className="lbl mt-3 mb-0.5 text-mute">{l} <span className="font-sans tracking-normal normal-case">· {hint}</span></div>
            <div className="rows">{items.map((i) => {
              const dn = scDone(i.id, t)
              return (
                <div key={i.id} className={cn('row', dn && 'done')}>
                  <Check round on={dn} label={i.text} onClick={() => logSelf(i.id)} />
                  <button className="min-w-0 flex-1 text-left" onClick={() => selfCareForm(i)}><div className="tt">{i.text}</div>{i.mins > 0 && <div className="text-[12.5px] text-mute">{i.mins} min</div>}</button>
                  {i.mins > 0 && !dn && <Button size="sm" onClick={() => startFive({ kind: 'self', id: i.id, title: i.text, mins: i.mins, lead: 'Time for you. Nothing else needs doing.' })}><Play className="size-3" />{i.mins}m</Button>}
                </div>
              )
            })}</div>
          </div>
        )
      })}
      <InlineAdd placeholder="Add to the menu" onAdd={(v) => update((d) => { d.selfcare.push({ id: uid(), text: v, tier, mins: { quick: 5, medium: 20, big: 60 }[tier] }) })}>
        <Select value={tier} onChange={(e) => setTier(e.target.value as SelfCare['tier'])} className="w-auto px-1.5 py-1" aria-label="Effort">{TIERS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
      </InlineAdd>
      <p className="mt-1.5 mb-0 text-[12.5px] text-mute">
        Looked after yourself on <b>{on.length}</b> of the last 30 days.
        {mOn && mOff && on.length >= 3 ? <> Mood on those days: <b>{MOODW[Math.round(mOn)].toLowerCase()}</b> ({mOn.toFixed(1)}) vs {MOODW[Math.round(mOff)].toLowerCase()} ({mOff.toFixed(1)}) on other days.</> : null}
      </p>
    </Card>
  )
}

/* ---------- Routines ---------- */
function Routine({ s, k, title }: { s: State; k: 'morning' | 'evening'; title: string }) {
  const t = today(), items = s.routines[k], log = s.routines.log[t] || {}
  const dn = items.filter((i) => log[i.id]).length
  return (
    <Card><CardHeader pal={k === 'morning' ? 'sunny' : 'luna'} title={`${title} · ${fmt(t, { day: 'numeric', month: 'short' })}`} action={<span className="text-[12.5px] text-mute">{dn}/{items.length}</span>} />
      <div className="rows">{items.map((i) => (
        <div key={i.id} className={cn('row', log[i.id] && 'done')}>
          <Check on={!!log[i.id]} label={i.text} onClick={() => update((d) => { const l = (d.routines.log[t] = d.routines.log[t] || {}); if (l[i.id]) delete l[i.id]; else l[i.id] = 1 })} />
          <div className="tt flex-1">{i.text}</div>
          <button className="p-1 text-mute" aria-label="Remove step" onClick={() => undoable('Step removed', (d) => { d.routines[k] = d.routines[k].filter((z) => z.id !== i.id) })}><X className="size-4" /></button>
        </div>
      ))}</div>
      <InlineAdd placeholder={`Add a ${k} step`} onAdd={(v) => update((d) => { d.routines[k].push({ id: uid(), text: v }) })} />
      <div className="mt-2 flex items-center gap-1">
        <span className="lbl mr-1 text-mute">Last 7</span>
        {range(addD(t, -6), 7).map((d) => {
          const L = s.routines.log[d] || {}, c = items.filter((i) => L[i.id]).length
          return <i key={d} title={`${fmt(d)}: ${c}/${items.length}`} className={cn('inline-block size-3.5 rounded-full border border-line', items.length && c === items.length && 'border-accent bg-accent', c > 0 && c < items.length && 'bg-accent-soft')} />
        })}
      </div>
    </Card>
  )
}

export function WellnessPage() {
  const s = useS()
  const t = today(), w = s.well[t] || {}
  const d7 = range(addD(t, -6), 7), hr = hRate(s, d7)
  const water7 = d7.reduce((a, d) => a + (s.well[d]?.water || 0), 0)
  const sl = d7.map((d) => s.well[d]?.sleep).filter((v): v is number => v != null)
  const grat = s.journal.grat[t] || []
  return (
    <div>
      <PageHead crumb={'Live · ' + fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })} title="Wellness" />
      <Sections page="wellness" items={[
        { id: 'summary', title: "The last 30 days", icon: '📈', desc: "Mood, energy, water and sleep trends", wide: true, node: (<>
      <Card><CardHeader title="How the last 30 days have gone" action={<span className="text-[12.5px] text-mute">A gap means you did not record it, not a zero</span>} />
        <div className="summary-grid grid gap-4 min-[760px]:grid-cols-4">
          <Summary s={s} k="mood" label="Mood" max={5} big={(v) => `${MOODW[Math.round(v)]} most days`} small={(v) => `${v} pts`} />
          <Summary s={s} k="energy" label="Energy" max={100} big={(v) => `${Math.round(v)}% on the slider`} small={(v) => `${v}%`} />
          <Summary s={s} k="water" label="Water" max={Math.max(1, (s.settings.waterGoal || 2000) / glassMl(s.settings))} big={(v) => `${ml(v * glassMl(s.settings))} a day`} small={(v) => ml(v * glassMl(s.settings))} />
          <Summary s={s} k="sleep" label="Sleep" max={11} big={(v) => `${fmtSleep(v)} a night`} small={(v) => fmtSleep(v)} />
        </div>
      </Card>
        </>) },
        { id: 'meds', title: "Medications", icon: '💊', desc: "Your medications and their history", wide: true, node: (<>
      <MedsSection />
        </>) },
        { id: 'mood', title: "Mood & energy", icon: '🙂', desc: "Today's check-in", node: (<>
        <Card><CardHeader title="Mood & energy" pal="bloom" />
          <Moods d={t} />
          <div className="lbl mt-3.5 mb-1.5 text-mute">Energy</div>
          <div className="flex text-[13px]"><span className="flex-1">How much is in the tank?</span><span>{w.energy ?? '–'}%</span></div>
          <input type="range" min={0} max={100} value={w.energy ?? 50} onChange={(e) => setWell(t, 'energy', +e.target.value)} className="w-full accent-[var(--accent)]" aria-label="Energy" />
          <div className="lbl mt-3 mb-1.5 text-mute">Water</div>
          <Drops d={t} />
          <Button variant="link" className="mt-2.5 text-[12.5px]" onClick={() => update((d) => { delete d.well[t] })}>Clear today</Button>
        </Card>
        </>) },
        { id: 'selfcare', title: "Self-care menu", icon: '🛁', desc: "Little ways to look after yourself", node: (<>
        <SelfCareCard s={s} />
        </>) },
        { id: 'gratitude', title: "Gratitude", icon: '🙏', desc: "A few good things", node: (<>
        <Card><CardHeader title="Gratitude" pal="hugs" />
          <div className="rows">{grat.length ? grat.map((i) => <div key={i.id} className="row"><span>♡</span><div className="flex-1">{i.text}</div><button className="p-1 text-mute" aria-label="Remove" onClick={() => update((d) => { d.journal.grat[t] = (d.journal.grat[t] || []).filter((z) => z.id !== i.id) })}><X className="size-4" /></button></div>) : <Empty>Something good, however small.</Empty>}</div>
          <InlineAdd placeholder="Something good" onAdd={(v) => update((d) => { (d.journal.grat[t] = d.journal.grat[t] || []).push({ id: uid(), text: v }) })} />
        </Card>
        </>) },
        { id: 'sleep', title: "Sleep", icon: '😴', desc: "The last 7 nights", hide: true, node: (<>
        <Card><CardHeader title="Sleep · last 7 days" pal="puff" />
          <div className="rows">{[...d7].reverse().map((d) => {
            const x = s.well[d] || {}
            return (
              <div key={d} className="row">
                <span className="w-24 font-mono text-[11.5px]">{fmt(d, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                <CommitInput value={x.sleep != null ? fmtSleep(x.sleep) : ''} placeholder="–" aria-label={`Sleep ${fmt(d)}`} className="w-24 border-transparent bg-transparent px-1.5 py-1 font-mono text-[12.5px]" onCommit={(v) => setWell(d, 'sleep', parseSleep(v))} />
                <span className="flex-1" /><span>{x.mood ? MOODS[x.mood - 1] : <span className="text-mute">·</span>}</span>
              </div>
            )
          })}</div>
          <p className="mt-1.5 mb-0 text-[12.5px] text-mute">However you like to write it: 7h 20m, 7:20, or 7.5 for seven and a half.</p>
        </Card>
        </>) },
        { id: 'morning', title: "Morning routine", icon: '🌅', desc: "Your morning anchors", hide: true, node: (<>
        <Routine s={s} k="morning" title="Morning routine" />
        </>) },
        { id: 'evening', title: "Evening routine", icon: '🌙', desc: "Your wind-down steps", hide: true, node: (<>
        <Routine s={s} k="evening" title="Evening routine" />
        </>) },
        { id: 'week', title: "Week in numbers", icon: '🔢', desc: "This week at a glance", hide: true, wide: true, node: (<>
      <div className="mt-3 rounded-card bg-accent-soft px-4 py-3.5">
        <span className="lbl text-accent">Week {Math.ceil((diffD(t.slice(0, 4) + '-01-01', t) + 1) / 7)} in numbers</span>
        <div className="mt-1.5 text-[14px]">
          {hr.pct}% of habits · {ml(water7 * glassMl(s.settings))} of water · {sl.length ? fmtSleep(sl.reduce((a, b) => a + b, 0) / sl.length) + ' average sleep' : 'no sleep logged'} · {d7.filter((d) => (s.journal.grat[d] || []).length).length} days with gratitude · {d7.filter((d) => (s.selfLog[d] || []).length).length} days of self-care
        </div>
      </div>
        </>) },
      ]} />
    </div>
  )
}
