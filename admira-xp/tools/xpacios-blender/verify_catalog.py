"""Reopen editable sources and web GLBs to validate every new asset."""
import bpy,json
from pathlib import Path
root=Path.cwd()/'inventario/assets/catalog';results=[]
for n in range(2,44):
 folder=root/f'{n:02}'
 bpy.ops.wm.open_mainfile(filepath=str(folder/'best.blend'))
 assert any(o.get('inventoryNumber')==n for o in bpy.context.scene.objects),(n,'source identity')
 editable=sum(o.type=='MESH' for o in bpy.context.scene.objects)
 assert editable>0
 bpy.ops.wm.read_factory_settings(use_empty=True)
 bpy.ops.import_scene.gltf(filepath=str(folder/'best.glb'))
 assert any(o.get('inventoryNumber')==n for o in bpy.context.scene.objects),(n,'GLB identity')
 meshes=[o for o in bpy.context.scene.objects if o.type=='MESH'];assert meshes
 assert all(len(o.data.vertices)>0 and len(o.data.polygons)>0 for o in meshes)
 assert all(o.type not in ('CAMERA','LIGHT') for o in bpy.context.scene.objects)
 if n==8:assert any(o.get('doorHinge') for o in bpy.context.scene.objects)
 if n in (13,14):assert any(o.get('mediaSurface')=='existing_shared_player' for o in meshes)
 results.append({'number':n,'source_opened':True,'glb_reimported':True,'source_meshes':editable,'web_meshes':len(meshes)})
 print('VERIFIED',n,flush=True)
(root/'validation.json').write_text(json.dumps({'blender':bpy.app.version_string,'models':results},indent=2)+'\n')
