# Estantería · Good, Better y Best / Shelf · Good, Better and Best

## ES

En Acabado, Todos muestra Good, Better y Best uno al lado del otro como tres modelos interactivos. Arrastrar o acercar una vista sincroniza las cámaras; Frontal, Parte posterior, Lateral y Ver malla se aplican a las tres. Cada perfil conserva sus propias descargas GLB y Blender. En la estantería #2 (native:shelves), Good usa pixel art nítido con píxeles definidos y materiales de tres tonos; Better mantiene el modelado intermedio y Best añade etiquetas de producto y cartelas de balda de alta definición sobre el mueble detallado con acabados PBR. Los 45 envases son contenido visual; se conservan identidad, número, huella 1×2, fichas ITIL, preferencias, distribución e historial CLI.

El modelo Best conserva cinco niveles, huella lógica `1 × 2`, altura aproximada de `2,235` unidades de casilla y frontal largo orientado hacia `+X` en Three. Añade madera de roble con mapas PBR de color, normal y rugosidad, laterales enmarcados, trasera encajada, uniones, pies, tornillos y perforaciones de soporte. Los perfiles de latón llevan cartelas de balda; los envases plegados y las botellas torneadas llevan etiquetas definidas de alta resolución. El maestro Blender conserva componentes editables y el GLB agrupa geometría estática por acabado.

Good tiene píxeles nítidos: materiales de tres tonos y render de baja resolución sin antialias, muestreo de vecino más cercano y escala de píxel entera. Better conserva su representación intermedia. Los binarios y las fuentes Blender Good/Better siguen disponibles; esta mejora de Good cambia su presentación en el visor. La selección de acabado mantiene los IDs, fichas ITIL, preferencias e historial CLI; no cambia la distribución personal. Las proporciones son interpretativas, sin medición del mueble real. La Estantería Starbucks #47 es independiente.

1. Abre el catálogo desde ITIL o /inventario y selecciona la estantería #2. 2. En Acabado, elige Todos. 3. Arrastra cualquiera de las tres vistas o acerca la cámara: las otras siguen la misma orientación y zoom. 4. Usa Frontal, Parte posterior, Lateral o Ver malla en Avanzados para comparar los tres perfiles. 5. Para ver un acabado solo, elige Good, Better o Best; en Todos, descarga GLB o Blender desde la columna del perfil deseado. El enlace ?asset=2&quality=all#mostrador abre directamente esta comparación. La ayuda está en español e inglés; lang=en selecciona inglés en Desglose.

## EN

In Finish, Todos (All) shows Good, Better and Best side by side as three interactive models. Dragging or zooming one view synchronizes the cameras; Front, Back, Side and Wireframe apply to all three. Each profile retains its own GLB and Blender downloads. On shelf #2 (native:shelves), Good uses crisp pixel art with defined pixels and three-tone materials; Better keeps the intermediate model and Best adds high-definition product labels and shelf cards to the detailed furniture with PBR finishes. The 45 containers are visual content; identity, number, 1×2 footprint, ITIL records, preferences, placement and CLI history are preserved.

The Best model retains five levels, a logical `1 × 2` footprint, an approximate height of `2.235` grid units and its long front facing Three's `+X` axis. It adds oak colour, normal and roughness maps, framed sides, a recessed back, joinery, feet, screws and support holes. Brass rails carry shelf cards; folded containers and turned bottles have defined high-resolution labels. The Blender master retains editable components and the GLB groups static geometry by finish.

Good has crisp pixels: three-tone materials and low-resolution rendering without antialiasing, nearest-neighbour sampling and integer pixel scaling. Better keeps its intermediate representation. Good/Better binaries and Blender sources remain available; this Good improvement changes their display in the viewer. Finish selection retains IDs, ITIL records, preferences and CLI history, and does not alter personal placement. Proportions are interpretive and not measured from physical furniture. Starbucks shelving #47 is independent.

1. Open the catalogue from ITIL or /inventory and select shelf #2. 2. In Finish, choose Todos (All). 3. Drag any of the three views or zoom: the others follow the same orientation and zoom. 4. Use Front, Back, Side or Wireframe in Advanced to compare all three profiles. 5. To inspect one finish, choose Good, Better or Best; in All, download GLB or Blender from the desired profile column. The ?asset=2&quality=all#mostrador link opens this comparison directly. Help is available in Spanish and English; lang=en selects English in Breakdown.

## Etiquetas Best / Best labels

Atlas Best: RGBA 4096×3072; 18 diseños de envase (6 variantes en caja/bolsa/botella) y 6 diseños de cartela horizontal. El modelo conserva 45 productos y 45 cartelas, cinco baldas, 604 mallas editables / 14 web y cuatro mapas PBR internos. Textos originales ilustrativos: CAFÉ, TÉ VERDE, CACAO, GRANOLA, MIEL, TÉ NEGRO; referencias A02-01…06. Revisión `shelves-labels-20261002-2`. / Best atlas: RGBA 4096×3072; 18 container designs (6 variants in box/pouch/bottle) and 6 horizontal card designs. The model retains 45 products and 45 cards, five shelves, 604 editable / 14 web meshes and four embedded PBR maps. Original illustrative text: CAFÉ, TÉ VERDE, CACAO, GRANOLA, MIEL, TÉ NEGRO; references A02-01…06. Revision `shelves-labels-20261002-2`.

## Generación y dependencias / Generation and dependencies

`build_shelves_best.py` invoca `build_shelves_labels.py` mediante Python 3 y Pillow. Para generar las etiquetas usa Arial instalada en macOS o DejaVu Sans en Linux. La fuente se rasteriza en el atlas; no se redistribuyen archivos tipográficos. El PNG completo se empaqueta en el GLB; Blender mantiene etiquetas, cartelas y referencias separadas. El papel mate y su baja reflexión facilitan el contraste.

`build_shelves_best.py` invokes `build_shelves_labels.py` through Python 3 and Pillow. Label generation uses installed Arial on macOS or DejaVu Sans on Linux. Font glyphs are rasterized into the atlas; font files are not redistributed. The complete PNG is embedded in the GLB; Blender retains separate labels, cards and references. Matte paper and low reflection improve contrast.

El PNG de previo usa el mismo atlas y geometría y fue renderizado antes del ajuste menor de reflectancia del papel. Los GLB y Blender finales incluyen el acabado mate definitivo: rugosidad `0,90` y especular `0,16`. / The preview PNG uses the same atlas and geometry and was rendered before the minor paper-reflectance adjustment. Final GLB and Blender files include the definitive matte finish: roughness `0.90` and specular `0.16`.

## Recursos y contrato / Resources and contract

- [Comparar Good, Better y Best / Compare Good, Better and Best](https://www.xpaceos.com/inventario/?asset=2&quality=all#mostrador).
- [Best individual / Individual Best](https://www.xpaceos.com/inventario/?asset=2&quality=best#mostrador).
- [GLB Best](https://www.xpaceos.com/inventario/assets/catalog/02/best.glb) · [Blender Best](https://www.xpaceos.com/inventario/assets/catalog/02/best.blend).
- [Desglose / Breakdown](https://www.xpaceos.com/inventario/?asset=2&quality=best&view=breakdown#catalog) · [Tutorial ES/EN](https://www.xpaceos.com/help/#shelf-best).
- Generador / Generator: `admira-xp/tools/xpacios-blender/build_shelves_best.py`. Validación del modelo / Model validation: `admira-xp/tools/xpacios-blender/verify_shelves_best.py`. El generador general conserva este maestro Best / the general generator preserves this Best master.
- Manifiesto / Manifest: `inventario/assets/catalog/02/best.manifest.json`. Las imágenes PBR se empaquetan en el GLB / PBR images are embedded in the GLB.
- Contratos / Contracts: `shelf_best` e / and `inventory_finish_compare` en / in `/mcp/manifest.json` y / and `/mcp/funcionalidades.json`; [Comparación de acabados / Finish comparison](inventory-finishes.md).

Se conserva el shell, su registro extensible, `/marca` y `/brand`. `/avatarDigital` mantiene su integración y estado independientes. Yokup sigue siendo maestro ITIL. / The shell, its extensible registry, `/marca` and `/brand` are retained. `/avatarDigital` keeps its independent integration and status. Yokup remains the ITIL master.

Implementado: comparación Todos, Good pixel art nítido y detalle de etiquetas Best de la estantería #2. Pendiente: valoración humana y medidas calibradas. / Implemented: All comparison, crisp Good pixel art and Best label detail for shelf #2. Pending: human assessment and calibrated measurements.
