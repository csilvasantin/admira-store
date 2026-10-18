"""PG103 · recortes enderezados de las fotos de Carlos del 17-10-2026 (cestas del Starbucks de Paseo de Gràcia).
Rectified crops from Carlos's 17-10-2026 photos of the Paseo de Gràcia Starbucks baskets.

Las fotos originales no se publican: muestran a clientes. Este script solo guarda recortes
de objetos (bolsa, carteles, vaso) en cestas-fuentes/, y de ahí salen las texturas.
The original photos are not published (they show customers); only object crops are kept.

python3 cestas_recortes.py CARPETA_FOTOS SALIDA   (Pillow + NumPy)
"""
import sys, pathlib, numpy as np
from PIL import Image

src = pathlib.Path(sys.argv[1]); out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)

def homography(dst, srcq):
    """3x3 H mapping output pixel (u,v) to photo pixel (x,y)."""
    a = []
    for (u, v), (x, y) in zip(dst, srcq):
        a.append([u, v, 1, 0, 0, 0, -x * u, -x * v, -x])
        a.append([0, 0, 0, u, v, 1, -y * u, -y * v, -y])
    _, _, vt = np.linalg.svd(np.array(a, float))
    return vt[-1].reshape(3, 3)

def bilinear(img, x, y):
    h, w = img.shape[:2]
    x = np.clip(x, 0, w - 1.001); y = np.clip(y, 0, h - 1.001)
    x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int); fx = (x - x0)[..., None]; fy = (y - y0)[..., None]
    a = img[y0, x0]; b = img[y0, x0 + 1]; c = img[y0 + 1, x0]; d = img[y0 + 1, x0 + 1]
    return a * (1 - fx) * (1 - fy) + b * fx * (1 - fy) + c * (1 - fx) * fy + d * fx * fy

def photo(name):
    return np.asarray(Image.open(src / name).convert('RGB'), float)

def warp(name, quad, size):
    """quad: TL, TR, BR, BL photo corners; size: (w, h) of the rectified crop."""
    w, h = size; img = photo(name)
    H = homography([(0, 0), (w, 0), (w, h), (0, h)], quad)
    u, v = np.meshgrid(np.arange(w) + .5, np.arange(h) + .5)
    p = np.stack([u, v, np.ones_like(u)], -1) @ H.T
    return bilinear(img, p[..., 0] / p[..., 2], p[..., 1] / p[..., 2])

def save(a, name):
    Image.fromarray(np.uint8(np.clip(a, 0, 255))).save(out / name, optimize=True)

# Bolsa Starbucks 1971 Dark Roast 250 g: cara, dos laterales y trasera. / Bag faces.
save(warp('05-bolsa-1971-frontal.jpg', [(266, 250), (612, 250), (676, 1006), (214, 1000)], (540, 1024)), 'bolsa-1971-frontal.png')
save(warp('04-bolsa-1971-lateral-preparacion.jpg', [(298, 385), (518, 378), (625, 1210), (296, 1215)], (300, 1024)), 'bolsa-1971-lateral-a.png')
save(warp('06-bolsa-1971-lateral-historia.jpg', [(362, 160), (650, 155), (700, 1110), (338, 1110)], (300, 1024)), 'bolsa-1971-lateral-b.png')
save(warp('07-bolsa-1971-trasera.jpg', [(205, 218), (640, 205), (800, 1135), (203, 1135)], (540, 1024)), 'bolsa-1971-trasera.png')

# Carteles / signs.
save(warp('03-cesta-cafe-1971.jpg', [(352, 58), (556, 70), (549, 530), (366, 535)], (440, 1024)), 'cartel-1971.png')
save(warp('01-cesta-vasos-be-green.jpg', [(178, 99), (500, 8), (489, 600), (298, 653)], (440, 1024)), 'cartel-be-green.png')

# Vaso reutilizable: se desenrolla el cilindro alrededor de la sirena (el pulgar solo roza su borde).
# Reusable cup: unwrap the cylinder around the siren (the thumb only touches its rim).
img = photo('02-vaso-reutilizable.jpg'); cx, r, cy = 479.0, 166.0, 679.0
s0, half = -42.0, 150  # centro del logo medido en arco y semilado / logo centre along the arc, half size
s, y = np.meshgrid(np.arange(-half, half) + .5 + s0, np.arange(-half, half) + .5 + cy)
save(bilinear(img, cx + r * np.sin(s / r), y), 'vaso-sirena.png')
print('recortes', sorted(p.name for p in out.glob('*.png')))
