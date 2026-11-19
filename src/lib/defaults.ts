import type { State } from './types'
import { CARD_IDS } from './constants'

export function defaults(): State {
  return {
    settings: {
      theme: 'light', accent: 'blush', paper: 'plain', cards: CARD_IDS.map((id) => ({ id, on: true })),
      labels: [
        { id: 'work', name: 'Work', color: '#6f8fd6' }, { id: 'family', name: 'Family', color: '#d4848f' },
        { id: 'health', name: 'Health', color: '#7f9c7a' }, { id: 'money', name: 'Money', color: '#cf9c3f' },
        { id: 'personal', name: 'Personal', color: '#9f88c8' },
      ],
      water: 8, name: '', weekStart: 1, dayStart: 6, dayEnd: 22, goalAreas: ['Personal', 'Career', 'Health', 'Learning'],
      dayTheme: 'linen', nightTheme: 'ember', nightFrom: 19, nightTo: 6, themeAccent: true, nameInTitle: true, greeting: '', nameAsked: false,
    },
    tasks: [], events: [], ics: {}, prio: {}, habits: [], goals: [], projects: [],
    identities: [
      { id: 'i1', name: 'a fit person', does: 'Moves every day and drinks their water' },
      { id: 'i2', name: 'someone who follows through', does: 'Does the small thing now instead of later' },
    ],
    inbox: [],
    routines: {
      morning: [{ id: 'm1', text: 'Glass of water' }, { id: 'm2', text: '10-minute stretch' }, { id: 'm3', text: 'Journal one page' }, { id: 'm4', text: 'No phone for the first hour' }],
      evening: [{ id: 'e1', text: 'Tidy for 10 minutes' }, { id: 'e2', text: 'Skincare' }, { id: 'e3', text: 'Read in bed' }, { id: 'e4', text: 'Lights out by 22:30' }],
      log: {},
    },
    reset: { start: '', done: {} }, well: {},
    selfcare: [
      { id: 's3', text: 'Ring a friend', tier: 'quick', mins: 5 }, { id: 's6', text: 'Make a cup of tea and sit outside', tier: 'quick', mins: 10 },
      { id: 's2', text: 'Walk, no phone', tier: 'medium', mins: 20 }, { id: 's1', text: 'Long bath', tier: 'medium', mins: 30 },
      { id: 's4', text: 'An hour with a book', tier: 'big', mins: 60 }, { id: 's5', text: 'Early night', tier: 'big', mins: 0 },
    ],
    selfLog: {},
    dopa: [
      { id: 'd1', text: 'Dance to one song', course: 'app', mins: 4 }, { id: 'd2', text: 'Step outside for fresh air', course: 'app', mins: 5 },
      { id: 'd3', text: 'Ice-cold glass of water', course: 'app', mins: 0 }, { id: 'd4', text: 'Stretch to a song', course: 'app', mins: 5 },
      { id: 'd5', text: 'Gym or a run', course: 'main', mins: 45 }, { id: 'd6', text: 'Draw or paint', course: 'main', mins: 30 },
      { id: 'd7', text: 'Cook something new', course: 'main', mins: 45 }, { id: 'd8', text: 'Work on a side project', course: 'main', mins: 60 },
      { id: 'd9', text: 'Favourite playlist', course: 'side', mins: 0 }, { id: 'd10', text: 'Podcast or audiobook', course: 'side', mins: 0 },
      { id: 'd11', text: 'Work from a café', course: 'side', mins: 0 }, { id: 'd12', text: 'Body double on a call with a friend', course: 'side', mins: 0 },
      { id: 'd13', text: 'A nice drink while you work', course: 'side', mins: 0 }, { id: 'd14', text: 'Scroll socials', course: 'dessert', mins: 15 },
      { id: 'd15', text: 'YouTube', course: 'dessert', mins: 20 }, { id: 'd16', text: 'A video game', course: 'dessert', mins: 30 },
      { id: 'd17', text: 'Gig or concert', course: 'special', mins: 0 }, { id: 'd18', text: 'Day trip somewhere new', course: 'special', mins: 0 },
      { id: 'd19', text: 'Massage', course: 'special', mins: 0 },
    ],
    dopaLog: {},
    journal: { grat: {}, intent: {} },
    meals: {}, recipes: [], grocery: [], pantry: [], chores: [],
    clean: { rooms: ['Kitchen', 'Bathroom', 'Living room', 'Bedrooms', 'Floors', 'Laundry'], log: {} },
    contacts: [], inventory: [], workouts: [], lists: {}, customLists: [], trips: [], notes: [], daynotes: {}, focus: {},
    weeks: {}, months: {}, years: {}, vision: {},
  }
}

/** Fill in anything missing (new sections, new dashboard cards) on data loaded from storage or a backup. */
export function migrate(raw: Partial<State>): State {
  const d = defaults()
  const s = { ...d, ...raw } as State
  s.settings = { ...d.settings, ...(raw.settings || {}) }
  const have = new Set(s.settings.cards.map((c) => c.id))
  CARD_IDS.forEach((id, i) => {
    if (!have.has(id)) {
      if (id === 'nextup' || id === 'identity') s.settings.cards.splice(i, 0, { id, on: true })
      else s.settings.cards.push({ id, on: true })
    }
  })
  s.goals.forEach((g) => { if (!g.area) g.area = s.settings.goalAreas[0] })
  Object.values(s.well).forEach((w) => { if (w && w.energy != null && w.energy <= 5 && !w.e100) { w.energy = w.energy * 20; w.e100 = 1 } })
  return s
}
