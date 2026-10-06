# Matrix, Signage y /reset / Matrix, Signage and /reset

## Español

Matrix controla exclusivamente la captura y sus ocho dispositivos: seis pantallas de pared, TPV e iPad. Las capas de Good se ocultan mientras Matrix está abierto y reaparecen al volver a Good. Signage muestra destinos Matrix; arrastrar un contenido lo previsualiza sólo en la pantalla elegida, sin pines Good ni escritura de playlists compartidas. Los previos de pantallas diferentes se mantienen independientes. PREVIOS conserva sólo la última creación y ocupa toda la tercera columna del Experto, también con Signage abierto; Lanzar a pantalla y Ver en Stock quedan debajo. /reset, sin argumentos, restaura los trece contenidos básicos y su orden original en Signage, libera los pines y devuelve Matrix a sus playlists base de pared, TPV e iPad desde el principio. Los imports se apartan de la playlist activa sin borrarse de IndexedDB, y las creaciones, recibos de Stock, banco de voces, historial CLI, idioma y marca se conservan. El hilo musical no cambia. Las playlists compartidas MCP y los equipos físicos no se modifican; el estado MCP vigente sigue siendo la programación base. El comando se ejecuta en este navegador sin enviar mensajes a Telegram.

## English

Matrix exclusively owns the capture and its eight devices: six wall screens, POS and iPad. Good layers are hidden while Matrix is open and return when switching to Good. Signage shows Matrix destinations; dropping an item previews it only on the chosen screen without Good pins or shared playlist writes. Previews on different screens remain independent. PREVIEWS keeps only the latest creation and fills the third Expert column, including when Signage is open; Launch to screen and Open in Stock sit below. /reset, without arguments, restores the thirteen basic Signage items in their original order, releases pins and returns Matrix to its base wall, POS and iPad playlists from the beginning. Imports are excluded from the active playlist without being deleted from IndexedDB; creations, Stock receipts, voice bank, CLI history, language and brand are retained. Background music is unchanged. Shared MCP playlists and physical devices are not modified; current MCP state remains the base schedule. The command runs in this browser without sending Telegram messages.

## Contrato / Contract

- CLI: `/reset` (local, no arguments).
- Devices: `starbucks-wall-01` … `starbucks-wall-06`, `starbucks-tpv-01`, `starbucks-ipad-01`.
- Scene ownership: `body.xpace-matrix-active`; legacy boxes retain layout geometry but are hidden.
- Temporary playback: independent device previews; no `playlist_add`, `playlist_move` or remote layout mutation.
- Base schedule: authoritative managed state at `https://mcp.admira.store/matrix/starbucks`; static JSON is only bootstrap.
- Local preferences: `xtanco_ds_pins`, `xtanco_ds_playlist_order`, `xtanco_ds_reset_imports.v1` (excluded import IDs), `xpaceos.options-playlist-stock.v1`, `xpaceos.starbucks.device-layout.v1` (retain remoteRevision and saved playlists).
- Stock and created-media receipt storage remain unchanged. Reset is not `/import clear`; it never purges imported files.
- Live MCP updates with a newer revision remain authoritative. Offline error/off devices are reported; reset does not silently power on unavailable devices.
- No new MCP tool: public help topic `matrix-signage-reset`.
