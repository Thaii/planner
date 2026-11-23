import * as React from 'react'
import { X } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AutoTextarea, CommitInput } from '@/components/ui/field'
import { PageHead } from '@/components/bits'
import { MonthGrid } from './monthly'
import { useS, update } from '@/lib/store'
import { go, useUI } from '@/lib/ui'
import { ds, pd } from '@/lib/date'
import { uid } from '@/lib/utils'
import { toast } from 'sonner'
import { compress, PhotoViewer } from '@/components/photos'

/** Shrink photos so twelve fit comfortably in on-device storage (and later, Drive sync). */

export function YearlyPage() {
  const s = useS()
  const ref = useUI((u) => u.yearRef)
  const [view, setView] = React.useState<number | null>(null)
  const y = pd(ref).getFullYear(), yy = s.years[y] || { review: {} }, vis = s.vision[y] || []
  const ensureY = (d: typeof s) => (d.years[y] = d.years[y] || { review: {} })
  const shift = (n: number) => { const x = pd(ref); x.setDate(1); x.setFullYear(x.getFullYear() + n); useUI.setState({ yearRef: ds(x) }) }
  return (
    <div>
      <PageHead crumb={'Plan · ' + y} title="Yearly" />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button size="icon" aria-label="Previous year" onClick={() => shift(-1)}>‹</Button>
        <h2 className="text-[21px]">{y}</h2>
        <Button size="icon" aria-label="Next year" onClick={() => shift(1)}>›</Button>
        <Button size="mono" onClick={() => go('monthly')}>Monthly</Button>
        <Button size="mono" onClick={() => go('goals')}>Goals</Button>
      </div>
      <Card className="mb-3"><CardHeader title="Word of the year" />
        <p className="mt-0 mb-2 text-[13px] text-mute">One word for how you want this year to feel – something to check your choices against.</p>
        <CommitInput value={yy.word || ''} placeholder="e.g. Calm, Brave, Growth" aria-label="Word of the year" className="px-4 py-2.5 font-serif text-[22px]"
          onCommit={(v) => update((d) => { ensureY(d).word = v.trim() })} />
      </Card>
      <Card className="mb-3"><CardHeader title="Year at a glance" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="rounded-xl border border-line bg-soft p-2.5">
              <h4 className="m-0 mb-1.5 font-serif text-[13px] font-normal">{new Date(2000, i, 1).toLocaleDateString('en-AU', { month: 'long' })}</h4>
              <MonthGrid s={s} y={y} mo={i} mini />
            </div>
          ))}
        </div>
        <p className="mt-1.5 mb-0 text-[12.5px] text-mute">Days with plans are shaded; birthdays and yearly dates are in red. Tap a day to open its month.</p>
      </Card>
      {view !== null && vis[view] && <PhotoViewer photos={vis} i={view} onIndex={setView} />}
      <Card className="mb-3"><CardHeader title="Vision board" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5">
          {vis.map((v) => (
            <figure key={v.id} className="m-0">
              <button className="block w-full" aria-label={'Open ' + (v.cap || 'photo')} onClick={() => setView(vis.indexOf(v))}>
                <img src={v.img} alt={v.cap || 'Vision board photo'} className="lamp-warm block aspect-square w-full rounded-xl object-cover" />
              </button>
              <figcaption className="mt-1 flex items-center gap-1">
                <CommitInput value={v.cap} placeholder="Caption" className="border-0 bg-transparent px-1 py-0.5 text-xs" onCommit={(c) => update((d) => { const x = (d.vision[y] || []).find((z) => z.id === v.id); if (x) x.cap = c })} />
                <button className="p-1 text-mute" aria-label="Remove photo" onClick={() => update((d) => { d.vision[y] = (d.vision[y] || []).filter((z) => z.id !== v.id) })}><X className="size-4" /></button>
              </figcaption>
            </figure>
          ))}
          {vis.length < 12 && (
            <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-[1.5px] border-dashed border-line text-center text-[13px] text-mute">
              + Add photo
              <input type="file" accept="image/*" multiple className="hidden" onChange={async (e) => {
                const files = [...(e.target.files || [])].slice(0, 12 - vis.length)
                for (const f of files) {
                  try { const img = await compress(f); update((d) => { (d.vision[y] = d.vision[y] || []).push({ id: uid(), img, cap: '' }) }) } catch { toast("Couldn't read that image") }
                }
                e.target.value = ''
              }} />
            </label>
          )}
        </div>
        <p className="mt-1.5 mb-0 text-[12.5px] text-mute">Photos are shrunk and kept inside your planner, up to twelve a year.</p>
      </Card>
      <Card><CardHeader title="Year in review" />
        <div className="grid gap-3 min-[760px]:grid-cols-3">
          {([['win', 'Biggest win'], ['lesson', 'Biggest lesson'], ['proud', 'Proud of']] as const).map(([k, l]) => (
            <div key={k}><div className="lbl mb-1 text-mute">{l}</div>
              <AutoTextarea rows={3} value={yy.review[k] || ''} onSave={(v) => update((d) => { ensureY(d).review[k] = v })} /></div>
          ))}
        </div>
      </Card>
    </div>
  )
}
