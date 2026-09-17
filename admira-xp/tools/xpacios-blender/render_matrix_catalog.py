"""Render registered Blender furniture to real-alpha isometric Matrix sprites.

  Blender --background --factory-startup --python-exit-code 1 --python \
    admira-xp/tools/xpacios-blender/render_matrix_catalog.py -- --numbers 1,2,43

Sources are only read, never saved or changed. Each view keeps the exact layout
origin as a pixel anchor and includes its orthographic pixels per grid unit.
Rotations match life-scene: Three Y rotation = -rot*pi/2. The existing 43
interpreted models remain the source of truth; these renders do not claim
photographic reconstruction of the original Matrix furniture.
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
parser.add_argument('--size', type=int, default=384)
parser.add_argument('--samples', type=int, default=8)
parser.add_argument('--threads', type=int, default=4)
parser.add_argument('--elevation', type=float, default=math.degrees(math.asin(28 / 80)))
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
base = args.root.resolve()
output = (args.output or base / 'admira-xp/assets/matrix-furniture/catalog').resolve()
numbers = sorted(set(int(n) for n in args.numbers.split(',')))
rotations = sorted(set(int(n) for n in args.rotations.split(',')))
if not numbers or any(n not in range(1, 44) for n in numbers):
    parser.error('--numbers must contain inventory numbers 1 through 43')
if not rotations or any(r not in range(4) for r in rotations):
    parser.error('--rotations must be from 0 through 3')
if args.size < 64 or args.samples < 1 or args.threads < 1:
    parser.error('Size, samples and threads must be positive')
output.mkdir(parents=True, exist_ok=True)
registry = json.loads((base / 'inventario/registry.json').read_text())
native = json.loads((base / 'inventario/catalog.json').read_text())['native']
catalog = {item['id']: item for item in native}
elevation = math.radians(args.elevation)


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


manifest_path = output / 'manifest.json'
previous = json.loads(manifest_path.read_text()) if manifest_path.exists() else {'items': []}
items = {item['number']: item for item in previous['items']}
started = time.monotonic()
for number in numbers:
    source = (base / 'inventario/assets/mostrador/counter-interpreted-best.blend' if number == 1
              else base / f'inventario/assets/catalog/{number:02}/best.blend')
    source_manifest = source.with_suffix('.manifest.json')
    source_meta = json.loads(source_manifest.read_text())
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
    pivot = bpy.data.objects.new('Matrix render orientation', None)
    scene.collection.objects.link(pivot)
    asset_root.parent = pivot
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = args.samples
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 5
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 3
    scene.cycles.transmission_bounces = 3
    scene.render.threads_mode = 'FIXED'
    scene.render.threads = args.threads
    scene.render.use_persistent_data = True
    scene.render.resolution_x = args.size
    scene.render.resolution_y = args.size
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '8'
    scene.render.film_transparent = True
    scene.render.image_settings.compression = 85
    scene.view_settings.view_transform = 'AgX'
    scene.view_settings.exposure = 0
    scene.view_settings.gamma = 1
    scene.world = bpy.data.worlds.new('Matrix sprite · indirect daylight')
    scene.world.use_nodes = True
    scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.80, .85, .83, 1)
    scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .35
    camera_data = bpy.data.cameras.new('Matrix sprite · registered isometric')
    camera = bpy.data.objects.new('Matrix sprite · registered isometric', camera_data)
    scene.collection.objects.link(camera)
    camera_data.type = 'ORTHO'
    camera_data.clip_end = 200
    scene.camera = camera
    direction = Vector((math.cos(elevation) / math.sqrt(2),
                        -math.cos(elevation) / math.sqrt(2), math.sin(elevation)))
    camera.rotation_euler = (-direction).to_track_quat('-Z', 'Y').to_euler()
    camera_basis = camera.rotation_euler.to_matrix()
    right, up = camera_basis @ Vector((1, 0, 0)), camera_basis @ Vector((0, 1, 0))
    lights = []
    views = []
    for rotation in rotations:
        pivot.rotation_euler.z = -rotation * math.pi / 2
        lo, hi, points = bounds(asset_objects)
        target = (lo + hi) / 2
        px = [point.dot(right) for point in points]
        py = [point.dot(up) for point in points]
        xmin, xmax, ymin, ymax = min(px), max(px), min(py), max(py)
        # Square output with 5% safety on all sides; exact origin can be outside
        # the image for large corner-anchored models, which is intentional.
        camera.data.ortho_scale = max(xmax - xmin, ymax - ymin) / .90
        center = right * ((xmin + xmax) / 2) + up * ((ymin + ymax) / 2)
        camera.location = center + direction * 35
        for obj in lights:
            bpy.data.objects.remove(obj, do_unlink=True)
        size = max(dimensions)
        lights = [
            area(scene, 'Matrix · warm shop key', target + Vector((-3, -4, 6)), 820, 4.0, (1, .84, .66), target),
            area(scene, 'Matrix · soft daylight', target + Vector((4, -1, 3.5)), 380, 4.5, (.83, .91, 1), target),
            area(scene, 'Matrix · gentle rear fill', target + Vector((0, 3, 4.5)), 520, 3.0, (1, .94, .85), target),
        ]
        bpy.context.view_layer.update()
        filename = f'{number:02}-r{rotation}.png'
        scene.render.filepath = str(output / filename)
        before = time.monotonic()
        bpy.ops.render.render(write_still=True)
        anchor = world_to_camera_view(scene, camera, Vector((0, 0, 0)))
        footprint_center = world_to_camera_view(scene, camera, Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, 0)))
        view = {
            'rotation': rotation, 'url': f'assets/matrix-furniture/catalog/{filename}',
            'width': args.size, 'height': args.size,
            'anchor': [round(anchor.x * args.size, 6), round((1 - anchor.y) * args.size, 6)],
            'floorCenter': [round(footprint_center.x * args.size, 6), round((1 - footprint_center.y) * args.size, 6)],
            'pixelsPerGridUnit': round(args.size / camera.data.ortho_scale, 6),
            'projectedBounds': {'min': [xmin, ymin], 'max': [xmax, ymax]},
            'sha256': hashlib.sha256((output / filename).read_bytes()).hexdigest(),
        }
        views.append(view)
        print('MATRIX_SPRITE', number, rotation, round(time.monotonic() - before, 2), 'seconds', flush=True)
    prior_views = {v['rotation']: v for v in items.get(number, {}).get('views', [])}
    prior_views.update({v['rotation']: v for v in views})
    items[number] = {
        'number': number, 'inventoryId': inventory_id,
        'name': source_meta.get('name') or catalog.get(inventory_id, {}).get('name') or registry['labels'].get(inventory_id),
        'footprint': source_meta.get('footprint') or source_meta['coordinates']['footprint_grid'],
        'bounds_gltf': {'min': [low.x, low.z, -high.y], 'max': [high.x, high.z, -low.y]},
        'source': source.relative_to(base).as_posix(), 'sourceSha256': source_hash,
        'views': [prior_views[r] for r in sorted(prior_views)],
    }
    if hashlib.sha256(source.read_bytes()).hexdigest() != source_hash:
        raise RuntimeError(f'Source unexpectedly changed: {source}')
    manifest = {
        'schemaVersion': 1,
        'description': 'Transparent Blender renders of the 43 interpreted Best catalog models. Original Matrix cut-outs take precedence for original furniture.',
        'generator': 'admira-xp/tools/xpacios-blender/render_matrix_catalog.py',
        'blenderVersion': bpy.app.version_string,
        'projection': {'kind': 'orthographic', 'azimuthDegrees': 45,
                       'elevationDegrees': args.elevation, 'blenderCameraDirection': list(direction),
                       'anchor': 'Layout origin: Three (col, height, row) maps to Blender (col, -row, height).',
                       'rotation': 'view.rotation = item.rot; Blender Z and Three Y rotate by -rot*pi/2.',
                       'scale': 'Draw scale = targetPixelsPerGridUnit / view.pixelsPerGridUnit.'},
        'render': {'engine': 'Cycles CPU', 'samples': args.samples, 'size': args.size,
                   'alpha': True, 'background': 'transparent', 'floor': False,
                   'shadows': 'Self shadows only; no baked floor shadow.'},
        'items': [items[n] for n in sorted(items)],
    }
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    print('MATRIX_CATALOG_SAVED', number, round(time.monotonic() - started, 2), 'elapsed seconds', flush=True)
