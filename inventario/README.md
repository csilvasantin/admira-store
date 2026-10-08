# Inventario · mobiliario de la Xperience

Página pública `/inventario/`, con 18 tipos nativos y catálogo `furni` de Pixeria (25 piezas en la copia inicial). No requiere iniciar el simulador para explorar las piezas. La creación original continúa en https://www.pixeria.com/crear/ con su propia autenticación.

## Representaciones

8/16/32 designan estilos. Nativos: vistas interpretadas desde la geometría compartida de `life-scene.mjs`, con raster pixelado, materiales simplificados y PBR respectivamente. No se afirma que la miniatura Good sea una captura del sprite legacy. Pixeria: sprite original (separación de cuatro caras cuando el registro lo indica) y relieves de vóxeles derivados a dos resoluciones. No se inventa la geometría posterior ni se presenta una reconstrucción hiperrealista.

Dos instancias WebGL reutilizadas generan miniaturas bajo demanda: una para Good pixel art y otra para Better/Best. Las imágenes remotas se limitan al endpoint de assets de Admira. Fallos de CORS/carga se indican. La copia inicial permite consultar el catálogo aunque falle `/stock/list`; Actualizar consulta hasta 200 registros y avisa si el servidor limita la respuesta. No se descargan ni republican binarios de Pixeria.

## Identidad y visibilidad

`native:<type>` y `pixeria:<stock-id>` identifican modelos. Los IDs del layout identifican ejemplares. Ocultar uno no oculta otros ejemplares ni otros Xpacios. El juego conserva el layout lógico y publica una copia local; Good y el snapshot de Better/Best consumen el mismo filtro de presentación.

Se persiste en localStorage por Xpacio y se propaga entre pestañas del mismo origen. La visibilidad no es sincronización multiusuario ni cambia dispositivos, recorridos o colisiones. La distribución base se identifica como tal hasta recibir un layout del gemelo. El gemelo puede recibir distribuciones de su servicio existente; esas variaciones no son cambios del inventario.

Better y Best operativos corresponden al Xtanco. Las vistas de catálogo existen para todos los tipos; Supermercado/Creator conservan sus capacidades Good actuales. La CMDB patrimonial anterior se enlaza sin migrar ni sobrescribir datos.

## Best editable

Al abrir con `inventory=1`, o al tener una instancia oculta o retirada, Best monta objetos independientes del snapshot usando el renderer PBR compartido. Mantiene la cámara alineada, controles generales y simulación. La referencia fotográfica y personas recortadas se conservan en Best normal cuando no se solicita edición ni hay piezas ocultas. Best editable se identifica como PBR y no como el escenario fotográfico. No implica paridad de las 30 funciones del catálogo MCP.

## Verificación

`node --test inventario/*.test.mjs admira-xp/scripts/*.test.mjs xpacios/lab/assets.test.mjs homepage-twin-cta.test.mjs mcp/*.test.mjs help/funcionalidades/*.test.mjs`

QA navegador: ficha Mostrador, Good/Better/Best, ocultar/restaurar (Best 16 → 17 objetos visibles, ID counter y posición 1,6 conservados), búsqueda de sofá Pixeria y separación de sus cuatro caras. Rutas externas de creación requieren autorización propia. No añade credenciales, tools MCP ni llamadas de pago.

Misión de entrega: DCL-05d05f2d3c78975819d24430 · proyecto xpaceos.

## CLI e identificación permanente

La ruta canónica es `/inventario/`; `/inventari/` redirige conservando query y fragmento. `registry.json` reserva números permanentes: 1 = Mostrador, 2 = Estantería, hasta 43. La galería y el CLI cargan el mismo registro. No se renumera al filtrar, refrescar metadatos o retirar un ejemplar. Las altas futuras deben añadir una identidad con el siguiente número libre; nunca reutilizar números anteriores. Actualizar desde Pixeria refresca las piezas registradas sin asignar números temporales a las nuevas.

En el CLI de la Xperience o `window.__xtExec`:

- `/inventario`: enumera todos los modelos y la cantidad de ejemplares en el Xpacio activo.
- `eliminar el 1` (también `/inventario eliminar 1`): retira todos los ejemplares del modelo 1 del Xpacio actual. Conserva el modelo en el catálogo.
- `/inventario deshacer`: restaura la última eliminación, con posiciones originales, sin sobrescribir IDs ya ocupados ni deshacer otros cambios del editor.

La eliminación se guarda **en este navegador y por Xpacio**, con un registro de retiradas que impide que los layouts de fábrica vuelvan a insertar las piezas. A diferencia de ocultar, sí retira del layout lógico y reconstruye la ocupación del suelo. Los cambios y el undo se propagan a pestañas del mismo origen. No es baja global multiusuario ni borrado del asset Pixeria; no modifica dispositivos reales. Se conserva la antigua clave de visibilidad para migrar sin perder preferencias.

El compositor y el dispatcher interceptan estos comandos antes de Telegram, IA, memoria y registro de comandos. Los errores de sintaxis, carga o almacenamiento permanecen locales. La escritura de los slots del layout es local y no invoca el espejo de publicación de Pixeria. La eliminación queda sin aplicar si falla el guardado; el adaptador revierte slots y escena ante un fallo. Undo persiste tras recargar y se limita a la última eliminación del Xpacio.

QA de esta entrega: 43 filas CLI, `eliminar el 1`, recarga con Mostrador = 0, undo = 1, búsqueda Estantería = 02 y Best editable. Misión DCL-e60b74a2900b00147b614708 · #163.

## Piloto Blender · Mostrador 1

`/inventario/#mostrador` muestra el GLB completo en WebGL, con órbita por arrastre/teclado, frontal, trasera, lateral, zoom, malla y descarga del maestro Blender. Los tres perfiles se generan con Blender 5.2.2 LTS y el script `admira-xp/tools/xpacios-blender/build_counter.py`. La revisión añade puertas, tiradores y bisagras posteriores e identidad `native:counter`, número 1.

Los assets actuales viven en `inventario/assets/mostrador/`; el antiguo laboratorio queda como referencia histórica. Las tres miniaturas del mostrador se generan desde estos GLB (Good usa un render pixel art de baja resolución sin suavizado). Better carga el GLB intermedio y Best editable el completo. Good en el simulador conserva su renderer clásico. El TPV 3D reutiliza la superficie del reproductor compartido; no se crea otro reproductor.

El GLB se cuelga del nodo lógico existente, aplicando posición, orientación y escala una sola vez. Las retiradas CLI y los filtros de visibilidad siguen controlando el mismo ID. Si la pieza tarda o falla, permanece la versión procedural; una respuesta tardía nunca reinserta una pieza retirada. El visor mantiene un caché acotado a tres GLB y no necesita CDN ni extensiones de Blender. Los recursos de cada visor se liberan al cerrarlo.

Diseño interpretado, pendiente de valoración humana; las proporciones de casilla todavía no están calibradas con medidas de un mueble real. 8/16/32 son estilos, no profundidades de color ni niveles de precisión geométrica.

Verificado: importación GLB y apertura `.blend` en Blender para los tres perfiles; materiales empaquetados, 110 objetos de malla, geometría posterior y exclusión de cámaras/luces de estudio. QA navegador: parte posterior, malla, Best con modelo Blender, CLI eliminar 1 (17→16) y deshacer (16→17). Misión DCL-fe628ccda18b44ba84ba5717 · #169.

## Desglose de componentes / Component breakdown

ES: En cada ficha del catálogo, Desglose está junto a Ver pieza. Abre los componentes del modelo Best, agrupados por función, con sus cantidades, subcomponentes cuando existen y enlaces a la fuente. El selector ES/EN traduce el desglose. Las cantidades describen el modelo de diseño; no son stock confirmado ni crean fichas ITIL.

EN: On each catalogue card, Desglose (Breakdown) sits beside Ver pieza (View item). It opens the Best model components grouped by function, with quantities, subcomponents where available and source links. The ES/EN selector translates the breakdown. Quantities describe the design model; they are not confirmed stock and do not create ITIL records.

ES: Abre /inventario desde el CLI o ITIL en Experto, busca la pieza y pulsa Desglose. Cambia ES/EN para leer los componentes y despliega las filas con subcomponentes. El enlace ?asset=2&quality=best&view=breakdown abre directamente la estantería #2; añade &lang=en para inglés. Ver pieza mantiene el visor 360 y sus descargas.

EN: Open /inventory from the CLI or ITIL in Expert, find the item and click Desglose (Breakdown). Switch ES/EN to read components and expand rows with subcomponents. The ?asset=2&quality=best&view=breakdown link opens shelf #2 directly; add &lang=en for English. View item retains the 360 viewer and its downloads.

[Desglose de la estantería / Shelf breakdown](https://www.xpaceos.com/inventario/?asset=2&quality=best&view=breakdown#catalog) · [Contrato ES/EN / ES/EN contract](../admira-xp/docs/inventory-breakdown.md). `components.json` conserva las 50 identidades y números del registro; revisión `components-20261002-1`, esquema 1. La lectura es independiente de la visibilidad de los ejemplares. / Reading is independent of instance visibility.

## Estantería 2 y comparación de acabados / Shelf 2 and finish comparison

ES: En Acabado, Todos muestra Good, Better y Best uno al lado del otro como tres modelos interactivos. Arrastrar o acercar una vista sincroniza las cámaras; Frontal, Parte posterior, Lateral y Ver malla se aplican a las tres. Cada perfil conserva sus propias descargas GLB y Blender. En la estantería #2 (native:shelves), Good usa pixel art nítido con píxeles definidos y materiales de tres tonos; Better mantiene el modelado intermedio y Best añade etiquetas de producto y cartelas de balda de alta definición sobre el mueble detallado con acabados PBR. Los 45 envases son contenido visual; se conservan identidad, número, huella 1×2, fichas ITIL, preferencias, distribución e historial CLI.

EN: In Finish, Todos (All) shows Good, Better and Best side by side as three interactive models. Dragging or zooming one view synchronizes the cameras; Front, Back, Side and Wireframe apply to all three. Each profile retains its own GLB and Blender downloads. On shelf #2 (native:shelves), Good uses crisp pixel art with defined pixels and three-tone materials; Better keeps the intermediate model and Best adds high-definition product labels and shelf cards to the detailed furniture with PBR finishes. The 45 containers are visual content; identity, number, 1×2 footprint, ITIL records, preferences, placement and CLI history are preserved.

ES: 1. Abre el catálogo desde ITIL o /inventario y selecciona la estantería #2. 2. En Acabado, elige Todos. 3. Arrastra cualquiera de las tres vistas o acerca la cámara: las otras siguen la misma orientación y zoom. 4. Usa Frontal, Parte posterior, Lateral o Ver malla en Avanzados para comparar los tres perfiles. 5. Para ver un acabado solo, elige Good, Better o Best; en Todos, descarga GLB o Blender desde la columna del perfil deseado. El enlace ?asset=2&quality=all#mostrador abre directamente esta comparación. La ayuda está en español e inglés; lang=en selecciona inglés en Desglose.

EN: 1. Open the catalogue from ITIL or /inventory and select shelf #2. 2. In Finish, choose Todos (All). 3. Drag any of the three views or zoom: the others follow the same orientation and zoom. 4. Use Front, Back, Side or Wireframe in Advanced to compare all three profiles. 5. To inspect one finish, choose Good, Better or Best; in All, download GLB or Blender from the desired profile column. The ?asset=2&quality=all#mostrador link opens this comparison directly. Help is available in Spanish and English; lang=en selects English in Breakdown.

ES: La Estantería 2 mantiene su identidad `native:shelves`, cinco niveles, huella `1 × 2`, altura aproximada `2,235` unidades de casilla y frontal largo `+X` en Three. Good se renderiza a baja resolución sin antialias, con vecino más cercano y escala de píxel entera para conservar bordes nítidos. Good/Better conservan sus GLB y fuentes Blender; la presentación de Good en el visor cambia. Best tiene un generador propio (`admira-xp/tools/xpacios-blender/build_shelves_best.py`) con madera PBR, herrajes y etiquetas de alta definición. Las cantidades visuales no acreditan stock; las dimensiones no son medidas de un mueble real. Starbucks 47 es otro modelo.

EN: Shelf 2 retains `native:shelves`, five levels, its `1 × 2` footprint, an approximate height of `2.235` grid units and long `+X` front in Three. Good renders at low resolution without antialiasing, with nearest-neighbour presentation and integer pixel scaling to preserve crisp edges. Good/Better retain their GLB and Blender sources; Good presentation in the viewer changes. Best has its own generator (`admira-xp/tools/xpacios-blender/build_shelves_best.py`) with PBR wood, hardware and high-definition labels. Visual quantities do not establish stock, and dimensions are not physical furniture measurements. Starbucks 47 is a separate model.

[Comparación / Comparison](https://www.xpaceos.com/inventario/?asset=2&quality=all#mostrador) · [Modelo / Model](../admira-xp/docs/shelf-best.md) · [Contrato de acabados / Finish contract](../admira-xp/docs/inventory-finishes.md). `quality=all` selecciona tres vistas, no un cuarto asset / selects three views, not a fourth asset. El visor comparte orientación, zoom, vistas y malla; descargas GLB/Blender por perfil / the viewer shares orientation, zoom, views and wireframe; per-profile GLB/Blender downloads.

Se conservan registro, instancias, visibilidad, distribución, shell, /marca, /brand e historial CLI; Yokup sigue siendo el maestro ITIL. / Registry, instances, visibility, placement, shell, /marca, /brand and CLI history are retained; Yokup remains the ITIL master.

## Marco cuadrático / Quadratic frame

Marco cuadrático Admira: por defecto solo se ve la barra horizontal superior. Opciones a la izquierda, Avanzados a la derecha y Experto/CLI abajo empiezan replegados; las vistas del inventario están dentro de Opciones. ☰ y ◨ muestran u ocultan paneles; ⌘ abre el CLI y Escape los cierra. En móvil se usan los mismos botones. Opciones reúne vistas, búsqueda y filtros; Avanzados reúne cámara, malla, descargas, ayuda y conexiones.

Admira quadratic frame: only the horizontal top bar is visible by default. Options on the left, Advanced on the right and Expert/CLI at the bottom start collapsed; inventory views live inside Options. ☰ and ◨ toggle panels; ⌘ opens the CLI and Escape closes them. Mobile uses the same buttons. Options contains views, search and filters; Advanced contains camera, wireframe, downloads, help and connections.

En las páginas del inventario, /inventario sin argumentos abre el catálogo; /inventario con argumentos conserva la ejecución en el gemelo de XpaceOS. Desde Yokup se indica abrir el gemelo. Navegación: /inventario, /starbucks, /referencias, /ref PG103-001, /equipo PDG103-BOT-01, /xpaceos, /yokup y /ayuda. La unidad seleccionada conserva su código ITIL al abrir Yokup o volver a XpaceOS. Los candidatos enlazan el portal sin inventar fichas ITIL. Añadir, eliminar o mover muebles se realiza en la Xperience; las fichas patrimoniales se editan en Yokup con sus permisos existentes.

On inventory pages, /inventario without arguments opens the catalogue; arguments retain execution in the XpaceOS twin. From Yokup it prompts opening the twin. Navigation: /inventory, /starbucks, /references, /ref PG103-001, /equipment PDG103-BOT-01, /xpaceos, /yokup and /help. A selected unit retains its ITIL code when opening Yokup or returning to XpaceOS. Candidates link to the portal without inventing ITIL records. Add, remove or move furniture in the Xperience; edit lifecycle records in Yokup with existing permissions.

Contrato: https://www.xpaceos.com/admira-xp/docs/inventory-frame.md · Misión DCL-1be5b59b234e7be48381c4ee.

## Productos seleccionables y contenido / Selectable products and content

ES: En Best de la estantería #2, Seleccionar componentes permite tocar uno de los 45 envases o su cartela para destacarlo y ver nombre, referencia, balda y posición; la lista ofrece acceso por teclado. Las instancias comparten seis referencias ilustrativas A02-01…06. Asocia una URL HTTPS o un contenido de Pixeria por título/#ID, eligiendo el resultado. La asociación se guarda localmente para la referencia y ds1 del Xtanco. Mostrar en pantalla abre una vista previa temporal; Detener contenido o quitar la selección devuelve ds1 a su programación. En Todos, la selección corresponde a Best. Piloto de contenido en una pantalla virtual. Las referencias son ilustrativas; no acreditan SKU ni stock. Catálogo y gemelo comparten asociaciones sólo en el mismo navegador y origen. No escribe playlists Matrix, pines, fichas ITIL ni publica en equipos físicos. /inventario, /marca y el historial CLI conservan sus funciones; no se añade herramienta MCP ni comando CLI.

EN: In shelf #2 Best, Seleccionar componentes (Select components) lets you click one of the 45 containers or its shelf card to highlight it and see its name, reference, shelf and position; the list provides keyboard access. Instances share six illustrative A02-01…06 references. Associate an HTTPS URL or Pixeria content found by title/#ID, selecting the intended result. The association is saved locally for the reference and Xtanco ds1. Mostrar en pantalla (Show on screen) opens a temporary preview; Detener contenido (Stop content) or clearing selection restores the ds1 schedule. In All, selection applies to Best. Content pilot on one virtual screen. References are illustrative and do not establish SKUs or stock. Catalogue and twin share associations only in the same browser and origin. It does not write Matrix playlists, pins or ITIL records or publish to physical devices. /inventory, /brand and CLI history retain their functions; no new MCP tool or CLI command is added.

[Seleccionar productos / Select products](https://www.xpaceos.com/inventario/?asset=2&quality=best&select=products#mostrador) · [Xtanco Best](https://www.xpaceos.com/admira-xp/?autostart=xtanco&quality=best&visual=best&select=products) · [Contrato ES/EN / ES/EN contract](../admira-xp/docs/shelf-product-content.md). `best.parts.json` revisión `shelves-parts-20261002-3` enlaza `_XP_PART` con los 45 envases; la referencia de producto agrupa seis diseños ilustrativos y la identidad del componente distingue cada envase. / `best.parts.json` revision `shelves-parts-20261002-3` links `_XP_PART` to the 45 containers; the product reference groups six illustrative designs and component identity distinguishes each container.


## Estantería Starbucks 47 / Starbucks shelf 47

La estantería Starbucks 47 conserva native:starbucksShelves, la instancia sb-mugs y el CI PDG103-EST-01. Best muestra el mueble de cinco niveles interpretado desde la foto de Carlos. Despiece y productos abre una colección 3D con vasos, termos, tazas y café independientes y 26 referencias visuales descargables. Cada objeto conserva su identidad de componente. Los productos son una composición visual: no son SKU comerciales ni fichas CI nuevas y las cantidades no acreditan stock. El maestro patrimonial sigue en Yokup.

Starbucks shelf 47 retains native:starbucksShelves, instance sb-mugs and CI PDG103-EST-01. Best shows the five-level cabinet interpreted from Carlos’s photograph. Separated parts and products opens a 3D collection of independent cups, tumblers, mugs and coffee with 26 downloadable visual references. Each object keeps its component identity. Products form a visual composition: they are not commercial SKUs or new CI records, and quantities do not establish stock. Yokup remains the lifecycle master.

[Guía ES/EN / ES/EN guide](https://www.xpaceos.com/admira-xp/docs/starbucks-coffee-display.md) · [Colección 3D / 3D collection](/inventario/assets/catalog/47/collection/preview/)
