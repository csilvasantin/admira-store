"""Validate actual embedded GLBs and separable inventory identities."""
import json, struct, math
from pathlib import Path
BASE=Path(__file__).resolve().parent.parent
def glb(path):
    data=path.read_bytes()
    magic,version,length=struct.unpack_from('<III',data)
    assert magic==0x46546c67 and version==2 and length==len(data),path
    n,kind=struct.unpack_from('<II',data,12)
    assert kind==0x4e4f534a,path
    doc=json.loads(data[20:20+n])
    assert not any(n.get('camera') is not None for n in doc.get('nodes',[])),path
    for image in doc.get('images',[]): assert 'bufferView' in image and 'uri' not in image,(path,image)
    for b in doc.get('buffers',[]): assert 'uri' not in b,path
    def check_uv(value):
        if isinstance(value,dict):
            for key,item in value.items():
                if key=='texCoord': assert isinstance(item,int) and item>=0,(path,'invalid texCoord',item)
                check_uv(item)
        elif isinstance(value,list):
            for item in value: check_uv(item)
    check_uv(doc)
    assert len(doc.get('meshes',[]))>0,path
    return doc,len(data)
inv=json.loads((BASE/'inventory.json').read_text())
assembly,size=glb(BASE/'assets/coffee-display.glb')
assert 'KHR_materials_volume' in assembly.get('extensionsUsed',[]),'Matrix volume extension missing'
assert sum('normalTexture' in m for m in assembly.get('materials',[]))>=30,'Matrix baked normal maps missing'
nodes={n['name']:n for n in assembly['nodes'] if 'name' in n}
ids=set(); declared=set()
for item in inv['items']:
    assert item['id'] not in ids,item['id']; ids.add(item['id'])
    assert item['node'] in nodes,item['node']
    node=nodes[item['node']]
    assert len(node.get('children',[]))>0,item
    assert node['extras']['component_id']==item['id'],item
    assert node['extras']['visual_only'] is True,item
    assert item['stock_verified'] is False,item
    t=node.get('translation',[0,0,0])
    assert all(abs(a-b)<1e-5 for a,b in zip(t,item['position'])),(item['id'],t,item['position'])
    declared.add(item['sku'])
assert len(ids)==115,(len(ids),'unexpected visual composition count')
assert inv['asset_number']==47 and inv['itil_code']=='PDG103-EST-01'
assert nodes['CI_CABINET']['extras']['inventoryNumber']==47
assert inv['shelf_count']==5 and inv['bay_count']==2
assert len(inv['skus'])==26 and len(declared)==26
for sku in inv['skus']:
    doc,_=glb(BASE/sku['asset'])
    assert sku['sku'] in declared
    assert sku['count']==sum(i['sku']==sku['sku'] for i in inv['items'])
    roots=doc['scenes'][doc.get('scene',0)]['nodes']
    assert len(roots)==1,(sku['sku'],roots)
    assert doc['nodes'][roots[0]].get('translation',[0,0,0])==[0,0,0],sku
catalog_path=BASE/'assets/catalog-47-matrix.glb'
if not catalog_path.exists(): catalog_path=BASE.parent/'matrix.glb'
catsize=None
if catalog_path.exists():
    catalog,catsize=glb(catalog_path)
    root=next(n for n in catalog['nodes'] if n.get('name')=='StarbucksShelves_47')
    assert root['extras']['inventoryId']=='native:starbucksShelves'
    assert root['extras']['inventoryNumber']==47
empty,_=glb(BASE/'assets/cabinet-empty.glb')
assert not any(n.get('extras',{}).get('visual_only') for n in empty['nodes'])
assert (BASE/'assets/coffee-display.blend').stat().st_size>100000
report={'profile':'matrix','all_texture_uv_indices_valid':True,'pbr_materials_with_normals':sum('normalTexture' in m for m in assembly.get('materials',[])),'volume_materials':sum('KHR_materials_volume' in m.get('extensions',{}) for m in assembly.get('materials',[])),'clearcoat_materials':sum('KHR_materials_clearcoat' in m.get('extensions',{}) for m in assembly.get('materials',[])),'status':'passed','instance_count':len(ids),'sku_count':len(declared),'shelves':5,'bays':2,'assembly_bytes':size,'catalog_bytes':catsize,'embedded_textures':len(assembly.get('images',[])),'mesh_count':len(assembly['meshes']),'node_count':len(assembly['nodes']),'verified':['GLB structure','embedded buffers and textures','independent named product roots','unique component IDs','transform coordinates match manifest','26 standalone centered GLBs','existing ITIL identity preserved','empty cabinet contains no products'],'limitations':['Photo proportions are nominal and unmeasured','Visual quantities are not real stock','Product components are not new patrimonial CIs']}
(BASE/'validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
