import { create } from 'zustand'
import { produce } from 'immer'
import { get, set } from 'idb-keyval'
import { toast } from 'sonner'
import type { State } from './types'
import { defaults, migrate } from './defaults'

/**
 * All planner data lives in one immutable State object.
 * It's saved to this device's IndexedDB after every change (debounced).
 * Later, Google Drive sync will read and write the same object.
 */
interface Store { s: State; loaded: boolean }
export const useStore = create<Store>(() => ({ s: defaults(), loaded: false }))

const KEY = 'planner-state-v1'

export const getS = () => useStore.getState().s
export const useS = () => useStore((st) => st.s)

export function update(fn: (draft: State) => void) {
  useStore.setState((st) => ({ s: produce(st.s, fn) }))
}

export function replaceState(next: Partial<State>) {
  useStore.setState({ s: migrate(next) })
}

/** Make a change with an Undo button in the toast. State is immutable, so the snapshot is free. */
export function undoable(message: string, fn: (draft: State) => void) {
  const before = getS()
  update(fn)
  toast(message, { action: { label: 'Undo', onClick: () => useStore.setState({ s: before }) } })
}

let saveTimer: ReturnType<typeof setTimeout> | undefined
export async function loadState() {
  try {
    const raw = (await get(KEY)) as Partial<State> | undefined
    if (raw) useStore.setState({ s: migrate(raw), loaded: true })
    else useStore.setState({ loaded: true })
  } catch {
    useStore.setState({ loaded: true })
  }
  // Ask the browser not to clear our storage when space is low (honoured by Chrome/Android; Safari decides itself).
  try { await navigator.storage?.persist?.() } catch { /* not supported */ }
  useStore.subscribe((st, prev) => {
    if (st.s === prev.s) return
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { set(KEY, st.s).catch(() => toast('Could not save on this device – storage may be full')) }, 300)
  })
}

export function exportBackup() {
  return JSON.stringify({ app: 'life-planner', v: 2, at: new Date().toISOString(), data: getS() })
}
export function importBackup(text: string) {
  const o = JSON.parse(text)
  const data = o.data || o
  if (!data || typeof data !== 'object' || !data.settings) throw new Error('Not a planner backup')
  replaceState(data)
}
