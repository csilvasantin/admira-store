# Barras laterales / Side rails

Opciones y Avanzadas permiten cambiar su anchura arrastrando el tirador del borde interior. Con el tirador enfocado, usa las flechas izquierda/derecha; Inicio o doble clic restaura el ajuste automático al espacio lateral. Cada anchura manual se guarda en este navegador y prevalece al recalcular la escena. Los tiradores sólo aparecen con la barra abierta. Cafebrería ya no muestra el aviso permanente de vista básica; mantiene los errores y los estados de carga.

Options and Advanced widths can be changed by dragging the handle on their inner edge. Focus a handle and use left/right arrows; Home or double-click restores automatic side-space sizing. Each manual width is saved in this browser and takes precedence when the scene is resized. Handles appear only while the rail is open. Cafebrería no longer shows the persistent basic-view notice; errors and loading status remain available.

URL: https://www.xpaceos.com/admira-xp/?autostart=cafeteria

Selectors: `.quad-resize-left`, `.quad-resize-right`. Storage: `xpace_side_width_left`, `xpace_side_width_right`. Reset removes the saved value. Width is clamped to the viewport. Existing automatic canvas layout remains the default.

Local presentation only; no MCP tool or remote-device action is added. The real MCP help at https://mcp.admira.store/help describes this contract. Runtime dependencies: Pointer Events, ResizeObserver, localStorage (optional).
