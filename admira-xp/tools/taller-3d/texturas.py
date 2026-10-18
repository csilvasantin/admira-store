"""Taller 3D · texturas de una receta / 3D workshop · textures of a recipe.

Cada receta (recetas/*.json) lista sus texturas como operaciones con nombre. Este módulo las ejecuta
en orden y deja los ficheros en `texturas_dir`. Cada operación tiene su propia semilla, así que el
resultado no depende del orden ni de las demás.
Each recipe lists its textures as named operations; each one has its own seed, so results do not depend
on order or on the others.

Recetas del Arquitecto (admira.biz, orden «detallar»): traen los recortes dentro, en `fuentes_embebidas`
({"nombre.png": "data:image/png;base64,…"}); se escriben en fuentes/<encargo>/ antes de las operaciones.
Recipes from the Architect carry their crops inside `fuentes_embebidas`; they are written to fuentes/ first.

Operaciones / operations:
  recorte       foto + 4 esquinas → recorte enderezado en `fuentes` (solo con la carpeta de fotos originales)
  tejido        pared de cordón trenzado: tejido-basecolor.png (alfa), tejido-normal.png, tejido-orm.png
  cuerda        cuerda enrollada del borde: cuerda-basecolor.jpg, cuerda-normal.png
  acero         acero con pintura en polvo: acero-orm.png
  vaso          sirena de una foto de vaso repintada sobre el cuerpo del vaso (máscara de tinta)
  foto          recorte aplanado (sin sombras amplias) tal cual
  foto_retocada recorte aplanado con zonas rellenas (p. ej. un pulgar) y líneas o textos redibujados
  cartel_foto   cartel fotografiado; la parte tapada se completa con su fondo
  cartel_texto  cartel de texto (sin precios ni datos inventados)
  bolsa_snack   bolsa almohada interpretada, sin marca (frente | dorso)
  bolsa_foto    bolsa almohada desde un recorte de foto (frente | dorso en espejo)
  pet           cuerpo de PET liso con variación de moldeo
  orm           mapa ORM uniforme (R oclusión, G rugosidad, B metal)
  normal_polvo  normal muy fina de pintura en polvo

python3 texturas.py RECETA [--fotos CARPETA] [--salida CARPETA]   (Pillow + NumPy)
"""
import sys, re, json, base64, hashlib, pathlib, numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONTS = pathlib.Path('/System/Library/Fonts')
FUENTES_TIPO = {'condensada': ('Avenir Next Condensed.ttc', 0), 'condensada-negrita': ('Avenir Next Condensed.ttc', 2),
                'arial': ('Supplemental/Arial.ttf', 0), 'arial-negrita': ('Supplemental/Arial Bold.ttf', 0)}

def tipo(nombre, tam):
    f, i = FUENTES_TIPO[nombre]; return ImageFont.truetype(str(FONTS / f), tam, index=i)

def semilla(*partes):
    return int(hashlib.sha256('/'.join(map(str, partes)).encode()).hexdigest()[:12], 16)

class Taller:
    def __init__(self, receta_path, fotos=None, salida=None):
        self.path = pathlib.Path(receta_path); self.receta = json.loads(self.path.read_text())
        repo = self.path.resolve()
        while not (repo / '.git').exists() and repo.parent != repo: repo = repo.parent
        self.repo = repo
        self.fuentes = self.path.parent.parent / 'fuentes' / self.receta['fuentes']
        self.out = pathlib.Path(salida) if salida else repo / self.receta['texturas_dir']; self.out.mkdir(parents=True, exist_ok=True)
        self.fotos = pathlib.Path(fotos) if fotos else None

    def rng(self, op): return np.random.default_rng(semilla(self.receta['encargo'], op.get('salida') or op['op']))
    def load(self, name): return np.asarray(Image.open(self.fuentes / name).convert('RGB'), float)
    def save(self, a, name):
        im = Image.fromarray(np.uint8(np.clip(a, 0, 255))) if isinstance(a, np.ndarray) else a
        if name.endswith('.jpg'): im.convert('RGB').save(self.out / name, quality=86, optimize=True, progressive=True)
        else: im.save(self.out / name, optimize=True)

    def embebidas(self):
        """Recortes que trae la receta del Arquitecto → fuentes/<encargo>/ (solo PNG con nombre limpio)."""
        escritas, embebidas = [], self.receta.get('fuentes_embebidas') or {}
        if embebidas and not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,120}', str(self.receta.get('fuentes'))): raise SystemExit('«fuentes» debe ser un nombre de carpeta limpio')
        for nombre, url in embebidas.items():
            m = re.fullmatch(r'data:image/png;base64,([A-Za-z0-9+/=]+)', url or '')
            if not re.fullmatch(r'[a-z0-9][a-z0-9-]{0,80}\.png', nombre) or not m: raise SystemExit(f'fuente embebida no válida: {nombre}')
            self.fuentes.mkdir(parents=True, exist_ok=True); (self.fuentes / nombre).write_bytes(base64.b64decode(m.group(1))); escritas.append(nombre)
        return escritas

    def run(self):
        hechas = self.embebidas()
        for op in self.receta['texturas']:
            if op['op'] == 'recorte' and not self.fotos: continue
            getattr(self, 'op_' + op['op'])(op, self.rng(op)); hechas.append(op.get('salida') or op['op'])
        return hechas

    # --- utilidades / helpers ---
    @staticmethod
    def flatten(a, radius=70, lo=.75, hi=1.35):
        """Quita sombras amplias y brillos: la luz la pone la escena. / Remove broad shading."""
        lum = a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114
        blur = np.asarray(Image.fromarray(np.uint8(np.clip(lum, 0, 255))).filter(ImageFilter.GaussianBlur(radius)), float) + 1
        return a * np.clip(lum.mean() / blur, lo, hi)[..., None]

    @staticmethod
    def homography(dst, srcq):
        a = []
        for (u, v), (x, y) in zip(dst, srcq):
            a.append([u, v, 1, 0, 0, 0, -x * u, -x * v, -x]); a.append([0, 0, 0, u, v, 1, -y * u, -y * v, -y])
        return np.linalg.svd(np.array(a, float))[2][-1].reshape(3, 3)

    @staticmethod
    def bilinear(img, x, y):
        h, w = img.shape[:2]; x = np.clip(x, 0, w - 1.001); y = np.clip(y, 0, h - 1.001)
        x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int); fx = (x - x0)[..., None]; fy = (y - y0)[..., None]
        return img[y0, x0] * (1 - fx) * (1 - fy) + img[y0, x0 + 1] * fx * (1 - fy) + img[y0 + 1, x0] * (1 - fx) * fy + img[y0 + 1, x0 + 1] * fx * fy

    # --- operaciones / operations ---
    def op_recorte(self, op, rng):
        """Foto original → recorte enderezado por 4 esquinas, o desenrollado de un cilindro (`cilindro`)."""
        img = np.asarray(Image.open(self.fotos / op['foto']).convert('RGB'), float); self.fuentes.mkdir(parents=True, exist_ok=True)
        if 'cilindro' in op:  # {cx, r, cy, s0, medio}: vaso visto de frente / cup seen from the front
            c = op['cilindro']; half = c['medio']
            s, y = np.meshgrid(np.arange(-half, half) + .5 + c['s0'], np.arange(-half, half) + .5 + c['cy'])
            a = self.bilinear(img, c['cx'] + c['r'] * np.sin(s / c['r']), y)
        else:
            w, h = op['tam']; H = self.homography([(0, 0), (w, 0), (w, h), (0, h)], op['esquinas'])
            u, v = np.meshgrid(np.arange(w) + .5, np.arange(h) + .5); p = np.stack([u, v, np.ones_like(u)], -1) @ H.T
            a = self.bilinear(img, p[..., 0] / p[..., 2], p[..., 1] / p[..., 2])
        Image.fromarray(np.uint8(np.clip(a, 0, 255))).save(self.fuentes / op['salida'], optimize=True)

    def op_tejido(self, op, rng):
        """Cordón trenzado: abajo tupido, banda trenzada, arriba calado. u = alrededor, v = arriba."""
        S = op.get('tam', 1024); u, v = np.meshgrid(np.arange(S) / S, 1 - np.arange(S) / S)
        periods = op.get('periodos', 12); rows = op.get('filas', 13); d0, d1 = op.get('tupido_hasta', .38), op.get('calado_desde', .45)
        fu = (u * periods) % 1; height = np.zeros((S, S)); alpha = np.ones((S, S))
        dense = v < d0; band = (v >= d0) & (v < d1); open_ = v >= d1
        fv = (v * rows / d0) % 1; over = (np.floor(v * rows / d0).astype(int) + np.floor(u * periods).astype(int)) % 2 == 0
        horizontal = np.sqrt(np.clip(1 - ((fv - .5) / .46) ** 2, 0, 1)) * np.where(over, 1, .72)
        spoke = np.sqrt(np.clip(1 - ((fu - .5) / .18) ** 2, 0, 1)) * np.where(over, .6, 1)
        height[dense] = np.maximum(horizontal, spoke)[dense]; alpha[dense] = (np.maximum(horizontal, spoke) > .05)[dense]
        height[band] = ((np.sin((u * periods * 4 + v * 60) * np.pi) * .5 + .5) * .7 + .3)[band]
        slat = np.abs(fu - .5) < op.get('liston', .28)
        local = np.clip((fu - (.5 - op.get('liston', .28))) / (2 * op.get('liston', .28)), 0, .999) * 3 % 1  # tres cordones / three cords
        height[open_] = np.where(slat, np.sqrt(np.clip(1 - ((local - .5) / .5) ** 2, 0, 1)), 0)[open_]; alpha[open_] = slat[open_]
        for vr in op.get('cordones', [.74]): ring = open_ & (np.abs(v - vr) < .012); height[ring] = 1; alpha[ring] = 1
        h = np.clip(height + np.sin((u * periods * 18 - v * 70) * np.pi) * .1 * (height > 0), 0, 1)
        base = 14 + 30 * h[..., None] ** 2 + rng.normal(0, 1.5, (S, S, 1))
        self.save(np.dstack([np.repeat(base, 3, -1), alpha * 255]), 'tejido-basecolor.png')
        gy, gx = np.gradient(h * 3.0); n = np.dstack([-gx, gy, np.ones_like(h)]); n /= np.linalg.norm(n, axis=-1, keepdims=True)
        self.save((n * .5 + .5) * 255, 'tejido-normal.png')
        orm = np.zeros((S, S, 3)); orm[..., 0] = 255 * (.55 + .45 * h); orm[..., 1] = 255 * (.48 - .1 * h)
        self.save(orm, 'tejido-orm.png')

    def op_cuerda(self, op, rng):
        ru, rv = np.meshgrid(np.arange(1024) / 1024, np.arange(128) / 128)
        strand = np.sin((ru * op.get('vueltas', 160) + rv * 3) * np.pi * 2) * .5 + .5
        self.save(np.repeat((16 + 26 * strand ** 1.5)[..., None], 3, -1), 'cuerda-basecolor.jpg')
        gy, gx = np.gradient(strand * 2.0); n = np.dstack([-gx, gy, np.ones_like(strand)]); n /= np.linalg.norm(n, axis=-1, keepdims=True)
        self.save((n * .5 + .5) * 255, 'cuerda-normal.png')

    def op_acero(self, op, rng):
        noise = rng.normal(0, 1, (256, 256)); a = np.zeros((256, 256, 3))
        a[..., 0] = 255; a[..., 1] = np.clip(255 * op.get('rugosidad', .38) + noise * 6, 0, 255); a[..., 2] = 255 * op.get('metal', .55)
        self.save(a, op.get('salida', 'acero-orm.png'))

    def op_vaso(self, op, rng):
        """Tinta de la sirena (oscura frente al blanco, que varía con la sombra) repintada en limpio."""
        logo = self.load(op['fuente']); lum = logo[..., 0] * .299 + logo[..., 1] * .587 + logo[..., 2] * .114
        paper = Image.fromarray(np.uint8(lum)).filter(ImageFilter.MaxFilter(21)).filter(ImageFilter.GaussianBlur(10))
        mask = np.clip((np.asarray(paper, float) - lum - 28) / 40, 0, 1); mask[logo[..., 0] > logo[..., 1] + 8] = 0  # piel fuera / skin out
        mid = mask.shape[1] // 2; mask[200:, mid:] = np.maximum(mask[200:, mid:], mask[200:, mid - 1::-1])
        W, H = 1024, 640; a = np.zeros((H, W, 3)) + op['cuerpo']
        m = np.asarray(Image.fromarray(np.uint8(mask * 255)).resize((265, 265), Image.LANCZOS), float)[..., None] / 255
        a[142:407, 380:645] = a[142:407, 380:645] * (1 - m) + np.array(op['tinta']) * m
        im = Image.fromarray(np.uint8(np.clip(a, 0, 255))); d = ImageDraw.Draw(im)
        if op.get('escala'):  # escala de medidas del vaso frío / cold-cup measuring ladder
            for i in range(9):
                y = 150 + i * 42; d.line((230, y, 300, y), fill=(196, 198, 194), width=3); d.rectangle((300, y - 14, 330, y + 14), outline=(196, 198, 194), width=2)
        self.save(im, op['salida'])

    def op_foto(self, op, rng):
        self.save(self.flatten(self.load(op['fuente'])), op['salida'])

    def op_foto_retocada(self, op, rng):
        """Rellena zonas (piel o rectángulos) con el color liso de su fila y redibuja líneas y textos."""
        a = self.load(op['fuente']); mask = np.zeros(a.shape[:2], bool)
        for x0, y0, x1, y1 in op.get('piel', []):
            skin = a[..., 0] > a[..., 1] + 4; region = np.zeros(mask.shape, bool); region[y0:y1, x0:x1] = True; mask |= skin & region
        mask = np.asarray(Image.fromarray(np.uint8(mask * 255)).filter(ImageFilter.MaxFilter(9)), bool)
        for x0, y0, x1, y1 in op.get('respetar', []): mask[y0:y1, x0:x1] = False
        for x0, y0, x1, y1 in op.get('borrar', []): mask[y0:y1, x0:x1] = True
        x0, x1 = op.get('referencia', [20, 300]); lum = a[..., 0] * .299 + a[..., 1] * .587 + a[..., 2] * .114
        for y in np.flatnonzero(mask.any(1)):
            ref = a[y, x0:x1][(~mask[y, x0:x1]) & (lum[y, x0:x1] < 150)]
            a[y, mask[y]] = np.median(ref, 0) if len(ref) else a[y - 1, mask[y]]
        blurred = np.asarray(Image.fromarray(np.uint8(np.clip(a, 0, 255))).filter(ImageFilter.GaussianBlur(3)), float)
        a[mask] = blurred[mask] + rng.normal(0, 1.2, (mask.sum(), 3))
        im = Image.fromarray(np.uint8(np.clip(self.flatten(a), 0, 255))); d = ImageDraw.Draw(im); ink = tuple(op.get('tinta', (236, 238, 228)))
        for ln in op.get('lineas', []): d.line(tuple(ln[:4]), fill=ink, width=ln[4] if len(ln) > 4 else 2)
        for t in op.get('textos', []): d.text((t['x'], t['y']), t['texto'], font=tipo(t.get('tipo', 'condensada'), t['tam']), fill=ink, anchor='mm')
        self.save(im, op['salida'])

    def op_cartel_foto(self, op, rng):
        a = self.flatten(self.load(op['fuente']), 90, .8, 1.25); h, w = a.shape[:2]; total = int(h / op['fraccion_visible'])
        ext = np.zeros((total - h, w, 3)) + np.median(a[-40:].reshape(-1, 3), 0)
        full = np.vstack([a, ext + rng.normal(0, 1.2, ext.shape)])
        self.save(Image.fromarray(np.uint8(np.clip(full, 0, 255))).resize(tuple(op['tam']), Image.LANCZOS), op['salida'])

    def op_cartel_texto(self, op, rng):
        w, h = op['tam']; im = Image.new('RGB', (w, h), tuple(op['fondo'])); d = ImageDraw.Draw(im)
        for t in op.get('textos', []): d.text((t.get('x', w // 2), t['y']), t['texto'], font=tipo(t.get('tipo', 'condensada-negrita'), t['tam']), fill=tuple(op['tinta']), anchor='mm')
        for ln in op.get('lineas', []): d.line(tuple(ln[:4]), fill=tuple(ln[5]) if len(ln) > 5 else tuple(op['tinta']), width=ln[4] if len(ln) > 4 else 2)
        self.save(im, op['salida'])

    def op_bolsa_snack(self, op, rng):
        im = Image.new('RGB', (1024, 512), tuple(op['papel'])); d = ImageDraw.Draw(im); acc, acc2 = tuple(op['acento']), tuple(op['acento2'])
        for half in (0, 512):  # izquierda = frente, derecha = dorso / left = front, right = back
            for i in range(5): d.ellipse((half - 160 + i * 70, 300 + i * 18, half + 300 + i * 70, 640), fill=acc if i % 2 == 0 else acc2)
            d.rectangle((half, 0, half + 511, 26), fill=acc2); d.rectangle((half, 486, half + 511, 511), fill=acc2)
        d.text((256, 190), op['palabra'], font=tipo('condensada-negrita', 92), fill=acc, anchor='mm')
        self.save(im.filter(ImageFilter.GaussianBlur(1.2)), op['salida'])

    def op_bolsa_foto(self, op, rng):
        """Bolsa almohada con la cara fotografiada: frente a la izquierda y dorso en espejo a la derecha (1024 × 512)."""
        a = Image.fromarray(np.uint8(np.clip(self.flatten(self.load(op['fuente'])), 0, 255)))
        k = min(512 / a.width, 512 / a.height); cara = a.resize((max(1, round(a.width * k)), max(1, round(a.height * k))), Image.LANCZOS)
        fondo = tuple(int(v) for v in np.median(np.asarray(a, float).reshape(-1, 3), 0))
        im = Image.new('RGB', (1024, 512), fondo); x0, y0 = (512 - cara.width) // 2, (512 - cara.height) // 2
        im.paste(cara, (x0, y0)); im.paste(cara.transpose(Image.FLIP_LEFT_RIGHT), (512 + x0, y0))
        self.save(im, op['salida'])

    def op_pet(self, op, rng):
        S = op.get('tam', 1024); a = np.zeros((S, S, 3)) + op['color'] + rng.normal(0, 1, (S, S))[..., None] * 1.2
        self.save(a, op['salida'])

    def op_orm(self, op, rng):
        S = op.get('tam', 512); noise = rng.normal(0, 1, (S, S)); a = np.zeros((S, S, 3), dtype=np.uint8); a[..., 0] = 255
        a[..., 1] = np.uint8(np.clip(255 * op['rugosidad'] + noise * op.get('ruido', 3), 0, 255)); a[..., 2] = int(255 * op.get('metal', 0))
        self.save(a, op['salida'])

    def op_normal_polvo(self, op, rng):
        S = op.get('tam', 512); h = rng.normal(0, 1, (S, S)) * .002; gx, gy = np.gradient(h)
        n = np.stack((-gx, -gy, np.ones_like(h)), axis=-1); n /= np.linalg.norm(n, axis=-1)[..., None]
        self.save((n * .5 + .5) * 255, op['salida'])

    def op_collar(self, op, rng):
        """Collar impreso del cuello de una botella: texto e insignia interpretados. / Interpreted neck band."""
        band = Image.new('RGB', (1024, 256), tuple(op['fondo'])); d = ImageDraw.Draw(band); ink = tuple(op['tinta']); cx = 512
        d.ellipse((cx - 30, 30, cx + 30, 90), fill=tuple(op['insignia']), outline=ink, width=3)
        d.line((cx - 24, 59, cx - 12, 79, cx, 51, cx + 12, 79, cx + 24, 59), fill=ink, width=3)
        for t in op['textos']: d.text((cx, t['y']), t['texto'], font=tipo(t.get('tipo', 'arial-negrita'), t['tam']), fill=ink, anchor='mm')
        if 'franja' in op:
            d.rectangle((0, 205, 1024, 256), fill=tuple(op['franja']['color'])); d.text((cx, 232), op['franja']['texto'], font=tipo('arial-negrita', 23), fill=tuple(op['franja']['tinta']), anchor='mm')
        self.save(band, op['salida'])

if __name__ == '__main__':
    args = sys.argv[1:]; opt = lambda k: args[args.index(k) + 1] if k in args else None
    t = Taller(args[0], opt('--fotos'), opt('--salida')); print('texturas', t.receta['encargo'], t.run())
