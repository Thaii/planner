import { Ico } from '@/components/doodles'
import { ExternalLink } from 'lucide-react'
import { create } from 'zustand'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InlineAdd } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import { PageHead } from '@/components/bits'
import { openForm, type Field } from '@/components/sheet'
import { getS, update, undoable, useS } from '@/lib/store'
import { fmt } from '@/lib/date'
import { money } from '@/lib/food'
import type { ListItem, State } from '@/lib/types'
import { go } from '@/lib/ui'
import { cn, uid } from '@/lib/utils'

/** Extra details a list can ask for, beyond the title. `by` is the "who / where" slot. */
type Slot = 'by' | 'price' | 'link' | 'date' | 'where' | 'extra'
interface Def {
  key: string; name: string; icon: string; desc: string; stages: string[]; rated: boolean; custom?: boolean
  title: string; ph?: string
  /** Label for each extra field this list asks for, in order. */
  fields: Partial<Record<Slot, string>>
  /** Adding opens the full form (for lists where the details matter), instead of adding the title straight away. */
  full?: boolean
  /** Group items by the `by` field (e.g. who a gift is for). */
  group?: boolean
}

const DEFS: Def[] = [
  { key: 'books', name: 'Books', icon: '📚', desc: 'To read, reading, read', stages: ['To read', 'Reading', 'Read'], rated: true, title: 'Title', fields: { by: 'Author', extra: 'Genre or recommended by' } },
  { key: 'movies', name: 'Movies', icon: '🎬', desc: 'Watchlist, watched, loved', stages: ['Watchlist', 'Watched', 'Loved'], rated: true, title: 'Movie', fields: { where: 'Where to watch', extra: 'Year or genre' } },
  { key: 'tv', name: 'TV shows', icon: '📺', desc: 'Queued, watching, finished', stages: ['To watch', 'Watching', 'Finished'], rated: true, title: 'Show', fields: { where: 'Where to watch', extra: 'Up to (season / episode)' } },
  { key: 'podcasts', name: 'Podcasts', icon: '🎧', desc: 'Queued and on repeat', stages: ['To try', 'Listening', 'Favourite'], rated: true, title: 'Podcast', fields: { by: 'Host', where: 'Where to listen' } },
  { key: 'restaurants', name: 'Restaurants', icon: '🍽️', desc: 'To try, been, go back to', stages: ['To try', 'Been', 'Go back'], rated: true, title: 'Restaurant', full: true, fields: { by: 'Suburb or area', extra: 'Cuisine', where: 'What to order', price: 'Cost per person', link: 'Website or booking link' } },
  { key: 'places', name: 'Places to visit', icon: '📍', desc: 'Near and far', stages: ['Wishlist', 'Visited'], rated: true, title: 'Place', full: true, fields: { by: 'Where is it', extra: 'Best time to go', price: 'Rough cost', link: 'Link' } },
  { key: 'bucket', name: 'Bucket list', icon: '✦', desc: 'The big ones', stages: ['Someday', 'Planned', 'Done'], rated: false, title: 'Dream', fields: { date: 'By when', price: 'Rough cost', extra: 'First step' } },
  { key: 'gifts', name: 'Gift ideas', icon: '🎁', desc: 'Noted all year round', stages: ['Idea', 'Bought', 'Given'], rated: false, title: 'What is it', ph: 'e.g. Ceramic mug set', full: true, group: true, fields: { by: 'Who is it for', extra: 'Occasion', price: 'Price', link: 'Where to buy (link)', where: 'Or which shop' } },
  { key: 'birthday', name: 'Birthday ideas', icon: '🎂', desc: 'For you and them', stages: ['Idea', 'Bought', 'Given'], rated: false, title: "What's the idea", ph: 'e.g. Pottery class', full: true, group: true, fields: { by: 'Who is it for', date: 'Their birthday', price: 'Price', link: 'Where to buy (link)', where: 'Or which shop' } },
  { key: 'christmas', name: 'Christmas list', icon: '🎄', desc: 'Start early, finish calm', stages: ['Idea', 'Bought', 'Wrapped'], rated: false, title: 'Gift', full: true, group: true, fields: { by: 'Who is it for', price: 'Price', link: 'Where to buy (link)', where: 'Or which shop' } },
  { key: 'wishlist', name: 'Wishlist', icon: '💫', desc: 'Nice-to-haves', stages: ['Want', 'Saving', 'Bought'], rated: false, title: 'What do you want', full: true, fields: { price: 'Price', link: 'Where to buy (link)', where: 'Or which shop', extra: 'Size, colour, model' } },
  { key: 'favourites', name: 'Favourite things', icon: '⭐', desc: 'Small joys worth keeping', stages: [], rated: true, title: 'Thing', fields: { by: 'Category', extra: 'Why I love it' } },
  { key: 'quotes', name: 'Quotes', icon: '❝', desc: 'Words that stuck', stages: [], rated: false, title: 'Quote', fields: { by: 'Who said it', extra: 'Where it is from' } },
]

/** Fields someone can switch on for a list they make themselves. */
const CUSTOM_FIELDS: [Slot, string][] = [['by', 'Who / where'], ['price', 'Price'], ['link', 'Link'], ['date', 'Date'], ['extra', 'Extra detail']]

const allDefs = (s: State): Def[] => DEFS.concat(s.customLists.map((c) => ({
  key: c.key, name: c.name, icon: c.icon || '✦', desc: c.desc || 'Your own', stages: c.stages || [], rated: true, custom: true, title: 'Title',
  // Lists made before fields existed keep the old "extra detail" box.
  fields: Object.fromEntries((c.fields ?? ['by']).map((f) => [f, (CUSTOM_FIELDS.find((x) => x[0] === f) || [f, f])[1]])),
})))

const useL = create<{ key: string | null; stage: string }>(() => ({ key: null, stage: 'all' }))

const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' } }
const fixLink = (u?: string) => !u ? '' : /^https?:\/\//i.test(u) ? u : /\./.test(u) ? 'https://' + u : u

function itemForm(c: Def, id?: string, title?: string) {
  const it = id ? (getS().lists[c.key] || []).find((x) => x.id === id) : undefined
  const cur = useL.getState().stage
  const people = [...new Set((getS().lists[c.key] || []).map((x) => x.by).filter(Boolean) as string[])]
  const F = c.fields
  const fields: Field[] = []
  // "Who is it for" comes first on gift lists – that's how people think about them.
  if (c.group && F.by) fields.push({ k: 'by', l: F.by, v: it?.by, list: people, ph: 'e.g. Mum' })
  fields.push({ k: 'title', l: c.title, t: c.key === 'quotes' ? 'textarea' : 'text', rows: 3, v: it?.title ?? title, ph: c.ph })
  if (!c.group && F.by) fields.push({ k: 'by', l: F.by, v: it?.by, list: c.key === 'favourites' ? people : undefined })
  if (F.date) fields.push({ k: 'date', l: F.date, t: 'date', v: it?.date, half: true })
  if (F.price) fields.push({ k: 'price', l: F.price + ' ($)', t: 'number', step: '0.01', min: 0, v: it?.price, half: true })
  if (c.stages.length) fields.push({ k: 'stage', l: 'Stage', t: 'select', o: c.stages.map((x) => [x, x]), v: it?.stage || (cur !== 'all' ? cur : c.stages[0]), half: true })
  if (c.rated) fields.push({ k: 'rating', l: 'Rating', t: 'select', o: [[0, '—'], [1, '★'], [2, '★★'], [3, '★★★'], [4, '★★★★'], [5, '★★★★★']], v: it?.rating || 0, half: true })
  if (F.link) fields.push({ k: 'link', l: F.link, v: it?.link, ph: 'Paste a link' })
  if (F.where) fields.push({ k: 'where', l: F.where, v: it?.where })
  if (F.extra) fields.push({ k: 'extra', l: F.extra, v: it?.extra })
  fields.push({ k: 'notes', l: 'Notes', t: 'textarea', rows: 2, v: it?.notes })
  openForm({
    title: (it ? 'Edit · ' : 'Add to ') + c.name,
    fields,
    onSave: (v) => {
      if (!v.title) return false
      v.rating = +v.rating || 0
      if (v.link) v.link = fixLink(v.link)
      update((d) => {
        const arr = (d.lists[c.key] = d.lists[c.key] || [])
        const x = id && arr.find((z) => z.id === id)
        if (x) Object.assign(x, v); else arr.push({ id: uid(), ...v } as ListItem)
      })
    },
    onDelete: id ? () => undoable('Removed', (d) => { d.lists[c.key] = (d.lists[c.key] || []).filter((z) => z.id !== id) }) : undefined,
  })
}

function customListForm(key?: string) {
  const c = key ? getS().customLists.find((x) => x.key === key) : undefined
  openForm({
    title: c ? 'Edit list' : 'Make a list of your own',
    fields: [
      { k: 'name', l: 'Name', v: c?.name, ph: 'e.g. Plants, Recipes to try' },
      { k: 'icon', l: 'Emoji', v: c?.icon || '✦', half: true }, { k: 'desc', l: 'Short description', v: c?.desc, half: true },
      { k: 'stages', l: 'Stages, comma separated (optional)', v: (c?.stages || []).join(', '), ph: 'e.g. Want, Have' },
    ],
    extra: (v, set) => {
      const on: string[] = v.fields ?? c?.fields ?? ['by']
      return (
        <div className="mb-3">
          <span className="mb-1.5 block text-[12.5px] font-medium text-mute">What to ask for with each item</span>
          <div className="flex flex-wrap gap-1.5">
            {CUSTOM_FIELDS.map(([k, l]) => (
              <button type="button" key={k} aria-pressed={on.includes(k)} onClick={() => set('fields', on.includes(k) ? on.filter((x) => x !== k) : [...on, k])}
                className={cn('rounded-full border px-3 py-1 text-[13px]', on.includes(k) ? 'border-accent bg-accent text-on-accent' : 'border-line bg-card')}>{l}</button>
            ))}
          </div>
        </div>
      )
    },
    onSave: (v) => {
      if (!v.name) return false
      const o = { name: v.name, icon: v.icon || '✦', desc: v.desc, stages: String(v.stages).split(',').map((x) => x.trim()).filter(Boolean), fields: (v.fields ?? c?.fields ?? ['by']) as string[] }
      update((d) => { const x = key && d.customLists.find((z) => z.key === key); if (x) Object.assign(x, o); else d.customLists.push({ key: 'c' + uid(), ...o }) })
    },
    onDelete: c ? () => { useL.setState({ key: null }); undoable('List deleted', (d) => { d.customLists = d.customLists.filter((x) => x.key !== c.key); delete d.lists[c.key] }) } : undefined,
  })
}

const Stars = ({ n }: { n?: number }) => n ? <span className="text-[13px] tracking-tight text-accent" aria-label={n + ' stars'}>{'★'.repeat(n)}<span className="text-line">{'★'.repeat(5 - n)}</span></span> : null

function ItemRow({ c, i, showStage }: { c: Def; i: ListItem; showStage: boolean }) {
  const F = c.fields
  const bits = [
    showStage && i.stage,
    !c.group && i.by,
    F.date && i.date && (c.key === 'birthday' ? 'Birthday ' + fmt(i.date, { day: 'numeric', month: 'short' }) : 'By ' + fmt(i.date, { day: 'numeric', month: 'short', year: 'numeric' })),
    F.where && i.where, F.extra && i.extra, i.notes,
  ].filter(Boolean)
  const link = fixLink(i.link)
  return (
    <div role="button" tabIndex={0} className="row cursor-pointer" onClick={() => itemForm(c, i.id)} onKeyDown={(e) => e.key === 'Enter' && itemForm(c, i.id)}>
      <div className="min-w-0 flex-1">
        <div className={c.key === 'quotes' ? 'font-serif text-[16px] whitespace-pre-wrap' : 'tt'}>{i.title}</div>
        {!!bits.length && <div className="text-[12.5px] text-mute">{bits.join(' · ')}</div>}
      </div>
      {c.rated && <Stars n={i.rating} />}
      {i.price !== undefined && i.price !== '' && <span className="font-mono text-[12.5px]">{money(+i.price)}</span>}
      {link && /^https?:/i.test(link) && (
        <a href={link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} title={link}
          className="flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[12px] text-accent">
          <ExternalLink className="size-3.5" /><span className="max-w-[90px] truncate max-[480px]:hidden">{host(link) || 'Open'}</span>
        </a>
      )}
    </div>
  )
}

function ListView({ c }: { c: Def }) {
  const s = useS()
  const stage = useL((l) => l.stage)
  const items = s.lists[c.key] || []
  const shown = stage === 'all' ? items : items.filter((i) => i.stage === stage)
  const priced = shown.filter((i) => i.price !== undefined && i.price !== '')
  const total = priced.reduce((a, i) => a + (+i.price! || 0), 0)
  const groups = c.group
    ? [...new Set(shown.map((i) => i.by || ''))].sort((a, b) => (a ? 0 : 1) - (b ? 0 : 1) || a.localeCompare(b)).map((who) => [who, shown.filter((i) => (i.by || '') === who)] as const)
    : [['', shown] as const]
  const quick = (t: string) => {
    if (c.full) return itemForm(c, undefined, t)
    update((d) => { (d.lists[c.key] = d.lists[c.key] || []).push({ id: uid(), title: t, stage: c.stages.length ? (stage !== 'all' ? stage : c.stages[0]) : undefined, rating: 0 }) })
  }
  return (
    <div>
      <Button variant="link" className="text-[13.5px]" onClick={() => useL.setState({ key: null })}>← Lists & collections</Button>
      <PageHead crumb="Manage · Lists" title={<><Ico e={c.icon} /> {c.name}</>} right={c.custom ? <Button onClick={() => customListForm(c.key)}>Edit list</Button> : undefined} />
      {!!c.stages.length && (
        <Segmented value={stage} onChange={(v) => useL.setState({ stage: v })}
          options={[['all', 'All · ' + items.length], ...c.stages.map((x) => [x, x + ' · ' + items.filter((i) => i.stage === x).length] as [string, string])]} />
      )}
      <Card>
        <CardHeader title={c.name} action={
          <span className="flex items-center gap-3">
            {!!priced.length && <span className="text-[12.5px] text-mute">Total <b className="font-mono text-ink">{money(total)}</b></span>}
            <Button variant="link" className="text-[12.5px]" onClick={() => itemForm(c)}>+ Add</Button>
          </span>
        } />
        {groups.map(([who, list]) => (
          <div key={who}>
            {c.group && (
              <div className="lbl mt-3 mb-0.5 flex justify-between text-mute first:mt-0">
                <span>{who ? 'For ' + who : 'Not sure who yet'}</span>
                {list.some((i) => i.price) && <span className="font-mono normal-case">{money(list.reduce((a, i) => a + (+(i.price || 0)), 0))}</span>}
              </div>
            )}
            <div className="rows">{list.map((i) => <ItemRow key={i.id} c={c} i={i} showStage={!!c.stages.length && stage === 'all'} />)}</div>
          </div>
        ))}
        {!shown.length && <Empty>Nothing here yet.</Empty>}
        <InlineAdd placeholder={c.full ? `${c.title}… (then add the details)` : 'Add to ' + c.name.toLowerCase()} onAdd={quick} />
      </Card>
    </div>
  )
}

export function ListsPage() {
  const s = useS()
  const key = useL((l) => l.key)
  const defs = allDefs(s)
  const open = key && defs.find((c) => c.key === key)
  if (open) return <ListView c={open} />
  return (
    <div>
      <PageHead crumb="Manage" title="Lists & collections" right={<Button size="mono" onClick={() => go('notes')}>Notebook</Button>} />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
        {defs.map(({ key: k, name: n, icon: i, desc, stages: st }) => {
          const it = s.lists[k] || []
          const cnt = it.length ? (st.length ? st.map((x) => [x, it.filter((y) => y.stage === x).length] as const).filter((x) => x[1]).map(([x, c]) => c + ' ' + x.toLowerCase()).join(' · ') : it.length + ' item' + (it.length === 1 ? '' : 's')) : 'Start one'
          return (
            <button key={k} onClick={() => useL.setState({ key: k, stage: 'all' })} className="flex flex-col gap-0.5 rounded-card border border-line bg-card p-3.5 text-left shadow-card">
              <span className="text-xl leading-none [html.cute_&]:text-[26px]"><Ico e={i} /></span>
              <span className="font-serif text-[17px]">{n}</span>
              <small className="text-[12px] text-mute">{desc}</small>
              <span className="mt-1 font-mono text-[11px] text-accent">{cnt}</span>
            </button>
          )
        })}
      </div>
      <Button className="mt-3" onClick={() => customListForm()}>Make one of your own</Button>
    </div>
  )
}
