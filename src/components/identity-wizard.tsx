import * as React from 'react'
import { Check, ChevronLeft, Plus } from 'lucide-react'
import { Button } from './ui/button'
import { Input, Textarea } from './ui/field'
import { closeSheet } from './sheet'
import { MaybePal, type PalName } from './pals'
import { getS, update } from '@/lib/store'
import { cleanId, imLine } from '@/lib/logic'
import { today } from '@/lib/date'
import { cn, uid } from '@/lib/utils'
import { toast } from 'sonner'

/**
 * "Who are you becoming?" in four short steps, built on identity research:
 * 1. a noun you can claim ("an athlete", not "someone who exercises"), 2. small everyday proofs ("Athletes move every day"),
 * plus an optional "I don't…" rule, 3. your own reason, 4. which habits are votes for it.
 */
interface Preset { id: string; name: string; they: string; pal: PalName; proofs: string[]; dont: string[]; why: string[]; match: RegExp }
export const PRESETS: Preset[] = [
  { id: 'athlete', name: 'an athlete', they: 'Athletes', pal: 'zip', match: /fit|weight|kg|run|gym|walk|steps|train|strong|sport|exercise|move|body/i,
    proofs: ['move every day', 'train, even when it’s short', 'eat to fuel their body', 'sleep to recover', 'drink plenty of water'],
    dont: ['skip two days in a row', 'drink soft drink on weeknights'],
    why: ['to have energy for the people I love', 'to feel strong in my body', 'to keep up with my kids and friends', 'to feel proud of what my body can do'] },
  { id: 'reader', name: 'a reader', they: 'Readers', pal: 'dottie', match: /read|book|novel|pages/i,
    proofs: ['read every day, even a page', 'always have a book on the go', 'pick a book over scrolling', 'read before bed'],
    dont: ['scroll in bed', 'leave the house without a book'],
    why: ['to switch off and slow down', 'to keep learning', 'to have something that’s just for me'] },
  { id: 'calm', name: 'a calm person', they: 'Calm people', pal: 'chai', match: /calm|stress|anx|peace|mindful|relax|meditat/i,
    proofs: ['pause before reacting', 'take a breath when it gets busy', 'protect their quiet time', 'switch off at night'],
    dont: ['check emails after 8pm', 'say yes to everything'],
    why: ['to be kinder to the people around me', 'to sleep better', 'to enjoy my days instead of rushing through them'] },
  { id: 'saver', name: 'a saver', they: 'Savers', pal: 'mimi', match: /save|saving|money|debt|budget|financ|spend/i,
    proofs: ['check their spending each week', 'wait a day before buying extras', 'put a little aside each payday'],
    dont: ['buy on impulse', 'shop when bored'],
    why: ['to feel safe when surprises happen', 'to stop worrying about money', 'to give myself choices later'] },
  { id: 'creative', name: 'a creative person', they: 'Creative people', pal: 'bloom', match: /creat|art|draw|paint|write|music|craft|design/i,
    proofs: ['make something every week', 'create before consuming', 'keep a sketchbook or notes app handy'],
    dont: ['wait for the perfect idea', 'judge a first draft'],
    why: ['because making things makes me happy', 'to have something that’s just mine', 'to finish what I start'] },
  { id: 'early', name: 'an early riser', they: 'Early risers', pal: 'sunny', match: /early|morning|sleep|wake|bed/i,
    proofs: ['go to bed on time', 'get up without snoozing', 'start the day before the phone'],
    dont: ['hit snooze', 'scroll before getting up'],
    why: ['to have calm time before the day starts', 'to feel rested', 'to stop rushing every morning'] },
  { id: 'eater', name: 'a healthy eater', they: 'Healthy eaters', pal: 'brocco', match: /eat|food|meal|cook|diet|nutri|sugar|veg/i,
    proofs: ['eat real food most of the time', 'have veggies with every meal', 'drink water first', 'plan meals ahead'],
    dont: ['eat straight from the packet', 'skip meals then snack'],
    why: ['to feel good after I eat', 'to have steady energy', 'to look after future me'] },
  { id: 'friend', name: 'a good friend', they: 'Good friends', pal: 'hugs', match: /friend|family|partner|social|connect|kind|people/i,
    proofs: ['check in every week', 'listen without fixing', 'remember the little things'],
    dont: ['leave messages for days', 'cancel last minute'],
    why: ['because my people matter to me', 'to feel less lonely', 'to be there like they are for me'] },
  { id: 'finisher', name: 'someone who follows through', they: 'People who follow through', pal: 'stickle', match: /finish|follow|procrast|consisten|disciplin|habit|goal/i,
    proofs: ['do the small thing now', 'keep promises to themselves', 'start before they feel ready'],
    dont: ['miss twice', 'wait until they feel like it'],
    why: ['to trust myself again', 'to stop feeling behind', 'to feel proud at the end of the day'] },
  { id: 'learner', name: 'a learner', they: 'Learners', pal: 'flaggy', match: /learn|study|course|skill|language|class/i,
    proofs: ['learn one small thing a day', 'practise a little, often', 'ask questions'],
    dont: ['give up after one hard day', 'compare their chapter 1 to someone’s chapter 20'],
    why: ['to open new doors', 'to feel capable', 'because I love understanding things'] },
]
const GENERIC_WHY = ['so I can feel proud of myself', 'so future me has an easier time', 'because the people I love deserve the best of me', 'to feel more like myself']
const GENERIC_DONT = ['miss twice', 'wait until I feel like it']

const chip = 'rounded-full border border-line bg-card px-3 py-1.5 text-left text-[13px] hover:border-accent'
const say = (they: string, p: string) => (they ? `${they} ${p}.` : `I ${p}.`)

export function IdentityWizard({ id }: { id?: string }) {
  const s = getS(), x = id ? s.identities.find((i) => i.id === id) : undefined
  const startPreset = PRESETS.find((p) => x && cleanId(x.name).toLowerCase() === p.name)
  const [step, setStep] = React.useState(0)
  const [preset, setPreset] = React.useState<Preset | undefined>(startPreset)
  const [name, setName] = React.useState(x ? cleanId(x.name) : '')
  const [they, setThey] = React.useState(x?.they ?? startPreset?.they ?? '')
  const [proofs, setProofs] = React.useState<string[]>(x?.proofs ?? (x?.does ? [x.does] : []))
  const [own, setOwn] = React.useState('')
  const [dont, setDont] = React.useState(x?.dont ?? '')
  const [why, setWhy] = React.useState(x?.why ?? '')
  const [linked, setLinked] = React.useState<string[]>(s.habits.filter((h) => id && h.identity === id).map((h) => h.id))
  const [newHabits, setNewHabits] = React.useState<string[]>([])
  const goalText = s.goals.filter((g) => !g.done).map((g) => g.title).join(' ')
  const suggested = goalText ? PRESETS.filter((p) => p.match.test(goalText)).slice(0, 3) : []

  const choose = (p: Preset) => { setPreset(p); setName(p.name); setThey(p.they); setProofs(p.proofs.slice(0, 2)); setStep(1) }
  const toggle = (arr: string[], v: string, set: (a: string[]) => void) => set(arr.includes(v) ? arr.filter((a) => a !== v) : [...arr, v])
  const proofIdeas = preset?.proofs ?? []
  const whyIdeas = preset?.why ?? GENERIC_WHY
  const dontIdeas = preset?.dont ?? GENERIC_DONT
  const head = (t: string, sub?: string) => <><h3 className="mb-1 text-[21px] leading-tight">{t}</h3>{sub && <p className="mt-0 mb-3 text-[13.5px] text-mute">{sub}</p>}</>

  const save = () => {
    const nm = cleanId(name)
    if (!nm) { setStep(0); return }
    const iid = id || uid()
    update((d) => {
      const rec = { name: nm, they: they.trim() || undefined, proofs, why: why.trim() || undefined, dont: dont.trim() || undefined, does: proofs.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(', ') }
      const i = d.identities.find((k) => k.id === iid)
      if (i) Object.assign(i, rec); else d.identities.push({ id: iid, ...rec })
      d.habits.forEach((h) => { if (linked.includes(h.id)) h.identity = iid; else if (h.identity === iid) h.identity = '' })
      for (const p of newHabits) d.habits.push({ id: uid(), name: p.charAt(0).toUpperCase() + p.slice(1), mode: 'days', days: [0, 1, 2, 3, 4, 5, 6], perWeek: 3, identity: iid, created: today(), log: {} })
    })
    closeSheet()
    toast(`${imLine(nm)} Every habit you keep is a vote for it.`)
  }

  const steps = [
    // 1 · Who
    <div key="who">
      {head('Who are you becoming?', 'Pick who you want to be, as if it’s already true. “I’m an athlete” sticks better than “I want to exercise more”.')}
      {suggested.length > 0 && <>
        <div className="mb-1.5 text-[12px] font-semibold text-mute">Fits your goals</div>
        <div className="mb-3 flex flex-wrap gap-1.5">{suggested.map((p) => <button key={p.id} type="button" className={cn(chip, 'border-accent')} onClick={() => choose(p)}>I’m {p.name}</button>)}</div>
      </>}
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((p) => (
          <button key={p.id} type="button" onClick={() => choose(p)} className={cn('flex items-center gap-2 rounded-2xl border-[1.5px] px-2.5 py-2 text-left text-[13.5px]', name === p.name ? 'border-accent bg-accent-soft font-semibold' : 'border-line bg-card')}>
            <MaybePal name={p.pal} size={30} /><span>I’m {p.name}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 text-[12px] font-semibold text-mute">Or in your own words</div>
      <div className="mt-1 flex items-center gap-2"><span className="text-[15px]">I’m</span><Input value={preset ? '' : name} placeholder="e.g. a runner, a gardener, a calm mum" onChange={(e) => { setPreset(undefined); setName(e.target.value) }} /></div>
    </div>,
    // 2 · What they do
    <div key="do">
      {head(`What do ${they ? they.toLowerCase() : 'you'} do?`, 'Pick one to three small, everyday things. These are your proofs – each one is a vote for who you’re becoming.')}
      {!preset && <div className="mb-3"><div className="mb-1 text-[12px] font-semibold text-mute">People like this are… (optional)</div><Input value={they} placeholder="e.g. Runners, Gardeners" onChange={(e) => setThey(e.target.value)} /></div>}
      <div className="flex flex-col gap-1.5">
        {[...new Set([...proofIdeas, ...proofs])].map((p) => (
          <button key={p} type="button" onClick={() => toggle(proofs, p, setProofs)} className={cn('flex items-center gap-2.5 rounded-xl border-[1.5px] px-3 py-2 text-left text-[14px]', proofs.includes(p) ? 'border-accent bg-accent-soft' : 'border-line bg-card')}>
            <span className={cn('grid size-5 flex-none place-items-center rounded-md border-[1.5px]', proofs.includes(p) ? 'border-accent bg-accent text-on-accent' : 'border-line')}>{proofs.includes(p) && <Check className="size-3.5" />}</span>
            {say(they, p)}
          </button>
        ))}
      </div>
      <form className="mt-2 flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); const v = own.trim().replace(/\.$/, ''); if (v) { setProofs([...proofs, v.charAt(0).toLowerCase() + v.slice(1)]); setOwn('') } }}>
        <span className="text-[14px] whitespace-nowrap">{they || 'I'}</span><Input value={own} placeholder="add your own, e.g. stretch while the kettle boils" onChange={(e) => setOwn(e.target.value)} />
        <Button type="submit" size="sm" aria-label="Add"><Plus className="size-4" /></Button>
      </form>
      <div className="mt-4 text-[12px] font-semibold text-mute">One thing {they ? they.toLowerCase() : 'you'} don’t do (optional)</div>
      <p className="mt-0.5 mb-1.5 text-[12px] text-mute">“I don’t” feels like a choice; “I can’t” feels like a rule someone gave you.</p>
      <div className="flex items-center gap-2"><span className="text-[14px] whitespace-nowrap">I don’t</span><Input value={dont} placeholder={dontIdeas[0]} onChange={(e) => setDont(e.target.value)} /></div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">{dontIdeas.map((d) => <button key={d} type="button" className={cn(chip, dont === d && 'border-accent bg-accent-soft')} onClick={() => setDont(dont === d ? '' : d)}>{d}</button>)}</div>
    </div>,
    // 3 · Why
    <div key="why">
      {head(`Why does being ${name || 'this'} matter to you?`, 'Your own reason is what you’ll come back to on a hard day. Finish the sentence, or borrow one and make it yours.')}
      <Textarea id="id_why" rows={3} value={why} placeholder="Because I want to…" onChange={(e) => setWhy(e.target.value)} />
      <div className="mt-2 mb-1.5 text-[12px] font-semibold text-mute">Start with</div>
      <div className="flex flex-wrap gap-1.5">{['So I can ', 'Because I want to feel ', 'For ', 'So that one day '].map((t) => <button key={t} type="button" className={chip} onClick={() => { const v = (why ? why.trim() + ' ' : '') + t; setWhy(v); setTimeout(() => { const el = document.getElementById('id_why') as HTMLTextAreaElement | null; if (el) { el.focus(); el.setSelectionRange(v.length, v.length) } }, 30) }}>{t.trim()}…</button>)}</div>
      <div className="mt-2.5 mb-1.5 text-[12px] font-semibold text-mute">Or borrow a reason</div>
      <div className="flex flex-wrap gap-1.5">{whyIdeas.map((t) => <button key={t} type="button" className={chip} onClick={() => setWhy(t.charAt(0).toUpperCase() + t.slice(1) + '.')}>{t}</button>)}</div>
      {why.trim().length > 8 && <p className="mt-3 mb-0 rounded-xl bg-soft px-3 py-2 text-[12.5px] text-mute">Try asking <i>“and why does that matter?”</i> once more. The answer underneath is usually the one that keeps you going.</p>}
    </div>,
    // 4 · Votes
    <div key="votes">
      {head('Which habits are votes for this?', 'Every time you keep one, it counts as a vote for who you’re becoming.')}
      {s.habits.length > 0 && <div className="flex flex-col gap-1.5">
        {s.habits.map((h) => (
          <button key={h.id} type="button" onClick={() => toggle(linked, h.id, setLinked)} className={cn('flex items-center gap-2.5 rounded-xl border-[1.5px] px-3 py-2 text-left text-[14px]', linked.includes(h.id) ? 'border-accent bg-accent-soft' : 'border-line bg-card')}>
            <span className={cn('grid size-5 flex-none place-items-center rounded-md border-[1.5px]', linked.includes(h.id) ? 'border-accent bg-accent text-on-accent' : 'border-line')}>{linked.includes(h.id) && <Check className="size-3.5" />}</span>{h.name}
          </button>
        ))}
      </div>}
      {proofs.length > 0 && <>
        <div className="mt-3 mb-1.5 text-[12px] font-semibold text-mute">Start a new habit from your proofs</div>
        <div className="flex flex-wrap gap-1.5">{proofs.map((p) => <button key={p} type="button" className={cn(chip, newHabits.includes(p) && 'border-accent bg-accent-soft font-semibold')} onClick={() => toggle(newHabits, p, setNewHabits)}>{newHabits.includes(p) ? '✓ ' : '+ '}{p.charAt(0).toUpperCase() + p.slice(1)}</button>)}</div>
      </>}
      <div className="mt-4 rounded-2xl bg-accent-soft px-3.5 py-3">
        <div className="text-[11.5px] font-bold tracking-wider text-mute uppercase">Your reminder on Today</div>
        <div className="mt-1 font-serif text-[19px] leading-tight">{imLine(name || '…')}</div>
        {proofs[0] && <div className="text-[14px]">{say(they, proofs[0])}{dont ? ` I don’t ${dont.replace(/\.$/, '')}.` : ''}</div>}
        {why && <div className="mt-1 text-[12.5px] text-mute italic">“{why.trim()}”</div>}
      </div>
    </div>,
  ]
  const canNext = step === 0 ? !!cleanId(name) : step === 1 ? proofs.length > 0 : true
  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5 pr-9">
        {step > 0 && <button type="button" aria-label="Back" className="-ml-1 grid size-8 place-items-center rounded-full hover:bg-soft" onClick={() => setStep(step - 1)}><ChevronLeft className="size-5" /></button>}
        <div className="flex flex-1 gap-1">{steps.map((_, i) => <span key={i} className={cn('h-1.5 flex-1 rounded-full', i <= step ? 'bg-accent' : 'bg-line')} />)}</div>
      </div>
      {steps[step]}
      <div className="mt-4 flex items-center justify-end gap-2">
        {id && step === 0 && <Button variant="ghost" className="mr-auto" onClick={() => { update((d) => { d.identities = d.identities.filter((i) => i.id !== id); d.habits.forEach((h) => { if (h.identity === id) h.identity = '' }) }); closeSheet() }}>Delete</Button>}
        {step < 3 ? <Button variant="primary" disabled={!canNext} onClick={() => setStep(step + 1)}>{step === 2 && !why.trim() ? 'Skip for now' : 'Next'}</Button>
          : <Button variant="primary" onClick={save}>{id ? 'Save' : 'Become it'}</Button>}
      </div>
    </div>
  )
}
