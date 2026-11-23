# Original cute characters as inline SVG strings (soft pastel, dot eyes, blush).
INK = '#4A3B45'
def face(cx, cy, s=1.0, sleepy=False, mouth='smile', blush='#F4A6B8'):
    ex = 11*s; ey = cy
    if sleepy:
        eyes = (f'<path d="M{cx-ex-5*s} {ey} q{5*s} {5*s} {10*s} 0" stroke="{INK}" stroke-width="{2.6*s}" fill="none" stroke-linecap="round"/>'
                f'<path d="M{cx+ex-5*s} {ey} q{5*s} {5*s} {10*s} 0" stroke="{INK}" stroke-width="{2.6*s}" fill="none" stroke-linecap="round"/>')
    else:
        eyes = (f'<ellipse cx="{cx-ex}" cy="{ey}" rx="{3.6*s}" ry="{4.4*s}" fill="{INK}"/><circle cx="{cx-ex+1.2*s}" cy="{ey-1.6*s}" r="{1.3*s}" fill="#fff"/>'
                f'<ellipse cx="{cx+ex}" cy="{ey}" rx="{3.6*s}" ry="{4.4*s}" fill="{INK}"/><circle cx="{cx+ex+1.2*s}" cy="{ey-1.6*s}" r="{1.3*s}" fill="#fff"/>')
    my = ey + 7*s
    m = {'smile': f'<path d="M{cx-4*s} {my} q{4*s} {4.5*s} {8*s} 0" stroke="{INK}" stroke-width="{2.4*s}" fill="none" stroke-linecap="round"/>',
         'w': f'<path d="M{cx-6*s} {my} q{3*s} {4*s} {6*s} 0 q{3*s} {4*s} {6*s} 0" stroke="{INK}" stroke-width="{2.2*s}" fill="none" stroke-linecap="round"/>',
         'o': f'<ellipse cx="{cx}" cy="{my+1*s}" rx="{2.6*s}" ry="{3.2*s}" fill="{INK}"/>'}[mouth]
    b = (f'<ellipse cx="{cx-ex-6*s}" cy="{my}" rx="{5*s}" ry="{3*s}" fill="{blush}" opacity=".75"/>'
         f'<ellipse cx="{cx+ex+6*s}" cy="{my}" rx="{5*s}" ry="{3*s}" fill="{blush}" opacity=".75"/>')
    return eyes + m + b

def svg(inner, label, size=120, vb='0 0 120 120'):
    return f'<svg width="{size}" height="{size}" viewBox="{vb}" role="img" aria-label="{label}" xmlns="http://www.w3.org/2000/svg">{inner}</svg>'

LINE = f'stroke="{INK}" stroke-width="3" stroke-linejoin="round"'

def snoozy(size=120):  # sleepy cloud: "You're clear"
    body = f'<path d="M30 88 h62 a20 20 0 0 0 2-40 a26 26 0 0 0-49-8 a18 18 0 0 0-17 48 z" fill="#FFFFFF" {LINE}/>'
    z = f'<text x="88" y="30" font-family="Fredoka, sans-serif" font-weight="600" font-size="16" fill="#9C8FD6">z</text><text x="99" y="19" font-family="Fredoka, sans-serif" font-weight="600" font-size="11" fill="#9C8FD6">z</text>'
    return svg(body + face(60, 66, 1.0, sleepy=True) + z, 'Snoozy the sleepy cloud', size)

def pip(size=120):  # pill buddy: medications
    body = (f'<g transform="rotate(-30 60 62)"><rect x="22" y="40" width="76" height="44" rx="22" fill="#FFF4E8" {LINE}/>'
            f'<path d="M60 40 h16 a22 22 0 0 1 0 44 h-16 z" fill="#F6B3C3" {LINE}/></g>')
    return svg(body + face(52, 66, 0.9, mouth='w'), 'Pip the pill buddy', size)

def dewy(size=120, level=0.55):  # water drop that fills
    shape = 'M60 14 C60 14 26 54 26 76 a34 34 0 0 0 68 0 C94 54 60 14 60 14 z'
    top = 110 - level*96
    fill = (f'<clipPath id="dc{int(level*100)}"><path d="{shape}"/></clipPath>'
            f'<path d="{shape}" fill="#EAF5FF"/>'
            f'<path clip-path="url(#dc{int(level*100)})" d="M20 {top} q10 -6 20 0 t20 0 t20 0 t20 0 V120 H20 z" fill="#9CCBF2"/>'
            f'<path d="{shape}" fill="none" {LINE}/>')
    return svg(fill + face(60, 74, 0.95), 'Dewy the water drop', size)

def sprig(size=120):  # sprout in a pot: habits
    leaves = (f'<path d="M60 52 C60 40 52 30 38 30 C38 44 46 52 60 52 z" fill="#B9E4C9" {LINE}/>'
              f'<path d="M60 52 C60 36 70 26 86 26 C86 42 76 52 60 52 z" fill="#9AD7B1" {LINE}/>'
              f'<path d="M60 52 V60" {LINE} fill="none" stroke-linecap="round"/>')
    pot = f'<path d="M32 60 h56 l-6 42 a8 8 0 0 1-8 7 h-28 a8 8 0 0 1-8-7 z" fill="#F7C9A8" {LINE}/>'
    return svg(leaves + pot + face(60, 78, 0.9), 'Sprig the sprout', size)

def sunny(size=120):  # morning
    rays = ''.join(f'<rect x="57" y="8" width="6" height="16" rx="3" fill="#FFD27A" transform="rotate({a} 60 60)"/>' for a in range(0, 360, 45))
    return svg(rays + f'<circle cx="60" cy="60" r="32" fill="#FFE7A8" {LINE}/>' + face(60, 58, 1.0), 'Sunny the morning sun', size)

def luna(size=120):  # evening
    moon = f'<path d="M74 18 a42 42 0 1 0 28 62 a34 34 0 1 1-28-62 z" fill="#E3D9FA" {LINE}/>'
    stars = '<circle cx="96" cy="24" r="3" fill="#FFD27A"/><circle cx="104" cy="44" r="2" fill="#FFD27A"/>'
    return svg(moon + stars + face(50, 66, 0.9, sleepy=True), 'Luna the sleepy moon', size)

def twinkle(size=120):  # done / priorities
    star = (f'<path d="M60 14 L72 42 L102 45 L79 65 L86 95 L60 79 L34 95 L41 65 L18 45 L48 42 Z" fill="#FFE08A" {LINE} '
            f'stroke-linejoin="round"/>')
    return svg(star + face(60, 58, 0.85, mouth='w'), 'Twinkle the star', size)

def tick(size=120):  # timer
    body = (f'<rect x="54" y="10" width="12" height="10" rx="3" fill="#F6B3C3" {LINE}/>'
            f'<circle cx="60" cy="66" r="40" fill="#FFF4E8" {LINE}/>'
            f'<path d="M60 66 L60 38" stroke="#E58FA5" stroke-width="4" stroke-linecap="round"/>'
            f'<path d="M60 66 L78 72" stroke="#E58FA5" stroke-width="4" stroke-linecap="round"/>')
    return svg(body + face(60, 84, 0.75), 'Tick the timer', size)

ALL = [('Snoozy', 'The sleepy cloud', 'Empty states: "You\'re clear", nothing scheduled, all done.', snoozy),
       ('Pip', 'The pill buddy', 'Medications card and the "Take your …" Next up.', pip),
       ('Dewy', 'The water drop', 'Water check-in. Fills up as you log drinks.', dewy),
       ('Sprig', 'The sprout', 'Habits and "Who I\'m becoming". Grows with your streak.', sprig),
       ('Sunny', 'The morning sun', 'Morning greeting and morning routine.', sunny),
       ('Luna', 'The sleepy moon', 'Evening greeting, bedtime doses, night themes.', luna),
       ('Twinkle', 'The star', 'Top 3 priorities and little celebrations.', twinkle),
       ('Tick', 'The timer', 'The 5-minute start and the Focus timer.', tick)]
