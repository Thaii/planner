import type { Settings } from './types'
import { ALL_ACCENTS as ACCENTS, DAY_THEMES, NIGHT_THEMES } from './constants'

export function isNight(s: Settings) {
  if (s.theme === 'dark') return true
  if (s.theme === 'auto') return matchMedia('(prefers-color-scheme: dark)').matches
  if (s.theme === 'schedule') {
    const n = new Date(), h = n.getHours() + n.getMinutes() / 60, f = +s.nightFrom, t = +s.nightTo
    return f > t ? h >= f || h < t : h >= f && h < t
  }
  return false
}

/** The chosen colour: a preset name, or a custom '#rrggbb' from the colour picker. */
export const accentColor = (s: Pick<Settings, 'accent'>) => /^#[0-9a-f]{6}$/i.test(s.accent) ? s.accent : (ACCENTS[s.accent] || ACCENTS.blush)[1]
/** Pale colours (yellows, mints) need dark text on buttons instead of white. */
export const isPale = (hex: string) => {
  const n = parseInt(hex.slice(1), 16), [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.04 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45
}

export function applyTheme(s: Settings) {
  const root = document.documentElement, dark = isNight(s)
  const pal = dark ? NIGHT_THEMES[s.nightTheme] || NIGHT_THEMES.ember : DAY_THEMES[s.dayTheme] || DAY_THEMES.linen
  root.dataset.theme = dark ? 'dark' : 'light'
  ;(['bg', 'card', 'ink', 'mute', 'line', 'soft'] as const).forEach((k) => root.style.setProperty('--' + k, pal[k]))
  root.style.setProperty('--field', pal.field || pal.soft)
  root.classList.toggle('lamp', dark && s.nightTheme === 'lamp')
  root.classList.toggle('cute', s.style === 'cute')
  root.classList.toggle('pals', s.style === 'cute' && s.pals !== false)
  let c = accentColor(s)
  if (pal.lockAccent || (s.themeAccent && pal.accent)) c = pal.accent!
  root.style.setProperty('--accent', dark && !pal.pure ? `color-mix(in srgb, ${c} 82%, ${pal.bg})` : c)
  root.style.setProperty('--accent-soft', `color-mix(in srgb, ${c} ${dark ? 20 : 16}%, ${pal.card})`)
  root.style.setProperty('--on-accent', dark ? pal.bg : pal.cute && pal.accent && c === pal.accent ? (pal.onAccent || '#ffffff') : /^#[0-9a-f]{6}$/i.test(c) && isPale(c) ? '#2a2420' : '#fff')
  document.body.className = s.paper === 'plain' ? '' : 'paper-' + s.paper
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', pal.bg)
  return dark
}
