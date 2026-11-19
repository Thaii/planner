import { X } from 'lucide-react'
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
const setNote = (id: string, fn: (n: { title: string; style: string; body: string; upd: number }) => void) =>
  update((d) => { const n = d.notes.find((x) => x.id === id); if (n) { fn(n); n.upd = Date.now() } })

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
