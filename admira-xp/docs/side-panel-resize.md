# Barras laterales / Side rails

Opciones y Avanzadas permiten cambiar su anchura arrastrando el tirador del borde interior. Con el tirador enfocado, usa las flechas izquierda/derecha; Inicio o doble clic restaura el ancho mínimo legible de Opciones o el ajuste automático de Avanzadas. Cada anchura manual se guarda en este navegador y prevalece al recalcular la escena. Los tiradores sólo aparecen con la barra abierta. Cafebrería ya no muestra el aviso permanente de vista básica; mantiene los errores y los estados de carga.

Options and Advanced widths can be changed by dragging the handle on their inner edge. Focus a handle and use left/right arrows; Home or double-click restores Options’ minimum readable width or Advanced’s automatic side-space sizing. Each manual width is saved in this browser and takes precedence when the scene is resized. Handles appear only while the rail is open. Cafebrería no longer shows the persistent basic-view notice; errors and loading status remain available.

URL: https://www.xpaceos.com/admira-xp/?autostart=cafeteria

Selectors: `.quad-resize-left`, `.quad-resize-right`. Storage: `xpace_side_width_left`, `xpace_side_width_right`. Reset removes the saved value. Width is clamped to the viewport. Existing automatic canvas layout remains the default.

Local presentation only; no MCP tool or remote-device action is added. The real MCP help at https://mcp.admira.store/help describes this contract. Runtime dependencies: Pointer Events, ResizeObserver, localStorage (optional).

## Tamaño compartido / Shared sizing

ES: Redimensiona el marco cuadrático: arrastra el borde superior de Experto hacia abajo para reducirlo o hacia arriba para ampliarlo; ajusta Opciones y Avanzado con los tiradores de sus bordes interiores. Las ventanas flotantes tienen una esquina inferior derecha para cambiar anchura y altura. Con el tirador enfocado, usa las flechas (20 px; Mayús, 5 px). Inicio o doble clic restaura el tamaño automático. Cada tamaño se guarda en este navegador y dominio, con límites para mantener visibles los controles. Los tiradores se ocultan al cerrar; los laterales se detienen sobre Experto y el contenido no cambia de posición ni de tamaño: los paneles se superponen y entran cerrados en cada página. Se conservan /marca, historial CLI, posición y cierre de cada herramienta.

EN: Resize the quadratic shell: drag Expert's upper edge downward to shrink it or upward to enlarge it; adjust Options and Advanced with their inner-edge handles. Floating windows have a bottom-right corner to change width and height. With a handle focused, use arrow keys (20 px; Shift, 5 px). Home or double-click restores automatic sizing. Each size is saved in this browser and domain, bounded to keep controls reachable. Handles hide when closed; side rails stop above Expert and the content never moves or resizes: panels overlay it and start closed on every page. /brand, CLI history, window positions and each tool's close lifecycle are preserved.

Guide: https://www.xpaceos.com/admira-xp/docs/panel-resize.md

## Opciones compactas / Compact Options

Opciones usa por defecto el menor ancho que permite leer completas las etiquetas del idioma activo, sin ocupar el espacio sobrante de la escena. Arrastra su borde interior hacia la izquierda para dejar una columna de iconos de 52 px; al pasar el cursor se muestra el nombre y los nombres accesibles siguen disponibles. Arrastra hacia la derecha para recuperar las etiquetas. Con el tirador enfocado, Flecha derecha recupera el ancho legible desde los iconos; Inicio o doble clic restaura el ancho mínimo legible. La anchura elegida se guarda por navegador y dominio; se conservan los ajustes manuales anteriores. En el gemelo, abrir una herramienta desde su icono amplía temporalmente Opciones para sus controles y previos; cerrarla recupera la anchura elegida. El sello permanece al pie como icono de información en la columna compacta y conserva ayuda y novedades. ☰ sigue plegando el menú completo. Avanzados y Experto mantienen sus controles y colores.

Options defaults to the smallest width that fits every label in the active language, without filling the scene's leftover space. Drag its inner edge left to leave a 52 px icon rail; hover reveals each name and accessible names remain available. Drag right to restore labels. With the handle focused, Right arrow restores readable width from icons; Home or double-click resets the minimum readable width. The chosen width is saved per browser and origin; earlier manual sizes are retained. In the twin, opening a tool from its icon temporarily widens Options for its controls and previews; closing it restores the chosen width. The release stamp stays at the bottom as an information icon in the compact rail, retaining help and release notes. ☰ still collapses the entire panel. Advanced and Expert retain their controls and colours.

Guía / Guide: [options-compact.md](options-compact.md)
