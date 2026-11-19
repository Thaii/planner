/** Small canvas confetti burst – the one celebratory moment in the app. */
export function confetti() {
  const c = document.createElement('canvas')
  c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:80'
  c.width = innerWidth; c.height = innerHeight
  document.body.appendChild(c)
  const x = c.getContext('2d')
  if (!x) { c.remove(); return }
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#d4848f'
  const cols = [accent, '#cf9c3f', '#7f9c7a', '#6f8fd6', '#9f88c8']
  const P = Array.from({ length: 110 }, () => ({ x: innerWidth / 2, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 14, vy: Math.random() * -12 - 4, s: 4 + Math.random() * 5, c: cols[Math.floor(Math.random() * cols.length)], r: Math.random() * 6 }))
  let f = 0
  const step = () => {
    x.clearRect(0, 0, c.width, c.height)
    P.forEach((p) => { p.vy += 0.35; p.x += p.vx; p.y += p.vy; p.r += 0.2; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); x.restore() })
    if (++f < 110) requestAnimationFrame(step); else c.remove()
  }
  step()
}
