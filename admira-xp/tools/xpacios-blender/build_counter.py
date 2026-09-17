"""Editable Xtanco counter pilot. Run with Blender's bundled Python, not CPython.

Interpretation of the procedural shop: no photograph or measured store geometry
is asserted. Source X = grid column, -Y = grid row, Z = height. glTF's Y-up export
therefore yields X = column, Y = height, Z = row, directly matching life-scene.
"""
import argparse
import json
import math
from pathlib import Path
import sys

import bpy
from mathutils import Vector
import numpy as np


def arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True)
    parser.add_argument('--quality', choices=['good', 'better', 'best'], default='best')
    parser.add_argument('--resolution', type=int, default=1100)
    parser.add_argument('--skip-render', action='store_true')
    return parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])


ARGS = arguments()
OUTPUT = Path(ARGS.output).expanduser().resolve()
OUTPUT.mkdir(parents=True, exist_ok=True)
TEXTURES = OUTPUT / 'textures' / ARGS.quality
TEXTURES.mkdir(parents=True, exist_ok=True)
STEM = f'counter-interpreted-{ARGS.quality}'
PROFILE = {
    'good': {'bevel_segments': 1, 'texture_size': 128, 'cylinder_segments': 12},
    'better': {'bevel_segments': 2, 'texture_size': 256, 'cylinder_segments': 20},
    'best': {'bevel_segments': 4, 'texture_size': 512, 'cylinder_segments': 32},
}[ARGS.quality]
CONFIG = {'width': 1.0, 'depth': 2.0, 'counter_height': 1.0,
          'reference': 'interpreted-procedural-xtanco', 'measured': False,
          'meters_per_grid_unit': None, 'layout_type': 'counter', 'layout_id_example': 'counter'}
ASSET_ID = 'xtanco.counter.interpreted.v1'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
SCENE = bpy.context.scene
SCENE.unit_settings.system = 'NONE'
SCENE.unit_settings.scale_length = 1.0
SCENE['reference_status'] = 'INTERPRETED — NO REAL MEASUREMENTS'
SCENE['quality_label_meaning'] = 'Geometry/texture detail profile; not a pixel-bit-depth claim.'
ASSET_COLLECTION = bpy.data.collections.new('ASSET · Counter editable')
SCENE.collection.children.link(ASSET_COLLECTION)
STUDIO_COLLECTION = bpy.data.collections.new('STUDIO · excluded from GLB')
SCENE.collection.children.link(STUDIO_COLLECTION)


def rgba(hex_color):
    rgb = [int(hex_color.lstrip('#')[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in rgb) + (1,)


def move_to(obj, collection):
    for previous in list(obj.users_collection):
        previous.objects.unlink(obj)
    collection.objects.link(obj)


def empty(name, parent=None, part=None):
    obj = bpy.data.objects.new(name, None)
    ASSET_COLLECTION.objects.link(obj)
    obj.empty_display_type = 'PLAIN_AXES'
    obj.empty_display_size = .12
    obj.parent = parent
    if part:
        obj['componentId'] = part
    return obj


ROOT = empty('asset_counter_interpreted')
ROOT['assetId'] = ASSET_ID
ROOT['inventoryId'] = 'native:counter'
ROOT['inventoryNumber'] = 1
ROOT['revision'] = 'blender-pilot-2'
ROOT['referenceStatus'] = 'interpreted_not_measured'
ROOT['layoutType'] = 'counter'
ROOT['layoutIdExample'] = 'counter'
ROOT['units'] = 'uncalibrated_grid_units'
ROOT['pivot'] = 'footprint_corner_on_floor'
ROOT['quality'] = ARGS.quality
PARTS = {name: empty(name, ROOT, name) for name in [
    'counter_cabinet', 'counter_worktop', 'cash_drawer', 'pos_terminal',
    'payment_terminal', 'receipt_printer', 'counter_signage', 'checkout_accessories'
]}


def image_from_pixels(name, pixels, noncolor=False):
    height, width, _ = pixels.shape
    image = bpy.data.images.new(name, width=width, height=height, alpha=True)
    image.colorspace_settings.name = 'Non-Color' if noncolor else 'sRGB'
    image.pixels.foreach_set(np.ascontiguousarray(pixels, dtype=np.float32).ravel())
    image.filepath_raw = str(TEXTURES / f'{name}.png')
    image.file_format = 'PNG'
    image.save()
    image.pack()
    return image


def procedural_maps():
    size = PROFILE['texture_size']
    y, x = np.mgrid[0:1:complex(size), 0:1:complex(size)]
    rng = np.random.default_rng(481516)
    flow = x * 36 + .28 * np.sin(y * 8) + .07 * np.sin(y * 31)
    grain = np.sin(flow * math.pi * 2) * .026 + np.sin(flow * 4.7) * .009
    grain += rng.normal(0, .006, (size, size))
    wood = np.ones((size, size, 4), dtype=np.float32)
    wood[:, :, :3] = np.clip(np.array([.54, .35, .19]) + grain[:, :, None], 0, 1)
    wood_map = image_from_pixels('oak_basecolor', wood)
    rough = np.ones_like(wood)
    rough[:, :, :3] = np.clip(.57 + grain[:, :, None] * 2.5, 0, 1)
    wood_rough = image_from_pixels('oak_roughness', rough, True)
    gy, gx = np.gradient(grain)
    normal = np.stack((-gx * 1.2, -gy * 1.2, np.ones_like(gx)), axis=-1)
    normal /= np.linalg.norm(normal, axis=-1)[:, :, None]
    normal_pixels = np.ones_like(wood)
    normal_pixels[:, :, :3] = normal * .5 + .5
    wood_normal = image_from_pixels('oak_normal', normal_pixels, True)
    stone = np.ones_like(wood)
    noise = rng.normal(0, .007, (size, size))
    stone[:, :, :3] = np.array([.74, .70, .61]) + noise[:, :, None]
    for _ in range(size * 2):
        cx, cy = rng.integers(0, size, 2)
        radius = max(1, size // 170)
        mask = (np.arange(size)[None, :] - cx) ** 2 + (np.arange(size)[:, None] - cy) ** 2 < radius ** 2
        stone[mask, :3] = np.array([.40, .39, .35]) + rng.random() * .25
    return wood_map, wood_rough, wood_normal, image_from_pixels('terrazzo_basecolor', stone)


WOOD_MAP, WOOD_ROUGH, WOOD_NORMAL, STONE_MAP = procedural_maps()


def material(name, color, roughness=.55, metallic=0, base_map=None, rough_map=None, normal_map=None, emission=0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.diffuse_color = rgba(color)
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = rgba(color)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = metallic
    if emission:
        bsdf.inputs['Emission Color'].default_value = rgba(color)
        bsdf.inputs['Emission Strength'].default_value = emission
    for img, socket in [(base_map, 'Base Color'), (rough_map, 'Roughness')]:
        if img:
            node = nodes.new('ShaderNodeTexImage')
            node.image = img
            links.new(node.outputs['Color'], bsdf.inputs[socket])
    if normal_map:
        node = nodes.new('ShaderNodeTexImage')
        node.image = normal_map
        normal = nodes.new('ShaderNodeNormalMap')
        normal.inputs['Strength'].default_value = .35
        links.new(node.outputs['Color'], normal.inputs['Color'])
        links.new(normal.outputs['Normal'], bsdf.inputs['Normal'])
    return mat


MAT = {
    'oak': material('PBR · Oiled oak', '#ae865e', base_map=WOOD_MAP, rough_map=WOOD_ROUGH, normal_map=WOOD_NORMAL),
    'stone': material('PBR · Warm terrazzo', '#ded6c2', .38, base_map=STONE_MAP),
    'teal': material('PBR · Petrol lacquer', '#235550', .34),
    'sage': material('PBR · Sage insert', '#798b73', .63),
    'brass': material('PBR · Satin brass', '#bc955c', .27, .78),
    'black': material('PBR · Terminal polymer', '#162527', .41),
    'rubber': material('PBR · Soft rubber', '#101717', .82),
    'steel': material('PBR · Brushed steel', '#6c7774', .3, .68),
    'paper': material('PBR · Receipt paper', '#f4eddd', .87),
    'walnut': material('PBR · Dark plinth', '#46372a', .59),
    'cream': material('PBR · Cream keys', '#d4cfbd', .5),
    'green': material('PBR · Status light', '#a4dfbd', .3, emission=.35),
}


def cube(name, xyz, size, mat, part, bevel=.008):
    # Input coordinates use scene grid convention even though Blender is Z-up.
    gx, gz, height = xyz
    width, depth, tall = size
    bpy.ops.mesh.primitive_cube_add(size=1, location=(gx, -gz, height))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (width, depth, tall)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    # Use a full texture tile on each face. Blender's default cube UV cross
    # allocates a small tile per face and magnifies terrazzo chips in close-ups.
    uv_layer = obj.data.uv_layers.active or obj.data.uv_layers.new(name='UVMap')
    for polygon in obj.data.polygons:
        axis = max(range(3), key=lambda index: abs(polygon.normal[index]))
        for loop_index in polygon.loop_indices:
            vertex = obj.data.vertices[obj.data.loops[loop_index].vertex_index].co
            if axis == 2:
                uv = (vertex.x / width + .5, vertex.y / depth + .5)
            elif axis == 1:
                uv = (vertex.x / width + .5, vertex.z / tall + .5)
            else:
                uv = (vertex.y / depth + .5, vertex.z / tall + .5)
            uv_layer.data[loop_index].uv = uv
    move_to(obj, ASSET_COLLECTION)
    obj.parent = PARTS[part]
    obj.data.materials.append(MAT[mat] if isinstance(mat, str) else mat)
    obj['componentId'] = part
    if bevel and ARGS.quality != 'good':
        bevel_mod = obj.modifiers.new('Editable edge radii', 'BEVEL')
        bevel_mod.width = min(bevel, min(size) * .35)
        bevel_mod.segments = PROFILE['bevel_segments']
        bevel_mod.limit_method = 'ANGLE'
        normals = obj.modifiers.new('Weighted corner normals', 'WEIGHTED_NORMAL')
        normals.keep_sharp = True
    return obj


def cylinder(name, xyz, radius, height, mat, part, rotation=None):
    x, row, z = xyz
    bpy.ops.mesh.primitive_cylinder_add(vertices=PROFILE['cylinder_segments'], radius=radius, depth=height, location=(x, -row, z))
    obj = bpy.context.object
    obj.name = name
    move_to(obj, ASSET_COLLECTION)
    obj.parent = PARTS[part]
    obj.data.materials.append(MAT[mat])
    obj['componentId'] = part
    if rotation:
        obj.rotation_euler = rotation
    for face in obj.data.polygons:
        face.use_smooth = len(face.vertices) == 4
    if ARGS.quality != 'good':
        modifier = obj.modifiers.new('Editable circular edges', 'BEVEL')
        modifier.width = min(.004, radius * .12)
        modifier.segments = PROFILE['bevel_segments']
    return obj


def text(name, value, xyz, size, mat, part, facing='front'):
    curve = bpy.data.curves.new(name, 'FONT')
    curve.body = value
    curve.align_x = 'CENTER'
    curve.align_y = 'CENTER'
    curve.size = size
    curve.extrude = .0012
    curve.bevel_depth = .0003 if ARGS.quality != 'good' else 0
    obj = bpy.data.objects.new(name, curve)
    ASSET_COLLECTION.objects.link(obj)
    obj.location = (xyz[0], -xyz[1], xyz[2])
    obj.rotation_euler = (math.pi / 2, 0, 0) if facing == 'front' else (math.pi / 2, 0, math.pi / 2)
    obj.parent = PARTS[part]
    obj.data.materials.append(MAT[mat])
    obj['componentId'] = part
    return obj


def display_map():
    width, height = 512, 256
    pixels = np.ones((height, width, 4), dtype=np.float32)
    pixels[:, :, :3] = [.019, .083, .071]
    pixels[25:29, 30:482, :3] = [.44, .32, .14]
    letters = {
        'A': ['01110', '11011', '11011', '11111', '11011', '11011', '11011'],
        'D': ['11110', '11011', '11011', '11011', '11011', '11011', '11110'],
        'M': ['10001', '11011', '11111', '10101', '10101', '10001', '10001'],
        'I': ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
        'R': ['11110', '11011', '11011', '11110', '11100', '11010', '11011'],
    }
    for index, char in enumerate('ADMIRA'):
        for row, bits in enumerate(letters[char]):
            for column, bit in enumerate(bits):
                if bit == '1':
                    x, y = 77 + index * 61 + column * 10, 104 + (6 - row) * 10
                    pixels[y:y+8, x:x+8, :3] = [.84, .74, .49]
    pixels[63:67, 143:369, :3] = [.2, .4, .3]
    return image_from_pixels('tpv_placeholder', pixels)


# Footprint corner at the origin. All dimensions below are authored proportions,
# not claimed real dimensions of a Barcelona, Valencia or other physical shop.
cube('cabinet_plinth', (.5, 1, .065), (.9, 1.88, .13), 'walnut', 'counter_cabinet', .018)
cube('cabinet_body', (.5, 1, .51), (1, 2, .86), 'oak', 'counter_cabinet', .013)
cube('front_teal_panel', (.5, 2.006, .53), (.934, .024, .72), 'teal', 'counter_cabinet', .009)
cube('side_teal_panel', (1.007, 1, .53), (.024, 1.91, .72), 'teal', 'counter_cabinet', .009)
for index in range(19):
    z = .10 + index * .10
    cube(f'side_oak_flute_{index:02d}', (1.029, z, .52), (.029, .027, .65), 'oak', 'counter_cabinet', .008)
for index in range(9):
    x = .10 + index * .10
    cube(f'front_oak_flute_{index:02d}', (x, 2.028, .40), (.027, .029, .42), 'oak', 'counter_cabinet', .008)
cube('front_brass_inlay', (.5, 2.048, .20), (.92, .009, .015), 'brass', 'counter_cabinet', .002)
cube('side_brass_inlay', (1.049, 1, .20), (.009, 1.88, .015), 'brass', 'counter_cabinet', .002)
cube('worktop_shadow_seam', (.5, 1, .942), (1.025, 2.05, .035), 'walnut', 'counter_worktop', .006)
cube('solid_terrazzo_worktop', (.5, 1, .995), (1.10, 2.12, .085), 'stone', 'counter_worktop', .02)
cube('rear_service_drawer', (.5, -.007, .70), (.83, .032, .25), 'oak', 'counter_cabinet', .009)
cube('rear_service_handle', (.5, -.037, .75), (.22, .045, .018), 'brass', 'counter_cabinet', .005)
# Full rear elevation: separate service doors, toe kick and reachable hardware.
for i, x in enumerate([.276, .724]):
    cube(f'rear_service_door_{i}', (x, -.018, .342), (.435, .03, .42), 'teal', 'counter_cabinet', .009)
    cube(f'rear_door_handle_{i}', (x + (.16 if i == 0 else -.16), -.046, .43), (.018, .025, .13), 'brass', 'counter_cabinet', .004)
    cylinder(f'rear_hinge_{i}', (x + (-.18 if i == 0 else .18), -.039, .27), .014, .065, 'steel', 'counter_cabinet')
cube('brand_nameplate', (.5, 2.052, .745), (.60, .016, .18), 'teal', 'counter_signage', .012)
text('editable_brand_lettering', 'XTANCO', (.5, 2.063, .762), .072, 'brass', 'counter_signage')
text('editable_brand_subline', 'ADMIRA', (.5, 2.063, .705), .026, 'paper', 'counter_signage')

# Cash drawer and monitor remain separate semantic assemblies.
cube('cash_drawer_shell', (.52, .79, 1.09), (.62, .46, .09), 'black', 'cash_drawer', .012)
cube('cash_drawer_front', (.52, 1.024, 1.085), (.55, .016, .061), 'steel', 'cash_drawer', .005)
cube('cash_drawer_slot', (.52, 1.036, 1.106), (.39, .004, .008), 'rubber', 'cash_drawer', .001)
cylinder('cash_drawer_lock', (.69, 1.039, 1.078), .015, .009, 'black', 'cash_drawer', (math.pi / 2, 0, 0))
cube('tpv_weighted_base', (.50, .49, 1.154), (.35, .31, .038), 'black', 'pos_terminal', .012)
cube('tpv_pedestal', (.50, .43, 1.27), (.065, .072, .24), 'steel', 'pos_terminal', .012)
cylinder('tpv_hinge', (.50, .43, 1.373), .042, .20, 'black', 'pos_terminal', (0, math.pi / 2, 0))
cube('tpv_bezel', (.50, .46, 1.468), (.64, .076, .383), 'black', 'pos_terminal', .023)
screen_material = material('Media · replace with existing player', '#174b41', .3, base_map=display_map())
bpy.ops.mesh.primitive_plane_add(size=1, location=(.5, -.502, 1.475), rotation=(math.pi / 2, 0, 0))
screen = bpy.context.object
screen.name = 'screen_tpv_main'
screen.scale = (.585, .322, 1)
bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
move_to(screen, ASSET_COLLECTION)
screen.parent = PARTS['pos_terminal']
screen.data.materials.append(screen_material)
screen['mediaSurface'] = 'existing_shared_player'
screen['componentId'] = 'pos_terminal'
screen['placeholder'] = True
cylinder('tpv_status_led', (.762, .503, 1.301), .0055, .005, 'green', 'pos_terminal', (math.pi / 2, 0, 0))

# Low keyboard with a few individual rows is enough at the normal isometric view.
cube('keyboard_body', (.50, 1.32, 1.065), (.56, .21, .043), 'black', 'checkout_accessories', .012)
for row in range(3):
    for column in range(10):
        cube(f'keyboard_key_{row}_{column}', (.26 + column * .051, 1.25 + row * .048, 1.091), (.039, .032, .012), 'cream', 'checkout_accessories', .002)
cube('keyboard_spacebar', (.51, 1.405, 1.092), (.245, .029, .012), 'cream', 'checkout_accessories', .002)
cube('packing_mat', (.5, 1.74, 1.043), (.72, .30, .008), 'rubber', 'checkout_accessories', .009)

cube('card_terminal_base', (.838, 1.40, 1.08), (.19, .31, .072), 'black', 'payment_terminal', .014)
cube('card_terminal_screen', (.838, 1.337, 1.121), (.135, .108, .009), 'teal', 'payment_terminal', .005)
for row in range(3):
    for column in range(3):
        cube(f'card_key_{row}_{column}', (.784 + column * .053, 1.435 + row * .038, 1.121), (.035, .023, .009), 'cream', 'payment_terminal', .002)
cube('card_accept_key', (.91, 1.52, 1.121), (.019, .021, .008), 'green', 'payment_terminal', .003)
cube('receipt_printer_body', (.16, .65, 1.14), (.20, .26, .2), 'cream', 'receipt_printer', .018)
cube('receipt_printer_lid', (.16, .65, 1.241), (.183, .239, .015), 'black', 'receipt_printer', .008)
cube('receipt_output_slot', (.16, .771, 1.195), (.135, .012, .017), 'rubber', 'receipt_printer', .002)
receipt = cube('receipt_paper', (.16, .812, 1.20), (.115, .10, .002), 'paper', 'receipt_printer', 0)
receipt.rotation_euler.x = -.22
for index in range(4):
    cube(f'receipt_print_{index}', (.16, .790 + index * .012, 1.215 - index * .0025), (.077 - (index % 2) * .016, .002, .0008), 'black', 'receipt_printer', 0)


def studio_object(name, obj):
    obj.name = name
    move_to(obj, STUDIO_COLLECTION)
    return obj


# Render-only stage. Export selection below deliberately excludes this collection.
stage_mat = material('Studio · Warm neutral', '#dce0d7', .82)
bpy.ops.mesh.primitive_plane_add(size=200, location=(.5, -1, -.013))
stage = studio_object('studio_ground_not_exported', bpy.context.object)
stage.data.materials.append(stage_mat)
world = bpy.data.worlds.new('Studio soft environment')
SCENE.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = rgba('#e9eeea')
world.node_tree.nodes['Background'].inputs['Strength'].default_value = .45


def area_light(name, location, target, power, size, color):
    light = bpy.data.lights.new(name, 'AREA')
    light.energy = power
    light.shape = 'DISK'
    light.size = size
    light.color = rgba(color)[:3]
    obj = bpy.data.objects.new(name, light)
    STUDIO_COLLECTION.objects.link(obj)
    obj.location = location
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


area_light('studio_key', (2.8, -4.5, 5.2), (.5, -1, .7), 530, 4.0, '#ffe6c6')
area_light('studio_fill', (-3.5, -1.0, 3.2), (.5, -1, .8), 340, 3.3, '#daeaf8')
area_light('studio_rim', (2.0, 2.2, 4.0), (.5, -1, .8), 480, 2.3, '#fff0d9')
camera_data = bpy.data.cameras.new('Product orthographic')
camera = bpy.data.objects.new('Product orthographic', camera_data)
STUDIO_COLLECTION.objects.link(camera)
camera.location = (3.8, -5.3, 3.05)
target = Vector((.48, -1.01, .83))
camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 3.05
SCENE.camera = camera
SCENE.render.engine = 'BLENDER_EEVEE'
SCENE.render.resolution_x = max(256, min(2048, ARGS.resolution))
SCENE.render.resolution_y = SCENE.render.resolution_x
SCENE.render.resolution_percentage = 100
SCENE.render.image_settings.file_format = 'PNG'
SCENE.render.image_settings.color_mode = 'RGBA'
SCENE.render.film_transparent = False
SCENE.render.filepath = str(OUTPUT / f'{STEM}.png')
SCENE.render.threads_mode = 'FIXED'
SCENE.render.threads = 4
SCENE.view_settings.view_transform = 'AgX'
SCENE.view_settings.look = 'AgX - Medium High Contrast'

# Source is saved before export-time font conversion, preserving editable text
# and bevel modifiers. Packed images make this .blend self-contained.
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.object.select_all(action='DESELECT')
ROOT.select_set(True)
bpy.context.view_layer.objects.active = ROOT
bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT / f'{STEM}.blend'))
if not ARGS.skip_render:
    bpy.ops.render.render(write_still=True)

for obj in list(ASSET_COLLECTION.objects):
    if obj.type == 'FONT':
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.convert(target='MESH')

bpy.ops.object.select_all(action='DESELECT')
for obj in ASSET_COLLECTION.objects:
    obj.select_set(True)
bpy.context.view_layer.objects.active = ROOT
glb_path = OUTPUT / f'{STEM}.glb'
bpy.ops.export_scene.gltf(filepath=str(glb_path), export_format='GLB', use_selection=True,
    export_apply=True, export_yup=True, export_extras=True, export_cameras=False,
    export_lights=False, export_materials='EXPORT', export_image_format='AUTO')

depsgraph = bpy.context.evaluated_depsgraph_get()
points, triangles = [], 0
for obj in ASSET_COLLECTION.objects:
    if obj.type == 'MESH':
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        triangles += len(mesh.loop_triangles)
        points.extend(obj.matrix_world @ v.co for v in mesh.vertices)
        evaluated.to_mesh_clear()
minimum = [min(p[i] for p in points) for i in range(3)]
maximum = [max(p[i] for p in points) for i in range(3)]
gltf_min = [minimum[0], minimum[2], -maximum[1]]
gltf_max = [maximum[0], maximum[2], -minimum[1]]
manifest = {
    'schema_version': 1, 'asset_id': ASSET_ID, 'quality': ARGS.quality,
    'inventory_id': 'native:counter', 'inventory_number': 1,
    'status': 'interpreted_pilot_ready_for_review', 'blender_version': bpy.app.version_string,
    'reference': {'source': 'admira-xp/scripts/life-scene.mjs + current procedural Xtanco style',
                  'photos_used': [], 'real_measurements_used': [], 'measured': False},
    'units': {'authoring': 'uncalibrated_grid_units', 'meters_per_grid_unit': None,
              'gltf_note': 'glTF coordinates are conventionally meters; these authored values are NOT calibrated to a physical store.'},
    'config': CONFIG, 'detail_profile': PROFILE,
    'coordinates': {'blender': 'X=column, -Y=row, Z=height', 'gltf': 'X=column, Y=height, Z=row',
                    'pivot_gltf': [0, 0, 0], 'footprint_grid': [1, 2],
                    'bounds_gltf': {'min': gltf_min, 'max': gltf_max},
                    'placement': 'Parent under furniture:<layoutId>; apply live col/row, rot, sx/sy and flipX once. No additional Y-up rotation.'},
    'semantic_parts': list(PARTS), 'media_surfaces': ['screen_tpv_main'],
    'behavior': 'No simulation, collision, navigation, media owner or interaction code is included.',
    'files': {'source': f'{STEM}.blend', 'web': f'{STEM}.glb',
              'preview': None if ARGS.skip_render else f'{STEM}.png'},
    'counts': {'mesh_objects': sum(o.type == 'MESH' for o in ASSET_COLLECTION.objects),
               'evaluated_triangles': triangles, 'glb_bytes': glb_path.stat().st_size},
    'export': {'format': 'GLB', 'compression': 'none', 'images': 'embedded',
               'studio_cameras_lights_exported': False, 'source_editable': True},
    'limitations': ['Interpretation only; no authenticated store measurements or product photos.',
                   'Profiles good/better/best are asset detail labels, not literal 8/16/32-bit color modes.',
                   'Connected to editable Better/Best; design pending user review.',
                   'PBR export and studio preview do not guarantee identical lighting in WebGL.'],
}
(OUTPUT / f'{STEM}.manifest.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
print('XPACIOS_EXPORT ' + json.dumps({'output': str(OUTPUT), **manifest['files'], 'triangles': triangles, 'bytes': glb_path.stat().st_size, 'bounds_gltf': manifest['coordinates']['bounds_gltf']}))
