"""Render the Hiperreal furniture models to isometric sprites for Best · Xtanco.

  blender --background --factory-startup --python-exit-code 1 --python \
    admira-xp/tools/xpacios-blender/render_hiperreal_sprites.py -- --numbers 1,2,14

Per model and quarter turn it writes, next to a manifest:
  NN-rR.webp     the piece on real alpha, lit like the Avenida Admira room;
  NN-rR-s.webp   its floor shadow alone (shadow catcher), on a wider frame;
and records the layout origin as a pixel anchor, the orthographic scale and the
projected quadrilateral of every screen the model carries, so that the web view
can map a virtual player onto it in any orientation where the screen is seen.

Sources are only read. Same camera and rotation contract as
render_matrix_catalog.py: orthographic, azimuth 45 deg, elevation asin(28/80);
Three (col, height, row) = Blender (col, -row, height); view.rotation = item.rot.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path
import sys
import time

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[3])
parser.add_argument('--output', type=Path)
parser.add_argument('--numbers', default=','.join(str(n) for n in range(1, 44)))
parser.add_argument('--rotations', default='0,1,2,3')
parser.add_argument('--size', type=int, default=1024)
parser.add_argument('--shadow-size', type=int, default=512)
parser.add_argument('--samples', type=int, default=96)
parser.add_argument('--shadow-samples', type=int, default=48)
parser.add_argument('--quality', type=int, default=90)
parser.add_argument('--device', choices=('GPU', 'CPU'), default='GPU')
parser.add_argument('--no-shadows', action='store_true')
parser.add_argument('--elevation', type=float, default=math.degrees(math.asin(28 / 80)))
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
base = args.root.resolve()
output = (args.output or base / 'admira-xp/assets/matrix-furniture/hiperreal').resolve()
numbers = sorted(set(int(n) for n in args.numbers.split(',')))
rotations = sorted(set(int(n) for n in args.rotations.split(',')))
if not numbers or any(n not in range(1, 44) for n in numbers):
    parser.error('--numbers must contain inventory numbers 1 through 43')
if not rotations or any(r not in range(4) for r in rotations):
    parser.error('--rotations must be from 0 through 3')
if args.size < 64 or args.shadow_size < 32 or args.samples < 1 or args.shadow_samples < 1:
    parser.error('Sizes and samples must be positive')
output.mkdir(parents=True, exist_ok=True)
registry = json.loads((base / 'inventario/registry.json').read_text())
native = json.loads((base / 'inventario/catalog.json').read_text())['native']
catalog = {item['id']: item for item in native}
elevation = math.radians(args.elevation)
SHADOW_FRAME = 1.55  # the shadow frame is this much wider than the piece frame

# Screens a model carries. A mesh flagged mediaSurface in the source is always a
# screen; the rest of this table names meshes the Hiperreal sources leave unflagged.
SCREEN_MESHES = {
    1: ['screen_tpv_main'],
    4: ['Hiperreal pantalla del terminal'],
    7: ['Native component 4'],
    12: ['Native component 1'],
    15: ['Native component 2'],
    18: ['Native component 2'],
    30: ['Backglass'],
    41: ['Game screen'],
}
FRONT = Vector((0, -1, 0))  # an unrotated piece faces +row, which is -Y in Blender


def use_device(scene):
    scene.cycles.device = 'CPU'
    if args.device != 'GPU':
        return 'CPU'
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        for kind in ('METAL', 'OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
            try:
                prefs.compute_device_type = kind
            except TypeError:
                continue
            prefs.get_devices()
            chosen = [d for d in prefs.devices if d.type == kind]
            if chosen:
                for device in prefs.devices:
                    device.use = device.type == kind
                scene.cycles.device = 'GPU'
                return kind
    except Exception as error:  # a missing GPU must not stop a batch
        print('HIPERREAL_DEVICE_FALLBACK', error, flush=True)
    return 'CPU'


def bounds(objects):
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    points = [evaluated.matrix_world @ Vector(point)
              for obj in objects if obj.type in {'MESH', 'FONT', 'CURVE'}
              for evaluated in [obj.evaluated_get(depsgraph)] for point in evaluated.bound_box]
    if not points:
        raise RuntimeError('No renderable furniture in the source')
    lo = Vector(tuple(min(point[i] for point in points) for i in range(3)))
    hi = Vector(tuple(max(point[i] for point in points) for i in range(3)))
    return lo, hi, points


def area(scene, name, location, power, size, color, target):
    data = bpy.data.lights.new(name, 'AREA')
    data.energy, data.shape, data.size, data.color = power, 'DISK', size, color
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (target - obj.location).to_track_quat('-Z', 'Y').to_euler()
    return obj


def floor(scene, name, colour, roughness):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([(-60, -60, 0), (60, -60, 0), (60, 60, 0), (-60, 60, 0)], [], [(0, 1, 2, 3)])
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    shader = material.node_tree.nodes['Principled BSDF']
    shader.inputs['Base Color'].default_value = (*colour, 1)
    shader.inputs['Roughness'].default_value = roughness
    mesh.materials.append(material)
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    return obj


def screen_quad(obj, depsgraph, front):
    """World-space rectangle (TL, TR, BR, BL as a viewer in front sees it), normal and aspect.

    `front` is where the piece faces in its current orientation. The screen is the
    largest face looking that way, together with the faces that curve with it; a
    single-sided flat screen keeps whichever way its only face looks.
    """
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    try:
        world = evaluated.matrix_world
        rotation = world.to_3x3().normalized()
        faces = [((rotation @ polygon.normal).normalized(), polygon.area, tuple(polygon.vertices)) for polygon in mesh.polygons]
        clusters = {}
        for normal, size, _ in faces:
            entry = clusters.setdefault(tuple(round(v, 1) for v in normal), [0.0, Vector((0, 0, 0))])
            entry[0] += size
            entry[1] += normal * size
        ahead = [entry for entry in clusters.values() if entry[1].normalized().dot(front) > .25]
        normal = max(ahead or clusters.values(), key=lambda entry: entry[0])[1].normalized()
        vertices = set()
        for face_normal, _, indices in faces:
            if face_normal.dot(normal) > .9:
                vertices.update(indices)
        points = [world @ mesh.vertices[i].co for i in vertices]
    finally:
        evaluated.to_mesh_clear()
    up = Vector((0, 0, 1)) - normal * normal.z
    if up.length < 1e-4:  # a screen lying flat: its top is the far side from the front
        up = -front - normal * normal.dot(-front)
    up.normalize()
    right = up.cross(normal).normalized()
    centre = sum(points, Vector((0, 0, 0))) / len(points)
    us = [(p - centre).dot(right) for p in points]
    vs = [(p - centre).dot(up) for p in points]
    offset = max((p - centre).dot(normal) for p in points) + .002
    origin = centre + normal * offset
    quad = [origin + right * min(us) + up * max(vs), origin + right * max(us) + up * max(vs),
            origin + right * max(us) + up * min(vs), origin + right * min(us) + up * min(vs)]
    return quad, normal, (max(us) - min(us)) / max(1e-6, max(vs) - min(vs))


def pixel(scene, camera, point, size):
    view = world_to_camera_view(scene, camera, point)
    return [round(view.x * size, 3), round((1 - view.y) * size, 3)]


manifest_path = output / 'manifest.json'
previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {'items': []}
items = {item['number']: item for item in previous['items']}
started = time.monotonic()
device = 'CPU'
for number in numbers:
    source = (base / 'inventario/assets/mostrador/counter-interpreted-hiperreal.blend' if number == 1
              else base / f'inventario/assets/catalog/{number:02}/hiperreal.blend')
    source_manifest = source.with_suffix('.manifest.json')
    source_meta = json.loads(source_manifest.read_text()) if source_manifest.exists() else {}
    best_meta_path = source.with_name(source.name.replace('hiperreal', 'best')).with_suffix('.manifest.json')
    best_meta = json.loads(best_meta_path.read_text()) if best_meta_path.exists() else {}
    source_hash = hashlib.sha256(source.read_bytes()).hexdigest()
    inventory_id = next(key for key, value in registry['numbers'].items() if value == number)
    bpy.ops.wm.open_mainfile(filepath=str(source))
    scene = bpy.context.scene
    asset_root = next(obj for obj in scene.objects if obj.get('inventoryNumber') == number)
    asset_objects = [asset_root, *asset_root.children_recursive]
    for obj in list(bpy.data.objects):
        if obj not in asset_objects:
            bpy.data.objects.remove(obj, do_unlink=True)
    for obj in asset_objects:
        obj.hide_render = False
        obj.hide_set(False)
    low, high, _ = bounds(asset_objects)
    dimensions = high - low
    pivot = bpy.data.objects.new('Hiperreal render orientation', None)
    scene.collection.objects.link(pivot)
    asset_root.parent = pivot
    scene.render.engine = 'CYCLES'
    device = use_device(scene)
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.cycles.diffuse_bounces = 4
    scene.cycles.glossy_bounces = 4
    scene.cycles.transmission_bounces = 8
    scene.cycles.transparent_max_bounces = 8
    scene.cycles.film_transparent_glass = True
    scene.render.use_persistent_data = False
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'WEBP'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.quality = args.quality
    scene.render.film_transparent = True
    scene.view_settings.view_transform = 'AgX'
    for look in ('AgX - Punchy', 'Punchy', 'AgX - Medium High Contrast'):
        try:
            scene.view_settings.look = look
            break
        except TypeError:
            continue
    scene.view_settings.exposure = .1
    scene.view_settings.gamma = 1
    # Night outside, tungsten inside: a dim warm ambient and three shop lights.
    scene.world = bpy.data.worlds.new('Hiperreal sprite · tungsten interior at night')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.55, .40, .30, 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .16
    # The oak floor is never seen by the camera: it only returns warm bounce light
    # and appears in polished bases. A second plane catches the shadow pass.
    bounce = floor(scene, 'Hiperreal sprite · oak bounce', (.52, .30, .13), .32)
    bounce.location.z = -.002
    bounce.visible_camera = False
    catcher = floor(scene, 'Hiperreal sprite · shadow catcher', (.5, .5, .5), .6)
    catcher.is_shadow_catcher = True
    catcher.hide_render = True
    camera_data = bpy.data.cameras.new('Hiperreal sprite · registered isometric')
    camera = bpy.data.objects.new('Hiperreal sprite · registered isometric', camera_data)
    scene.collection.objects.link(camera)
    camera_data.type = 'ORTHO'
    camera_data.clip_end = 200
    scene.camera = camera
    direction = Vector((math.cos(elevation) / math.sqrt(2),
                        -math.cos(elevation) / math.sqrt(2), math.sin(elevation)))
    camera.rotation_euler = (-direction).to_track_quat('-Z', 'Y').to_euler()
    camera_basis = camera.rotation_euler.to_matrix()
    right, up = camera_basis @ Vector((1, 0, 0)), camera_basis @ Vector((0, 1, 0))
    screen_objects = [obj for obj in asset_objects if obj.type == 'MESH'
                      and (obj.get('mediaSurface') or obj.name in SCREEN_MESHES.get(number, ()))]
    lights = []
    views = []
    for rotation in rotations:
        pivot.rotation_euler.z = -rotation * math.pi / 2
        lo, hi, points = bounds(asset_objects)
        target = (lo + hi) / 2
        px = [point.dot(right) for point in points]
        py = [point.dot(up) for point in points]
        xmin, xmax, ymin, ymax = min(px), max(px), min(py), max(py)
        # Square output with 5% safety on all sides; the exact origin can be outside
        # the image for large corner-anchored models, which is intentional.
        frame = max(xmax - xmin, ymax - ymin) / .90
        centre = right * ((xmin + xmax) / 2) + up * ((ymin + ymax) / 2)
        camera.location = centre + direction * 35
        for obj in lights:
            bpy.data.objects.remove(obj, do_unlink=True)
        reach = max(1.6, max(dimensions))
        lights = [
            area(scene, 'Hiperreal · pendant lamp', target + Vector((.2, .5, 2.4 + reach)), 300 * reach, 1.4 + .4 * reach, (1, .72, .42), target),
            area(scene, 'Hiperreal · warm shop key', target + Vector((-3.0, -3.0, 3.8)), 210 * reach, 2.6, (1, .80, .58), target),
            area(scene, 'Hiperreal · night window fill', target + Vector((4.6, -1.2, 2.2)), 34 * reach, 5.0, (.62, .76, 1), target),
        ]
        bpy.context.view_layer.update()
        depsgraph = bpy.context.evaluated_depsgraph_get()
        camera.data.ortho_scale = frame
        scene.render.resolution_x = scene.render.resolution_y = args.size
        scene.cycles.samples = args.samples
        filename = f'{number:02}-r{rotation}.webp'
        scene.render.filepath = str(output / filename)
        before = time.monotonic()
        bpy.ops.render.render(write_still=True)
        view = {
            'rotation': rotation, 'url': f'assets/matrix-furniture/hiperreal/{filename}',
            'width': args.size, 'height': args.size,
            'anchor': pixel(scene, camera, Vector((0, 0, 0)), args.size),
            'floorCenter': pixel(scene, camera, Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, 0)), args.size),
            'pixelsPerGridUnit': round(args.size / frame, 6),
            'projectedBounds': {'min': [xmin, ymin], 'max': [xmax, ymax]},
            'sha256': hashlib.sha256((output / filename).read_bytes()).hexdigest(),
            'screens': [],
        }
        front = pivot.matrix_world.to_3x3() @ FRONT
        for index, obj in enumerate(screen_objects):
            quad, normal, aspect = screen_quad(obj, depsgraph, front)
            facing = normal.dot(direction)
            if facing <= .12:  # seen edge-on or from behind: no player in this view
                continue
            view['screens'].append({'surface': 'main' if index == 0 else f'screen-{index + 1}', 'mesh': obj.name,
                                    'quad': [pixel(scene, camera, point, args.size) for point in quad],
                                    'aspect': round(aspect, 4), 'facing': round(facing, 4)})
        if not args.no_shadows:
            shadow_name = f'{number:02}-r{rotation}-s.webp'
            hidden = [obj for obj in asset_objects if obj.type in {'MESH', 'FONT', 'CURVE'} and obj.visible_camera]
            for obj in hidden:
                obj.visible_camera = False
            catcher.hide_render = False
            camera.data.ortho_scale = frame * SHADOW_FRAME
            scene.render.resolution_x = scene.render.resolution_y = args.shadow_size
            scene.cycles.samples = args.shadow_samples
            scene.render.filepath = str(output / shadow_name)
            bpy.ops.render.render(write_still=True)
            view['shadow'] = {'url': f'assets/matrix-furniture/hiperreal/{shadow_name}',
                              'width': args.shadow_size, 'height': args.shadow_size,
                              'anchor': pixel(scene, camera, Vector((0, 0, 0)), args.shadow_size),
                              'pixelsPerGridUnit': round(args.shadow_size / (frame * SHADOW_FRAME), 6),
                              'sha256': hashlib.sha256((output / shadow_name).read_bytes()).hexdigest()}
            catcher.hide_render = True
            for obj in hidden:
                obj.visible_camera = True
        views.append(view)
        print('HIPERREAL_SPRITE', number, rotation, round(time.monotonic() - before, 2), 'seconds', flush=True)
    prior_views = {v['rotation']: v for v in items.get(number, {}).get('views', [])}
    prior_views.update({v['rotation']: v for v in views})
    items[number] = {
        'number': number, 'inventoryId': inventory_id,
        'name': source_meta.get('name') or catalog.get(inventory_id, {}).get('name') or registry['labels'].get(inventory_id),
        'footprint': best_meta.get('footprint') or best_meta.get('coordinates', {}).get('footprint_grid'),
        'bounds_gltf': {'min': [low.x, low.z, -high.y], 'max': [high.x, high.z, -low.y]},
        'source': source.relative_to(base).as_posix(), 'sourceSha256': source_hash,
        'views': [prior_views[r] for r in sorted(prior_views)],
    }
    if hashlib.sha256(source.read_bytes()).hexdigest() != source_hash:
        raise RuntimeError(f'Source unexpectedly changed: {source}')
    manifest = {
        'schemaVersion': 1,
        'description': 'Transparent Cycles renders of the Hiperreal catalog models for Best · Xtanco, with floor shadows and screen quadrilaterals.',
        'generator': 'admira-xp/tools/xpacios-blender/render_hiperreal_sprites.py',
        'blenderVersion': bpy.app.version_string,
        'projection': {'kind': 'orthographic', 'azimuthDegrees': 45,
                       'elevationDegrees': args.elevation, 'blenderCameraDirection': list(direction),
                       'anchor': 'Layout origin: Three (col, height, row) maps to Blender (col, -row, height).',
                       'rotation': 'view.rotation = item.rot; Blender Z and Three Y rotate by -rot*pi/2.',
                       'scale': 'Draw scale = targetPixelsPerGridUnit / view.pixelsPerGridUnit.'},
        'render': {'engine': 'Cycles ' + device, 'samples': args.samples, 'size': args.size,
                   'format': 'WebP RGBA', 'quality': args.quality, 'alpha': True, 'background': 'transparent',
                   'lighting': 'Tungsten pendant, warm key and night-window fill over an unseen oak floor.',
                   'shadows': 'Separate shadow-catcher pass on a frame %.2f times wider; none baked in the piece.' % SHADOW_FRAME,
                   'screens': 'quad is TL, TR, BR, BL in piece pixels; listed only where the screen faces the camera.'},
        'items': [items[n] for n in sorted(items)],
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print('HIPERREAL_CATALOG_SAVED', number, round(time.monotonic() - started, 2), 'elapsed seconds', flush=True)
