import * as React from 'react'

/** The window's width, kept fresh. iPad can resize the page while you switch apps (for the switcher preview or Split View)
 *  without always telling us when it goes back, so we re-measure on resize, when the page comes back into view, and
 *  whenever the page's own size changes. */
export function useViewportWidth() {
  const [w, setW] = React.useState(() => innerWidth)
  React.useEffect(() => {
    const read = () => setW(innerWidth)
    const soon = () => { read(); requestAnimationFrame(read); setTimeout(read, 250) }
    const vis = () => { if (document.visibilityState === 'visible') soon() }
    addEventListener('resize', read); addEventListener('orientationchange', soon); addEventListener('pageshow', soon); addEventListener('focus', soon)
    document.addEventListener('visibilitychange', vis)
    const ro = new ResizeObserver(read); ro.observe(document.documentElement)
    return () => {
      removeEventListener('resize', read); removeEventListener('orientationchange', soon); removeEventListener('pageshow', soon); removeEventListener('focus', soon)
      document.removeEventListener('visibilitychange', vis); ro.disconnect()
    }
  }, [])
  return w
}
