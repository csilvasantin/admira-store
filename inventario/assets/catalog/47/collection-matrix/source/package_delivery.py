"""Install the verified model into an isolated canonical checkout, preserving history."""
import json, shutil, sys, zipfile, hashlib
from pathlib import Path
BASE=Path(__file__).resolve().parent.parent
inv=json.loads((BASE/'inventory.json').read_text())
assert len(inv['items'])==115 and len(inv['skus'])==26
parts={'schema':'xpaceos.starbucks.shelf-parts/1','inventoryId':'native:starbucksShelves','inventoryNumber':47,'number':47,'profile':'matrix','parent_ci':'PDG103-EST-01','instance_id':'sb-mugs','reference_id':'PG103-004','composition_only':True,'measured':False,'shelf_count':5,'bay_count':2,'instance_count':115,'product_reference_count':26,'collection':'./collection-matrix/preview/','inventory':'./collection-matrix/inventory.json','assembly':'./collection-matrix/assets/coffee-display.glb','cabinet':'./collection-matrix/assets/cabinet-empty.glb','nominal_dimensions':inv['dimensions'],'catalog_bounds_nominal':{'x':[0,.93],'y':[0,2.53],'z':[0,3.04],'unit':'scene_grid'},'parts':[],'product_references':inv['skus'],'note_es':inv['source_note'],'note_en':inv['source_note_en']}
for item in inv['items']:
    p=dict(item)
    p.update(kind=item['sku'].split('-')[0],family=item['category'],name_es=item['label'],source_object=item['node'],product_reference=item['sku'],stock_verified=False)
    x,h,z=item['position']
    transform=inv['catalog_transform']; sx,sy,sz=transform['scale_blender']; tx,ty,tz=transform['translation_blender']
    p['position_catalog_gltf']=[tx+sy*z,tz+sz*h,-ty-sx*x]
    parts['parts'].append(p)
(BASE/'matrix.parts.json').write_text(json.dumps(parts,ensure_ascii=False,indent=2))
readme='''# Matrix · Expositor Starbucks · piezas independientes / independent parts

Matrix PBR · Modelo 47 · CI existente PDG103-EST-01 · instancia sb-mugs · PG103-004.

Materiales físicos Matrix: roble miel con mapas PBR 2K, acero cepillado, glaseado cerámico, paredes de plástico transparente y detalle en envases.

Matrix physical materials: 2K PBR honey oak, brushed steel, ceramic clearcoat, transparent plastic walls and packaging detail. Maps and editable meshes are supplied; native Unreal 5.8 output is delivered separately as matrix47-unreal.zip.

Interpretación de la fotografía: estructura metálica, madera y malla abierta; cinco niveles y dos módulos. 115 instancias independientes de 26 referencias visuales. Las medidas nominales son 2,12 × 2,18 × 0,46 m; pendientes de medición de campo. Las cantidades describen esta composición visual y no son stock confirmado ni altas patrimoniales de productos.

Photo interpretation: metal frame, timber trays and open steel mesh; five shelf levels and two bays. 115 independent instances of 26 visual product references. Nominal dimensions are 2.12 × 2.18 × 0.46 m, awaiting field measurement. Counts describe this visual arrangement, not verified stock or new patrimonial product records.

## Archivos / Files

- `assets/coffee-display.glb`: expositor completo; cada producto conserva raíz y geometría propia / complete assembly with independent product roots.
- `assets/cabinet-empty.glb`: mueble sin productos / empty cabinet.
- `assets/products/*.glb`: 26 productos aislados, origen en su base / 26 isolated products with origin at their base.
- `assets/coffee-display.blend`: fuente editable, sin fusionar productos / editable source without joining products.
- `inventory.json`: IDs, referencias, posiciones y relación con el CI / IDs, visual references, positions and parent CI relation.
- `preview/`: visor local ES/EN, selección, filtros, aislamiento, vista de despiece y descargas / local ES/EN viewer with selection, filters, isolation, exploded view and downloads.
- `validation.json`: comprobación real de assets / actual asset verification.

## Abrir / Open

Publicación / Published collection: https://www.xpaceos.com/inventario/assets/catalog/47/collection-matrix/preview/

Local: sirve esta carpeta con `python3 -m http.server 8847` y abre `http://localhost:8847/preview/`.

GLB uses metres, Y-up, +Z facing forward, origin at the cabinet centre on the floor. Blender source uses Z-up and front -Y. Product instances have stable `47-P001`…`47-P115` IDs in extras, `parent_ci`, SKU reference, shelf and bay. Repeated designs share mesh data but retain independent roots and transforms. Embedded GLB materials/textures require no external image files.

The new catalogue Matrix 47 uses the original floor-grid orientation and approximate footprint 0.93 × 3.04 scene units, height 2.53, front +X, preserving its placement in the Starbucks twin. Existing Good/Better profiles and earlier Best history are retained. The separable collection and upgraded PBR geometry are available in Matrix; Good, Better and Best retain their existing assets.

## Reconstruir / Rebuild

Blender 5.2.1 LTS: `blender --background --factory-startup --threads 4 --python source/build_scene.py`.

For geometry export without studio renders add `-- --skip-render`. Verify with `python3 source/validate_assets.py`. Product geometry is authored in `source/products.py`; all product markings are approximate visual interpretations, not manufacturer artwork or measured product specifications.

Three.js r160 MIT license: `preview/vendor/THREE-LICENSE.txt`.
'''
(BASE/'README.md').write_text(readme)
manifest={'number':47,'name':'Estantería de tazas y café Starbucks','tier':'matrix','geometry_basis':'photo_interpretation','measured':False,'instance_id':'sb-mugs','itil_code':'PDG103-EST-01','mesh_count':json.loads((BASE/'validation.json').read_text())['mesh_count'],'shelf_count':5,'bay_count':2,'independent_products':115,'product_references':26,'parts':'./matrix.parts.json','collection':'./collection-matrix/preview/','composition_only':True,'source':'./collection-matrix/source/build_scene.py','pbr_texture_maps':'./collection-matrix/source/textures/texture-manifest.json','physical_wall_thickness':True,'native_unreal_package':'https://github.com/csilvasantin/xpaceos/releases/download/matrix47-20261008/matrix47-unreal.zip','native_unreal_render':'./collection-matrix/preview/unreal-studio.png','native_verification':'./collection-matrix/unreal-verification.json','native_delivery_status':'verified'}
(BASE/'matrix.manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
package_manifest=dict(manifest,collection='./preview/',source='./source/build_scene.py',pbr_texture_maps='./source/textures/texture-manifest.json',native_unreal_package='https://github.com/csilvasantin/xpaceos/releases/download/matrix47-20261008/matrix47-unreal.zip',native_unreal_render='./preview/unreal-studio.png',native_verification='./unreal-verification.json')
(BASE/'manifest.json').write_text(json.dumps(package_manifest,ensure_ascii=False,indent=2)+'\n')
payload=[]
for directory in ['assets','source','preview']:
    for path in (BASE/directory).rglob('*'):
        if not path.is_file(): continue
        relative=path.relative_to(BASE)
        if path.name.endswith(('.blend1','.log','.pyc')) or '__pycache__' in relative.parts or 'qa' in relative.parts: continue
        if path.name.startswith('catalog-47-') or path.name=='matrix-render-studio.blend': continue
        payload.append(relative)
payload += [Path(n) for n in ['inventory.json','validation.json','roundtrip-validation.json','README.md','matrix.parts.json','matrix.manifest.json','manifest.json','unreal-verification.json']]
archive=BASE/'coffee-display-matrix-itil.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for relative in payload: z.write(BASE/relative,relative.as_posix())
for target in [Path(p) for p in sys.argv[1:]]:
    folder=target/'inventario/assets/catalog/47'; folder.mkdir(parents=True,exist_ok=True)
    history=folder/'history/20261008-before-coffee47-matrix'; history.mkdir(parents=True,exist_ok=True)
    for name in ['matrix.glb','matrix.blend','matrix.manifest.json']:
        if (folder/name).exists() and not (history/name).exists(): shutil.copy2(folder/name,history/name)
    collection=folder/'collection-matrix'; collection.mkdir(exist_ok=True)
    for relative in payload:
        dest=collection/relative; dest.parent.mkdir(parents=True,exist_ok=True); shutil.copy2(BASE/relative,dest)
    shutil.copy2(archive,collection/archive.name)
    shutil.copy2(BASE/'assets/catalog-47-matrix.glb',folder/'matrix.glb')
    shutil.copy2(BASE/'assets/catalog-47-matrix.blend',folder/'matrix.blend')
    shutil.copy2(BASE/'matrix.parts.json',folder/'matrix.parts.json')
    (folder/'matrix.manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print('INSTALLED',target,115,26,'archive',archive.stat().st_size)
