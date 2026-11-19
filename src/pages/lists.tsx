import { create } from 'zustand'
import { Card, CardHeader, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InlineAdd } from '@/components/ui/field'
import { Segmented } from '@/components/ui/segmented'
import { PageHead } from '@/components/bits'
import { openForm } from '@/components/sheet'
import { getS, update, undoable, useS } from '@/lib/store'
import type { State } from '@/lib/types'
import { go } from '@/lib/ui'
import { uid } from '@/lib/utils'

/** [key, name, icon, description, stages, rated, custom] */
type Col = [string, string, string, string, string[], boolean, boolean?]
const COLS: Col[] = [
  ['books', 'Books', '📚', 'To read, reading, read', ['To read', 'Reading', 'Read'], true],
  ['movies', 'Movies', '🎬', 'Watchlist, watched, loved', ['Watchlist', 'Watched', 'Loved'], true],
  ['tv', 'TV shows', '📺', 'Queued, watching, finished', ['To watch', 'Watching', 'Finished'], true],
  ['podcasts', 'Podcasts', '🎧', 'Queued and on repeat', ['To try', 'Listening', 'Favourite'], true],
  ['restaurants', 'Restaurants', '🍽️', 'To try, been, go back to', ['To try', 'Been', 'Go back'], true],
  ['places', 'Places to visit', '📍', 'Near and far', ['Wishlist', 'Visited'], true],
  ['bucket', 'Bucket list', '✦', 'The big ones', ['Someday', 'Planned', 'Done'], false],
  ['gifts', 'Gift ideas', '🎁', 'Noted all year round', ['Idea', 'Bought', 'Given'], false],
  ['birthday', 'Birthday ideas', '🎂', 'For you and them', ['Idea', 'Bought', 'Given'], false],
  ['christmas', 'Christmas list', '🎄', 'Start early, finish calm', ['Idea', 'Bought', 'Wrapped'], false],
  ['wishlist', 'Wishlist', '💫', 'Nice-to-haves', ['Want', 'Saving', 'Bought'], false],
  ['favourites', 'Favourite things', '⭐', 'Small joys worth keeping', [], true],
  ['quotes', 'Quotes', '❝', 'Words that stuck', [], false],
  ['lnotes', 'Notes', '📝', 'Everything else', [], false],
]
const BY: Record<string, string> = { books: 'Author', movies: 'Director', gifts: 'For whom', birthday: 'For whom', christmas: 'For whom', quotes: 'Who said it', restaurants: 'Where', places: 'Where' }
const allCols = (s: State): Col[] => COLS.concat(s.customLists.map((c) => [c.key, c.name, c.icon || '✦', c.desc || 'Your own', c.stages || [], true, true] as Col))

const useL = create<{ key: string | null; stage: string }>(() => ({ key: null, stage: 'all' }))

function itemForm(c: Col, id?: string, title?: string) {
  const [key, name, , , stages, rated] = c
  const it = id ? (getS().lists[key] || []).find((x) => x.id === id) : undefined
  const cur = useL.getState().stage
  openForm({
    title: (it ? 'Edit · ' : 'Add to ') + name,
    fields: [
      { k: 'title', l: key === 'quotes' ? 'Quote' : 'Title', t: key === 'quotes' ? 'textarea' : 'text', rows: 3, v: it?.title ?? title },
      ...(stages.length ? [{ k: 'stage', l: 'Stage', t: 'select' as const, o: stages.map((x) => [x, x] as [string, string]), v: it?.stage || (cur !== 'all' ? cur : stages[0]), half: rated }] : []),
      ...(rated ? [{ k: 'rating', l: 'Rating', t: 'select' as const, o: [[0, '—'], [1, '★'], [2, '★★'], [3, '★★★'], [4, '★★★★'], [5, '★★★★★']] as [number, string][], v: it?.rating || 0, half: !!stages.length }] : []),
      { k: 'by', l: BY[key] || 'Extra detail', v: it?.by },
      { k: 'notes', l: 'Notes', t: 'textarea', rows: 2, v: it?.notes },
    ],
    onSave: (v) => {
      if (!v.title) return false
      v.rating = +v.rating || 0
      update((d) => {
        const arr = (d.lists[key] = d.lists[key] || [])
        const x = id && arr.find((z) => z.id === id)
        if (x) Object.assign(x, v); else arr.push({ id: uid(), ...v } as never)
      })
    },
    onDelete: id ? () => undoable('Removed', (d) => { d.lists[key] = (d.lists[key] || []).filter((z) => z.id !== id) }) : undefined,
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
    onSave: (v) => {
      if (!v.name) return false
      const o = { name: v.name, icon: v.icon || '✦', desc: v.desc, stages: String(v.stages).split(',').map((x) => x.trim()).filter(Boolean) }
      update((d) => { const x = key && d.customLists.find((z) => z.key === key); if (x) Object.assign(x, o); else d.customLists.push({ key: 'c' + uid(), ...o }) })
    },
    onDelete: c ? () => { useL.setState({ key: null }); undoable('List deleted', (d) => { d.customLists = d.customLists.filter((x) => x.key !== c.key); delete d.lists[c.key] }) } : undefined,
  })
}

const Stars = ({ n }: { n?: number }) => n ? <span className="text-[13px] tracking-tight text-accent" aria-label={n + ' stars'}>{'★'.repeat(n)}<span className="text-line">{'★'.repeat(5 - n)}</span></span> : null

function ListView({ c }: { c: Col }) {
  const s = useS()
  const stage = useL((l) => l.stage)
  const [key, name, icon, , stages, rated, custom] = c
  const items = s.lists[key] || []
  const shown = stage === 'all' ? items : items.filter((i) => i.stage === stage)
  return (
    <div>
      <Button variant="link" className="text-[13.5px]" onClick={() => useL.setState({ key: null })}>← Lists & collections</Button>
      <PageHead crumb="Manage · Lists" title={icon + ' ' + name} right={custom ? <Button onClick={() => customListForm(key)}>Edit list</Button> : undefined} />
      {!!stages.length && (
        <Segmented value={stage} onChange={(v) => useL.setState({ stage: v })}
          options={[['all', 'All · ' + items.length], ...stages.map((x) => [x, x + ' · ' + items.filter((i) => i.stage === x).length] as [string, string])]} />
      )}
      <Card>
        <CardHeader title={name} />
        <div className="rows">
          {shown.map((i) => (
            <button key={i.id} className="row w-full text-left" onClick={() => itemForm(c, i.id)}>
              <div className="min-w-0 flex-1">
                <div className={key === 'quotes' ? 'font-serif text-[16px] whitespace-pre-wrap' : 'tt'}>{i.title}</div>
                <div className="text-[12.5px] text-mute">{[stages.length && stage === 'all' && i.stage, i.by, i.notes].filter(Boolean).join(' · ')}</div>
              </div>
              {rated && <Stars n={i.rating} />}
            </button>
          ))}
        </div>
        {!shown.length && <Empty>Nothing here yet.</Empty>}
        <InlineAdd placeholder={'Add to ' + name.toLowerCase()} onAdd={(t) => update((d) => {
          const arr = (d.lists[key] = d.lists[key] || [])
          arr.push({ id: uid(), title: t, stage: stages.length ? (stage !== 'all' ? stage : stages[0]) : undefined, rating: 0 })
        })} />
      </Card>
    </div>
  )
}

export function ListsPage() {
  const s = useS()
  const key = useL((l) => l.key)
  const cols = allCols(s)
  const open = key && cols.find((c) => c[0] === key)
  if (open) return <ListView c={open} />
  return (
    <div>
      <PageHead crumb="Manage" title="Lists & collections" right={<Button size="mono" onClick={() => go('notes')}>Notebook</Button>} />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
        {cols.map(([k, n, i, desc, st]) => {
          const it = s.lists[k] || []
          const cnt = it.length ? (st.length ? st.map((x) => [x, it.filter((y) => y.stage === x).length] as const).filter((x) => x[1]).map(([x, c]) => c + ' ' + x.toLowerCase()).join(' · ') : it.length + ' item' + (it.length === 1 ? '' : 's')) : 'Start one'
          return (
            <button key={k} onClick={() => useL.setState({ key: k, stage: 'all' })} className="flex flex-col gap-0.5 rounded-card border border-line bg-card p-3.5 text-left shadow-card">
              <span className="text-xl">{i}</span>
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
