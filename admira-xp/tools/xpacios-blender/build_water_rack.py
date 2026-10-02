"""PG103 interpreted wire water rack and individually editable PET bottles.
Blender --background --factory-startup --python-exit-code 1 --python THIS -- REPO
Nominal metres are modelling proportions, not a measured store survey.
"""
import bpy, math, json, pathlib, sys
from mathutils import Vector
root=pathlib.Path(sys.argv[sys.argv.index('--')+1]);out=root/'inventario/assets/catalog/50';tex=out/'textures'
out.mkdir(parents=True,exist_ok=True)
IDENTITY='native:starbucksWaterRack'
def linear(v):return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
def material(name,color,rough=.3,metal=0,transmission=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF')
 rgba=tuple(linear(c) for c in color)+(1,);m.diffuse_color=rgba;b.inputs['Base Color'].default_value=rgba
 b.inputs['Roughness'].default_value=rough;b.inputs['Metallic'].default_value=metal
 b.inputs['Transmission Weight'].default_value=transmission;b.inputs['IOR'].default_value=1.46
 return m
def image_node(m,file,colorspace='sRGB'):
 im=bpy.data.images.load(str(tex/file),check_existing=True);im.colorspace_settings.name=colorspace;im.pack()
 n=m.node_tree.nodes.new('ShaderNodeTexImage');n.image=im;return n
def pbr_maps(m,orm_file):
 n=image_node(m,orm_file,'Non-Color');s=m.node_tree.nodes.new('ShaderNodeSeparateColor');m.node_tree.links.new(n.outputs['Color'],s.inputs['Color'])
 b=m.node_tree.nodes.get('Principled BSDF');m.node_tree.links.new(s.outputs['Green'],b.inputs['Roughness']);m.node_tree.links.new(s.outputs['Blue'],b.inputs['Metallic'])
def add_material(obj,m):obj.data.materials.append(m)
def tag(obj,part,bottle=None):
 obj['inventoryNumber']=50;obj['inventoryId']=IDENTITY;obj['inventory_asset']=IDENTITY
 obj['part']=part;obj['geometry_basis']='interpretive_nominal_metres_not_field_measurements'
 if bottle:obj['bottle_instance']=bottle;obj['stock_quantity_verified']=False
 for poly in obj.data.polygons:poly.use_smooth=True
 return obj
def mesh_obj(name,verts,faces,uvs=None):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o)
 if uvs:
  uv=me.uv_layers.new(name='UVMap')
  for p,coords in zip(me.polygons,uvs):
   for loop,co in zip(p.loop_indices,coords):uv.data[loop].uv=co
 return o
def lathe(name,profile,segments,mat,squared=False):
 verts=[]
 for z,r in profile:
  for j in range(segments):
   a=2*math.pi*j/segments;s=math.sin(a);c=math.cos(a)
   exp=.88 if squared and z<.142 else 1
   verts.append((r*math.copysign(abs(s)**exp,s),-r*math.copysign(abs(c)**exp,c),z))
 faces=[];uv=[];h=profile[-1][0]
 for i in range(len(profile)-1):
  for j in range(segments):
   k=(j+1)%segments;faces.append((i*segments+j,i*segments+k,(i+1)*segments+k,(i+1)*segments+j))
   # Printed front faces -Y, centred at UV x=.5.
   u=j/segments+.5;v=profile[i][0]/h;vv=profile[i+1][0]/h
   uv.append(((u,v),(u+1/segments,v),(u+1/segments,vv),(u,vv)))
 faces.extend([tuple(reversed(range(segments))),tuple((len(profile)-1)*segments+j for j in range(segments))]);uv.extend([[(0,0)]*segments,[(1,1)]*segments])
 obj=mesh_obj(name,verts,faces,uv);add_material(obj,mat);return obj
def rod(name,a,b,r,mat,seg=10):
 delta=Vector(b)-Vector(a);mid=(Vector(a)+Vector(b))/2
 bpy.ops.mesh.primitive_cylinder_add(vertices=seg,radius=r,depth=delta.length,location=mid);o=bpy.context.object;o.name=name;o.rotation_euler=delta.to_track_quat('Z','Y').to_euler();add_material(o,mat);return tag(o,'rack_wire')
def ring(name,r,z,wire,mat,seg):
 bpy.ops.mesh.primitive_torus_add(major_radius=r,minor_radius=wire,major_segments=seg,minor_segments=8,location=(0,0,z));o=bpy.context.object;o.name=name;add_material(o,mat);return tag(o,'rack_ring')
def cube(name,loc,size,mat,bevel=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);add_material(o,mat)
 if bevel:mod=o.modifiers.new('Soft manufactured edges','BEVEL');mod.width=bevel;mod.segments=2
 return tag(o,'sign' if name.startswith('Sign') else 'rack_foot')
def studio(scene):
 c=bpy.data.collections.new('STUDIO_RENDER_ONLY');scene.collection.children.link(c)
 def move(o):
  for coll in list(o.users_collection):coll.objects.unlink(o)
  c.objects.link(o)
 floor=material('Studio warm concrete',(.53,.53,.49),.85)
 bpy.ops.mesh.primitive_plane_add(size=200);o=bpy.context.object;o.name='Studio floor';add_material(o,floor);move(o)
 for name,loc,energy,size in [('Key',(-2,-3,4),380,3),('Fill',(3,-1,2),240,2),('Rim',(1,3,3),520,2)]:
  bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,.6))-o.location).to_track_quat('-Z','Y').to_euler();move(o)
 bpy.ops.object.camera_add(location=(1.15,-1.65,1.43));o=bpy.context.object;o.name='Studio camera';o.rotation_euler=(Vector((0,0,.52))-o.location).to_track_quat('-Z','Y').to_euler();o.data.lens=58;scene.camera=o;move(o)
 return c
for tier in ['good','better','best']:
 bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene;scene.unit_settings.system='METRIC'
 seg={'good':16,'better':32,'best':64}[tier];wireseg=8 if tier=='good' else 12
 steel=material('Black powder-coated wire · PBR',(.045,.049,.052),.35,.62);pbr_maps(steel,'steel-orm.png')
 n=image_node(steel,'steel-normal.png','Non-Color');norm=steel.node_tree.nodes.new('ShaderNodeNormalMap');norm.inputs['Strength'].default_value=.16;steel.node_tree.links.new(n.outputs['Color'],norm.inputs['Color']);steel.node_tree.links.new(norm.outputs['Normal'],steel.node_tree.nodes.get('Principled BSDF').inputs['Normal'])
 pet=material('Cobalt blue PET · interpreted print',(.035,.17,.50),.18,0,.22);pbr_maps(pet,'bottle-orm.png')
 n=image_node(pet,'bottle-basecolor.png');pet.node_tree.links.new(n.outputs['Color'],pet.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 pet.node_tree.nodes.get('Principled BSDF').inputs['Coat Weight'].default_value=.38;pet.node_tree.nodes.get('Principled BSDF').inputs['Coat Roughness'].default_value=.12
 cap=material('White ribbed polypropylene cap',(.91,.91,.865),.32);seal=material('White tamper band',(.88,.88,.84),.30)
 collar=material('Solán de Cabras · interpreted white neck print',(.93,.93,.90),.36)
 n=image_node(collar,'neck-band-basecolor.png');collar.node_tree.links.new(n.outputs['Color'],collar.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 black=material('Black sign support',(.028,.031,.032),.43);label=material('AGUA MINERAL · reference sign',(.03,.03,.03),.5)
 n=image_node(label,'water-sign.png');label.node_tree.links.new(n.outputs['Color'],label.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
 rubber=material('Black rubber feet',(.033,.034,.032),.85)
 # Circular wire basket, tapered from the 0.42m rim to its 0.36m base.
 ring('Basket upper rolled rim',.210,.740,.0040,steel,seg)
 ring('Basket reinforcement',.197,.668,.0025,steel,seg)
 ring('Basket base perimeter',.180,.590,.0030,steel,seg)
 for i in range(40 if tier=='good' else 56):
  a=math.tau*i/(40 if tier=='good' else 56);rod('Basket upright %02d'%i,(.18*math.cos(a),.18*math.sin(a),.590),(.21*math.cos(a),.21*math.sin(a),.740),.0016,steel,wireseg)
 # Wire bottom supports the bottles; no opaque basket insert.
 for i in range(-8,9):
  x=i*.020;y=math.sqrt(max(0,.178**2-x*x));rod('Basket floor horizontal %02d'%i,(x,-y,.589),(x,y,.589),.0014,steel,wireseg);rod('Basket floor vertical %02d'%i,(-y,x,.588),(y,x,.588),.0014,steel,wireseg)
 feet=[(-.16,-.16),(.16,-.16),(.16,.16),(-.16,.16)]
 for i,(x,y) in enumerate(feet):
  rod('Stand leg %d'%i,(x,y,.012),(x*.82,y*.82,.615),.0032,steel,wireseg)
  cube('Rubber foot %d'%i,(x,y,.008),(.014,.014,.015),rubber,.002)
  nx,ny=feet[(i+1)%4];rod('Low stand frame %d'%i,(x,y,.025),(nx,ny,.025),.0026,steel,wireseg)
 # Crossed braces visible through the open slender stand.
 rod('Stand diagonal A',(-.16,-.16,.025),(.13,.13,.565),.0025,steel,wireseg)
 rod('Stand diagonal B',(.16,-.16,.025),(-.13,.13,.565),.0025,steel,wireseg)
 sign=cube('Sign black board',(0,.154,.848),(.064,.004,.285),black,.001)
 # Front-facing plane with packed UV texture.
 verts=[(-.032,.1518,.705),(.032,.1518,.705),(.032,.1518,.990),(-.032,.1518,.990)]
 o=mesh_obj('Sign AGUA MINERAL face',verts,[(0,1,2,3)],[[(0,0),(1,0),(1,1),(0,1)]]);add_material(o,label);tag(o,'sign_print')
 # PET body with injection neck, round shoulder, base/chamfer and fine mould rings.
 profile=[(.001,.018),(.003,.028),(.008,.031),(.013,.0325),(.018,.033),(.029,.033),(.033,.0323),(.037,.033),(.066,.033),(.070,.0326),(.074,.033),(.126,.033),(.130,.0325),(.134,.033),(.165,.0328),(.179,.0315),(.190,.0275),(.202,.020),(.209,.014),(.214,.0115),(.225,.0115)]
 bottleparts=[]
 profile=[(z*.8,r*1.091) for z,r in profile]
 body=lathe('PET blue bottle body',profile,seg,pet,True);tag(body,'bottle_body','bottle-01');bottleparts.append(body)
 if tier=='best':
  mod=body.modifiers.new('PET thin wall','SOLIDIFY');mod.thickness=.001;mod.offset=-1
 # Neck white tamper seal and ribbed cap.
 neck=lathe('White tamper seal',[(.222*.8,.0168),(.224*.8,.0175),(.229*.8,.0175),(.230*.8,.0168)],seg,seal);tag(neck,'bottle_tamper_band','bottle-01');bottleparts.append(neck)
 neckprint=lathe('Printed white neck band',[(.203*.8,.019),(.213*.8,.0168),(.223*.8,.0168)],seg,collar);tag(neckprint,'bottle_printed_collar','bottle-01');bottleparts.append(neckprint)
 # Collar UVs use its own short height, not the whole bottle height.
 for uv in neckprint.data.uv_layers.active.data:uv.uv.y=(uv.uv.y-.203/.223)/(1-.203/.223)
 capProfile=[(.229*.8,.0175),(.231*.8,.0185),(.241*.8,.0185),(.245*.8,.018),(.246*.8,.0165)]
 top=lathe('White screw cap',capProfile,seg,cap);tag(top,'bottle_cap','bottle-01');bottleparts.append(top)
 if tier!='good':
  for j in range(36):
   a=math.tau*j/36;r=.0186;rib=rod('Cap grip rib %02d'%j,(r*math.cos(a),r*math.sin(a),.232*.8),(r*math.cos(a),r*math.sin(a),.241*.8),.00042,cap,6);tag(rib,'bottle_cap_rib','bottle-01');bottleparts.append(rib)
 # Single bottle is a reusable product asset, separate from the fixture CI.
 if tier=='best':
  bpy.ops.object.select_all(action='DESELECT')
  for part in bottleparts:part.select_set(True)
  bpy.ops.export_scene.gltf(filepath=str(out/'bottle.glb'),export_format='GLB',use_selection=True,export_extras=True,export_apply=True)
  # Save a normal, directly openable scene, rather than a Blender library file.
  rack_objects=[o for o in scene.objects if o not in bottleparts]
  for o in rack_objects:scene.collection.objects.unlink(o)
  scene.name='Solán bottle · editable product';bpy.ops.wm.save_as_mainfile(filepath=str(out/'bottle.blend'))
  for o in rack_objects:scene.collection.objects.link(o)
  scene.name='Water rack · assembly'
 # Nineteen bottles, each separately named and editable; quantities are visual.
 positions=[(0,0)]
 for count,radius,offset in [(6,.071,0),(12,.142,math.pi/12)]:
  positions += [(radius*math.cos(math.tau*j/count+offset),radius*math.sin(math.tau*j/count+offset)) for j in range(count)]
 for i,(x,y) in enumerate(positions):
  group=bpy.data.objects.new('Solán de Cabras bottle %02d'%(i+1),None);bpy.context.collection.objects.link(group);group['bottle_instance']='bottle-%02d'%(i+1);group['stock_quantity_verified']=False
  for source in bottleparts:
   o=source.copy();o.data=source.data;bpy.context.collection.objects.link(o);o.name='Bottle %02d · %s'%(i+1,source.name);o.parent=group;o['bottle_instance']='bottle-%02d'%(i+1)
  group.location=(x,y,.593);group.rotation_euler.z=((i*17)%37-18)*math.pi/180
 for source in bottleparts:bpy.data.objects.remove(source,do_unlink=True)
 model_objects=list(scene.objects)
 # Editable master contains only the model, with packed maps and no camera.
 bpy.ops.object.select_all(action='SELECT');bpy.ops.wm.save_as_mainfile(filepath=str(out/(tier+'.blend')))
 bpy.ops.export_scene.gltf(filepath=str(out/(tier+'.glb')),export_format='GLB',use_selection=True,export_extras=True,export_apply=True)
 manifest={'number':50,'id':IDENTITY,'name':'Botellero Solán de Cabras Starbucks','tier':tier,'geometry_basis':'interpretive_photo_and_panorama','measured':False,'nominal_units':'metres_for_proportions_only','visual_bottle_count':19,'stock_quantity_verified':False,'bottles_individually_editable':True,'texture_basis':'deterministic_PBR_maps_and_interpreted_print','reference_visible_caps':13,'mesh_count':sum(o.type=='MESH' for o in model_objects)}
 (out/(tier+'.manifest.json')).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 if tier=='best':
  studio(scene);scene.render.engine='CYCLES';scene.cycles.samples=48
  scene.render.resolution_x=1100;scene.render.resolution_y=1300;scene.render.resolution_percentage=100
  scene.world=bpy.data.worlds.new('Studio neutral world');scene.world.color=(.25,.25,.25);scene.view_settings.view_transform='AgX';scene.render.image_settings.file_format='PNG';scene.render.filepath=str(out/'preview.png');bpy.ops.render.render(write_still=True)
 print(tier,'water rack exported')
print('Water rack: three GLBs/masters, standalone bottle, packed PBR maps and review render')
