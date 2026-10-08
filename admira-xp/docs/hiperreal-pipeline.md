# Hiperreal · pipeline por tandas

Hiperreal es el acabado fotorrealista del catálogo: texturas PBR CC0 reales, imperfección (huellas, manchas, variación de posición y giro), cantos biselados y luz de tienda. Se generó a mano en la pieza 47 (piloto) y ahora sale de un pipeline reutilizable que se ejecuta por tandas.

## Estado

| Tanda | Piezas | Publicada |
|---|---|---|
| 0 · piloto | 47 Estantería de tazas y café Starbucks | 08-10-2026 |
| 1 · Starbucks | 44 Barra de preparación, 45 Mostrador de caja, 46 Vitrina, 48 Mesa redonda, 49 Silla, 50 Botellero Solán de Cabras, 52 iPad horizontal | 08-10-2026 |

Las piezas con Hiperreal están en `HIPERREAL_BATCHES` de `inventario/quality-model.mjs`.

## Dónde se ve

- Inventario: `/inventario/?asset=<n>&quality=hiperreal` (o `quality=all` para comparar). Cada pieza enlaza su render antes/después en Cycles y su GLB HD.
- Gemelo, perfil **Best**: `/inventario añadir <n>` y la escena del proyecto Starbucks colocan el GLB Hiperreal; si no existe o falla la descarga, cae a Matrix y después a Best (`cloneTwinFurniture`). Better y Good no cambian.
- En la escena Starbucks (Best) los cuerpos de la barra (44), la caja (45) y la vitrina (46) vienen del catálogo; las cafeteras, vasos y la pantalla del TPV siguen siendo procedurales y en vivo. Mesas y sillas siguen procedurales en la escena (la mesa se dibuja junto a sus sillas); en el Inventario sí tienen Hiperreal.
- En el gemelo sólo los materiales Hiperreal/Matrix reciben reflejos de un pequeño entorno de paneles de luz; el resto de la escena conserva su aspecto y su coste.

## Ficheros por pieza

- `inventario/assets/catalog/<nn>/hiperreal.glb` · LOD web (texturas de color a 2K y mapas de datos a 1K en WebP; objetivo ≤ 5 MB).
- `inventario/assets/catalog/<nn>/hiperreal/hiperreal-hd.glb` · LOD HD para Unreal (color 4K, datos 2K).
- `inventario/assets/catalog/<nn>/hiperreal.blend` · máster; las texturas de la biblioteca se comparten en `inventario/assets/hiperreal-tex/` (ruta relativa `//../../hiperreal-tex/`).
- `inventario/assets/catalog/<nn>/hiperreal.manifest.json` · clases de material, tamaños, fuentes CC0.
- `inventario/assets/catalog/<nn>/hiperreal/preview/` · comparativa antes/después.

Se conservan los nombres de objeto y todas las propiedades de inventario (`inventoryNumber`, `inventoryId`, `mediaSurface`, `surfaceId`, `screenTarget`…).

## Pipeline (`admira-xp/tools/hiperreal/`)

1. `pipeline.py --mode build` (Blender 5.2, sobre el `.blend` del perfil de origen, normalmente Best):
   - Escala uniforme de productos cuando un padre los aplasta (`uniform_products`, el problema de la 47).
   - Aplica los biseles procedurales a la geometría.
   - Clasifica cada material por nombre (palabras clave), por color de la paleta Starbucks o por color/metalicidad, y le asigna un juego PBR CC0: `wood`, `wood_dark`, `wood_stained`, `stone`, `metal`, `metal_dark`, `powder`, `glass`, `led`, `ceramic`, `paper`, `cardboard`, `plastic`, `pastry`, `rubber`, `screen`, `gloss_black`, `keep`.
   - `texlib.py` tiñe la veta real (roble Poly Haven 4K, piedra) al color de diseño de cada material y genera ORM con huellas y manchas (ambientCG).
   - UV a escala física (veta a lo largo de la tabla).
   - Variación sembrada por nombre en objetos sueltos (bollería, platos, etiquetas).
   - Exporta el HD y guarda el máster.
2. `lod.sh <n>` · `gltf-transform`: dedup → resize 2K/1K → WebP q84 (→ quantize si pasa de 5 MB).
3. `pipeline.py --mode before|after` · render rápido en Cycles (32 muestras): estudio Matrix neutro frente a tienda (HDRI comfy_cafe, focos cálidos, suelo de hormigón, pared de yeso, polvo y bisel de sombreado sólo en render).
4. `compose.py <tanda> "<piezas>"` · `/workspace/uploads/hiperreal-tanda<N>-comparativa.png` y JPG por pieza.

`run_batch.sh "<piezas>" [muestras]` encadena build + before + after. Los ajustes por pieza van en `pieces.json` (`material_classes`, `coat`, `front`, `expo`, `led_render`, `keep_uvs`, `jitter`…).

## Límites honestos

- Hiperreal mejora materiales, luz e imperfección; no remodela. Las piezas de geometría muy simple (silla 49, mesa 48, cajas de la barra) siguen siendo cajas bien acabadas.
- El botellero 50 ya era PBR: gana sobre todo peso web (4,96 MB → 1,0 MB) y la luz Hiperreal.
- Las medidas siguen siendo interpretativas, no un levantamiento.
