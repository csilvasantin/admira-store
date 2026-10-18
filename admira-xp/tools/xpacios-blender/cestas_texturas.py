"""PG103 · texturas de las tres cestas trenzadas (vasos, snacks y café 1971).
Textures for the three woven baskets (reusable cups, snacks and 1971 coffee).

Fuentes: recortes enderezados de las fotos de Carlos (cestas-fuentes/, ver cestas_recortes.py)
y mapas procedurales deterministas para el tejido, la cuerda y el acero.
Las bolsas de snacks son interpretadas: las fotos no muestran sus marcas de cerca.

python3 cestas_texturas.py FUENTES SALIDA   (Pillow + NumPy)
"""
import sys, pathlib, numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

src = pathlib.Path(sys.argv[1]); out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(103)
FONTS = pathlib.Path('/System/Library/Fonts')
def font(name, size, index=0):
    return ImageFont.truetype(str(FONTS / name), size, index=index)
def condensed(size, index=0): return font('Avenir Next Condensed.ttc', size, index)
def bold(size): return font('Supplemental/Arial Bold.ttf', size)

def load(name): return np.asarray(Image.open(src / name).convert('RGB'), float)
def save(a, name, mode=None):
    im = Image.fromarray(np.uint8(np.clip(a, 0, 255)), mode) if isinstance(a, np.ndarray) else a
    if name.endswith('.jpg'): im.convert('RGB').save(out / name, quality=86, optimize=True, progressive=True)
    else: im.save(out / name, optimize=True)

def flatten(a, radius=70, lo=.75, hi=1.35):
    """Quita sombras amplias y brillos para que la luz la ponga la escena. / Remove broad shading."""
    lum = a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114
    blur = np.asarray(Image.fromarray(np.uint8(np.clip(lum, 0, 255))).filter(ImageFilter.GaussianBlur(radius)), float) + 1
    return a * np.clip(lum.mean() / blur, lo, hi)[..., None]

def fill_rows(a, mask, x0, x1):
    """Rellena la máscara fila a fila con el color liso de esa fila (sin texto). / Row-wise plain-colour fill."""
    a = a.copy(); lum = a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114
    for y in np.flatnonzero(mask.any(1)):
        ref = a[y, x0:x1][(~mask[y, x0:x1]) & (lum[y, x0:x1] < 150)]
        a[y, mask[y]] = np.median(ref, 0) if len(ref) else a[y - 1, mask[y]]
    blurred = np.asarray(Image.fromarray(np.uint8(np.clip(a, 0, 255))).filter(ImageFilter.GaussianBlur(3)), float)
    a[mask] = blurred[mask] + rng.normal(0, 1.2, (mask.sum(), 3))
    return a

# --- Tejido de cordón negro (pared del cesto): abajo tupido, banda trenzada, arriba calado vertical. ---
# Woven black cord wall: dense below, braided band, open vertical slats above. u = around, v = up (row 0 = top).
S = 1024; u, v = np.meshgrid(np.arange(S) / S, 1 - np.arange(S) / S)
periods = 12  # 12 por tesela; la pared repite la tesela 4 veces = 48 listones / 12 per tile, 4 tiles around
fu = (u * periods) % 1
height = np.zeros((S, S)); alpha = np.ones((S, S))
dense = v < .38; band = (v >= .38) & (v < .45); open_ = v >= .45
rows = 13
fv = (v * rows / .38) % 1
row_index = np.floor(v * rows / .38).astype(int); col_index = np.floor(u * periods).astype(int)
over = (row_index + col_index) % 2 == 0
horizontal = np.sqrt(np.clip(1 - ((fv - .5) / .46) ** 2, 0, 1)) * np.where(over, 1, .72)
spoke = np.sqrt(np.clip(1 - ((fu - .5) / .18) ** 2, 0, 1)) * np.where(over, .6, 1)
height[dense] = np.maximum(horizontal, spoke)[dense]
alpha[dense] = (np.maximum(horizontal, spoke) > .05)[dense]
braid = (np.sin((u * periods * 4 + v * 60) * np.pi) * .5 + .5) * .7 + .3
height[band] = braid[band]
# Calado: listones verticales de dos cordones con hueco entre ellos. / Open band: twin-cord slats with gaps.
slat = np.abs(fu - .5) < .28
local = np.clip((fu - .22) / .56, 0, .999) * 3 % 1  # tres cordones por listón / three cords per slat
triple = np.sqrt(np.clip(1 - ((local - .5) / .5) ** 2, 0, 1))
height[open_] = np.where(slat, triple, 0)[open_]
alpha[open_] = slat[open_]
ring = open_ & (np.abs(v - .74) < .012)  # cordón horizontal intermedio / middle horizontal cord
height[ring] = 1; alpha[ring] = 1
twist = np.sin((u * periods * 18 - v * 70) * np.pi) * .1
h = np.clip(height + twist * (height > 0), 0, 1)
base = 14 + 30 * h[..., None] ** 2 + rng.normal(0, 1.5, (S, S, 1))
save(np.dstack([np.repeat(base, 3, -1), alpha * 255]), 'tejido-basecolor.png')
gy, gx = np.gradient(h * 3.0)
n = np.dstack([-gx, gy, np.ones_like(h)]); n /= np.linalg.norm(n, axis=-1, keepdims=True)
save((n * .5 + .5) * 255, 'tejido-normal.png')
orm = np.zeros((S, S, 3)); orm[..., 0] = 255 * (.55 + .45 * h); orm[..., 1] = 255 * (.48 - .1 * h); orm[..., 2] = 0
save(orm, 'tejido-orm.png')

# --- Cuerda del borde: trenzado diagonal. / Rim rope: diagonal twist. ---
ru, rv = np.meshgrid(np.arange(1024) / 1024, np.arange(128) / 128)
strand = np.sin((ru * 160 + rv * 3) * np.pi * 2) * .5 + .5
save(np.repeat((16 + 26 * strand ** 1.5)[..., None], 3, -1), 'cuerda-basecolor.jpg')
gy, gx = np.gradient(strand * 2.0)
n = np.dstack([-gx, gy, np.ones_like(strand)]); n /= np.linalg.norm(n, axis=-1, keepdims=True)
save((n * .5 + .5) * 255, 'cuerda-normal.png')

# --- Acero negro con pintura en polvo. / Black powder-coated steel. ---
noise = rng.normal(0, 1, (256, 256))
a = np.zeros((256, 256, 3)); a[..., 0] = 255; a[..., 1] = np.clip(255 * .38 + noise * 6, 0, 255); a[..., 2] = 255 * .55
save(a, 'acero-orm.png')

# --- Vasos reutilizables: sirena de la foto convertida en máscara y repintada. / Cup print from the photo's siren. ---
logo = load('vaso-sirena.png')
# La tinta es oscura frente al blanco del vaso; se compara con el blanco de alrededor, que varía con la sombra.
# The ink is dark against the cup's white; compare with the surrounding white, which varies with shading.
lum = logo[..., 0] * .299 + logo[..., 1] * .587 + logo[..., 2] * .114
paper = Image.fromarray(np.uint8(lum)).filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(10))
mask = np.clip((np.asarray(paper, float) - lum - 28) / 40, 0, 1)
mask[logo[..., 0] > logo[..., 1] + 8] = 0  # el pulgar no es tinta / the thumb is not ink
mid = mask.shape[1] // 2
mask[200:, mid:] = np.maximum(mask[200:, mid:], mask[200:, mid - 1::-1])  # borde inferior derecho / lower right rim
def cup(name, body, ink, scale_marks):
    W, H = 1024, 640
    a = np.zeros((H, W, 3)) + body
    m = np.asarray(Image.fromarray(np.uint8(mask * 255)).resize((265, 265), Image.LANCZOS), float)[..., None] / 255
    y0 = 274 - 132; x0 = 512 - 132
    a[y0:y0 + 265, x0:x0 + 265] = a[y0:y0 + 265, x0:x0 + 265] * (1 - m) + np.array(ink) * m
    im = Image.fromarray(np.uint8(np.clip(a, 0, 255))); d = ImageDraw.Draw(im)
    if scale_marks:  # escala de medidas del vaso frío, al costado / cold-cup measuring ladder
        for i in range(9):
            y = 150 + i * 42; d.line((230, y, 300, y), fill=(196, 198, 194), width=3)
            d.rectangle((300, y - 14, 330, y + 14), outline=(196, 198, 194), width=2)
    save(im, name)
cup('vaso-caliente.jpg', (236, 236, 230), (0, 98, 65), False)
cup('vaso-frio.jpg', (225, 228, 226), (0, 98, 65), True)

# --- Bolsa 1971 Dark Roast: caras de las fotos, sin el pulgar de la portada. / Bag faces; thumb removed. ---
front = load('bolsa-1971-frontal.png')
skin = (front[..., 0] > front[..., 1] + 4)
region = np.zeros(skin.shape, bool); region[846:, 300:] = True; region[:220, :70] = True
m = np.asarray(Image.fromarray(np.uint8((skin & region) * 255)).filter(ImageFilter.MaxFilter(9)), bool)
m[848:868, 210:334] = False  # «DARK ROAST» se ve entero / fully visible label
m[876:900, 105:460] = True; m[908:936, 120:450] = True  # escala y línea inferior se redibujan / redrawn lines
front = fill_rows(front, m, 20, 300)
im = Image.fromarray(np.uint8(np.clip(flatten(front), 0, 255))); d = ImageDraw.Draw(im); ink = (236, 238, 228)
d.text((139, 888), 'LIGHT', font=condensed(15, 2), fill=ink, anchor='mm')
d.line((172, 888, 380, 888), fill=ink, width=2)
for x in (172, 213.5, 255, 296.5, 338, 379.5): d.line((x, 883, x, 893), fill=ink, width=2)
d.text((412, 888), 'DARK', font=condensed(15, 2), fill=ink, anchor='mm')
d.text((272, 922), 'WHOLE BEAN 100% ARABICA COFFEE', font=condensed(21), fill=ink, anchor='mm')
save(im, 'bolsa-1971-frontal.jpg')
for name in ('bolsa-1971-lateral-a', 'bolsa-1971-lateral-b', 'bolsa-1971-trasera'):
    save(flatten(load(name + '.png')), name + '.jpg')

# --- Carteles: la parte que tapan cestas y vasos se completa con su fondo. / Signs: hidden lower part filled. ---
def board(name, crop_h_fraction, out_size):
    a = flatten(load(name), 90, .8, 1.25)
    h, w = a.shape[:2]; total = int(h / crop_h_fraction)
    ext = np.zeros((total - h, w, 3)) + np.median(a[-40:].reshape(-1, 3), 0)
    full = np.vstack([a, ext + rng.normal(0, 1.2, ext.shape)])
    save(Image.fromarray(np.uint8(np.clip(full, 0, 255))).resize(out_size, Image.LANCZOS), name.replace('.png', '.jpg'))
board('cartel-be-green.png', .81, (512, 1472))
board('cartel-1971.png', .68, (512, 1792))

# --- Cartel REFRIGERIS · SNACKS (negro, como el de la foto; sin precios inventados). / Snacks sign, no invented prices. ---
im = Image.new('RGB', (256, 1024), (20, 21, 22)); d = ImageDraw.Draw(im)
d.text((128, 120), 'REFRIGERIS', font=condensed(46, 2), fill=(232, 231, 224), anchor='mm')
d.text((128, 172), 'SNACKS', font=condensed(46, 2), fill=(232, 231, 224), anchor='mm')
d.line((36, 222, 220, 222), fill=(120, 121, 116), width=2)
for i in range(4):
    y = 300 + i * 120; d.line((36, y, 160, y), fill=(150, 151, 146), width=6); d.line((196, y, 220, y), fill=(150, 151, 146), width=6)
save(im, 'cartel-snacks.jpg')

# --- Bolsas de snacks interpretadas (sin marcas): tres diseños. / Interpreted snack bags, three designs. ---
def snack(name, paper, accent, accent2, word):
    W, H = 1024, 512  # izquierda = frente, derecha = dorso / left = front, right = back
    im = Image.new('RGB', (W, H), paper); d = ImageDraw.Draw(im)
    for half in (0, 512):
        for i in range(5):
            d.ellipse((half - 160 + i * 70, 300 + i * 18, half + 300 + i * 70, 640), fill=accent if i % 2 == 0 else accent2)
        d.rectangle((half, 0, half + 511, 26), fill=accent2); d.rectangle((half, 486, half + 511, 511), fill=accent2)
    d.text((256, 190), word, font=condensed(92, 2), fill=accent, anchor='mm')
    save(im.filter(ImageFilter.GaussianBlur(1.2)), name)
snack('snack-a.jpg', (240, 238, 234), (200, 36, 52), (236, 130, 158), 'CHIPS')
snack('snack-b.jpg', (212, 226, 58), (96, 150, 40), (244, 244, 222), 'SNACK')
snack('snack-c.jpg', (242, 240, 236), (120, 176, 60), (232, 150, 170), 'CRUNCH')
print('texturas', sorted(p.name for p in out.glob('*.*')))
