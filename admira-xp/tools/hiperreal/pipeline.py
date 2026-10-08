"""XpaceOS Hiperreal pipeline (generalised from the piece-47 pilot).
blender -b <src.blend> --factory-startup --python pipeline.py -- --piece N --out DIR [--mode build|before|after] [--samples 32] [--res 960x720]
  build  : physical PBR (CC0) by material name/colour class, physical-scale UVs, bevel applied, jitter on loose
           items, optional uniform product scale, LED emission -> exports hiperreal-hd.glb + hiperreal.blend
  after  : (run on hiperreal.blend) render-only realism: colour drift, dust, bevel shader, store set, HDRI, warm spots
  before : (run on the source tier) neutral Matrix-style studio for the comparison
Product/inventory identity (object names and custom properties: inventoryNumber, inventoryId, mediaSurface...) is kept.
"""
import bpy, sys, os, json, math, re, hashlib, random, subprocess
from mathutils import Vector, Matrix
HERE=os.path.dirname(os.path.abspath(__file__)); T=HERE+'/tex/'
argv=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
def arg(k,d=None):
    return argv[argv.index('--'+k)+1] if '--'+k in argv else d
N=int(arg('piece')); OUT=arg('out'); MODE=arg('mode','build'); SAMPLES=int(arg('samples','32'))
os.makedirs(OUT,exist_ok=True)
CFG=json.load(open(HERE+'/pieces.json')); PC={**CFG['defaults'],**CFG['pieces'].get(str(N),{})}
B=bpy.data; sc=bpy.context.scene
def rng(key): return random.Random(int(hashlib.sha256(str(key).encode()).hexdigest()[:12],16))
def base_name(n): return re.sub(r'\.\d{3}$','',n)
def bsdf(m): return m.node_tree.nodes.get('Principled BSDF') if m and m.use_nodes else None
def meshes(): return [o for o in B.objects if o.type=='MESH']
def bounds(objs=None):
    mn=Vector((1e9,)*3); mx=Vector((-1e9,)*3)
    for o in objs or meshes():
        for c in o.bound_box:
            w=o.matrix_world@Vector(c); mn=Vector(map(min,mn,w)); mx=Vector(map(max,mx,w))
    return mn,mx
def classify(m):
    n=base_name(m.name); over=PC.get('material_classes',{})
    if n in over: return over[n]
    low=n.lower()
    if low in CFG['palette']: return CFG['palette'][low]
    for pat,cls in CFG['keywords']:
        if re.search(pat,low): return cls
    p=bsdf(m)
    if not p: return 'keep'
    import colorsys
    r,g,b,_=p.inputs['Base Color'].default_value; h,s,v=colorsys.rgb_to_hsv(*(c**(1/2.2) for c in (r,g,b)))
    if p.inputs['Transmission Weight'].default_value>.3: return 'glass'
    if p.inputs['Metallic'].default_value>.5: return 'metal'
    if v<.12: return 'powder'
    if .03<h<.13 and s>.3 and v<.8: return 'wood'
    return 'plastic'
TILED={'wood','wood_dark','wood_stained','stone','pastry'}
def texlib(kind,hexc,size=4096):
    out=subprocess.run(['python3',HERE+'/texlib.py',kind,hexc,str(size)],capture_output=True,text=True,check=True).stdout
    return json.loads(out.strip().splitlines()[-1])
IM={}
def img(path,data=True):
    if path not in IM:
        im=B.images.load(path,check_existing=True); im.colorspace_settings.name='Non-Color' if data else 'sRGB'; IM[path]=im
    return IM[path]
def unlink(m,sock):
    for l in list(m.node_tree.links):
        if l.to_socket==sock: m.node_tree.links.remove(l)
def has_tex(m,sock_name):
    p=bsdf(m); return any(l.to_socket==p.inputs[sock_name] for l in m.node_tree.links)
def gltf_group(m):
    g=B.node_groups.get('glTF Material Output')
    if not g:
        g=B.node_groups.new('glTF Material Output','ShaderNodeTree')
        for n in ['Occlusion','Thickness']: g.interface.new_socket(name=n,in_out='INPUT',socket_type='NodeSocketFloat')
        g.nodes.new('NodeGroupInput'); g.nodes.new('NodeGroupOutput')
    n=next((n for n in m.node_tree.nodes if n.type=='GROUP' and n.node_tree==g),None)
    if not n: n=m.node_tree.nodes.new('ShaderNodeGroup'); n.node_tree=g
    return n
def set_orm(m,path,ao=False):
    nt=m.node_tree; p=bsdf(m); unlink(m,p.inputs['Roughness']); unlink(m,p.inputs['Metallic'])
    t=nt.nodes.new('ShaderNodeTexImage'); t.image=img(path); t.label='ORM'
    sp=nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(t.outputs['Color'],sp.inputs['Color'])
    nt.links.new(sp.outputs['Green'],p.inputs['Roughness']); nt.links.new(sp.outputs['Blue'],p.inputs['Metallic'])
    if ao: nt.links.new(sp.outputs['Red'],gltf_group(m).inputs['Occlusion'])
def set_normal(m,path,strength):
    nt=m.node_tree; p=bsdf(m); unlink(m,p.inputs['Normal'])
    t=nt.nodes.new('ShaderNodeTexImage'); t.image=img(path); nm=nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value=strength
    nt.links.new(t.outputs['Color'],nm.inputs['Color']); nt.links.new(nm.outputs['Normal'],p.inputs['Normal'])
def set_base(m,path):
    nt=m.node_tree; p=bsdf(m); unlink(m,p.inputs['Base Color'])
    t=nt.nodes.new('ShaderNodeTexImage'); t.image=img(path,False); nt.links.new(t.outputs['Color'],p.inputs['Base Color'])
def coat(m,w,r): p=bsdf(m); p.inputs['Coat Weight'].default_value=w; p.inputs['Coat Roughness'].default_value=r
def hex_of(m):
    n=base_name(m.name).lower()
    if re.fullmatch(r'#[0-9a-f]{6}',n): return n
    c=bsdf(m).inputs['Base Color'].default_value
    return '#'+''.join('%02x'%round(255*(max(0,x)**(1/2.2))) for x in c[:3])
NORMAL_K={'fabric':.7,'leather':.5,'wood':.9,'wood_dark':.9,'wood_stained':.7,'stone':.45,'pastry':.8,'powder':.25,'paper':.25,'cardboard':.5}
def upgrade(m,cls):
    p=bsdf(m)
    if not p or cls=='keep':
        if p and base_name(m.name) in PC.get('coat',{}): coat(m,*PC['coat'][base_name(m.name)])
        return
    keep_tex=has_tex(m,'Base Color'); hx=hex_of(m)
    if keep_tex: m['hiperreal_source_tex']=True  # authored texture: keep its own UVs (piece 2 stripes)
    if cls in ('wood','wood_dark','wood_stained','stone','pastry','powder') or cls in ('metal','metal_dark','ceramic','plastic','paper','cardboard','fabric','leather','carpaint'):
        t=texlib(cls,hx)
        if 'basecolor' in t and not keep_tex: set_base(m,t['basecolor'])
        if 'orm' in t and not has_tex(m,'Roughness'): set_orm(m,t['orm'],ao=cls in ('wood','wood_dark','wood_stained','stone'))
        if 'normal' in t and not has_tex(m,'Normal'): set_normal(m,t['normal'],NORMAL_K.get(cls,.4))
    if cls in ('metal','metal_dark') and not keep_tex:
        c=Vector(p.inputs['Base Color'].default_value[:3]); lum=c.dot(Vector((.2126,.7152,.0722)))
        target=.42 if cls=='metal' else .12
        if cls=='metal_dark':  # iron/steel is neutral: drop the source tint (27's teal straps read blue)
            g=c.dot(Vector((.2126,.7152,.0722))); c=Vector((g,g,g)).lerp(c,.15)
        if lum<target: c=c*(target/max(lum,1e-3))
        p.inputs['Base Color'].default_value=(*c,1)
    if cls=='glass':
        c=Vector(p.inputs['Base Color'].default_value[:3]); c=c.lerp(Vector((1,1,1)),.78)
        p.inputs['Base Color'].default_value=(*c,1); p.inputs['Transmission Weight'].default_value=1; p.inputs['Roughness'].default_value=.02; p.inputs['IOR'].default_value=1.5
        p.inputs['Alpha'].default_value=1; m.surface_render_method='DITHERED' if hasattr(m,'surface_render_method') else None
    elif cls=='led':
        c=p.inputs['Base Color'].default_value; p.inputs['Emission Color'].default_value=c; p.inputs['Emission Strength'].default_value=4
    elif cls=='rubber': p.inputs['Roughness'].default_value=.86; p.inputs['Metallic'].default_value=0
    elif cls=='fabric': p.inputs['Sheen Weight'].default_value=.6; p.inputs['Sheen Roughness'].default_value=.45; p.inputs['Sheen Tint'].default_value=(*p.inputs['Base Color'].default_value[:3],1)
    elif cls=='screen': p.inputs['Roughness'].default_value=.06; coat(m,1,.02)
    elif cls=='gloss_black': p.inputs['Roughness'].default_value=.1; p.inputs['Metallic'].default_value=0; coat(m,.8,.04)
    coats={'wood':(.2,.3),'wood_dark':(.22,.28),'wood_stained':(.3,.22),'stone':(.35,.14),'metal':(.06,.3),'metal_dark':(.25,.12),'ceramic':(.7,.03),'plastic':(.2,.1),'pastry':(.12,.35),'powder':(.05,.4),'leather':(.15,.4),'carpaint':(1,.03)}
    if cls in coats: coat(m,*coats[cls])
    if base_name(m.name) in PC.get('coat',{}): coat(m,*PC['coat'][base_name(m.name)])
    m['quality']='hiperreal'; m['hiperreal_class']=cls
def primary_class(o):
    for s in o.material_slots:
        if s.material and s.material.get('hiperreal_class'): return s.material['hiperreal_class']
    return None
def box_uv(o,tile_for):
    me=o.data
    if not me.uv_layers: me.uv_layers.new(name='UVMap')
    uv=me.uv_layers[0]; r=rng(o.name); ou,ov=r.random(),r.random()
    sx,sy,sz=o.matrix_world.to_scale(); S=(abs(sx),abs(sy),abs(sz))
    dims=[(max(v.co[j] for v in me.vertices)-min(v.co[j] for v in me.vertices))*S[j] for j in range(3)] if me.vertices else [1,1,1]
    long_axis=max(range(3),key=lambda j:dims[j])
    for poly in me.polygons:
        mat=o.material_slots[poly.material_index].material if poly.material_index<len(o.material_slots) else None
        tile=tile_for(mat)
        if not tile: continue
        ax=max(range(3),key=lambda j:abs(poly.normal[j])); rest=[j for j in range(3) if j!=ax]
        a=long_axis if long_axis in rest else rest[0]; b=[j for j in rest if j!=a][0]
        for li in poly.loop_indices:
            co=me.vertices[me.loops[li].vertex_index].co
            uv.data[li].uv=(co[b]*S[b]/tile+ov, co[a]*S[a]/tile+ou)  # grain along V = longest side of the board

FRONTS={'-Y':Vector((0,-1,0)),'+Y':Vector((0,1,0)),'+X':Vector((1,0,0)),'-X':Vector((-1,0,0))}
DETAIL_CLASSES=('wood','wood_dark','wood_stained','powder','metal','metal_dark','plastic','stone')
def mat_for(name,cls,hexc=None,rough=None):
    m=B.materials.get(name)
    if m: return m
    m=B.materials.new(name); m.use_nodes=True; p=bsdf(m)
    if hexc: p.inputs['Base Color'].default_value=(*[(int(hexc[i:i+2],16)/255)**2.2 for i in (1,3,5)],1)
    if rough is not None: p.inputs['Roughness'].default_value=rough
    upgrade(m,cls); return m
def slot(me,m):
    for i,x in enumerate(me.materials):
        if x==m: return i
    me.materials.append(m); return len(me.materials)-1
def detail(log):
    """Real geometry detail for simple boxy parts (batch-1 lesson): every sharp box gets a real bevel; thin wood
    panels get ABS edge banding on their edges; large vertical panels get a recessed field (frame-and-panel seam);
    optional bar handles on drawer/door fronts and an optional recessed kick plate (per-piece overrides)."""
    import bmesh
    D=PC.get('detail',{})
    if D is False: return
    st={'bevel':0,'band':0,'panel':0,'handle':0,'kick':0}; fv=FRONTS[PC.get('front','-Y')]
    for o in meshes():
        me=o.data
        if len(me.polygons)>40000 or o.get('mediaSurface'): continue
        if me.users>1: o.data=me=me.copy()
        S=Matrix.Diagonal(o.matrix_world.to_scale()).to_4x4(); Rw=o.matrix_world.to_quaternion()
        bm=bmesh.new(); bm.from_mesh(me); bm.transform(S)
        bmesh.ops.remove_doubles(bm,verts=bm.verts,dist=1e-5); bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table()
        seen=set(); comps=[]
        for v in bm.verts:
            if v.index in seen: continue
            stack=[v]; comp=[]; seen.add(v.index)
            while stack:
                x=stack.pop(); comp.append(x)
                for e in x.link_edges:
                    y=e.other_vert(x)
                    if y.index not in seen: seen.add(y.index); stack.append(y)
            comps.append(comp)
        jobs=[]; before_st=dict(st)
        for comp in comps:
            if len(comp)>120: continue
            faces=list({f for v in comp for f in v.link_faces})
            mi=faces[0].material_index; mat=me.materials[mi] if mi<len(me.materials) else None
            cls=mat.get('hiperreal_class') if mat else None
            if cls not in DETAIL_CLASSES: continue
            lo=Vector([min(v.co[a] for v in comp) for a in range(3)]); hi=Vector([max(v.co[a] for v in comp) for a in range(3)]); ext=hi-lo
            sharp=len(comp)==8 and len(faces)==6 and all(len(f.verts)==4 for f in faces)
            th={}
            for f in faces:
                ax=max(range(3),key=lambda a:abs(f.normal[a]))
                if abs(f.normal[ax])<.999: continue
                plane=hi[ax] if f.normal[ax]>0 else lo[ax]
                if abs(f.calc_center_median()[ax]-plane)>1e-4: continue
                o2=[a for a in range(3) if a!=ax]
                if f.calc_area()>.5*ext[o2[0]]*ext[o2[1]]: th[f]=ext[ax]
            if not th: continue
            dims=sorted(ext); thin,mid,big=dims
            if big<.02: continue
            jobs.append((comp,faces,mat,cls,th,thin,mid,big,sharp))
        for comp,faces,mat,cls,th,thin,mid,big,sharp in jobs:
            edges=list({e for f in faces for e in f.edges})
            bigf=[f for f in th if abs(th[f]-thin)<1e-4]
            panel=cls.startswith('wood') and thin<.06 and thin<.35*mid
            if panel and sharp and D.get('banding',True):
                h=hex_of(mat); c='#%02x%02x%02x'%tuple(int(int(h[i:i+2],16)*.84) for i in (1,3,5))
                bi=slot(me,mat_for(base_name(mat.name)+' · canto ABS','plastic',c,.36))
                for f in faces:
                    if f not in bigf: f.material_index=bi
                st['band']+=1
            if panel and D.get('panels',True) and mid>.35 and big>.35:
                vert=[f for f in bigf if abs((Rw@f.normal).z)<.3 and f.calc_area()>.12]
                if vert:
                    bmesh.ops.inset_individual(bm,faces=vert,thickness=min(.04,mid*.1),depth=-min(.003,thin*.15),use_even_offset=True)
                    st['panel']+=len(vert)
            if D.get('handles') and cls in DETAIL_CLASSES:
                for f in list(th):
                    if (Rw@f.normal).dot(fv)<.9 or len(f.verts)!=4: continue
                    vs=[v.co for v in f.verts]; cen=f.calc_center_median(); n=f.normal.normalized()
                    axes=[(vs[1]-vs[0]),(vs[3]-vs[0])]
                    hz=max(axes,key=lambda a:abs((Rw@a.normalized()).z)<.3 and a.length or 0); up=[a for a in axes if a is not hz][0]
                    W,Hh=hz.length,up.length
                    if (Rw@up).z<0: up=-up
                    if not (.25<W<1.0 and .12<Hh<.9 and th[f]>.3): continue
                    hzn,upn=hz.normalized(),up.normalized(); L=min(.18,W*.45); c0=cen+upn*(Hh/2-min(.06,Hh*.2))
                    if not panel: bmesh.ops.inset_individual(bm,faces=[f],thickness=.014,depth=-.003,use_even_offset=True)
                    hm=slot(me,mat_for('Tirador acero cepillado','metal','#b8bcc0',.3))
                    def cube(center,a,b,cc):
                        r=bmesh.ops.create_cube(bm,size=1)
                        M=Matrix(((a.x,b.x,cc.x,center.x),(a.y,b.y,cc.y,center.y),(a.z,b.z,cc.z,center.z),(0,0,0,1)))
                        bmesh.ops.transform(bm,matrix=M,verts=r['verts'])
                        for ff in {ff for v in r['verts'] for ff in v.link_faces}: ff.material_index=hm
                    cube(c0+n*.03,hzn*L,upn*.012,n*.012)
                    for s in (-1,1): cube(c0+hzn*(s*L*.4)+n*.015,hzn*.012,upn*.012,n*.03)
                    st['handle']+=1
            if sharp and thin>=.004:
                bmesh.ops.bevel(bm,geom=edges,offset=min(float(D.get('bevel',.004)),thin*.3),segments=2,profile=.5,affect='EDGES',clamp_overlap=True)
                st['bevel']+=1
        if not jobs or not any(st.values()) or st==before_st: bm.free(); continue
        bm.transform(S.inverted()); bm.normal_update(); bm.to_mesh(me); bm.free(); me.update()
    kp=PC.get('kick_plate')
    if kp:
        mn,mx=bounds(); c=(mn+mx)/2; size=mx-mn; side=Vector((-fv.y,fv.x,0))
        w=abs(size.dot(side))-2*kp.get('inset',.03); half=abs(size.dot(fv))/2
        bpy.ops.mesh.primitive_cube_add(size=1); k=bpy.context.object; k.name='Hiperreal kick plate'
        k.location=c+fv*(half-kp.get('inset',.03))+Vector((0,0,mn.z-c.z+kp.get('h',.07)/2))
        k.location.z=mn.z+kp.get('h',.07)/2
        k.rotation_euler.z=math.atan2(side.y,side.x); k.scale=(w,.012,kp.get('h',.07))
        k.data.materials.append(mat_for('Zócalo aluminio oscuro','metal_dark','#3a3c3f',.35)); st['kick']=1
    log['detail']=st; print('DETAIL',st,flush=True)

def place_on_front(log):
    """Per-piece override: put named objects (e.g. 3D text signs) flat on the front face of the piece."""
    spec=PC.get('place_on_front')
    if not spec: return
    names=set(spec); body=[o for o in meshes() if o.name not in names]
    mn,mx=bounds(body); c=(mn+mx)/2; fv=FRONTS[PC.get('front','-Y')]
    for name,vals in spec.items():
        dx,dz,k=vals[:3]; plane=vals[3] if len(vals)>3 else None
        o=B.objects.get(name)
        if not o: continue
        bpy.context.view_layer.update(); mw=o.matrix_world.copy(); sc0=mw.to_scale(); o.parent=None; o.matrix_world=mw
        side=Vector((-fv.y,fv.x,0)); half=abs((mx-mn).dot(fv))/2
        loc=c+fv*(half+.004)+side*dx+Vector((0,0,dz))
        if plane is not None:
            if abs(fv.y)>.5: loc.y=plane
            else: loc.x=plane
        o.location=loc; o.rotation_euler=(math.pi/2,0,math.atan2(fv.y,fv.x)+math.pi/2); o.scale=(sc0.x*k,sc0.y*k,sc0.z*k)
    log['placed_on_front']=sorted(spec)

def add_parts(log):
    """Per-piece override: cheap hand-tuned real parts (handles, hinges, kick plates, vents, brackets).
    Each part: {name, at:[x,y,z] world metres (centre), size:[sx,sy,sz], cls, hex, cyl:bool}. Names start with 'Hiperreal '."""
    parts=PC.get('add_parts') or []
    root=next((o for o in B.objects if o.parent is None and o.type=='EMPTY'),None)
    for i,sp in enumerate(parts):
        if sp.get('cyl'): bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=.5,depth=1)
        else: bpy.ops.mesh.primitive_cube_add(size=1)
        o=bpy.context.object; o.name='Hiperreal '+sp.get('name','pieza %d'%i); o.location=sp['at']; o.scale=sp['size']
        if sp.get('rot'): o.rotation_euler=[math.radians(a) for a in sp['rot']]
        if sp.get('cyl'):
            for f in o.data.polygons: f.use_smooth=True
        o.data.materials.append(mat_for('Hiperreal · '+sp.get('cls','metal')+' '+sp.get('hex','#b8bcc0'),sp.get('cls','metal'),sp.get('hex','#b8bcc0'),sp.get('rough')))
        if root:
            bpy.context.view_layer.update(); mw=o.matrix_world.copy(); o.parent=root; o.matrix_world=mw
    if parts: log['added_parts']=[p.get('name') for p in parts]
def build():
    log={'piece':N,'materials':{},'jittered':0,'objects':len(meshes())}
    # 0. uniform product scale (pilot 47 problem): products under a non-uniformly scaled parent
    up=PC.get('uniform_products')
    if up:
        root=B.objects[up['root']]; S=root.scale.copy(); K=up['k']
        prods=[c for c in root.children if c.get(up.get('flag','visual_only'))]; others=[c for c in root.children if c not in prods]
        cab=B.objects.new(root.name+'_hiperreal_scale',None); sc.collection.objects.link(cab); cab.parent=root; cab.scale=S
        for o in others: o.parent=cab
        root.scale=(1,1,1)
        for o in prods: x,y,z=o.location; o.location=(x*S.x,y*S.y,z*S.z); o.scale=(K,K,K)
        log['uniform_products']=K
    # 1. apply modifiers (procedural bevels become real geometry so edges catch light in every engine)
    if not PC.get('keep_uvs'):
        for o in meshes():
            if o.modifiers:
                if o.data.users>1: o.data=o.data.copy()
                with bpy.context.temp_override(object=o,active_object=o,selected_objects=[o]):
                    for md in list(o.modifiers):
                        try: bpy.ops.object.modifier_apply(modifier=md.name)
                        except Exception as e: print('modifier',o.name,md.name,e)
    # 1b. object_classes: per-object material split (e.g. a saddle sharing "black" with the tyres becomes leather)
    oc=PC.get('object_classes',{})
    if oc:
        mc=PC.setdefault('material_classes',{}); made={}
        for o in meshes():
            cls=oc.get(base_name(o.name))
            if not cls: continue
            for s in o.material_slots:
                if not s.material: continue
                key=(s.material.name,cls)
                if key not in made:
                    nm=s.material.copy(); nm.name=base_name(s.material.name)+' · '+cls; made[key]=nm; mc[base_name(nm.name)]=cls
                s.material=made[key]
        log['object_classes']=len(made)
    # 2. materials
    for m in list(B.materials):
        users=sum(1 for o in meshes() for s in o.material_slots if s.material==m)
        if not users or not bsdf(m): continue
        cls=classify(m); upgrade(m,cls); log['materials'][m.name]=cls
    place_on_front(log)
    add_parts(log)
    # 2b. real geometry detail (bevels, banding, panel seams, handles, kick plate)
    detail(log)
    # 3. physical-scale UVs for tiling classes
    tiles=PC['tile_m']
    def tile_for(mat):
        if not mat: return None
        if mat.get('hiperreal_source_tex'): return None
        c=mat.get('hiperreal_class'); return tiles.get(c) if c else None
    if not PC.get('keep_uvs'):
        seen=set()
        for o in meshes():
            if not any(tile_for(s.material) for s in o.material_slots): continue
            if o.data.users>1 or o.data.name in seen: o.data=o.data.copy()
            seen.add(o.data.name); box_uv(o,tile_for)
    # 4. jitter loose items (seeded by object name: reproducible)
    J=PC.get('jitter',{}); maxs=PC.get('jitter_max_size_m',.5)
    for o in meshes():
        cls=primary_class(o)
        if cls not in J or max(o.dimensions)>maxs: continue
        j=J[cls]; r=rng(o.name)
        o.location.x+=r.uniform(-j['pos'],j['pos']); o.location.y+=r.uniform(-j['pos'],j['pos'])
        o.rotation_euler.z+=math.radians(r.uniform(-j['rot'],j['rot']))
        if j.get('scale'): k=1+r.uniform(-j['scale'],j['scale']); o.scale=(o.scale.x*k,o.scale.y*k,o.scale.z*k)
        o['hiperreal_variation']=True; log['jittered']+=1
    for o in B.objects:
        if o.parent is None and o.type in ('MESH','EMPTY'): o['quality']='hiperreal'
    # 5. export HD + master blend
    bpy.ops.object.select_all(action='DESELECT')
    for o in B.objects:
        if o.type in ('MESH','EMPTY','FONT','CURVE','SURFACE','META'): o.select_set(True)  # text signs too
    hd=OUT+'/hiperreal-hd.glb'
    bpy.ops.export_scene.gltf(filepath=hd,export_format='GLB',use_selection=True,export_extras=True,export_yup=True,export_apply=True,
        export_cameras=False,export_lights=False,export_animations=False,export_materials='EXPORT',export_image_format='AUTO')
    log['hd_bytes']=os.path.getsize(hd)
    # Master .blend: hiperreal library textures live once in assets/hiperreal-tex (shared by every piece),
    # referenced relatively from catalog/<nn>/hiperreal.blend; source textures already packed stay packed.
    import shutil
    shared=os.path.normpath(os.path.join(OUT,'..','..','hiperreal-tex')); os.makedirs(shared,exist_ok=True)
    for path,im in IM.items():
        shutil.copy2(path,os.path.join(shared,os.path.basename(path))); im.filepath='//../../hiperreal-tex/'+os.path.basename(path)
    log['shared_textures']=sorted(os.path.basename(p) for p in IM)
    bpy.ops.wm.save_as_mainfile(filepath=OUT+'/hiperreal.blend',compress=True,relative_remap=False)
    json.dump(log,open(OUT+'/build-log.json','w'),indent=1,ensure_ascii=False); print('BUILD',json.dumps(log,ensure_ascii=False)[:1500])
# ---------------- rendering ----------------
def look(ob,target): ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
def cycles(samples):
    cy=sc.cycles; sc.render.engine='CYCLES'; cy.device='CPU'; cy.samples=samples; cy.use_adaptive_sampling=True; cy.adaptive_threshold=.03
    cy.use_denoising=True
    try: cy.denoiser='OPENIMAGEDENOISE'
    except Exception: pass
    cy.max_bounces=8; cy.transmission_bounces=8; cy.glossy_bounces=4; cy.diffuse_bounces=3; cy.transparent_max_bounces=10
    cy.caustics_reflective=False; cy.caustics_refractive=False; cy.blur_glossy=.6
    sc.render.threads_mode='FIXED'; sc.render.threads=8; sc.render.image_settings.file_format='PNG'; sc.view_settings.view_transform='AgX'
def camera(res):
    mn,mx=bounds(); c=(mn+mx)/2; size=mx-mn
    front=FRONTS[PC.get('front','-Y')]
    side=Vector((-front.y,front.x,0))
    wide=max(size.x,size.y)/max(size.z,1e-3)>3
    d=(front*1.0+side*(.3 if wide else .55)+Vector((0,0,.42))).normalized()
    cd=B.cameras.new('HiperrealCam'); cd.lens=50; cd.sensor_width=36; cam=B.objects.new('HiperrealCam',cd); sc.collection.objects.link(cam)
    cam.location=c+d; look(cam,c); bpy.context.view_layer.update()
    R=cam.matrix_world.to_3x3(); aspect=res[0]/res[1]
    tx=math.tan(math.atan(18/50))*.86; ty=tx/aspect
    need=0
    for x in (mn.x,mx.x):
        for y in (mn.y,mx.y):
            for z in (mn.z,mx.z):
                p=R.transposed()@(Vector((x,y,z))-c); f=-p.z
                need=max(need,abs(p.x)/tx-f,abs(p.y)/ty-f)
    cam.location=c+d*need; sc.camera=cam; return cam,c,size
def render_res():
    mn,mx=bounds(); s=mx-mn; w=max(s.x,s.y)
    r=PC.get('res') or arg('res')
    if r: return tuple(map(int,r.split('x')))
    return (1280,600) if w/max(s.z,1e-3)>3 else (960,720)
def before():
    cycles(SAMPLES); res=render_res(); cam,c,size=camera(res)
    w=sc.world or B.worlds.new('MatrixStudio'); sc.world=w; w.use_nodes=True
    bg=w.node_tree.nodes.get('Background'); bg.inputs['Color'].default_value=(.22,.22,.22,1); bg.inputs['Strength'].default_value=1
    R=max(size.x,size.y,size.z)
    for name,loc,power,sz in [('Large softbox',(-3,-4,5),550,4),('Fill',(3,-2,3),350,3),('Rim',(1,3,4),650,3)]:
        ld=B.lights.new(name,'AREA'); k=max(1,R/2.5); ld.energy=power*k*k; ld.size=sz*k; ob=B.objects.new(name,ld); sc.collection.objects.link(ob)
        ob.location=c+Vector(loc)*k*1.16; look(ob,(c.x,c.y,c.z))
    bpy.ops.mesh.primitive_plane_add(size=max(40,R*6),location=(c.x,c.y,-.001)); fl=bpy.context.object
    m=B.materials.new('StudioFloor'); m.use_nodes=True; p=bsdf(m); p.inputs['Base Color'].default_value=(.8,.8,.8,1); p.inputs['Roughness'].default_value=.8; fl.data.materials.append(m)
    go(res,OUT+'/before.png')
def go(res,path):
    sc.render.resolution_x,sc.render.resolution_y=res; sc.render.resolution_percentage=100; sc.render.filepath=path
    bpy.ops.render.render(write_still=True); print('RENDERED',path,flush=True)
def pbr_set(name,prefix,scale):
    m=B.materials.new(name); m.use_nodes=True; nt=m.node_tree; p=bsdf(m)
    tc=nt.nodes.new('ShaderNodeTexCoord'); mp=nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value=tuple(scale)+(1,) if isinstance(scale,tuple) else (scale,)*3; nt.links.new(tc.outputs['UV'],mp.inputs[0])
    def t(suffix,data):
        n=nt.nodes.new('ShaderNodeTexImage'); n.image=img(f'{T}{prefix}_{suffix}_2k.jpg',data); nt.links.new(mp.outputs[0],n.inputs[0]); return n
    nt.links.new(t('Diffuse',False).outputs['Color'],p.inputs['Base Color'])
    sp=nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(t('arm',True).outputs['Color'],sp.inputs[0]); nt.links.new(sp.outputs['Green'],p.inputs['Roughness'])
    nm=nt.nodes.new('ShaderNodeNormalMap'); nt.links.new(t('nor_gl',True).outputs['Color'],nm.inputs['Color']); nt.links.new(nm.outputs['Normal'],p.inputs['Normal'])
    return m,p
def after():
    cycles(SAMPLES); res=render_res()
    for m in B.materials:
        cls=m.get('hiperreal_class')
        if not cls or not bsdf(m): continue
        nt=m.node_tree; p=bsdf(m); src=next((l.from_socket for l in nt.links if l.to_socket==p.inputs['Base Color']),None)
        if cls=='led': p.inputs['Emission Strength'].default_value=float(PC.get('led_render',30))
        if cls in ('pastry','ceramic','paper','cardboard','plastic'):
            oi=nt.nodes.new('ShaderNodeObjectInfo'); hsv=nt.nodes.new('ShaderNodeHueSaturation')
            mr=nt.nodes.new('ShaderNodeMapRange'); mr.inputs[3].default_value=.9; mr.inputs[4].default_value=1.08; nt.links.new(oi.outputs['Random'],mr.inputs[0])
            hr=nt.nodes.new('ShaderNodeMapRange'); hr.inputs[3].default_value=.49; hr.inputs[4].default_value=.51; nt.links.new(oi.outputs['Random'],hr.inputs[0])
            nt.links.new(hr.outputs[0],hsv.inputs['Hue']); nt.links.new(mr.outputs[0],hsv.inputs['Value'])
            if src: nt.links.new(src,hsv.inputs['Color'])
            else: hsv.inputs['Color'].default_value=p.inputs['Base Color'].default_value
            nt.links.new(hsv.outputs['Color'],p.inputs['Base Color']); src=hsv.outputs['Color']
        if cls in ('wood','wood_dark','wood_stained','metal','powder','stone'):
            geo=nt.nodes.new('ShaderNodeNewGeometry'); sz=nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(geo.outputs['Normal'],sz.inputs[0])
            noise=nt.nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value=7; noise.inputs['Detail'].default_value=8
            mm=nt.nodes.new('ShaderNodeMath'); mm.operation='MULTIPLY'; nt.links.new(sz.outputs['Z'],mm.inputs[0]); nt.links.new(noise.outputs['Fac'],mm.inputs[1])
            cr=nt.nodes.new('ShaderNodeMapRange'); cr.inputs[1].default_value=.45; cr.inputs[2].default_value=.8; cr.inputs[4].default_value=.07; nt.links.new(mm.outputs[0],cr.inputs[0])
            mix=nt.nodes.new('ShaderNodeMix'); mix.data_type='RGBA'; nt.links.new(cr.outputs[0],mix.inputs['Factor'])
            if src: nt.links.new(src,mix.inputs['A'])
            else: mix.inputs['A'].default_value=p.inputs['Base Color'].default_value
            mix.inputs['B'].default_value=(.42,.40,.37,1); nt.links.new(mix.outputs['Result'],p.inputs['Base Color'])
            bv=nt.nodes.new('ShaderNodeBevel'); bv.inputs['Radius'].default_value=.0025; bv.samples=6
            nm=next((l.from_node for l in nt.links if l.to_socket==p.inputs['Normal']),None)
            if not nm: nt.links.new(bv.outputs['Normal'],p.inputs['Normal'])
    cam,c,size=camera(res); mn,mx=bounds([o for o in meshes()]); R=max(size.x,size.y,size.z)
    fv=FRONTS[PC.get('front','-Y')]; side=Vector((-fv.y,fv.x,0)); half=abs(size.dot(fv))/2; span=abs(size.dot(side))
    # Clean neutral cafe/studio set (batch 2): smooth warm microcement floor, matte off-white wall, no grunge maps.
    bpy.ops.mesh.primitive_plane_add(size=1,location=(c.x,c.y,0)); fl=bpy.context.object; fl.name='Set_floor'; fl.scale=(max(14,R*5),)*2+(1,)
    fm=B.materials.new('Set microcement'); fm.use_nodes=True; fp=bsdf(fm); fp.inputs['Base Color'].default_value=(.46,.43,.40,1); fp.inputs['Roughness'].default_value=.38
    nz=fm.node_tree.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value=1.6; nz.inputs['Detail'].default_value=3
    rr=fm.node_tree.nodes.new('ShaderNodeMapRange'); rr.inputs[3].default_value=.32; rr.inputs[4].default_value=.46
    fm.node_tree.links.new(nz.outputs['Fac'],rr.inputs[0]); fm.node_tree.links.new(rr.outputs[0],fp.inputs['Roughness']); coat(fm,.25,.12); fl.data.materials.append(fm)
    wpos=c-fv*(half+.03); wpos.z=max(1.75,mx.z*1.1)
    bpy.ops.mesh.primitive_plane_add(size=1,location=wpos,rotation=(math.pi/2,0,math.atan2(fv.y,fv.x)+math.pi/2)); wl=bpy.context.object; wl.name='Set_wall'; wl.scale=(max(9,R*4),max(3.5,mx.z*2.4),1)
    wm=B.materials.new('Set painted wall'); wm.use_nodes=True; wp=bsdf(wm); wp.inputs['Base Color'].default_value=(.62,.58,.53,1); wp.inputs['Roughness'].default_value=.82; wl.data.materials.append(wm)
    bpy.ops.mesh.primitive_cube_add(size=1); sk=bpy.context.object; sk.name='Set_skirting'; sk.location=c-fv*(half+.025); sk.location.z=.04
    sk.rotation_euler.z=math.atan2(side.y,side.x); sk.scale=(wl.scale.x,.012,.08); sk.data.materials.append(wm)
    w=B.worlds.new('ComfyCafe'); sc.world=w; w.use_nodes=True; nt=w.node_tree
    env=nt.nodes.new('ShaderNodeTexEnvironment'); env.image=B.images.load(T+'comfy_cafe_2k.hdr'); mp=nt.nodes.new('ShaderNodeMapping'); tc=nt.nodes.new('ShaderNodeTexCoord')
    mp.inputs['Rotation'].default_value=(0,0,math.radians(float(PC.get('hdri_rot',120)))); nt.links.new(tc.outputs['Generated'],mp.inputs[0]); nt.links.new(mp.outputs[0],env.inputs[0])
    nt.links.new(env.outputs['Color'],nt.nodes['Background'].inputs['Color']); nt.nodes['Background'].inputs['Strength'].default_value=float(PC.get('hdri_str',1.1))
    warm=(1.0,.88,.74); H=max(3.2,mx.z+1.6); k=max(1,R/3)
    n=max(1,round(span/2.2))
    for i in range(n):
        p0=c+side*((i+.5)*span/n-span/2)
        ld=B.lights.new('Downlight','SPOT'); ld.energy=float(PC.get('spot_w',300))*k; ld.color=warm; ld.spot_size=math.radians(75); ld.spot_blend=.7; ld.shadow_soft_size=.08
        ob=B.objects.new('Downlight',ld); sc.collection.objects.link(ob); ob.location=p0+fv*(half+1.0); ob.location.z=H; look(ob,(p0.x,p0.y,mx.z*.5))
    ld=B.lights.new('Ceiling panel','AREA'); ld.energy=float(PC.get('panel_w',340))*k*k; ld.color=(1.0,.95,.88); ld.shape='RECTANGLE'; ld.size=1.8*k; ld.size_y=.5*k
    ob=B.objects.new('Ceiling panel',ld); sc.collection.objects.link(ob); ob.location=c+fv*(half+2.2*k); ob.location.z=H; look(ob,(c.x,c.y,mx.z*.4))
    try: sc.view_settings.look='AgX - Punchy'
    except Exception: pass
    sc.view_settings.exposure=float(PC.get('expo',-0.2))
    go(res,OUT+'/after.png')
{'build':build,'before':before,'after':after}[MODE]()
