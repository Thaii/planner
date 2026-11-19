import { create } from 'zustand'
import { today } from './date'

/** View state (which page, which week/month is showing). Not saved. */
export type View = 'today' | 'day' | 'weekly' | 'monthly' | 'yearly' | 'habits' | 'goals' | 'projects' | 'wellness' | 'dopamine' | 'food' | 'home' | 'lists' | 'trips' | 'notes' | 'reset' | 'focus' | 'settings' | 'more'
interface UI { view: View; date: string; weekRef: string; monthRef: string; yearRef: string; colorMode: boolean; setTab: string; cmdOpen: boolean }
export const useUI = create<UI>(() => ({ view: 'today', date: today(), weekRef: today(), monthRef: today(), yearRef: today(), colorMode: false, setTab: 'day', cmdOpen: false }))

const VIEWS: View[] = ['today', 'weekly', 'monthly', 'yearly', 'habits', 'goals', 'projects', 'wellness', 'dopamine', 'food', 'home', 'lists', 'trips', 'notes', 'reset', 'focus', 'settings', 'more']
export function go(view: View, extra: Partial<UI> = {}) {
  useUI.setState({ view, ...extra })
  try { history.replaceState(null, '', '#' + (view === 'day' ? 'today' : view)) } catch { /* sandboxed */ }
  window.scrollTo?.(0, 0)
}
export const openDay = (d: string) => (d === today() ? go('today') : go('day', { date: d }))
export function viewFromHash() {
  const h = location.hash.slice(1) as View
  if (VIEWS.includes(h)) useUI.setState({ view: h })
}
