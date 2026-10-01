# Cierre de implementaciones XpaceOS

Por instrucción de Carlos, cada implementación debe terminar con MCP, help y documentación actualizados en español e inglés, incluyendo el tutorial cuando cambie el uso. El cambio no se entrega como terminado si esas superficies describen un comportamiento anterior.

- Actualizar la ayuda web (`admira-xp/help.html`), tutorial (`help/index.html`), ayuda CLI (`help/cli/index.html`), catálogo y manifiesto MCP (`mcp/`) y documentación de la función (`admira-xp/docs/`).
- Actualizar también la ayuda del servidor MCP real, no sólo la web: repositorio `csilvasantin/xpaceos-mcp`, servicio `https://mcp.admira.store` (checkout local habitual `/Users/csilvasantin/Claude/repos/xpaceos-mcp`).
- Documentar recursos compartidos, IDs, URLs estables, estado verificado y dependencias pendientes para consejeros y agentes. Separar lo implementado de lo encargado y pendiente. Comunicar los contratos a los agentes implicados cuando el encargo autorice la coordinación.
- Comprobar documentación y contratos, commit + push, desplegar y verificar URLs y ayuda MCP públicas antes de entregar. Registrar resultado en Yokup conforme a las instrucciones del workspace.
- Playlist Starbucks: la fuente es `admira-xp/scripts/starbucks-playlist.mjs`. Tras modificarla, ejecutar `node admira-xp/scripts/export-starbucks-playlist.mjs` y publicar el JSON generado. Guía: `admira-xp/docs/starbucks-playlist.md`.

Every implementation must ship with current Spanish/English MCP help, web help, tutorial and documentation. Publish verified shared contracts for agents; distinguish delivered behavior from pending work. Verify the deployed URLs and actual MCP server before reporting completion.

Pantallas Starbucks: fuente `admira-xp/scripts/starbucks-screens.mjs`; regenerar playlist/mapa JSON con `node admira-xp/scripts/export-starbucks-screens.mjs`. Mantener esta playlist separada del hilo musical.

TPV Starbucks / POS: fuente `admira-xp/scripts/starbucks-tpv.mjs`; regenerar sus JSON con `node admira-xp/scripts/export-starbucks-tpv.mjs`. Playlist de publicidad local independiente de pared e hilo musical / Local advertising playlist independent of wall and speaker music. Guía / Guide: `admira-xp/docs/starbucks-tpv.md`.

Matrix MCP: estado compartido en `https://mcp.admira.store/matrix/starbucks`, editable sólo mediante herramientas MCP autenticadas con revisión. Los JSON del sitio son semillas, no el estado vivo tras una edición MCP. Source: xpaceos-mcp/src/matrix-state.mjs; guide `admira-xp/docs/matrix-mcp.md`. Shared state is authoritative after a channel is managed; static JSON remains bootstrap.
