import { create } from 'zustand'
import { get, set, del } from 'idb-keyval'
import { toast } from 'sonner'
import { getS, replaceState, useStore } from './store'
import { merge3, same } from './merge'
import { GOOGLE_CLIENT_ID } from './google-config'
import type { State } from './types'

/**
 * Private sync through the person's own Google Drive.
 * The planner is saved as one file in Drive's hidden app-data folder – only this app can see it, and it never passes
 * through a server of ours. Each sync merges this device, Drive and the last version they agreed on (see merge.ts).
 * Google's browser sign-in gives an access token that lasts about an hour; after that a tap on "Sync" gets a new one.
 */
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata email'
const FILE = 'planner.json'
const BASE_KEY = 'sync-base-v1'
const META = 'planner-sync' // localStorage: { email, last, token, exp, fileId }

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'tap' | 'error'
interface Meta { email?: string; last?: number; token?: string; exp?: number; fileId?: string }
const readMeta = (): Meta => { try { return JSON.parse(localStorage.getItem(META) || '{}') } catch { return {} } }
const writeMeta = (m: Meta) => { try { localStorage.setItem(META, JSON.stringify(m)) } catch { /* private mode */ } }

export const syncAvailable = !!GOOGLE_CLIENT_ID
export const useSync = create<{ status: SyncStatus; email?: string; last?: number; pending: boolean; error?: string }>(() => {
  const m = readMeta()
  return { status: m.email ? (m.token && (m.exp || 0) > Date.now() ? 'synced' : 'tap') : 'off', email: m.email, last: m.last, pending: false }
})
const setSync = (p: Partial<ReturnType<typeof useSync.getState>>) => useSync.setState(p)

/* ---------- Google sign-in (Google Identity Services, token model) ---------- */
type TokenResp = { access_token?: string; expires_in?: number; error?: string }
type TokenClient = { requestAccessToken: (o?: { prompt?: string; login_hint?: string }) => void; callback: (r: TokenResp) => void }
declare global { interface Window { google?: { accounts: { oauth2: { initTokenClient: (o: object) => TokenClient; revoke: (t: string, cb?: () => void) => void } } } } }

let gisLoading: Promise<void> | undefined
function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  return (gisLoading ||= new Promise<void>((res, rej) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'; s.async = true
    s.onload = () => res(); s.onerror = () => { gisLoading = undefined; rej(new Error('Could not reach Google')) }
    document.head.appendChild(s)
  }))
}

let client: TokenClient | undefined
function askForToken(first: boolean) {
  return new Promise<string>((res, rej) => {
    client = client || window.google!.accounts.oauth2.initTokenClient({ client_id: GOOGLE_CLIENT_ID, scope: SCOPE, callback: () => {} })
    client.callback = (r) => {
      if (!r.access_token) return rej(new Error(r.error || 'Sign-in was cancelled'))
      const m = readMeta(); m.token = r.access_token; m.exp = Date.now() + ((r.expires_in || 3600) - 120) * 1000; writeMeta(m)
      res(r.access_token)
    }
    client.requestAccessToken({ prompt: first ? 'consent' : '', login_hint: readMeta().email })
  })
}
const validToken = () => { const m = readMeta(); return m.token && (m.exp || 0) > Date.now() ? m.token : undefined }

/** Connect (first time) or reconnect after the hour is up. Must be called from a tap – Google opens a small window. */
export async function connectGoogle() {
  if (!syncAvailable) return
  try {
    setSync({ status: 'syncing', error: undefined })
    await loadGis()
    const first = !readMeta().email
    const token = await askForToken(first)
    if (first) {
      const me = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer ' + token } }).then((r) => r.json()).catch(() => ({}))
      const m = readMeta(); m.email = me.email || 'your Google account'; writeMeta(m); setSync({ email: m.email })
    }
    await syncNow(first ? 'first' : 'normal')
    if (first) toast('Sync is on – your planner is saved privately in your Google Drive')
  } catch (e) {
    setSync({ status: readMeta().email ? 'tap' : 'off', error: (e as Error).message })
    toast((e as Error).message === 'Sign-in was cancelled' ? 'Sign-in cancelled' : "Couldn't connect to Google – check your connection and try again")
  }
}

/** Stop syncing on this device. Data stays here and in Drive; nothing is deleted. */
export async function disconnectGoogle() {
  const m = readMeta()
  if (m.token) try { window.google?.accounts.oauth2.revoke(m.token) } catch { /* fine */ }
  localStorage.removeItem(META); await del(BASE_KEY)
  setSync({ status: 'off', email: undefined, last: undefined, pending: false })
  toast('Sync turned off on this device. Your planner is still here.')
}

/** Remove the planner copy from Google Drive (this device keeps its data). */
export async function deleteDriveCopy() {
  const token = validToken()
  if (!token) { toast('Tap Sync first so Google lets us in, then try again'); return }
  const id = await findFile(token)
  if (id) await drive(token, `https://www.googleapis.com/drive/v3/files/${id}`, { method: 'DELETE' })
  await disconnectGoogle()
  toast('Removed the planner from your Google Drive')
}

/* ---------- Drive (app-data folder) ---------- */
async function drive(token: string, url: string, init: RequestInit = {}) {
  const r = await fetch(url, { ...init, headers: { ...(init.headers || {}), Authorization: 'Bearer ' + token } })
  if (r.status === 401) { const m = readMeta(); delete m.token; writeMeta(m); throw Object.assign(new Error('expired'), { expired: true }) }
  if (!r.ok) throw new Error('Drive said ' + r.status)
  return r
}
async function findFile(token: string) {
  const m = readMeta()
  if (m.fileId) return m.fileId
  const r = await drive(token, `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id)&q=${encodeURIComponent(`name='${FILE}'`)}`)
  const id = (await r.json()).files?.[0]?.id as string | undefined
  if (id) { m.fileId = id; writeMeta(m) }
  return id
}
async function download(token: string): Promise<State | undefined> {
  const id = await findFile(token)
  if (!id) return undefined
  try {
    const r = await drive(token, `https://www.googleapis.com/drive/v3/files/${id}?alt=media`)
    return (await r.json()).data as State
  } catch (e) {
    if ((e as { expired?: boolean }).expired) throw e
    const m = readMeta(); delete m.fileId; writeMeta(m) // file gone – start fresh
    return undefined
  }
}
async function upload(token: string, data: State) {
  const body = JSON.stringify({ app: 'life-planner', v: 1, at: new Date().toISOString(), data })
  const id = await findFile(token)
  if (id) { await drive(token, `https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body }); return }
  const fd = new FormData()
  fd.append('metadata', new Blob([JSON.stringify({ name: FILE, parents: ['appDataFolder'] })], { type: 'application/json' }))
  fd.append('file', new Blob([body], { type: 'application/json' }))
  const r = await drive(token, 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', body: fd })
  const m = readMeta(); m.fileId = (await r.json()).id; writeMeta(m)
}

/** A fresh device: nothing of the person's own yet, so Drive's copy should win outright. */
const isFresh = (s: State) => !s.tasks.length && !s.habits.length && !s.goals.length && !Object.keys(s.well || {}).length && !s.events.length

/* ---------- Sync ---------- */
let running: Promise<void> | undefined
export function syncNow(mode: 'first' | 'normal' = 'normal') {
  if (!syncAvailable || !readMeta().email) return Promise.resolve()
  return (running ||= (async () => {
    const token = validToken()
    if (!token) { setSync({ status: 'tap' }); return }
    setSync({ status: 'syncing' })
    try {
      const remote = await download(token)
      const base = (await get(BASE_KEY)) as State | undefined
      const local = getS()
      let merged: State = local
      if (remote) {
        if (!base && isFresh(local)) merged = remote
        else merged = merge3(base, local, remote, base ? 'local' : 'remote') as State
        if (!same(merged, local)) { applying = true; replaceState(structuredClone(merged)); applying = false; merged = getS() }
      }
      if (!remote || !same(merged, remote)) await upload(token, merged)
      await set(BASE_KEY, merged)
      const m = readMeta(); m.last = Date.now(); writeMeta(m)
      setSync({ status: 'synced', last: m.last, pending: false, error: undefined })
      if (mode === 'first' && remote && !same(remote, local)) toast('Brought in your planner from Google Drive')
    } catch (e) {
      if ((e as { expired?: boolean }).expired) setSync({ status: 'tap' })
      else { console.warn('[sync]', e); setSync({ status: 'error', error: (e as Error).message }) }
    }
  })().finally(() => { running = undefined }))
}

/* ---------- When to sync ---------- */
let applying = false, timer: ReturnType<typeof setTimeout> | undefined
export function setupSync() {
  if (!syncAvailable) return
  // After changes (a few seconds after you stop typing).
  useStore.subscribe((st, prev) => {
    if (applying || st.s === prev.s || !readMeta().email) return
    setSync({ pending: true })
    clearTimeout(timer)
    timer = setTimeout(() => { if (validToken()) syncNow(); else setSync({ status: 'tap' }) }, 4000)
  })
  // When the app opens, comes back into view, and every 5 minutes while open.
  const tick = () => { if (readMeta().email && navigator.onLine) { if (validToken()) syncNow(); else setSync({ status: 'tap' }) } }
  setTimeout(tick, 1500)
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick() })
  addEventListener('online', tick)
  setInterval(tick, 5 * 60 * 1000)
}
