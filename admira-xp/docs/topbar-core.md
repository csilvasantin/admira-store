# Barra superior del núcleo / Core top bar

ES: La barra superior usa el formato de Cafebrería: ☰, XpaceOS (con esta escritura) y el nombre del espacio activo como texto, por ejemplo Cafebrería, Estancos o Starbucks; ▤ Avanzado y ⌘ Experto quedan a la derecha. El nombre no es un combo ni cambia al preseleccionar otro proyecto: identifica la escena abierta. Se ocultan el acceso de proyecto/local junto a Opciones y los indicadores de ventas, beneficio, satisfacción, tráfico, aforo, embudo, estado y cuotas de marcas. Proyecto y local se eligen desde Opciones → Proyecto y local. Los nodos, IDs, cálculos, conexiones y datos guardados se conservan. La futura selección de indicadores queda pendiente hasta completar el núcleo de la interfaz gráfica y verificar los elementos IoT operativos; este cambio no acredita su conexión.

EN: The top bar uses the Cafebrería format: ☰, XpaceOS (with this capitalization) and the active space name as text, such as Cafebrería, Estancos or Starbucks; ▤ Advanced and ⌘ Expert stay on the right. The name is not a combo box and does not change when another project is preselected: it identifies the open scene. The project/venue shortcut next to Options and the sales, profit, satisfaction, traffic, occupancy, funnel, status and brand-share indicators are hidden. Select a project and venue through Options → Project and venue. Nodes, IDs, calculations, connections and saved data are retained. Future indicator selection is pending until the graphical interface core is complete and operational IoT elements are verified; this change does not confirm their connection.

## Uso / Usage

1. ☰ abre Opciones; allí se conservan los selectores de proyecto y local. / ☰ opens Options, which retains the project and venue selectors.
2. ▤ abre Avanzado; ⌘ abre o cierra Experto. / ▤ opens Advanced; ⌘ opens or closes Expert.
3. Los tres paneles entran cerrados y se superponen a la escena. / All three panels start closed and overlay the scene.

## Contrato / Contract

- Implementación / Implementation: assets/xpace-header.css, admira-xp/index.html (topbarCoreStyle), admira-xp/scripts/project-selector.mjs.
- IDs de control / Control IDs: topBar, pfOptions, pfToggles, pfExpert, xpaceActiveSpace.
- Contexto conservado / Retained context: projectContextChip, projectSelector, projectVenueSelector; the header shortcut remains hidden and the selectors stay in Options.
- Telemetría conservada / Retained telemetry: bbSales, bbProfit, bbSat, bbCli, bbCamBox, bbFunnel, bbStatus, xpTopNotify, compAlt, compJTI, compPM, compBAT. Rendering is parked; existing producers still update their nodes.
- La barra conserva su altura de 46 px también con sesión Xtore. / Header height stays at 46 px with a linked Xtore session.
- Alcance / Scope: native twins in /admira-xp/ on admira.store and xpaceos.com; the common shell and native twins share the XpaceOS/space typography, spacing and capitalization.
- Implementado / Implemented: shared XpaceOS/active-space header and preserved selectors/data.
- Pendiente / Pending: Carlos decides which indicators to show after the interface core and operational IoT are complete and verified.
- Sin nuevo comando CLI ni herramienta MCP. / No new CLI command or MCP tool.
- URLs: https://www.admira.store/admira-xp/?autostart=xtanco&quality=better · https://www.xpaceos.com/admira-xp/?autostart=xtanco&quality=better · https://mcp.admira.store/help
