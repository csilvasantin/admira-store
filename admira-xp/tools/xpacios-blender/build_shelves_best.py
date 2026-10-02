"""Best #2, a detailed interpretation of the existing Xtanco shelf.

Blender --background --factory-startup --python-exit-code 1 --python this.py --
  --output inventario/assets/catalog/02 --resolution 1000
Only best.* and best-textures/ are written. Good and Better stay untouched.
Grid coordinates, not surveyed dimensions. Front +X, footprint 1x2.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector

p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--output', required=True)
p.add_argument('--resolution', type=int, default=1000)
p.add_argument('--skip-render', action='store_true')
args = p.parse_args(sys.argv[sys.argv.index('--') + 1:])
out = Path(args.output).resolve()
out.mkdir(parents=True, exist_ok=True)
textures = out / 'best-textures'
textures.mkdir(exist_ok=True)
baseline = {f.name: hashlib.sha256(f.read_bytes()).hexdigest()
            for tier in ('good', 'better') for f in out.glob(tier + '.*')}
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
asset = bpy.data.collections.new('ASSET · Estantería 02 Best')
scene.collection.children.link(asset)
root = bpy.data.objects.new('inventory_2', None)
asset.objects.link(root)
root['inventoryId'] = 'native:shelves'
root['inventoryNumber'] = 2
root['quality'] = 'best'
root['revision'] = 'shelves-best-20261002-1'
root['units'] = 'uncalibrated_grid_units'
root['referenceStatus'] = 'interpreted_not_measured'
scene['description'] = 'Best shelf design interpretation. Physical measurements not provided.'


def colour(value):
    rgb = [int(value.lstrip('#')[i:i+2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb) + (1,)


def image(name, pixels, noncolour=False):
    height, width = pixels.shape[:2]
    im = bpy.data.images.new(name, width, height, alpha=True)
    if noncolour:
        im.colorspace_settings.name = 'Non-Color'
    im.pixels.foreach_set(np.ascontiguousarray(pixels, dtype=np.float32).ravel())
    im.filepath_raw = str(textures / (name + '.png'))
    im.file_format = 'PNG'
    im.save()
    im.pack()
    return im


def rgba_array(rgb):
    return np.concatenate([rgb, np.ones((*rgb.shape[:2], 1))], axis=-1)


# Baked maps: portable glTF PBR, no procedural shader required in the browser.
n = 1024
yy, xx = np.mgrid[0:n, 0:n] / n
rng = np.random.default_rng(20021002)
warp = yy + .011*np.sin(xx*13) + .006*np.sin(xx*31+yy*7)
grain = (.45*np.sin(warp*530 + 3*np.sin(xx*8)) +
         .18*np.sin(warp*1500) + .12*np.sin(warp*2600))
pores = rng.normal(0, .1, (n, n))
base = np.array([.60, .40, .23])
wood_rgb = np.clip(base[None, None, :] + (grain*.085 + .026*np.sin(warp*190) + pores*.018)[..., None], 0, 1)
oak_color = image('oak-colour', rgba_array(wood_rgb))
height = grain*.28 + pores*.04
gy, gx = np.gradient(height)
normal = np.stack([-gx*4, -gy*4, np.ones_like(gx)], axis=-1)
normal /= np.linalg.norm(normal, axis=-1)[..., None]
oak_normal = image('oak-normal', rgba_array(normal*.5+.5), True)
rough = np.clip(.48 + grain*.05 + pores*.06, .34, .65)
oak_rough = image('oak-roughness', rgba_array(np.repeat(rough[..., None], 3, axis=-1)), True)

# A compact label atlas, with original generic graphics and readable bitmap type.
glyphs = {
 'A':['01110','10001','10001','11111','10001','10001','10001'],
 'C':['01111','10000','10000','10000','10000','10000','01111'],
 'D':['11110','10001','10001','10001','10001','10001','11110'],
 'E':['11111','10000','10000','11110','10000','10000','11111'],
 'F':['11111','10000','10000','11110','10000','10000','10000'],
 'I':['11111','00100','00100','00100','00100','00100','11111'],
 'L':['10000','10000','10000','10000','10000','10000','11111'],
 'M':['10001','11011','10101','10101','10001','10001','10001'],
 'O':['01110','10001','10001','10001','10001','10001','01110'],
 'R':['11110','10001','10001','11110','10100','10010','10001'],
 'S':['01111','10000','10000','01110','00001','00001','11110'],
 'T':['11111','00100','00100','00100','00100','00100','00100'],
 '0':['01110','10011','10101','10101','11001','10001','01110'],
 '2':['01110','10001','00001','00010','00100','01000','11111']}
atlas = np.ones((768, 512, 4), dtype=np.float32)
ink = np.array([.12, .23, .22, 1])
def pixels_text(canvas, text, x, y, scale=3, color=ink):
    for char in text:
        for row, bits in enumerate(glyphs.get(char, ['00000']*7)):
            for col, bit in enumerate(bits):
                if bit == '1':
                    canvas[y+row*scale:y+(row+1)*scale, x+col*scale:x+(col+1)*scale] = color
        x += 6*scale
for index, word in enumerate(['CAFE', 'TE', 'CACAO', 'SELECT', 'CAFE', 'TE']):
    tile = atlas[index//2*256:(index//2+1)*256, index%2*256:(index%2+1)*256]
    tile[:] = [.93, .89, .79, 1]
    tile[12:18, 12:244] = ink
    tile[228:234, 12:244] = ink
    pixels_text(tile, 'ADMIRA', 74, 32, 3)
    # Stylised leaf/bean emblem with a fine brass border.
    cy, cx = np.mgrid[0:256, 0:256]
    mask = ((cx-128)/30)**2 + ((cy-111)/39)**2 < 1
    tile[mask] = ink
    tile[80:140, 125:129] = [.80, .64, .36, 1]
    pixels_text(tile, word, (256-len(word)*24)//2, 166, 4)
    pixels_text(tile, '02', 108, 205, 3)
    tile[:] = tile[::-1].copy()
labels = image('selection-label-atlas', atlas)


def material(name, hexcolor, rough=.5, metal=0, wood=False, label=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.diffuse_color = colour(hexcolor)
    nodes, links = m.node_tree.nodes, m.node_tree.links
    bsdf = nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = colour(hexcolor)
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    if wood:
        c = nodes.new('ShaderNodeTexImage'); c.image = oak_color
        r = nodes.new('ShaderNodeTexImage'); r.image = oak_rough
        normal_tex = nodes.new('ShaderNodeTexImage'); normal_tex.image = oak_normal
        normal_node = nodes.new('ShaderNodeNormalMap'); normal_node.inputs['Strength'].default_value = .22
        links.new(c.outputs['Color'], bsdf.inputs['Base Color'])
        links.new(r.outputs['Color'], bsdf.inputs['Roughness'])
        links.new(normal_tex.outputs['Color'], normal_node.inputs['Color'])
        links.new(normal_node.outputs['Normal'], bsdf.inputs['Normal'])
    if label:
        c = nodes.new('ShaderNodeTexImage'); c.image = labels
        links.new(c.outputs['Color'], bsdf.inputs['Base Color'])
    return m


oak = material('Oak · grain and satin finish', '#a17543', wood=True)
teal = material('Teal · satin lacquer', '#254b47', .32)
walnut = material('Walnut · recessed plinth', '#3d2b20', .45)
brass = material('Brass · shelf edge and fittings', '#b89a5f', .3, .8)
steel = material('Steel · pins and screws', '#899391', .27, .88)
shadow = material('Recess · dark pin holes', '#202b2a', .85)
labelmat = material('Printed paper · selection labels', '#efe6ce', .77, label=True)
glass = material('Amber glass · bottles', '#3e2314', .18, .05)
paper = [material(name, color, .62) for name, color in [
    ('Pack · forest', '#294b43'), ('Pack · cream', '#ddd5bd'),
    ('Pack · terracotta', '#af674a'), ('Pack · indigo', '#405965'),
    ('Pack · ochre', '#b59753'), ('Pack · sage', '#83907a')]]


def xyz(u, y, v):
    # Local shelf width u -> -row; frontage/depth v -> column.
    return (v, u-2, y)


def part(o, name, finish, component):
    o.name = name
    for c in list(o.users_collection):
        c.objects.unlink(o)
    asset.objects.link(o)
    o.parent = root
    o['componentId'] = component
    o.data.materials.append(finish)
    return o


def box(name, u, y, v, width, height, depth, finish, component, bevel=.006):
    bpy.ops.mesh.primitive_cube_add(size=1, location=xyz(u, y, v))
    o = part(bpy.context.object, name, finish, component)
    o.scale = (depth, width, height)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        mod = o.modifiers.new('Manufactured soft edge', 'BEVEL')
        mod.width = min(bevel, min(width, height, depth)*.23)
        mod.segments = 3
        mod.harden_normals = True
        mod = o.modifiers.new('Weighted panel normals', 'WEIGHTED_NORMAL')
        mod.keep_sharp = True
    # Per-face UVs, long grain along the panel's longest dimension.
    uv = o.data.uv_layers.active
    for poly in o.data.polygons:
        normal_axis = max(range(3), key=lambda k: abs(poly.normal[k]))
        axes = sorted([k for k in range(3) if k != normal_axis],
                      key=lambda k: (depth, width, height)[k], reverse=True)
        for loop in poly.loop_indices:
            co = o.data.vertices[o.data.loops[loop].vertex_index].co
            uv.data[loop].uv = (co[axes[0]]*.8 + .5, co[axes[1]]*1.7 + .5)
    return o


def rod(name, a, b, radius, finish, component, segments=20):
    av, bv = Vector(xyz(*a)), Vector(xyz(*b))
    delta = bv-av
    bpy.ops.mesh.primitive_cylinder_add(vertices=segments, radius=radius,
                                       depth=delta.length, location=(av+bv)/2)
    o = part(bpy.context.object, name, finish, component)
    o.rotation_euler = delta.to_track_quat('Z', 'Y').to_euler()
    for poly in o.data.polygons:
        poly.use_smooth = len(poly.vertices) == 4
    return o


def decal(name, u, y, v, width, height, tile, component):
    # Quad facing +X, with the six atlas labels mapped independently.
    verts = [xyz(u-width/2,y-height/2,v), xyz(u+width/2,y-height/2,v),
             xyz(u+width/2,y+height/2,v), xyz(u-width/2,y+height/2,v)]
    mesh = bpy.data.meshes.new(name); mesh.from_pydata(verts, [], [(0,1,2,3)]); mesh.update()
    o = bpy.data.objects.new(name, mesh); asset.objects.link(o); o.parent = root
    o.data.materials.append(labelmat); o['componentId'] = component
    uv = mesh.uv_layers.new(name='UVMap')
    x, y0 = tile%2*.5, tile//2/3
    for i, (du,dv) in enumerate([(0,0),(.5,0),(.5,1/3),(0,1/3)]):
        uv.data[i].uv = (x+du, y0+dv)
    return o


# Carcass: same silhouette, footprint and five shelves as the previous asset.
box('Plinth · recessed walnut', 1,.090,.48, 1.98,.084,.96,walnut,'plinth',.012)
for u in (.15,1.85):
    for v in (.15,.85):
        rod('Levelling foot', (u,.003,v),(u,.047,v),.055,shadow,'levelling-feet')
box('Back · recessed teal panel',1,1.10,.042,1.90,2.04,.055,teal,'back-panel')
for u in (.035,1.965):
    box('Oak side · solid panel',u,1.107,.50,.07,2.214,1,oak,'side-panels',.01)
    box('Side inset · teal spine',u,1.10,.14,.074,1.84,.017,teal,'side-inlays',.002)
# Framed inset panels expose the side construction from every viewing angle.
for u in (.001,1.999):
    for v in (.075,.925):
        box('Side frame · upright',u,1.105,v,.016,2.14,.075,oak,'side-joinery',.004)
    for y in (.074,2.095):
        box('Side frame · cross rail',u,y,.50,.016,.075,.925,oak,'side-joinery',.004)
    box('Side frame · raised inset',u,1.10,.50,.008,1.87,.74,oak,'side-joinery',.003)
box('Crown · oak undercut',1,2.124,.50,2.065,.044,1.045,oak,'crown',.008)
box('Crown · rounded teal cap',1,2.170,.50,2.065,.13,1.045,teal,'crown',.015)
box('Crown · brass reveal',1,2.095,1.020,2.00,.012,.012,brass,'crown',.002)
# An editable header, visible from the front, without a raster billboard.
curve = bpy.data.curves.new('Selection lettering', 'FONT')
curve.body = 'SELECCIÓN'; curve.align_x = 'CENTER'; curve.align_y = 'CENTER'
curve.size = .072; curve.extrude = .0008; curve.bevel_depth = .0003
header = bpy.data.objects.new('Header · SELECCIÓN', curve); asset.objects.link(header)
header.parent = root; header.location = xyz(1,2.172,1.024)
header.rotation_euler = (math.pi/2,0,math.pi/2)
curve.materials.append(brass); header['componentId'] = 'header-lettering'

for level in range(5):
    y = .14+level*.41
    box('Shelf %d · solid oak'%level,1,y,.51,1.94,.066,.94,oak,'shelf-%d'%level,.007)
    box('Shelf %d · folded brass nose'%level,1,y-.017,.991,1.91,.041,.018,brass,'shelf-rail-%d'%level,.002)
    box('Shelf %d · label recess'%level,1,y-.019,1.002,1.87,.024,.004,shadow,'shelf-rail-%d'%level,.0007)
    for u in (.09,1.91):
        for v in (.24,.79):
            rod('Shelf support pin',(u-.015,y-.045,v),(u+.015,y-.045,v),.009,steel,'support-pins')
    # Nine arranged products; each remains a separate editable source group.
    for j in range(9):
        u = .15+j*.2125
        v = .855-(.012 if j%3==1 else 0)
        base_y = y+.034
        tile = (j+level)%6
        component = 'product-%d-%d'%(level,j)
        group = bpy.data.objects.new(component, None); asset.objects.link(group); group.parent = root
        objects_before = set(asset.objects)
        if level in (0,3) and j%3==0:
            # Turned bottle silhouette: punt, shoulder, neck, lip and cap.
            profile = [(0,.031),(.009,.048),(.022,.055),(.17,.055),(.20,.052),
                       (.23,.037),(.244,.023),(.285,.023),(.289,.029)]
            vertices = [xyz(u+radius*math.cos(a*2*math.pi/32),base_y+h,
                            v+radius*math.sin(a*2*math.pi/32))
                        for h,radius in profile for a in range(32)]
            faces = [(r*32+a,r*32+(a+1)%32,(r+1)*32+(a+1)%32,(r+1)*32+a)
                     for r in range(len(profile)-1) for a in range(32)]
            faces += [tuple(reversed(range(32))),tuple((len(profile)-1)*32+a for a in range(32))]
            faces = [tuple(reversed(f)) for f in faces]
            mesh = bpy.data.meshes.new(component); mesh.from_pydata(vertices,[],faces); mesh.update()
            o = bpy.data.objects.new('Bottle · shoulder and punt',mesh); asset.objects.link(o)
            o.parent = root; o.data.materials.append(glass); o['componentId']=component
            for f in mesh.polygons:f.use_smooth=len(f.vertices)==4
            rod('Bottle cap',(u,base_y+.282,v),(u,base_y+.307,v),.029,brass,component,32)
            for h in (.288,.296,.302):
                rod('Cap knurled band',(u,base_y+h-.001,v),(u,base_y+h+.001,v),.030,walnut,component,32)
            decal('Bottle front label',u,base_y+.122,v+.056,.078,.096,tile,component)
        elif (j+level)%3==1:
            # Pouch: folded shoulders and heat seal above the convex packet.
            finish=paper[tile]
            box('Pouch · filled body',u,base_y+.137,v,.157,.256,.103,finish,component,.018)
            box('Pouch · folded shoulder',u,base_y+.263,v,.140,.030,.059,finish,component,.012)
            box('Pouch · sealed top',u,base_y+.285,v,.142,.019,.015,finish,component,.003)
            box('Pouch · lower gusset',u,base_y+.016,v,.151,.024,.105,finish,component,.009)
            decal('Pouch printed label',u,base_y+.140,v+.053,.108,.146,tile,component)
            for du in (-.062,.062):
                box('Pouch edge seam',u+du,base_y+.15,v+.045,.004,.20,.009,finish,component,.001)
        else:
            finish=paper[tile];height=.286+(.017 if j%2 else 0)
            box('Carton · folded body',u,base_y+height/2,v,.15,height,.118,finish,component,.004)
            box('Carton · lid lip',u,base_y+height-.013,v+.061,.143,.008,.005,walnut,component,.001)
            box('Carton · back seam',u,base_y+height/2,v-.060,.008,height-.024,.003,finish,component,.0005)
            decal('Carton printed label',u,base_y+height*.50,v+.060,.119,.168,tile,component)
        for o in set(asset.objects)-objects_before:
            if o != group:
                world=o.matrix_world.copy();o.parent=group;o.matrix_world=world
        # Small independent price/identification cards in the brass rail.
        decal('Shelf card',u,y-.019,1.005,.070,.019,tile,'shelf-labels')

# Pin-hole ladder and visible cabinet joinery, including the back face.
for u in (.075,1.925):
    for v in (.23,.78):
        for h in range(9,71):
            y=h*.028
            rod('Adjustable shelf pin hole',(u-.0008,y,v),(u+.0008,y,v),.0031,shadow,'pin-hole-ladders',12)
for u in (.09,1.91):
    for y in (.20,1.06,2.00):
        rod('Back fixing screw',(u,y,.009),(u,y,.004),.009,steel,'back-fixings')
        box('Screw slot',u,y,.003,.012,.0019,.0014,shadow,'back-fixings',0)
for u in (.10,1.90):
    box('Rear oak stile',u,1.11,.006,.06,2.07,.012,oak,'rear-joinery',.003)
for y in (.11,2.09):
    box('Rear oak cross rail',1,y,.005,1.78,.045,.014,oak,'rear-joinery',.003)

bpy.context.view_layer.update()
points=[o.matrix_world@Vector(v) for o in asset.objects if o.type=='MESH' for v in o.bound_box]
lo=[min(p[i] for p in points) for i in range(3)]
hi=[max(p[i] for p in points) for i in range(3)]
source_meshes=sum(o.type=='MESH' for o in asset.objects)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(out/'best.blend'),compress=True)

# Bounded web draw calls: source parts stay editable, web parts join by finish.
for o in list(asset.objects):
    if o.type=='FONT':
        bpy.ops.object.select_all(action='DESELECT');o.select_set(True)
        bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
groups={}
for o in list(asset.objects):
    if o.type=='MESH':
        groups.setdefault(o.data.materials[0].name,[]).append(o)
for group in groups.values():
    for o in group:
        bpy.context.view_layer.objects.active=o
        for mod in list(o.modifiers):
            bpy.ops.object.modifier_apply(modifier=mod.name)
        world=o.matrix_world.copy();o.parent=root;o.matrix_world=world
    bpy.ops.object.select_all(action='DESELECT')
    for o in group:o.select_set(True)
    bpy.context.view_layer.objects.active=group[0]
    if len(group)>1:bpy.ops.object.join()
for o in list(asset.objects):
    if o.type=='EMPTY' and o!=root:bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.object.select_all(action='DESELECT')
for o in asset.objects:o.select_set(True)
bpy.context.view_layer.objects.active=root
bpy.ops.export_scene.gltf(filepath=str(out/'best.glb'),export_format='GLB',use_selection=True,
    export_apply=True,export_yup=True,export_extras=True,export_cameras=False,export_lights=False)
manifest={
    'schema_version':1,'inventory_id':'native:shelves','inventory_number':2,'name':'Estantería',
    'quality':'best','revision':root['revision'],'blender_version':bpy.app.version_string,
    'reference':'admira-xp/scripts/life-scene.mjs · shelf silhouette and palette',
    'measured':False,'source_editable':True,'full_volume':True,'footprint':[1,2],
    'front_gltf':'+X','shelf_levels':5,'display_products':45,
    'source_meshes':source_meshes,'web_meshes':sum(o.type=='MESH' for o in asset.objects),
    'bounds_gltf':{'min':[lo[0],lo[2],-hi[1]],'max':[hi[0],hi[2],-lo[1]]},
    'detail':['baked oak colour/normal/roughness','recessed back and rear joinery',
              'levelling feet','shelf supports and pin-hole ladders','brass label rails',
              'folded cartons and sealed pouches','turned bottles and cap bands','printed label atlas'],
    'files':{'source':'best.blend','web':'best.glb','preview':'best-preview.png'},
    'bytes':(out/'best.glb').stat().st_size,'preserved_profiles_sha256':baseline}
(out/'best.manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
assert all(hashlib.sha256((out/f).read_bytes()).hexdigest()==h for f,h in baseline.items())

if not args.skip_render:
    # Studio is added after GLB/source export and never becomes furniture.
    scene.render.engine='CYCLES';scene.cycles.samples=40
    scene.cycles.use_denoising=True
    scene.render.resolution_x=scene.render.resolution_y=args.resolution
    scene.render.resolution_percentage=100
    scene.world = bpy.data.worlds.new('Studio world')
    scene.world.color=(.32,.32,.32)
    scene.view_settings.view_transform='AgX'
    bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.008))
    floor=bpy.context.object;floor.name='STUDIO floor'
    floor.data.materials.append(material('Studio cream','#deded3',.85))
    target=Vector((.52,-1,1.08))
    for name,loc,power,size in [('Key',(4,-3,5),650,4),('Fill',(-2,-4,3),360,3),('Rim',(1,2,4),500,2.5)]:
        bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name='STUDIO '+name
        o.data.energy=power;o.data.shape='DISK';o.data.size=size
        o.rotation_euler=(target-o.location).to_track_quat('-Z','Y').to_euler()
    bpy.ops.object.camera_add(location=(4.3,-4.8,3.1))
    cam=bpy.context.object;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.type='ORTHO';cam.data.ortho_scale=3.55;scene.camera=cam
    scene.render.filepath=str(out/'best-preview.png');bpy.ops.render.render(write_still=True)
print('SHELVES_BEST_EXPORTED',json.dumps({'bytes':manifest['bytes'],'source_meshes':source_meshes,
                                       'web_meshes':manifest['web_meshes'],'bounds':manifest['bounds_gltf']}),flush=True)
