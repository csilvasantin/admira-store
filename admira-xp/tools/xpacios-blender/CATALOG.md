# Catálogo Blender de XpaceOS

Misión DCL-bce31feb5a392a554cc40b74 · Hoy #173 · OraculoMacMini.

Las 43 identidades de `inventario/registry.json` tienen GLB y fuente Blender en Good, Better y Best. El Mostrador 1 conserva su piloto; las otras 42 piezas están en `inventario/assets/catalog/02` … `43`. Son interpretaciones de diseño, no modelos medidos. Los nombres de Pixeria se corrigen en `registry.labels`; el ID remoto y el número de CLI permanecen intactos.

- Las piezas 2–18 parten de la geometría nativa de `life-scene.mjs`, con materiales y rótulos editables. El piloto Best de la Estantería 2 dispone de un generador propio; Good y Better conservan el modelo anterior. La puerta conserva una bisagra independiente y las pantallas conservan `mediaSurface=existing_shared_player`.
- Las piezas 19–43 se modelan mediante primitivas con volumen completo: asientos, respaldos, patas, vehículos, carcasas y detalles temáticos. El cuadro 32 conserva la ilustración Pixeria en una imagen empaquetada; no se presenta como una escultura de los personajes.
- Los tres perfiles varían la geometría: Good simplifica curvas y bordes, Better usa detalle intermedio y Best conserva curvas y biseles. 8/16/32 son nombres de estilos, no profundidades literales de color.
- Las fuentes conservan piezas y modificadores editables. La exportación web agrupa las piezas estáticas por acabado para reducir llamadas de dibujo. Las bisagras y superficies de vídeo se mantienen separadas.

## Estantería 2 · Best específico / Shelving 2 · dedicated Best

ES: `build_shelves_best.py` genera únicamente los recursos Best del directorio `inventario/assets/catalog/02/`; no reemplaza Good ni Better. Guardar y comprobar los hashes de `good.glb`, `good.blend`, `good.manifest.json`, `better.glb`, `better.blend` y `better.manifest.json` antes y después. Una regeneración general con `build_catalog.py --only 2` omite Best para conservar el maestro detallado; usar el generador específico para regenerarlo.

EN: `build_shelves_best.py` generates only Best resources in `inventario/assets/catalog/02/`; it does not replace Good or Better. Save and check hashes of `good.glb`, `good.blend`, `good.manifest.json`, `better.glb`, `better.blend` and `better.manifest.json` before and after. A general regeneration with `build_catalog.py --only 2` skips Best to preserve the detailed master; use the dedicated generator to rebuild it.

Desde la raíz del repositorio / From the repository root:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python-exit-code 1 --python admira-xp/tools/xpacios-blender/build_shelves_best.py -- --output inventario/assets/catalog/02 --resolution 1000
```

ES: Los mapas se generan de forma determinista con NumPy incluido en Blender. `--skip-render` omite la imagen de revisión; `--resolution` controla su tamaño. El generador no requiere imágenes descargadas ni complementos.

EN: Maps are generated deterministically with Blender's bundled NumPy. `--skip-render` omits the review image; `--resolution` controls its size. The generator requires no downloaded images or add-ons.

ES: Contrato geométrico: `inventoryId=native:shelves`, `inventoryNumber=2`, cinco niveles, huella `1 × 2`, altura aproximada `2,235` unidades de casilla y cara larga hacia `+X` en Three. Blender conserva X=columna, -Y=fila, Z=altura. No añadir una rotación o escala de corrección en el cargador: el nodo lógico mantiene posición, giro y escala del ejemplar. Las proporciones son de diseño, sin calibración métrica.

EN: Geometry contract: `inventoryId=native:shelves`, `inventoryNumber=2`, five levels, a `1 × 2` footprint, approximately `2.235` grid units high and the long front facing Three's `+X` axis. Blender retains X=column, -Y=row, Z=height. Do not add a corrective rotation or scale in the loader: the logical node retains the instance's position, rotation and scale. Proportions are design units without metric calibration.

ES: Diferencia Best: mapas PNG de veta de roble, normal y rugosidad horneados y empaquetados; uniones, trasera encajada, pies, tornillos y perforaciones; perfiles portaetiquetas de latón; paquetes plegados con etiquetas y botellas torneadas. El maestro conserva piezas semánticas editables y el GLB agrupa geometría estática por acabado para limitar llamadas de dibujo. El estudio de revisión no forma parte del modelo web. El relleno visual no es stock confirmado y los acabados no acreditan el material de un mueble físico.

EN: Best difference: baked, packed PNG oak grain, normal and roughness maps; joinery, a recessed back, feet, screws and support holes; brass label rails; folded labelled packages and lathed bottles. The master retains editable semantic parts and the GLB groups static geometry by finish to bound draw calls. The review studio is excluded from the web model. Visual filling is not confirmed stock and finishes do not establish a physical fixture's materials.

ES: Comparación directa en `/inventario/?asset=2&quality=best`, con selector Good / Better / Best en el visor 360 y descargas del perfil seleccionado. El mismo registro y cargador conectan el modelo a Better/Best de la Xperience, sin nuevas identidades o escrituras de distribución. La Estantería Starbucks 47 queda fuera de este piloto.

EN: Compare directly at `/inventario/?asset=2&quality=best`, using the 360 viewer's Good / Better / Best selector and downloads for the selected profile. The same registry and loader connect the model to the Xperience's Better/Best modes, without new identities or placement writes. Starbucks Shelving 47 is outside this pilot.

ES: Verificado: maestro editable reabierto, GLB reimportado, cuatro mapas internos, normales exteriores y límites conservados; seis hashes Good/Better intactos. 28 pruebas de catálogo, inventario, colocación y editor correctas. Visor WebGL compara Better/Best y descarga el perfil elegido. Los productos son relleno de diseño; no representan stock medido. Solo #2 incorpora este piloto.

EN: Verified: editable master reopened, GLB reimported, four embedded maps, outward normals and preserved bounds; all six Good/Better hashes unchanged. 28 catalog, inventory, placement and editor tests pass. WebGL viewer compares Better/Best and downloads the selected profile. Products are design filling, not measured stock. Only #2 includes this pilot.

## Desglose de componentes / Component breakdown

ES: Cada ficha del catálogo ofrece **Desglose** junto a **Ver pieza**. `inventario/components.json` describe los componentes del modelo Best con IDs y números permanentes, etiquetas ES/EN, cantidades, subcomponentes y rutas de procedencia. Las cantidades principales corresponden a un activo; las de los subcomponentes, a una unidad de su padre. Actualizar este contrato al cambiar la composición del modelo. Son cantidades del diseño representado, no stock ni datos de una ficha ITIL.

EN: Each catalogue card provides **Desglose (Breakdown)** beside **Ver pieza (View item)**. `inventario/components.json` describes Best model components with permanent IDs and numbers, ES/EN labels, quantities, subcomponents and provenance paths. Top-level quantities apply to one asset; subcomponent quantities apply to one parent unit. Update this contract when changing model composition. These are represented design quantities, not stock or ITIL record data.

[Guía y contrato ES/EN / ES/EN guide and contract](../../docs/inventory-breakdown.md).
