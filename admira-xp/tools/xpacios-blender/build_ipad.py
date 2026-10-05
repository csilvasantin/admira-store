"""Planned generic landscape iPad with editable bezel/display/stand, nominal proportions.
Run Blender -b --factory-startup --python-exit-code 1 --python THIS -- REPO.
No manufacturer model, physical installation or measured dimensions are claimed.
"""
import bpy,json,sys,hashlib
from pathlib import Path
ROOT=Path(sys.argv[sys.argv.index('--')+1]);OUT=ROOT/'inventario/assets/catalog/52';OUT.mkdir(parents=True,exist_ok=True)
for tier in ['good','better','best']:
 bpy.ops.wm.read_factory_settings(use_empty=True);scene=bpy.context.scene;scene.unit_settings.system='METRIC'
 parent=bpy.data.objects.new('Landscape iPad · virtual planned',None);scene.collection.objects.link(parent)
 parent['inventoryNumber']=52;parent['inventoryId']='native:ipadLandscape';parent['lifecycle']='virtual_planned';parent['physical_installation_verified']=False;parent['geometry_basis']='nominal_not_measured';parent['quality']=tier
 def mat(name,color,metal=0,rough=.35):
  m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
 alloy=mat('Dark aluminium enclosure',(.07,.08,.09),.8);black=mat('Black rounded bezel',(.009,.012,.014));glass=mat('Landscape display · 4:3',(.004,.045,.028),.15,.18);rubber=mat('Stand rubber',(.017,.018,.02),0,.85)
 def box(name,x,y,z,w,h,d,m,bevel=0):
  bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.name=name;o.parent=parent;o.location=(x,-z,y);o.scale=(w,d,h);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);o['componentId']=name
  if bevel:
   mod=o.modifiers.new('Rounded manufactured edge','BEVEL');mod.width=bevel;mod.segments={'good':1,'better':3,'best':6}[tier];bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
  return o
 box('Support base',.16,.014,.09,.28,.028,.18,rubber,.007)
 box('Support arm',.16,.092,.105,.05,.14,.04,alloy,.004)
 box('iPad body',.16,.205,.03,.32,.236,.012,alloy,.009)
 box('Bezel',.16,.205,.037,.318,.234,.004,black,.008)
 face=box('Display landscape',.16,.205,.040,.288,.216,.001,glass,.003);face['surfaceId']='starbucks-ipad-01';face['screenTarget']='starbucks-ipad-01';face['aspect']='4:3';face['mediaSurface']='landscape_ipad'
 box('Camera',.309,.205,.0405,.003,.003,.001,black,.001)
 bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(tier+'.blend')))
 bpy.ops.export_scene.gltf(filepath=str(OUT/(tier+'.glb')),export_format='GLB',export_extras=True,export_yup=True)
 meta={'number':52,'id':'native:ipadLandscape','name':'iPad horizontal · Starbucks','tier':tier,'geometry_basis':'nominal_not_measured','physical_installation_verified':False,'measured':False,'lifecycle':'virtual_planned','aspect':'4:3','mesh_count':len([o for o in scene.objects if o.type=='MESH'])}
 (OUT/(tier+'.manifest.json')).write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
print('IPAD_EXPORTED',','.join(p.name for p in OUT.iterdir()))
