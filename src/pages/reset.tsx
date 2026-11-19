import { Check as Tick } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHead } from '@/components/bits'
import { confirmBox } from '@/components/sheet'
import { update, useS } from '@/lib/store'
import { addD, diffD, fmt, today } from '@/lib/date'
import { go, type View } from '@/lib/ui'
import { cn } from '@/lib/utils'

const STEPS: [string, string, View, string][] = [
  ['Clear the decks', 'Tidy your space, empty every inbox, write it all down.', 'notes', 'Open the Notebook'],
  ['Brain dump & sort', 'Turn the pile into projects, tasks and a someday list.', 'projects', 'Open Projects'],
  ['Review the big picture', 'Revisit your goals and your word of the year.', 'goals', 'Open Goals'],
  ['Reset routines', 'Rebuild your morning and evening anchors.', 'wellness', 'Open Wellness'],
  ['Plan the month', 'Move dated things into the calendar.', 'monthly', 'Open Monthly'],
  ['Plan the week', 'Choose three priorities and schedule them.', 'weekly', 'Open Weekly'],
  ['Start small', 'Do the first tiny task on the list. Momentum beats motivation.', 'today', 'Open today'],
]

export function ResetPage() {
  const s = useS(), r = s.reset, t = today()
  const cur = r.start ? Math.min(6, Math.max(0, diffD(r.start, t))) : -1
  const start = () => update((d) => { d.reset = { start: today(), done: {} } })
  const done = Object.keys(r.done || {}).length
  return (
    <div>
      <PageHead crumb="Reflect" title="Life reset" />
      <p className="-mt-1.5 mb-3.5 text-[14px] text-mute">A gentle reset to clear the noise whenever you need one. Seven days, one step a day. Miss a day? Just pick up where you are.</p>
      {!r.start ? <Button variant="primary" onClick={start}>Start my reset today</Button> : (
        <>
          <div className="mb-2 text-[13px] text-mute">{done} of 7 done</div>
          <div className="flex flex-col gap-2">
            {STEPS.map(([n, desc, v, l], i) => {
              const ok = !!r.done[i], isCur = i === cur && !ok
              return (
                <Card key={i} className={cn('flex flex-wrap items-center gap-3', isCur && 'border-accent', ok && 'opacity-75')}>
                  <span className={cn('grid size-8 flex-none place-items-center rounded-full border font-mono text-[13px]', ok ? 'border-accent bg-accent text-on-accent' : isCur ? 'border-accent text-accent' : 'border-line text-mute')}>
                    {ok ? <Tick className="size-4" /> : i + 1}
                  </span>
                  <div className="min-w-[180px] flex-1">
                    <div className="tt font-semibold">{n}{i === cur && <span className="ml-1.5 text-[12px] font-normal text-accent">today</span>}</div>
                    <div className="text-[13px] text-mute">{desc}</div>
                    <div className="font-mono text-[11px] text-mute">{fmt(addD(r.start, i), { weekday: 'short', day: 'numeric', month: 'short' })}</div>
                  </div>
                  <Button size="sm" onClick={() => go(v)}>{l}</Button>
                  <Button size="sm" variant={ok ? 'primary' : 'outline'} aria-pressed={ok}
                    onClick={() => update((d) => { if (d.reset.done[i]) delete d.reset.done[i]; else d.reset.done[i] = 1 })}>{ok ? 'Done' : 'Mark done'}</Button>
                </Card>
              )
            })}
          </div>
          <Button variant="link" className="mt-3 text-[13.5px]" onClick={() => confirmBox('Start the 7-day reset again from today?', start, 'Start again')}>Start again from today</Button>
        </>
      )}
    </div>
  )
}
