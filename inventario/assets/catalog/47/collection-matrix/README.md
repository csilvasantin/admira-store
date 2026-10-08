# Matrix · Expositor Starbucks · piezas independientes / independent parts

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
