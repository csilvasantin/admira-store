# Matrix · MCP · Agentes / Agents

Las pantallas de Matrix · Starbucks y el TPV llevan marco negro, incluido el halo de la captura. Los agentes gestionan sus contenidos desde el MCP de XpaceOS: matrix_state consulta las cuatro playlists (wall, tpv, ipad, music); matrix_playlist_update añade, quita, ordena o vacía contenido; matrix_configure controla reproducción de pared/TPV, sincro, etiquetas y silencio; matrix_music_next avanza la música. Matrix consulta cambios cada 5 segundos mientras está abierto. Las escrituras exigen clave de flota y expected_revision; quedan firmadas por el agente. El estado compartido conserva la última versión si se pierde la conexión.

Matrix · Starbucks screens and POS use black frames, covering the captured blue halo. Agents manage content through XpaceOS MCP: matrix_state reads the four playlists (wall, tpv, ipad, music); matrix_playlist_update adds, removes, reorders or clears content; matrix_configure controls wall/POS playback, sync, labels and mute; matrix_music_next advances music. Open Matrix pages poll every 5 seconds. Writes require a fleet key and expected_revision and are signed by the agent. The last state is retained if the connection fails.

ES: Estos controles operan los players virtuales de Matrix. El audio se activa con una pulsación local. Los controles locales siguen disponibles; un nuevo cambio remoto del mismo control prevalece. reset:true libera los controles compartidos y conserva la elección local actual. Para comunicación y encargos entre agentes se utiliza el MCP de Admira.live (agora_decir, agente_encargar, encargo_estado); no se ha enviado ningún encargo de prueba. Añadir funciones nuevas requiere implementación y despliegue: matrix_configure sólo admite las funciones enumeradas, no código arbitrario. El mapeo de esquinas continúa en Editor de geometría y no hay confirmación de recepción en hardware.

EN: Controls operate virtual Matrix players. Sound activation requires a local click. Local controls remain available; a new remote change to the same control takes precedence. reset:true releases shared controls while retaining the current local choice. Agent communication and assignments use the Admira.live MCP (agora_decir, agente_encargar, encargo_estado); no test assignment was sent. New capabilities require implementation and deployment: matrix_configure accepts only the listed controls, not arbitrary code. Corner mapping remains in Geometry editor; no hardware receipt is implied.

## Contrato / Contract

MCP: https://mcp.admira.store/mcp · resource: `xpaceos://matrix/starbucks` · read-only browser feed: https://mcp.admira.store/matrix/starbucks.

1. `quien_soy` confirma tu identidad y escritura / confirms identity and write access. Use your own fleet key; never put credentials into URLs or source files.
2. `matrix_state {}` devuelve / returns `revision`, `playlists`, `controls`, `controlRevision`, `musicNext`, `updatedBy`, `updatedAt`, `history` (last 50 signed operations).
3. Cada escritura usa la última revisión / Every write passes the latest `expected_revision`. A concurrent write rejects stale revisions: read again, review and retry.

Channels: `wall` = six screens (1–3 / 4 / 5–6), `tpv` = local advertising terminal, `music` = speaker/PlayerTaza selection. Playlist identifiers remain unchanged. Public static JSON files are bootstrap snapshots; after a channel is managed through MCP, `matrix_state.playlists[channel]` is authoritative. The legacy music delivery feed remains active until music is managed by MCP; thereafter it cannot re-add a removed song. Queue producers should call `matrix_playlist_update` with published Stock URLs.

### Añadir / Add

`matrix_playlist_update`:
```json
{"channel":"tpv","action":"add","expected_revision":12,"track":{"id":"my-local-ad","stockId":"published-stock-id","title":"Local promotion","url":"https://stock.admira.store/stock/published-stock-id/asset.mp4"}}
```
Revision and Stock ID above are illustrative; read actual state first. Use an existing playable HTTPS media URL, not a YouTube page. Publish media through Pixeria first. No credentials in URLs. Max 100 tracks per channel; IDs and URLs cannot repeat. Prefer MP4 for wall/TPV; music supports browser-playable audio or video.

### Quitar, ordenar y vaciar / Remove, reorder and clear

- Remove: `{channel:"tpv", action:"remove", track_id:"my-local-ad", expected_revision:N}`.
- Reorder: `{channel:"tpv", action:"reorder", order:["id-2","id-1"], expected_revision:N}`. Include every current ID exactly once.
- Clear: `{channel:"tpv", action:"clear", expected_revision:N}`. Stops that channel and clears its media; other channels continue. Removes playlist entries, never deletes Stock files.
- Adding/reordering keeps the current clip and time if its URL remains. Removing the current clip selects the next available position and preserves play/pause or mute. A cleared channel stays stopped until playback is requested after refilling.

### Funciones / Functions

`matrix_configure {expected_revision:N, controls:{wallPlaying:true, tpvPlaying:true, wallMode:"groups", numbersVisible:true, musicMuted:true}}`

All controls optional within a nonempty patch. `wallMode`: `individual`, `groups`, `total`. `musicMuted` only accepts true: remote commands cannot grant browser audio permission. `matrix_configure {expected_revision:N, reset:true}` releases remote overrides; does not reset playlists. Local corner mappings and custom preview URLs remain unchanged. Shared changes apply only to mapped players assigned to the canonical playlists.

`matrix_music_next {expected_revision:N}` increments a command sequence. Open pages apply new commands once, preserving mute. A newly opened page does not replay historical skips. There is no cross-device playback clock or proof-of-play acknowledgement: `ok:true` means persisted, not rendered on a physical screen.

### Comunicación y nuevas funciones / Communication and new capabilities

Use `galaxy {element:"admira-live"}` to discover https://mcp.admira.live/mcp. With the same fleet identity and `Accept: application/json, text/event-stream`, discover `tools/list`; use `agora_decir` for messages, `agente_encargar` for authorized assignments, `encargo_estado` for tracking. Read each server's schemas instead of inventing arguments. Matrix mutations are not agent messages and do not dispatch tasks automatically. New feature requests can be assigned through that MCP and require code changes, tests and deployment.

Persistence: Cloudflare D1 `xpaceos-matrix`, single atomic revision with last 50 signed changes. Bootstrap source: xpaceos-mcp/src/matrix-defaults.mjs. UI: matrix-remote.mjs, matrix-panorama.mjs; interval 5s after each completed request (8s timeout). Offline keeps last known state; initial unavailability uses bundled playlists. No bearer secret is delivered to browsers. Black border covers capture edge without changing stored anchor coordinates.

Yokup #232. ES/EN.

## Aviso de cierre / Closing announcement

El altavoz negro junto a la escalera reproduce el aviso: «Hoy por motivos de fiesta local, nuestro horario de cierre es a las 22 horas. Gracias.». Primera voz gratuita: Mónica de macOS. La música continúa avanzando con volumen cero durante el aviso y recupera su volumen y estado de silencio al terminar, cancelar o fallar. Una segunda pulsación detiene el aviso. En Control Xtore, /sin autocompleta /sincro on o /sincro off según el estado contrario al actual; Enter ejecuta y Tab acepta. El texto sugerido se puede editar. Los paneles inferiores ocultan las barras de scroll y conservan desplazamiento y tiradores de tamaño.

The black speaker beside the staircase plays the Spanish closing announcement: “Hoy por motivos de fiesta local, nuestro horario de cierre es a las 22 horas. Gracias.” Initial free voice: macOS Mónica. Music keeps advancing at zero volume during the announcement; its volume and mute state are restored on completion, cancellation or failure. Click again to stop. In Control Xtore, /sin completes /sincro on or /sincro off, targeting the opposite current state; Enter runs it and Tab accepts. Suggested text remains editable. Bottom panels hide scrollbars while preserving scrolling and resize handles.

matrix_announcement {expected_revision:N} increments announcementNext. Read matrix_state first. Authenticated fleet key required. Open Matrix pages apply new events once; newly opened pages do not replay old announcements. Browser audio permission is required: if blocked, click the speaker locally. Saved is not playback acknowledgement. The music playlist is unchanged.

[Guide](https://www.xpaceos.com/admira-xp/docs/starbucks-announcement.md)

## Layout · Device playlists

En Matrix · Starbucks, /layout activa los números y la selección de las seis pantallas y el TPV. Pulsa el dispositivo o su número para editar su playlist. Ctrl + clic, Cmd + clic en Mac o Selección múltiple permiten añadir o quitar dispositivos de la selección. Unir seleccionados les asigna una playlist común y un reloj de reproducción local. Puedes añadir vídeos por URL HTTPS directa, quitarlos, ordenarlos, guardar, usar otra playlist, separar dispositivos o restaurar su playlist original. Editar una playlist compartida afecta a todos sus miembros, indicados en el editor. Al editar una playlist original se crea una copia para los seleccionados. Los cambios del panel se guardan en este navegador; las operaciones MCP autenticadas comparten asignaciones entre clientes abiertos. Salir de /layout cierra el editor y devuelve el arrastre de cámara.

In Matrix · Starbucks, /layout enables labels and selection for the six wall screens and POS. Click the device or its number to edit its playlist. Ctrl + click, Cmd + click on Mac or Multiple selection adds/removes devices from the selection. Group selected assigns one shared playlist and a local playback clock. Add direct HTTPS video URLs, remove/reorder clips, save, use another playlist, ungroup devices or restore their original playlist. Editing a shared playlist affects every member listed in the editor. Editing a base playlist creates a copy for the selected devices. Saving publishes playlist contents by #playlist ID; device assignments are saved in this browser. Leaving /layout closes the editor and restores camera dragging.

matrix_device_layout: save_playlist {playlist_id:"playlist-local",title:"Local",tracks:[{id:"clip",title:"Promotion",url:"https://stock.admira.store/stock/ID/asset.mp4"}]}; assign {device_ids:["starbucks-wall-06","starbucks-tpv-01"],playlist_id:"playlist-local"}; reset {device_ids:[...]}; remove_playlist {playlist_id:"playlist-local"}. Every call requires action and a fresh expected_revision from matrix_state. deviceLayout contains custom playlists and assignments; deviceLayoutRevision controls delivery. Maximum 24 custom playlists, 100 clips each. Only the seven documented virtual screen IDs are supported. No physical-device publication or cross-browser playback clock.

[Guide](https://www.xpaceos.com/admira-xp/docs/device-playlists.md)

ES: En Yokup, resolve:true registra la recuperación del recurso; el cierre definitivo requiere verificación en Yokup. EN: In Yokup, resolve:true records resource recovery; final ticket closure requires verification in Yokup.

## 25 · Pixeria · Añadir vídeos por título, hashtag o número / Add videos by title, hashtag or number

ES: En Matrix, pulsa Asignar contenidos, elige una pantalla o el TPV y Añadir vídeo. Hay un único campo: título, #hashtag o número de Pixeria, por ejemplo #1329. Enter, Buscar en Pixeria o salir del campo inicia la búsqueda. Una coincidencia única se aplica directamente; si hay varias, elige un resultado. La elección guarda la playlist, la asigna al dispositivo seleccionado y reproduce ese contenido. La URL HTTPS se resuelve internamente. Los dispositivos que comparten la playlist siguen su reloj común. Los errores conservan el borrador; las filas vacías se ignoran y las búsquedas pendientes deben resolverse. No se añaden todos los resultados de un hashtag. Los duplicados se avisan.

EN: In Matrix, click Assign content, select a screen or POS and Add video. Use the single field for a Pixeria title, #hashtag or number such as #1329. Enter, Search Pixeria or leaving the field starts the lookup. A unique match applies directly; otherwise choose a result. Choosing saves the playlist, assigns it to the selected device and plays that content. The HTTPS URL is resolved internally. Devices sharing the playlist follow their common clock. Errors preserve drafts; empty rows are ignored and pending searches must be resolved. Hashtag results are not bulk-added. Duplicates are reported.

### MCP y fuente / MCP and source

pixeria_search {query:"#1329",limit:20} is a public read. Accepted queries: title words (case/accent insensitive), exact hashtag, stable Stock number or asset id. Returns {query,total,items:[{id,num,title,url,tags,type,exact}]}; only published videos with direct HTTPS URLs. Default limit 20, maximum 50. Stock numbers use the catalog num field, never the position in the list. Public UI endpoint: https://mcp.admira.store/pixeria/search?query=%231329&limit=20. Upstream catalog: https://pub-bf043a4daa3b43b7a0b769617729d074.r2.dev/stock/index.json, the same public library used by Pixeria. Short cache (up to 30 seconds); failures remain visible and do not overwrite a playlist.

playlist_add {playlist:"tpv",stockId:"#1329",expected_revision:N} adds the resolved video to a shared base playlist. playlist aliases: hilo, pantallas, tpv, sincro-ia. Existing demo assets remain supported; new Pixeria lookup returns videos only. Ambiguous titles/hashtags fail with no write: use pixeria_search, select an id/number and retry with a fresh revision. Removal/reorder use IDs or Stock numbers already stored in that playlist. For a custom device playlist, read matrix_state, resolve via pixeria_search, then matrix_device_layout save_playlist with the complete ordered array of {id,title,url}; assign only the intended device_ids. Writes require each agent’s own fleet key and expected_revision. Saving UI playlists publishes their contents by #playlist ID; device assignments remain local. Never put a fleet key in browser code.

Verified example: Stock #1329 = 1790711463701-yxy150, “Good Energy with Adrian Grenier: Starbucks & The Devil Wears Prada 2”. #1329 is a stable reference, not a promise that it is always the latest upload.

Docs: https://www.xpaceos.com/admira-xp/docs/pixeria-playlists.md

## Playlist · Previo y Play / Preview and Play

ES: En Matrix → /layout → dispositivo, cada fila muestra un previo silencioso junto al número. El botón ▶ está a la derecha de × y salta al inicio de ese contenido. Todos los dispositivos virtuales activos que usan esa playlist cambian juntos, reanudando los pausados; después continúa el orden normal. Las otras playlists y el hilo musical no cambian. Play guarda primero los cambios válidos e ignora filas vacías. Los dispositivos apagados permanecen apagados. El previo no reproduce audio. Si falla el vídeo, se indica el error y Play permite reintentar.

EN: In Matrix → /layout → device, each row shows a silent preview beside its number. The ▶ button is immediately to the right of × and jumps to the beginning of that content. All active virtual devices using that playlist switch together, resuming paused members; normal playlist order continues afterwards. Other playlists and background music are unaffected. Play saves valid draft changes first and ignores empty rows. Powered-off devices stay off. Previews never play audio. Failed videos show an error and Play retries.

MCP: playlist_play {playlist_id, track_id, expected_revision}. Read matrix_state first. playlist_id is wall, tpv, ipad or a shared playlist-<id>. track_id is the saved content ID, not its row number. Authenticated fleet key required. Saving in the editor publishes a stable #playlist UUID; screen assignments remain local. For UUID playlists read playlist_list, not matrix_state, for the revision. The UI Play action remains local to the current browser. MCP commands reach already-open Matrix clients at the next poll (approximately 5 seconds); old commands are not replayed when entering Matrix. Each browser synchronizes its assigned devices locally; this does not guarantee frame accuracy between browsers or publish to physical players. Selecting a regular video exits AI sync. An acknowledgement records the command, not successful playback.

ES: Los agentes pueden leer, editar y saltar a contenido compartido por MCP. EN: Agents can read, edit and jump to shared content through MCP. Endpoint: https://mcp.admira.store/mcp. Example: read matrix_state, then playlist_play with playlist_id="wall", track_id from state.playlists.wall.tracks and the current expected_revision.

## Playlist IDs · Guardado, Play y agentes / Saving, Play and agents

ES: Se ignoran las filas totalmente vacías al guardar o pulsar Play. Una búsqueda sin resolver debe completarse eligiendo un resultado de Pixeria; el borrador se conserva si hay un error. Play guarda primero los cambios válidos y asigna la playlist al dispositivo seleccionado antes de saltar al vídeo. Todos los dispositivos que ya comparten esa misma playlist siguen su reloj común. Elegir una playlist en el desplegable ya no provoca que Play actúe sólo en su antiguo destino.

EN: Completely empty rows are ignored when saving or pressing Play. An unresolved lookup must be completed by choosing a Pixeria result; errors preserve the draft. Play first saves valid edits and assigns the playlist to the selected device before jumping to the video. Devices already sharing that playlist follow their common clock. Choosing a playlist no longer makes Play target only its previous device.

ES: Cada playlist guardada desde el editor tiene un ID estable #playlist<UUID>, visible con Copiar ID. Guardar publica título y contenidos en el registro compartido; la asignación de pantallas sigue en este navegador. Editar y volver a guardar mantiene el ID; Unir crea una nueva lista. Las listas antiguas locales se publican la próxima vez que se guardan. La URL de lectura es https://mcp.admira.store/playlists/<UUID>. El navegador conserva una autorización limitada a sus propias playlists; nunca recibe claves de flota. Comparte el ID, no las credenciales.

EN: Every playlist saved from the editor gets a stable #playlist<UUID> ID, shown with Copy ID. Saving publishes its title and contents to the shared registry; screen assignments stay in this browser. Editing and saving retains its ID; Group creates a new list. Legacy local playlists are published on their next save. Public read URL: https://mcp.admira.store/playlists/<UUID>. The browser holds authorization scoped to its own playlists and never receives fleet keys. Share the ID, not credentials.

MCP example: playlist_add {playlist:"#playlist<UUID>",stockId:"#1309"}. An authenticated agent appends to the end automatically when position is omitted. Stock title, exact hashtag or number are supported; ambiguous searches require choosing a result. Repeated append of the same asset to a UUID playlist is idempotent. Concurrent appends retry without losing items. expected_revision is optional for append; supply it to require an exact revision. playlist_list {playlist:"#playlist<UUID>"} returns current contents and its own revision. playlist_remove and playlist_reorder accept that identifier plus expected_revision; use saved track IDs. playlist_play {playlist_id:"#playlist<UUID>",track_id:"<saved id>",expected_revision:N} jumps on already-open subscribed clients. The UUID playlist revision is independent of matrix_state.revision.

ES: Los cambios de agentes llegan cada cinco segundos a las listas guardadas y asignadas en el navegador. Se añaden al final sin interrumpir el vídeo actual. Si hay edición pendiente, se conserva; un guardado con revisión antigua se rechaza. Recargar playlist permite recuperar los cambios compartidos antes de editar otra vez. Si no hay conexión, se conserva el último estado. No hay publicación a dispositivos físicos.

EN: Agent updates arrive about every five seconds for registered playlists present in the browser. Appending preserves the current video and puts new content at the end. Pending edits are retained; a stale save is rejected. Reload playlist retrieves shared changes before editing again. Offline playback keeps the last state. This does not publish to physical devices.

Base IDs: #playliststarbucks-wall (pantallas), #playliststarbucks-tpv (tpv), #playliststarbucks-ipad (ipad), #playliststarbucks-music (hilo), #playliststarbucks-ia (sincro-ia). Base writes use matrix_state revision; playlist_add can obtain it automatically when omitted. UUID playlists use playlist_list revision. Existing matrix_device_layout remains available for legacy shared assignments and playlists. Endpoint: https://mcp.admira.store/mcp.

## Asignar contenidos / Assign content

ES: En Matrix, pulsa Asignar contenidos, elige una pantalla o el TPV y Añadir vídeo. Hay un único campo: título, #hashtag o número de Pixeria, por ejemplo #1329. Enter, Buscar en Pixeria o salir del campo inicia la búsqueda. Una coincidencia única se aplica directamente; si hay varias, elige un resultado. La elección guarda la playlist, la asigna al dispositivo seleccionado y reproduce ese contenido. La URL HTTPS se resuelve internamente. Los dispositivos que comparten la playlist siguen su reloj común. Los errores conservan el borrador; las filas vacías se ignoran y las búsquedas pendientes deben resolverse. No se añaden todos los resultados de un hashtag. Los duplicados se avisan.

EN: In Matrix, click Assign content, select a screen or POS and Add video. Use the single field for a Pixeria title, #hashtag or number such as #1329. Enter, Search Pixeria or leaving the field starts the lookup. A unique match applies directly; otherwise choose a result. Choosing saves the playlist, assigns it to the selected device and plays that content. The HTTPS URL is resolved internally. Devices sharing the playlist follow their common clock. Errors preserve drafts; empty rows are ignored and pending searches must be resolved. Hashtag results are not bulk-added. Duplicates are reported.

ES: Asignar contenidos activa /layout y oculta el panel de geometría. Las asignaciones también recuperan la reproducción sobre mapas antiguos con otra URL de vista previa, conservando las esquinas. El ID #playlist permanece estable. MCP playlist_add añade al final sin interrumpir el contenido actual; playlist_play permite saltar a un contenido concreto. Las operaciones afectan a players virtuales.

EN: Assign content enables /layout and hides the geometry panel. Assignments also restore playback on older maps with a different preview URL, preserving corners. The #playlist ID remains stable. MCP playlist_add appends without interrupting the current item; playlist_play jumps to a specific item. These operations affect virtual players.

## Arrastrar a pantallas · Recargar playlist / Drop on screens · Reload playlist

ES: En /layout o Asignar contenidos, arrastra la miniatura de una fila hasta una pantalla o el TPV para probar ese vídeo en bucle y sin audio. Dentro de la lista, el mismo gesto sigue reordenando el borrador. El destino se ilumina al pasar por encima. Escape, cancelar el gesto o soltar fuera de un destino cancela sin aplicar. El contenido debe estar resuelto en Pixeria. Las flechas ↑/↓ siguen disponibles para ordenar con teclado.

EN: In /layout or Assign content, drag a row thumbnail onto a screen or POS to preview that video muted on repeat. Dragging inside the list still reorders the draft. Destinations highlight on hover. Escape, gesture cancellation or dropping outside a destination cancels without applying. Resolve the Pixeria content first. Arrow keys remain available to reorder with the keyboard.

ES: Ctrl/Cmd + clic o Selección múltiple permite seleccionar varias pantallas. Al soltar en una de ellas, el vídeo se reparte entre todas, sincronizado y adaptado a sus proporciones, en orden físico de la pared (6 hacia 1; TPV al final). Si sueltas en una pantalla no seleccionada, el previo afecta sólo a ese destino. Se conserva la playlist guardada, su orden, su ID y las asignaciones. Un nuevo previo sustituye al anterior; no enciende dispositivos apagados ni modifica el hilo musical.

EN: Ctrl/Cmd + click or Multiple selection selects several screens. Dropping on one of them spans the video across all selected surfaces, synchronized and adapted to their proportions, in physical wall order (6 toward 1; POS last). Dropping on an unselected screen previews only that destination. Saved playlists, order, IDs and assignments remain unchanged. A new preview replaces the previous one; powered-off devices stay off and background music is unaffected.

ES: Recargar playlist / Reload playlist termina el previo que incluya los dispositivos elegidos, descarta el borrador y recupera la última playlist guardada de cada destino. Las playlists con #playlist UUID consultan el registro compartido; las locales y bases usan la programación guardada/cargada. Empieza por el primer contenido y respeta el ajuste Reproducir en bucle (activado por defecto). Si varios dispositivos comparten esa playlist, su reloj vuelve al inicio conjuntamente. Una lista vacía queda sin contenido; un fallo de red mantiene el previo y permite reintentar. “Original” significa la playlist guardada, no borrar las ediciones ni volver a la semilla de fábrica. Restaurar playlist original es la acción separada que vuelve a la asignación base.

EN: Reload playlist ends the preview intersecting the chosen devices, discards the draft and restores each destination’s latest saved playlist. Registered #playlist UUIDs refresh from the shared registry; local and base playlists use their saved/loaded schedule. Playback starts with the first item and respects Loop playlist (enabled by default). Devices sharing that playlist restart their common clock together. Empty playlists stay empty; network failures retain the preview for retry. “Original” means the saved playlist, not deleting edits or returning to factory seeds. Restore original playlist is the separate action that restores the base assignment.

MCP: matrix_preview {action:"preview",device_ids:["starbucks-wall-04","starbucks-wall-03"],track:{id:"<asset id>",title:"<title>",url:"<HTTPS media URL>"},expected_revision:N}. Resolve content first with pixeria_search {query:"#1329"}, or read playlist_list for a saved item. Wall IDs retain mapping anchors: P1=wall-06, P2=wall-05, P3=wall-04, P4=wall-03, P5=wall-02, P6=wall-01; each has the starbucks- prefix. POS=starbucks-tpv-01; landscape iPad=starbucks-ipad-01.

MCP: matrix_preview {action:"reload",device_ids:["starbucks-wall-04","starbucks-wall-03"],expected_revision:N}. Read matrix_state before either write. Both commands require the agent’s own fleet authentication and the Matrix revision (not the UUID playlist revision). The signed previewCommand is consumed only by already-open Matrix clients on the next poll, approximately five seconds. Old commands are not replayed on entry. Each browser restores its own saved assignments; commands do not overwrite playlist contents. A saved command is not a playback acknowledgement. These are virtual devices, not physical broadcasting.

ES: Arrastrar desde la UI es local y temporal. Para solicitar lo mismo desde otro agente usa matrix_preview. EN: UI dragging is local and temporary. Agents request the same actions through matrix_preview. Endpoint: https://mcp.admira.store/mcp. Guide: https://www.xpaceos.com/admira-xp/docs/playlist-drop.md.
