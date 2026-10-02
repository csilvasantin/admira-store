"""Focused Blender QA of the detailed Best shelf, without rewriting repo assets.

Blender -b --factory-startup --python-exit-code 1 --python /tmp/verify-shelves-best.py --
  --asset-dir /absolute/path/inventario/assets/catalog/02
  --report /tmp/shelves-best-validation.json
Run only after generation finishes. The report records failures as well as passes.
"""
import argparse
import hashlib
import json
import math
import re
import struct
import sys
from pathlib import Path

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--asset-dir', required=True)
parser.add_argument('--report', default='/tmp/shelves-best-validation.json')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
folder = Path(args.asset_dir).resolve()
report_path = Path(args.report).resolve()
report = {'schema_version': 1, 'blender_version': bpy.app.version_string,
          'asset_dir': str(folder), 'identity': 'native:shelves', 'number': 2,
          'checks': [], 'source': {}, 'glb': {}}


def check(name, passed, evidence=None):
    record = {'check': name, 'passed': bool(passed)}
    if evidence is not None:
        record['evidence'] = evidence
    report['checks'].append(record)
    print(('PASS ' if passed else 'FAIL ') + name, flush=True)


def bounds(objects):
    points = [o.matrix_world @ Vector(v) for o in objects if o.type == 'MESH'
              for v in o.bound_box]
    lo = [min(p[i] for p in points) for i in range(3)]
    hi = [max(p[i] for p in points) for i in range(3)]
    return {'blender_min': lo, 'blender_max': hi,
            'gltf_min': [lo[0], lo[2], -hi[1]],
            'gltf_max': [hi[0], hi[2], -lo[1]]}


def check_bounds(label, values):
    lo, hi = values['gltf_min'], values['gltf_max']
    finite = all(math.isfinite(v) for v in lo + hi)
    check(label + ' finite bounds', finite, values)
    check(label + ' preserves 1x2 logical footprint with small trim overhang',
          finite and -.06 <= lo[0] <= .02 and .98 <= hi[0] <= 1.08
          and -.08 <= lo[2] <= .03 and 1.98 <= hi[2] <= 2.08, values)
    check(label + ' preserves approximately 2.235 grid-unit height',
          finite and -.005 <= lo[1] <= .006 and 2.21 <= hi[1] <= 2.26, values)


try:
    manifest = json.loads((folder / 'best.manifest.json').read_text())
    report['revision'] = manifest.get('revision')
    check('manifest preserves identity, profile and unmeasured status',
          manifest.get('inventory_id') == 'native:shelves'
          and manifest.get('inventory_number') == 2
          and manifest.get('quality') == 'best'
          and manifest.get('measured') is False
          and manifest.get('footprint') == [1, 2]
          and manifest.get('front_gltf') == '+X',
          {k: manifest.get(k) for k in ['inventory_id', 'inventory_number',
           'quality', 'measured', 'footprint', 'front_gltf', 'revision']})
    hashes = manifest.get('preserved_profiles_sha256', {})
    expected_files = {tier + '.' + ext for tier in ['good', 'better']
                      for ext in ['glb', 'blend', 'manifest.json']}
    check('preservation manifest covers six Good/Better resources',
          expected_files <= set(hashes), sorted(hashes))
    current_hashes = {name: hashlib.sha256((folder / name).read_bytes()).hexdigest()
                      for name in hashes}
    check('Good and Better hashes remain unchanged', current_hashes == hashes,
          current_hashes)

    bpy.ops.wm.open_mainfile(filepath=str(folder / 'best.blend'))
    bpy.context.view_layer.update()
    objects = list(bpy.context.scene.objects)
    roots = [o for o in objects if o.get('inventoryNumber') == 2]
    check('editable source has one permanent inventory root',
          len(roots) == 1 and roots[0].get('inventoryId') == 'native:shelves'
          and roots[0].get('quality') == 'best'
          and roots[0].get('revision') == manifest.get('revision'))
    check('editable source excludes studio and cameras/lights',
          not any(o.type in ['CAMERA', 'LIGHT'] or 'STUDIO' in o.name
                  for o in objects))
    meshes = [o for o in objects if o.type == 'MESH']
    report['source']['meshes'] = len(meshes)
    check('source retains more than 100 independently editable meshes',
          len(meshes) > 100, len(meshes))
    shelves = [o for o in meshes if re.fullmatch(r'shelf-[0-4]',
                                               str(o.get('componentId', '')))]
    shelf_ids = [o.get('componentId') for o in shelves]
    shelf_heights = sorted(o.matrix_world.translation.z for o in shelves)
    check('source retains exactly five shelf levels',
          sorted(shelf_ids) == ['shelf-' + str(i) for i in range(5)]
          and all(abs(actual - (.14 + i * .41)) < .003
                  for i, actual in enumerate(shelf_heights)),
          {'components': shelf_ids, 'grid_heights': shelf_heights})
    products = [o for o in objects if o.type == 'EMPTY'
                and re.fullmatch(r'product-[0-4]-[0-8]', o.name)]
    check('source retains 45 separate editable display-product groups',
          len(products) == 45 and all(o.children for o in products),
          [o.name for o in products])
    fonts = [o for o in objects if o.type == 'FONT']
    check('header lettering remains editable and faces +X',
          any(o.data.body == 'SELECCIÓN'
              and (o.matrix_world.to_3x3() @ Vector((0, 0, 1))).normalized().x > .99
              for o in fonts), [o.data.body for o in fonts])
    used_images = {node.image.name: node.image for material in bpy.data.materials
                   if material.use_nodes for node in material.node_tree.nodes
                   if node.type == 'TEX_IMAGE' and node.image}
    image_report = [{'name': image.name, 'size': list(image.size),
                     'packed': bool(image.packed_file),
                     'colorspace': image.colorspace_settings.name}
                    for image in used_images.values()]
    report['source']['images'] = image_report
    check('source uses four packed colour, normal, roughness and label maps',
          len(used_images) == 4 and all(image.packed_file
                                      for image in used_images.values()),
          image_report)
    check('normal and roughness use non-colour data',
          all(used_images[name].colorspace_settings.name == 'Non-Color'
              for name in ['oak-normal', 'oak-roughness']
              if name in used_images)
          and all(name in used_images for name in ['oak-normal', 'oak-roughness']))
    mapped_materials = {material for material in bpy.data.materials
                        if material.use_nodes and any(node.type == 'TEX_IMAGE'
                        for node in material.node_tree.nodes)}
    check('all textured meshes retain finite UV coordinates',
          all(o.data.uv_layers.active and all(math.isfinite(v)
              for uv in o.data.uv_layers.active.data for v in uv.uv)
              for o in meshes if any(m in mapped_materials for m in o.data.materials)))
    source_bounds = bounds(objects)
    report['source']['bounds'] = source_bounds
    check_bounds('source', source_bounds)
    front_labels = [o for o in meshes if o.name.startswith(
                    ('Carton printed label', 'Pouch printed label',
                     'Bottle front label', 'Shelf card'))]
    label_normals = [(o.matrix_world.to_3x3().inverted().transposed()
                     @ o.data.polygons[0].normal).normalized().x
                    for o in front_labels]
    check('product and rail label faces point outward toward +X',
          len(front_labels) == 90 and min(label_normals) > .99,
          {'label_faces': len(front_labels), 'minimum_normal_x':
           min(label_normals) if label_normals else None})
    bottles = [o for o in meshes if o.name.startswith('Bottle · shoulder and punt')]
    bottle_results = []
    for bottle in bottles:
        coords = [bottle.matrix_world @ vertex.co for vertex in bottle.data.vertices]
        center = Vector((sum(v.x for v in coords) / len(coords),
                         sum(v.y for v in coords) / len(coords), 0))
        normal_matrix = bottle.matrix_world.to_3x3().inverted().transposed()
        dots = []
        for polygon in bottle.data.polygons:
            if len(polygon.vertices) != 4:
                continue
            face_center = bottle.matrix_world @ polygon.center
            radial = Vector((face_center.x - center.x, face_center.y - center.y, 0))
            dots.append((normal_matrix @ polygon.normal).normalized().dot(radial))
        bottle_results.append({'name': bottle.name, 'side_faces': len(dots),
                               'minimum_outward_dot': min(dots) if dots else None})
    check('six lathed bottle bodies have outward-facing side normals',
          len(bottle_results) == 6 and all(result['side_faces'] > 0
          and result['minimum_outward_dot'] > 0 for result in bottle_results),
          bottle_results)
    plinths = [o for o in meshes if o.get('componentId') == 'plinth']
    feet = [o for o in meshes if o.get('componentId') == 'levelling-feet']
    plinth_bottom = bounds(plinths)['blender_min'][2] if plinths else None
    feet_bounds = bounds(feet) if feet else None
    check('four levelling feet are below, rather than buried within, the plinth',
          len(plinths) == 1 and len(feet) == 4
          and feet_bounds['blender_max'][2] <= plinth_bottom + .003
          and feet_bounds['blender_min'][2] < plinth_bottom - .03,
          {'plinth_bottom': plinth_bottom, 'feet_bounds': feet_bounds})

    binary = (folder / 'best.glb').read_bytes()
    check('GLB binary length and version are valid',
          binary[:4] == b'glTF' and struct.unpack_from('<I', binary, 4)[0] == 2
          and struct.unpack_from('<I', binary, 8)[0] == len(binary), len(binary))
    json_length = struct.unpack_from('<I', binary, 12)[0]
    gltf = json.loads(binary[20:20 + json_length])
    check('GLB root identity and revision match the source contract', any(
          node.get('extras', {}).get('inventoryId') == 'native:shelves'
          and node['extras'].get('inventoryNumber') == 2
          and node['extras'].get('quality') == 'best'
          and node['extras'].get('revision') == manifest.get('revision')
          for node in gltf.get('nodes', [])))
    check('GLB excludes cameras and punctual lights',
          not gltf.get('cameras')
          and 'KHR_lights_punctual' not in gltf.get('extensions', {})
          and all('camera' not in node and 'KHR_lights_punctual'
                  not in node.get('extensions', {}) for node in gltf.get('nodes', [])))
    embedded_images = gltf.get('images', [])
    check('GLB embeds at least four map images without external URIs',
          len(embedded_images) >= 4 and all(isinstance(image.get('bufferView'), int)
          and not image.get('uri') and image.get('mimeType') in ['image/png', 'image/jpeg']
          for image in embedded_images), embedded_images)
    oak_materials = [m for m in gltf.get('materials', [])
                     if m.get('name', '').startswith('Oak')]
    check('GLB oak material carries base colour, normal and roughness maps',
          len(oak_materials) == 1 and 'normalTexture' in oak_materials[0]
          and 'baseColorTexture' in oak_materials[0].get('pbrMetallicRoughness', {})
          and 'metallicRoughnessTexture' in oak_materials[0].get('pbrMetallicRoughness', {}),
          oak_materials)
    triangles = sum(gltf['accessors'][primitive['indices']]['count'] // 3
                    for mesh in gltf.get('meshes', []) for primitive in mesh['primitives'])
    report['glb'].update({'bytes': len(binary), 'mesh_count': len(gltf.get('meshes', [])),
                          'triangles': triangles, 'sha256': hashlib.sha256(binary).hexdigest()})
    check('GLB geometry has finite accessor bounds', all(
          accessor.get('count', 0) >= 3 and all(math.isfinite(v)
          for v in accessor.get('min', []) + accessor.get('max', []))
          for mesh in gltf.get('meshes', []) for primitive in mesh['primitives']
          for accessor in [gltf['accessors'][primitive['attributes']['POSITION']]]))
    check('web geometry stays grouped by finish',
          1 <= len(gltf.get('meshes', [])) <= 20, report['glb'])

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(folder / 'best.glb'))
    bpy.context.view_layer.update()
    objects = list(bpy.context.scene.objects)
    check('GLB successfully reimports with permanent root', any(
          o.get('inventoryNumber') == 2 and o.get('inventoryId') == 'native:shelves'
          for o in objects))
    check('reimport contains usable mesh faces without studio',
          any(o.type == 'MESH' for o in objects)
          and all(len(o.data.vertices) > 0 and len(o.data.polygons) > 0
                  for o in objects if o.type == 'MESH')
          and not any(o.type in ['CAMERA', 'LIGHT'] or 'STUDIO' in o.name for o in objects))
    imported_bounds = bounds(objects)
    report['glb']['reimport_bounds'] = imported_bounds
    check_bounds('GLB reimport', imported_bounds)
except Exception as error:
    check('verification completed without an exception', False,
          {'type': type(error).__name__, 'message': str(error)})
finally:
    report['passed'] = bool(report['checks']) and all(c['passed'] for c in report['checks'])
    report['failed_checks'] = [c['check'] for c in report['checks'] if not c['passed']]
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print('SHELVES_VERIFICATION_REPORT', str(report_path), flush=True)
    if not report['passed']:
        raise RuntimeError('Best shelf verification failed: ' + ', '.join(report['failed_checks']))
