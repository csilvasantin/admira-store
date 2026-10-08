"""Hiperreal 47: upgrade Matrix 47 (catalog orientation) to photoreal PBR, imperfection and store lighting.
Usage: blender -b matrix.blend --factory-startup --python build_hiperreal.py -- [render_pct] [samples] [views] [noexport]
"""
import bpy, sys, math, hashlib, os, json
sys.path.insert(0,'/workspace/hiperreal47'); from common import *
from mathutils import Vector, Matrix
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
pct=int(argv[0]) if argv else 100; samples=int(argv[1]) if len(argv)>1 else 160
views=argv[2].split(',') if len(argv)>2 and argv[2]!='all' else None
do_export='noexport' not in argv; do_render='norender' not in argv
T='/workspace/hiperreal47/tex/'; OUT='/workspace/hiperreal47/out/'
sc=bpy.context.scene
def rng(key):
    h=int(hashlib.sha256(key.encode()).hexdigest()[:12],16); import random; return random.Random(h)

# ---------- 1. Hierarchy: undo non-uniform squash of products, add natural placement variation ----------
root=B.objects['StarbucksShelves_47']
S=root.scale.copy(); print('ROOT SCALE',tuple(S))
prods=[c for c in root.children if c.get('visual_only')]
others=[c for c in root.children if c not in prods]
cab=B.objects.new('Hiperreal47_cabinet_scale',None); sc.collection.objects.link(cab)
cab.parent=root; cab.scale=S; cab['note']='Nominal cabinet stretch kept for twin footprint; products use uniform scale.'
for o in others: o.parent=cab  # matrix_parent_inverse kept: world unchanged because cab world == old root world
LEVELS=[.125,.535,.945,1.355,1.765]; K=1.30  # uniform product scale (Matrix used 1.43 x 1.92 x 1.16)
root.scale=(1,1,1)
assert all(abs(v)<1e-6 for row in (prods[0].matrix_parent_inverse-Matrix.Identity(4)) for v in row), 'unexpected parent inverse'
for o in prods:
    r=rng(o['component_id']); x,y,z=o.location
    lvl=max([l for l in LEVELS if l<=z+1e-4] or [LEVELS[0]]); extra=z-lvl
    sku=o.get('sku','').lower(); stacked=extra>1e-3 or 'box' in sku
    jitter=0.0 if stacked else .0035
    o.location=(x*S.x+r.uniform(-jitter,jitter), y*S.y+r.uniform(-jitter,jitter), lvl*S.z+extra*K)
    spin={'mug':13,'travel':7,'cold':6,'thermos':6,'coffee-':2.2}.get(next((k for k in ['mug','travel','cold','thermos','coffee-'] if k in sku),''),3)
    if 'city' in sku or 'box' in sku: spin=1.2
    o.rotation_euler.z+=math.radians(r.uniform(-spin,spin))
    o.scale=(K,K,K)
    o['hiperreal_variation']=True
cab['hiperreal']=True; root['quality']='hiperreal'; root['hiperreal_product_scale']=K

# ---------- 2. Physical materials ----------
IM={}
def img(path,data=True):
    if path not in IM:
        im=B.images.load(path,check_existing=True); im.colorspace_settings.name='Non-Color' if data else 'sRGB'; IM[path]=im
    return IM[path]
def bsdf(m): return m.node_tree.nodes.get('Principled BSDF')
def unlink(m,sock):
    for l in list(m.node_tree.links):
        if l.to_socket==sock: m.node_tree.links.remove(l)
def gltf_group(m):
    g=B.node_groups.get('glTF Material Output')
    if not g:
        g=B.node_groups.new('glTF Material Output','ShaderNodeTree')
        for n in ['Occlusion','Thickness']: g.interface.new_socket(name=n,in_out='INPUT',socket_type='NodeSocketFloat')
        g.nodes.new('NodeGroupInput'); g.nodes.new('NodeGroupOutput')
    n=next((n for n in m.node_tree.nodes if n.type=='GROUP' and n.node_tree==g),None)
    if not n: n=m.node_tree.nodes.new('ShaderNodeGroup'); n.node_tree=g
    return n
def orm(m,path,ao=False):
    nt=m.node_tree; p=bsdf(m); unlink(m,p.inputs['Roughness']); unlink(m,p.inputs['Metallic'])
    t=nt.nodes.new('ShaderNodeTexImage'); t.image=img(path); t.label='ORM'
    sp=nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(t.outputs['Color'],sp.inputs['Color'])
    nt.links.new(sp.outputs['Green'],p.inputs['Roughness']); nt.links.new(sp.outputs['Blue'],p.inputs['Metallic'])
    if ao: nt.links.new(sp.outputs['Red'],gltf_group(m).inputs['Occlusion'])
    return t
def normal(m,path,strength):
    nt=m.node_tree; p=bsdf(m); unlink(m,p.inputs['Normal'])
    t=nt.nodes.new('ShaderNodeTexImage'); t.image=img(path); nm=nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value=strength
    nt.links.new(t.outputs['Color'],nm.inputs['Color']); nt.links.new(nm.outputs['Normal'],p.inputs['Normal'])
def basecolor(m,path):
    nt=m.node_tree; p=bsdf(m); unlink(m,p.inputs['Base Color'])
    t=nt.nodes.new('ShaderNodeTexImage'); t.image=img(path,False); nt.links.new(t.outputs['Color'],p.inputs['Base Color'])
def honey(m):
    # portable tint: glTF keeps the texture; Blender/Cycles and the baked web texture use the honey-oak grade
    nt=m.node_tree; p=bsdf(m); src=next(l.from_socket for l in nt.links if l.to_socket==p.inputs['Base Color'])
    h=nt.nodes.new('ShaderNodeHueSaturation'); h.inputs['Hue'].default_value=.485; h.inputs['Saturation'].default_value=1.35; h.inputs['Value'].default_value=.82
    nt.links.new(src,h.inputs['Color']); nt.links.new(h.outputs['Color'],p.inputs['Base Color'])
def coat(m,w,r):
    p=bsdf(m); p.inputs['Coat Weight'].default_value=w; p.inputs['Coat Roughness'].default_value=r
G=T+'gen/'
done=[]
for m in B.materials:
    if not m.node_tree or not bsdf(m): continue
    n=m.name.replace('ITIL_',''); low=n.lower(); p=bsdf(m)
    if n=='Honey oak':
        basecolor(m,G+'oak_honey_basecolor_4k.jpg'); orm(m,G+'oak_arm_4k.jpg',ao=True); normal(m,G+'oak_normal_4k.jpg',1.0); coat(m,.18,.32)
    elif n in ('Brushed graphite steel','Dark expanded steel'):
        orm(m,G+'frame_orm.jpg'); coat(m,.08,.3)
    elif 'ceramic' in low or 'glaze' in low:
        orm(m,G+'ceramic_orm.jpg'); coat(m,.7,.03); p.inputs['IOR'].default_value=1.52
        if 'pumpkin' in low: p.inputs['Base Color'].default_value=(.66,.105,.014,1) if 'highlights' not in low else (.74,.14,.02,1)
    elif 'pattern' in low:
        orm(m,G+'plastic_orm.jpg'); coat(m,.35,.08)
    elif n in ('Brushed emerald metal','Champagne metal','Thermos gold printing'):
        orm(m,G+'metal_orm.jpg'); coat(m,.25,.12)
    elif n=='Black thermos':
        orm(m,G+'metal_dark_orm.jpg'); coat(m,.3,.1)
    elif n in ('Emerald plastic','Travel mug black plastic','Soft black lid','Holiday crimson cap','Straw green'):
        orm(m,G+'plastic_orm.jpg'); coat(m,.25,.1)
    elif 'silicone' in low or n=='Rubber feet':
        p.inputs['Roughness'].default_value=.62; p.inputs['Sheen Weight'].default_value=.25
    elif 'cardboard' in low or 'carton' in low and 'ink' not in low:
        orm(m,G+'cardboard_orm.jpg'); normal(m,G+'cardboard_normal_2k.jpg',.55)
    elif 'coffee bag' in low:
        orm(m,G+'paper_orm.jpg'); normal(m,G+'cardboard_normal_2k.jpg',.3)
    elif 'transparent' in low or 'glass base' in low:
        p.inputs['Roughness'].default_value=.025; p.inputs['IOR'].default_value=1.46; p.inputs['Transmission Weight'].default_value=1.0
    else: continue
    m['quality']='hiperreal'; done.append(n)
print('UPGRADED',len(done),done)
# Wood UVs: physical scale (1 UV = 1.25 m), grain along each board, random offset per board.
oak=B.materials['Honey oak']
for o in B.objects:
    if o.type!='MESH' or not any(s.material==oak for s in o.material_slots): continue
    me=o.data
    if me.users>1: o.data=me=me.copy()
    uv=me.uv_layers.active; r=rng(o.name); ou,ov=r.random(),r.random()
    dims=[max(v.co[j] for v in me.vertices)-min(v.co[j] for v in me.vertices) for j in range(3)]
    long_axis=max(range(3),key=lambda j:dims[j])
    for poly in me.polygons:
        ax=max(range(3),key=lambda j:abs(poly.normal[j])); rest=[j for j in range(3) if j!=ax]
        a=long_axis if long_axis in rest else rest[0]; b=[j for j in rest if j!=a][0]
        for li in poly.loop_indices:
            co=me.vertices[me.loops[li].vertex_index].co
            uv.data[li].uv=(co[b]/1.25+ov, co[a]/1.25+ou)  # texture grain runs along V -> map V to board length
# ---------- 3. Asset export (portable: no Cycles-only nodes yet) ----------
asset_objs=[root]+list(root.children_recursive)
def export(path):
    bpy.ops.object.select_all(action='DESELECT')
    for o in asset_objs: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path,export_format='GLB',use_selection=True,export_extras=True,export_yup=True,
        export_cameras=False,export_lights=False,export_animations=False,export_materials='EXPORT',export_image_format='AUTO')
    print('EXPORTED',path,os.path.getsize(path))
if do_export:
    export(OUT+'hiperreal-hd.glb')
    bpy.ops.wm.save_as_mainfile(filepath=OUT+'hiperreal.blend',compress=True,relative_remap=True)
if not do_render: sys.exit(0)
# ---------- 4. Render-only realism: per-instance colour drift, dust, store set, HDRI ----------
for m in B.materials:
    if m.get('quality')!='hiperreal' or m.name=='Honey oak': continue
    nt=m.node_tree; p=bsdf(m); src=next((l.from_socket for l in nt.links if l.to_socket==p.inputs['Base Color']),None)
    oi=nt.nodes.new('ShaderNodeObjectInfo'); mr=nt.nodes.new('ShaderNodeMapRange'); mr.inputs[3].default_value=.94; mr.inputs[4].default_value=1.06
    nt.links.new(oi.outputs['Random'],mr.inputs[0]); hsv=nt.nodes.new('ShaderNodeHueSaturation')
    hr=nt.nodes.new('ShaderNodeMapRange'); hr.inputs[3].default_value=.492; hr.inputs[4].default_value=.508; nt.links.new(oi.outputs['Random'],hr.inputs[0])
    nt.links.new(hr.outputs[0],hsv.inputs['Hue']); nt.links.new(mr.outputs[0],hsv.inputs['Value'])
    if src: nt.links.new(src,hsv.inputs['Color'])
    else: hsv.inputs['Color'].default_value=p.inputs['Base Color'].default_value
    nt.links.new(hsv.outputs['Color'],p.inputs['Base Color'])
# dust: upward-facing wood and frame catch a faint grey film in low-frequency patches
for name in ('Honey oak','Brushed graphite steel'):
    m=B.materials[name]; nt=m.node_tree; p=bsdf(m); src=next((l.from_socket for l in nt.links if l.to_socket==p.inputs['Base Color']),None)
    geo=nt.nodes.new('ShaderNodeNewGeometry'); sz=nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Normal'],sz.inputs[0])
    noise=nt.nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value=7; noise.inputs['Detail'].default_value=8
    mm=nt.nodes.new('ShaderNodeMath'); mm.operation='MULTIPLY'; nt.links.new(sz.outputs['Z'],mm.inputs[0]); nt.links.new(noise.outputs['Fac'],mm.inputs[1])
    cr=nt.nodes.new('ShaderNodeMapRange'); cr.inputs[1].default_value=.45; cr.inputs[2].default_value=.8; cr.inputs[4].default_value=.22; nt.links.new(mm.outputs[0],cr.inputs[0])
    mix=nt.nodes.new('ShaderNodeMix'); mix.data_type='RGBA'; nt.links.new(cr.outputs[0],mix.inputs['Factor'])
    if src: nt.links.new(src,mix.inputs['A'])
    else: mix.inputs['A'].default_value=p.inputs['Base Color'].default_value
    mix.inputs['B'].default_value=(.42,.40,.37,1); nt.links.new(mix.outputs['Result'],p.inputs['Base Color'])
    # bevel shader: micro-rounded edges catch highlights
    bv=nt.nodes.new('ShaderNodeBevel'); bv.inputs['Radius'].default_value=.0018; bv.samples=6
    nm=next((l.from_node for l in nt.links if l.to_socket==p.inputs['Normal']),None)
    if nm and nm.type=='NORMAL_MAP': nt.links.new(bv.outputs['Normal'],nm.inputs['Normal']) if 'Normal' in nm.inputs else None
    else: nt.links.new(bv.outputs['Normal'],p.inputs['Normal'])
def pbr_mat(name,prefix,res,scale):
    m=B.materials.new(name); m.use_nodes=True; nt=m.node_tree; p=bsdf(m)
    tc=nt.nodes.new('ShaderNodeTexCoord'); mp=nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value=(scale,scale,scale); nt.links.new(tc.outputs['UV'],mp.inputs[0])
    def t(suffix,data):
        n=nt.nodes.new('ShaderNodeTexImage'); n.image=img(f'{T}{prefix}_{suffix}_{res}.jpg',data); nt.links.new(mp.outputs[0],n.inputs[0]); return n
    nt.links.new(t('Diffuse',False).outputs['Color'],p.inputs['Base Color'])
    sp=nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(t('arm',True).outputs['Color'],sp.inputs[0]); nt.links.new(sp.outputs['Green'],p.inputs['Roughness'])
    nm=nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(t('nor_gl',True).outputs['Color'],nm.inputs['Color']); nt.links.new(nm.outputs['Normal'],p.inputs['Normal'])
    return m,p
bpy.ops.mesh.primitive_plane_add(size=1,location=(1.5,-1.52,0)); fl=bpy.context.object; fl.name='Set_floor'; fl.scale=(14,14,1)
fm,fp=pbr_mat('Polished concrete','concrete_floor_02','2k',5); coat(fm,.35,.18); fl.data.materials.append(fm)
bpy.ops.mesh.primitive_plane_add(size=1,location=(-.07,-1.52,1.75),rotation=(math.pi/2,0,math.pi/2)); wl=bpy.context.object; wl.name='Set_wall'; wl.scale=(9,3.5,1)
wm,wp=pbr_mat('Warm plaster','plaster_grey_04','2k',2.2); wl.data.materials.append(wm)
# warm wash on plaster
hsv=wm.node_tree.nodes.new('ShaderNodeHueSaturation'); src=next(l.from_socket for l in wm.node_tree.links if l.to_socket==wp.inputs['Base Color'])
wm.node_tree.links.new(src,hsv.inputs['Color']); hsv.inputs['Hue'].default_value=.53; hsv.inputs['Saturation'].default_value=1.25; hsv.inputs['Value'].default_value=.62; wm.node_tree.links.new(hsv.outputs['Color'],wp.inputs['Base Color'])
w=B.worlds.new('ComfyCafe'); sc.world=w; w.use_nodes=True; nt=w.node_tree
env=nt.nodes.new('ShaderNodeTexEnvironment'); env.image=B.images.load(T+'comfy_cafe_4k.hdr'); mp=nt.nodes.new('ShaderNodeMapping'); tc=nt.nodes.new('ShaderNodeTexCoord')
mp.inputs['Rotation'].default_value=(0,0,math.radians(float(os.environ.get('HDRI_ROT','120')))); nt.links.new(tc.outputs['Generated'],mp.inputs[0]); nt.links.new(mp.outputs[0],env.inputs[0])
nt.links.new(env.outputs['Color'],nt.nodes['Background'].inputs['Color']); nt.nodes['Background'].inputs['Strength'].default_value=float(os.environ.get('HDRI_STR','1.1'))
def light(kind,name,loc,target,energy,color,size=.3,spot=None):
    ld=B.lights.new(name,kind); ld.energy=energy; ld.color=color
    if kind=='AREA': ld.size=size; ld.shape='RECTANGLE'; ld.size_y=size*.25
    if kind=='SPOT': ld.spot_size=math.radians(spot or 60); ld.spot_blend=.6; ld.shadow_soft_size=size
    ob=B.objects.new(name,ld); sc.collection.objects.link(ob); ob.location=loc; look(ob,target); return ob
warm=(1.0,.86,.70)
for y in (-.78,-2.26):
    light('SPOT','Downlight',(1.25,y,3.4),(0.25,y,1.0),float(os.environ.get('SPOT_W','340')),warm,.06,70)
light('AREA','Ceiling panel',(2.6,-1.52,3.3),(0.4,-1.52,1.0),float(os.environ.get('PANEL_W','300')),(1.0,.93,.85),1.6)
# Retail LED strips under each shelf front (typical merchandising light), warm 3000 K
STRIP=float(os.environ.get('STRIP_W','18'))
for lvl in LEVELS[1:]+[2.18-.015]:
    for yc in (-.776,-2.264):
        ld=B.lights.new('LED strip','AREA'); ld.shape='RECTANGLE'; ld.size=1.38; ld.size_y=.025; ld.energy=STRIP; ld.color=(1.0,.83,.64)
        ob=B.objects.new('LED strip',ld); sc.collection.objects.link(ob); ob.location=(.80,yc,lvl*S.z-.05); ob.rotation_euler=(0,math.radians(-18),math.pi/2)
cycles(samples)
try: sc.view_settings.look=os.environ.get('LOOK','AgX - Punchy')
except Exception as e: print('look',e)
sc.view_settings.exposure=float(os.environ.get('EXPO','-0.45'))
cams,t=cameras()
cams['detalle-tazas'].data.dof.use_dof=True; cams['detalle-tazas'].data.dof.aperture_fstop=3.2
cams['detalle-tazas'].data.dof.focus_distance=(Vector(t)-cams['detalle-tazas'].location).length
for k,cam in cams.items():
    if views and k not in views: continue
    r=RES[k]; render(cam,f'{OUT}after-{k}.png',(r[0]*pct//100,r[1]*pct//100))
