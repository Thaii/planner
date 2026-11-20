import type { State } from './types'
import { CARD_IDS } from './constants'

export function defaults(): State {
  return {
    settings: {
      theme: 'light', accent: 'blush', paper: 'plain', cards: CARD_IDS.map((id) => ({ id, on: true })),
      labels: [
        { id: 'work', name: 'Work', color: '#6f8fd6' }, { id: 'home', name: 'Home', color: '#e09a6b' },
        { id: 'family', name: 'Family', color: '#e07fa6' }, { id: 'health', name: 'Health', color: '#6fae7a' },
        { id: 'money', name: 'Money', color: '#cf9c3f' }, { id: 'friends', name: 'Friends', color: '#9f88c8' },
      ],
      water: 8, waterGoal: 2000, glass: 250, name: '', weekStart: 1, dayStart: 6, dayEnd: 22, goalAreas: ['Personal', 'Career', 'Health', 'Learning'],
      dayTheme: 'linen', nightTheme: 'ember', nightFrom: 19, nightTo: 6, themeAccent: true, nameInTitle: true, greeting: '', nameAsked: false, titleMode: 'name', customTitle: '', greetings: { morning: [], afternoon: [], evening: [] }, dayParts: { morning: 5, afternoon: 12, evening: 17 }, schedView: 'timeline',
    },
    tasks: [], events: [], ics: {}, prio: {}, habits: [], goals: [], projects: [],
    identities: [
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
    contacts: [], inventory: [], workouts: [], lists: {}, customLists: [], trips: [], notes: [], daynotes: {}, focus: {}, meds: [], medLog: {},
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
  // Older planners had one custom greeting for all day and a yes/no for the name in the title.
  if (!raw.settings?.greetings) {
    const g = (s.settings.greeting || '').trim()
    s.settings.greetings = { morning: g ? [g] : [], afternoon: g ? [g] : [], evening: g ? [g] : [] }
  }
  if (!raw.settings?.titleMode) s.settings.titleMode = s.settings.nameInTitle === false ? 'life' : 'name'
  // Older planners only had a number of drops; treat each one as a 250 ml glass.
  if (!raw.settings?.waterGoal) { s.settings.glass = 250; s.settings.waterGoal = (s.settings.water || 8) * 250 }
  // The Notes list in Lists & collections was folded into the Notebook: move any items to a "Notes" page.
  const old = s.lists.lnotes
  if (old) {
    if (old.length) s.notes.push({ id: 'lnotes', title: 'Notes', style: 'lined', upd: Date.now(), body: old.map((i) => '• ' + i.title + (i.notes ? ' – ' + i.notes : '')).join('\n') })
    s.lists = { ...s.lists }; delete s.lists.lnotes
  }
  s.goals.forEach((g) => { if (!g.area) g.area = s.settings.goalAreas[0] })
  Object.values(s.well).forEach((w) => { if (w && w.energy != null && w.energy <= 5 && !w.e100) { w.energy = w.energy * 20; w.e100 = 1 } })
  return s
}
