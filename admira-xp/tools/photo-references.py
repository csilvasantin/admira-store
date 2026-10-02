#!/usr/bin/env python3
"""Extract Starbucks photographic references without generated or retouched content.

Run from the Yokup workspace. Pillow is the only external dependency.
The original Matrix panorama and analysis crops are retained under output/.
"""
import json
from pathlib import Path

from PIL import Image

WORKSPACE = Path(__file__).resolve().parents[3]
DEST = WORKSPACE / 'xpaceos-inventari/inventario/starbucks'
ANALYSIS = WORKSPACE / 'output/starbucks-elements-analysis-20261001'
PANORAMA = WORKSPACE / 'output/starbucks-twin/reference.webp'
SOURCE_URL = 'https://panorama-viewer-d8j.pages.dev/img/starbucks-demo.webp'

# Coordinates refer to the named unaltered analysis crop, or the original panorama.
# The only operations are rectangular extraction, proportional reduction and WebP encoding.
PHOTOS = {
    'sb-backbar': ('service-coffee-wrap.png', (1490, 385, 2580, 635)),
    'sb-pos': ('panorama', (6320, 2140, 7480, 3100)),
    'sb-pastry': ('panorama', (7370, 2090, 8192, 3230)),
    'sb-mugs': ('merch-overview.png', None),
    'sb-table-a': ('panorama', (2640, 2200, 3020, 2690)),
    'sb-table-b': ('panorama', (2640, 2200, 3020, 2690)),
    'sb-chair-1': ('panorama', (2630, 2210, 2970, 2660)),
    'sb-chair-2': ('panorama', (2630, 2210, 2970, 2660)),
    'sb-chair-3': ('panorama', (2630, 2210, 2970, 2660)),
    'sb-chair-4': ('panorama', (2630, 2210, 2970, 2660)),
    'sb-water-rack': ('panorama', (1100, 2320, 1620, 3110)),
    'N01': ('baskets.png', (15, 540, 780, 1140)),
    'N02': ('baskets.png', (395, 275, 860, 785)),
    'N03': ('baskets.png', (155, 215, 430, 635)),
    'N04': ('entrance-planter-banquette-detail.png', (265, 155, 645, 375)),
    'N05': ('entrance-planter-banquette-detail.png', (125, 115, 305, 325)),
    'N06': ('auxiliary-cabinet.png', (70, 115, 350, 530)),
    'N07': ('service-oven-detail.png', (145, 5, 390, 260)),
    'N08': ('service-checkout-accessories.png', (85, 0, 355, 205)),
    'N09': ('service-preparation.png', (510, 145, 575, 260)),
    'N10': ('service-counter-left-detail.png', (0, 230, 275, 385)),
    'N11': ('service-preparation.png', (740, 175, 815, 315)),
    'N12': ('service-oven-detail.png', (350, 0, 520, 265)),
    'N13': ('service-checkout-accessories.png', (490, 270, 870, 450)),
    'N14': ('service-checkout-accessories.png', (145, 105, 320, 290)),
    'N15': ('service-checkout-accessories.png', (240, 115, 415, 295)),
    'N16': ('service-checkout-accessories.png', (395, 50, 520, 240)),
    'N17': ('service-accessories-right.png', (185, 15, 550, 265)),
    'N18': ('service-accessories-right.png', (325, 10, 430, 260)),
    'N19': ('service-brewing-detail.png', (40, 65, 230, 245)),
    'N20': ('service-machine-detail.png', (40, 10, 330, 245)),
    'N21': ('service-machine-detail.png', (60, 5, 240, 125)),
    'N22': ('entrance-wall-floor-seating.png', (205, 300, 555, 890)),
    'N23': ('entrance-wet-floor-sign.png', None),
    'N24': ('entrance-fire-extinguisher-upper.png', (110, 115, 215, 260)),
    'N25': ('entrance-wall-floor-seating.png', (505, 135, 670, 420)),
    'N26': ('entrance-door-safety.png', (215, 145, 545, 655)),
    'N27': ('self-service.png', (680, 175, 950, 750)),
    'N28': ('self-service.png', (125, 160, 415, 775)),
    'P01': ('merch-upper.png', (620, 385, 835, 695)),
    'P02': ('merch-upper.png', (325, 435, 640, 690)),
    'P03': ('merch-orange-mugs.png', None),
    'P04': ('merch-middle.png', (410, 65, 540, 360)),
    'P05': ('merch-middle.png', (510, 85, 655, 355)),
    'P06': ('merch-middle.png', (595, 145, 730, 365)),
    'P07': ('merch-middle.png', (1460, 100, 1650, 360)),
    'P08': ('merch-middle.png', (1280, 140, 1480, 380)),
    'P09': ('merch-white-mugs.png', (85, 5, 280, 210)),
    'P10': ('merch-lower.png', (270, 55, 485, 240)),
    'P11': ('merch-lower.png', (520, 50, 625, 320)),
    'P12': ('merch-lower.png', (620, 100, 735, 325)),
    'P13': ('merch-lower.png', (920, 70, 1080, 345)),
    'P14': ('merch-lower.png', (1130, 120, 1260, 355)),
    'P15': ('merch-lower.png', (1250, 55, 1425, 345)),
    'P16': ('merch-white-textured-mugs.png', (100, 70, 245, 260)),
    'P17': ('merch-white-textured-mugs.png', (480, 40, 650, 235)),
    'P18': ('merch-lower.png', (715, 110, 835, 320)),
    'P19': ('baskets.png', (100, 610, 690, 925)),
    'P20': ('merch-upper.png', (95, 130, 825, 385)),
    'P21': ('baskets.png', (430, 300, 830, 520)),
}

EN_NAMES = [
    'Low basket of reusable cups', 'Tall basket of bagged products', 'BE GREEN sign',
    'Upholstered banquette', 'Plant and rectangular planter', 'Side cabinet with white countertop',
    'Countertop oven', 'Angled cup dispensers', 'Wall-mounted paper dispenser',
    'Consumables organizer', 'Pump bottles', 'Lidded food containers',
    'Countertop baskets beside the POS', 'Tiered packet organizer', 'Holder of wrapped sticks',
    'Small plush toy', 'Countertop promotional signs', 'Cylindrical packet display',
    'Tall metal equipment', 'Black preparation equipment', 'Translucent handled pitchers',
    'Accessible platform and ramp', 'Yellow caution floor sign', 'Fire extinguishers',
    'Framed prints', 'Glazed door and window', 'Porthole service door', 'Door with accessibility symbol',
    'Tall pink transparent container', 'Illustrated souvenir mug', 'Orange pumpkin-style mug',
    'Faceted green tumbler with straw', 'Ribbed green container', 'Smooth green container with flip lid',
    'Green container with gold rim', 'Green scaled mug', 'Classic white siren mug', 'Small white mug',
    'Black cup with green band', 'Black cup with green lid', 'Transparent tumbler with straw',
    'Black-and-white speckled tumbler', 'Plain black mug', 'Rounded white mug with grey lines',
    'Textured white mug with angular handle', 'Open white-and-green wave-pattern cup',
    'White/translucent reusable cup with white lid', 'Coffee packets on display',
    'Bagged products in the tall basket',
]
UNIT_EN = [
    'Starbucks preparation counter', 'Starbucks checkout counter', 'Starbucks display case',
    'Starbucks mugs and coffee shelving', 'Starbucks round table 1', 'Starbucks round table 2',
    'Starbucks chair 1', 'Starbucks chair 2', 'Starbucks chair 3', 'Starbucks chair 4',
    'Starbucks Solán de Cabras water rack',
]
CONTEXT = {'sb-backbar', 'N04', 'N09', 'N20', 'N22'}
TYPE = {'sb-table-a', 'sb-table-b', 'sb-chair-1', 'sb-chair-2', 'sb-chair-3', 'sb-chair-4', 'N24'}
TYPE_ES = 'Foto compartida de la tipología visible; no identifica esta unidad concreta ni prueba su posición.'
TYPE_EN = 'Shared photo of the visible type; it does not identify this particular unit or prove its position.'

EN_DETAILS = [
    'Wide circular black basket with vertical rods, thin legs and cross braces',
    'Smaller black basket on a tall stand, containing product bags',
    'White-and-green rectangular sign leaning against the pillar',
    'Continuous brown/caramel seat under the staircase beside the window',
    'Light rectangular planter with upright foliage; species unidentified',
    'Light wood front and three black circular countertop features; waste sorting is possible but unconfirmed',
    'Steel body, curved door, round dial and black controls',
    'Black housings with elongated slots and white cups',
    'Rounded horizontal white box, partly hidden behind a staff member',
    'Low black compartment organizer containing cups and flat packets',
    'Clear bottles with white pumps; contents undetermined',
    'Stacked translucent rectangular containers; overlaps prevent a reliable count',
    'Rectangular black wire baskets with green and brown packets',
    'Sloped black display holding colorful packets',
    'Black holder filled with fanned-out beige sleeves; straws or stirrers cannot be distinguished',
    'Small beige/orange plush with round ears; character unidentified',
    'One folded vertical sign and one horizontal framed sign on a triangular support',
    'Metal hoops or mesh holding product bags',
    'Tall reflective metal bodies; possible drinks equipment, function unconfirmed',
    'Partly obscured equipment compatible with a professional coffee machine',
    'Tall handled pitchers above black equipment; reliable quantity unavailable',
    'Metal surfaces, railing and vertical guide; mechanism unconfirmed',
    'Foldable yellow plastic caution sign; text unreadable',
    'Red cylinders; the lower example is partly obscured',
    'Light-colored prints in dark frames; contents unread',
    'Black frame and glass; an architectural assembly',
    'White door with circular window and lower metal protection',
    'White door with metal handle and accessibility pictogram',
    'Cylindrical body, pink lid and graphics near the base; bottle or cup uncertain',
    'White handled mugs with green interiors in open green boxes; two graphic designs',
    'Low lobed orange body with side handle',
    'Tall tapered cup with green lid and straw',
    'Tall lidded container with vertical ribs',
    'Metallic-looking shine and top closure; material unverified',
    'Smooth body with a metallic appearance and gold-colored rim',
    'Bulging body with raised scales',
    'Handled white mug with green interior',
    'Espresso-sized mugs; some have vertical text',
    'Tall narrow body, black lid and green grip band',
    'Tapered black body with white logo and green lid',
    'Clear lid and green straw; glass or plastic unverified',
    'Tall tapered speckled body, black lid and straw, STARBUCKS lettering',
    'Tall and low handled black mugs',
    'Stacked low rounded mugs with circular handles and grey lines',
    'Low mug with diagonal texture and rectangular handle',
    'Tapered cup with marbled wave graphics; no lid visible',
    'Tapered body, green siren and white lid; looks like plastic',
    'Printed flexible rectangular coffee bags; sizes and SKUs not confirmed',
    'Clear or printed product bags; brands and contents not confirmed',
]
EN_ZONES = {
    'Columna': 'Pillar', 'Entrada elevada': 'Raised entrance',
    'Junto a puerta accesible': 'Beside the accessible door', 'Contrabarra': 'Back counter',
    'Barra': 'Counter', 'Caja': 'Checkout', 'Sobre vitrina': 'Above the display case',
    'Escalones de entrada': 'Entrance steps', 'Entrada': 'Entrance',
    'Entrada y desembarco superior': 'Entrance and upper landing', 'Paredes': 'Walls',
    'Acceso elevado': 'Raised access', 'Servicio': 'Service area',
}
EN_CONFIDENCE = {
    'alta': 'high', 'media': 'medium', 'media-alta': 'medium-high',
    'alta en forma, media en función': 'high for shape, medium for function',
    'alta en forma, media en contenido': 'high for shape, medium for contents',
    'alta en forma': 'high for shape', 'alta en geometría': 'high for geometry',
    'alta en geometría, media en mecanismo': 'high for geometry, medium for mechanism',
}


def make_photo(key):
    filename, box = PHOTOS[key]
    path = PANORAMA if filename == 'panorama' else ANALYSIS / filename
    original = Image.open(path).convert('RGB')
    box = tuple(box) if box else (0, 0, original.width, original.height)
    if not (0 <= box[0] < box[2] <= original.width and 0 <= box[1] < box[3] <= original.height):
        raise ValueError(f'{key}: crop outside source {filename}: {box}')
    photo = original.crop(box)
    photo.thumbnail((700, 700), Image.Resampling.LANCZOS)
    target = DEST / 'photos' / f'{key}.webp'
    photo.save(target, 'WEBP', quality=91, method=6)
    scope = 'context' if key in CONTEXT else 'type' if key in TYPE else 'element'
    return {
        'photo': './photos/' + target.name,
        'photo_scope': scope,
        'source': SOURCE_URL,
        'source_crop': {'file': filename, 'box': list(box)},
        'photo_pixels': [photo.width, photo.height],
    }


def main():
    (DEST / 'photos').mkdir(exist_ok=True)
    manifest_path = DEST / 'manifest.json'
    manifest = json.loads(manifest_path.read_text())
    analysis = json.loads((ANALYSIS / 'analysis.json').read_text())
    items = []
    for i, unit in enumerate(manifest['units'], 1):
        key = unit['instance_id']
        photo = make_photo(key)
        basis = TYPE_ES if photo['photo_scope'] == 'type' else (
            'Recorte real de Matrix; contrabarra parcialmente oculta por equipos y mostrador.' if key == 'sb-backbar' else
            'Recorte real del panorama Matrix; las zonas ocultas y las medidas no están verificadas.')
        basis_en = TYPE_EN if photo['photo_scope'] == 'type' else (
            'Real Matrix crop; back counter partly obscured by equipment and checkout counter.' if key == 'sb-backbar' else
            'Real Matrix panorama crop; hidden areas and dimensions are not verified.')
        ref_id = f'PG103-{i:03d}'
        ref = {
            'reference_number': i, 'reference_id': ref_id, 'key': key,
            'itil_code': unit['itil_code'], 'asset_number': unit['asset_number'],
            'name': unit['name'], 'name_en': UNIT_EN[i-1], 'status': 'registered',
            **photo, 'basis': basis, 'basis_en': basis_en,
            'confidence': 'tipología visible; unidad sin localizar' if key in TYPE else 'alta en identificación visual',
            'confidence_en': 'visible type; particular unit not located' if key in TYPE else 'high visual identification',
            'visible_quantity': 1,
            'zone': 'Zona de clientes' if key in TYPE else 'Acceso y vitrina' if key == 'sb-water-rack' else 'Zona de servicio',
            'zone_en': 'Customer area' if key in TYPE else 'Entrance and display' if key == 'sb-water-rack' else 'Service area',
        }
        # Quantity belongs to the confirmed CI; the source photo alone does not count distinct chairs/tables.
        if key in TYPE:
            ref['visible_quantity'] = None
            ref['confirmed_quantity'] = 1
        items.append(ref)
        unit.update({
            'reference_number': i, 'reference_id': ref_id, 'photo': photo['photo'],
            'photo_scope': photo['photo_scope'], 'photo_basis': basis, 'photo_basis_en': basis_en,
        })

    candidates = analysis['candidates'] + analysis['product_variants']
    for index, (source_item, name_en) in enumerate(zip(candidates, EN_NAMES), 12):
        key = source_item['code']
        photo = make_photo(key)
        product = key.startswith('P')
        scope_note = TYPE_ES if photo['photo_scope'] == 'type' else (
            'Fotografía de contexto; el elemento aparece parcialmente oculto.' if photo['photo_scope'] == 'context' else
            'Recorte real de Matrix; identificación y cantidad limitadas a lo visible.')
        scope_note_en = TYPE_EN if photo['photo_scope'] == 'type' else (
            'Context photo; the element is partly obscured.' if photo['photo_scope'] == 'context' else
            'Real Matrix crop; identification and quantities are limited to visible examples.')
        basis = source_item['modeling_detail'] + '. ' + scope_note
        basis_en = EN_DETAILS[index-12] + '. ' + scope_note_en
        if product:
            basis += ' Referencia de producto; no representa un SKU confirmado ni existencias registradas.'
            basis_en += ' Product reference; it is not a confirmed SKU or registered stock quantity.'
        items.append({
            'reference_number': index, 'reference_id': f'PG103-{index:03d}', 'key': key,
            'name': source_item['name'], 'name_en': name_en,
            'status': 'product_reference' if product else 'candidate',
            **photo, 'basis': basis, 'basis_en': basis_en,
            'confidence': source_item.get('confidence', 'variante visual; SKU y material sin confirmar'),
            'confidence_en': EN_CONFIDENCE.get(source_item.get('confidence'), 'visual variant; SKU and material not confirmed'),
            'visible_quantity': source_item['visible_quantity'],
            'zone': source_item.get('zone', 'Columna' if key in {'P19','P21'} else 'Estantería de tazas y café'),
            'zone_en': 'Pillar' if key in {'P19','P21'} else 'Mugs and coffee shelving' if product else EN_ZONES[source_item['zone']],
        })
    references = {
        'schema': 'xpaceos.starbucks.references/1',
        'location_id': manifest['location_id'], 'source': SOURCE_URL,
        'source_kind': 'Matrix panorama photograph', 'source_resolution': [8192, 4096],
        'basis': 'Fotografías reales recortadas del panorama Matrix. Los números identifican referencias visuales; no sustituyen los códigos ITIL ni los números de catálogo. Las cantidades visibles no son stock. Las mesas y sillas usan una referencia fotográfica compartida de tipología.',
        'basis_en': 'Real photographs cropped from the Matrix panorama. Numbers identify visual references and do not replace ITIL codes or catalog numbers. Visible quantities are not stock. Tables and chairs use a shared photograph of their visible type.',
        'items': items,
    }
    (DEST / 'references.json').write_text(json.dumps(references, ensure_ascii=False, indent=2) + '\n')
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    assert len(items) == 60 and len({i['reference_id'] for i in items}) == 60
    assert all((DEST / i['photo']).is_file() for i in items)
    print(f'{len(items)} numbered references: 11 registered, 28 candidates, 21 product references.')


if __name__ == '__main__':
    main()
