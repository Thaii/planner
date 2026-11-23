import { Cloud, CloudOff, RefreshCw } from 'lucide-react'
import { Card, CardHeader } from './ui/card'
import { Button } from './ui/button'
import { useSync, connectGoogle, disconnectGoogle, deleteDriveCopy, syncNow, syncAvailable } from '@/lib/gsync'
import { closeSheet, openSheet } from './sheet'
import { cn } from '@/lib/utils'

const ago = (t?: number) => {
  if (!t) return ''
  const m = Math.round((Date.now() - t) / 60000)
  return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
}

/** Top-bar chip: "Saved on this device" until sync is on, then the sync state. Tapping syncs (or reconnects). */
export function SyncChip() {
  const { status, last, pending } = useSync()
  const base = 'flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-[11px] text-mute'
  if (status === 'off') return <span className={cn(base, 'max-[480px]:hidden')}><i className="size-[7px] rounded-full bg-[#5aa36a]" />Saved on this device</span>
  const dot = status === 'synced' && !pending ? 'bg-[#5aa36a]' : status === 'error' ? 'bg-[#d9534f]' : 'bg-[#e0a43a]'
  const label = status === 'syncing' ? 'Syncing…' : status === 'tap' ? 'Tap to sync' : status === 'error' ? 'Sync problem – tap to retry' : pending ? 'Changes to sync' : `Synced ${ago(last)}`
  return (
    <button className={base} title="Sync with Google Drive" onClick={() => (status === 'tap' ? connectGoogle() : syncNow())}>
      {status === 'syncing' ? <RefreshCw className="size-3 animate-spin" /> : <i className={cn('size-[7px] rounded-full', dot)} />}{label}
    </button>
  )
}

/** Customise → Calendars & data: turn on sync, see its state, sync now, or turn it off. */
export function SyncCard() {
  const { status, email, last, error } = useSync()
  return (
    <Card>
      <CardHeader title="Sync across devices" />
      <p className="mt-0 text-[13.5px] text-mute">Keep your planner the same on your phone, tablet and computer. It's saved privately in <b>your own Google Drive</b>, in a hidden folder only this app can see – it never passes through anyone else's server. Changes from each device are merged, so nothing gets wiped.</p>
      {!syncAvailable ? (
        <div className="rounded-xl bg-soft px-3 py-2 text-[13px] text-mute">Sync is nearly ready – it switches on once the app's Google setup is finished.</div>
      ) : status === 'off' ? (
        <Button variant="primary" onClick={connectGoogle}><Cloud className="size-4" />Sync with Google Drive</Button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="rounded-xl bg-soft px-3 py-2 text-[13px]">
            <b>On</b> for {email}<br />
            <span className="text-mute">{status === 'syncing' ? 'Syncing now…' : status === 'tap' ? 'Google asks us to check in about once an hour – tap Sync now.' : status === 'error' ? `Last try didn't work${error ? ` (${error})` : ''}. Tap Sync now to try again.` : `Last synced ${ago(last)}.`}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => (status === 'tap' || status === 'error' ? connectGoogle() : syncNow())}><RefreshCw className="size-4" />Sync now</Button>
            <Button onClick={() => openSheet(<StopSync />, 'Stop syncing')}><CloudOff className="size-4" />Turn off</Button>
          </div>
        </div>
      )}
    </Card>
  )
}

function StopSync() {
  return (
    <div>
      <h3 className="mb-1 text-[21px]">Stop syncing this device?</h3>
      <p className="mt-0 text-[13.5px] text-mute">Your planner stays on this device either way. You can also remove the copy from your Google Drive – your other devices keep theirs.</p>
      <div className="flex flex-col gap-2">
        <Button onClick={() => { closeSheet(); disconnectGoogle() }}>Turn off sync on this device</Button>
        <Button onClick={() => { closeSheet(); deleteDriveCopy() }}>Turn off and remove it from Google Drive</Button>
        <Button variant="ghost" onClick={closeSheet}>Cancel</Button>
      </div>
    </div>
  )
}
