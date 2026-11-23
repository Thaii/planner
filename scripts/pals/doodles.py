# Small doodle icons for the Cute style (replace emoji): ink outline, pastel fill, drawn on a 48x48 grid.
INK = '#4A3B45'
L = f'stroke="{INK}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"'
def svg(inner, label): return f'<svg width="100%" height="100%" viewBox="0 0 48 48" role="img" aria-label="{label}" xmlns="http://www.w3.org/2000/svg">{inner}</svg>'

# ---- Mood faces: features centred on (24,24) ----
def face(fill, eyes, mouth, label, blush=True):
    b = '<ellipse cx="13.5" cy="28" rx="3" ry="1.8" fill="#F4A6B8" opacity=".8"/><ellipse cx="34.5" cy="28" rx="3" ry="1.8" fill="#F4A6B8" opacity=".8"/>' if blush else ''
    return svg(f'<circle cx="24" cy="24" r="19" fill="{fill}" {L}/>' + b + eyes + mouth, label)
DOT = f'<circle cx="17.5" cy="21" r="2.1" fill="{INK}"/><circle cx="30.5" cy="21" r="2.1" fill="{INK}"/>'
MOODS = {
  'mood1': face('#DCD3F7', f'<path d="M14.5 20 q3 2.5 6 0 M27.5 20 q3 2.5 6 0" fill="none" {L}/>', f'<path d="M18.5 32 q5.5 -4.5 11 0" fill="none" {L}/>', 'Rough', blush=False),
  'mood2': face('#D5E9FA', DOT, f'<path d="M19 31.5 q3 -2.5 5 -1 q3 2 5 0" fill="none" {L}/>', 'Low'),
  'mood3': face('#FFF1C4', DOT, f'<path d="M19 30.5 h10" fill="none" {L}/>', 'Okay'),
  'mood4': face('#D3F0DC', DOT, f'<path d="M18.5 28.5 q5.5 5 11 0" fill="none" {L}/>', 'Good'),
  'mood5': face('#FBD3DF', f'<path d="M14.5 21.5 q3 -3 6 0 M27.5 21.5 q3 -3 6 0" fill="none" {L}/>', f'<path d="M17 27.5 h14 q0 8 -7 8 q-7 0 -7 -8 z" fill="#fff" {L}/>', 'Great'),
}

# ---- Lists & collections ----
LISTS = {
  'books': svg(f'<rect x="8" y="31" width="32" height="8" rx="2" fill="#F6B3C3" {L}/><rect x="11" y="23" width="28" height="8" rx="2" fill="#BFE0F7" {L}/><rect x="9" y="15" width="27" height="8" rx="2" fill="#FFE08A" {L}/><path d="M33 33.5 v3 M35 25.5 v3 M31 17.5 v3" {L}/>', 'Books'),
  'movies': svg(f'<rect x="8" y="20" width="32" height="20" rx="3" fill="#E3D9FA" {L}/><path d="M8 13 l30 -5 l1.2 7 l-30 5 z" fill="#FFFDF8" {L}/><path d="M15 12 l4 6.5 M23 10.5 l4 6.5 M31 9.5 l4 6" {L}/><path d="M14 27 h20 M14 33 h12" {L}/>', 'Movies'),
  'tv': svg(f'<path d="M18 8 l6 7 l6 -7" fill="none" {L}/><rect x="7" y="15" width="34" height="24" rx="5" fill="#BFE0F7" {L}/><rect x="12" y="20" width="20" height="14" rx="3" fill="#FFFDF8" {L}/><circle cx="36.5" cy="23" r="1.8" fill="{INK}"/><circle cx="36.5" cy="30" r="1.8" fill="{INK}"/>', 'TV shows'),
  'podcasts': svg(f'<path d="M10 28 v-4 a14 14 0 0 1 28 0 v4" fill="none" {L}/><rect x="7" y="26" width="9" height="14" rx="4" fill="#CDB8F2" {L}/><rect x="32" y="26" width="9" height="14" rx="4" fill="#CDB8F2" {L}/>', 'Podcasts'),
  'restaurants': svg(f'<circle cx="24" cy="25" r="12" fill="#FFFDF8" {L}/><circle cx="24" cy="25" r="7" fill="#F7C9A8" {L}/><path d="M6 10 v8 q0 3 2.5 3 v18 M8.5 10 v8 M11 10 v8 q0 3 -2.5 3" fill="none" {L}/><path d="M40 39 v-29 q-5 4 -4 14 h4" fill="#E3D9FA" {L}/>', 'Restaurants'),
  'places': svg(f'<path d="M24 42 c-8 -10 -13 -16 -13 -23 a13 13 0 0 1 26 0 c0 7 -5 13 -13 23 z" fill="#F7A9BE" {L}/><circle cx="24" cy="19" r="5" fill="#FFFDF8" {L}/>', 'Places to visit'),
  'bucket': svg(f'<path d="M24 6 q2.5 13.5 16 18 q-13.5 4.5 -16 18 q-2.5 -13.5 -16 -18 q13.5 -4.5 16 -18 z" fill="#FFE08A" {L}/><path d="M38 7 v6 M35 10 h6" {L}/>', 'Bucket list'),
  'gifts': svg(f'<rect x="8" y="20" width="32" height="20" rx="3" fill="#F6B3C3" {L}/><rect x="6" y="14" width="36" height="7" rx="2" fill="#FBD3DF" {L}/><path d="M24 14 v26" {L}/><path d="M24 14 c-3 -6 -11 -8 -11 -3 c0 3 6 3 11 3 c5 0 11 0 11 -3 c0 -5 -8 -3 -11 3 z" fill="#FFE08A" {L}/>', 'Gift ideas'),
  'birthday': svg(f'<rect x="9" y="24" width="30" height="15" rx="3" fill="#FBD3DF" {L}/><path d="M9 29 q3.75 3 7.5 0 t7.5 0 t7.5 0 t7.5 0" fill="none" {L}/><rect x="6" y="39" width="36" height="3" rx="1.5" fill="#FFFDF8" {L}/><rect x="22" y="13" width="4" height="11" rx="1.5" fill="#BFE0F7" {L}/><path d="M24 5 q3.5 4 0 6.5 q-3.5 -2.5 0 -6.5 z" fill="#FFD27A" {L}/>', 'Birthday ideas'),
  'christmas': svg(f'<path d="M24 7 l9 11 h-4 l8 10 h-4 l7 9 h-32 l7 -9 h-4 l8 -10 h-4 z" fill="#9AD7B1" {L}/><rect x="21" y="37" width="6" height="5" fill="#F7C9A8" {L}/><circle cx="20" cy="22" r="1.7" fill="#F7A1A1"/><circle cx="28" cy="29" r="1.7" fill="#FFD27A"/><circle cx="18" cy="33" r="1.7" fill="#BFE0F7"/>', 'Christmas list'),
  'wishlist': svg(f'<path d="M6 40 l14 -14" stroke="#CDB8F2" stroke-width="3" stroke-linecap="round"/><path d="M10 42 l8 -8 M4 34 l8 -8" stroke="#E3D9FA" stroke-width="3" stroke-linecap="round"/><path d="M31 7 l3.6 7.4 l8.1 1.2 l-5.9 5.7 l1.4 8.1 l-7.2 -3.8 l-7.2 3.8 l1.4 -8.1 l-5.9 -5.7 l8.1 -1.2 z" fill="#FFE08A" {L}/>', 'Wishlist'),
  'favourites': svg(f'<path d="M24 6 l5 10.3 l11.3 1.6 l-8.2 8 l1.9 11.2 l-10 -5.3 l-10 5.3 l1.9 -11.2 l-8.2 -8 l11.3 -1.6 z" fill="#FFE08A" {L}/><path d="M19.5 22 v1.5 M28.5 22 v1.5" {L}/>', 'Favourite things'),
  'quotes': svg(f'<path d="M8 10 h32 a3 3 0 0 1 3 3 v18 a3 3 0 0 1 -3 3 h-18 l-8 7 v-7 h-6 a3 3 0 0 1 -3 -3 v-18 a3 3 0 0 1 3 -3 z" fill="#E3D9FA" {L}/><path d="M17 18 q-3 2 -3 6 h4 v-4 h-1.5 M28 18 q-3 2 -3 6 h4 v-4 h-1.5" fill="{INK}" {L}/>', 'Quotes'),
}

# ---- Dopamine menu courses ----
COURSES = {
  'app': svg(f'<path d="M6 30 q0 -16 18 -16 q18 0 18 16 q-4 4 -18 4 q-14 0 -18 -4 z" fill="#FFF1C4" {L}/><path d="M16 17 q1 4 3 5 M24 15 v6 M32 17 q-1 4 -3 5" fill="none" {L}/><rect x="5" y="34" width="38" height="5" rx="2.5" fill="#BFE0F7" {L}/>', 'Appetizers'),
  'main': svg(f'<path d="M17 13 q-3 -3 0 -6 M24 13 q-3 -3 0 -6 M31 13 q-3 -3 0 -6" fill="none" stroke="#CDB8F2" stroke-width="2.4" stroke-linecap="round"/><path d="M5 20 h38 q0 18 -19 18 q-19 0 -19 -18 z" fill="#F7C9A8" {L}/><path d="M17 38 h14 v3 h-14 z" fill="#F7C9A8" {L}/><path d="M9 24 h30" stroke="#FFFDF8" stroke-width="2.5" stroke-linecap="round"/>', 'Mains'),
  'side': svg(f'<circle cx="17" cy="20" r="6" fill="#9AD7B1" {L}/><circle cx="27" cy="16" r="6" fill="#B9E4C9" {L}/><circle cx="33" cy="22" r="5" fill="#F7A1A1" {L}/><path d="M5 24 h38 q0 16 -19 16 q-19 0 -19 -16 z" fill="#BFE0F7" {L}/>', 'Sides'),
  'dessert': svg(f'<path d="M15 24 l9 19 l9 -19 z" fill="#F7C9A8" {L}/><path d="M19 29 l8 6 M17.5 26 l11 8 M29 29 l-8 6" stroke="#E0A27E" stroke-width="1.6" stroke-linecap="round"/><path d="M12 24 a12 12 0 0 1 24 0 q-3 3 -6 0 q-3 3 -6 0 q-3 3 -6 0 q-3 3 -6 0 z" fill="#FBD3DF" {L}/><circle cx="24" cy="8" r="3.2" fill="#F7A1A1" {L}/><path d="M18 17 l1 1 M28 15 l1 1.5 M23 19 v1.5" stroke="#9CCBF2" stroke-width="2" stroke-linecap="round"/>', 'Desserts'),
  'special': svg(f'<path d="M20 8 q2 11 13 13 q-11 2 -13 13 q-2 -11 -13 -13 q11 -2 13 -13 z" fill="#FFE08A" {L}/><path d="M36 26 q1 6 7 7 q-6 1 -7 7 q-1 -6 -7 -7 q6 -1 7 -7 z" fill="#FBD3DF" {L}/><path d="M37 6 v6 M34 9 h6" {L}/>', 'Specials'),
}
ALL = {**MOODS, **LISTS, **{'course-' + k: v for k, v in COURSES.items()}}
