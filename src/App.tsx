import { useEffect, useState } from 'react'
import { AppShell } from './components/app-shell'
import { useS } from './lib/store'
import { useUI, viewFromHash } from './lib/ui'
import { applyTheme } from './lib/theme'
import { today } from './lib/date'
import { TodayPage } from './pages/today'
import { WeeklyPage } from './pages/weekly'
import { MonthlyPage } from './pages/monthly'
import { MorePage, ComingSoon } from './pages/more'

export default function App() {
  const s = useS()
  const { view, date } = useUI()
  const [dark, setDark] = useState(false)
  const [, tick] = useState(0)
  useEffect(() => { setDark(applyTheme(s.settings)) }, [s.settings])
  useEffect(() => {
    // Re-check night schedule / day rollover / timeline "now" line once a minute.
    const iv = setInterval(() => { setDark(applyTheme(s.settings)); tick((n) => n + 1) }, 60000)
    const mq = matchMedia('(prefers-color-scheme: dark)'), onMq = () => setDark(applyTheme(s.settings))
    mq.addEventListener?.('change', onMq)
    return () => { clearInterval(iv); mq.removeEventListener?.('change', onMq) }
  }, [s.settings])
  useEffect(() => { window.addEventListener('hashchange', viewFromHash); return () => window.removeEventListener('hashchange', viewFromHash) }, [])

  let page
  switch (view) {
    case 'today': page = <TodayPage d={today()} isToday />; break
    case 'day': page = <TodayPage d={date} />; break
    case 'weekly': page = <WeeklyPage />; break
    case 'monthly': page = <MonthlyPage />; break
    case 'more': page = <MorePage />; break
    default: page = <ComingSoon view={view} />
  }
  return <AppShell dark={dark}>{page}</AppShell>
}
