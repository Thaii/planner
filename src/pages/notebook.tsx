import * as React from 'react'
import { ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { compress, PhotoViewer } from '@/components/photos'
import { create } from 'zustand'
import { Card, Empty } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AutoTextarea, CommitInput, Select } from '@/components/ui/field'
import { PageHead } from '@/components/bits'
import { update, undoable, useS } from '@/lib/store'
import { go } from '@/lib/ui'
import { cn, uid } from '@/lib/utils'

export const useNote = create<{ id: string | null }>(() => ({ id: null }))

const TEMPLATES: Record<string, string> = {
  'Meeting notes': 'Date: \nWho: \n\nAgenda\n- \n\nNotes\n- \n\nActions\n☐ ',
  'Brain dump': 'Everything on my mind\n- \n\nDo now\n- \n\nSchedule\n- \n\nSomeday\n- ',
  'Pros & cons': 'Decision: \n\nPros\n+ \n\nCons\n− \n\nGut feeling: ',
  'Packing list': 'Clothes\n☐ \n\nToiletries\n☐ \n\nTech\n☐ \n\nDocuments\n☐ ',
  'Weekly review': 'What went well\n- \n\nWhat was hard\n- \n\nWhat I learned\n- \n\nNext week, one thing to change\n- ',
}
const STYLES: [string, string][] = [['lined', 'Lined'], ['dot', 'Dot grid'], ['grid', 'Grid'], ['blank', 'Blank']]

export function newNote(style = 'lined') {
  const id = uid()
  update((d) => { d.notes.push({ id, title: '', style, body: '', upd: Date.now() }) })
  useNote.setState({ id })
  go('notes')
}
type Note = import('@/lib/types').State['notes'][number]
const setNote = (id: string, fn: (n: Note) => void) =>
  update((d) => { const n = d.notes.find((x) => x.id === id); if (n) { fn(n); n.upd = Date.now() } })

const MAX = 20

/** Photos attached to a page: a strip under the writing, tap one to see it full screen. */
function NotePhotos({ n }: { n: Note }) {
  const [view, setView] = React.useState<number | null>(null)
  const imgs = n.imgs || []
  const add = async (files: FileList | null) => {
    const list = [...(files || [])].slice(0, MAX - imgs.length)
    if (files && files.length > list.length) toast(`A page holds up to ${MAX} photos`)
    for (const f of list) {
      try { const img = await compress(f); setNote(n.id, (x) => { (x.imgs = x.imgs || []).push({ id: uid(), img, cap: '' }) }) } catch { toast("Couldn't read that image") }
    }
  }
  return (
    <div className="mt-3 border-t border-line pt-3">
      {view !== null && imgs[view] && <PhotoViewer photos={imgs} i={view} onIndex={setView} />}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-2">
        {imgs.map((p, i) => (
          <figure key={p.id} className="m-0">
            <div className="relative">
              <button className="block w-full" aria-label={'Open ' + (p.cap || 'photo')} onClick={() => setView(i)}>
                <img src={p.img} alt={p.cap || 'Notebook photo'} className="lamp-warm block aspect-square w-full rounded-xl object-cover" />
              </button>
              <button className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-black/55 text-white" aria-label="Remove photo"
                onClick={() => undoable('Photo removed', (d) => { const x = d.notes.find((z) => z.id === n.id); if (x) x.imgs = (x.imgs || []).filter((z) => z.id !== p.id) })}><X className="size-3.5" /></button>
            </div>
            <CommitInput value={p.cap} placeholder="Caption" aria-label="Caption" className="mt-0.5 border-0 bg-transparent px-1 py-0.5 text-xs"
              onCommit={(c) => setNote(n.id, (x) => { const z = (x.imgs || []).find((q) => q.id === p.id); if (z) z.cap = c })} />
          </figure>
        ))}
        {imgs.length < MAX && (
          <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-[1.5px] border-dashed border-line text-center text-[12.5px] text-mute">
            <span className="flex flex-col items-center gap-1"><ImagePlus className="size-5" />Add photos</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => { await add(e.target.files); e.target.value = '' }} />
          </label>
        )}
      </div>
    </div>
  )
}

export function NotebookPage() {
  const s = useS()
  const sel = useNote((n) => n.id)
  const n = s.notes.find((x) => x.id === sel) || s.notes[0]
  return (
    <div>
      <PageHead crumb="Manage" title="Notebook" right={<Button size="mono" onClick={() => go('lists')}>Lists & collections</Button>} />
      <div className="mb-3 flex flex-wrap gap-1.5">
        {s.notes.map((x) => (
          <button key={x.id} onClick={() => useNote.setState({ id: x.id })}
            className={cn('max-w-[200px] truncate rounded-full border px-3 py-1 text-[13px]', n && x.id === n.id ? 'border-accent bg-accent text-on-accent' : 'border-line bg-card')}>{x.title || 'Untitled'}</button>
        ))}
        <button className="rounded-full border border-dashed border-line px-3 py-1 text-[13px]" onClick={() => newNote()} aria-label="New page">+ New page</button>
      </div>
      {n ? (
        <Card key={n.id}>
          <div className="mb-2.5 flex items-center gap-2">
            <CommitInput value={n.title} placeholder="Title" aria-label="Page title" className="flex-1 border-0 bg-transparent px-0 font-serif text-xl"
              onCommit={(v) => setNote(n.id, (x) => { x.title = v.trim() })} />
            <Select aria-label="Paper" className="w-auto py-1.5 text-[13px]" value={n.style} onChange={(e) => setNote(n.id, (x) => { x.style = e.target.value })}>
              {STYLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <button className="p-1.5 text-mute" aria-label="Delete page" onClick={() => { useNote.setState({ id: null }); undoable('Page deleted', (d) => { d.notes = d.notes.filter((x) => x.id !== n.id) }) }}><X className="size-4" /></button>
          </div>
          <AutoTextarea key={n.id + ':' + n.body.length /* refresh after a template is added */} value={n.body} placeholder="Start writing…" aria-label="Page"
            className={cn('notebook min-h-[360px] resize-y border-0 bg-transparent leading-7', 'nb-' + n.style)}
            onSave={(v) => setNote(n.id, (x) => { x.body = v })} />
          <NotePhotos n={n} />
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="lbl text-mute">Templates</span>
            {Object.keys(TEMPLATES).map((k) => (
              <Button key={k} size="sm" onClick={() => setNote(n.id, (x) => { x.body = (x.body ? x.body.replace(/\s*$/, '') + '\n\n' : '') + TEMPLATES[k]; if (!x.title) x.title = k })}>{k}</Button>
            ))}
          </div>
        </Card>
      ) : <Empty>Somewhere for the rest. Start a page with + New page above.</Empty>}
    </div>
  )
}
