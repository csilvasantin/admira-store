# Programa vigente / Current program · FLT-101280 / FLT-101281

Demo Starbucks: fuera de /layout, pulsa la pantalla 1 para Desenchufar/Enchufar; queda negra y se abre una incidencia real en Yokup, que se resuelve al enchufar. Abrir incidencia muestra los nombres y el formulario manual de incidencias: equipo, problema y gravedad (alta por defecto). Cada ticket manual tiene un recurso único; un fallo conserva el texto para reintentar. Editor de geometría conserva el editor de esquinas. Hilo musical: Stock 1308 → 1309, EXIT avanza conservando mute. Pared normal: 1310, 1312, 1314; /navidad activa 1313, /navidad off vuelve a la programación normal. TPV: 1315 → 1317. /sincro IA usa P1=1316, P2=1318, P3=1319, P4=1320, P5=1321, P6=1322, con carga coordinada, reloj local común, bucle y vídeo silenciado. /sincro off sale de IA. Son controles de la demo virtual, no de la alimentación física.

Starbucks demo: outside /layout, click screen 1 for Unplug/Plug in; it turns black and opens a real Yokup incident, resolved when plugged back in. Open incident shows device names and the manual incident form: device, problem and severity (high by default). Each manual ticket has a unique resource; failures preserve the text for retry. Geometry editor retains the corner editor. Music: Stock 1308 → 1309; EXIT advances while preserving mute. Normal wall: 1310, 1312, 1314; /christmas activates 1313 and /christmas off returns to normal. POS: 1315 → 1317. /sync AI uses P1=1316, P2=1318, P3=1319, P4=1320, P5=1321, P6=1322 with a load barrier, shared local clock, looping and muted video. /sync off exits AI. These are virtual demo controls, not physical power switching.

[Contrato vigente / Current contract](https://www.xpaceos.com/admira-xp/docs/starbucks-operations.md)

---

# Starbucks Alsea · hiloMusical · PlayerTaza

## Español

Contrato compartido para Trinity y los agentes de XpaceOS. Canal/playlist: `starbucks-alsea-paseo-de-gracia`.

- [Playlist JSON pública](https://www.xpaceos.com/admira-xp/starbucks-playlist.json): selección publicada persistente, versión de esquema 1; `tracks` contiene `stockId`, `title`, `url`, `duration` (segundos) y `mimeType`.
- Primera pieza: **Bad Times Deep House**, Stock **1308**, ID `1790706121644-y5mqrq`, duración **400.962177 s**. [MP4 directo](https://stock.admira.store/stock/1790706121644-y5mqrq/asset.mp4?v=35775129), vídeo H264 con audio AAC. Carlos aportó esta pieza; no se atribuye a Suno.
- [Abrir Starbucks Matrix](https://www.xpaceos.com/admira-xp/?autostart=xtanco&visual=matrix). Experto → Altavoz lleva la cámara al control del hilo musical.

Para pintar la pieza en la taza con pantalla, consumir el JSON y usar `tracks[index].url` como fuente de vídeo con `muted` y `playsinline`. El altavoz de XpaceOS es el único dueño del audio local: primera pulsación inicia; siguientes alternan mute sin pausar ni reiniciar. Una selección disponible no significa que ya esté sonando: el navegador necesita la primera interacción. La playlist recorre las pistas en orden y vuelve al principio; con una pieza repite esa pieza.

**Estado de integración:** el manifiesto comparte contenido, no un reloj de reproducción. PlayerTaza todavía debe implementar y verificar su integración. En la misma página, el transporte existente es el elemento `audio#starbucksMusic`: la integración local puede seguir `currentSrc` y `currentTime`, sin modificar su mute ni crear otro audio audible. No se publica todavía una API de sincronización entre pestañas, navegadores, dispositivos o players físicos; no inventar IDs de player o afirmar conexión a Admira.tv por tener la URL.

La consulta adicional `https://api.admira.store/hilomusical/next?store=starbucks-alsea-paseo-de-gracia&since=0` es una cola temporal (24 h), consultada cada 30 s mientras Matrix está abierto. Puede aportar pistas aún no consolidadas en el manifiesto. No usarla como catálogo permanente ni reenviar esta pieza a `/hilomusical/push`: esa ruta vuelve a publicar en Stock. Para añadir piezas definitivas, actualizar `scripts/starbucks-playlist.mjs`, ejecutar `node admira-xp/scripts/export-starbucks-playlist.mjs` desde la raíz y publicar ambos archivos. El test comprueba que altavoz y JSON coincidan.

Las tres piezas instrumentales sin letra solicitadas a Morfeo siguen pendientes de entrega (FLT-101276). Altavoz y primera pieza: Yokup #178. Contrato/documentación para Trinity: Yokup #190. Actualizado: 29 septiembre 2026.

## English

Shared contract for Trinity and XpaceOS agents. Store/playlist ID: `starbucks-alsea-paseo-de-gracia`. Use the [public JSON playlist](https://www.xpaceos.com/admira-xp/starbucks-playlist.json), schema version 1. Each `tracks` entry provides `stockId`, `title`, `url`, `duration` in seconds and `mimeType`. The first published track is **Bad Times Deep House**, Stock **1308**, **400.962177 s**, MP4 with H264 video and AAC audio. Carlos supplied this track; it is not attributed to Suno.

The mug screen should use the track URL as a muted, inline video. The XpaceOS speaker owns local audio: the first click starts playback; later clicks toggle mute without pausing or resetting. Playback advances sequentially and repeats the playlist. Availability does not imply playback has started: a user gesture is required.

The manifest shares content, not a playback clock. PlayerTaza integration still needs implementation and verification. Within the same page, the existing transport is `audio#starbucksMusic`; local integration can follow its `currentSrc` and `currentTime` without changing its mute state or creating a second audible source. Cross-tab, cross-browser, cross-device and physical-player synchronization are not implemented. A media URL does not establish an Admira.tv player connection.

The `/hilomusical/next` store feed is a temporary 24-hour delivery queue, checked every 30 seconds while Matrix is open. It can contain additions not yet saved in the manifest. Do not treat it as a permanent catalog or push this existing asset again: `/hilomusical/push` republishes to Stock. Maintain the source module and regenerate the public JSON using the command above. Morfeo's three instrumental Suno tracks remain pending under FLT-101276. Speaker/first track: Yokup #178; this handoff: Yokup #190.


## Starbucks · EXIT / Next track / Siguiente canción / PlayerTaza

En Matrix · Starbucks, pulsa la señal EXIT de la pared, junto al altavoz, para pasar a la siguiente canción. Experto → Altavoz lleva la cámara a ambos controles; también hay un botón Siguiente canción en Experto. El avance es circular y conserva sonido/mute. Si aún no había empezado, inicia la pista siguiente en silencio; el altavoz activa el sonido. Con una sola pista, EXIT vuelve al inicio de esa pista. No cambia la playlist de las seis pantallas. El estado local de la canción se publica para el puente de PlayerTaza; la recepción en la taza física aún no está verificada.

In Matrix · Starbucks, click the wall EXIT sign beside the speaker to skip to the next track. Expert → Speaker brings both controls into view; Expert also has a Next track button. The playlist wraps and preserves sound/mute. If playback has not started, it starts the next track silently; the speaker enables sound. With only one track, EXIT restarts that track. It does not change the six-screen video playlist. Local track state is published for the PlayerTaza bridge; reception on the physical mug has not been verified yet.

API local: window.XpaceStarbucksMusic.getState(), .subscribe(fn) (devuelve una función de baja), .next(). Evento window: xpaceos:starbucks-music, con el estado en event.detail. Campos: schemaVersion:1, store, tracks (cantidad), index (desde 0), title, url, position (segundos), playing, started, muted, loading, error, revision, reason, updatedAt (milisegundos Unix). revision sube al seleccionar/reiniciar; reason=next identifica EXIT. Eventos en cambios de estado y timeupdate, como máximo una actualización de reloj por segundo. Un cambio de fuente puede emitir playing=false mientras carga: no confundir selección con reproducción confirmada. API disponible al inicializar Matrix; una sola instancia de audio#starbucksMusic por página.

Local API: window.XpaceStarbucksMusic.getState(), .subscribe(fn) (returns an unsubscribe function), .next(). Window event: xpaceos:starbucks-music; state is in event.detail. Fields: schemaVersion:1, store, tracks (count), index (zero-based), title, url, position (seconds), playing, started, muted, loading, error, revision, reason, updatedAt (Unix milliseconds). revision increments on selection/restart; reason=next identifies EXIT. Events cover state changes and timeupdate, with clock updates at most once per second. A source change can emit playing=false while loading: selection is not confirmed playback. Available after Matrix initializes; one audio#starbucksMusic instance per page.

Alcance / Scope: API/evento sólo en la página XpaceOS; no es un relay entre equipos ni una confirmación USB/Bluetooth. Local XpaceOS page only; no cross-device relay or USB/Bluetooth acknowledgement. PlayerTaza necesita conectar su puente y verificar recepción física / must connect its bridge and verify physical reception. Catálogo verificado: una pista publicada y feed vacío al 29-09-2026; no se añadió música de prueba al catálogo / verified catalog: one published track and empty feed; no test music was added. Ancla EXIT yaw=-129.314172, pitch=7.892714. Yokup #213.


## Gestión compartida / Shared management

MCP `matrix_state` y `matrix_playlist_update` gestionan esta playlist. El JSON estático es la semilla; al gestionar el canal vía MCP prevalece el estado compartido / Static JSON is bootstrap; after managing the channel via MCP the shared state takes precedence. Guía / Guide: https://www.xpaceos.com/admira-xp/docs/matrix-mcp.md

## Aviso de cierre / Closing announcement

El altavoz negro junto a la escalera reproduce el aviso: «Hoy por motivos de fiesta local, nuestro horario de cierre es a las 22 horas. Gracias.». Primera voz gratuita: Mónica de macOS. La música continúa avanzando con volumen cero durante el aviso y recupera su volumen y estado de silencio al terminar, cancelar o fallar. Una segunda pulsación detiene el aviso. En Control Xtore, /sin autocompleta /sincro on o /sincro off según el estado contrario al actual; Enter ejecuta y Tab acepta. El texto sugerido se puede editar. Los paneles inferiores ocultan las barras de scroll y conservan desplazamiento y tiradores de tamaño.

The black speaker beside the staircase plays the Spanish closing announcement: “Hoy por motivos de fiesta local, nuestro horario de cierre es a las 22 horas. Gracias.” Initial free voice: macOS Mónica. Music keeps advancing at zero volume during the announcement; its volume and mute state are restored on completion, cancellation or failure. Click again to stop. In Control Xtore, /sin completes /sincro on or /sincro off, targeting the opposite current state; Enter runs it and Tab accepts. Suggested text remains editable. Bottom panels hide scrollbars while preserving scrolling and resize handles.

matrix_announcement {expected_revision:N} increments announcementNext. Read matrix_state first. Authenticated fleet key required. Open Matrix pages apply new events once; newly opened pages do not replay old announcements. Browser audio permission is required: if blocked, click the speaker locally. Saved is not playback acknowledgement. The music playlist is unchanged.

[Guide](https://www.xpaceos.com/admira-xp/docs/starbucks-announcement.md)
