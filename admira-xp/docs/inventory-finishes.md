# Acabado · Todos / Finish · All

## ES

En Acabado, Todos muestra Good, Better y Best uno al lado del otro como tres modelos interactivos. Arrastrar o acercar una vista sincroniza las cámaras; Frontal, Parte posterior, Lateral y Ver malla se aplican a las tres. Cada perfil conserva sus propias descargas GLB y Blender. En la estantería #2 (native:shelves), Good usa pixel art nítido con píxeles definidos y materiales de tres tonos; Better mantiene el modelado intermedio y Best añade etiquetas de producto y cartelas de balda de alta definición sobre el mueble detallado con acabados PBR. Los 45 envases son contenido visual; se conservan identidad, número, huella 1×2, fichas ITIL, preferencias, distribución e historial CLI.

1. Abre el catálogo desde ITIL o /inventario y selecciona la estantería #2. 2. En Acabado, elige Todos. 3. Arrastra cualquiera de las tres vistas o acerca la cámara: las otras siguen la misma orientación y zoom. 4. Usa Frontal, Parte posterior, Lateral o Ver malla en Avanzados para comparar los tres perfiles. 5. Para ver un acabado solo, elige Good, Better o Best; en Todos, descarga GLB o Blender desde la columna del perfil deseado. El enlace ?asset=2&quality=all#mostrador abre directamente esta comparación. La ayuda está en español e inglés; lang=en selecciona inglés en Desglose.

En pantalla estrecha, el grupo permite desplazarse horizontalmente para revisar los tres modelos sin sustituirlos por miniaturas. Cada vista sigue siendo interactiva. La comparación conserva el último estado de cámara durante los cambios de perfil dentro del visor.

Good en el visor del catálogo usa materiales de tres tonos y un render de baja resolución sin antialias, presentado con vecino más cercano y escala de píxel entera. Es una presentación pixel art del modelo; no se aplica desenfoque para simular menor calidad ni se afirma que sea el sprite legacy del gemelo. La ampliación usa pasos enteros de píxel; si una miniatura es menor que el raster, se reduce con vecino más cercano para conservar el modelo completo. Los archivos Good/Better conservan su geometría y sus descargas. Best incorpora un atlas de etiquetas de alta definición y cartelas identificativas en los perfiles de las baldas; los textos son ilustrativos del diseño.

## EN

In Finish, Todos (All) shows Good, Better and Best side by side as three interactive models. Dragging or zooming one view synchronizes the cameras; Front, Back, Side and Wireframe apply to all three. Each profile retains its own GLB and Blender downloads. On shelf #2 (native:shelves), Good uses crisp pixel art with defined pixels and three-tone materials; Better keeps the intermediate model and Best adds high-definition product labels and shelf cards to the detailed furniture with PBR finishes. The 45 containers are visual content; identity, number, 1×2 footprint, ITIL records, preferences, placement and CLI history are preserved.

1. Open the catalogue from ITIL or /inventory and select shelf #2. 2. In Finish, choose Todos (All). 3. Drag any of the three views or zoom: the others follow the same orientation and zoom. 4. Use Front, Back, Side or Wireframe in Advanced to compare all three profiles. 5. To inspect one finish, choose Good, Better or Best; in All, download GLB or Blender from the desired profile column. The ?asset=2&quality=all#mostrador link opens this comparison directly. Help is available in Spanish and English; lang=en selects English in Breakdown.

On narrow screens, the group scrolls horizontally so all three models remain available without being replaced by thumbnails. Each view stays interactive. Comparison keeps the last camera state when changing profiles within the viewer.

Good in the catalogue viewer uses three-tone materials and a low-resolution render without antialiasing, presented with nearest-neighbour sampling and integer pixel scaling. It is a pixel-art presentation of the model; no blur is used to simulate lower quality, and it is not described as the twin's legacy sprite. Enlargement uses integer pixel steps; thumbnails smaller than the raster are reduced with nearest-neighbour sampling to retain the entire model. Good/Better files retain their geometry and downloads. Best includes a high-definition label atlas and identification cards along the shelf rails; their text illustrates the design.

## Contrato compartido / Shared contract

- Ruta estable / Stable URL: [comparación / comparison](https://www.xpaceos.com/inventario/?asset=2&quality=all#mostrador).
- Valores de `quality` / `quality` values: `good`, `better`, `best`, `all`. `all` es una vista, no un cuarto archivo de modelo / `all` is a view, not a fourth model file.
- Identidad piloto / Pilot identity: número / number `2`, `native:shelves`, huella / footprint `1 × 2`. Estantería Starbucks `47` es independiente / Starbucks shelving `47` is independent.
- Comparación / Comparison: cámaras sincronizadas para órbita, zoom y vistas nombradas; malla común / synchronized cameras for orbit, zoom and named views; shared wireframe control.
- Descargas / Downloads: GLB y Blender por perfil en Todos, perfil seleccionado en vista individual / GLB and Blender per profile in All, selected profile in individual views.
- Idioma / Language: documentación ES/EN; `lang=en` y el selector ES/EN se aplican al Desglose / ES/EN documentation; `lang=en` and the ES/EN selector apply to Breakdown.
- MCP: `inventory_finish_compare` y / and `shelf_best` en / in `/mcp/manifest.json` y / and `/mcp/funcionalidades.json`. Ayuda real / Actual help: [mcp.admira.store](https://mcp.admira.store). Recursos de navegación y lectura; sin nueva herramienta remota ni verbo CLI / navigation and reading resources; no new remote tool or CLI verb.
- Tutorial: [ES/EN](https://www.xpaceos.com/help/#shelf-best). Modelo / Model: [Estantería Best / Best shelf](shelf-best.md). Componentes / Components: [Desglose / Breakdown](inventory-breakdown.md).

## Atlas Best / Best atlas

Atlas Best: RGBA 4096×3072; 18 diseños de envase (6 variantes en caja/bolsa/botella) y 6 diseños de cartela horizontal. El modelo conserva 45 productos y 45 cartelas, cinco baldas, 604 mallas editables / 14 web y cuatro mapas PBR internos. Textos originales ilustrativos: CAFÉ, TÉ VERDE, CACAO, GRANOLA, MIEL, TÉ NEGRO; referencias A02-01…06. Revisión `shelves-labels-20261002-2`. / Best atlas: RGBA 4096×3072; 18 container designs (6 variants in box/pouch/bottle) and 6 horizontal card designs. The model retains 45 products and 45 cards, five shelves, 604 editable / 14 web meshes and four embedded PBR maps. Original illustrative text: CAFÉ, TÉ VERDE, CACAO, GRANOLA, MIEL, TÉ NEGRO; references A02-01…06. Revision `shelves-labels-20261002-2`.

Los archivos de procedencia son `inventario/assets/catalog/02/best-textures/selection-label-atlas.png` y `selection-label-atlas.layout.json`; el generador es `admira-xp/tools/xpacios-blender/build_shelves_labels.py`. / Provenance files are `inventario/assets/catalog/02/best-textures/selection-label-atlas.png` and `selection-label-atlas.layout.json`; the generator is `admira-xp/tools/xpacios-blender/build_shelves_labels.py`.

## Compatibilidad y alcance / Compatibility and scope

Se conserva el inventario maestro de Yokup, la numeración, IDs de instancias, visibilidad, distribución, preferencias de marca/aspecto, histórico CLI y el marco cuadrático. Opciones, Avanzados y Experto siguen entrando cerrados. Los 45 productos modelados no son stock confirmado ni crean fichas ITIL. `/marca` y `/brand` permanecen disponibles; `/avatarDigital` sigue siendo la integración independiente de Woz.

Yokup remains the master inventory; numbering, instance IDs, visibility, placement, branding/appearance preferences, CLI history and the quadratic frame are retained. Options, Advanced and Expert still start closed. The 45 modeled products are not confirmed stock and create no ITIL records. `/marca` and `/brand` remain available; `/avatarDigital` stays Woz's separate integration.

Entregado: comparación de acabados en el catálogo y refinamiento de la estantería #2. Pendiente: valoración humana del diseño y calibración de medidas reales. / Delivered: catalogue finish comparison and shelf #2 refinement. Pending: human design assessment and calibration against physical measurements.
