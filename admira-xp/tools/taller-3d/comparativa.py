"""Taller 3D · hoja de comparación foto | 3D de cada pieza de una receta / photo | 3D sheet per piece.

Cada pieza con `comparar` pone su foto (de la carpeta de fotos originales o del repo) junto al render de
revisión (`preview.png`). La hoja se deja fuera del repo: puede mostrar personas.
python3 comparativa.py RECETA --hoja CARPETA [--fotos CARPETA] [--catalogo CARPETA] [--piezas 53,54]
"""
import sys, json, pathlib
from PIL import Image, ImageDraw, ImageFont

args = sys.argv[1:]; opt = lambda k: args[args.index(k) + 1] if k in args else None
receta_path = pathlib.Path(args[0]).resolve(); receta = json.loads(receta_path.read_text())
repo = receta_path
while not (repo / '.git').exists() and repo.parent != repo: repo = repo.parent
catalogo = pathlib.Path(opt('--catalogo')) if opt('--catalogo') else repo / 'inventario/assets/catalog'
fotos = pathlib.Path(opt('--fotos')) if opt('--fotos') else None; solo = {int(n) for n in (opt('--piezas') or '').split(',') if n}
H = 900; fuente = ImageFont.truetype('/System/Library/Fonts/Avenir Next.ttc', 30, index=5)
def fit(im): return im.convert('RGB').resize((int(im.width * H / im.height), H), Image.LANCZOS)
columnas = []
for p in receta['piezas']:
    c = p.get('comparar')
    if not c or (solo and p['numero'] not in solo): continue
    path = repo / c['foto_repo'] if 'foto_repo' in c else (fotos / c['foto'] if fotos else None)
    if not path or not path.exists(): print('sin foto para', p['numero']); continue
    foto = Image.open(path)
    if 'recorte' in c: foto = foto.crop(tuple(c['recorte']))
    render = Image.open(catalogo / str(p['numero']) / 'preview.png'); w, h = render.size
    render = render.crop((int(w * .12), int(h * .03), int(w * .9), int(h * .97)))
    a, b = fit(foto), fit(render); col = Image.new('RGB', (a.width + b.width + 12, H + 60), 'white'); d = ImageDraw.Draw(col)
    d.text((8, 12), '%d · %s' % (p['numero'], p['nombre']), font=fuente, fill=(20, 60, 50)); col.paste(a, (0, 60)); col.paste(b, (a.width + 12, 60)); columnas.append(col)
if columnas:
    W = sum(c.width for c in columnas) + 40 * (len(columnas) - 1); hoja = Image.new('RGB', (W, H + 60), 'white'); x = 0
    for c in columnas: hoja.paste(c, (x, 0)); x += c.width + 40
    out = pathlib.Path(opt('--hoja') or '.').resolve() / ('comparativa-%s.jpg' % receta['encargo'])
    if repo in out.parents and not receta['fotos'].get('publicables'): sys.exit('La hoja muestra fotos no publicables: déjala fuera del repo (--hoja).')
    hoja.save(out, quality=88); print('hoja', out)
