import { IcoBubble } from '@/components/doodles'
import { Pal, usePals, type PalName } from './pals'
import * as React from 'react'
import { CalendarDays, Check, LayoutDashboard, Plus, Search, Settings2, ShieldCheck, Sparkles } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/field'
import { getS, update, useS } from '@/lib/store'
import { CARDS_DEF, MINIMAL } from '@/lib/constants'
import { cn } from '@/lib/utils'


/** What each card is, in a line – used by the welcome flow and the "Add to your day" tray. */
export const CARD_INFO: Record<string, [string, string]> = {
  nextup: ['👉', 'The one thing to do next, with a 5-minute start'],
  identity: ['🌱', "Who you're becoming, one small vote at a time"],
  schedule: ['🕘', "Today's events and workouts"],
  priorities: ['⭐', 'The three things that matter most today'],
  tasks: ['✅', "Today's to-dos, with what's carried over"],
  planned: ['🗓️', 'Bits from your week and month plans'],
  meals: ['🍽️', "What you're eating today"],
  grocery: ['🛒', 'The shopping list'],
  habits: ['🔁', 'Tick off habits, with a smaller "minimum" option'],
  checkin: ['💧', 'Mood, energy, water and sleep'],
  intention: ['🎯', 'One line to steer the day'],
  gratitude: ['🙏', 'A few good things, however small'],
  upcoming: ['📌', 'What is coming up in the next week'],
  home: ['🏠', 'Home jobs due this week'],
  goals: ['🏔️', 'Your goals and how far along they are'],
  meds: ['💊', 'Tick off doses and get low-supply warnings'],
  braindump: ['🧠', 'Get it out of your head, sort it later'],
  dopamine: ['🍟', 'Quick, healthy pick-me-ups when you are stuck'],
  note: ['📝', "Today's note"],
}

const BUNDLES: { id: string; icon: string; name: string; desc: string; cards: string[] }[] = [
  { id: 'tasks', icon: '✅', name: 'Staying on top of things', desc: 'To-dos, priorities, what is coming up, a brain dump', cards: ['nextup', 'priorities', 'tasks', 'planned', 'upcoming', 'braindump'] },
  { id: 'habits', icon: '🔁', name: 'Routines & habits', desc: 'Habits with an easy minimum, and who you are becoming', cards: ['habits', 'identity'] },
  { id: 'health', icon: '💊', name: 'Health & meds', desc: 'Medications, mood, water and sleep', cards: ['meds', 'checkin'] },
  { id: 'food', icon: '🍽️', name: 'Food & home', desc: 'Meals, the grocery list and home jobs', cards: ['meals', 'grocery', 'home'] },
  { id: 'feel', icon: '🌤️', name: 'Feeling good', desc: 'Intention, gratitude, a daily note and a dopamine menu', cards: ['intention', 'gratitude', 'note', 'dopamine'] },
  { id: 'goals', icon: '🏔️', name: 'Goals & the big picture', desc: 'Goal progress and who you are becoming', cards: ['goals', 'identity'] },
]

const BUNDLE_PAL: Record<string, [PalName, string]> = { tasks: ['stickle', 'bg-tint-sky'], habits: ['sprig', 'bg-tint-mint'], health: ['pip', 'bg-tint-peach'], food: ['brocco', 'bg-tint-butter'], feel: ['hugs', 'bg-tint-lav'], goals: ['twinkle', 'bg-tint-sky'] }
const TOUR_PAL: [PalName, string][] = [['sunny', 'bg-tint-butter'], ['dottie', 'bg-tint-mint'], ['twinkle', 'bg-tint-peach'], ['stickle', 'bg-tint-sky'], ['bloom', 'bg-tint-lav'], ['snoozy', 'bg-tint-lav']]

const TOUR: [React.ElementType, string, string][] = [
  [LayoutDashboard, 'Today is home', 'Your day on one page – the schedule, what to do next and quick check-ins. Tap the planner name to come back to it.'],
  [CalendarDays, 'Plan ahead when you want to', 'Week, Month and Year pages for bigger plans, plus Habits, Goals, Wellness, Food, Home, Lists, Travel and a Notebook in the menu.'],
  [Plus, 'Add anything fast', 'The Quick add button adds a to-do, event, habit, goal, brain dump or grocery item from anywhere.'],
  [Search, 'Find and jump', 'The search button (or Ctrl/⌘ K) finds anything in your planner and jumps to any page.'],
  [Settings2, 'Make it yours', 'The ⚙ button opens Customise: choose cards and their order, colours and themes, your name and greetings, and 12 or 24-hour time.'],
  [ShieldCheck, 'Private by default', 'Everything is saved on this device only. Keep a backup now and then from Customise → Calendars & data.'],
]

/** First-run welcome: name → a quick tour → pick what to help with (or skip and keep it minimal). */
export function Welcome() {
  const s = useS()
  const pals = usePals()
  const [step, setStep] = React.useState(0)
  const [name, setName] = React.useState(s.settings.name || '')
  const [picked, setPicked] = React.useState<string[]>([])
  if (s.settings.onboarded !== false) return null
  const replay = s.settings.nameAsked // seen it before: don't switch anything off
  const finish = (bundles: string[]) => update((d) => {
    const want = new Set(bundles.flatMap((b) => BUNDLES.find((x) => x.id === b)!.cards))
    if (!replay) MINIMAL.forEach((c) => want.add(c))
    d.settings.cards.forEach((c) => { if (want.has(c.id)) c.on = true; else if (!replay) c.on = false })
    // Put the chosen cards in a sensible order: the minimal ones first, then the rest as listed.
    if (!replay) d.settings.cards.sort((a, b) => (+b.on - +a.on))
    d.settings.name = name.trim(); d.settings.nameAsked = true; d.settings.onboarded = true
  })
  const steps = 3
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(20,14,8,.5)] p-5 backdrop-blur-[3px] pt-[max(20px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))]">
      <div role="dialog" aria-modal="true" aria-label="Welcome" className="welcome flex max-h-[min(86dvh,760px)] w-full max-w-[540px] flex-col rounded-[26px] bg-card text-ink shadow-[0_24px_70px_rgba(0,0,0,.3)]">
        <div className="flex items-center gap-1.5 px-7 pt-6">
          {Array.from({ length: steps }, (_, i) => <span key={i} className={cn('h-1.5 flex-1 rounded-full', i <= step ? 'bg-accent' : 'bg-soft')} />)}
        </div>
        <div className="overflow-y-auto px-7 pt-6 pb-5">
          {step === 0 && (
            <form id="w0" onSubmit={(e) => { e.preventDefault(); setStep(1) }}>
              {pals ? (
                <div className="relative mb-4 flex h-[150px] items-center justify-center overflow-hidden rounded-[22px] bg-[linear-gradient(160deg,color-mix(in_srgb,var(--accent)_22%,var(--card)),color-mix(in_srgb,var(--accent)_38%,var(--card)))]">
                  <Pal name="sunny" size={54} className="absolute top-3 left-5 -rotate-6" />
                  <Pal name="snoozy" size={108} />
                  <Pal name="twinkle" size={40} className="absolute right-6 bottom-4 rotate-12" />
                  <Pal name="sprig" size={46} className="absolute top-4 right-8" />
                </div>
              ) : <Sparkles className="mb-4 size-8 text-accent" />}
              <h2 className={cn('mb-3 text-[30px] leading-tight', pals && 'text-center')}>Welcome to your planner</h2>
              <p className={cn('mt-0 text-[15px] leading-relaxed text-mute', pals && 'text-center')}>A calm place for your day, your plans and the small habits that add up. It starts simple – you can add more whenever you like.</p>
              <label className="mt-7 block"><span className="mb-2 block text-[12.5px] font-medium text-mute">What should we call you? (optional)</span>
                <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your preferred name" /></label>
              <p className="mt-2.5 mb-0 text-[12.5px] text-mute">Used in your greeting and the planner's title. You can change it any time.</p>
            </form>
          )}
          {step === 1 && (
            <div>
              <h2 className="mb-5 text-[26px] leading-tight">A quick look around</h2>
              <div className="flex flex-col gap-5">
                {TOUR.map(([Icon, t, d], i) => (
                  <div key={t} className="flex gap-3.5">
                    {pals ? <span className={cn('grid size-12 flex-none place-items-center rounded-full', TOUR_PAL[i][1])}><Pal name={TOUR_PAL[i][0]} size={34} /></span>
                      : <span className="grid size-10 flex-none place-items-center rounded-xl bg-accent-soft text-accent"><Icon className="size-4.5" /></span>}
                    <div><div className="font-semibold text-[14.5px]">{t}</div><div className="text-[13.5px] text-mute">{d}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {step === 2 && (
            <div>
              <h2 className="mb-2 text-[26px] leading-tight">What would you like help with?</h2>
              <p className="mt-0 mb-5 text-[14px] leading-relaxed text-mute">Pick any and we'll add those cards to Today. Or skip and start with the basics – there's an "Add to your day" list at the bottom of Today whenever you want more.</p>
              <div className="grid gap-2.5 min-[480px]:grid-cols-2">
                {BUNDLES.map((b) => {
                  const on = picked.includes(b.id)
                  return (
                    <button key={b.id} type="button" aria-pressed={on} onClick={() => setPicked((p) => on ? p.filter((x) => x !== b.id) : [...p, b.id])}
                      className={cn('relative flex gap-3 rounded-2xl border-[1.5px] px-3.5 py-3 text-left', on ? 'border-accent bg-accent-soft' : 'border-line bg-card', pals && 'items-center rounded-[20px]', pals && !on && cn('border-transparent', BUNDLE_PAL[b.id][1]))}>
                      {pals ? <span className="grid size-11 flex-none place-items-center rounded-full bg-card/70"><Pal name={BUNDLE_PAL[b.id][0]} size={32} /></span> : <span className="text-xl">{b.icon}</span>}
                      <span className="min-w-0 flex-1"><span className="block font-semibold text-[14px]">{b.name}</span><span className="block text-[12.5px] text-mute">{b.desc}</span></span>
                      {on && <Check className={cn('absolute top-2 right-2 size-4 text-accent', pals && 'top-2.5 right-2.5 size-5 rounded-full bg-accent p-0.5 text-on-accent')} />}
                    </button>
                  )
                })}
              </div>
              <p className="mt-4 mb-0 text-[12.5px] text-mute">Always on to start: {MINIMAL.map((id) => (CARDS_DEF.find((c) => c[0] === id) || [id, id])[1]).join(', ')}.</p>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-7 py-4">
          {step > 0 ? <Button onClick={() => setStep(step - 1)}>Back</Button> : <Button variant="ghost" className="text-mute" onClick={() => finish([])}>Skip setup</Button>}
          <span className="flex-1" />
          {step === 0 && <Button variant="primary" type="submit" form="w0">Next</Button>}
          {step === 1 && <Button variant="primary" onClick={() => setStep(2)}>Next</Button>}
          {step === 2 && <>
            <Button variant="ghost" className="text-mute" onClick={() => finish([])}>{replay ? 'Close' : 'Skip, keep it simple'}</Button>
            <Button variant="primary" className="max-[420px]:order-first max-[420px]:w-full" disabled={!picked.length} onClick={() => finish(picked)}>Add {picked.length ? picked.length + ' ' : ''}to Today</Button>
          </>}
        </div>
      </div>
    </div>
  )
}

/** Hidden cards as one-tap chips at the bottom of Today, so nothing has to be found in Customise. */
export function AddToDay() {
  const s = useS()
  const [all, setAll] = React.useState(false)
  if (s.settings.trayHidden) return null
  const off = s.settings.cards.filter((c) => !c.on && CARD_INFO[c.id])
  if (!off.length) return null
  const show = (id: string) => update((d) => {
    const i = d.settings.cards.findIndex((c) => c.id === id)
    const [c] = d.settings.cards.splice(i, 1); c.on = true
    // Add it after the last card that's showing, so it appears at the end of the day.
    const last = d.settings.cards.map((x) => x.on).lastIndexOf(true)
    d.settings.cards.splice(last + 1, 0, c)
  })
  return (
    <section className="mt-4 rounded-card border border-dashed border-line px-4 py-3.5">
      <div className="mb-2 flex items-center gap-2">
        <span className="lbl flex-1 text-mute">Add to your day</span>
        <button className="text-[12px] text-mute underline" onClick={() => update((d) => { d.settings.trayHidden = true })}>Hide this</button>
      </div>
      <div className="grid gap-1.5 min-[640px]:grid-cols-2 min-[1100px]:grid-cols-3">
        {(all ? off : off.slice(0, 4)).map((c, i) => {
          const [icon, desc] = CARD_INFO[c.id], name = (CARDS_DEF.find((x) => x[0] === c.id) || [c.id, c.id])[1]
          return (
            <button key={c.id} onClick={() => show(c.id)} className="flex items-center gap-2.5 rounded-xl bg-soft px-3 py-2 text-left hover:bg-accent-soft">
              <IcoBubble e={icon} i={i} />
              <span className="min-w-0 flex-1"><span className="block text-[13.5px] font-semibold">{name}</span><span className="block truncate text-[12px] text-mute">{desc}</span></span>
              <Plus className="size-4 flex-none text-accent" />
            </button>
          )
        })}
      </div>
      {off.length > 4 && <button className="mt-2 text-[13px] text-accent underline" onClick={() => setAll(!all)}>{all ? 'Show fewer' : `Show all ${off.length}`}</button>}
    </section>
  )
}

/** Open the welcome again (from Customise). Keeps current cards; only adds. */
export const replayWelcome = () => { if (getS().settings) update((d) => { d.settings.onboarded = false }) }
