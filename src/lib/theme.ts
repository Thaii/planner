import type { Settings } from './types'
import { ACCENTS, DAY_THEMES, NIGHT_THEMES } from './constants'

export function isNight(s: Settings) {
  if (s.theme === 'dark') return true
  if (s.theme === 'auto') return matchMedia('(prefers-color-scheme: dark)').matches
  if (s.theme === 'schedule') {
    const n = new Date(), h = n.getHours() + n.getMinutes() / 60, f = +s.nightFrom, t = +s.nightTo
    return f > t ? h >= f || h < t : h >= f && h < t
  }
  return false
}

export function applyTheme(s: Settings) {
  const root = document.documentElement, dark = isNight(s)
  const pal = dark ? NIGHT_THEMES[s.nightTheme] || NIGHT_THEMES.ember : DAY_THEMES[s.dayTheme] || DAY_THEMES.linen
  root.dataset.theme = dark ? 'dark' : 'light'
  ;(['bg', 'card', 'ink', 'mute', 'line', 'soft'] as const).forEach((k) => root.style.setProperty('--' + k, pal[k]))
  root.style.setProperty('--field', pal.field || pal.soft)
  root.classList.toggle('lamp', dark && s.nightTheme === 'lamp')
  let c = (ACCENTS[s.accent] || ACCENTS.blush)[1]
  if (pal.lockAccent || (s.themeAccent && pal.accent)) c = pal.accent!
  root.style.setProperty('--accent', dark ? `color-mix(in srgb, ${c} 82%, ${pal.bg})` : c)
  root.style.setProperty('--accent-soft', `color-mix(in srgb, ${c} ${dark ? 20 : 16}%, ${pal.card})`)
  root.style.setProperty('--on-accent', dark ? pal.bg : '#fff')
  document.body.className = s.paper === 'plain' ? '' : 'paper-' + s.paper
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', pal.bg)
  return dark
}
