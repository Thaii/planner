import * as React from 'react'
import { X } from 'lucide-react'

export interface Photo { id: string; img: string; cap: string }

/** Full-screen photo: tap outside or ✕ to close, arrows / swipe / keyboard to move between photos. */
export function PhotoViewer({ photos, i, onIndex }: { photos: { id: string; img: string; cap: string }[]; i: number; onIndex: (n: number | null) => void }) {
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

export function compress(file: File): Promise<string> {
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
