# Barra superior del núcleo / Core top bar

ES: La barra superior contiene Xpacio (proyecto y local) y Calidad (Good, Better, Best y Matrix). Ambos desplegables muestran la selección activa y se abren sin desplegar Opciones. Matrix es la calidad por defecto al entrar, aunque hubiera otra calidad guardada; los enlaces con quality o visual explícito conservan su elección. La selección mantiene las identidades de proyecto y local, la conexión central con AdmiraNext, permisos, idioma, marca blanca, inventario e historial CLI. Escape o pulsar fuera cierra el desplegable. ☰ abre Opciones, ▤ Avanzado y ⌘ Experto; los paneles entran cerrados. La telemetría continúa conservada y oculta hasta definir los indicadores y verificar IoT.

EN: The top bar contains Xpace (project and venue) and Quality (Good, Better, Best and Matrix). Both dropdowns show the active selection and open without expanding Options. Matrix is the default on entry, even when another quality was saved; links with explicit quality or visual retain their choice. Selection preserves project and venue identities, the central AdmiraNext connection, permissions, language, white label, inventory and CLI history. Escape or clicking outside closes the dropdown. ☰ opens Options, ▤ Advanced and ⌘ Expert; panels start closed. Telemetry remains retained and hidden until indicators are defined and IoT is verified.

## Uso / Usage

1. Xpacio abre los selectores de proyecto y local; Calidad abre Good/Better/Best/Matrix. / Xpace opens project and venue selectors; Quality opens Good/Better/Best/Matrix.
2. ▤ abre Avanzado; ⌘ abre o cierra Experto. / ▤ opens Advanced; ⌘ opens or closes Expert.
3. Los tres paneles entran cerrados y se superponen a la escena. / All three panels start closed and overlay the scene.

## Contrato / Contract

- Implementación / Implementation: assets/xpace-header.css, admira-xp/index.html (topbarCoreStyle), admira-xp/scripts/project-selector.mjs, admira-xp/scripts/topbar-controls.mjs.
- IDs de control / Control IDs: topBar, pfOptions, pfToggles, pfExpert, xpaceActiveSpace, topbarXpace, topbarQuality, topbarQualityValue.
- Contexto conservado / Retained context: projectContextChip, projectSelector, projectVenueSelector; the compatibility shortcut remains hidden; selectors live in the top bar.
- Telemetría conservada / Retained telemetry: bbSales, bbProfit, bbSat, bbCli, bbCamBox, bbFunnel, bbStatus, xpTopNotify, compAlt, compJTI, compPM, compBAT. Rendering is parked; existing producers still update their nodes.
- La barra conserva su altura de 46 px también con sesión Xtore. / Header height stays at 46 px with a linked Xtore session.
- Alcance / Scope: native twins in /admira-xp/ on admira.store and xpaceos.com; the common shell and native twins share the XpaceOS/space typography, spacing and capitalization.
- Implementado / Implemented: top-bar Xpace/Quality dropdowns, Matrix entry default and preserved selectors/data.
- Pendiente / Pending: Carlos decides which indicators to show after the interface core and operational IoT are complete and verified.
- Sin nuevo comando CLI ni herramienta MCP. / No new CLI command or MCP tool.
- URLs: https://www.admira.store/admira-xp/?autostart=xtanco&quality=good · https://www.xpaceos.com/admira-xp/?autostart=xtanco&quality=good · https://mcp.admira.store/help
