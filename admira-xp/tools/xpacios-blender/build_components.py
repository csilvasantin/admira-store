"""Publish semantic composition of the registered Best inventory models.

Run from the repository root: python3 admira-xp/tools/xpacios-blender/build_components.py
Use --check to verify that the published JSON matches this semantic source.
Counts describe authored assemblies, never stock, a survey or a manufacturing BOM.
The named parts follow the geometry generators; mesh counts are deliberately unused.
"""
import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
TOOLS = 'admira-xp/tools/xpacios-blender/'
LIFE = 'admira-xp/scripts/life-scene.mjs'
REGISTRY = json.loads((ROOT / 'inventario/registry.json').read_text())['numbers']
MODELS = {}


def label(es, en):
    return {'es': es, 'en': en}


def c(key, es, en, quantity=1, note=None, children=None):
    result = {'id': key, 'label': label(es, en), 'quantity': quantity}
    if note:
        result['note'] = label(*note)
    if children:
        result['components'] = children
        result['quantity_scope'] = 'per_parent_unit'
    return result


def g(key, es, en, *parts):
    return {'id': key, 'label': label(es, en), 'components': list(parts)}


INTERPRETED = label(
    'Composición del modelo Best interpretado. Las cantidades describen un modelo, no existencias ni una lista de fabricación verificada. Los circuitos y mecanismos internos no modelados no se infieren.',
    'Composition of the interpreted Best model. Quantities describe one model, not stock or a verified manufacturing bill of materials. Unmodeled internal circuits and mechanisms are not inferred.')
VISUAL = ('Representación visual; no es una cantidad de stock confirmada.',
          'Visual representation; not a confirmed stock quantity.')
PER_UNIT = ('Subcomponentes por unidad.', 'Subcomponents per unit.')


def model(n, source, *groups):
    asset_id = next(key for key, number in REGISTRY.items() if number == n)
    blend = ('inventario/assets/mostrador/counter-interpreted-best.blend' if n == 1
             else f'inventario/assets/catalog/{n:02}/best.blend')
    MODELS[n] = {'id': asset_id, 'number': n, 'profile': 'best', 'basis': 'model',
                 'source': [blend, *source], 'note': INTERPRETED, 'groups': list(groups)}


def terminal():
    return c('terminal', 'Terminal con pantalla', 'Display terminal', children=[
        c('base', 'Base', 'Base'), c('pedestal', 'Pedestal', 'Pedestal'),
        c('housing', 'Carcasa', 'Housing'), c('display', 'Superficie de pantalla', 'Display surface')])


def display():
    return [c('housing', 'Carcasa de pantalla', 'Display housing'),
            c('rear-trim', 'Placa posterior y marco', 'Rear plate and trim'),
            c('display', 'Superficie de pantalla compartida', 'Shared display surface'),
            c('status-led', 'Indicador luminoso', 'Status light')]


model(1, [TOOLS + 'build_counter.py'],
    g('cabinet', 'Mueble y encimera', 'Cabinet and worktop',
      c('plinth', 'Zócalo', 'Plinth'), c('body', 'Cuerpo del mueble', 'Cabinet body'),
      c('teal-panels', 'Paneles lacados frontal y lateral', 'Front and side lacquered panels', 2),
      c('oak-flutes', 'Listones de roble', 'Oak flutes', 28),
      c('brass-inlays', 'Molduras de latón', 'Brass inlays', 2),
      c('worktop', 'Encimera de terrazo', 'Terrazzo worktop'),
      c('shadow-seam', 'Junta bajo encimera', 'Worktop shadow seam'),
      c('service-drawer', 'Frente de cajón de servicio', 'Service drawer front'),
      c('service-doors', 'Puertas de servicio', 'Service doors', 2),
      c('handles', 'Tiradores', 'Handles', 3), c('hinges', 'Bisagras representadas', 'Represented hinges', 2)),
    g('checkout', 'Equipamiento de caja', 'Checkout equipment',
      c('cash-drawer', 'Cajón portamonedas', 'Cash drawer', children=[
          c('shell', 'Carcasa', 'Shell'), c('front', 'Frontal', 'Front'),
          c('slot', 'Ranura', 'Slot'), c('lock', 'Cerradura', 'Lock')]),
      c('pos-terminal', 'Terminal TPV', 'POS terminal', children=[
          c('base', 'Base', 'Base'), c('pedestal', 'Pedestal', 'Pedestal'),
          c('hinge', 'Articulación', 'Hinge'), c('bezel', 'Marco de pantalla', 'Display bezel'),
          c('display', 'Pantalla principal', 'Main display'), c('status-led', 'Indicador luminoso', 'Status light')]),
      c('keyboard', 'Teclado', 'Keyboard', children=[c('body', 'Carcasa', 'Housing'),
          c('keys', 'Teclas representadas', 'Represented keys', 30), c('spacebar', 'Barra espaciadora', 'Spacebar')]),
      c('payment-terminal', 'Terminal de pago', 'Payment terminal', children=[
          c('body', 'Carcasa', 'Housing'), c('screen', 'Pantalla', 'Display'),
          c('keys', 'Teclas', 'Keys', 9), c('accept-key', 'Tecla de aceptación', 'Accept key')]),
      c('receipt-printer', 'Impresora de recibos', 'Receipt printer', children=[
          c('body', 'Cuerpo', 'Body'), c('lid', 'Tapa', 'Lid'), c('slot', 'Salida de papel', 'Paper outlet'),
          c('paper', 'Recibo representativo', 'Representative receipt')]),
      c('packing-mat', 'Alfombrilla de preparación', 'Packing mat')),
    g('signage', 'Identificación', 'Identification',
      c('nameplate', 'Placa de marca', 'Brand plate'), c('lettering', 'Rótulos editables XTANCO y ADMIRA', 'Editable XTANCO and ADMIRA lettering', 2)))

# The detailed shelf preserves separate physical assemblies and product groups.
product_counts = {'bottle': 0, 'pouch': 0, 'carton': 0}
for level in range(5):
    for j in range(9):
        kind = 'bottle' if level in (0, 3) and j % 3 == 0 else 'pouch' if (j + level) % 3 == 1 else 'carton'
        product_counts[kind] += 1
assert product_counts == {'bottle': 6, 'pouch': 15, 'carton': 24}
model(2, [TOOLS + 'build_shelves_best.py', 'inventario/assets/catalog/02/best.manifest.json'],
    g('structure', 'Estructura', 'Structure',
      c('plinth', 'Zócalo de nogal', 'Walnut plinth'), c('levelling-feet', 'Pies niveladores', 'Levelling feet', 4),
      c('back-panel', 'Panel posterior lacado', 'Lacquered back panel'),
      c('side-panels', 'Paneles laterales de roble', 'Oak side panels', 2),
      c('side-inlays', 'Incrustaciones laterales lacadas', 'Lacquered side inlays', 2),
      c('side-uprights', 'Montantes del marco lateral', 'Side frame uprights', 4),
      c('side-cross-rails', 'Travesaños del marco lateral', 'Side frame cross rails', 4),
      c('side-insets', 'Paneles elevados del marco lateral', 'Raised side frame panels', 2),
      c('crown', 'Coronación', 'Crown', children=[c('oak-undercut', 'Base de roble', 'Oak undercut'),
          c('teal-cap', 'Tapa lacada redondeada', 'Rounded lacquered cap'), c('brass-reveal', 'Perfil de latón', 'Brass reveal')]),
      c('shelves', 'Baldas de roble', 'Oak shelves', 5),
      c('rear-stiles', 'Montantes posteriores', 'Rear stiles', 2),
      c('rear-cross-rails', 'Travesaños posteriores', 'Rear cross rails', 2)),
    g('fittings', 'Herrajes y rotulación', 'Fittings and signage',
      c('support-pins', 'Soportes de balda', 'Shelf support pins', 20),
      c('pin-holes', 'Taladros de regulación', 'Shelf adjustment holes', 248,
        ('Son perforaciones representadas en el modelo, no piezas independientes.', 'These are modeled holes, not separate parts.')),
      c('back-screws', 'Tornillos posteriores', 'Back fixing screws', 6),
      c('label-rails', 'Portaetiquetas de latón', 'Brass label rails', 5,
        PER_UNIT, [c('brass-nose', 'Perfil de latón', 'Brass profile'), c('label-recess', 'Canal para etiquetas', 'Label recess')]),
      c('shelf-cards', 'Tarjetas de identificación', 'Identification cards', 45, VISUAL),
      c('header-lettering', 'Rótulo editable SELECCIÓN', 'Editable SELECCIÓN lettering')),
    g('display-products', 'Productos representativos', 'Representative products',
      c('bottles', 'Botellas ámbar', 'Amber bottles', product_counts['bottle'], VISUAL, [
          c('body', 'Cuerpo de vidrio', 'Glass body'), c('cap', 'Tapón', 'Cap'),
          c('cap-bands', 'Anillos de detalle del tapón', 'Cap detail bands', 3), c('label', 'Etiqueta frontal', 'Front label')]),
      c('pouches', 'Bolsas selladas', 'Sealed pouches', product_counts['pouch'], VISUAL, [
          c('body', 'Cuerpo', 'Body'), c('shoulder', 'Hombro plegado', 'Folded shoulder'),
          c('top-seal', 'Sello superior', 'Top seal'), c('gusset', 'Fuelle inferior', 'Lower gusset'),
          c('seams', 'Costuras laterales', 'Edge seams', 2), c('label', 'Etiqueta impresa', 'Printed label')]),
      c('cartons', 'Cajas plegadas', 'Folded cartons', product_counts['carton'], VISUAL, [
          c('body', 'Cuerpo', 'Body'), c('lid-lip', 'Solapa de tapa', 'Lid lip'),
          c('back-seam', 'Unión posterior', 'Back seam'), c('label', 'Etiqueta impresa', 'Printed label')])))

model(3, [LIFE],
    g('rack', 'Botellero', 'Wine rack', c('body', 'Cuerpo del mueble', 'Cabinet body'),
      c('plinth', 'Zócalo', 'Plinth'), c('worktop', 'Tapa de la base', 'Base top'),
      c('brass-trim', 'Perfil de latón', 'Brass trim'), c('sides', 'Laterales lacados', 'Lacquered sides', 2),
      c('shelves', 'Baldas de roble', 'Oak shelves', 3), c('sign', 'Rótulo BODEGA', 'BODEGA sign')),
    g('products', 'Productos representativos', 'Representative products',
      c('bottles', 'Botellas', 'Bottles', 18, VISUAL, [c('body', 'Cuerpo y hombro', 'Body and shoulder'),
        c('neck', 'Cuello', 'Neck'), c('cap', 'Tapón', 'Cap'), c('label', 'Etiqueta', 'Label')])))
model(4, [LIFE],
    g('structure', 'Mueble expositor', 'Display cabinet', c('body', 'Cuerpo', 'Body'), c('plinth', 'Zócalo', 'Plinth'),
      c('worktop', 'Encimera', 'Worktop'), c('brass-trim', 'Perfil de latón', 'Brass trim'),
      c('flutes', 'Listones frontales', 'Front flutes', 18), c('display-panel', 'Panel inclinado', 'Tilted display panel'),
      c('signs', 'Rótulos LOTERÍAS e ILUSIÓN CADA DÍA', 'LOTERÍAS and ILUSIÓN CADA DÍA signs', 2)),
    g('products', 'Material representativo', 'Representative material', c('tickets', 'Billetes de lotería', 'Lottery tickets', 5, VISUAL)))
model(5, [LIFE],
    g('machine', 'Máquina', 'Machine', c('body', 'Carcasa', 'Housing'), c('display-window', 'Panel de exposición', 'Display window'),
      c('shelf-rails', 'Guías de producto', 'Product rails', 4), c('control-panel', 'Panel de control', 'Control panel'),
      c('control-display', 'Pantalla de control', 'Control display'), c('outlet', 'Hueco de recogida', 'Collection opening'),
      c('sign', 'Rótulo PAUSA', 'PAUSA sign')),
    g('products', 'Productos representativos', 'Representative products', c('cans', 'Latas con etiqueta', 'Labeled cans', 12, VISUAL)))
model(6, [LIFE],
    g('stand', 'Revistero', 'Magazine rack', c('base', 'Base', 'Base'), c('uprights', 'Montantes de latón', 'Brass uprights', 2),
      c('shelves', 'Bandejas de roble', 'Oak trays', 3), c('retaining-rails', 'Perfiles de retención', 'Retaining rails', 3),
      c('sign', 'Rótulo PRENSA · CULTURA', 'PRENSA · CULTURA sign')),
    g('products', 'Productos representativos', 'Representative products', c('magazines', 'Revistas con portada', 'Magazines with covers', 15, VISUAL)))
model(7, [LIFE],
    g('desk', 'Escritorio', 'Desk', c('legs', 'Patas', 'Legs', 4), c('top', 'Tablero de roble', 'Oak top'),
      c('drawer', 'Cajonera', 'Drawer unit'), c('drawer-handle', 'Tirador', 'Handle')),
    g('equipment', 'Equipamiento y accesorios', 'Equipment and accessories', terminal(),
      c('keyboard', 'Teclado representativo', 'Representative keyboard'), c('papers', 'Documentos', 'Papers'),
      c('coffee-cup', 'Taza con café', 'Coffee cup')),
    g('chair', 'Silla de trabajo integrada', 'Integrated task chair', c('base', 'Base circular', 'Circular base'),
      c('pedestal', 'Columna', 'Pedestal'), c('seat', 'Asiento', 'Seat'), c('backrest', 'Respaldo', 'Backrest')))
model(8, [LIFE], g('door', 'Puerta', 'Door', c('jambs', 'Jambas de roble', 'Oak jambs', 2),
      c('lintel', 'Dintel de roble', 'Oak lintel'), c('leaf', 'Hoja de vidrio', 'Glass leaf'), c('handle', 'Tirador de latón', 'Brass handle')))
model(9, [LIFE], g('plant', 'Planta decorativa', 'Decorative plant', c('pot', 'Maceta', 'Pot'),
      c('rim', 'Borde de maceta', 'Pot rim'), c('soil', 'Superficie de tierra', 'Soil surface'),
      c('stems', 'Tallos', 'Stems', 11), c('leaves', 'Hojas', 'Leaves', 11)))
model(10, [LIFE], g('lamp', 'Lámpara', 'Lamp', c('base', 'Base de piedra', 'Stone base'),
      c('pole', 'Mástil de latón', 'Brass pole'), c('shade', 'Pantalla cónica', 'Cone shade'), c('diffuser', 'Difusor luminoso', 'Light diffuser')))
model(11, [LIFE], g('rug', 'Alfombra', 'Rug', c('body', 'Cuerpo textil', 'Textile body'),
      c('borders', 'Capas decorativas del borde', 'Decorative border layers', 2,
        ('Capas visuales del diseño; no un despiece de fabricación textil.', 'Visual design layers; not a textile manufacturing breakdown.')),
      c('stripes', 'Franjas decorativas', 'Decorative stripes', 8)))
model(12, [LIFE], g('sign', 'Rótulo LED', 'LED sign', c('housing', 'Carcasa', 'Housing'),
      c('display', 'Frontal de texto', 'Text display face')))
model(13, [LIFE], g('display', 'Pantalla TFT', 'TFT display', *display()))
model(14, [LIFE], g('assistant', 'Asistente digital', 'Digital assistant', c('base', 'Base de piedra', 'Stone base'),
      c('support', 'Soporte de latón', 'Brass support'), *display(), c('sign', 'Rótulo ASISTENTE', 'ASISTENTE sign')))
for n, sign in [(15, '¿QUÉ TAL?'), (18, 'TU TURNO')]:
    model(n, [LIFE], g('kiosk', 'Terminal de pie', 'Floor terminal', c('base', 'Base de piedra', 'Stone base'),
          c('support', 'Soporte de latón', 'Brass support'), c('housing', 'Carcasa inclinada', 'Tilted housing'),
          c('screen-panels', f'Paneles de pantalla {sign}', f'{sign} display panels', 2)))
model(16, [LIFE], g('diffuser', 'Difusor de aroma', 'Aroma diffuser', c('housing', 'Carcasa mural', 'Wall housing'),
      c('grille', 'Lamas de ventilación', 'Ventilation slats', 5), c('status-led', 'Indicador luminoso', 'Status light')))
model(17, [LIFE],
    g('furniture', 'Mueble DJ', 'DJ cabinet', c('body', 'Cuerpo', 'Body'), c('plinth', 'Zócalo', 'Plinth'),
      c('worktop', 'Encimera', 'Worktop'), c('trim', 'Perfil de latón', 'Brass trim'),
      c('flutes', 'Listones frontales', 'Front flutes', 18), c('deck', 'Bandeja de equipo', 'Equipment deck'),
      c('sign', 'Rótulo XTANCO SESSIONS', 'XTANCO SESSIONS sign')),
    g('equipment', 'Equipo de sonido', 'Sound equipment',
      c('turntables', 'Platos', 'Turntables', 2, PER_UNIT, [c('platter', 'Plato metálico', 'Metal platter'),
          c('record', 'Disco con etiqueta central', 'Record with center label'), c('tonearm', 'Brazo', 'Tonearm')]),
      c('faders', 'Canales de control', 'Control channels', 4, PER_UNIT, [c('fader', 'Fader', 'Fader'), c('knob', 'Mando', 'Knob')]),
      c('speakers', 'Altavoces', 'Speakers', 2, PER_UNIT, [c('cabinet', 'Caja', 'Cabinet'), c('driver', 'Cono', 'Driver')])))


def wheels(count):
    return c('wheels', 'Ruedas', 'Wheels', count, PER_UNIT, [c('tyre', 'Neumático', 'Tyre'),
        c('rim', 'Llanta', 'Rim'), c('hub', 'Buje', 'Hub'), c('spokes', 'Radios representados', 'Represented spokes', 6)])


for n in (19, 20, 23):
    parts = [c('frame', 'Chasis', 'Frame'), c('fork', 'Horquilla', 'Fork'), c('handlebar', 'Manillar', 'Handlebar'),
             c('saddle', 'Asiento', 'Saddle'), c('tank', 'Depósito', 'Tank'), c('engine', 'Motor representado', 'Represented engine'),
             c('exhaust', 'Escape', 'Exhaust'), c('headlight', 'Faro', 'Headlight'), c('tail-light', 'Luz trasera', 'Rear light')]
    if n == 19:
        parts += [c('apron', 'Escudo delantero', 'Front apron'), c('footboard', 'Plataforma para pies', 'Footboard'), c('windshield', 'Parabrisas', 'Windshield')]
    if n == 20:
        parts += [c('fairings', 'Carenados laterales', 'Side fairings', 2), c('windshield', 'Parabrisas', 'Windshield')]
    if n == 23:
        parts += [c('saddle-bags', 'Alforjas', 'Saddle bags', 2)]
    model(n, [TOOLS + 'build_catalog.py'], g('vehicle', 'Vehículo representado', 'Represented vehicle', *parts),
          g('running-gear', 'Ruedas', 'Wheels', wheels(2)))

SOFA_SEATS = {21: 4, 22: 3, 25: 4, 26: 2, 27: 2, 31: 4, 34: 4, 35: 2, 39: 2}
for n, seats in SOFA_SEATS.items():
    structure = g('sofa', 'Sofá', 'Sofa', c('base', 'Base tapizada', 'Upholstered base'), c('feet', 'Pies', 'Feet', 4),
                  c('seat-cushions', 'Cojines de asiento', 'Seat cushions', seats),
                  c('back-cushions', 'Cojines de respaldo', 'Back cushions', seats),
                  c('piping', 'Ribetes de tapicería', 'Upholstery piping', seats), c('armrests', 'Reposabrazos', 'Armrests', 2))
    decoration = []
    if n in (21, 31, 34):
        decoration.append(c('decorative-cushions', 'Cojines decorativos', 'Decorative cushions', seats))
    if n == 21:
        decoration.append(c('ghost-motifs', 'Motivos de fantasma', 'Ghost motifs', seats))
    if n == 22:
        decoration.append(c('green-edges', 'Perfiles verdes', 'Green edge strips', 2))
    if n == 25:
        decoration += [c('armoured-rails', 'Perfiles metálicos', 'Armoured rails', 2), c('light-rails', 'Tiras luminosas', 'Light rails', 2)]
    if n == 26:
        decoration += [c('neck', 'Cuello de dragón', 'Dragon neck', 1,
            ('Forma compuesta por seis tramos modelados.', 'Shape built from six modeled segments.')),
            c('head', 'Cabeza de dragón', 'Dragon head'), c('muzzle', 'Hocico', 'Muzzle'), c('eyes', 'Ojos ámbar', 'Amber eyes', 2),
            c('horns', 'Cuernos', 'Horns', 2), c('back-spikes', 'Espinas dorsales', 'Back spikes', 10),
            c('tail', 'Cola curva', 'Curved tail', 1, ('Forma compuesta por doce tramos modelados.', 'Shape built from twelve modeled segments.')),
            c('paws', 'Patas de dragón', 'Dragon paws', 2), c('claws', 'Garras', 'Claws', 6)]
    if n == 27:
        decoration += [c('timber-posts', 'Postes de madera', 'Timber posts', 2), c('iron-straps', 'Abrazaderas de hierro', 'Iron straps', 6),
                       c('fur', 'Borde de piel representado', 'Represented fur edge', 1,
                         ('Veinte mechones de detalle geométrico.', 'Twenty geometric detail tufts.'))]
    if n == 31:
        decoration.append(c('wing-emblems', 'Motivos de alas', 'Wing emblems', 8))
    if n == 34:
        decoration += [c('faces', 'Caras decorativas', 'Decorative faces', 4), c('eyes', 'Ojos', 'Eyes', 8), c('pupils', 'Pupilas', 'Pupils', 8)]
    groups = [structure]
    if decoration:
        groups.append(g('decoration', 'Elementos decorativos', 'Decorative elements', *decoration))
    model(n, [TOOLS + 'build_catalog.py'], *groups)

model(24, [TOOLS + 'build_catalog.py'], g('television', 'Televisor interpretado', 'Interpreted television',
      c('cabinet', 'Carcasa de piedra', 'Stone housing'), c('bezel', 'Marco CRT', 'CRT bezel'),
      c('screen', 'Pantalla curva', 'Curved screen'), c('dials', 'Mandos de sintonía', 'Tuning dials', 2),
      c('legs', 'Patas', 'Legs', 4), c('joints', 'Juntas decorativas de piedra', 'Decorative stone joints', 4)))
model(28, [TOOLS + 'build_catalog.py'], g('cactus', 'Cactus decorativo', 'Decorative cactus',
      c('trunk', 'Tronco con ápice redondeado', 'Trunk with rounded tip'),
      c('branches', 'Brazos con ápice redondeado', 'Arms with rounded tips', 2), c('spines', 'Espinas representadas', 'Represented spines', 24)))
model(29, [TOOLS + 'build_catalog.py'],
    g('body', 'Carrocería', 'Bodywork', c('chassis', 'Chasis', 'Chassis'), c('body', 'Carrocería blanca', 'White body'),
      c('cabin', 'Cabina', 'Cabin'), c('side-windows', 'Paneles de ventanillas laterales', 'Side window panels', 2),
      c('windscreen', 'Parabrisas', 'Windscreen'), c('rear-window', 'Luneta trasera', 'Rear window'),
      c('stripes', 'Franjas rojas laterales', 'Red side stripes', 2)),
    g('equipment', 'Ruedas y equipo', 'Wheels and equipment', wheels(4), c('headlights', 'Faros', 'Headlights', 2),
      c('roof-beacons', 'Balizas de techo', 'Roof beacons', 2), c('roof-rack', 'Baca', 'Roof rack'), c('equipment-box', 'Equipo de techo', 'Roof equipment')))
model(30, [TOOLS + 'build_catalog.py'], g('pinball', 'Pinball', 'Pinball', c('legs', 'Patas', 'Legs', 4),
      c('cabinet', 'Mueble', 'Cabinet'), c('playfield', 'Tablero de juego', 'Playfield'), c('bumpers', 'Bumpers', 'Bumpers', 12),
      c('backbox', 'Cabezal', 'Backbox'), c('backglass', 'Panel gráfico', 'Backglass'), c('planet', 'Motivo de planeta', 'Planet motif')))
model(32, [TOOLS + 'build_catalog.py'], g('picture', 'Cuadro', 'Picture', c('back', 'Trasera sólida', 'Solid back'),
      c('vertical-frame', 'Laterales del marco', 'Vertical frame pieces', 2),
      c('horizontal-frame', 'Travesaños del marco', 'Horizontal frame pieces', 2),
      c('illustration', 'Lámina con ilustración original de Pixeria', 'Canvas with original Pixeria illustration')))
for n in (33, 36, 37):
    parts = [c('legs', 'Patas', 'Legs', 4), c('top', 'Tablero', 'Tabletop')]
    if n == 33:
        parts += [c('sandwich-layers', 'Capas de sándwich', 'Sandwich layers', 3),
                  c('cucumber-slices', 'Rodajas de pepino', 'Cucumber slices', 12), c('tomatoes', 'Rodajas de tomate', 'Tomato slices', 12)]
    if n == 36:
        parts += [c('helmet-dome', 'Cúpula del casco', 'Helmet dome'), c('visor', 'Visor', 'Visor'),
                  c('mask', 'Máscara', 'Mask'), c('cheek-armour', 'Protecciones laterales', 'Cheek armour', 2)]
    if n == 37:
        parts += [c('face', 'Cara de ogro', 'Ogre face'), c('ears', 'Orejas', 'Ears', 2),
                  c('eyes', 'Ojos', 'Eyes', 2), c('pupils', 'Pupilas', 'Pupils', 2), c('smile', 'Sonrisa', 'Smile')]
    model(n, [TOOLS + 'build_catalog.py'], g('table', 'Mesa y decoración', 'Table and decoration', *parts))
model(38, [TOOLS + 'build_catalog.py'],
    g('chair', 'Sillón', 'Armchair', c('base', 'Base', 'Base'), c('seat', 'Asiento', 'Seat'),
      c('backrest', 'Respaldo', 'Backrest'), c('armrests', 'Reposabrazos', 'Armrests', 2)),
    g('gorilla', 'Escultura de gorila', 'Gorilla sculpture', c('chest', 'Torso', 'Chest'), c('head', 'Cabeza', 'Head'),
      c('muzzle', 'Hocico', 'Muzzle'), c('eyes', 'Ojos', 'Eyes', 2), c('arms', 'Brazos', 'Arms', 2), c('hands', 'Manos', 'Hands', 2)))
model(40, [TOOLS + 'build_catalog.py'], g('footwear', 'Par de chanclas', 'Pair of flip-flops',
      c('soles', 'Suelas', 'Soles', 2), c('straps', 'Ramales de las tiras', 'Strap branches', 4),
      c('white-stripes', 'Franjas blancas', 'White stripes', 4)))
model(41, [TOOLS + 'build_catalog.py'],
    g('cabinet', 'Mueble arcade', 'Arcade cabinet', c('lower-cabinet', 'Mueble inferior', 'Lower cabinet'),
      c('upper-housing', 'Carcasa superior', 'Upper housing'), c('monitor-surround', 'Marco de monitor', 'Monitor surround'),
      c('screen', 'Pantalla de juego', 'Game screen'), c('marquee', 'Marquesina', 'Marquee'),
      c('control-deck', 'Panel de mandos', 'Control deck'), c('coin-door', 'Puerta de monedas', 'Coin door')),
    g('controls', 'Controles', 'Controls', c('joysticks', 'Joysticks con bola', 'Joysticks with ball', 2), c('buttons', 'Botones', 'Buttons', 2)))
model(42, [TOOLS + 'build_catalog.py'], g('horse', 'Caballo decorativo', 'Decorative horse',
      c('body', 'Cuerpo', 'Body'), c('legs', 'Patas', 'Legs', 4), c('neck', 'Cuello', 'Neck'), c('head', 'Cabeza', 'Head'),
      c('muzzle', 'Hocico', 'Muzzle'), c('ears', 'Orejas', 'Ears', 2), c('eyes', 'Ojos', 'Eyes', 2), c('tail', 'Cola', 'Tail')))
model(43, [TOOLS + 'build_catalog.py'], g('chair', 'Silla', 'Chair', c('legs', 'Patas', 'Legs', 4),
      c('seat', 'Asiento', 'Seat'), c('back-uprights', 'Montantes del respaldo', 'Back uprights', 2),
      c('back-slats', 'Lamas del respaldo', 'Back slats', 3)))

STARBUCKS = [TOOLS + 'build_starbucks.py', TOOLS + 'starbucks-parts.json']
model(44, STARBUCKS, g('cabinet', 'Mueble de preparación', 'Preparation cabinet',
      c('body', 'Cuerpo de madera', 'Wood body'), c('worktop', 'Encimera gris', 'Gray worktop'),
      c('fronts', 'Frentes de armario', 'Cabinet fronts', 8)))
model(45, STARBUCKS, g('counter', 'Mostrador', 'Counter', c('body', 'Cuerpo de madera', 'Wood body'),
      c('flutes', 'Listones frontales', 'Front flutes', 40), c('worktop', 'Encimera', 'Worktop'),
      c('front-rail', 'Perfil horizontal frontal', 'Horizontal front rail')))
model(46, STARBUCKS,
    g('cabinet', 'Mueble base', 'Base cabinet', c('body', 'Cuerpo de madera', 'Wood body'),
      c('flutes', 'Listones frontales', 'Front flutes', 60), c('worktop', 'Encimera', 'Worktop'),
      c('front-rail', 'Perfil horizontal frontal', 'Horizontal front rail')),
    g('display-case', 'Vitrina', 'Display case', c('shelves', 'Baldas metálicas', 'Metal shelves', 3),
      c('lights', 'Tiras de iluminación', 'Light strips', 3), c('uprights', 'Montantes de vitrina', 'Case uprights', 4),
      c('front-glass', 'Vidrio frontal', 'Front glass'), c('top-glass', 'Vidrio superior', 'Top glass'),
      c('top-rails', 'Perfiles superiores', 'Top rails', 2)),
    g('products', 'Exposición representativa', 'Representative display', c('trays', 'Bandejas de producto', 'Product trays', 36, VISUAL),
      c('pastries', 'Piezas de pastelería con detalle superior', 'Pastry pieces with top detail', 36, VISUAL)))
model(47, ['inventario/assets/catalog/47/collection/source/build_scene.py',
           'inventario/assets/catalog/47/best.parts.json'],
    g('cabinet', 'Mueble expositor', 'Display cabinet',
      c('structure', 'Estructura metálica independiente', 'Independent metal frame'),
      c('shelves', 'Niveles de baldas de madera', 'Wood shelf levels', 5),
      c('bays', 'Bahías de exposición', 'Display bays', 2)),
    g('contents', 'Vasos, termos, tazas y café independientes', 'Independent cups, tumblers, mugs and coffee',
      c('visual-designs', 'Referencias visuales con GLB independiente', 'Visual references with separate GLB', 26),
      c('product-instances', 'Instancias visuales colocadas', 'Placed visual instances', 115,
        ('Instancias de la composición visual; no es stock físico.',
         'Instances in the visual composition; not physical stock.'))))
MODELS[47]['note'] = label(
    'Mueble interpretado desde la fotografía de Carlos: cinco niveles y 26 referencias visuales separadas. Las cantidades corresponden al modelo; no acreditan existencias, SKU comerciales ni altas patrimoniales de productos.',
    'Cabinet interpreted from Carlos’s photograph: five levels and 26 separate visual references. Quantities describe the model; they do not establish stock, commercial SKUs or product lifecycle registration.')
model(48, STARBUCKS, g('table', 'Mesa', 'Table', c('base', 'Base circular', 'Circular base'),
      c('pedestal', 'Pedestal central', 'Center pedestal'), c('top', 'Tablero redondo de madera', 'Round wood top')))
model(49, STARBUCKS, g('chair', 'Silla', 'Chair', c('seat', 'Asiento de madera', 'Wood seat'),
      c('backrest', 'Respaldo de madera', 'Wood backrest'), c('side-supports', 'Soportes laterales', 'Side supports', 2,
      ('El modelo representa dos soportes laterales sólidos; no define cuatro patas separadas.',
       'The model represents two solid side supports; it does not define four separate legs.'))))
model(50, [TOOLS + 'build_water_rack.py', 'inventario/assets/catalog/50/best.manifest.json'],
    g('rack', 'Estructura del botellero', 'Rack structure', c('basket-rings', 'Aros de cesta', 'Basket rings', 3),
      c('basket-uprights', 'Varillas verticales de cesta', 'Basket upright wires', 56),
      c('basket-floor', 'Varillas del fondo', 'Basket floor wires', 34), c('legs', 'Patas metálicas', 'Metal legs', 4),
      c('feet', 'Pies de goma', 'Rubber feet', 4), c('lower-frame', 'Varillas del marco inferior', 'Lower frame rods', 4),
      c('diagonal-braces', 'Tirantes diagonales', 'Diagonal braces', 2),
      c('sign', 'Rótulo AGUA MINERAL', 'AGUA MINERAL sign', children=[c('board', 'Placa', 'Board'), c('print', 'Cara impresa', 'Printed face')])),
    g('products', 'Productos representativos', 'Representative products',
      c('bottles', 'Botellas Solán de Cabras', 'Solán de Cabras bottles', 19, VISUAL, [
          c('body', 'Cuerpo PET azul', 'Blue PET body'), c('tamper-band', 'Precinto blanco', 'White tamper band'),
          c('printed-collar', 'Collar impreso', 'Printed collar'), c('cap', 'Tapón blanco', 'White cap'),
          c('cap-ribs', 'Estrías del tapón', 'Cap grip ribs', 36)])))


# Preserve additive permanent models 51 and 52 when regenerating composition.
MODELS.update({51: {'id': 'native:cafebreriaLibrary',
      'number': 51,
      'profile': 'best',
      'basis': 'model',
      'source': ['admira-xp/tools/xpacios-blender/build_cafebreria_library.py',
                 'inventario/cafebreria/library.package.json'],
      'note': {'es': 'Pieza original confirmada. Composición de una plantilla visual, no existencias '
                     'físicas. Libros y vinilos interactivos se actualizan desde Stock; las seis '
                     'portadas del GLB son la composición inicial.',
               'en': 'Confirmed original piece. Composition of one visual template, not physical stock. '
                     'Interactive books and records refresh from Stock; the six GLB covers are the '
                     'initial composition.'},
      'groups': [{'id': 'structure',
                  'label': {'es': 'Estructura de nogal', 'en': 'Walnut structure'},
                  'components': [{'id': 'sides',
                                  'label': {'es': 'Laterales', 'en': 'Sides'},
                                  'quantity': 2},
                                 {'id': 'boards',
                                  'label': {'es': 'Tableros horizontales', 'en': 'Horizontal boards'},
                                  'quantity': 4},
                                 {'id': 'back', 'label': {'es': 'Trasera', 'en': 'Back'}, 'quantity': 1},
                                 {'id': 'brass',
                                  'label': {'es': 'Listón de latón', 'en': 'Brass trim'},
                                  'quantity': 1}]},
                 {'id': 'contents',
                  'label': {'es': 'Contenidos independientes', 'en': 'Independent contents'},
                  'components': [{'id': 'tv',
                                  'label': {'es': 'Tele retro', 'en': 'Retro TV'},
                                  'quantity': 1},
                                 {'id': 'books',
                                  'label': {'es': 'Libros iniciales del GLB', 'en': 'Initial GLB books'},
                                  'quantity': 6},
                                 {'id': 'records',
                                  'label': {'es': 'Vinilos iniciales', 'en': 'Initial records'},
                                  'quantity': 6}]}]},
 52: {'id': 'native:ipadLandscape',
      'number': 52,
      'profile': 'best',
      'basis': 'model',
      'source': ['admira-xp/tools/xpacios-blender/build_ipad.py'],
      'note': {'es': 'iPad virtual previsto. Proporciones nominales; no son medidas de un equipo '
                     'instalado. Componentes del modelo, no stock.',
               'en': 'Planned virtual iPad. Nominal proportions, not measurements of installed '
                     'hardware. Model components, not stock.'},
      'groups': [{'id': 'ipad',
                  'label': {'es': 'iPad horizontal', 'en': 'Landscape iPad'},
                  'components': [{'id': 'body',
                                  'label': {'es': 'Carcasa', 'en': 'Body'},
                                  'quantity': 1,
                                  'unit': 'piece'},
                                 {'id': 'bezel',
                                  'label': {'es': 'Marco', 'en': 'Bezel'},
                                  'quantity': 1,
                                  'unit': 'piece'},
                                 {'id': 'display',
                                  'label': {'es': 'Pantalla 4:3', 'en': '4:3 display'},
                                  'quantity': 1,
                                  'unit': 'piece'},
                                 {'id': 'stand',
                                  'label': {'es': 'Soporte de sobremesa', 'en': 'Counter stand'},
                                  'quantity': 1,
                                  'unit': 'piece'}]}]}})

def validate(data):
    assert len(data['assets']) == len(REGISTRY)
    assert {a['id']: a['number'] for a in data['assets']} == REGISTRY
    assert [a['number'] for a in data['assets']] == sorted(REGISTRY.values())
    for a in data['assets']:
        assert all((ROOT / source).is_file() for source in a['source']), a['id']
        assert a['groups']
        group_ids = set()
        def parts(items):
            ids = set()
            for part in items:
                assert part['id'] not in ids
                ids.add(part['id'])
                assert part['label']['es'] and part['label']['en']
                value = part['quantity']
                assert value is None or isinstance(value, int) and value > 0
                if 'components' in part:
                    parts(part['components'])
        for group in a['groups']:
            assert group['id'] not in group_ids
            group_ids.add(group['id'])
            assert group['label']['es'] and group['label']['en']
            parts(group['components'])
    shelf = next(a for a in data['assets'] if a['number'] == 2)
    assert sum(c['quantity'] for c in shelf['groups'][2]['components']) == 45
    assert next(c for c in shelf['groups'][0]['components'] if c['id'] == 'shelves')['quantity'] == 5
    water = next(a for a in data['assets'] if a['number'] == 50)
    assert water['groups'][1]['components'][0]['quantity'] == 19


data = {'schema_version': 1, 'revision': 'components-20261008-coffee47-1',
        'assets': [MODELS[n] for n in sorted(MODELS)]}
validate(data)
content = json.dumps(data, ensure_ascii=False, indent=2) + '\n'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--check', action='store_true')
args = parser.parse_args()
destination = ROOT / 'inventario/components.json'
if args.check:
    assert destination.read_text() == content, 'Regenerate inventario/components.json'
else:
    destination.write_text(content)
print(f'{len(MODELS)} semantic model breakdowns verified; Starbucks shelf: five levels, 26 visual references; stock remains unverified.')
