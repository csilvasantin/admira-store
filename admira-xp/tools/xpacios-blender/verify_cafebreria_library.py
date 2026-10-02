import bpy,json,sys
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[3];out=ROOT/'inventario/assets/catalog/51'
results=[]
for tier in ['good','better','best']:
 bpy.ops.wm.open_mainfile(filepath=str(out/(tier+'.blend')))
 assert bpy.data.objects.get('estanteria-libros') and bpy.data.objects.get('libros-capsulas') and bpy.data.objects.get('tele-sabias-que')
 assert len([o for o in bpy.context.scene.objects if o.type=='MESH'])==32
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 bpy.ops.import_scene.gltf(filepath=str(out/(tier+'.glb')))
 objs=[o for o in bpy.context.scene.objects if o.type=='MESH'];pts=[o.matrix_world@Vector(c) for o in objs for c in o.bound_box]
 spans=[max(v[i]for v in pts)-min(v[i]for v in pts) for i in range(3)]
 assert len(objs)==32 and abs(spans[0]-1.6)<1e-5 and abs(spans[1]-.28)<1e-5 and abs(spans[2]-1.136)<1e-5,spans
 assert not [o for o in bpy.context.scene.objects if o.type in ['LIGHT','CAMERA']]
 results.append({'tier':tier,'meshes':len(objs),'bounds_xyz_blender':spans,'reopened_blend':True,'reimported_glb':True})
print('LIBRARY_VERIFIED',json.dumps(results))
