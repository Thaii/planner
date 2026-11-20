import type { DateStr } from './date'

export type Repeat = 'none' | 'daily' | 'weekdays' | 'weekly' | 'fortnightly' | 'monthly' | 'yearly'
export type Freq = 'daily' | 'weekly' | 'fortnightly' | 'monthly' | 'quarterly'
export type ThemeMode = 'light' | 'dark' | 'auto' | 'schedule'

export interface Label { id: string; name: string; color: string }
export interface Task {
  id: string; title: string; date: DateStr; time?: string; repeat?: Repeat; label?: string; notes?: string; step?: string
  done?: boolean; doneOn?: DateStr; doneDates?: Record<DateStr, 1>; skips?: Record<DateStr, boolean>; order?: number
}
export interface CalEvent {
  id: string; title: string; date: DateStr; time?: string; end?: string; repeat?: Repeat; label?: string; loc?: string
  notes?: string; until?: DateStr; skips?: Record<DateStr, boolean>; ro?: boolean; cal?: string
}
export interface Habit {
  id: string; name: string; mode: 'days' | 'weekly'; days: number[]; perWeek: number; color?: string
  min?: string; cue?: string; identity?: string; created?: DateStr; log: Record<DateStr, 1 | 'm'>
}
export interface Identity { id: string; name: string; does: string }
export interface Goal { id: string; title: string; area?: string; pct?: number; target?: DateStr; why?: string; next?: string; done?: boolean; label?: string }
export interface Project { id: string; name: string; label?: string; due?: DateStr; status?: 'active' | 'paused' | 'done'; notes?: string; tasks: { id: string; text: string; done: boolean }[] }
export interface Item { id: string; text: string; done?: boolean }
export interface Workout { id: string; name: string; days: number[]; time?: string; dur?: number; label?: string; notes?: string; log: Record<DateStr, 1> }
export interface Chore { id: string; name: string; freq: Freq; log: Record<string, 1> }
export interface SelfCare { id: string; text: string; tier: 'quick' | 'medium' | 'big'; mins: number }
export interface DopaItem { id: string; text: string; course: 'app' | 'main' | 'side' | 'dessert' | 'special'; mins: number }
export interface Wellness { mood?: number; energy?: number; water?: number; sleep?: number; e100?: 1 }
export interface Meals { breakfast?: string; lunch?: string; dinner?: string; snacks?: string }
export interface WeekPlan { prio: string[]; pdone: boolean[]; goals: Item[]; todo: Item[] }
export interface MonthPlan { todo: Item[]; refl: Record<string, string>; colors: Record<DateStr, string> }

export interface Trip {
  id: string; name: string; dest?: string; start?: DateStr; end?: DateStr; currency?: string; total?: number | ''
  todo: { id: string; text: string; status?: 'todo' | 'booked' }[]; itin: { id: string; day?: string; text: string }[]
  pack: { id: string; text: string; done: boolean }[]; places: { id: string; text: string }[]
  book: { id: string; what: string; ref?: string }[]; budget: { id: string; item: string; amount: number | string }[]
  journal: { id: string; date?: DateStr; text: string }[]
}

/** One entry in a list. `by` holds the list's "who/where" field (author, for whom, suburb…). */
export interface ListItem {
  id: string; title: string; stage?: string; rating?: number; by?: string; notes?: string
  price?: number | ''; link?: string; date?: DateStr; where?: string; extra?: string
}

export type DayPart = 'morning' | 'afternoon' | 'evening'

export interface Settings {
  theme: ThemeMode; accent: string; paper: string; cards: { id: string; on: boolean }[]; labels: Label[]; water: number
  /** Daily water goal in ml, and how much one drop (a glass/bottle) holds. `water` = number of drops. */
  waterGoal: number; glass: number
  /** How Today shows the day's schedule. */
  schedView?: 'timeline' | 'list'
  /** 12-hour (2:30pm) or 24-hour (14:30) clock. Unset = follow the device. */
  clock?: '12' | '24'; name: string
  weekStart: 0 | 1; dayStart: number; dayEnd: number; goalAreas: string[]; dayTheme: string; nightTheme: string
  nightFrom: number; nightTo: number; themeAccent: boolean; taskIdentity?: string
  /** Show "<Name>'s Planner" (true) or "Life Planner" (false). */
  nameInTitle: boolean
  /** Title shown at the top: "Thai's Planner", "Life Planner" or one they type. */
  titleMode?: 'name' | 'life' | 'custom'; customTitle?: string
  /** Greetings to pick from at random in each part of the day; empty = the standard one. */
  greetings?: Record<DayPart, string[]>
  /** Hour each part of the day starts (evening runs until morning). */
  dayParts?: Record<DayPart, number>
  /** Custom greeting shown instead of Good morning/afternoon/evening. Blank = time-based. */
  greeting: string
  /** The first-run name card has been answered or skipped. */
  nameAsked: boolean
}

/** Same shape as the Claude-hosted version, so its backups import directly. */
/** A medication, vitamin or supplement. Scheduled ones have times on chosen days; as-needed ones are logged when taken. */
export interface Med {
  id: string; name: string; dose?: string; asNeeded?: boolean
  days: number[]; times: string[]
  /** How many you have left, and how many one dose uses (tablets, puffs…). Blank count = not tracking supply. */
  count?: number | ''; perDose?: number
  notes?: string; paused?: boolean
  /** Day it was added – history doesn't count it as missed before this. */
  since?: DateStr
}
/** One dose: taken (with the minute of the day it was ticked) or skipped, plus an optional note. */
export interface DoseLog { s: 'taken' | 'skipped'; at: number; note?: string }

export interface State {
  settings: Settings
  meds: Med[]
  /** date → "medId|HH:MM" (scheduled) or "medId|n<number>" (as-needed) → dose */
  medLog: Record<DateStr, Record<string, DoseLog>>
  tasks: Task[]; events: CalEvent[]; ics: Record<string, { name: string; events: CalEvent[]; at: number }>
  prio: Record<DateStr, { items: string[]; done: boolean[] }>
  habits: Habit[]; goals: Goal[]; projects: Project[]; identities: Identity[]; inbox: Item[]
  routines: { morning: { id: string; text: string }[]; evening: { id: string; text: string }[]; log: Record<DateStr, Record<string, 1>> }
  reset: { start: DateStr; done: Record<string, 1> }
  well: Record<DateStr, Wellness>
  selfcare: SelfCare[]; selfLog: Record<DateStr, string[]>
  dopa: DopaItem[]; dopaLog: Record<DateStr, string[]>
  journal: { grat: Record<DateStr, Item[]>; intent: Record<DateStr, string> }
  meals: Record<DateStr, Meals>; recipes: { id: string; name: string; serves?: string; time?: string; ing?: string; method?: string; link?: string }[]
  grocery: { id: string; name: string; done: boolean }[]; pantry: { id: string; name: string; status: 'in' | 'low' | 'out' }[]
  chores: Chore[]; clean: { rooms: string[]; log: Record<DateStr, Record<string, 1>> }
  contacts: { id: string; name: string; role?: string; phone?: string; email?: string; notes?: string }[]
  inventory: { id: string; item: string; loc?: string; qty?: string; bought?: DateStr; warranty?: DateStr; notes?: string }[]
  workouts: Workout[]
  lists: Record<string, ListItem[]>
  customLists: { key: string; name: string; icon?: string; desc?: string; stages: string[]; fields?: string[] }[]
  trips: Trip[]; notes: { id: string; title: string; style: string; body: string; upd: number; imgs?: { id: string; img: string; cap: string }[] }[]
  daynotes: Record<DateStr, string>; focus: Record<DateStr, number>
  weeks: Record<DateStr, WeekPlan>; months: Record<string, MonthPlan>
  years: Record<string, { word?: string; review: Record<string, string> }>
  vision: Record<string, { id: string; img: string; cap: string }[]>
}
