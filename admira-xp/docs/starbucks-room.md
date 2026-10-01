# Starbucks · Paseo de Gracia 103 · Good / Better / Best

## ES
Reconstrucción visual a partir del [panorama usado por Matrix](https://panorama-viewer-d8j.pages.dev/img/starbucks-demo.webp). No es un plano medido ni un Gaussian Splatting. La captura equirectangular muestra barra de preparación y caja, TPV vertical, vitrina de bollería y bebidas, seis pantallas de pared, estantería de tazas y café, pilar, pequeñas mesas, entrada elevada, ventilación, focos y altavoz.

- Entrada: `https://www.xpaceos.com/admira-xp/?loc=alsea-sbux-021` conserva Matrix por defecto.
- Comparar: `&quality=good`, `&quality=better`, `&quality=best`, o selector de la tercera columna de Experto.
- Good: dibujo isométrico y contorno pixelado. Better: geometría 3D estilizada con cámara alineada. Best: misma distribución, formas redondeadas, materiales de madera y personajes de mayor detalle.
- Pantallas desde la entrada: 1–3 grupo 1, 4 independiente, 5–6 grupo 2. En el alzado frontal se leen 6, 5 / 4 / 3, 2, 1.
- En estas tres reconstrucciones los menús son ilustraciones estáticas. La reproducción, playlists, TPV publicitario y mapeo MCP existentes siguen en Matrix; cambiar de estilo no publica contenidos en hardware real.
- Distribución específica `starbucks_pg103_v1`; no hereda `layouts/default.xml` ni el inventario de Xtanco/Cafebrería. Las proporciones, mesas y separación entre objetos son una interpretación de la captura, pendientes de medidas de campo.
- Fuente compartida: `scripts/starbucks-room.js`; identidad `alsea-sbux-021`; snapshot `venue`. Good dibuja las mismas piezas que Better/Best. Los controles de gente conservan su comportamiento; no se activan personas al elegir esta vista.
- El esquema MCP de playlists no cambia. Para operar playlists y dispositivos reales/virtuales consulta [Matrix MCP](matrix-mcp.md); esta mejora es de representación, no incorpora nuevas herramientas de publicación.

## EN
Visual reconstruction from the same Matrix panorama, not a measured survey or Gaussian Splatting. All three views share the preparation counter, POS, pastry/drinks case, six wall menus, mugs and coffee shelving, pillar, small tables, stepped entrance, vents, spotlights and speaker. Good retains pixel isometric rendering; Better uses stylized 3D; Best adds rounded shapes, wood materials and detailed people.

Open `?loc=alsea-sbux-021` for Matrix (default), or append `&quality=good|better|best`. Use the third Expert pane to compare. Screen numbering from the entrance is 1–3 / 4 / 5–6 (front elevation: 6,5 / 4 / 3,2,1). Reconstructed menus are static illustrations; operational virtual players, playlists, POS advertising and MCP mapping remain in Matrix. Switching style does not publish to physical hardware.

A dedicated versioned local layout avoids inheriting tobacco-shop or book-café furniture. Existing people visibility preferences remain unchanged. Dimensions and furniture spacing are interpretive pending field measurements. Shared source: `scripts/starbucks-room.js`, location `alsea-sbux-021`, snapshot `venue`. No new MCP write tool or playlist schema is introduced.

## Validation / Verificación
Unit checks cover the six logical screens and groups, POS, profile propagation, scene teardown and furniture removal. Browser QA compares all three modes and checks Matrix entry and other venue isolation. Reference/evidence: Yokup #159.
