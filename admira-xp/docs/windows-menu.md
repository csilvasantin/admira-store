# Ventanas con iconos / Windows with icons

ES: Opciones deja de mostrar «Volver a Admira»: utiliza el acceso del proyecto en la barra superior; /marca off y /brand off siguen disponibles en Experto. En Avanzados → Ventanas, DVR, MetaHuman, Unitree, Pixeria, Plantillas de Xpacio, Guardar plantilla y Presentación del gemelo usan tarjetas e iconos SVG del mismo sistema gráfico que las demás opciones. Los nombres permanecen visibles y cambian con /idioma ESP o /idioma ENG. Cada botón conserva la apertura de su herramienta original; no cambia el inventario, la escena, la marca blanca ni el historial CLI.

EN: Options no longer shows “Back to Admira”: use the project entry in the top bar; /marca off and /brand off remain available in Expert. In Advanced → Windows, DVR, MetaHuman, Unitree, Pixeria, Xpace templates, Save template and Twin presentation use cards and SVG icons from the same graphic system as the other options. Names remain visible and change with /idioma ESP or /idioma ENG. Each button retains its original tool opener; inventory, scene, white label and CLI history are unchanged.

## Tutorial ES

1. Abre ▤ Avanzados y busca Ventanas. Selecciona la tarjeta de la herramienta que quieres abrir.
2. Los botones conservan su nombre junto al icono y funcionan con Tab + Enter o Espacio.
3. Para cambiar de proyecto o volver a Admira, utiliza el acceso del proyecto de la barra superior. Para retirar sólo la marca blanca, escribe `/marca off` en Experto.

## Tutorial EN

1. Open ▤ Advanced and find Windows. Select the card for the tool you want to open.
2. Buttons retain their name beside the icon and work with Tab + Enter or Space.
3. To switch project or return to Admira, use the top bar project entry. To remove only the white label, enter `/marca off` in Expert.

## Contrato compartido / Shared contract

- Shared SVG factory: `admira-xp/scripts/expert-categories.js`, `iconMarkup`; viewBox 0 0 24 24, currentColor, stroke 1.5. Shared cards: `expert-categories.css`, class `expert-category`.
- Registry: `floating-panels.mjs`, `registerFloatingPanel`; menu `#advFloatingWindows`, `data-window-id=classic:dvr|classic:metahuman|classic:unitree|classic:pixeria|classic:templates|classic:save-template|classic:presentation`. Other live registered tools inherit the same card system. Existing callbacks and close/reopen lifecycles are retained.
- Localization observes text labels in place and retains SVGs and listeners. The registry stays a singleton across imports; disposed tools are removed.
- White label: `assets/marca-blanca.js` no longer creates `#mb-volver`. Project navigation, logo, /marca, /brand, preferences and history remain available. No new command or remote MCP tool.
- URLs: https://www.admira.store/admira-xp/?autostart=xtanco and https://www.xpaceos.com/admira-xp/?autostart=xtanco.
- MCP: topic `windows-menu`, resource `xpaceos://help`, https://mcp.admira.store/help. This is local interface presentation, not a physical device action.
- Implementado / Implemented: removal of duplicate back button and shared window cards/icons. Publication and visual checks are recorded with the release evidence; no remote feature is added.
