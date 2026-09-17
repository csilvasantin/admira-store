"""Validate the 43 Matrix catalog items and their 172 transparent PNG views.

Run with ordinary Python 3; only standard-library modules are needed:
  python3 admira-xp/tools/xpacios-blender/check_matrix_catalog.py

The repository root is resolved from this script, independent of the working
directory. --root and --catalog allow checking another checkout/render output.
Reads all files; never changes the catalog, its manifest or Blender sources.
"""
from pathlib import Path
import argparse
import hashlib, json, math, struct, zlib

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[3])
parser.add_argument('--catalog', type=Path)
args = parser.parse_args()
root = args.root.resolve()
directory = (args.catalog or root / 'admira-xp/assets/matrix-furniture/catalog').resolve()
manifest = json.loads((directory / 'manifest.json').read_text())
assert [item['number'] for item in manifest['items']] == list(range(1, 44))
registry = json.loads((root / 'inventario/registry.json').read_text())['numbers']

def alpha_values(path):
    data = path.read_bytes()
    assert data[:8] == b'\x89PNG\r\n\x1a\n'
    offset = 8
    compressed = b''
    while offset < len(data):
        count = struct.unpack('>I', data[offset:offset + 4])[0]
        kind = data[offset + 4:offset + 8]
        chunk = data[offset + 8:offset + 8 + count]
        offset += 12 + count
        if kind == b'IHDR':
            width, height, bits, color, compression, filtering, interlace = struct.unpack('>IIBBBBB', chunk)
        elif kind == b'IDAT':
            compressed += chunk
    assert (width, height, bits, color, interlace) == (384, 384, 8, 6, 0)
    raw = zlib.decompress(compressed)
    prior = [0] * width
    edge_opaque = opaque = transparent = 0
    for row in range(height):
        offset = row * (width * 4 + 1)
        mode = raw[offset]
        encoded = raw[offset + 4:offset + 1 + width * 4:4]
        current = []
        for column, byte in enumerate(encoded):
            left = current[column - 1] if column else 0
            up = prior[column]
            diagonal = prior[column - 1] if column else 0
            if mode == 0: value = byte
            elif mode == 1: value = (byte + left) & 255
            elif mode == 2: value = (byte + up) & 255
            elif mode == 3: value = (byte + ((left + up) // 2)) & 255
            elif mode == 4:
                p = left + up - diagonal
                pa, pb, pc = abs(p - left), abs(p - up), abs(p - diagonal)
                prediction = left if pa <= pb and pa <= pc else up if pb <= pc else diagonal
                value = (byte + prediction) & 255
            else: raise AssertionError(mode)
            current.append(value)
            opaque += value == 255
            transparent += value == 0
            if row in (0, height - 1) or column in (0, width - 1): edge_opaque += value > 0
        prior = current
    assert opaque > 100 and transparent > 100, (path, opaque, transparent)
    assert edge_opaque == 0, (path, edge_opaque)
    return {'opaque': opaque, 'transparent': transparent}

count = size = 0
for item in manifest['items']:
    assert registry[item['inventoryId']] == item['number']
    assert item['name']
    source = root / item['source']
    assert hashlib.sha256(source.read_bytes()).hexdigest() == item['sourceSha256'], source
    assert [view['rotation'] for view in item['views']] == [0, 1, 2, 3]
    for view in item['views']:
        assert all(math.isfinite(n) for n in view['anchor'])
        assert view['pixelsPerGridUnit'] > 0
        path = directory / Path(view['url']).name
        assert hashlib.sha256(path.read_bytes()).hexdigest() == view['sha256'], path
        alpha_values(path)
        count += 1
        size += path.stat().st_size
print(json.dumps({'items': len(manifest['items']), 'views': count, 'total_bytes': size,
                  'source_hashes_unchanged': True, 'real_alpha': True,
                  'objects_inside_image_bounds': True, 'registry_numbers_match': True}, indent=2))

