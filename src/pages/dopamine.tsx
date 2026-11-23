import { Sections } from '@/components/sections'
import * as React from 'react'
import { Play, Plus, Minus } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from '@/components/ui/check'
import { InlineAdd } from '@/components/ui/field'
import { Num } from '@/components/ui/num'
import { PageHead } from '@/components/bits'
import { Stat, StatGrid } from '@/components/stat'
import { openForm } from '@/components/sheet'
import { startFive } from '@/components/five'
import { useS, update } from '@/lib/store'
import { addD, range, today } from '@/lib/date'
import { COURSES, dpDone, logDopa, showDopa } from '@/lib/menus'
import type { DopaItem } from '@/lib/types'
import { cn, uid } from '@/lib/utils'

function dopaForm(i: DopaItem) {
  openForm({
    title: 'Dopamine menu item',
    fields: [
      { k: 'text', l: 'Item', v: i.text },
      { k: 'course', l: 'Course', t: 'select', o: COURSES.map((c) => [c[0], `${c[2]} ${c[1]}`]), v: i.course, half: true },
      { k: 'mins', l: 'Timer minutes (0 = none)', t: 'number', min: 0, max: 240, v: i.mins || 0, half: true },
    ],
    onSave: (v) => { if (!v.text) return false; update((d) => { const x = d.dopa.find((z) => z.id === i.id); if (x) Object.assign(x, { text: v.text, course: v.course, mins: +v.mins || 0 }) }) },
    onDelete: () => update((d) => { d.dopa = d.dopa.filter((z) => z.id !== i.id) }),
  })
}

const Tile = ({ e, t, d, x, tag, best }: { e: string; t: string; d: string; x: string; tag?: string; best?: boolean }) => (
  <div className={cn('relative flex flex-col gap-px rounded-xl bg-soft p-2.5', best && 'shadow-[inset_0_0_0_1.5px_var(--accent)]')}>
    <span className="text-[22px]">{e}</span><b className="text-[14.5px]">{t}</b><small className="text-[12.5px] text-mute">{d}</small><small className="mt-0.5 text-[11.5px] text-mute italic">{x}</small>
    {tag && <span className={cn('absolute top-2 right-2 rounded-full px-1.5 py-0.5 font-mono text-[9.5px] tracking-wider uppercase', best ? 'bg-accent text-on-accent' : 'bg-warn/25')}>{tag}</span>}
  </div>
)
const Dot = ({ children }: { children: React.ReactNode }) => <li className="relative pl-[18px] text-[14.5px] before:absolute before:top-[0.55em] before:left-0.5 before:size-[7px] before:rounded-full before:bg-accent">{children}</li>
const H4 = ({ children }: { children: React.ReactNode }) => <h4 className="mt-4 mb-1.5 font-mono text-[11px] font-medium tracking-[0.08em] text-accent uppercase">{children}</h4>

/** Collapsed by default every visit; ADHD-friendly: TL;DR, visual steps, examples, science folded away. */
function Explainer() {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="mb-3.5 rounded-card border border-line bg-card px-4 shadow-card">
      <button className="flex w-full items-center gap-2.5 py-3 text-left" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="font-serif text-xl">How this works</span><span className="text-[13px] text-mute">· 2 min read</span>
        <span className="flex-1" />{open ? <Minus className="size-5 text-mute" /> : <Plus className="size-5 text-mute" />}
      </button>
      {open && (
        <div className="max-w-[820px] pb-3.5">
          <div className="pb-3 font-serif text-2xl leading-tight">Bored or stuck? <span className="text-accent">Don't decide.</span> Order from your menu.</div>
          <p className="mt-0 mb-3.5 max-w-[720px] text-[14.5px]">A dopamine menu is a <b>list of things that give you a lift</b>, written ahead of time. It's called “dopamine” because dopamine is the brain chemical behind motivation and reward. A leading theory is that ADHD brains get less of it, which is why they keep hunting for something more interesting. The menu points that hunt somewhere useful.</p>
          <div className="flex flex-col gap-2 min-[600px]:flex-row">
            {[['👀', 'Notice', 'Bored, stuck, or reaching for your phone'], ['🍽️', 'Pick', 'From the menu, or tap “Pick one for me”'], ['⏱️', 'Timer', 'When it ends, back to your task']].map(([e, t, d], i) => (
              <React.Fragment key={t}>
                {i > 0 && <span className="hidden self-center text-mute min-[600px]:block">→</span>}
                <div className="flex flex-1 items-center gap-2.5 rounded-[14px] bg-soft p-3 min-[600px]:flex-col min-[600px]:items-start min-[600px]:gap-0.5">
                  <span className="text-2xl">{e}</span><b className="text-[15px]">{t}</b><small className="ml-auto max-w-[55%] text-right text-[12.5px] text-mute min-[600px]:ml-0 min-[600px]:max-w-none min-[600px]:text-left">{d}</small>
                </div>
              </React.Fragment>
            ))}
          </div>
          <H4>Why it works</H4>
          <ul className="m-0 grid list-none gap-1.5 p-0">
            <Dot><b>Deciding is the hard part.</b> You've already decided when you wrote the menu.</Dot>
            <Dot><b>Your phone wins by default.</b> The menu gives you a better default.</Dot>
            <Dot><b>The timer brings you back</b>, so a break doesn't become an hour.</Dot>
          </ul>
          <H4>See it in action</H4>
          <div className="grid gap-2 min-[760px]:grid-cols-2">
            {[['😩', "You can't make yourself start the expenses.", <>Order a <b>side</b>: put on a podcast, then start the timer on the task.</>],
              ['🥱', '3pm slump, brain feels like mush.', <>Order an <b>appetizer</b>: dance to one song, then back to it.</>],
              ['📱', "Evening, you're about to doomscroll.", <>Order a <b>main</b> instead, like a walk. Or have scrolling as a <b>dessert</b>, with a 15-minute timer.</>],
              ['😔', 'Feeling low and run down?', <>That's for your <b>self-care menu</b> on the Wellness page. This menu is for boredom and getting unstuck.</>]].map(([e, t, d], i) => (
              <div key={i} className={cn('flex items-start gap-2.5 rounded-xl bg-soft px-3 py-2.5', i === 3 && 'border border-dashed border-line bg-transparent')}>
                <span className="text-[22px] leading-tight">{e}</span><p className="m-0 text-sm"><b>{t}</b><br />{d}</p>
              </div>
            ))}
          </div>
          <H4>The menu</H4>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] gap-2">
            <Tile e="🥟" t="Appetizers" d="5-min quick reset" x="e.g. one song, fresh air" />
            <Tile e="🍲" t="Mains" d="Feel good for hours" x="e.g. gym, cooking, art" tag="Best pick" best />
            <Tile e="🥗" t="Sides" d="Add to a boring task" x="e.g. podcast, café" />
            <Tile e="🍰" t="Desserts" d="Fun, easy to overdo" x="e.g. socials, YouTube" tag="Timer only" />
            <Tile e="✨" t="Specials" d="Treats to look forward to" x="e.g. a gig, a day trip" />
          </div>
          <H4>Make it yours</H4>
          <ul className="m-0 grid list-none gap-1.5 p-0">
            <Dot><b>Be specific:</b> “Dance to one song”, not “exercise”.</Dot>
            <Dot><b>Swap the starters</b> for what actually works for you.</Dot>
            <Dot><b>Prune it:</b> check <i>Your favourites</i> in a couple of weeks.</Dot>
          </ul>
          <div className="mt-3.5 flex flex-wrap gap-2"><Button variant="primary" onClick={() => showDopa()}>Try it now: pick one for me</Button><Button onClick={() => showDopa('side')}>Pair a side with my next task</Button></div>
          <details className="mt-3.5 border-t border-line pt-1">
            <summary className="cursor-pointer py-2 text-sm font-semibold">The science, if you're curious</summary>
            <ul className="m-0 grid list-none gap-1.5 p-0">
              <Dot>The idea comes from a 2020 <i>How to ADHD</i> video by Jessica McCabe, with ADHD coach Eric Tivers.</Dot>
              <Dot><b>No studies test dopamine menus directly.</b> The reasoning comes from research on the brain's reward system.</Dot>
              <Dot>Quick hits (scrolling, sugar) give a short spike that fades with repetition. Exercise gives a smaller lift that lasts hours. <b>So: lean on mains, keep desserts small.</b></Dot>
              <Dot>It's a practical tool, not a treatment. A GP or psychiatrist can help with the bigger picture.</Dot>
            </ul>
            <p className="text-[12.5px] text-mute">Read more: <a className="text-accent underline" href="https://theconversation.com/dopamine-menus-the-science-behind-the-trend-and-how-it-might-help-people-with-adhd-218970" target="_blank" rel="noopener noreferrer">The Conversation: Dopamine menus, the science behind the trend</a></p>
          </details>
        </div>
      )}
    </div>
  )
}

export function DopaminePage() {
  const s = useS()
  const t = today(), d7 = range(addD(t, -6), 7)
  const wk: Record<string, number> = {}
  d7.forEach((d) => (s.dopaLog[d] || []).forEach((id) => { const i = s.dopa.find((z) => z.id === id); if (i) wk[i.course] = (wk[i.course] || 0) + 1 }))
  const all: Record<string, number> = {}
  Object.values(s.dopaLog).flat().forEach((id) => (all[id] = (all[id] || 0) + 1))
  const fav = Object.entries(all).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, n]) => { const i = s.dopa.find((z) => z.id === id); return i ? `${i.text} (${n})` : '' }).filter(Boolean)
  return (
    <div>
      <PageHead crumb="Live" title="Dopamine menu" />
      <div className="mb-3.5 flex flex-wrap gap-1.5"><Button variant="primary" onClick={() => showDopa()}>Pick one for me</Button><Button onClick={() => showDopa('side')}>Pair a side with my next task</Button></div>
      <Sections page="dopamine" items={[
        { id: 'how', title: 'How this works', icon: '💡', desc: 'A quick, friendly explainer', wide: true, node: <Explainer /> },
        { id: 'stats', title: 'This week', icon: '📊', desc: 'What you ordered from the menu', wide: true, node: (<>
      <StatGrid>
        <Stat label="This week" value={<Num value={Object.values(wk).reduce((a, b) => a + b, 0)} />} note="things ordered from the menu" />
        <Stat label="Healthy picks" value={<Num value={(wk.app || 0) + (wk.main || 0) + (wk.side || 0)} />} note="appetizers, mains and sides" />
        <Stat label="Desserts" value={<Num value={wk.dessert || 0} />} note="this week, all on a timer" />
        <div className="rounded-card bg-accent-soft px-3.5 py-3"><span className="lbl text-accent">Your favourites</span><div className="mt-1.5 text-[13px]">{fav.length ? fav.map((f) => <div key={f}>{f}</div>) : 'Tick things off to see what you reach for most'}</div></div>
      </StatGrid>
        </>) },
        ...COURSES.map(([k, n, ic, desc]) => ({ id: k, title: n, icon: ic, desc, node: (<>
          <Card><CardHeader title={`${ic} ${n}`} action={<Button variant="link" className="text-[12.5px]" onClick={() => showDopa(k)}>Pick</Button>} />
            <p className="mt-0 text-[12.5px] text-mute">{desc}</p>
            <div className="rows">{s.dopa.filter((i) => i.course === k).map((i) => {
              const dn = dpDone(i.id, t)
              return (
                <div key={i.id} className={cn('row', dn && 'done')}>
                  <Check round on={dn} label={i.text} onClick={() => logDopa(i.id)} />
                  <button className="min-w-0 flex-1 text-left" onClick={() => dopaForm(i)}><div className="tt">{i.text}</div>{i.mins > 0 && <div className="text-[12.5px] text-mute">{i.mins} min</div>}</button>
                  {i.mins > 0 && !dn && <Button size="sm" onClick={() => startFive({ kind: 'dopa', id: i.id, title: i.text, mins: i.mins, lead: i.course === 'dessert' ? 'Enjoy it. The timer will tell you when.' : 'Enjoy this one.' })}><Play className="size-3" />{i.mins}m</Button>}
                </div>
              )
            })}</div>
            <InlineAdd placeholder={k === 'app' ? 'Add an appetizer' : `Add a ${n.toLowerCase().replace(/s$/, '')}`} onAdd={(v) => update((d) => { d.dopa.push({ id: uid(), text: v, course: k, mins: k === 'app' ? 5 : k === 'dessert' ? 15 : k === 'main' ? 30 : 0 }) })} />
          </Card>
        </>) })),
      ]} />
    </div>
  )
}
