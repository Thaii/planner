import { Download, Share, SquarePlus } from 'lucide-react'
import { create } from 'zustand'
import { toast } from 'sonner'
import { Button } from './ui/button'
import { closeSheet, openSheet } from './sheet'
import { AppIconPicker } from './app-icon-picker'

/** Chrome/Edge/Android fire beforeinstallprompt; we keep it so our own button can show the install dialog. */
type BIP = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
const useInstall = create<{ evt: BIP | null; installed: boolean }>(() => ({
  evt: null,
  installed: matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true,
}))
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); useInstall.setState({ evt: e as BIP }) })
window.addEventListener('appinstalled', () => { useInstall.setState({ evt: null, installed: true }); toast('Installed – find Planner on your home screen') })

const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

function IOSSteps() {
  return (
    <div>
      <h3 className="mb-2 text-[21px]">Add Planner to your home screen</h3>
      <div className="mb-1.5 text-[13px] font-semibold text-mute">First, pick your icon</div>
      <div className="mb-4"><AppIconPicker note={false} /></div>
      <ol className="m-0 flex list-none flex-col gap-3 p-0 text-[15px]">
        <li className="flex items-center gap-3"><span className="grid size-9 flex-none place-items-center rounded-xl bg-soft"><Share className="size-4.5" /></span><span>Tap <b>Share</b> in Safari's toolbar</span></li>
        <li className="flex items-center gap-3"><span className="grid size-9 flex-none place-items-center rounded-xl bg-soft"><SquarePlus className="size-4.5" /></span><span>Scroll down and tap <b>Add to Home Screen</b></span></li>
        <li className="flex items-center gap-3"><span className="grid size-9 flex-none place-items-center rounded-xl bg-soft font-semibold">✓</span><span>Tap <b>Add</b>, then open Planner from your home screen from now on.</span></li>
      </ol>
      <p className="mb-0 text-[12.5px] text-mute">Using Chrome on iPhone? Open this page in Safari first.</p>
      <div className="mt-4 flex justify-end"><Button variant="primary" onClick={closeSheet}>Got it</Button></div>
    </div>
  )
}

/** Chrome/Edge/Android: choose the icon, then show the browser's install dialog. */
function PickThenInstall({ evt }: { evt: BIP }) {
  return (
    <div>
      <h3 className="mb-1 text-[21px]">Install Planner</h3>
      <p className="mt-0 mb-3 text-[13.5px] text-mute">Pick the icon for your home screen.</p>
      <AppIconPicker note={false} />
      <div className="mt-4 flex justify-end gap-2">
        <Button onClick={closeSheet}>Not now</Button>
        <Button variant="primary" onClick={async () => { closeSheet(); await new Promise((r) => setTimeout(r, 60)); await evt.prompt(); const c = await evt.userChoice; if (c.outcome === 'accepted') useInstall.setState({ evt: null }) }}>Install</Button>
      </div>
    </div>
  )
}

/** Shows only when installing is possible: a real prompt (Chrome/Edge/Android) or instructions (iPhone/iPad). */
export function InstallButton() {
  const { evt, installed } = useInstall()
  if (installed || (!evt && !isIOS)) return null
  const go = async () => {
    if (evt) openSheet(<PickThenInstall evt={evt} />, 'Install')
    else openSheet(<IOSSteps />, 'Install')
  }
  return (
    <button onClick={go} className="flex h-9 items-center gap-1.5 rounded-[11px] border border-accent bg-accent-soft px-2.5 text-[13px] font-semibold" aria-label="Install app">
      <Download className="size-4" /><span className="max-[480px]:hidden">Install app</span>
    </button>
  )
}
