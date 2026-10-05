# Programa vigente / Current program · FLT-101280 / FLT-101281

Demo Starbucks: fuera de /layout, pulsa la pantalla 1 para Desenchufar/Enchufar; queda negra y se abre una incidencia real en Yokup, que se resuelve al enchufar. Abrir incidencia muestra los nombres y el formulario manual de incidencias: equipo, problema y gravedad (alta por defecto). Cada ticket manual tiene un recurso único; un fallo conserva el texto para reintentar. Editor de geometría conserva el editor de esquinas. Hilo musical: Stock 1308 → 1309, EXIT avanza conservando mute. Pared normal: 1310, 1312, 1314; /navidad activa 1313, /navidad off vuelve a la programación normal. TPV: 1315 → 1317. /sincro IA usa P1=1316, P2=1318, P3=1319, P4=1320, P5=1321, P6=1322, con carga coordinada, reloj local común, bucle y vídeo silenciado. /sincro off sale de IA. Son controles de la demo virtual, no de la alimentación física.

Starbucks demo: outside /layout, click screen 1 for Unplug/Plug in; it turns black and opens a real Yokup incident, resolved when plugged back in. Open incident shows device names and the manual incident form: device, problem and severity (high by default). Each manual ticket has a unique resource; failures preserve the text for retry. Geometry editor retains the corner editor. Music: Stock 1308 → 1309; EXIT advances while preserving mute. Normal wall: 1310, 1312, 1314; /christmas activates 1313 and /christmas off returns to normal. POS: 1315 → 1317. /sync AI uses P1=1316, P2=1318, P3=1319, P4=1320, P5=1321, P6=1322 with a load barrier, shared local clock, looping and muted video. /sync off exits AI. These are virtual demo controls, not physical power switching.

[Contrato vigente / Current contract](https://www.xpaceos.com/admira-xp/docs/starbucks-operations.md)

---

# Best y Matrix — 29 septiembre 2026

Good conserva el gemelo clásico; Better muestra su versión 3D. Best es ahora la anterior Matrix: Avenida Admira con cámara fija, muebles editables y visitantes del gemelo. Matrix abre la captura 360° del Starbucks de Alsea. En «Editor de geometría», marca las cuatro esquinas de la pantalla, anota el ID del player real y una URL HTTPS de vista previa. Aplica los datos y guarda el mapa en este navegador; puedes exportarlo o importarlo. Un ID anotado no verifica conexión ni publica contenido en equipos reales. La captura disponible es un panorama equirectangular, no un modelo Gaussian Splatting.

Good keeps the classic twin; Better shows its 3D version. Best is now the former Matrix: Avenida Admira with a fixed camera, editable furniture and live visitors. Matrix opens the Starbucks Alsea 360° capture. In “Geometry editor”, mark the four screen corners, enter the real player ID and an HTTPS preview URL. Apply the data and save the map in this browser; maps can be exported or imported. Entering an ID does not verify a connection or publish content to real devices. The available capture is an equirectangular panorama, not a Gaussian Splatting model.

## Contrato de mapeo

- Cuatro anclajes yaw/pitch por pantalla: TL, TR, BR, BL. Reproyección con homografía al mover la cámara.
- ID real y URL de previsualización son metadatos introducidos por el usuario; no se inventan ni se validan contra un backend de players.
- Guardado local, exportación/importación JSON (version 1, capture alsea-starbucks-360); máximo 24 pantallas.
- La previsualización se inicia explícitamente; no se restaura sola. No envía órdenes a equipos.
- /gente y /personal controlan los actores simulados en Good/Better/Best. No retocan personas fotografiadas en la captura Matrix.
- Referencia: Yokup DCL-e9f021571cfbed9fbebd3d4e · captura pública /api/catalog y /img/starbucks-demo.webp.

## Altavoz / Speaker

Matrix · Starbucks Paseo de Gracia: pulsa el altavoz situado junto a la señal de salida para escuchar la playlist Starbucks Alsea. La primera pulsación inicia el audio; las siguientes alternan sonido y silencio sin pausar, reiniciar ni detener el cambio de canción. Experto → Altavoz lleva la cámara hasta él; Escuchar/Silenciar ofrece el mismo control. Al salir de Matrix se silencia la escucha local y la playlist sigue avanzando mientras la página esté abierta. Primera pieza de Stock: Bad Times Deep House (6:41), enlazada directamente. Las referencias publicadas se conservan aunque caduque la cola. Las piezas Suno encargadas a Morfeo siguen pendientes de entrega. Consulta nuevas piezas cada 30 segundos. Este control no cambia el volumen de las pantallas físicas.

Matrix · Starbucks Paseo de Gracia: click the speaker beside the exit sign to listen to the Starbucks Alsea playlist. The first click starts audio; subsequent clicks toggle sound and mute without pausing, restarting or stopping track changes. Expert → Speaker takes the camera there; Listen/Mute offers the same control. Leaving Matrix mutes local listening while the playlist keeps advancing as long as the page stays open. First Stock track: Bad Times Deep House (6:41), linked directly. Published references remain available after the delivery queue expires. The Suno tracks requested from Morfeo are still awaiting delivery. New tracks are checked every 30 seconds. This control does not change the volume of physical screens.

Canal: `starbucks-alsea-paseo-de-gracia` · `/hilomusical/next` en api.admira.store. La creación/publicación de las piezas se coordina en FLT-101276; implementación del altavoz: Yokup #178.


## Playlist Starbucks · PlayerTaza / Mug screen

PlayerTaza comparte la selección publicada del Starbucks. La taza debe mostrar el vídeo silenciado y el altavoz controla el audio. La integración de la taza y la sincronización entre dispositivos siguen pendientes.

PlayerTaza shares the published Starbucks selection. The mug should display muted video while the speaker controls audio. Mug integration and cross-device synchronization are still pending.

Playlist JSON: https://www.xpaceos.com/admira-xp/starbucks-playlist.json

Guía ES/EN / Integration guide: https://www.xpaceos.com/admira-xp/docs/starbucks-playlist.md


## Starbucks · admira.app → XpaceOS

En admira.app, busca «Starbucks Paseo de Gracia» y abre la ficha de Paseo de Gracia 103, Barcelona. Pulsa «Visita al Digital Twin» junto a «Tour DOOH» para entrar directamente al Starbucks de XpaceOS en Matrix. Tour DOOH conserva su recorrido por el mapa.

In admira.app, search for “Starbucks Paseo de Gracia” and open the profile at Paseo de Gracia 103, Barcelona. Click “Visit the Digital Twin” beside “Tour DOOH” to open the Starbucks in XpaceOS Matrix directly. Tour DOOH keeps its map tour.

Ficha / Profile: https://admira.app/?locationId=alsea-sbux-021&lang=es

Digital Twin: https://www.xpaceos.com/admira-xp/?autostart=xtanco&visual=matrix&loc=alsea-sbux-021

ID: alsea-sbux-021. Asociación curada por ID en xpace-link.js; xpaceUrl explícito del backoffice prevalece, incluido vacío. No se asigna a los demás Starbucks por nombre o circuito. Abrir la visita no publica contenido en players físicos.

Curated association by ID in xpace-link.js; an explicit backoffice xpaceUrl takes precedence, including an empty value. Other Starbucks locations are not matched by name or circuit. Visiting does not publish content to physical players.


## Starbucks · Seis pantallas / Six wall screens

Matrix · Starbucks: las seis pantallas grandes de la pared reproducen la playlist de vídeo de Stock 1311, «A Coffee Moment Worth Remembering» (10 s), en bucle y sin audio. Experto → 6 pantallas centra la cámara y añade los seis anclajes que falten, conservando los mapas guardados. Reproducir/Pausar pantallas controla el grupo; el hilo musical del altavoz es independiente. Editor de geometría permite recalibrar y guardar las esquinas. Los players son virtuales: sus IDs físicos siguen sin vincular.

Matrix · Starbucks: the six large wall screens play the Stock 1311 video playlist, “A Coffee Moment Worth Remembering” (10 s), looping without audio. Expert → 6 screens centers the camera and adds missing wall anchors while preserving saved maps. Play/Pause screens controls the group; the speaker music playlist is independent. Geometry editor allows corner recalibration and saving. These players are virtual; physical player IDs remain unbound.

Playlist: https://www.xpaceos.com/admira-xp/starbucks-screen-playlist.json
Mapa / Mapping: https://www.xpaceos.com/admira-xp/starbucks-wall-mapping.json
Stock: https://www.pixeria.com/stock.html?highlight=1790708784283-yvy7w9
Fuente / Source: https://www.youtube.com/shorts/nkhc9OnjbV8

Contrato para agentes: playlist independiente `starbucks-alsea-paseo-de-gracia-wall`, seis IDs virtuales `starbucks-wall-01` a `starbucks-wall-06`; `playerId` físico vacío. Cuatro anclajes yaw/pitch por pantalla, base de proyección vertical 360×640. Primera pantalla como reloj local, corrección de deriva cada 500 ms al superar 0,2 s; no sincroniza dispositivos físicos. La primera carga de vídeo puede tardar: el estado reproducido sólo se confirma tras arrancar todos los vídeos. Un fallo pausa el grupo y permite reintentar. Al cerrar Matrix se liberan vídeos/timers. Mapas existentes se conservan; «6 pantallas» añade únicamente los IDs ausentes (máximo total 24).

Agent contract: separate wall playlist, six stable virtual IDs, empty physical player IDs. Four yaw/pitch corners per screen; portrait projection base 360×640. The first screen supplies the local clock, correcting drift over 0.2 s every 500 ms; this does not synchronize physical devices. Initial loading can take time; playing status is confirmed after all videos start. Failures pause the group and allow retry. Closing Matrix releases videos/timers. Existing maps remain; “6 screens” only adds missing IDs (24 total maximum).

Fuente canónica / Canonical source: `admira-xp/scripts/starbucks-screens.mjs`. Regenerar ambos JSON con / Regenerate both JSON files with `node admira-xp/scripts/export-starbucks-screens.mjs`. Yokup #201.


## Starbucks · Sincro / Sync / sincrototal / synctotal

En Experto, el selector Vídeo ofrece Individual, Sincro (1–3 / 4 / 5–6) y Sincro total (1–6). /sincro o /sync reparte una imagen entre las pantallas 1–3, otra en la 4 y otra entre la 5–6; /sincrototal o /synctotal reparte una imagen entre las seis; /sincro off o /sync off restaura el vídeo completo en cada pantalla. Numeración desde la puerta de la calle: en la vista frontal, 6–5 | 4 | 3–2–1. Los comandos abren Matrix. Cambiar la distribución conserva el instante y el estado de reproducción/pausa; la selección se guarda en este navegador. Los conjuntos llenan su superficie mediante recorte centrado, sin deformar la imagen; los vídeos verticales pierden parte superior e inferior al extenderse. El hilo musical es independiente.

In Expert, the Video selector offers Individual, Sync (1–3 / 4 / 5–6) and Total sync (1–6). /sync or /sincro spans one image over screens 1–3, another on screen 4 and another over 5–6; /synctotal or /sincrototal spans one image over all six; /sync off or /sincro off restores the full video on each screen. Screens are numbered from the street entrance: the wall view reads 6–5 | 4 | 3–2–1 left to right. Commands open Matrix. Switching layouts preserves playback time and play/pause state; the selection is saved in this browser. Spans fill their surface using a centered crop without stretching; portrait videos lose top and bottom areas when spanning. Speaker music is independent.

Grupos por números visibles: [1,2,3] grupo 1, [4] sola, [5,6] grupo 2. IDs históricos equivalentes: [06,05,04], [03], [02,01]. Las franjas se dibujan de izquierda a derecha sin invertir la imagen. Cada pantalla es una franja de igual ancho de un lienzo virtual por grupo, sin compensación de los huecos físicos. Se conserva su homografía de cuatro esquinas. No cambia mapas personalizados ni URLs de preview; sólo afecta a los seis vídeos de la playlist de pared. Si faltan anclajes, usar «6 pantallas». Fuente: screen-display.mjs; preferencia xpaceos.starbucks.wall-display.v1. El contrato display se publica en starbucks-screen-playlist.json. No controla hardware ni sincroniza dispositivos reales. Yokup #209.

Visible-number groups: [1,2,3] group 1, [4] standalone, [5,6] group 2. Equivalent historical IDs: [06,05,04], [03], [02,01]. Slices are rendered left to right without mirroring the image. Each screen is an equal-width slice of its group's virtual canvas, without physical gap compensation. Four-corner homographies are preserved. Custom mappings and preview URLs remain unchanged; only the six wall-playlist videos are affected. Use “6 screens” to add missing anchors. Source: screen-display.mjs; preference xpaceos.starbucks.wall-display.v1. The display contract is published in starbucks-screen-playlist.json. No hardware control or synchronization across physical devices. Yokup #209.


## Starbucks · EXIT / Next track / Siguiente canción / PlayerTaza

En Matrix · Starbucks, pulsa la señal EXIT de la pared, junto al altavoz, para pasar a la siguiente canción. Experto → Altavoz lleva la cámara a ambos controles; también hay un botón Siguiente canción en Experto. El avance es circular y conserva sonido/mute. Si aún no había empezado, inicia la pista siguiente en silencio; el altavoz activa el sonido. Con una sola pista, EXIT vuelve al inicio de esa pista. No cambia la playlist de las seis pantallas. El estado local de la canción se publica para el puente de PlayerTaza; la recepción en la taza física aún no está verificada.

In Matrix · Starbucks, click the wall EXIT sign beside the speaker to skip to the next track. Expert → Speaker brings both controls into view; Expert also has a Next track button. The playlist wraps and preserves sound/mute. If playback has not started, it starts the next track silently; the speaker enables sound. With only one track, EXIT restarts that track. It does not change the six-screen video playlist. Local track state is published for the PlayerTaza bridge; reception on the physical mug has not been verified yet.

API local: window.XpaceStarbucksMusic.getState(), .subscribe(fn) (devuelve una función de baja), .next(). Evento window: xpaceos:starbucks-music, con el estado en event.detail. Campos: schemaVersion:1, store, tracks (cantidad), index (desde 0), title, url, position (segundos), playing, started, muted, loading, error, revision, reason, updatedAt (milisegundos Unix). revision sube al seleccionar/reiniciar; reason=next identifica EXIT. Eventos en cambios de estado y timeupdate, como máximo una actualización de reloj por segundo. Un cambio de fuente puede emitir playing=false mientras carga: no confundir selección con reproducción confirmada. API disponible al inicializar Matrix; una sola instancia de audio#starbucksMusic por página.

Local API: window.XpaceStarbucksMusic.getState(), .subscribe(fn) (returns an unsubscribe function), .next(). Window event: xpaceos:starbucks-music; state is in event.detail. Fields: schemaVersion:1, store, tracks (count), index (zero-based), title, url, position (seconds), playing, started, muted, loading, error, revision, reason, updatedAt (Unix milliseconds). revision increments on selection/restart; reason=next identifies EXIT. Events cover state changes and timeupdate, with clock updates at most once per second. A source change can emit playing=false while loading: selection is not confirmed playback. Available after Matrix initializes; one audio#starbucksMusic instance per page.

Alcance / Scope: API/evento sólo en la página XpaceOS; no es un relay entre equipos ni una confirmación USB/Bluetooth. Local XpaceOS page only; no cross-device relay or USB/Bluetooth acknowledgement. PlayerTaza necesita conectar su puente y verificar recepción física / must connect its bridge and verify physical reception. Catálogo verificado: una pista publicada y feed vacío al 29-09-2026; no se añadió música de prueba al catálogo / verified catalog: one published track and empty feed; no test music was added. Ancla EXIT yaw=-129.314172, pitch=7.892714. Yokup #213.


## Starbucks · Layout / layoiut · Números / Numbers

Escribe /layout para mostrar u ocultar los números encima de las seis pantallas de Matrix · Starbucks. /layout on los muestra; /layout off los oculta. /layoiut se acepta como alias. También hay un botón Layout · números en Experto. Se empieza a contar desde la puerta de la calle: el triplete es 1–3 (grupo 1), la pantalla aislada es 4 y la pareja es 5–6 (grupo 2). Mirando la pared de frente se ve 6–5 | 4 | 3–2–1. La sincronización usa esos grupos físicos. Las etiquetas siguen la cámara y no cambian el vídeo ni los mapas guardados. Se conservan en la sesión y se ocultan al recargar. /layout sin argumentos abre Matrix; los subcomandos de mobiliario /layout save, /layout factory y /layout xpacio load mantienen su función.

Type /layout to show or hide numbers above all six screens in Matrix · Starbucks. /layout on shows them; /layout off hides them. /layoiut is accepted as an alias. Expert also has a Layout · numbers button. Numbering starts at the street entrance: the triplet is 1–3 (group 1), the standalone screen is 4 and the pair is 5–6 (group 2). Facing the wall, the order is 6–5 | 4 | 3–2–1. Sync uses these physical groups. Labels follow the camera without changing playback or saved maps. Visibility lasts for the session and resets on reload. Bare /layout opens Matrix; furniture subcommands /layout save, /layout factory and /layout xpacio load retain their behavior.

IDs: starbucks-wall-01→6, -02→5, -03→4, -04→3, -05→2, -06→1. Son IDs de anclaje persistentes: no renombrarlos ni invertir sus esquinas. El número de pantalla es una etiqueta separada, definida por display.screenNumbersById en starbucks-screen-playlist.json. display.spatialOrder=[6,5,4,3,2,1] ordena las franjas sin espejo. Mapas previos se corrigen visualmente sin reescribir localStorage. Los números por defecto están ocultos; /layout es inspección local, no una orden de carga/reset del mobiliario.

IDs are persistent anchors: do not rename them or reverse their corners. Screen numbers are separate labels defined by display.screenNumbersById in starbucks-screen-playlist.json. display.spatialOrder=[6,5,4,3,2,1] orders slices without mirroring. Existing maps are visually corrected without rewriting localStorage. Numbers are hidden by default; bare /layout is local inspection, not a furniture load/reset. Sources: starbucks-screens.mjs and screen-display.mjs. Yokup #216.


## Starbucks · TPV / POS · Publicidad local / Local advertising

En Matrix · Starbucks, Experto → TPV / POS centra la cámara en la pantalla del terminal orientada al cliente. Reproduce la playlist de publicidad local: Stock 1329, «Good Energy with Adrian Grenier: Starbucks & The Devil Wears Prada 2» (30 s), en bucle y sin audio. Pausar/Reproducir TPV actúa solo sobre ese player. Las seis pantallas de pared, /sincro, /sincrototal y el hilo musical son independientes. /layout identifica el terminal como TPV, sin cambiar los números 1–6. Editor de geometría permite recalibrar y guardar las cuatro esquinas.

In Matrix · Starbucks, Expert → TPV / POS centers the camera on the customer-facing terminal screen. It plays the local advertising playlist: Stock 1329, “Good Energy with Adrian Grenier: Starbucks & The Devil Wears Prada 2” (30 s), looping without audio. Pause/Play POS affects only that player. The six wall screens, /sync, /synctotal and speaker music remain independent. /layout labels the terminal as TPV without changing numbers 1–6. Geometry editor allows recalibrating and saving its four corners.

Playlist JSON: https://www.xpaceos.com/admira-xp/starbucks-tpv-playlist.json

Mapping JSON: https://www.xpaceos.com/admira-xp/starbucks-tpv-mapping.json

Contrato / Contract: `starbucks-alsea-paseo-de-gracia-tpv`; virtual ID `starbucks-tpv-01`; physical `playerId` is empty. Source: https://www.youtube.com/shorts/vtOoHibZTug. Stock 1329 / `1790711463701-yxy150`. Video: https://stock.admira.store/stock/1790711463701-yxy150/asset.mp4.

ES: Solo el terminal vertical de la foto, no los terminales pequeños de caja. Homografía de cuatro esquinas yaw/pitch y base 360×640. Se añade el anclaje TPV ausente en memoria al entrar en Matrix (máximo 24); no reescribe localStorage ni las esquinas/URLs personalizadas existentes. Guardar mapa persiste el resultado. Si se elimina durante la sesión, el botón TPV / POS lo recupera; al volver a entrar se añade otra vez. Si el mapa está lleno, libera un anclaje antes de añadirlo. Un mapa importado se respeta tal cual: TPV / POS permite añadir el anclaje que falte. Si cambias su URL, usa Abrir vista previa; el control de playlist sólo reproduce la URL del catálogo TPV. Un fallo de vídeo permite reintentar y no pausa la pared. Al salir de Matrix se libera este vídeo y su controlador. No publica contenido en el TPV físico.

EN: Only the portrait terminal in the reference photo, not the small cashier terminals. Four yaw/pitch corners and a 360×640 projection base. A missing POS anchor is added in memory when entering Matrix (24 maximum); saved localStorage and existing custom corners/URLs are not rewritten. Save map persists the result. If removed during the session, TPV / POS restores it; re-entering adds it again. If the map is full, remove an anchor first. Imported maps are kept as supplied: TPV / POS adds the missing anchor. If you change its URL, use Open preview; playlist controls only play the POS catalog URL. Video failures allow retry without pausing the wall. Leaving Matrix releases its video and controller. No content is published to the physical POS device.

Fuente canónica / Canonical source: `admira-xp/scripts/starbucks-tpv.mjs`. Regenerar contratos / Regenerate contracts: `node admira-xp/scripts/export-starbucks-tpv.mjs`. Controlador separado / Separate controller: `createScreenPlaylist` with one muted video; it loops the playlist on `ended`. No wall synchronization or music transport coupling. Yokup #220.


## Matrix MCP · Shared playlists / Playlists compartidas

Las pantallas de Matrix · Starbucks y el TPV llevan marco negro, incluido el halo de la captura. Los agentes gestionan sus contenidos desde el MCP de XpaceOS: matrix_state consulta las cuatro playlists (wall, tpv, ipad, music); matrix_playlist_update añade, quita, ordena o vacía contenido; matrix_configure controla reproducción de pared/TPV, sincro, etiquetas y silencio; matrix_music_next avanza la música. Matrix consulta cambios cada 5 segundos mientras está abierto. Las escrituras exigen clave de flota y expected_revision; quedan firmadas por el agente. El estado compartido conserva la última versión si se pierde la conexión.

Matrix · Starbucks screens and POS use black frames, covering the captured blue halo. Agents manage content through XpaceOS MCP: matrix_state reads the four playlists (wall, tpv, ipad, music); matrix_playlist_update adds, removes, reorders or clears content; matrix_configure controls wall/POS playback, sync, labels and mute; matrix_music_next advances music. Open Matrix pages poll every 5 seconds. Writes require a fleet key and expected_revision and are signed by the agent. The last state is retained if the connection fails.

ES: Estos controles operan los players virtuales de Matrix. El audio se activa con una pulsación local. Los controles locales siguen disponibles; un nuevo cambio remoto del mismo control prevalece. reset:true libera los controles compartidos y conserva la elección local actual. Para comunicación y encargos entre agentes se utiliza el MCP de Admira.live (agora_decir, agente_encargar, encargo_estado); no se ha enviado ningún encargo de prueba. Añadir funciones nuevas requiere implementación y despliegue: matrix_configure sólo admite las funciones enumeradas, no código arbitrario. El mapeo de esquinas continúa en Editor de geometría y no hay confirmación de recepción en hardware.

EN: Controls operate virtual Matrix players. Sound activation requires a local click. Local controls remain available; a new remote change to the same control takes precedence. reset:true releases shared controls while retaining the current local choice. Agent communication and assignments use the Admira.live MCP (agora_decir, agente_encargar, encargo_estado); no test assignment was sent. New capabilities require implementation and deployment: matrix_configure accepts only the listed controls, not arbitrary code. Corner mapping remains in Geometry editor; no hardware receipt is implied.

Guide: https://www.xpaceos.com/admira-xp/docs/matrix-mcp.md

## Aviso de cierre / Closing announcement

El altavoz negro junto a la escalera reproduce el aviso: «Hoy por motivos de fiesta local, nuestro horario de cierre es a las 22 horas. Gracias.». Primera voz gratuita: Mónica de macOS. La música continúa avanzando con volumen cero durante el aviso y recupera su volumen y estado de silencio al terminar, cancelar o fallar. Una segunda pulsación detiene el aviso. En Control Xtore, /sin autocompleta /sincro on o /sincro off según el estado contrario al actual; Enter ejecuta y Tab acepta. El texto sugerido se puede editar. Los paneles inferiores ocultan las barras de scroll y conservan desplazamiento y tiradores de tamaño.

The black speaker beside the staircase plays the Spanish closing announcement: “Hoy por motivos de fiesta local, nuestro horario de cierre es a las 22 horas. Gracias.” Initial free voice: macOS Mónica. Music keeps advancing at zero volume during the announcement; its volume and mute state are restored on completion, cancellation or failure. Click again to stop. In Control Xtore, /sin completes /sincro on or /sincro off, targeting the opposite current state; Enter runs it and Tab accepts. Suggested text remains editable. Bottom panels hide scrollbars while preserving scrolling and resize handles.

matrix_announcement {expected_revision:N} increments announcementNext. Read matrix_state first. Authenticated fleet key required. Open Matrix pages apply new events once; newly opened pages do not replay old announcements. Browser audio permission is required: if blocked, click the speaker locally. Saved is not playback acknowledgement. The music playlist is unchanged.

[Guide](https://www.xpaceos.com/admira-xp/docs/starbucks-announcement.md)

## Starbucks · Entrada directa Matrix / Direct Matrix entry · Abrir incidencia / Open incident

ES: La ficha Starbucks Paseo de Gracia 103 de admira.app conserva el botón Visita al Digital Twin. La ubicación alsea-sbux-021 abre Matrix por defecto aunque el navegador recuerde Good, Better o Best. Un parámetro visual explícito sigue permitiendo elegir otra vista. Enlace estable: https://www.xpaceos.com/admira-xp/?autostart=xtanco&visual=matrix&loc=alsea-sbux-021.

EN: The Starbucks Paseo de Gracia 103 profile in admira.app keeps Visit the Digital Twin. Location alsea-sbux-021 defaults to Matrix even when the browser remembers Good, Better or Best. An explicit visual parameter can still select another view. Stable URL: https://www.xpaceos.com/admira-xp/?autostart=xtanco&visual=matrix&loc=alsea-sbux-021.

ES: La entrada muestra un fondo neutro hasta que el panorama está listo. No muestra antes el arcade, Xpace Invaders, su vídeo de precarga ni la transición desde Good. No descarga precarga_xpace.mp4 para esta entrada y evita dibujar la escena 2D oculta mientras Matrix está abierto; la simulación y los controles siguen activos. Si falla el panorama o tarda más de 25 segundos, ofrece Reintentar Matrix sin mostrar otra vista. Una carga lenta que finalmente termina puede abrir Matrix normalmente.

EN: Entry shows a neutral background until the panorama is ready. It does not show the arcade, Xpace Invaders, its preload video or the transition from Good first. This entry does not download precarga_xpace.mp4 and skips drawing the hidden 2D scene while Matrix is open; simulation and controls remain active. If panorama loading fails or exceeds 25 seconds, Retry Matrix appears without revealing another view. A slow load that later succeeds can still open Matrix normally.

ES: El botón Mapear players pasa a Abrir incidencia. Abre el formulario manual existente: seleccionar equipo, describir problema y elegir gravedad. Pulsar el botón no envía una incidencia; enviarla desde el formulario sí crea el ticket de Yokup. Asignar contenidos conserva su función independiente de seleccionar pantallas y playlists.

EN: Map players is now Open incident. It opens the existing manual form: select a device, describe the issue and choose severity. Opening the form does not submit an incident; submitting creates the Yokup ticket. Assign content remains the separate entry for selecting screens and playlists.

MCP: incident_open retains its existing authenticated contract and creates a real manual Yokup incident. The UI label change does not create a new tool or alter IDs, resource isolation, severity or delivery acknowledgement. Agents should link the stable Starbucks URL above when opening this location. matrix_state, matrix_device_layout, matrix_preview and playlist tools retain their contracts. Guide: https://www.xpaceos.com/admira-xp/docs/matrix-entry.md. Endpoint: https://mcp.admira.store/mcp.
