# Redimensionar el marco cuadrático / Resize the quadratic shell

## ES

Redimensiona el marco cuadrático: arrastra el borde superior de Experto hacia abajo para reducirlo o hacia arriba para ampliarlo; ajusta Opciones y Avanzado con los tiradores de sus bordes interiores. Las ventanas flotantes tienen una esquina inferior derecha para cambiar anchura y altura. Con el tirador enfocado, usa las flechas (20 px; Mayús, 5 px). Inicio o doble clic restaura el tamaño automático. Cada tamaño se guarda en este navegador y dominio, con límites para mantener visibles los controles. Los tiradores se ocultan al cerrar; el lienzo y los laterales se adaptan a la altura de Experto. Se conservan /marca, historial CLI, posición y cierre de cada herramienta.

## EN

Resize the quadratic shell: drag Expert's upper edge downward to shrink it or upward to enlarge it; adjust Options and Advanced with their inner-edge handles. Floating windows have a bottom-right corner to change width and height. With a handle focused, use arrow keys (20 px; Shift, 5 px). Home or double-click restores automatic sizing. Each size is saved in this browser and domain, bounded to keep controls reachable. Handles hide when closed; the canvas and side rails follow Expert's height. /brand, CLI history, window positions and each tool's close lifecycle are preserved.

Shared controller: admira-xp/scripts/panel-resize.mjs. Shared styles: panel-resize.css. Shell: assets/xpace-shell.js/css. Floating adapter: floating-panels.mjs. Native gemelo keeps its existing side-panel and dock resizers.

Storage: xpaceos_shell_size_v1:left/right/expert; floating tools use their existing position key plus :size. Position, legacy geometry and CLI history keys remain independent. Reset removes only the size key. localStorage is optional; resizing works without it.

Docked rails adjust width; Expert adjusts height while remaining anchored below. Floating tools adjust both dimensions and remain bounded by the visible Xpacio. Handles use Pointer Events and accessible separators, pointer capture, 20/5 px keys, and Home/double-click reset. Dispose releases listeners/observers and removes the handle. Sizes are presentation state; no new remote tools, stock writes or physical-device publication.

URLs: https://www.admira.store/xpacios/cafebreria/ · https://www.xpaceos.com/inventario/ · https://mcp.admira.store/help
