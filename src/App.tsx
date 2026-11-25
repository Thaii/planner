import { deviceUses24, setClock24 } from './lib/date'
import { useEffect, useState } from 'react'
import { AppShell } from './components/app-shell'
import { useS } from './lib/store'
import { useUI, viewFromHash } from './lib/ui'
import { applyTheme } from './lib/theme'
import { today } from './lib/date'
import { plannerTitle } from './lib/greeting'
import { TodayPage } from './pages/today'
import { WeeklyPage } from './pages/weekly'
import { TasksPage } from './pages/tasks'
import { MonthlyPage } from './pages/monthly'
import { MorePage, ComingSoon } from './pages/more'
import { YearlyPage } from './pages/yearly'
import { HabitsPage } from './pages/habits'
import { GoalsPage } from './pages/goals'
import { ProjectsPage } from './pages/projects'
import { WellnessPage } from './pages/wellness'
import { DopaminePage } from './pages/dopamine'
import { FoodPage } from './pages/food'
import { HomePage } from './pages/home'
import { ListsPage } from './pages/lists'
import { TravelPage } from './pages/travel'
import { NotebookPage } from './pages/notebook'
import { ResetPage } from './pages/reset'
import { FocusPage } from './pages/focus'
import { SettingsPage } from './pages/settings'

export default function App() {
  const s = useS()
  // Set the clock before anything below renders a time.
  setClock24(s.settings.clock ? s.settings.clock === '24' : deviceUses24())
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
  useEffect(() => { document.title = plannerTitle(s.settings).filter(Boolean).join(' ') }, [s.settings])
  useEffect(() => { window.addEventListener('hashchange', viewFromHash); return () => window.removeEventListener('hashchange', viewFromHash) }, [])

  let page
  switch (view) {
    case 'today': page = <TodayPage d={today()} isToday />; break
    case 'day': page = <TodayPage d={date} />; break
    case 'tasks': page = <TasksPage />; break
    case 'weekly': page = <WeeklyPage />; break
    case 'monthly': page = <MonthlyPage />; break
    case 'yearly': page = <YearlyPage />; break
    case 'habits': page = <HabitsPage />; break
    case 'goals': page = <GoalsPage />; break
    case 'projects': page = <ProjectsPage />; break
    case 'wellness': page = <WellnessPage />; break
    case 'dopamine': page = <DopaminePage />; break
    case 'food': page = <FoodPage />; break
    case 'home': page = <HomePage />; break
    case 'lists': page = <ListsPage />; break
    case 'trips': page = <TravelPage />; break
    case 'notes': page = <NotebookPage />; break
    case 'reset': page = <ResetPage />; break
    case 'focus': page = <FocusPage />; break
    case 'settings': page = <SettingsPage />; break
    case 'more': page = <MorePage />; break
    default: page = <ComingSoon view={view} />
  }
  return <AppShell dark={dark}>{page}</AppShell>
}
