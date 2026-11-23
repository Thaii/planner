import { useS, update } from '@/lib/store'
import { APP_ICONS } from '@/lib/app-icon'
import { cn } from '@/lib/utils'

/** Pick the home-screen icon. Installing copies it, so changing it later needs the app removed and added again. */
export function AppIconPicker({ note = true }: { note?: boolean }) {
  const cur = useS().settings.appIcon || 'd'
  return (
    <div>
      <div className="grid grid-cols-4 gap-2">
        {APP_ICONS.map((x) => (
          <button key={x.id} type="button" aria-pressed={cur === x.id} onClick={() => update((d) => { d.settings.appIcon = x.id })}
            className={cn('flex flex-col items-center gap-1.5 rounded-2xl border-[1.5px] px-1 py-2 text-center text-[12px] leading-tight', cur === x.id ? 'border-accent bg-accent-soft font-semibold' : 'border-transparent')}>
            <img src={`icons/${x.id}/icon-192.png`} alt="" className="size-14 rounded-[15px] shadow-[0_3px_8px_rgba(0,0,0,.12)]" />{x.name}
          </button>
        ))}
      </div>
      {note && <p className="mt-2 mb-0 text-[12.5px] text-mute">Your phone copies the icon when you install. To change it afterwards, remove Planner from your home screen and add it again – your plans stay safe.</p>}
    </div>
  )
}
