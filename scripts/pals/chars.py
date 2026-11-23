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


# ---- Timer alternatives ----
def bellsy(size=120):  # alarm clock with bells and little feet
    s = (f'<path d="M30 30 a14 14 0 0 1 22-10 z" fill="#FFD27A" {LINE}/>'
         f'<path d="M90 30 a14 14 0 0 0-22-10 z" fill="#FFD27A" {LINE}/>'
         f'<path d="M40 100 l-8 10 M80 100 l8 10" stroke="{INK}" stroke-width="5" stroke-linecap="round"/>'
         f'<circle cx="60" cy="64" r="38" fill="#CDB8F2" {LINE}/>'
         f'<circle cx="60" cy="64" r="28" fill="#FFFDF8" {LINE}/>'
         f'<rect x="56" y="18" width="8" height="8" rx="2" fill="#CDB8F2" {LINE}/>')
    return svg(s + face(60, 62, 0.85), 'Bellsy the alarm clock', size)

def pom(size=120):  # tomato timer
    import math
    body = f'<ellipse cx="60" cy="70" rx="43" ry="37" fill="#F7A1A1" {LINE}/>'
    shine = '<ellipse cx="38" cy="56" rx="7" ry="4" fill="#fff" opacity=".55" transform="rotate(-30 38 56)"/>'
    # Rounded leaves fanned across the crown. Outline layer first, fill layer on top,
    # so overlaps merge into one clean shape with no lines crossing inside.
    shapes = []
    for ang in (160, 205, 250, 290, 335, 20):
        r = math.radians(ang)
        cx, cy = 60 + 13 * math.cos(r), 38 + 6 * math.sin(r)
        shapes.append(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="13" ry="6.5" transform="rotate({ang} {cx:.1f} {cy:.1f})"/>')
    shapes.append('<ellipse cx="60" cy="38" rx="9" ry="6"/>')
    leaves = (f'<g fill="{INK}" stroke="{INK}" stroke-width="6" stroke-linejoin="round">' + ''.join(shapes) + '</g>'
              + '<g fill="#8FD0A6">' + ''.join(shapes) + '</g>'
              + '<path d="M50 36 q10 5 20 0" stroke="#6FBF8E" stroke-width="2" fill="none" stroke-linecap="round"/>')
    stem = (f'<path d="M60 35 C60 25 64 19 70 18" stroke="{INK}" stroke-width="8" fill="none" stroke-linecap="round"/>'
            '<path d="M60 35 C60 25 64 19 70 18" stroke="#8FD0A6" stroke-width="4" fill="none" stroke-linecap="round"/>')
    return svg(body + shine + leaves + stem + face(60, 70, 0.95, mouth='w'), 'Pom the tomato timer', size)

def sandy(size=120):  # hourglass
    s = (f'<rect x="30" y="12" width="60" height="12" rx="6" fill="#F7C9A8" {LINE}/>'
         f'<rect x="30" y="96" width="60" height="12" rx="6" fill="#F7C9A8" {LINE}/>'
         f'<path d="M38 24 h44 c0 22 -18 28 -18 36 c0 8 18 14 18 36 h-44 c0 -22 18 -28 18 -36 c0 -8 -18 -14 -18 -36 z" fill="#EAF5FF" {LINE}/>'
         f'<path d="M44 92 c4 -12 12 -16 16 -18 c4 2 12 6 16 18 z" fill="#F6B3C3"/>'
         f'<path d="M48 34 h24 c-2 8 -8 12 -12 16 c-4 -4 -10 -8 -12 -16 z" fill="#F6B3C3"/>'
         f'<path d="M60 52 v24" stroke="#F6B3C3" stroke-width="2.5" stroke-dasharray="2 4" stroke-linecap="round"/>')
    return svg(s + face(60, 40, 0.6), 'Sandy the hourglass', size)

ALL = [('Snoozy', 'The sleepy cloud', 'Empty states: "You\'re clear", nothing scheduled, all done.', snoozy),
       ('Pip', 'The pill buddy', 'Medications card and the "Take your …" Next up.', pip),
       ('Dewy', 'The water drop', 'Water check-in. Fills up as you log drinks.', dewy),
       ('Sprig', 'The sprout', 'Habits and "Who I\'m becoming". Grows with your streak.', sprig),
       ('Sunny', 'The morning sun', 'Morning greeting and morning routine.', sunny),
       ('Luna', 'The sleepy moon', 'Evening greeting, bedtime doses, night themes.', luna),
       ('Twinkle', 'The star', 'Top 3 priorities and little celebrations.', twinkle),
       ('Bellsy', 'The alarm clock', 'The 5-minute start and the Focus timer.', bellsy)]


# ---- Section pals (Habits, Dopamine menu, Wellness) ----
def dottie(size=120):  # calendar page: "Last 30 days"
    s = (f'<rect x="20" y="26" width="80" height="76" rx="14" fill="#FFFDF8" {LINE}/>'
         f'<path d="M20 40 a14 14 0 0 1 14-14 h52 a14 14 0 0 1 14 14 v10 h-80 z" fill="#B9E4C9" {LINE}/>'
         f'<rect x="38" y="16" width="8" height="20" rx="4" fill="#FFFDF8" {LINE}/><rect x="74" y="16" width="8" height="20" rx="4" fill="#FFFDF8" {LINE}/>'
         + ''.join(f'<circle cx="{x}" cy="92" r="3" fill="#9AD7B1"/>' for x in (34, 48, 72, 86)))
    return svg(s + face(60, 70, 0.85), 'Dottie the calendar', size)

def stickle(size=120):  # sticky note with a checkbox: "Due today"
    s = (f'<path d="M22 20 h76 v62 l-18 18 h-58 z" fill="#BFE0F7" {LINE}/>'
         f'<path d="M98 82 h-18 v18 z" fill="#9CCBF2" {LINE}/>'
         f'<rect x="52" y="12" width="16" height="16" rx="4" fill="#F6B3C3" {LINE} transform="rotate(8 60 20)"/>')
    return svg(s + face(58, 56, 0.9), 'Stickle the sticky note', size)

def inchy(size=120):  # caterpillar with an arched back: "This week"
    segs = [(20, 84, '#FFD27A'), (36, 72, '#FFE08A'), (54, 68, '#FFD27A'), (70, 76, '#FFE08A')]
    body = ''.join(f'<circle cx="{x}" cy="{y}" r="14" fill="{c}" {LINE}/>' for x, y, c in segs)
    feet = ''.join(f'<path d="M{x} {y+14} v6" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>' for x, y, _ in segs)
    head = (f'<path d="M84 44 l-5 -14 M100 44 l5 -14" stroke="{INK}" stroke-width="3" stroke-linecap="round"/>'
            f'<circle cx="78" cy="28" r="4" fill="#F6B3C3" {LINE}/><circle cx="106" cy="28" r="4" fill="#F6B3C3" {LINE}/>'
            f'<circle cx="92" cy="64" r="21" fill="#FFF0B8" {LINE}/>')
    return svg(feet + body + head + face(92, 62, 0.7), 'Inchy the caterpillar', size)

def mimi(size=120):  # little folded menu: "This week" on the Dopamine menu
    s = (f'<path d="M16 26 l44 8 v74 l-44 -8 z" fill="#F7D6E0" {LINE}/>'
         f'<path d="M104 26 l-44 8 v74 l44 -8 z" fill="#FFFDF8" {LINE}/>'
         f'<path d="M70 82 h24 M70 92 h18" stroke="#E7A9BC" stroke-width="3.5" stroke-linecap="round"/>'
         f'<path d="M26 46 h22 M26 56 h16" stroke="#FFFDF8" stroke-width="3.5" stroke-linecap="round"/>')
    return svg(s + face(82, 58, 0.7), 'Mimi the menu', size)

def brocco(size=120):  # broccoli: "Healthy picks"
    s = (f'<path d="M48 70 l-4 36 h32 l-4 -36 z" fill="#D8F0C8" {LINE}/>'
         f'<g fill="#8FD0A6" {LINE}><circle cx="38" cy="54" r="18"/><circle cx="82" cy="54" r="18"/><circle cx="60" cy="36" r="22"/><circle cx="60" cy="62" r="20"/></g>'
         f'<g fill="#8FD0A6"><circle cx="38" cy="54" r="15"/><circle cx="82" cy="54" r="15"/><circle cx="60" cy="36" r="19"/><circle cx="60" cy="62" r="17"/></g>')
    return svg(s + face(60, 54, 0.8), 'Brocco the broccoli', size)

def cuppy(size=120):  # cupcake: "Desserts"
    s = (f'<path d="M30 62 h60 l-8 42 h-44 z" fill="#CDB8F2" {LINE}/>'
         f'<path d="M44 66 l3 36 M60 66 v36 M76 66 l-3 36" stroke="#B49FE3" stroke-width="2.5" stroke-linecap="round"/>'
         f'<path d="M24 64 c0 -10 8 -14 14 -14 c0 -14 12 -22 22 -22 c10 0 22 8 22 22 c6 0 14 4 14 14 z" fill="#FBE3EC" {LINE}/>'
         f'<circle cx="60" cy="22" r="7" fill="#F7A1A1" {LINE}/>'
         f'<path d="M42 44 l4 -2 M70 38 l3 3 M80 52 l4 -1 M54 34 l2 3" stroke="#9CCBF2" stroke-width="3" stroke-linecap="round"/>')
    return svg(s + face(60, 80, 0.7, blush='#F6B3C3'), 'Cuppy the cupcake', size)

def bloom(size=120):  # flower: mood
    petals = ''.join(f'<ellipse cx="60" cy="28" rx="15" ry="20" fill="#F7C9DA" {LINE} transform="rotate({a} 60 60)"/>' for a in range(0, 360, 60))
    return svg(petals + f'<circle cx="60" cy="60" r="24" fill="#FFE7A8" {LINE}/>' + face(60, 58, 0.75), 'Bloom the flower', size)

def zip_(size=120):  # battery: energy
    s = (f'<rect x="26" y="22" width="64" height="86" rx="14" fill="#FFFDF8" {LINE}/>'
         f'<rect x="46" y="12" width="24" height="12" rx="4" fill="#F7C9A8" {LINE}/>'
         f'<rect x="33" y="58" width="50" height="43" rx="8" fill="#F7C9A8"/>'
         f'<path d="M96 40 l8 -10 M100 56 h10" stroke="#FFD27A" stroke-width="4" stroke-linecap="round"/>')
    return svg(s + face(58, 76, 0.8), 'Zip the battery', size)

def puff(size=120):  # pillow: sleep
    s = (f'<path d="M18 40 q0 -12 12 -12 q30 6 60 0 q12 0 12 12 q-4 22 0 44 q0 12 -12 12 q-30 -6 -60 0 q-12 0 -12 -12 q4 -22 0 -44 z" fill="#E3D9FA" {LINE}/>'
         f'<path d="M30 40 q30 5 60 0" stroke="#CDB8F2" stroke-width="2.5" fill="none" stroke-linecap="round"/>'
         f'<text x="92" y="24" font-family="Fredoka, sans-serif" font-weight="600" font-size="14" fill="#9C8FD6">z</text>')
    return svg(s + face(60, 64, 0.9, sleepy=True), 'Puff the pillow', size)

def chai(size=120):  # teacup: self-care
    s = (f'<path d="M86 56 a14 14 0 0 1 0 28 h-4" stroke="{INK}" stroke-width="3" fill="none"/>'
         f'<path d="M86 56 a14 14 0 0 1 0 28" stroke="#FFF4E8" stroke-width="0" fill="none"/>'
         f'<path d="M22 48 h66 v22 a30 30 0 0 1 -30 30 h-6 a30 30 0 0 1 -30 -30 z" fill="#FFF4E8" {LINE}/>'
         f'<path d="M26 54 h58" stroke="#F7C9A8" stroke-width="5" stroke-linecap="round"/>'
         f'<rect x="14" y="98" width="84" height="10" rx="5" fill="#F7C9DA" {LINE}/>'
         f'<path d="M44 38 q-6 -8 0 -16 q6 -8 0 -16 M62 38 q-6 -8 0 -16" stroke="#CDB8F2" stroke-width="3" fill="none" stroke-linecap="round"/>')
    return svg(s + face(55, 72, 0.8), 'Chai the teacup', size)

def hugs(size=120):  # heart: gratitude
    s = f'<path d="M60 102 C30 82 14 64 14 44 a22 22 0 0 1 46 -10 a22 22 0 0 1 46 10 C106 64 90 82 60 102 z" fill="#F7A9BE" {LINE}/>'
    s += '<ellipse cx="34" cy="40" rx="6" ry="4" fill="#fff" opacity=".55" transform="rotate(-35 34 40)"/>'
    return svg(s + face(60, 58, 0.85, mouth='w', blush='#F07A98'), 'Hugs the heart', size)

SECTION = [('Dottie', 'calendar', dottie), ('Stickle', 'sticky note', stickle), ('Inchy', 'caterpillar', inchy),
           ('Mimi', 'menu', mimi), ('Brocco', 'broccoli', brocco), ('Cuppy', 'cupcake', cuppy),
           ('Bloom', 'flower', bloom), ('Zip', 'battery', zip_), ('Puff', 'pillow', puff), ('Chai', 'teacup', chai), ('Hugs', 'heart', hugs)]
