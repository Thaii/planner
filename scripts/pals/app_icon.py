# Home-screen icon for the installed app: a cute calendar pal on a neutral background.
INK = '#4A3B45'
def icon(bg, page, header, ring, blush='#F2B8B5', extra='', size=512, pad=0):
    L = f'stroke="{INK}" stroke-width="14" stroke-linejoin="round" stroke-linecap="round"'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="{-pad} {-pad} {512+2*pad} {512+2*pad}">
<rect x="{-pad}" y="{-pad}" width="{512+2*pad}" height="{512+2*pad}" fill="{bg}"/>
<ellipse cx="256" cy="420" rx="150" ry="18" fill="{INK}" opacity=".08"/>
<rect x="110" y="128" width="292" height="272" rx="56" fill="{page}" {L}/>
<path d="M110 196 v-12 a56 56 0 0 1 56 -56 h180 a56 56 0 0 1 56 56 v12 z" fill="{header}" {L}/>
<rect x="176" y="92" width="30" height="72" rx="15" fill="{ring}" {L}/><rect x="306" y="92" width="30" height="72" rx="15" fill="{ring}" {L}/>
<circle cx="208" cy="282" r="13" fill="{INK}"/><circle cx="304" cy="282" r="13" fill="{INK}"/>
<path d="M234 316 q22 22 44 0" fill="none" {L}/>
<ellipse cx="172" cy="318" rx="20" ry="12" fill="{blush}" opacity=".85"/><ellipse cx="340" cy="318" rx="20" ry="12" fill="{blush}" opacity=".85"/>
{extra}</svg>'''
SPRIG = f'<path d="M384 132 q-6 -40 20 -62" fill="none" stroke="{INK}" stroke-width="12" stroke-linecap="round"/><path d="M400 78 q30 -14 46 6 q-22 22 -46 -6 z" fill="#9CC79A" stroke="{INK}" stroke-width="10" stroke-linejoin="round"/>'
STAR = f'<path d="M408 70 l10 22 l24 3 l-18 16 l5 24 l-21 -12 l-21 12 l5 -24 l-18 -16 l24 -3 z" fill="#F4D27A" stroke="{INK}" stroke-width="9" stroke-linejoin="round"/>'
HEART = f'<path d="M418 128 C396 112 384 100 384 86 a16 16 0 0 1 34 -8 a16 16 0 0 1 34 8 C452 100 440 112 418 128 z" fill="#F7A9BE" stroke="{INK}" stroke-width="9" stroke-linejoin="round"/>'
OPTIONS = {
  'A': ('Oat & sage', dict(bg='#EFE6D8', page='#FFFCF6', header='#B9D3B0', ring='#FFFCF6', extra=SPRIG)),
  'B': ('Sage & butter', dict(bg='#CFDCC8', page='#FFFCF6', header='#F2D78E', ring='#FFFCF6', extra=STAR)),
  'C': ('Sand & sky', dict(bg='#E8DCCB', page='#FFFCF6', header='#B8D4E3', ring='#FFFCF6', extra=STAR)),
  'D': ('Strawberry milk', dict(bg='#FBE4EB', page='#FFFCF6', header='#EA95B4', ring='#FFFCF6', extra=HEART)),
}
