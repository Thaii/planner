import * as React from 'react'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { Input, Textarea } from './ui/field'
import { Ico } from './doodles'
import { closeSheet, openSheet } from './sheet'
import { update, useS } from '@/lib/store'
import { addD, dow, DOWN, fmt, range, t12, type DateStr } from '@/lib/date'
import { ensureWeek, eventsOn, hRate, weekOf } from '@/lib/logic'
import { dayLoad } from '@/lib/week'
import { keyDates } from '@/lib/year'
import { cn, uid } from '@/lib/utils'
import { Chooser, weekCands } from './chooser'

const STEPS = ['Look back', 'Tidy up', 'Look ahead', 'Set up']

/**
 * The weekly reset: about ten minutes to close one week and set up the next.
 * Each step saves as you go, so stopping halfway loses nothing.
 */
function WeekReset({ ws }: { ws: DateStr }) {
  const s = useS()
  const next = addD(ws, 7), w = weekOf(s, ws), nw = weekOf(s, next)
  const [step, setStep] = React.useState(0)
  const [well, setWell] = React.useState(w.review?.well || '')
  const [hard, setHard] = React.useState(w.review?.hard || '')
  const open = w.todo.filter((i) => !i.done)
  const [keep, setKeep] = React.useState<Record<string, boolean>>(() => Object.fromEntries(open.map((i) => [i.id, true])))
  const [prio, setPrio] = React.useState<string[]>(() => [0, 1, 2].map((i) => nw.prio[i] || ''))
  const [focus, setFocus] = React.useState(nw.focus || '')
  const [choosing, setChoosing] = React.useState(false)

  const days = range(ws, 7), hr = hRate(s, days)
  const pDone = w.prio.filter((p, i) => p && w.pdone[i]).length, pSet = w.prio.filter(Boolean).length
  const tDone = w.todo.filter((i) => i.done).length

  const saveBack = () => update((d) => { const wk = ensureWeek(d, ws); wk.review = { ...(wk.review || {}), well: well.trim(), hard: hard.trim() } })
  const saveTidy = () => update((d) => {
    const wk = ensureWeek(d, ws), nk = ensureWeek(d, next)
    const moving = wk.todo.filter((i) => !i.done && keep[i.id]), dropped = wk.todo.filter((i) => !i.done && keep[i.id] === false)
    moving.forEach((i) => { if (!nk.todo.some((x) => x.text === i.text)) nk.todo.push({ id: uid(), text: i.text, done: false }) })
    wk.todo = wk.todo.filter((i) => i.done || !(moving.includes(i) || dropped.includes(i)))
  })
  const saveSetUp = () => update((d) => {
    const nk = ensureWeek(d, next)
    nk.prio = prio.map((p) => p.trim()); nk.focus = focus.trim()
    const wk = ensureWeek(d, ws); wk.review = { ...(wk.review || {}), done: true, at: Date.now() }
  })
  const go = (n: number) => {
    if (step === 0) saveBack()
    if (step === 1 && n > step) saveTidy()
    setStep(n)
  }

  const nextDays = range(next, 7), kd = keyDates(s, next, addD(next, 6))
  return (
    <div data-testid="week-reset">
      <div className="lbl text-mute">Weekly reset · {fmt(ws, { day: 'numeric', month: 'short' })} to {fmt(addD(ws, 6), { day: 'numeric', month: 'short' })}</div>
      <h3 className="mt-0.5 mb-2 pr-8 text-[22px]">{STEPS[step]}</h3>
      <div className="mb-3.5 flex gap-1.5" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((x, i) => <button key={x} aria-label={x} onClick={() => go(i)} className={cn('h-1.5 flex-1 rounded-full', i <= step ? 'bg-accent' : 'bg-soft')} />)}
      </div>

      {step === 0 && (<>
        <div className="mb-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-tint-mint px-2 py-2"><div className="text-[20px] font-bold">{pSet ? `${pDone}/${pSet}` : '–'}</div><div className="text-[11.5px] text-mute">top 3 done</div></div>
          <div className="rounded-xl bg-tint-sky px-2 py-2"><div className="text-[20px] font-bold">{tDone}</div><div className="text-[11.5px] text-mute">week to-dos done</div></div>
          <div className="rounded-xl bg-tint-lav px-2 py-2"><div className="text-[20px] font-bold">{hr.due ? hr.pct + '%' : '–'}</div><div className="text-[11.5px] text-mute">of habits kept</div></div>
        </div>
        <label className="lbl mb-1 block text-mute" htmlFor="wr-well">What went well?</label>
        <Textarea id="wr-well" rows={2} value={well} onChange={(e) => setWell(e.target.value)} placeholder="Even one small thing counts" />
        <label className="lbl mt-3 mb-1 block text-mute" htmlFor="wr-hard">What got in the way?</label>
        <Textarea id="wr-hard" rows={2} value={hard} onChange={(e) => setHard(e.target.value)} placeholder="No blame – just notice it, so next week can plan around it" />
      </>)}

      {step === 1 && (open.length === 0 ? <p className="text-[14px]">Nothing left over from this week's to-do. Nice and tidy.</p> : (<>
        <p className="mt-0 mb-2 text-[13.5px] text-mute">{open.length} still open. Move what still matters to next week; let go of the rest – dropping things on purpose is a skill, not a failure.</p>
        {open.map((i) => (
          <div key={i.id} className="row">
            <span className={cn('tt flex-1 break-words', keep[i.id] === false && 'text-mute line-through')}>{i.text}</span>
            <div className="flex flex-none gap-1">
              <Button size="sm" variant={keep[i.id] !== false ? 'primary' : 'outline'} aria-pressed={keep[i.id] !== false} onClick={() => setKeep((k) => ({ ...k, [i.id]: true }))}>Next week</Button>
              <Button size="sm" variant={keep[i.id] === false ? 'primary' : 'outline'} aria-pressed={keep[i.id] === false} onClick={() => setKeep((k) => ({ ...k, [i.id]: false }))}>Let go</Button>
            </div>
          </div>
        ))}
      </>))}

      {step === 2 && (<>
        <p className="mt-0 mb-2 text-[13.5px] text-mute">Here's next week. Spot the full days now, so you don't plan big things on them.</p>
        {kd.length > 0 && <div className="mb-2 flex flex-wrap gap-1.5">{kd.map((k, i) => <span key={i} className="flex items-center gap-1 rounded-full bg-tint-butter px-2.5 py-1 text-[12px]"><Ico e={k.e} className="size-[15px] text-[11px]" />{k.t} · {DOWN[dow(k.d)]}</span>)}</div>}
        {nextDays.map((d) => {
          const ev = eventsOn(s, d), ld = dayLoad(s, d)
          return (
            <div key={d} className="row items-start">
              <span className="w-[62px] flex-none"><b className="block text-[13px]">{DOWN[dow(d)]} {+d.slice(8)}</b><span className={cn('text-[11px]', ld.level === 3 ? 'font-semibold text-danger' : 'text-mute')}>{ld.label}</span></span>
              <span className="min-w-0 flex-1 text-[13px]">{ev.length ? ev.map((e) => (e.time ? t12(e.time) + ' ' : '') + e.title).join(' · ') : <span className="text-mute">Nothing booked</span>}</span>
            </div>
          )
        })}
      </>)}

      {step === 3 && choosing && (
        <Chooser initial={weekCands(s, next)} scope="week" fullDays={nextDays.filter((d) => dayLoad(s, d).level === 3).map((d) => DOWN[dow(d)])}
          onCancel={() => setChoosing(false)}
          onDone={({ picks, win }) => {
            setPrio([0, 1, 2].map((i) => picks[i] || ''))
            if (win) update((d) => { const nk = ensureWeek(d, next); if (!nk.todo.some((x) => x.text === win)) nk.todo.unshift({ id: uid(), text: win, done: false }) })
            setChoosing(false)
          }} />
      )}

      {step === 3 && !choosing && (<>
        <label className="lbl mb-1 block text-mute" htmlFor="wr-focus">Next week's focus</label>
        <Input id="wr-focus" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="One line, e.g. Rest after a big week" />
        <div className="mt-3 mb-1 flex items-center gap-2"><span className="lbl flex-1 text-mute">Next week's top 3</span>
          <Button size="sm" variant="primary" onClick={() => setChoosing(true)}>Help me choose</Button></div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="mb-1.5 flex items-center gap-2">
            <span className="grid size-[22px] flex-none place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent">{i + 1}</span>
            <Input value={prio[i]} aria-label={`Priority ${i + 1}`} placeholder={i === 0 ? 'The one that matters most' : 'Next week, I will…'} onChange={(e) => setPrio((p) => p.map((x, j) => (j === i ? e.target.value : x)))} />
          </div>
        ))}
        {hard && <p className="mt-2 mb-0 text-[12.5px] text-mute">You said <i>“{hard}”</i> got in the way – is there one small change that would help?</p>}
      </>)}

      {!(step === 3 && choosing) && <div className="mt-4 flex items-center gap-2">
        {step > 0 && <Button onClick={() => go(step - 1)}>Back</Button>}
        <span className="flex-1" />
        {step < STEPS.length - 1
          ? <Button variant="primary" onClick={() => go(step + 1)}>Next</Button>
          : <Button variant="primary" onClick={() => { saveBack(); saveSetUp(); closeSheet(); toast('Next week is set up. Well done for pausing to plan.') }}>Finish</Button>}
      </div>}
    </div>
  )
}

export const weekReset = (ws: DateStr) => openSheet(<WeekReset ws={ws} />, 'Weekly reset')
