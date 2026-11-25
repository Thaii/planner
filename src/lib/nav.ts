import type { View } from './ui'
export const NAVGROUPS: [string, [View, string][]][] = [
  ['Home', [['today', 'Dashboard'], ['tasks', "Today's tasks"]]],
  ['Plan', [['yearly', 'Yearly'], ['monthly', 'Monthly'], ['weekly', 'Weekly']]],
  ['Grow', [['goals', 'Goals'], ['projects', 'Projects'], ['habits', 'Habits']]],
  ['Live', [['wellness', 'Wellness'], ['dopamine', 'Dopamine menu'], ['food', 'Food & fitness'], ['home', 'Home']]],
  ['Manage', [['lists', 'Lists & collections'], ['notes', 'Notebook']]],
  ['Enjoy', [['trips', 'Travel']]],
  ['Reflect', [['reset', 'Life reset'], ['focus', 'Focus timer']]],
  ['Account', [['settings', 'Customise']]],
]
