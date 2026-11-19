import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHead } from '@/components/bits'
import { NAVGROUPS } from '@/lib/nav'
import { go, type View } from '@/lib/ui'

export function MorePage() {
  return (
    <div>
      <PageHead crumb="Everything" title="Your planner" />
      {NAVGROUPS.map(([g, items]) => (
        <div key={g}>
          <div className="lbl mt-3.5 mb-1.5 text-mute">{g}</div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2.5">
            {items.map(([v, n]) => <button key={v} onClick={() => go(v)} className="rounded-card border border-line bg-card p-3.5 text-left font-serif text-base shadow-card">{n}</button>)}
          </div>
        </div>
      ))}
    </div>
  )
}

const NAMES = Object.fromEntries(NAVGROUPS.flatMap(([, items]) => items)) as Record<View, string>
export function ComingSoon({ view }: { view: View }) {
  return (
    <div>
      <PageHead crumb="Coming soon" title={NAMES[view] || 'Coming soon'} />
      <Card>
        <p className="mt-0">This page is being moved over from the original Life Planner and arrives in the next batch.</p>
        <Button variant="primary" onClick={() => go('today')}>Back to today</Button>
      </Card>
    </div>
  )
}
