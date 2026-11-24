import type { State } from './types'
import type { DateStr } from './date'
import { mins } from './date'
import { eventsOn, tasksOn, workoutsOn } from './logic'

export interface Load { hrs: number; level: 0 | 1 | 2 | 3; label: string }
/**
 * A rough sense of how full a day is: hours of timed events (an hour when there's no end time),
 * an hour per workout and a quarter-hour per to-do. All-day events (holidays, trips) count as a full day.
 */
export function dayLoad(s: State, d: DateStr): Load {
  const ev = eventsOn(s, d)
  let hrs = 0
  for (const e of ev) {
    if (!e.time) continue
    const a = mins(e.time), b = e.end && mins(e.end) > a ? mins(e.end) : a + 60
    hrs += (b - a) / 60
  }
  hrs += workoutsOn(s, d).length + tasksOn(s, d).filter((x) => !x.over && !x.done).length * 0.25
  const allDay = ev.some((e) => !e.time && e.repeat !== 'yearly') // birthdays don't fill a day
  if (!hrs && !allDay) return { hrs, level: 0, label: 'Free' }
  if (allDay && hrs < 3) return { hrs, level: 2, label: 'All-day plans' }
  if (hrs < 2) return { hrs, level: 1, label: 'Light' }
  if (hrs < 5) return { hrs, level: 2, label: 'Steady' }
  return { hrs, level: 3, label: 'Full – go easy' }
}
