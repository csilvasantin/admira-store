## Categorías bajo el CLI / Categories below the CLI

ES: En Experto, el primer bloque contiene la entrada CLI y, debajo, las categorías Signage, AdmiraLive, LiveCam, DVR, Anonymizer, Mobiliario, Avatar3D, Audiencia, Inventario, Percepción y Pixeria. Las tarjetas compactas usan iconos vectoriales de línea, nombre y estado; el borde verde conserva el estado activo, y el foco de teclado es visible. El nombre completo y el estado están disponibles en la etiqueta accesible y el tooltip. La rejilla se adapta al ancho y permite scroll dentro del primer bloque cuando falta altura. Sus controles conservan las acciones originales; no se ejecutan nuevas órdenes por cargar o redimensionar el menú. CLI con Enter; opciones de categoría en el centro; previos y Local view a la derecha. Calidad en Opciones y controles generales en Avanzado. La altura y los dos separadores siguen guardándose en este navegador.

EN: In Expert, the first pane contains the CLI input followed by Signage, AdmiraLive, LiveCam, DVR, Anonymizer, Furniture, Avatar3D, Audience, Inventory, Perception and Pixeria categories. Compact cards use vector line icons, a name and status; green borders preserve active state, and keyboard focus is visible. Full names and status are available in accessible labels and tooltips. The grid adapts to its width and scrolls inside the first pane when height is limited. Its controls keep the original actions; loading or resizing the menu does not run new commands. Enter runs the CLI, category options sit in the middle, and previews with Local view sit on the right. Quality lives in Options and general controls in Advanced. Height and both dividers remain saved in this browser.

Local presentation only; no new remote MCP tool. Guide: https://www.xpaceos.com/admira-xp/docs/expert-categories.md · Tutorial: https://www.xpaceos.com/help/#expert-categories

## Detalle central / Central details

Selecciona una categoría a la izquierda: sus opciones se despliegan en el segundo bloque, cuyo título cambia al nombre de la categoría. Signage muestra su playlist real en el centro; DVR, audiencia, avatar, percepción y Distribuir integran sus paneles existentes, con scroll dentro del bloque. Las tarjetas son estables durante las actualizaciones y mantienen una selección marcada. Importar desde Pixeria, abrir Anonymizer, activar cámara, reproducir DVR o editar un mueble requiere pulsar su opción; seleccionar la tarjeta no ejecuta esas acciones. Inventario consulta el catálogo local. Los previos permanecen a la derecha y los tres bloques conservan el resize.

Select a category on the left: its options open in the second pane, whose heading changes to the category name. Signage shows its real playlist in the middle; DVR, audience, avatar, perception and Distribute integrate their existing panels, scrolling inside the pane. Cards keep stable nodes during updates and show the current selection. Importing from Pixeria, opening Anonymizer, enabling a camera, starting DVR replay or editing furniture requires its explicit control; selecting the card does not run those actions. Inventory reads the local catalog. Previews remain on the right and all three panes retain resizing.

Contrato / Contract: `#expertCategoryDetail`, `data-detail-category` y `aria-current` identifican el bloque, la vista y la selección. Los paneles se trasladan como nodos originales, sin duplicar IDs ni listeners. No añade herramientas MCP ni nuevos permisos.


## Calidad y controles / Quality and controls

ES: Opciones contiene Calidad del Xpacio: Good (8 bits), Better (16 bits), Best (32 bits) y Matrix (64 bits). El estado seleccionado y las restricciones por local se conservan. Avanzado contiene los botones Enviar, Mostrar/Ocultar Local view, Player y cámara y cerrar Experto. El bloque central de Experto queda exclusivamente para las opciones de la categoría seleccionada a la izquierda; los previos y el estado de la vista permanecen a la derecha. Enter sigue ejecutando el CLI desde el bloque izquierdo. Los tres bloques conservan sus separadores y el resize hacia arriba, anclados al borde inferior. No hay botones ni IDs duplicados; se conservan las conexiones y las acciones originales.

EN: Options contains Xpace quality: Good (8-bit), Better (16-bit), Best (32-bit) and Matrix (64-bit). Selection state and venue restrictions are preserved. Advanced contains Send, Show/Hide Local view, Player and camera and Close Expert. The middle Expert pane is exclusively for options of the category selected on the left; previews and view status remain on the right. Enter still runs the CLI in the left pane. All three panes retain their dividers and upward resize, anchored to the bottom edge. Buttons and IDs are not duplicated; original connections and actions are retained.


## Menús laterales / Side menus

Opciones → Proyecto y local permite cambiar entre Xtanco (proyecto estancos), Cafebrería (cafebreria) y Starbucks (starbucks / alsea_starbucks). La cabecera muestra el proyecto actual. Starbucks abre Paseo de Gracia 103, ID alsea-sbux-021; Xtanco y Cafebrería se identifican como demostraciones sin local real vinculado. Los otros 17 proyectos del catálogo de admira.app aparecen sin gemelo vinculado y no abren escenas inventadas. Calidad se elige aparte; salir de Matrix cambia a Better para no volver a Starbucks. El cambio conserva dominio e idioma y elimina el contexto de player/cámara del local anterior. Opciones y Avanzado comparten tarjetas, iconos de línea y foco de teclado con Experto; conservan sus acciones y resize con un ancho mínimo legible.

Options → Project and venue switches between Xtanco (estancos project), Cafebrería (cafebreria) and Starbucks (starbucks / alsea_starbucks). The header shows the current project. Starbucks opens Paseo de Gracia 103, stable ID alsea-sbux-021; Xtanco and Cafebrería are identified as demos without a linked real venue. The other 17 admira.app projects appear without linked twins and do not open invented scenes. Quality is separate; leaving Matrix falls back to Better to avoid reopening Starbucks. Switching preserves host and language and clears the previous venue’s player/camera context. Options and Advanced share Expert’s cards, line icons and keyboard focus, retain original actions and resize with readable minimum widths.

[Proyecto y local / Project and venue](project-selection.md)

## ITIL · 2 octubre 2026

ES: ITIL está debajo de Percepción, a la derecha de Pixeria: abre en otra pestaña https://www.xpaceos.com/inventario/, con catálogo de muebles detallados, modelos 3D y editor. Yokup conserva el inventario maestro ITIL. Inventario mantiene sus acciones locales de añadir/eliminar.

EN: ITIL sits below Perception, to the right of Pixeria: it opens https://www.xpaceos.com/inventario/ in a new tab, with detailed furniture, 3D models and the editor. Yokup remains the master ITIL inventory. Inventory keeps its local add/remove actions.
