"""Recover the confirmed runtime bookcase as an independent editable template.
Blender -b only. Source dimensions are the original demo design, not a surveyed asset.
"""
import bpy, json, math, struct, sys, hashlib
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'inventario/assets/catalog/51'; OUT.mkdir(parents=True,exist_ok=True)
SRC=ROOT/'inventario/cafebreria'; META=json.loads((SRC/'libros/estanteria-libros.json').read_text())
b=(SRC/'scene.glb').read_bytes(); n=struct.unpack_from('<I',b,12)[0]; doc=json.loads(b[20:20+n]); binary=b[28+n:]
mat=next(m for m in doc['materials'] if m['name']=='MAT_nogal'); image=doc['images'][doc['textures'][mat['pbrMetallicRoughness']['baseColorTexture']['index']]['source']]; view=doc['bufferViews'][image['bufferView']]; woodpath=SRC/'nogal-original.png';woodpath.write_bytes(binary[view.get('byteOffset',0):view.get('byteOffset',0)+view['byteLength']])
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.unit_settings.system='METRIC'
def material(name,color,rough=.46,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=rough;p.inputs['Metallic'].default_value=metal;return m
wood=material('MAT_nogal',(.15,.075,.035)); tex=wood.node_tree.nodes.new('ShaderNodeTexImage');tex.image=bpy.data.images.load(str(woodpath));tex.image.pack();wood.node_tree.links.new(tex.outputs['Color'],wood.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
back=material('library_back',(.254,.127,.061),.6);brass=material('MAT_laton',(.584,.361,.020),.3,.8);dark=material('tv_dark',(.011,.01,.008),.38);shell=material('tv_walnut',(.254,.102,.044),.56);paper=material('book_pages',(.86,.79,.63),.8)
def group(name,parent=None):
 o=bpy.data.objects.new(name,None);scene.collection.objects.link(o);o.parent=parent;return o
# Blender coordinates x,-z,y -> glTF x,y,z. Corner pivot enables existing imports.
root=group('cafebreria-library');root['inventoryId']='native:cafebreriaLibrary';root['inventoryNumber']=51;root['units']='m';root['referenceStatus']='confirmed_original_demo_template';root['behavior']='cafebreria-library/v1'
shelf=group('estanteria-libros',root);shelf.location.x=.8
parts=[]
def box(name,w,h,d,x,y,z,mat,parent=shelf):
 bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,0));o=bpy.context.object;o.name=name;o.parent=parent;o.location=(x,-z,y);o.scale=(w,d,h);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);o['componentId']=name;parts.append(o);return o
W,D,H,t=1.6,.28,1.1,.025;gap=(H-t)/3
for side,x in [('left',-W/2+t/2),('right',W/2-t/2)]:box('library-side-'+side,t,H,D,x,H/2,D/2,wood)
for i in range(4):box('library-board-'+str(i),W,t,D,0,min(i*gap,H-t)+t/2,D/2,wood)
box('library-back',W-2*t,H-t,.012,0,H/2,.006,back);box('library-brass',W*.98,.012,.012,0,H+.03,D*.6,brass)
tv=group('tele-sabias-que',shelf);tv.location=(W/2-.19,-D*.48,2*gap+t+.014)
box('tv-case',.30,.225,.17,0,.119,0,shell,tv);box('tv-frame',.248,.174,.008,-.012,.128,.09,dark,tv);box('tv-display',.228,.145,.001,-.012,.128,.096,dark,tv)
for x in [-.1,.1]:box('tv-foot-'+str(x),.032,.016,.14,x,.008,0,dark,tv)
bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.011,depth=.009);dial=bpy.context.object;dial.name='tv-dial';dial.parent=tv;dial.location=(.13,-.095,.1);dial.rotation_euler.x=math.pi/2;dial.data.materials.append(brass);parts.append(dial)
books=group('libros-capsulas',shelf)
for i,m in enumerate(META['libros'][:6]):
 book=group('seed-book-'+m['slug'],books);book['capsula']=m['capsula']['id'];L=.24;bw=.15;th=.035
 x=-.62+(i%3)*.23;y=(gap if i<3 else 2*gap)+t+L/2
 body=box('book-'+str(i),bw,L,th,x,y,D-th/2-.015,paper,book)
 p=SRC/'libros'/m.get('portada_local',f"portadas/{m['slug']}.jpg")
 if p.exists():
  cover=material('cover-'+m['slug'],(.8,.8,.7));im=cover.node_tree.nodes.new('ShaderNodeTexImage');im.image=bpy.data.images.load(str(p));im.image.pack();cover.node_tree.links.new(im.outputs['Color'],cover.node_tree.nodes.get('Principled BSDF').inputs['Base Color']);obj=box('cover-'+str(i),bw,L,.001,x,y,D-.014,cover,book)
  # Front UV maps cover upright, no generated/projection distortion.
  for poly in obj.data.polygons:
   for li in poly.loop_indices:
    v=obj.data.vertices[obj.data.loops[li].vertex_index].co;obj.data.uv_layers.active.data[li].uv=(v.x/bw+.5,v.z/L+.5)
vinyls=group('vinilos-preview',shelf)
for i in range(6):
 bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.099,depth=.008);o=bpy.context.object;o.name='vinyl-preview-'+str(i);o.parent=vinyls;o.location=((i-2.5)*.225,-(D-.064),t+.108);o.rotation_euler.x=math.pi/2;o.data.materials.append(dark);o['vinilo']=str(i);parts.append(o)
scene['provenance']='Confirmed original Cafebreria Stock 1790375438696-1ladz7 + runtime builder #4397';scene['quantityScope']='one_visual_template_not_physical_stock'
for tier in ['good','better','best']:
 root['quality']=tier;root['qualityMeaning']='shared original structure; Good renders sharp pixel art, Better standard, Best precise texture sampling'
 for image in bpy.data.images:
  if image.source=='FILE':image.pack()
 bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(tier+'.blend')))
 bpy.ops.export_scene.gltf(filepath=str(OUT/(tier+'.glb')),export_format='GLB',use_active_scene=True,export_extras=True,export_yup=True)
print('LIBRARY_EXPORTED',json.dumps({'meshes':len(parts),'size':[W,D,H],'files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in OUT.glob('*') if p.suffix in ['.glb','.blend']}}))
