"""Open the saved editable source, then reimport the exported GLB in background."""
import argparse
import json
from pathlib import Path
import sys

import bpy

parser = argparse.ArgumentParser()
parser.add_argument('--output', required=True)
parser.add_argument('--quality', choices=['good', 'better', 'best'], default='best')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
output = Path(args.output).resolve()
stem = f'counter-interpreted-{args.quality}'
manifest = json.loads((output / f'{stem}.manifest.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(output / f'{stem}.blend'))
assert bpy.data.objects.get('asset_counter_interpreted') is not None
assert bpy.data.objects.get('editable_brand_lettering').type == 'FONT'
assert bpy.data.objects.get('cabinet_body').modifiers or args.quality == 'good'
assert all(image.packed_file for image in bpy.data.images if image.name in ['oak_basecolor', 'oak_roughness', 'oak_normal', 'terrazzo_basecolor', 'tpv_placeholder'])
source_mesh_count = sum(obj.type == 'MESH' for obj in bpy.data.collections['ASSET · Counter editable'].objects)
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(output / f'{stem}.glb'))
root = bpy.data.objects.get('asset_counter_interpreted')
assert root is not None and root.get('referenceStatus') == 'interpreted_not_measured'
assert bpy.data.objects.get('screen_tpv_main').get('mediaSurface') == 'existing_shared_player'
assert all(bpy.data.objects.get(part) is not None for part in manifest['semantic_parts'])
assert not any(obj.type in {'CAMERA', 'LIGHT'} for obj in bpy.data.objects)
assert not any('studio_ground' in obj.name for obj in bpy.data.objects)
assert all(tuple(root.location)[i] == 0 for i in range(3))
mesh_count = sum(obj.type == 'MESH' for obj in bpy.data.objects)
assert mesh_count >= source_mesh_count
assert all(poly.material_index < max(1, len(obj.data.materials)) for obj in bpy.data.objects if obj.type == 'MESH' for poly in obj.data.polygons)
result = {'source_opens': True, 'source_text_editable': True, 'source_textures_packed': True,
          'glb_reimports': True, 'semantic_parts_preserved': True, 'single_media_surface': True,
          'studio_excluded': True, 'mesh_objects': mesh_count, 'blender_version': bpy.app.version_string}
(output / f'{stem}.validation.json').write_text(json.dumps(result, indent=2) + '\n')
print('XPACIOS_VALIDATION ' + json.dumps(result))
