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

export interface Settings {
  theme: ThemeMode; accent: string; paper: string; cards: { id: string; on: boolean }[]; labels: Label[]; water: number; name: string
  weekStart: 0 | 1; dayStart: number; dayEnd: number; goalAreas: string[]; dayTheme: string; nightTheme: string
  nightFrom: number; nightTo: number; themeAccent: boolean; taskIdentity?: string
  /** Show "<Name>'s Planner" (true) or "Life Planner" (false). */
  nameInTitle: boolean
  /** Custom greeting shown instead of Good morning/afternoon/evening. Blank = time-based. */
  greeting: string
  /** The first-run name card has been answered or skipped. */
  nameAsked: boolean
}

/** Same shape as the Claude-hosted version, so its backups import directly. */
export interface State {
  settings: Settings
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
  lists: Record<string, { id: string; title: string; stage?: string; rating?: number; by?: string; notes?: string }[]>
  customLists: { key: string; name: string; icon?: string; desc?: string; stages: string[] }[]
  trips: Trip[]; notes: { id: string; title: string; style: string; body: string; upd: number }[]
  daynotes: Record<DateStr, string>; focus: Record<DateStr, number>
  weeks: Record<DateStr, WeekPlan>; months: Record<string, MonthPlan>
  years: Record<string, { word?: string; review: Record<string, string> }>
  vision: Record<string, { id: string; img: string; cap: string }[]>
}
