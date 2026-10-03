# Ventanas sobre el Xpacio / Windows over the Xpacio

## ES · Uso

Las interfaces flotantes sobre el Xpacio tienen un botón **×** con nombre accesible y un tirador para moverlas. Arrastra el tirador con ratón o pantalla táctil; también puedes enfocarlo con Tab y usar las flechas. La posición se recuerda en este navegador y origen, y se ajusta al área visible del Xpacio cuando cambia el espacio disponible. La barra superior, Opciones, Avanzado y el dock Experto conservan su estructura y sus controles propios.

1. Abre una herramienta desde su entrada habitual. **Avanzado → Ventanas** recupera las herramientas registradas que siguen disponibles en la vista actual. La ficha **En este espacio** vuelve a abrirse al seleccionar el objeto.
2. Arrastra su cabecera o tirador para dejar libre el mueble que quieres inspeccionar. Los campos, botones y miniaturas mantienen sus acciones; arrastrar la ventana se hace desde el tirador.
3. Con teclado, enfoca el tirador y pulsa las flechas para moverla 20 px; Mayús reduce el paso a 5 px. El botón **×** cierra la interfaz.
4. Vuelve a abrirla desde **Ventanas** o desde la herramienta. Su posición guardada se recupera dentro de los límites visibles.

Cerrar una ventana no elimina muebles, productos, asociaciones, fichas ITIL ni historial CLI. La programación de las pantallas mantiene sus controles habituales. **Cerrar la selección de componentes** conserva las asociaciones guardadas y detiene su vista previa temporal en `ds1`, recuperando la programación vigente. Los controles propios de voz, cámara y reproducción conservan su comportamiento.

Los botones de cierre existentes conservan sus manejadores. Cuando una «X» heredada es un `span` o `div`, recibe `role=button`, foco con Tab y activación con Enter o Espacio; los controles nuevos son `button type=button`. Cerrar y mover una ventana no envía órdenes a equipos físicos.

La ficha **En este espacio**, el selector de componentes de la estantería, **Distribuir** y las herramientas de **Matrix** usan el mismo patrón. El lanzador **Seleccionar componentes** también puede cerrarse y recuperarse desde **Ventanas**. El listado de ventanas contiene las interfaces disponibles en la vista actual; cambiar de vista conserva el shell y no crea una ficha o un mueble nuevo.

Los datos de estado ya trasladados a **Experto** se consultan allí y no necesitan una segunda tarjeta flotante sobre la escena. Los controles anclados a un objeto del Xpacio —pantallas, números de dispositivo, altavoz y elementos seleccionables— mantienen su ubicación en la escena. El editor de empleados y personajes que se dibuja dentro del canvas conserva su barra arrastrable y su botón de cierre; no es una ventana DOM añadida por este controlador.

## EN · Usage

Floating interfaces over the Xpacio have an **×** button with an accessible name and a movement handle. Drag the handle with a mouse or touchscreen, or focus it with Tab and use the arrow keys. The position is remembered in this browser and origin, and is adjusted to the visible Xpacio area when the available space changes. The top bar, Options, Advanced and the Expert dock keep their structure and their own controls.

1. Open a tool from its usual entry. **Advanced → Windows** restores registered tools that remain available in the current view. Select the object again to reopen **In this space**.
2. Drag its header or handle to uncover the furniture you want to inspect. Fields, buttons and thumbnails keep their actions; moving the window uses the handle.
3. With a keyboard, focus the handle and press the arrow keys to move it 20 px; Shift reduces the step to 5 px. **×** closes the interface.
4. Reopen it from **Windows** or from the tool. Its saved position is restored within the visible bounds.

Closing a window does not delete furniture, products, associations, ITIL records or CLI history. Screen schedules keep their usual controls. **Closing component selection** retains saved associations and stops its temporary preview on `ds1`, restoring the current schedule. Voice, camera and playback controls retain their existing behavior.

Existing close controls retain their handlers. A legacy `span` or `div` «X» gains `role=button`, Tab focus and activation with Enter or Space; new controls use `button type=button`. Closing and moving a window sends no commands to physical devices.

The **In this space** record, shelf component selector, **Distribute** and **Matrix** tools use the same pattern. The **Select components** launcher can also be closed and restored from **Windows**. The window list contains interfaces available in the current view; switching views preserves the shell and does not create a new record or furniture item.

Status data already moved to **Expert** is read there and does not need a duplicate floating card over the scene. Controls attached to an object in the Xpacio —screens, device numbers, speaker and selectable items— keep their scene location. The employee and character editor drawn inside the canvas retains its draggable title bar and close button; it is not a DOM window created by this controller.

## Alcance auditado / Audited scope

La integración cubre las siguientes familias. La tabla identifica interfaces y puntos de integración; su comprobación visual y publicación se registran al cerrar la implementación. / Integration covers the following families. This table identifies interfaces and integration points; visual checks and publication are recorded when the implementation is closed.

| Familia / Family | Interfaces y archivos / Interfaces and files |
| --- | --- |
| Life Better/Best | `.life-selection`, `.life-shelf-products`, `.life-loading`, `.distribuit-panel`; `admira-xp/scripts/life-ui.mjs`, `inventario/shelf-product-panel.mjs`, `admira-xp/scripts/distribuit-ui.mjs` |
| Matrix | `.matrix-map-panel`, `.matrix-playlist-editor`, `.matrix-incident-editor`; `matrix-panorama.mjs`, `device-editor.mjs`, `starbucks-incidents.mjs` |
| Classic | Player/cámara, DVR, MetaHuman, Unitree, Cámara MUPI, Calendario, Subasta, Impactos, ficha de cliente, Pixeria, Rodaje TikTok, Target Publicity, Componer e información de pantalla; `admira-xp/index.html`, `xtore-window.mjs` |
| Otras herramientas / Other tools | Condicional/XPL, recorrido del circuito, selector y guardado de plantillas, presentación del gemelo, Perception, turno ampliado y resultados de día; scripts de cada herramienta / each tool's scripts |
| Estado / Status | Estados de carga y error con salida accesible; metadatos aparcados en Experto se leen en el dock / loading and error states with an accessible exit; metadata parked in Expert is read in the dock |
| Excluidos del controlador / Outside the controller | Shell fijo, barras/docks, canvas, geometría, elementos anclados a la escena y decoración / fixed shell, bars/docks, canvas, geometry, scene-attached elements and decoration |

## Contrato compartido / Shared contract

| Campo / Field | Contrato / Contract |
| --- | --- |
| Catálogo MCP / MCP catalogue | `floating_panels` en / in `/mcp/manifest.json` y / and `/mcp/funcionalidades.json` |
| Recurso compartido / Shared resource | `admira-xp/scripts/floating-window.mjs` y / and `floating-panels.mjs`, `floating-panels.css`; adaptador Classic / Classic adapter `xp-floating-runtime.mjs` |
| API | `attachFloatingPanel`, `registerFloatingPanel`, `mountFloatingPanelMenu` |
| Opt-in | `.xp-floating-panel`; tirador / handle `.xp-floating-handle`; sin escaneo automático de todo el DOM / no automatic whole-DOM decoration |
| Movimiento / Movement | Tirador dedicado, puntero y flechas, acotado al área visible / dedicated handle, pointer and arrow keys, bounded by the visible area |
| Cierre / Close | Nuevo `button type=button` o cierre existente accesible, nombre ES/EN y manejador de la herramienta conservado / new `button type=button` or accessible existing close, ES/EN name and preserved tool handler |
| Reapertura / Reopen | Ventanas lista herramientas registradas disponibles; entrada habitual o selección del objeto para la ficha / Windows lists registered available tools; usual entry or object selection for its record |
| Persistencia / Persistence | Clave estable por función; valor `{x,y}` en coordenadas del viewport; local al navegador y origen; restauración acotada / stable key per feature; `{x,y}` in viewport coordinates; local to browser and origin; bounded restoration |
| Adaptador Classic / Classic adapter | Registro `classic:<feature-id>`; posición `xpaceos:floating-panel-position:v1:<feature-id>`; lista de selectores conocida, sin intervalo / known selector allowlist, without a polling interval |
| Entrada Avanzado / Advanced entry | `#advFloatingWindows`, hermano de / sibling of `#advSceneControls` dentro de / inside `.quad-right` |
| Preferencia heredada / Legacy preference | Conservar `xtanco_panels_geom_v1`; no borrar ni reemplazar / preserve `xtanco_panels_geom_v1`; no deletion or replacement |
| Ciclo de vida / Lifecycle | `open`, `close`, `restore`, `clamp`, `dispose`; destruir libera listeners / destruction releases listeners |
| Compatibilidad / Compatibility | IDs, instancias, distribución, datos, preferencias, registro extensible, `/marca` (`/brand`) e historial CLI conservados / IDs, instances, placement, data, preferences, extensible registry, `/marca` (`/brand`) and CLI history preserved |
| Vista previa de producto / Product preview | Cerrar la selección detiene la vista previa temporal; asociaciones conservadas / closing selection stops temporary preview; associations retained |
| MCP / CLI | Ayuda y contrato; no añade herramientas remotas ni comandos / help and contract; no new remote tools or commands |

ES: Las próximas interfaces flotantes deben usar el controlador compartido con identificador estable, nombre ES/EN, tirador, cierre y una entrada de reapertura. El propietario del panel registra su callback de cierre y libera los listeners al destruirlo. No reutilizar la identidad de un mueble o un CI como identidad de la ventana ni guardar cambios de layout al mover la interfaz. Los paneles que ya viven dentro de Experto conservan su montaje allí.

EN: Future floating interfaces must use the shared controller with a stable identifier, ES/EN name, handle, close action and reopening entry. The panel owner registers its close callback and releases listeners on destruction. Do not reuse a furniture or CI identity as the window identity or save layout changes when moving the interface. Panels already hosted inside Expert retain that mounting.

ES: `attachFloatingPanel(panel, {label, handle, closeButton, onClose, onOpen, bounds, key, storage, menu})` recibe el panel existente y sólo decora ese nodo. `bounds` admite un elemento o una función que devuelve el elemento de límites; `key` pertenece al propietario de la herramienta. `registerFloatingPanel(id, {label, open})` registra la reapertura y devuelve la función de baja. `mountFloatingPanelMenu(container, {label})` monta el listado en Avanzado. Los callbacks mantienen las acciones de cierre/apertura de la herramienta. Al desmontar, usar `dispose()` y dar de baja su registro.

EN: `attachFloatingPanel(panel, {label, handle, closeButton, onClose, onOpen, bounds, key, storage, menu})` accepts the existing panel and decorates only that node. `bounds` accepts an element or a function returning the bounds element; the tool owner supplies `key`. `registerFloatingPanel(id, {label, open})` registers reopening and returns an unregister function. `mountFloatingPanelMenu(container, {label})` mounts the list in Advanced. Callbacks preserve the tool's opening/closing actions. On unmount, call `dispose()` and unregister the entry.

ES: `xp-floating-runtime.mjs` adapta únicamente su lista declarada de paneles Classic, XPL y modales. Su observer agrupa cambios del DOM relevantes, restaura al reaparecer y da de baja nodos destruidos. Un panel aparcado en Experto suspende la decoración flotante; al volver a la escena recupera su posición. La reapertura llama a la entrada real de la herramienta cuando existe. El fallback sólo recupera la presentación anterior de un nodo aún vivo; no recrea una herramienta eliminada, no activa reglas XPL ni un dispositivo y no ejecuta un comando remoto.

ES: La captura de presentación conserva `hidden`, `display` inline, `aria-hidden` y las clases de visibilidad `show`, `visible`, `on` y `tp-on`, tanto en el panel como en el contenedor de visibilidad del modal. No guarda el estado del motor de la herramienta. El fallback XPL recupera esa visibilidad sin llamar a `setOn` ni activar las reglas.

EN: `xp-floating-runtime.mjs` adapts only its declared list of Classic, XPL and modal panels. Its observer groups relevant DOM changes, restores panels when they reappear and unregisters destroyed nodes. Parking a panel in Expert suspends floating decoration; returning it to the scene restores its position. Reopening calls the real tool entry when available. The fallback only restores the previous presentation of a live node; it does not recreate a deleted tool, activate XPL rules or a device, or execute a remote command.

EN: A presentation snapshot preserves `hidden`, inline `display`, `aria-hidden` and the `show`, `visible`, `on` and `tp-on` visibility classes on both the panel and its modal visibility wrapper. It does not store the tool engine state. The XPL fallback restores that visibility without calling `setOn` or activating rules.

## Estado y dependencias / Status and dependencies

ES: **Implementado.** Controlador compartido, adaptador Classic y ayuda ES/EN. Comprobados cierre y reapertura de componentes y Distribuir en Best, persistencia y arrastre, y conservación del borrador al cerrar y reabrir la playlist Matrix. Los límites descuentan los menús laterales y docks visibles para mantener el cierre accesible. Las pruebas cubren los contratos, el ciclo de vida y las regresiones de shell y vista previa de productos. La publicación y comprobación de URLs y ayuda MCP acompañan la entrega.

EN: **Implemented.** Shared controller, Classic adapter and ES/EN help. Closing/reopening of components and Distribute in Best, persistence and dragging, and preservation of the Matrix playlist draft through closing/reopening have been checked. Bounds exclude visible side menus and docks to keep close controls accessible. Tests cover contracts, lifecycle and shell/product-preview regressions. Deployment and public URL/MCP-help verification accompany delivery.

ES: **Cafebrería recuperada para análisis:** [demo preservada con estantería interactiva](https://smith-cafebreria-emision-474.pixeria.pages.dev/xpacios/cafebreria/demo/?v=4e5d47c&ver=estanteria-libros&tier=better). Estantería de nogal, libros seleccionables con cápsulas, resúmenes y voz, vinilos y TV retro. La cápsula de The Science of Storytelling se comprobó en la interfaz. Carlos ha confirmado esta Cafebrería. La experiencia recuperada y la librería reutilizable 51 se documentan en [cafebreria-library.md](cafebreria-library.md).

EN: **Cafebrería recovered for analysis:** [preserved interactive-shelf demo](https://smith-cafebreria-emision-474.pixeria.pages.dev/xpacios/cafebreria/demo/?v=4e5d47c&ver=estanteria-libros&tier=better). Walnut shelving, selectable books with capsules, summaries and voice, records and a retro TV. The Science of Storytelling capsule was checked in the UI. Carlos has confirmed this Cafebrería. The recovered experience and reusable bookcase 51 are documented in [cafebreria-library.md](cafebreria-library.md).

[Ayuda web / Web help](https://www.xpaceos.com/admira-xp/help.html#floating-panels) · [Tutorial ES/EN](https://www.xpaceos.com/help/#floating-panels) · [Ayuda CLI / CLI help](https://www.xpaceos.com/help/cli/#floating-panels) · [MCP help](https://mcp.admira.store/help)

## Tamaño compartido / Shared sizing

ES: Redimensiona el marco cuadrático: arrastra el borde superior de Experto hacia abajo para reducirlo o hacia arriba para ampliarlo; ajusta Opciones y Avanzado con los tiradores de sus bordes interiores. Las ventanas flotantes tienen una esquina inferior derecha para cambiar anchura y altura. Con el tirador enfocado, usa las flechas (20 px; Mayús, 5 px). Inicio o doble clic restaura el tamaño automático. Cada tamaño se guarda en este navegador y dominio, con límites para mantener visibles los controles. Los tiradores se ocultan al cerrar; los laterales se detienen sobre Experto y el contenido no cambia de posición ni de tamaño: los paneles se superponen y entran cerrados en cada página. Se conservan /marca, historial CLI, posición y cierre de cada herramienta.

EN: Resize the quadratic shell: drag Expert's upper edge downward to shrink it or upward to enlarge it; adjust Options and Advanced with their inner-edge handles. Floating windows have a bottom-right corner to change width and height. With a handle focused, use arrow keys (20 px; Shift, 5 px). Home or double-click restores automatic sizing. Each size is saved in this browser and domain, bounded to keep controls reachable. Handles hide when closed; side rails stop above Expert and the content never moves or resizes: panels overlay it and start closed on every page. /brand, CLI history, window positions and each tool's close lifecycle are preserved.

Guide: https://www.xpaceos.com/admira-xp/docs/panel-resize.md
