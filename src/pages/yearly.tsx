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

/** Shrink photos so twelve fit comfortably in on-device storage (and later, Drive sync). */
/** Full-screen photo: tap outside or ✕ to close, arrows / swipe / keyboard to move between photos. */
function PhotoViewer({ photos, i, onIndex }: { photos: { id: string; img: string; cap: string }[]; i: number; onIndex: (n: number | null) => void }) {
  const n = photos.length, go = (d: number) => onIndex((i + d + n) % n)
  const startX = React.useRef<number | null>(null)
  React.useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onIndex(null); if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1) }
    addEventListener('keydown', k); return () => removeEventListener('keydown', k)
  })
  const p = photos[i]
  return (
    <div role="dialog" aria-modal="true" aria-label="Vision board photo" className="fixed inset-0 z-[90] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
      onClick={() => onIndex(null)}
      onTouchStart={(e) => { startX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => { if (startX.current === null) return; const dx = e.changedTouches[0].clientX - startX.current; startX.current = null; if (Math.abs(dx) > 50) { e.preventDefault(); go(dx < 0 ? 1 : -1) } }}>
      <button className="absolute top-[calc(12px+var(--sat))] right-3 grid size-10 place-items-center rounded-full bg-white/15 text-white" aria-label="Close"><X className="size-5" /></button>
      <img src={p.img} alt={p.cap || 'Vision board photo'} className="lamp-warm max-h-[78vh] max-w-full rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
      {p.cap && <div className="mt-3 max-w-[600px] text-center font-serif text-lg text-white">{p.cap}</div>}
      {n > 1 && <>
        <button className="absolute top-1/2 left-2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white" aria-label="Previous photo" onClick={(e) => { e.stopPropagation(); go(-1) }}>‹</button>
        <button className="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-2xl text-white" aria-label="Next photo" onClick={(e) => { e.stopPropagation(); go(1) }}>›</button>
        <div className="mt-2 font-mono text-[12px] text-white/70">{i + 1} / {n}</div>
      </>}
    </div>
  )
}

function compress(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image()
    img.onload = () => {
      const mx = 1200, sc = Math.min(1, mx / Math.max(img.width, img.height)), c = document.createElement('canvas')
      c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(img.src)
      res(c.toDataURL('image/jpeg', 0.78))
    }
    img.onerror = rej
    img.src = URL.createObjectURL(file)
  })
}

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
        <CommitInput value={yy.word || ''} placeholder="One word to steer by" className="border-0 bg-transparent px-0 font-serif text-[22px]"
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
