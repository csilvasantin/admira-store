"""Levanta el Xpacio Star Wars desde la nube COLMAP.

No hay vídeo de la tienda de zapatillas de Santa Rosa 19. El eje X se espeja
para que el arranque de la trayectoria caiga en la fachada donde Xtanco pone
la puerta. La altura libre de 2,70 m es un clavo de trabajo, no una cinta.
"""
import json
import struct
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
SCENE = ROOT / 'scan/scenes/xpacio-starwars-hd'
OUT = ROOT / 'scan/levantado'
CATALOG = ROOT / 'admira-xp/assets/matrix-furniture/catalog'
FLOOR_Y = -1.16
CEIL_Y = 1.188
CLEAR_M = 2.70
METERS_PER_UNIT = CLEAR_M / (CEIL_Y - FLOOR_Y)
METERS_PER_CELL = 0.5
XTANCO = {
    9: 'plant',
    1: 'counter',
    43: 'custom',
    13: 'tft',
    2: 'shelves',
}


def load_points():
    raw = SCENE.joinpath('points.ply').read_bytes()
    start = raw.find(b'end_header\n') + len(b'end_header\n')
    data = raw[start:]
    n = 58408
    pts = []
    for i in range(n):
        x, y, z = struct.unpack_from('<fff', data, i * 15)
        r, g, b = data[i * 15 + 12:i * 15 + 15]
        pts.append((x, y, z, r, g, b))
    return pts


def item(number, tipo, nombre, col, row, rot, huella, papel, pantalla=None):
    nn = f'{number:02d}'
    return {
        'identificador': f'starwars-{tipo}-{col}-{row}',
        'numero': number,
        'tipo': tipo,
        'nombre': nombre,
        'ubicacion': {
            'xpacio': 'xpacio-starwars',
            'zona': 'sala',
            'casilla': [col, row],
            'orientacion': rot,
        },
        'huella': huella,
        'aspecto': {
            '8': f'/mobiliario/skins/8/{nn}-r0.png',
            '16': f'/mobiliario/skins/16/{nn}-r0.png',
            '32': f'/admira-xp/assets/matrix-furniture/catalog/{nn}-r0.png',
            '64': f'/mobiliario/skins/64/{nn}-r0.png',
        },
        'estado': 'en_marcha',
        'mantenimiento': {
            'ultima': '2026-09-25',
            'proxima': '2026-12-25',
            'responsable': 'SmithMacMini',
        },
        'incidencias': [],
        'conexion': f'xpacio:starwars:{tipo}',
        'papel': papel,
        'pantalla': pantalla,
        'compra': {
            'ejemplo': True,
            'fecha': '2026-03-01',
            'proveedor': 'Ejemplo Suministros',
            'factura': 'PED-EJEMPLO-100',
            'serie': f'SER-EJEMPLO-{number}',
            'fin': '2027-09-25',
        },
        'garantia': 'en_garantia',
        'reparable': True,
        'xtancoType': XTANCO[number],
    }


def sprite(number, size):
    image = Image.open(CATALOG / f'{number:02d}-r0.png').convert('RGBA')
    image.thumbnail((size, size))
    return image


def main():
    pts = load_points()
    mid = [(x, z, r, g, b) for x, y, z, r, g, b in pts if FLOOR_Y + 0.25 < y < CEIL_Y - 0.25]
    xs = sorted(p[0] for p in mid)
    zs = sorted(p[1] for p in mid)

    def pct(arr, q):
        return arr[int(q * (len(arr) - 1))]

    x0, x1 = pct(xs, 0.05), pct(xs, 0.95)
    z0, z1 = pct(zs, 0.05), pct(zs, 0.95)

    def mirror(x):
        return x0 + x1 - x

    mid = [(mirror(x), z, r, g, b) for x, z, r, g, b in mid]
    width_m = (x1 - x0) * METERS_PER_UNIT
    depth_m = (z1 - z0) * METERS_PER_UNIT
    cols = max(4, round(width_m / METERS_PER_CELL))
    rows = max(4, round(depth_m / METERS_PER_CELL))
    width_m = round(cols * METERS_PER_CELL, 2)
    depth_m = round(rows * METERS_PER_CELL, 2)

    def cell(x, z):
        c = int((x - x0) * METERS_PER_UNIT / METERS_PER_CELL)
        r = int((z - z0) * METERS_PER_UNIT / METERS_PER_CELL)
        return max(0, min(cols - 1, c)), max(0, min(rows - 1, r))

    def inside(col, row, fw, fd):
        return max(1, min(cols - fw - 1, col)), max(1, min(rows - fd - 1, row))

    door = {
        'wall': 'este',
        'fromCell': 2,
        'toCell': 4,
        'note': 'La trayectoria arranca en el oeste de COLMAP. Se espeja X para que ese arranque coincida con la puerta de la fachada de Xtanco.',
    }
    plant_c, plant_r = inside(cols - 4, 5, 1, 1)
    counter_c, counter_r = inside(cols // 2, rows // 2, 1, 2)
    chair_c, chair_r = inside(counter_c + 2, counter_r, 1, 1)
    shelf_c, shelf_r = inside(2, 2, 1, 2)
    furniture = [
        item(9, 'planta', 'Planta', plant_c, plant_r, 0, [1, 1], 'Testigo junto a la entrada. Es la planta 9.'),
        item(1, 'mostrador', 'Mostrador', counter_c, counter_r, 0, [1, 2], 'Atiende. Mismo número que la barra de Alsea.'),
        item(43, 'silla', 'Silla', chair_c, chair_r, 1, [1, 1], 'Asiento. Es la silla 43.'),
        item(13, 'pantalla', 'Pantalla', cols // 2, 0, 0, [1, 1], 'Pantalla de la sala.', {'campana': 'Ejemplo', 'circuito': 'Star Wars'}),
        item(2, 'expositor', 'Estantería', shelf_c, shelf_r, 0, [1, 2], 'Expositor contra el fondo. Es la estantería 2.'),
    ]
    doc = {
        'schema': 'xpaceos.xpacio.v1',
        'id': 'xpacio-starwars',
        'source': {
            'scene': 'scan/scenes/xpacio-starwars-hd',
            'points': 58408,
            'cameras': 301,
            'video': None,
            'note': 'No hay vídeo de la tienda de zapatillas de Santa Rosa 19. Este levantamiento usa el Xpacio Star Wars ya escaneado.',
        },
        'calibration': {
            'verticalAxis': 'y',
            'floorY': FLOOR_Y,
            'ceilingY': CEIL_Y,
            'assumedClearHeightM': CLEAR_M,
            'metersPerUnit': round(METERS_PER_UNIT, 4),
            'metersPerCell': METERS_PER_CELL,
            'mirrorX': True,
            'formula': 'metros = (techo - suelo en unidades COLMAP) llevados a 2,70 m de altura libre; 1 casilla = 0,50 m; el eje X se espeja para alinear la puerta',
        },
        'plan': {
            'widthM': width_m,
            'depthM': depth_m,
            'cols': cols,
            'rows': rows,
            'floor': True,
            'walls': ['norte', 'sur', 'este', 'oeste'],
            'doors': [door],
        },
        'xtanco': {
            'cols': cols,
            'rows': rows,
            'wallHeight': CLEAR_M,
            'doorOpen': 0.85,
            'elevation': 0.46,
            'layout': [
                {
                    'id': piece['identificador'],
                    'type': piece['xtancoType'],
                    'number': piece['numero'],
                    'col': piece['ubicacion']['casilla'][0],
                    'row': piece['ubicacion']['casilla'][1],
                    'rot': piece['ubicacion']['orientacion'],
                    'fp': piece['huella'],
                    'label': str(piece['numero']),
                }
                for piece in furniture
            ],
        },
        'furniture': furniture,
        'planInput': {
            'accepts': ['image/*', 'application/pdf'],
            'applied': False,
            'href': '/scan/planos/',
        },
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'xpacio.json').write_text(json.dumps(doc, ensure_ascii=False, indent=2) + '\n')
    draw_all(doc, mid, x0, x1, z0, z1, mirror)
    print('cols', cols, 'rows', rows, 'm', width_m, depth_m)
    print('cells', [(f['numero'], f['ubicacion']['casilla']) for f in furniture])


def draw_all(doc, mid, x0, x1, z0, z1, mirror):
    cols, rows = doc['plan']['cols'], doc['plan']['rows']
    img = Image.new('RGB', (800, 520), (8, 12, 16))
    dr = ImageDraw.Draw(img)

    def proj(x, z):
        px = int((x - x0) / max(1e-6, x1 - x0) * 760 + 20)
        py = int((z - z0) / max(1e-6, z1 - z0) * 460 + 30)
        return px, py

    for x, z, r, g, b in mid[::3]:
        dr.point(proj(x, z), fill=(r, g, b))
    dr.text((16, 8), 'Nube COLMAP · 58.408 puntos · vista cenital', fill=(230, 236, 242))
    img.save(OUT / '02-nube.png')

    tray = json.loads((SCENE / 'tray.json').read_text())
    img2 = img.copy()
    dr = ImageDraw.Draw(img2)
    path = [proj(mirror(t['p'][0]), t['p'][2]) for t in tray]
    if len(path) > 1:
        dr.line(path, fill=(80, 220, 255), width=2)
    dr.ellipse((path[0][0] - 5, path[0][1] - 5, path[0][0] + 5, path[0][1] + 5), fill=(255, 220, 120))
    dr.text((16, 28), '301 cámaras. No hay mp4 de Santa Rosa 19. El punto claro es el arranque.', fill=(255, 220, 120))
    img2.save(OUT / '01-recorrido.png')

    scale = 22
    margin = 48
    width, height = cols * scale + margin * 2, rows * scale + margin * 2
    plan = Image.new('RGB', (width, height), (12, 16, 22))
    d = ImageDraw.Draw(plan)
    left, top = margin, margin
    d.rectangle((left, top, left + cols * scale, top + rows * scale), fill=(34, 42, 36), outline=(180, 190, 180), width=4)
    door_top = top + 2 * scale
    door_bot = top + 4 * scale
    d.rectangle((left + cols * scale - 4, door_top, left + cols * scale + 6, door_bot), fill=(12, 16, 22))
    d.text((left, 12), f"Plano {doc['plan']['widthM']} m × {doc['plan']['depthM']} m · casilla {METERS_PER_CELL} m", fill=(230, 236, 242))
    d.text((left, height - 28), 'Puerta en la fachada este, alineada con el arranque de la trayectoria.', fill=(255, 220, 120))
    for piece in doc['furniture']:
        c, r = piece['ubicacion']['casilla']
        fw, fd = piece['huella']
        d.rectangle((left + c * scale, top + r * scale, left + (c + fw) * scale, top + (r + fd) * scale), outline=(120, 220, 160), width=2)
        d.text((left + 4 + c * scale, top + 4 + r * scale), str(piece['numero']), fill=(230, 236, 242))
    plan.save(OUT / '03-plano.png')

    iso = Image.new('RGB', (1100, 720), (8, 12, 18))
    di = ImageDraw.Draw(iso)

    def iso_pt(c, r, h=0):
        return (120 + (c - r) * 14 + 360, 90 + (c + r) * 7 - h)

    floor_poly = [iso_pt(0, 0), iso_pt(cols, 0), iso_pt(cols, rows), iso_pt(0, rows)]
    di.polygon(floor_poly, fill=(40, 48, 40), outline=(190, 200, 180))
    wall_h = 36
    di.polygon([iso_pt(0, 0), iso_pt(cols, 0), iso_pt(cols, 0, wall_h), iso_pt(0, 0, wall_h)], fill=(28, 36, 48))
    di.polygon([iso_pt(cols, 0), iso_pt(cols, rows), iso_pt(cols, rows, wall_h), iso_pt(cols, 0, wall_h)], fill=(22, 30, 40))
    for piece in doc['furniture']:
        c, r = piece['ubicacion']['casilla']
        icon = sprite(piece['numero'], 72)
        anchor = iso_pt(c + 0.5, r + 0.5, 8)
        iso.paste(icon, (int(anchor[0] - icon.width / 2), int(anchor[1] - icon.height)), icon)
    di.text((16, 12), f"Isométrico · {doc['plan']['widthM']} × {doc['plan']['depthM']} m · muebles del registro", fill=(230, 236, 242))
    iso.save(OUT / '04-isometrico.png')

    view = Image.new('RGB', (1100, 720), (6, 10, 16))
    dv = ImageDraw.Draw(view)
    dv.polygon([(80, 560), (980, 500), (900, 140), (160, 180)], outline=(80, 90, 80))
    dv.text((24, 16), '3D · misma rejilla que Xtanco · altura libre 2,70 m · muebles del registro', fill=(230, 236, 242))
    for piece in doc['furniture']:
        c, r = piece['ubicacion']['casilla']
        icon = sprite(piece['numero'], 120)
        x = 120 + int(c / max(1, cols - 1) * 680)
        y = 250 + int(r / max(1, rows - 1) * 220)
        view.paste(icon, (x, max(40, y - icon.height)), icon)
    view.save(OUT / '05-tresd.png')


if __name__ == '__main__':
    main()
