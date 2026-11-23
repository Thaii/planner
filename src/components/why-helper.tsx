import * as React from 'react'
import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Fill-in-the-blank starters: tap one, then finish the sentence. */
const STARTERS = ['So I can…', 'Because I want to feel…', 'It matters to me because…', "When I've done it, I'll be able to…", "If I don't, I'll keep…", 'The person I want to be…']

/** Ready-made reasons by area of life (matched loosely on the area's name). */
const IDEAS: [RegExp, string[]][] = [
  [/health|fit|body|well/i, ['Have more energy for the people I love', 'Feel comfortable and confident in my body', 'Keep up with my kids, friends or dog', 'Sleep better and wake up clear-headed', 'Look after future me']],
  [/career|work|job|business/i, ['Do work I am proud of', 'Feel less stressed and more in control at work', 'Earn enough to stop worrying about money', 'Grow into the role I actually want', 'Show myself I can do hard things']],
  [/learn|study|skill|school/i, ['Understand something I have always been curious about', 'Open up new opportunities', 'Feel capable instead of stuck', 'Have something that is just for me', 'Keep my brain curious and sharp']],
  [/money|financ|saving/i, ['Have a safety net so surprises are not scary', 'Stop feeling anxious when I check my account', 'Pay for the things that matter to me', 'Give myself more choices later']],
  [/family|friend|relation|love|social/i, ['Be more present with the people I love', 'Feel more connected and less lonely', 'Build memories we will talk about for years', 'Be the friend or partner I want to be']],
  [/.*/, ['Feel proud of myself', 'Have more calm in my everyday life', 'Make room for what I really enjoy', 'Prove to myself I can follow through', 'Make life a bit easier for future me']],
]

/** Under "Why it matters": starters to finish and ideas to borrow, so a blank box is never the starting point. */
export function WhyHelper({ why, area, onChange }: { why: string; area: string; onChange: (v: string) => void }) {
  const [open, setOpen] = React.useState(!why)
  const ideas = IDEAS.find(([re]) => re.test(area || ''))![1]
  const add = (txt: string, finish: boolean) => {
    const base = (why || '').trim()
    const next = (base ? base + (/[.!?]$/.test(base) ? ' ' : '. ') : '') + (finish ? txt.replace(/…$/, ' ') : txt + '.')
    onChange(next)
    if (finish) setTimeout(() => { const el = document.getElementById('f_why') as HTMLTextAreaElement | null; if (el) { el.focus(); el.setSelectionRange(next.length, next.length) } }, 30)
  }
  const chip = 'rounded-full border border-line bg-card px-2.5 py-1 text-left text-[12.5px] hover:border-accent'
  return (
    <div className="mt-1.5">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1 text-[12.5px] font-semibold text-accent">
        <Sparkles className="size-3.5" />{open ? 'Hide the prompts' : 'Stuck? Get a nudge'}
      </button>
      {open && (
        <div className="mt-2 rounded-2xl bg-accent-soft px-3 py-2.5">
          <div className="mb-1.5 text-[12px] font-semibold text-mute">Finish one of these</div>
          <div className="flex flex-wrap gap-1.5">{STARTERS.map((x) => <button type="button" key={x} className={chip} onClick={() => add(x, true)}>{x}</button>)}</div>
          <div className="mt-2.5 mb-1.5 text-[12px] font-semibold text-mute">Or borrow a reason{area ? ` for ${area.toLowerCase()}` : ''}</div>
          <div className="flex flex-wrap gap-1.5">{ideas.map((x) => <button type="button" key={x} className={cn(chip, (why || '').includes(x) && 'border-accent bg-accent-soft')} onClick={() => !(why || '').includes(x) && add(x, false)}>{x}</button>)}</div>
          {(why || '').trim().length > 8 && <p className="mt-2.5 mb-0 text-[12.5px] text-mute">Dig one level deeper: ask yourself <i>“and why does that matter to me?”</i> The answer underneath is usually the one that keeps you going.</p>}
        </div>
      )}
    </div>
  )
}
