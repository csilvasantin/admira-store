"""Photo-inspired modular display. Run with Blender --background --python.

Local studio package is metres, Z-up in Blender, Y-up in glTF.
Every composition item has a stable root. Counts are visual, never stock.
"""
import bpy, math, json, sys, os, hashlib
from pathlib import Path
from mathutils import Vector
BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE / 'source'))
from products import make_product, PRODUCT_TYPES

bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1.0
OUT = BASE / 'assets'; OUT.mkdir(exist_ok=True)
SKUOUT = OUT / 'products'; SKUOUT.mkdir(exist_ok=True)

def material(name, color, metal=0, rough=.5):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value=(*color,1)
    p.inputs['Metallic'].default_value=metal; p.inputs['Roughness'].default_value=rough
    return m
steel=material('Brushed graphite steel',(.19,.21,.21),.7,.35)
meshmat=material('Dark expanded steel',(.045,.054,.049),.65,.55)
black=material('Rubber feet',(.023,.028,.024),0,.86)
wood=material('Honey oak',(.66,.39,.16),0,.43)
# A portable base-colour texture; no unsupported procedural-only nodes.
import numpy as np
size=512; xx,yy=np.meshgrid(np.arange(size),np.arange(size))
rng=np.random.default_rng(4708)
grain=np.sin(xx*.18+np.sin(yy*.018)*2.8)+.3*np.sin(xx*.79+yy*.013)
value=grain*.018+rng.normal(0,.007,(size,size))
rgba=np.ones((size,size,4),dtype=np.float32)
rgba[:,:,:3]=np.clip(np.array([.74,.51,.28])+value[:,:,None],0,1)
im=bpy.data.images.new('Oak grain • embedded',size,size)
im.pixels.foreach_set(rgba.ravel()); im.pack()
tex=wood.node_tree.nodes.new('ShaderNodeTexImage'); tex.image=im
wood.node_tree.links.new(tex.outputs['Color'],wood.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
cab=bpy.data.objects.new('CI_CABINET',None); bpy.context.collection.objects.link(cab)
cab['component_id']='cabinet'; cab['label']='Expositor de café · estructura'; cab['category']='mobiliario'
cab['inventoryId']='native:starbucksShelves'; cab['inventoryNumber']=47
cab['itil_code']='PDG103-EST-01'; cab['geometry_basis']='photo interpretation; nominal dimensions; unmeasured'

def box(name,loc,dim,mat,parent=cab,bevel=.002):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc); ob=bpy.context.object; ob.name=name
    ob.dimensions=dim; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    ob.data.materials.append(mat); ob.parent=parent
    if bevel:
        mod=ob.modifiers.new('Soft manufactured edges','BEVEL'); mod.width=bevel; mod.segments=2
        bpy.context.view_layer.objects.active=ob; bpy.ops.object.modifier_apply(modifier=mod.name)
    return ob

def cylinder(name,loc,radius,depth,mat,rotate=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16,radius=radius,depth=depth,location=loc,rotation=rotate)
    ob=bpy.context.object; ob.name=name; ob.data.materials.append(mat); ob.parent=cab
    return ob

W,H,D=2.12,2.18,.46
levels=[.125,.535,.945,1.355,1.765]
for x in [-1.0375,0,1.0375]:
    for y in [-.215,.215]:
        box(f'Frame_post_{x}_{y}',(x,y,H/2),(.045,.045,H),steel)
        box('Adjustable rubber foot',(x,y,.02),(.05,.05,.04),black,bevel=.004)
for z in levels+[H-.015]:
    for y in [-.215,.215]:
        box(f'Crossbeam_{z}_{y}',(0,y,z-.025),(W,.046,.04),steel)
    for x in [-1.0375,0,1.0375]:
        box('Side tie',(x,0,z-.025),(.045,D,.04),steel)
        cylinder('Flush frame fastener',(x,-.242,z-.025),.006,.003,meshmat,(math.pi/2,0,0))
for i,z in enumerate(levels):
    for bay,x in enumerate([-.52,.52]):
        board=box(f'Shelf_{i+1}_bay_{bay+1}',(x,0,z-.012),(.986,.416,.024),wood,bevel=.004)
        board['shelf']=i+1; board['bay']=bay+1
        box('Oak tray front lip',(x,-.203,z+.009),(.986,.012,.022),wood)
        for edge in [x-.487,x+.487]:
            box('Oak tray side lip',(edge,0,z+.009),(.014,.416,.022),wood)
# Expanded metal back panels, actual open geometry. Batched into two meshes.
def wire_panel(center):
    verts=[]; faces=[]; xmin,xmax=center-.487,center+.487; zmin,zmax=.14,2.12
    def strand(x1,z1,x2,z2):
        a=Vector((x1,.208,z1)); b=Vector((x2,.208,z2)); d=(b-a).normalized()
        normal=Vector((-d.z,0,d.x))*.0010; thick=Vector((0,.001,0)); start=len(verts)
        verts.extend([tuple(p) for p in [a-normal-thick,a+normal-thick,b+normal-thick,b-normal-thick,a-normal+thick,a+normal+thick,b+normal+thick,b-normal+thick]])
        faces.extend([tuple(start+j for j in f) for f in [(0,1,2,3),(4,7,6,5),(0,4,5,1),(1,5,6,2),(2,6,7,3),(3,7,4,0)]])
    for slope in [-1.2,1.2]:
        for intercept in np.arange(zmin-1.4,zmax+1.4,.043):
            candidates=[]
            for x in [xmin,xmax]:
                z=slope*(x-center)+intercept
                if zmin<=z<=zmax: candidates.append((x,z))
            for z in [zmin,zmax]:
                x=center+(z-intercept)/slope
                if xmin<=x<=xmax: candidates.append((x,z))
            if len(candidates)>=2: strand(*candidates[0],*candidates[1])
    me=bpy.data.meshes.new('Expanded mesh'); me.from_pydata(verts,[],faces); me.materials.append(meshmat)
    ob=bpy.data.objects.new('Diamond steel backing',me); bpy.context.collection.objects.link(ob); ob.parent=cab
wire_panel(-.52); wire_panel(.52)

items=[]; roots=[]; cache={}
definitions={(d['kind'],d['variant']):d for d in PRODUCT_TYPES}
def add(kind,variant,x,y,level,rotation=0):
    key=(kind,variant); sku=f'{kind}-{variant}'; number=len(items)+1
    name=f'CI_{number:03d}_{sku.replace("-","_")}'
    # Shared mesh data and materials for repeats, independent transforms/roots.
    if key in cache:
        original=cache[key]; root=original.copy(); root.name=name; bpy.context.collection.objects.link(root)
        def clone_children(old,new):
            for child in old.children:
                c=child.copy(); c.name=name+'_'+child.name.split('_',2)[-1]; bpy.context.collection.objects.link(c); c.parent=new
                clone_children(child,c)
        clone_children(original,root)
        root.location=(x,y,levels[level-1]); root.rotation_euler=(0,0,rotation)
    else:
        root=make_product(kind,variant,name,position=(x,y,levels[level-1]),rotation=rotation)
        cache[key]=root
    definition=definitions[key]
    root['component_id']=f'47-P{number:03d}'; root['parent_ci']='PDG103-EST-01'; root['numeric_id']=number
    root['visual_only']=True; root['shelf']=level; root['bay']=1 if x<0 else 2
    items.append({'id':f'47-P{number:03d}','numeric_id':number,'node':name,'sku':sku,'label':definition['label'],'category':definition['category'],'shelf':level,'bay':1 if x<0 else 2,'position':[x,levels[level-1],-y],'asset':f'assets/products/{sku}.glb','stock_verified':False})
    roots.append(root)

# Coffee shelf: full bags on the left and right, individual stacked boxes.
for x,var in zip([-.935,-.80,-.665,-.53,-.395,-.26,-.125],['kati','pike','kati','guatemala','guatemala','guatemala','ethiopia']): add('coffee',var,x,.005,5)
for x,var in zip([.125,.26,.395,.53],['verona','verona','iced','iced']): add('coffee',var,x,.005,5)
for column,var in enumerate(['red','red','yellow','yellow','black','black']):
    for row in range(4):
        add('coffee_box',var,.632+column*.063,-.11,5)
        root=roots[-1]; root.location.z += row*.067
        items[-1]['position'][1]+=row*.067

# Boxed collection and clear red-lid tumblers.
for x in [-.935,-.825,-.715,-.235,-.125,.125,.235,.345,.825,.935]: add('cold_cup','crimson',x,-.09,4)
for x in [-.55,-.39,.51,.67]:
    add('mug','city_box',x,-.09,4)
    add('mug','city_box',x,-.09,4)
    roots[-1].location.z+=.125; items[-1]['position'][1]+=.125

# Feature shelf: orange ceramic, green fluted steel and scale glaze.
for x in [-.88,-.70,-.52]: add('mug','pumpkin',x,-.115,3)
for x in [-.86,-.67]: add('mug','pumpkin',x,.075,3)
for x,var in zip([-.32,-.19,-.06],['emerald','ribbed','emerald']): add('thermos',var,x,-.1,3)
for x in [-.32,-.15]: add('cold_cup','emerald',x,.055,3)
for x,var in zip([.12,.25,.38,.70,.83,.95],['emerald','emerald','ribbed','gold_rim','gold_rim','emerald']): add('thermos',var,x,-.10,3)
add('mug','scale_green',.52,-.125,3); add('mug','scale_green',.52,-.125,3)
roots[-1].location.z+=.084; items[-1]['position'][1]+=.084
for x in [.15,.36,.73,.93]: add('cold_cup','emerald',x,.07,3)

# Lower two shelves: distinct designs, repeated independently like the photo.
for level in [1,2]:
    for bay,center in [(1,-.52),(2,.52)]:
        variants=['confetti','checker','wave','clear'] if bay==1 else ['clear','confetti','checker','checker']
        for slot,var in enumerate(variants): add('cold_cup',var,center-.39+slot*.245,.08,level)
        for slot in range(5):
            x=center-.39+slot*.185
            if slot in [0,1] and (bay==1 and level==2 or bay==2 and level==1):
                add('mug','white_green',x,-.125,level)
            elif slot==2:
                add('mug','black' if bay==2 else 'scale_green',x,-.125,level)
            elif slot==3:
                add('travel_mug','band_green',x,-.125,level)
            else: add('travel_mug','lid_green',x,-.125,level)
        add('thermos','blackgreen',center+.10,.015,level)

def select_tree(root):
    root.select_set(True)
    for ob in root.children_recursive: ob.select_set(True)

export_options=dict(export_format='GLB',export_extras=True,export_yup=True,export_cameras=False,export_lights=False,export_animations=False,export_materials='EXPORT')
def export(path,selected=False):
    bpy.ops.export_scene.gltf(filepath=str(path),use_selection=selected,**export_options)

# Standalone product roots use the exact same geometry and material library.
skus=[]
for key,root in cache.items():
    oldloc=root.location.copy(); oldrot=root.rotation_euler.copy()
    root.location=(0,0,0); root.rotation_euler=(0,0,0)
    bpy.ops.object.select_all(action='DESELECT'); select_tree(root)
    slug='-'.join(key); export(SKUOUT/f'{slug}.glb',True)
    d=definitions[key]
    skus.append({'sku':slug,'kind':key[0],'variant':key[1],'label':d['label'],'category':d['category'],'asset':f'assets/products/{slug}.glb','count':sum(i['sku']==slug for i in items)})
    root.location=oldloc; root.rotation_euler=oldrot

bpy.ops.object.select_all(action='DESELECT'); select_tree(cab)
export(OUT/'cabinet-empty.glb',True)
bpy.ops.object.select_all(action='DESELECT'); select_tree(cab)
for root in roots: select_tree(root)
export(OUT/'coffee-display.glb',True)

inventory={'schema':'xpaceos.starbucks.display-parts/1','id':'native:starbucksShelves','asset_number':47,'itil_code':'PDG103-EST-01','instance_id':'sb-mugs','name':'Expositor de café · colección separable','description':'Interpretación 3D de fotografía: cinco niveles, dos módulos, productos individuales.','dimensions':{'width':W,'height':H,'depth':D,'unit':'m','basis':'nominal_unmeasured'},'shelf_count':5,'bay_count':2,'composition_only':True,'items':items,'skus':skus,'assets':{'assembly':'assets/coffee-display.glb','cabinet':'assets/cabinet-empty.glb','source':'assets/coffee-display.blend'},'source_note':'Las cantidades representan la composición visual, no stock real ni nuevas altas ITIL.','source_note_en':'Counts describe the visual composition, not verified stock or new ITIL registrations.'}
(BASE/'inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'coffee-display.blend'))

# Catalog coordinates preserve the existing model 47 floor grid and orientation:
# Blender +X = depth, -Y = width; front faces +X in Three. Anchor x,z=0.
bpy.context.view_layer.update()
points=[ob.matrix_world@Vector(corner) for root in [cab]+roots for ob in root.children_recursive if ob.type in {'MESH','CURVE','FONT'} for corner in ob.bound_box]
bounds=[(min(p[i] for p in points),max(p[i] for p in points)) for i in range(3)]
scale=(3.04/(bounds[0][1]-bounds[0][0]),.93/(bounds[1][1]-bounds[1][0]),2.53/(bounds[2][1]-bounds[2][0]))
offset=(scale[1]*bounds[1][1],-scale[0]*bounds[0][1],-scale[2]*bounds[2][0])
inventory['catalog_transform']={'scale_blender':list(scale),'translation_blender':list(offset),'rotation_z_degrees':90,'source_bounds_blender':bounds,'target_bounds_gltf':[[0,.93],[0,2.53],[0,3.04]]}
(BASE/'inventory.json').write_text(json.dumps(inventory,ensure_ascii=False,indent=2))
catalogroot=bpy.data.objects.new('StarbucksShelves_47',None); bpy.context.collection.objects.link(catalogroot)
catalogroot['inventoryId']='native:starbucksShelves'; catalogroot['inventoryNumber']=47
catalogroot['parent_ci']='PDG103-EST-01'; catalogroot['composition_only']=True
catalogroot.rotation_euler[2]=math.pi/2
catalogroot.scale=scale
catalogroot.location=offset
for ob in [cab]+roots: ob.parent=catalogroot
export(OUT/'catalog-47-best.glb',False)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'catalog-47-best.blend'))
print('DISPLAY_BUILD_COMPLETE',len(items),'instances',len(skus),'SKUs')
if '--skip-render' in sys.argv:
    sys.exit(0)

# Studio rendering (excluded from every asset file above).
for ob in [cab]+roots: ob.parent=None
bpy.data.objects.remove(catalogroot,do_unlink=True)
floor=box('Studio floor',(0,0,-.047),(200,200,.08),material('Studio ivory',(.71,.70,.65),0,.9),parent=None,bevel=0)
scene=bpy.context.scene
scene.render.engine='CYCLES'; scene.cycles.samples=32
scene.cycles.use_denoising=True; scene.render.resolution_x=1800; scene.render.resolution_y=1600; scene.render.resolution_percentage=100
scene.world.color=(.3,.3,.3)
def light(name,loc,power,size):
    bpy.ops.object.light_add(type='AREA',location=loc); ob=bpy.context.object; ob.name=name
    ob.data.energy=power; ob.data.shape='DISK'; ob.data.size=size
    ob.rotation_euler=(Vector((0,0,1.1))-ob.location).to_track_quat('-Z','Y').to_euler()
light('Large softbox',(-3,-4,5),550,4)
light('Fill',(3,-2,3),350,3)
light('Rim',(1,3,4),650,3)
bpy.ops.object.camera_add(location=(3,-5,3.0)); camera=bpy.context.object
camera.rotation_euler=(Vector((0,0,1.1))-camera.location).to_track_quat('-Z','Y').to_euler(); camera.data.type='ORTHO'; camera.data.ortho_scale=3.35
scene.camera=camera; scene.view_settings.view_transform='AgX'
scene.render.filepath=str(BASE/'preview'/'studio.png'); bpy.ops.render.render(write_still=True)
camera.location=(0,-6,1.15); camera.rotation_euler=(Vector((0,0,1.1))-camera.location).to_track_quat('-Z','Y').to_euler(); camera.data.ortho_scale=2.52
scene.render.resolution_x=1600; scene.render.resolution_y=1600
scene.render.filepath=str(BASE/'preview'/'front.png'); bpy.ops.render.render(write_still=True)
