import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { getS } from '@/lib/store'
import { cn } from '@/lib/utils'

const chip = 'rounded-full border border-line bg-card px-2.5 py-1 text-left text-[12.5px] hover:border-accent'

/** Ways to start the sentence – tap one, then finish it. */
const STARTERS = ['someone who…', 'the kind of person who…', 'a person who never skips…', 'someone who looks after…', 'a person who makes time for…']

/** Ready-made identities, grouped loosely so there's something for most goals. */
const IDEAS = ['someone who moves every day', 'a calm person', 'someone who follows through', 'a reader', 'someone who looks after their money', 'a good friend', 'a creative person', 'someone who rests without guilt']

/** Small proofs ("what this person does") by theme, matched on the identity's words. */
const PROOFS: [RegExp, string[]][] = [
  [/fit|move|active|run|walk|gym|body|health|strong|athlet/i, ['Walks every day, even a short one', 'Takes the stairs', 'Moves before scrolling', 'Drinks water with every meal']],
  [/read|book|learn|study|curious/i, ['Reads a few pages before bed', 'Always has a book on the go', 'Learns one small thing a day']],
  [/calm|peace|relax|mindful|patient/i, ['Takes a breath before reacting', 'Puts the phone down at night', 'Spends a few quiet minutes each morning']],
  [/money|save|saving|financ|spend|budget/i, ['Checks spending once a week', 'Waits a day before buying extras', 'Puts a little aside each payday']],
  [/home|tidy|clean|cosy|organis/i, ['Resets the kitchen each night', 'Puts things back straight away', 'Does one small job a day']],
  [/friend|family|partner|kind|social|connect/i, ['Texts someone they care about each week', 'Listens without fixing', 'Remembers birthdays']],
  [/creat|art|draw|paint|write|music|make/i, ['Makes something small every week', 'Carries a sketchbook or notes app', 'Creates before consuming']],
  [/follow|through|reliable|consistent|discipl/i, ['Does the small thing now instead of later', 'Keeps promises to themselves', 'Shows up even on hard days']],
  [/early|morning|riser|sleep|rest/i, ['Goes to bed at the same time', 'Gets up without snoozing', 'Rests without guilt']],
  [/.*/, ['Starts small and keeps going', 'Shows up even on hard days', 'Does the small thing now instead of later']],
]

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="mt-1.5">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1 text-[12.5px] font-semibold text-accent"><Sparkles className="size-3.5" />{open ? 'Hide the ideas' : title}</button>
      {open && <div className="mt-2 rounded-2xl bg-accent-soft px-3 py-2.5">{children}</div>}
    </div>
  )
}
const Lbl = ({ children }: { children: React.ReactNode }) => <div className="mt-2.5 mb-1.5 text-[12px] font-semibold text-mute first:mt-0">{children}</div>

/** Under "I'm…": starters, ready-made identities, and a nudge from the person's own goals. */
export function IdentityNameHelper({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const goals = getS().goals.filter((g) => !g.done).slice(0, 3)
  const focus = (v: string) => { onChange(v); setTimeout(() => { const el = document.getElementById('f_name') as HTMLInputElement | null; if (el) { el.focus(); el.setSelectionRange(v.length, v.length) } }, 30) }
  return (
    <Panel title="Stuck? Get a nudge">
      <Lbl>Finish one of these</Lbl>
      <div className="flex flex-wrap gap-1.5">{STARTERS.map((x) => <button type="button" key={x} className={chip} onClick={() => focus(x.replace(/…$/, ' '))}>{x}</button>)}</div>
      <Lbl>Or pick one that fits</Lbl>
      <div className="flex flex-wrap gap-1.5">{IDEAS.map((x) => <button type="button" key={x} className={cn(chip, value === x && 'border-accent bg-accent-soft')} onClick={() => onChange(x)}>{x}</button>)}</div>
      {goals.length > 0 && <>
        <Lbl>From your goals</Lbl>
        <p className="m-0 text-[12.5px] text-mute">Who would reach {goals.length === 1 ? 'this' : 'these'} without much effort? <b className="text-ink">{goals.map((g) => g.title).join(' · ')}</b>. Describe that person – that's who you're becoming.</p>
      </>}
      <p className="mt-2.5 mb-0 text-[12.5px] text-mute">Say it as if it's already true. It doesn't need to be grand – “someone who moves every day” beats “a marathon runner”.</p>
    </Panel>
  )
}

/** Under "What this person does": small proofs that suit the identity, plus the person's own habits. */
export function IdentityDoesHelper({ name, value, onChange }: { name: string; value: string; onChange: (v: string) => void }) {
  const ideas = PROOFS.find(([re]) => re.test(name || ''))![1]
  const habits = getS().habits.map((h) => h.name).slice(0, 6)
  const add = (x: string) => { const v = (value || '').trim(); if (!v.toLowerCase().includes(x.toLowerCase())) onChange(v ? v.replace(/[.,]?$/, ', ') + x.charAt(0).toLowerCase() + x.slice(1) : x) }
  return (
    <Panel title="Need ideas?">
      <Lbl>Small proofs{name ? ` for ${name}` : ''}</Lbl>
      <div className="flex flex-wrap gap-1.5">{ideas.map((x) => <button type="button" key={x} className={chip} onClick={() => add(x)}>{x}</button>)}</div>
      {habits.length > 0 && <>
        <Lbl>Or one of your habits</Lbl>
        <div className="flex flex-wrap gap-1.5">{habits.map((x) => <button type="button" key={x} className={chip} onClick={() => add(x)}>{x}</button>)}</div>
      </>}
      <p className="mt-2.5 mb-0 text-[12.5px] text-mute">Think small and everyday. Each time you do one, it's a vote for who you're becoming.</p>
    </Panel>
  )
}
