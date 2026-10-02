"""Build independent Starbucks furniture masters from shared scene parts.
Run Blender --background --python this-file -- models.json repository-root.
Scene units are interpretive, not measurements of the physical furniture.
"""
import bpy,json,sys,pathlib,math
args=sys.argv[sys.argv.index('--')+1:];models=json.load(open(args[0]));root=pathlib.Path(args[1])
for model in models:
 for tier in ['good','better','best']:
  bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
  materials={}
  for i,p in enumerate(model['parts']):
   color=p['color'];key=(color,bool(p.get('glass')))
   if key not in materials:
    mat=bpy.data.materials.new(color);rgb=[int(color[j:j+2],16)/255 for j in (1,3,5)];mat.diffuse_color=tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in rgb)+(1,);mat.use_nodes=True
    bsdf=mat.node_tree.nodes.get('Principled BSDF');bsdf.inputs['Base Color'].default_value=mat.diffuse_color;bsdf.inputs['Roughness'].default_value=.7
    if p.get('glass'):bsdf.inputs['Transmission Weight'].default_value=.75;bsdf.inputs['Roughness'].default_value=.12
    materials[key]=mat
   x,y,z,w,h,d=(p[k] for k in ['x','y','z','w','h','d'])
   if p.get('round'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=10 if tier=='good' else 24 if tier=='better' else 48,radius=1,depth=1,location=(x+w/2,-z-d/2,y+h/2));obj=bpy.context.object;obj.scale=(w/2,d/2,h)
   else:
    bpy.ops.mesh.primitive_cube_add(size=1,location=(x+w/2,-z-d/2,y+h/2));obj=bpy.context.object;obj.scale=(w,d,h)
   obj.name=model['type']+'_'+str(i);obj.data.materials.append(materials[key]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
   if tier=='best' and min(w,h,d)>.02:
    bevel=obj.modifiers.new('Edges','BEVEL');bevel.width=min(.015,min(w,h,d)*.12);bevel.segments=2
   obj['inventoryNumber']=model['number'];obj['inventoryId']='native:'+model['type']
   obj['geometry_basis']='interpretive_scene_units_not_field_measurements';obj['inventory_asset']='native:'+model['type']
  dest=root/'inventario/assets/catalog'/str(model['number']);dest.mkdir(parents=True,exist_ok=True)
  bpy.ops.wm.save_as_mainfile(filepath=str(dest/(tier+'.blend')))
  bpy.ops.export_scene.gltf(filepath=str(dest/(tier+'.glb')),export_format='GLB',use_selection=False,export_extras=True,export_apply=True)
  (dest/(tier+'.manifest.json')).write_text(json.dumps(dict(number=model['number'],name=model['name'],tier=tier,geometry_basis='interpretive',measured=False,mesh_count=len(model['parts'])),ensure_ascii=False,indent=2)+'\n')
print('18 GLB and 18 Blender masters generated')
