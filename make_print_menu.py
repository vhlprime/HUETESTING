# -*- coding: utf-8 -*-
"""Huế Vietnamese Cuisine — hard-copy menu (Letter, 2 pages, 2 columns).
White background, black text, prismatic blue accents, Lora serif, food photos."""
import re, json
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color, HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader

pdfmetrics.registerFont(TTFont('Lora', '/usr/share/fonts/truetype/google-fonts/Lora-Variable.ttf'))
pdfmetrics.registerFont(TTFont('Lora-Italic', '/usr/share/fonts/truetype/google-fonts/Lora-Italic-Variable.ttf'))
BOLD = 'Lora'  # variable font renders at Regular weight; we fake bold via size/color

W, H = letter
M = 40                       # page margin
GUT = 22                     # column gutter
COLW = (W - 2*M - GUT) / 2

INK    = HexColor('#161311')
SOFT   = HexColor('#6a5f5a')
BLUE   = HexColor('#3f5e8c')
SILVER = HexColor('#7d97b8')
# prismatic blue ray stops
PRISM = ['#5B8DEF', '#7C6BD9', '#9A7BD9', '#4FB3E8', '#6ACBE0', '#5B8DEF']

def hexc(s): return HexColor(s)
def lerp(a, b, t):
    return Color(a.red+(b.red-a.red)*t, a.green+(b.green-a.green)*t, a.blue+(b.blue-a.blue)*t)

def prism_band(c, x, y, w, h, lighten=0.0, steps=120):
    stops = [hexc(s) for s in PRISM]
    seg = len(stops) - 1
    for i in range(steps):
        t = i / (steps - 1)
        k = min(int(t * seg), seg - 1)
        col = lerp(stops[k], stops[k+1], t*seg - k)
        if lighten: col = lerp(col, Color(1,1,1), lighten)
        c.setFillColor(col)
        c.rect(x + w*i/steps, y, w/steps + 0.6, h, stroke=0, fill=1)

# ---------- load MENU from script.js ----------
js = open('script.js', encoding='utf-8').read()
menu_src = re.search(r"const MENU = (\[[\s\S]*?\n\]);", js).group(1)
menu_src = re.sub(r"(\{|,)\s*([A-Za-z_]\w*)\s*:", r'\1"\2":', menu_src)
menu_src = menu_src.replace("'", '"')
menu_src = re.sub(r",\s*([\]}])", r"\1", menu_src)
MENU = json.loads(menu_src)

def price_str(it):
    if 'sizes' in it:
        prices = [s['p'] for s in it['sizes']]
        if len(set(prices)) == 1:                       # same price for every choice
            return f"{prices[0]:.2f}"
        return '  ·  '.join(f"{s['l'][0] if s['l'] in ('Large','Medium') else s['l']} {s['p']:.2f}" for s in it['sizes'])
    return f"{it['price']:.2f}"

PHOTOS_P1 = ['images/bun-bo-hue.jpg','images/egg-rolls-real.jpg','images/summer-rolls-real.jpg','images/tomahawk-meatball-pho.jpg','images/mango-sticky-rice.jpg']
PHOTOS_P2 = ['images/mongolian-beef-real.jpg','images/fried-rice-real.jpg','images/papaya-salad.jpg','images/salt-pepper-calamari.jpg']

c = canvas.Canvas('/mnt/user-data/outputs/HueVietnameseCuisine-menu-print.pdf', pagesize=letter)
c.setTitle('Huế Vietnamese Cuisine — Menu')

def photo_strip(c, paths, y, h):
    n = len(paths); gap = 8
    w = (W - 2*M - gap*(n-1)) / n
    x = M
    for p in paths:
        prism_band(c, x-1.5, y-1.5, w+3, h+3, lighten=0.15)   # thin prismatic frame
        img = ImageReader(p)
        iw, ih = img.getSize()
        # center-crop to the frame
        scale = max(w/iw, h/ih)
        c.saveState()
        pth = c.beginPath(); pth.rect(x, y, w, h); c.clipPath(pth, stroke=0)
        c.drawImage(img, x - (iw*scale - w)/2, y - (ih*scale - h)/2, iw*scale, ih*scale)
        c.restoreState()
        x += w + gap
    c.setFont('Lora-Italic', 6.6); c.setFillColor(SOFT)
    c.drawRightString(W - M, y - 8.2, 'Some dish photos are AI-assisted illustrations; actual food may vary.')

def page_header(c, first):
    if first:
        prism_band(c, 0, H-6, W, 6)
        c.setFillColor(BLUE); c.setFont('Lora', 40)
        c.drawCentredString(W/2, H-58, 'Huế')
        c.setFillColor(INK);  c.setFont('Lora', 15)
        c.drawCentredString(W/2, H-76, 'V I E T N A M E S E   C U I S I N E')
        c.setFont('Lora-Italic', 9.5); c.setFillColor(SOFT)
        c.drawCentredString(W/2, H-91, 'Heritage recipes from Huế · fresh herbs, slow broths, and a warm welcome')
        prism_band(c, W/2-110, H-99, 220, 1.6)
        photo_strip(c, PHOTOS_P1, H-186, 78)
        return H - 205
    else:
        prism_band(c, 0, H-6, W, 6)
        c.setFillColor(BLUE); c.setFont('Lora', 19)
        c.drawCentredString(W/2, H-34, 'Huế Vietnamese Cuisine · Menu')
        photo_strip(c, PHOTOS_P2, H-118, 68)
        return H - 137

def page_footer(c):
    prism_band(c, 0, 0, W, 5)
    c.setFillColor(INK); c.setFont('Lora', 9.5)
    c.drawCentredString(W/2, 30, '6538 4th Ave S, Suite 1 · Seattle, WA 98108   ·   (206) 693-3311   ·   Mon–Sat 10 AM – 8 PM')
    c.setFillColor(SOFT); c.setFont('Lora-Italic', 8.6)
    c.drawCentredString(W/2, 17, 'Order online: huevietnamesecuisine.com · Dine-In · Takeout · Catering · Happy Hour: $2 off wings, 2–5 PM')

# ---------- flowing two-column layout ----------
state = {'page': 1, 'col': 0, 'y': None}
BOTTOM = 46

def new_page():
    page_footer(c); c.showPage()
    state['page'] += 1; state['col'] = 0
    state['y'] = page_header(c, False)

def colx(): return M + state['col']*(COLW+GUT)

def ensure(hneed):
    if state['y'] - hneed < BOTTOM:
        if state['col'] == 0:
            state['col'] = 1
            state['y'] = state['top']
        else:
            new_page()
            state['top'] = state['y']

def wrap(text, font, size, width):
    words = text.split(); lines=[]; cur=''
    for w_ in words:
        t = (cur+' '+w_).strip()
        if pdfmetrics.stringWidth(t, font, size) <= width: cur = t
        else: lines.append(cur); cur = w_
    if cur: lines.append(cur)
    return lines

def draw_category(cat):
    hdr = cat['name'] + ((' · ' + cat['vn']) if cat.get('vn') and cat['vn'] != cat['name'] else '')
    ensure(34)
    y = state['y']; x = colx()
    c.setFillColor(BLUE); c.setFont('Lora', 14.5)
    c.drawString(x, y-14, hdr)
    prism_band(c, x, y-19, COLW, 1.4)
    state['y'] = y - 26
    if cat.get('note'):
        for ln in wrap(cat['note'], 'Lora-Italic', 8.4, COLW):
            ensure(11); c.setFont('Lora-Italic', 8.4); c.setFillColor(SOFT)
            c.drawString(colx(), state['y']-8, ln); state['y'] -= 11
        state['y'] -= 2

def draw_item(it):
    price = price_str(it)
    pw = pdfmetrics.stringWidth(price, 'Lora', 10.5)
    name_w = COLW - pw - 10
    nlines = wrap(it['name'], 'Lora', 10.5, name_w)
    h = 13.5*len(nlines) + (11 if it.get('vn') else 0) + 3
    extra = ''
    if 'sizes' in it and len({s['p'] for s in it['sizes']}) == 1 and it['sizes'][0]['l'] not in ('White Rice','Rice'):
        extra = 'Choice of ' + ' or '.join(s['l'] for s in it['sizes'])
    if it.get('opts'):
        extra = (extra + '. ' if extra else '') + 'Choose 1–3: ' + ', '.join(it['opts']['choices'])
    dtext = ((it.get('desc','') + ' ' + extra).strip()) if (it.get('desc') or extra) else ''
    dlines = wrap(dtext, 'Lora-Italic', 8.2, COLW-8) if dtext else []
    h += 10.4*len(dlines)
    ensure(h)
    x = colx(); y = state['y']
    c.setFillColor(INK); c.setFont('Lora', 10.5)
    for i, ln in enumerate(nlines):
        c.drawString(x, y-11-13.5*i, ln)
    # dot leaders + price on the first line
    first_w = pdfmetrics.stringWidth(nlines[0], 'Lora', 10.5)
    c.setFillColor(SILVER); c.setFont('Lora', 9)
    dots_x0 = x + first_w + 4; dots_x1 = x + COLW - pw - 5
    if dots_x1 > dots_x0:
        ndots = int((dots_x1 - dots_x0) / 3.4)
        c.drawString(dots_x0, y-11, '·' * max(ndots, 0))
    c.setFillColor(BLUE); c.setFont('Lora', 10.5)
    c.drawRightString(x + COLW, y-11, price)
    yy = y - 13.5*len(nlines)
    if it.get('vn'):
        c.setFillColor(SOFT); c.setFont('Lora-Italic', 8.6)
        c.drawString(x+8, yy-9, it['vn']); yy -= 11
    for ln in dlines:
        c.setFillColor(SOFT); c.setFont('Lora-Italic', 8.2)
        c.drawString(x+8, yy-8.6, ln); yy -= 10.4
    state['y'] = yy - 3

state['y'] = page_header(c, True)
state['top'] = state['y']
for cat in MENU:
    draw_category(cat)
    for it in cat['items']:
        draw_item(it)
    state['y'] -= 5

# ---------- promos panel fills the remaining column ----------
def draw_promos():
    if state['col'] == 0:
        state['col'] = 1; state['y'] = state['top']
    x = colx(); top = state['y']
    ph, pw_ = 190, COLW
    # photo above the panel
    img = ImageReader('images/seafood-pho.jpg')
    iw, ih = img.getSize(); fh = 150
    prism_band(c, x-1.5, top-fh-1.5, pw_+3, fh+3, lighten=0.15)
    scale = max(pw_/iw, fh/ih)
    c.saveState(); p = c.beginPath(); p.rect(x, top-fh, pw_, fh); c.clipPath(p, stroke=0)
    c.drawImage(img, x-(iw*scale-pw_)/2, top-fh-(ih*scale-fh)/2, iw*scale, ih*scale)
    c.restoreState()
    y = top - fh - 26
    c.setFillColor(BLUE); c.setFont('Lora', 14.5)
    c.drawString(x, y, 'House Specials & Rewards')
    prism_band(c, x, y-5, pw_, 1.4)
    y -= 22
    promos = [
        ('Buy 10 Get 1 Free', 'Order ten Bánh Mì, pick any eleventh sandwich free. One promotion per order.'),
        ('Happy Hour · 2–5 PM', '$2 off Fish Sauce Wings and Butter Fried Wings, Monday–Saturday.'),
        ('WELCOME5 · $5 Off', 'Join our email list at huevietnamesecuisine.com and get $5 off your first online order of $50 or more.'),
        ('Loyalty Rewards', 'Earn points on every online order — 100 points brings a free Bánh Mì.'),
        ('Catering', 'Party trays and event menus with 24-hour notice. Ask us or book online.'),
    ]
    for title, body in promos:
        c.setFillColor(INK); c.setFont('Lora', 11)
        c.drawString(x, y, title); y -= 13
        for ln in wrap(body, 'Lora-Italic', 9, pw_-6):
            c.setFillColor(SOFT); c.setFont('Lora-Italic', 9)
            c.drawString(x+6, y, ln); y -= 11.5
        y -= 7

draw_promos()
page_footer(c)
c.save()
print('pages used:', state['page'])
