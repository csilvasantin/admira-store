# Inventario · marco cuadrático Admira / Inventory · Admira quadratic frame

Marco cuadrático Admira: por defecto solo se ve la barra horizontal superior. Opciones a la izquierda, Avanzados a la derecha y Experto/CLI abajo empiezan replegados; las vistas del inventario están dentro de Opciones. ☰ y ◨ muestran u ocultan paneles; ⌘ abre el CLI y Escape los cierra. En móvil se usan los mismos botones. Opciones reúne vistas, búsqueda y filtros; Avanzados reúne cámara, malla, descargas, ayuda y conexiones.

Admira quadratic frame: only the horizontal top bar is visible by default. Options on the left, Advanced on the right and Expert/CLI at the bottom start collapsed; inventory views live inside Options. ☰ and ◨ toggle panels; ⌘ opens the CLI and Escape closes them. Mobile uses the same buttons. Options contains views, search and filters; Advanced contains camera, wireframe, downloads, help and connections.

## Navegación / Navigation

En las páginas del inventario, /inventario sin argumentos abre el catálogo; /inventario con argumentos conserva la ejecución en el gemelo de XpaceOS. Desde Yokup se indica abrir el gemelo. Navegación: /inventario, /starbucks, /referencias, /ref PG103-001, /equipo PDG103-BOT-01, /xpaceos, /yokup y /ayuda. La unidad seleccionada conserva su código ITIL al abrir Yokup o volver a XpaceOS. Los candidatos enlazan el portal sin inventar fichas ITIL. Añadir, eliminar o mover muebles se realiza en la Xperience; las fichas patrimoniales se editan en Yokup con sus permisos existentes.

On inventory pages, /inventario without arguments opens the catalogue; arguments retain execution in the XpaceOS twin. From Yokup it prompts opening the twin. Navigation: /inventory, /starbucks, /references, /ref PG103-001, /equipment PDG103-BOT-01, /xpaceos, /yokup and /help. A selected unit retains its ITIL code when opening Yokup or returning to XpaceOS. Candidates link to the portal without inventing ITIL records. Add, remove or move furniture in the Xperience; edit lifecycle records in Yokup with existing permissions.

- Catálogo / Catalogue: https://www.xpaceos.com/inventario/
- Conjunto / Showroom: https://www.xpaceos.com/inventario/conjunto/
- Unidades / Units: https://www.xpaceos.com/inventario/starbucks/?view=inventory
- Referencias / References: https://www.xpaceos.com/inventario/starbucks/?view=references
- Ficha / Record: https://www.yokup.com/equipo-inventario?code=PDG103-BOT-01
- Portal: https://www.yokup.com/retailer#itil

## Identidades y dependencias / Identity and dependencies

ES: Yokup es el maestro ITIL. `itil_code` relaciona el CI con `manifest.json`; `asset_number` identifica el modelo, `instance_id` la unidad y `reference_id` la fotografía. PG103-001–060, catálogo 1–50 y códigos PDG103 se conservan. Fotos de tipo no identifican una unidad física concreta. Los enlaces públicos no incluyen serie, compra, garantía ni credenciales: esos datos requieren el acceso propio de Yokup. Este cambio no crea sincronización de escritura ni nuevas herramientas MCP.

EN: Yokup is the ITIL master. `itil_code` connects the CI to `manifest.json`; `asset_number` identifies the model, `instance_id` the unit and `reference_id` the photograph. PG103-001–060, catalogue 1–50 and PDG103 codes remain stable. Type photos do not identify an exact physical unit. Public links contain no serial, purchase, warranty data or credentials; those require Yokup access. This change does not create write synchronization or new MCP tools.

ES: Componente canónico `assets/xpace-shell.js/css`; adaptador de inventario `inventario/frame.mjs/css`, instalado en Yokup como `inventory-shell.js/css` y `inventory-frame.mjs/css`. La ayuda del CLI conserva los verbos comunes y registra los del inventario. La capa usa overflow:clip para no desplazarse al enfocar controles. Los controles 3D se mueven preservando sus nodos; el visor recibe `controlsHost` para enlazarlos fuera del canvas. Referencias sin modelo ocultan controles y descargas. Ayuda MCP real: https://mcp.admira.store/help y recurso `xpaceos://help`.

EN: Canonical component `assets/xpace-shell.js/css`; inventory adapter `inventario/frame.mjs/css`, installed in Yokup as `inventory-shell.js/css` and `inventory-frame.mjs/css`. CLI help retains common verbs and registers inventory verbs. The layer uses overflow:clip to remain fixed when controls gain focus. Moved 3D controls retain their DOM nodes; the viewer receives `controlsHost` to bind controls outside its canvas. References without models hide camera controls and downloads. Actual MCP help: https://mcp.admira.store/help and resource `xpaceos://help`.

Misión / Mission: Hoy #241 · DCL-1be5b59b234e7be48381c4ee · OraculoMacMini.

## Ficha unificada / Unified record

En Inventario → Starbucks PG103, selecciona una unidad: «Ficha ITIL y 3D» reúne código, instancia, modelo compartido, zona observada y medidas pendientes. Abre el histórico del vínculo visual y la ficha maestra de Yokup con sus permisos. En Experto: /ficha PDG103-MES-02; /marca y /marca off conservan el cambio de aspecto. /avatarDigital de Woz sigue pendiente de publicación. Los candidatos no se dan de alta y la ficha no acredita telemetría real.

In Inventory → Starbucks PG103 select a unit: “ITIL and 3D record” shows code, instance, shared model, photo-observed zone and pending measurements. Open visual-link history and the Yokup master record with its existing permissions. In Expert: /record PDG103-MES-02; /marca and /marca off retain appearance changes. Woz’s /avatarDigital is pending publication. Candidates are not registered automatically; this record does not establish real telemetry.

[Contrato / Contract](https://www.xpaceos.com/admira-xp/docs/itil-3d-record.md)
