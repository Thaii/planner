import { InstallButton } from './install'
import * as React from 'react'
import { Toaster } from 'sonner'
import { Search, Settings, Sun, Rows3, CalendarDays, CheckCheck, Menu, Plus } from 'lucide-react'
import { useUI, go, type View } from '@/lib/ui'
import { NAVGROUPS } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { useS } from '@/lib/store'
import { plannerTitle } from '@/lib/greeting'
import { SheetHost } from './sheet'
import { CommandMenu } from './command-menu'
import { FiveTimer } from './five'
import { quickAdd } from './quick-add'

const BNAV: [View, string, React.ComponentType<{ className?: string }>][] = [
  ['today', 'Today', Sun], ['weekly', 'Week', Rows3], ['monthly', 'Month', CalendarDays], ['habits', 'Habits', CheckCheck], ['more', 'More', Menu],
]

export function AppShell({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  const view = useUI((u) => u.view)
  const hl: View = view === 'day' ? 'today' : view
  const inMore = !BNAV.some(([v]) => v === hl)
  const [brand, brand2] = plannerTitle(useS().settings)
  return (
    <div className="flex min-h-screen">
      <nav className="sticky top-0 hidden h-screen w-[210px] flex-none flex-col gap-px overflow-auto border-r border-line bg-card px-2.5 py-5.5 min-[900px]:flex" aria-label="Main">
        <div className="px-2.5 pb-2.5 font-serif text-xl">{brand} <span className="text-accent">{brand2}</span></div>
        {NAVGROUPS.map(([g, items]) => (
          <React.Fragment key={g}>
            <div className="px-3 pt-3 pb-1 font-mono text-[10.5px] tracking-[0.1em] text-mute uppercase">{g}</div>
            {items.map(([v, n]) => (
              <button key={v} onClick={() => go(v)} aria-current={v === hl ? 'page' : undefined}
                className={cn('rounded-[9px] px-3 py-1.5 text-left text-sm', v === hl && 'bg-accent-soft font-semibold')}>{n}</button>
            ))}
          </React.Fragment>
        ))}
      </nav>
      <main className="mx-auto w-full max-w-[1180px] min-w-0 flex-1 px-3.5 pt-[calc(14px+var(--sat))] pb-[calc(100px+var(--sab))] min-[900px]:px-7 min-[900px]:pt-6 min-[900px]:pb-15">
        <div className="mb-3.5 flex items-center gap-2">
          <div className="flex-1 truncate font-serif text-xl min-[900px]:invisible">{brand} <span className="text-accent">{brand2}</span></div>
          <InstallButton />
          <span className="flex items-center gap-1.5 rounded-full max-[480px]:hidden border border-line bg-card px-2.5 py-1 text-[11px] text-mute"><i className="size-[7px] rounded-full bg-[#5aa36a]" />Saved on this device</span>
          <button className="grid size-9 place-items-center rounded-[11px] border border-line bg-card" onClick={() => useUI.setState({ cmdOpen: true })} aria-label="Search (Ctrl K)" title="Search · Ctrl/⌘ K"><Search className="size-4" /></button>
          <button className="grid size-9 place-items-center rounded-[11px] border border-line bg-card" onClick={() => go('settings')} aria-label="Customise"><Settings className="size-4" /></button>
        </div>
        {children}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-card/90 px-1 pt-1.5 pb-[calc(6px+var(--sab))] backdrop-blur-md min-[900px]:hidden" aria-label="Main">
        {BNAV.map(([v, n, Icon]) => (
          <button key={v} onClick={() => go(v)} className={cn('flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] text-mute', (v === hl || (v === 'more' && inMore)) && 'font-semibold text-accent')}>
            <Icon className="size-5" />{n}
          </button>
        ))}
      </nav>
      <button onClick={quickAdd} className="fixed right-4 bottom-[calc(76px+var(--sab))] z-21 flex h-12 items-center gap-1 rounded-full bg-accent px-4.5 text-[15px] font-semibold text-on-accent shadow-[0_6px_18px_rgba(0,0,0,0.18)] min-[900px]:right-7 min-[900px]:bottom-6">
        <Plus className="size-4.5" />Quick add
      </button>
      <SheetHost />
      <CommandMenu />
      <FiveTimer />
      <Toaster position="bottom-center" theme={dark ? 'dark' : 'light'} offset={88} mobileOffset={92} visibleToasts={3} />
    </div>
  )
}
