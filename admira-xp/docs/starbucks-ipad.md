# iPad horizontal Starbucks / Starbucks landscape iPad

## Uso / Usage

ES: Starbucks incorpora un iPad horizontal sobre el mostrador, en lugar del cartel de promoción bajo la pantalla 4. Experto → Inventario/ITIL muestra la ficha PDG103-IPAD-01, modelo 52. Es un dispositivo virtual previsto: la foto identifica el cartel anterior; instalación física, serie y medidas pendientes. En Opciones → Imagen o Vídeo importa contenido de Pixeria, revisa el previo y arrástralo al iPad: sólo ese destino lo muestra. Para conservarlo, abre Playlist actual al final de Vídeo, elige iPad · Publicidad horizontal y añade o arrastra el contenido; Lanzar lo reproduce. La playlist empieza vacía. Recargar pantalla vuelve a su programación. Good, Better, Best y Matrix mantienen esta identidad, marco y formato horizontal; los contenidos se ajustan sin estirar. La pared, el TPV y el hilo musical conservan sus playlists independientes.

EN: Starbucks adds a landscape iPad on the counter, replacing the promotion sign below screen 4. Expert → Inventory/ITIL shows record PDG103-IPAD-01, model 52. This is a planned virtual device: the photo identifies the previous sign; physical installation, serial number and measurements are pending. In Options → Image or Video import Pixeria content, review its preview and drag it to the iPad: only that target displays it. To keep it, open Current playlist at the bottom of Video, choose iPad · Landscape advertising and add or drag the content; Launch plays it. The playlist starts empty. Reload screen restores its schedule. Good, Better, Best and Matrix retain this identity, bezel and landscape format; content fits without stretching. Wall, POS and background music retain their independent playlists.

## Contrato compartido / Shared contract

- Xpacio / Space: `alsea-sbux-021`.
- ITIL: `PDG103-IPAD-01`; instancia y destino / instance and destination: `starbucks-ipad-01`.
- Catálogo / Catalog: `52`, `native:ipadLandscape`; no reutiliza la tablet de satisfacción 15 / retains satisfaction tablet 15.
- Referencia / Reference: `PG103-061`, foto del cartel anterior / photo of the previous sign.
- Canal independiente / Independent channel: `ipad`, `#playliststarbucks-ipad`, `starbucks-alsea-paseo-de-gracia-ipad`. Semilla vacía / empty seed.
- Modelo nominal con pantalla 4:3 horizontal / nominal model with landscape 4:3 display. Vídeo 16:9 con bandas, sin deformar / 16:9 video fits with letterboxing.
- GLB y Blender editables / editable GLB and Blender: `/inventario/assets/catalog/52/{good,better,best}.{glb,blend}`.
- Fuente / Source: `admira-xp/scripts/starbucks-ipad.mjs`; exportar / export: `node admira-xp/scripts/export-starbucks-ipad.mjs`.
- Mapeo / Mapping: `/admira-xp/starbucks-ipad-mapping.json`; playlist: `/admira-xp/starbucks-ipad-playlist.json`.
- Modelo / Builder: `admira-xp/tools/xpacios-blender/build_ipad.py`, Blender en segundo plano / headless Blender.

## MCP y estado / MCP and state

`matrix_state` lee el estado vivo / reads live state: https://mcp.admira.store/matrix/starbucks.
`matrix_playlist_update` y `playlist_add` aceptan `ipad` / accept `ipad`.
`matrix_device_layout`, `matrix_preview`, `matrix_power` y `playlist_play` mantienen revisión y autenticación existentes / retain existing revision and authentication.
Las herramientas publicadas disponibles son `matrix_device_layout`, `matrix_preview`, `playlist_play` y `playlist_add`; `matrix_power` es una operación interna / published tools are the listed names; matrix_power is internal.
Ejemplo / Example: `matrix_preview {action:"preview",device_ids:["starbucks-ipad-01"],track:{id:"stock-id",title:"Promotion",url:"https://api.admira.store/stock/asset/stock-id",kind:"image"},expected_revision:N}`.
Las semillas no sobrescriben playlists gestionadas ni mapas guardados / seeds do not overwrite managed playlists or saved maps.
Máximo ocho destinos documentados / maximum eight documented destinations, con pared 1–6 y TPV independientes / with wall 1–6 and independent POS.

## Estado verificado y dependencias / Verified status and dependencies

Alta en el maestro Yokup con orientación horizontal y descripción «virtual previsto; instalación física pendiente» / registered in Yokup master with horizontal orientation and description “planned virtual; physical installation pending”.
Se conserva el histórico previo de las once unidades, las sesenta referencias y los números de catálogo / previous eleven units, sixty references and catalog numbers retain their history.
La nueva ficha cuenta una sola vez, aunque también sea destino de vídeo / new record counts once even though it is also a video destination.
El playerId físico permanece vacío. No se ha instalado, comprado ni vinculado hardware real / physical playerId remains empty; no real hardware installation, purchase or binding.
Yokup mantiene el ciclo de vida; la ficha virtual no verifica estado físico ni garantía / Yokup owns lifecycle; virtual record does not verify physical status or warranty.
