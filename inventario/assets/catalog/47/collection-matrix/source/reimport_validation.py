"""Blender round-trip verification, with geometry/world bounds."""
import bpy,json,sys
from pathlib import Path
from mathutils import Vector
BASE=Path(__file__).resolve().parent.parent
inventory=json.loads((BASE/'inventory.json').read_text())
bpy.ops.wm.open_mainfile(filepath=str(BASE/'assets/coffee-display.blend'))
assert not any(o.type in {'CAMERA','LIGHT'} for o in bpy.context.scene.objects)
for item in inventory['items']:
    ob=bpy.data.objects.get(item['node'])
    assert ob is not None and ob.type=='EMPTY' and len(ob.children_recursive)>0,item
    assert ob['component_id']==item['id'] and ob['parent_ci']=='PDG103-EST-01'
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(BASE/'assets/coffee-display.glb'))
for item in inventory['items']:
    ob=bpy.data.objects.get(item['node'])
    assert ob is not None and len(ob.children_recursive)>0,item
    assert ob['component_id']==item['id'],item
    assert any(o.type=='MESH' for o in ob.children_recursive),item
assert not any(o.type in {'CAMERA','LIGHT'} for o in bpy.context.scene.objects)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
catalog_path=BASE/'assets/catalog-47-matrix.glb'
if not catalog_path.exists(): catalog_path=BASE.parent/'matrix.glb'
if not catalog_path.exists():
    report={'status':'passed','independent_roots':len(inventory['items']),'blend_source_reopened':True,'assembly_glb_reimported':True,'catalog_glb_reimported':False,'note':'Standalone collection has no floor-grid catalogue variant.'}
    (BASE/'roundtrip-validation.json').write_text(json.dumps(report,indent=2)+'\n')
    print('ROUNDTRIP_PASSED',json.dumps(report)); sys.exit(0)
bpy.ops.import_scene.gltf(filepath=str(catalog_path))
bpy.context.view_layer.update()
coords=[o.matrix_world@Vector(corner) for o in bpy.context.scene.objects if o.type=='MESH' for corner in o.bound_box]
bounds=[[min(v[i] for v in coords),max(v[i] for v in coords)] for i in range(3)]
dimensions=[b-a for a,b in bounds]
assert abs(dimensions[0]-.93)<.005 and abs(dimensions[1]-3.04)<.005 and abs(dimensions[2]-2.53)<.005,dimensions
root=bpy.data.objects['StarbucksShelves_47']
assert root['inventoryId']=='native:starbucksShelves' and root['inventoryNumber']==47
report={'status':'passed','independent_roots':len(inventory['items']),'blend_source_reopened':True,'assembly_glb_reimported':True,'catalog_glb_reimported':True,'no_cameras_or_lights':True,'catalog_bounds_blender':bounds,'catalog_dimensions_gltf':[dimensions[0],dimensions[2],dimensions[1]],'catalog_front':'+X','units':'original scene grid','measurement_status':'unmeasured'}
(BASE/'roundtrip-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print('ROUNDTRIP_PASSED',json.dumps(report))
