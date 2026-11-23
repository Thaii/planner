/** The home-screen icon the app installs with. The phone copies it at install time, so this only affects future installs. */
export const APP_ICONS = [
  { id: 'd', name: 'Strawberry milk', bg: '#FBE4EB' },
  { id: 'a', name: 'Oat & sage', bg: '#EFE6D8' },
  { id: 'b', name: 'Sage & butter', bg: '#CFDCC8' },
  { id: 'c', name: 'Sand & sky', bg: '#E8DCCB' },
] as const
export type AppIconId = (typeof APP_ICONS)[number]['id']

/** Point the page's install details at the chosen icon: the manifest (Chrome/Android), the apple-touch-icon (iPhone) and the tab icon. */
export function applyAppIcon(id: AppIconId = 'd') {
  const set = (sel: string, href: string) => { const el = document.querySelector<HTMLLinkElement>(sel); if (el && el.getAttribute('href') !== href) el.setAttribute('href', href) }
  set('link[rel=manifest]', id === 'd' ? 'manifest.webmanifest' : `manifest-${id}.webmanifest`)
  set('link[rel=apple-touch-icon]', `icons/${id}/apple-touch-icon.png`)
  set('link[rel=icon]', `icons/${id}/favicon.svg`)
}
