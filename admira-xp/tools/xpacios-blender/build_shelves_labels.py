"""Deterministic original label artwork for shelf 02 Best (Python 3 + Pillow).

Fonts are rasterised from an installed font, never copied into the asset.
The package graphics and quantities are illustrative model artwork, not stock.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def font_path(name):
    candidates = {
        'regular': ['/System/Library/Fonts/Supplemental/Arial.ttf',
                    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'],
        'bold': ['/System/Library/Fonts/Supplemental/Arial Bold.ttf',
                 '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'],
    }
    for candidate in candidates[name]:
        if Path(candidate).exists():
            return Path(candidate)
    raise RuntimeError('Install Arial or DejaVu Sans, or pass explicit font paths')


def build(output, regular, bold):
    width, height = 4096, 3072
    atlas = Image.new('RGBA', (width, height), '#F4F0E4')
    palette = ['#16463D', '#43654B', '#6B3D2D', '#4C5D64', '#7C571E', '#354C55']
    designs = [
        ('CAFÉ', 'TUESTE NATURAL', 'AROMA REDONDO', '250 g'),
        ('TÉ VERDE', 'HOJAS SELECCIONADAS', 'INFUSIÓN SUAVE', '125 g'),
        ('CACAO', 'CACAO INTENSO', 'MEZCLA ORIGINAL', '250 g'),
        ('GRANOLA', 'AVENA Y FRUTOS', 'CRUJIENTE NATURAL', '300 g'),
        ('MIEL', 'SELECCIÓN FLORAL', 'ORIGEN NATURAL', '250 g'),
        ('TÉ NEGRO', 'HOJAS DE ALTURA', 'INFUSIÓN INTENSA', '125 g'),
    ]
    regions = {}

    def font(size, weight='regular'):
        return ImageFont.truetype(str(bold if weight == 'bold' else regular), size)

    def centered(draw, text, x, y, size, fill, weight='regular', max_width=None):
        typeface = font(size, weight)
        while max_width and draw.textlength(text, font=typeface) > max_width:
            size -= 1
            typeface = font(size, weight)
        draw.text((x, y), text, font=typeface, fill=fill, anchor='mm')

    def label(kind, index, bounds):
        x, y, w, h = bounds
        artwork = Image.new('RGBA', (w, h), '#F4F0E4')
        draw = ImageDraw.Draw(artwork)
        ink, title, descriptor, detail, mass = palette[index], *designs[index]
        draw.rounded_rectangle((8, 8, w-9, h-9), radius=24, outline=ink, width=6)
        draw.rounded_rectangle((21, 21, w-22, h-22), radius=15,
                               outline='#B09356', width=2)
        draw.line((48, 135, w-48, 135), fill='#B09356', width=4)
        centered(draw, 'ADMIRA', w/2, 75, 72, ink, 'bold')
        centered(draw, 'SELECCIÓN 02', w/2, 171, 30, ink, 'bold')
        # Original botanical seal: curved leaf polygons and a precise gold stem.
        cy, radius = h*.34+10, h*.078
        draw.ellipse((w/2-radius-12, cy-radius-12,
                      w/2+radius+12, cy+radius+12), outline='#B09356', width=3)
        for angle, offset in [(-.64, -16), (.64, 16)]:
            points = []
            for t in range(33):
                a = t/32*2*math.pi
                lx, ly = 30*math.cos(a), radius*.78*math.sin(a)
                points.append((w/2+offset+lx*math.cos(angle)-ly*math.sin(angle),
                               cy+lx*math.sin(angle)+ly*math.cos(angle)))
            draw.polygon(points, fill=ink)
        draw.line((w/2+2, cy-radius*.68, w/2-2, cy+radius*.75),
                  fill='#B09356', width=5)
        centered(draw, title, w/2, h*.53, 119, ink, 'bold', w-68)
        centered(draw, descriptor, w/2, h*.66, 35, ink, 'bold', w-66)
        centered(draw, detail, w/2, h*.73, 32, ink, max_width=w-72)
        draw.line((65, h*.80, w-65, h*.80), fill='#B09356', width=3)
        displayed_mass = '250 ml' if kind == 'bottle' else mass
        centered(draw, displayed_mass, w/2, h*.865, 53, ink, 'bold')
        centered(draw, 'A02-%02d · SERIE MODELO' % (index+1),
                 w/2, h*.94, 27, ink, max_width=w-60)
        atlas.paste(artwork, (x, y))
        regions['%s-%d' % (kind, index)] = {
            'pixels': list(bounds), 'title': title, 'reference': 'A02-%02d' % (index+1),
            'role': 'product', 'format': kind,
        }

    # Each package shape gets its own aspect ratio: no squashed square artwork.
    for kind, y, h in [('carton', 32, 896), ('pouch', 960, 864),
                        ('bottle', 1856, 792)]:
        for index in range(6):
            label(kind, index, (32+index*672, y, 640, h))
    for index, (title, _, _, mass) in enumerate(designs):
        x, y, w, h = 32+index*672, 2680, 640, 174
        artwork = Image.new('RGBA', (w, h), '#F8F5EC')
        draw = ImageDraw.Draw(artwork)
        ink = palette[index]
        draw.rounded_rectangle((4, 4, w-5, h-5), radius=10, outline=ink, width=4)
        draw.rectangle((18, 20, 30, h-21), fill='#B09356')
        draw.text((52, 52), title, font=font(60, 'bold'), fill=ink, anchor='lm')
        draw.text((54, 125), 'A02-%02d' % (index+1),
                  font=font(37, 'bold'), fill=ink, anchor='lm')
        draw.text((w-26, 125), 'SERIE 02', font=font(31), fill=ink, anchor='rm')
        atlas.paste(artwork, (x, y))
        regions['card-%d' % index] = {
            'pixels': [x, y, w, h], 'title': title, 'reference': 'A02-%02d' % (index+1),
            'role': 'rail', 'format': 'card',
        }
    output.mkdir(parents=True, exist_ok=True)
    atlas.save(output/'selection-label-atlas.png', optimize=True)
    layout = {
        'schema_version': 1, 'size': [width, height], 'revision': 'shelves-labels-20261002-2',
        'artwork_status': 'original_illustrative_model_labels_not_stock',
        'fonts': [{'name': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}
                  for path in [regular, bold]],
        'regions': regions,
    }
    (output/'selection-label-atlas.layout.json').write_text(
        json.dumps(layout, ensure_ascii=False, indent=2)+'\n')
    return layout


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True)
    parser.add_argument('--regular-font', type=Path)
    parser.add_argument('--bold-font', type=Path)
    args = parser.parse_args()
    layout = build(Path(args.output), args.regular_font or font_path('regular'),
                   args.bold_font or font_path('bold'))
    print(json.dumps({'size': layout['size'], 'regions': len(layout['regions'])}))
