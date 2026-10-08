# Programa vigente / Current program · FLT-101280 / FLT-101281

Demo Starbucks: fuera de /layout, pulsa la pantalla 1 para Desenchufar/Enchufar; queda negra y se abre una incidencia real en Yokup, que se resuelve al enchufar. Abrir incidencia muestra los nombres y el formulario manual de incidencias: equipo, problema y gravedad (alta por defecto). Cada ticket manual tiene un recurso único; un fallo conserva el texto para reintentar. Editor de geometría conserva el editor de esquinas. Hilo musical: Stock 1308 → 1309, EXIT avanza conservando mute. Pared normal: 1310, 1312, 1314; /navidad activa 1313, /navidad off vuelve a la programación normal. TPV: 1315 → 1317. /sincro IA usa P1=1316, P2=1318, P3=1319, P4=1320, P5=1321, P6=1322, con carga coordinada, reloj local común, bucle y vídeo silenciado. /sincro off sale de IA. Son controles de la demo virtual, no de la alimentación física.

Starbucks demo: outside /layout, click screen 1 for Unplug/Plug in; it turns black and opens a real Yokup incident, resolved when plugged back in. Open incident shows device names and the manual incident form: device, problem and severity (high by default). Each manual ticket has a unique resource; failures preserve the text for retry. Geometry editor retains the corner editor. Music: Stock 1308 → 1309; EXIT advances while preserving mute. Normal wall: 1310, 1312, 1314; /christmas activates 1313 and /christmas off returns to normal. POS: 1315 → 1317. /sync AI uses P1=1316, P2=1318, P3=1319, P4=1320, P5=1321, P6=1322 with a load barrier, shared local clock, looping and muted video. /sync off exits AI. These are virtual demo controls, not physical power switching.

[Contrato vigente / Current contract](https://www.xpaceos.com/admira-xp/docs/starbucks-operations.md)

---

# Starbucks · TPV / POS · Publicidad local / Local advertising

En Matrix · Starbucks, Experto → TPV / POS encuadra la vitrina y la caja para arrastrar el muffin. Reproduce la playlist de publicidad local: Stock 1329, «Good Energy with Adrian Grenier: Starbucks & The Devil Wears Prada 2» (30 s), en bucle y sin audio. Pausar/Reproducir TPV actúa solo sobre ese player. Las seis pantallas de pared, /sincro, /sincrototal y el hilo musical son independientes. /layout identifica el terminal como TPV, sin cambiar los números 1–6. Editor de geometría permite recalibrar y guardar las cuatro esquinas.

In Matrix · Starbucks, Expert → TPV / POS frames the display case and register for dragging the muffin. It plays the local advertising playlist: Stock 1329, “Good Energy with Adrian Grenier: Starbucks & The Devil Wears Prada 2” (30 s), looping without audio. Pause/Play POS affects only that player. The six wall screens, /sync, /synctotal and speaker music remain independent. /layout labels the terminal as TPV without changing numbers 1–6. Geometry editor allows recalibrating and saving its four corners.

Playlist JSON: https://www.xpaceos.com/admira-xp/starbucks-tpv-playlist.json

Mapping JSON: https://www.xpaceos.com/admira-xp/starbucks-tpv-mapping.json

Contrato / Contract: `starbucks-alsea-paseo-de-gracia-tpv`; virtual ID `starbucks-tpv-01`; physical `playerId` is empty. Source: https://www.youtube.com/shorts/vtOoHibZTug. Stock 1329 / `1790711463701-yxy150`. Video: https://stock.admira.store/stock/1790711463701-yxy150/asset.mp4.

ES: Solo el terminal vertical de la foto, no los terminales pequeños de caja. Homografía de cuatro esquinas yaw/pitch y base 360×640. Se añade el anclaje TPV ausente en memoria al entrar en Matrix (máximo 24); no reescribe localStorage ni las esquinas/URLs personalizadas existentes. Guardar mapa persiste el resultado. Si se elimina durante la sesión, el botón TPV / POS lo recupera; al volver a entrar se añade otra vez. Si el mapa está lleno, libera un anclaje antes de añadirlo. Un mapa importado se respeta tal cual: TPV / POS permite añadir el anclaje que falte. Si cambias su URL, usa Abrir vista previa; el control de playlist sólo reproduce la URL del catálogo TPV. Un fallo de vídeo permite reintentar y no pausa la pared. Al salir de Matrix se libera este vídeo y su controlador. No publica contenido en el TPV físico.

EN: Only the portrait terminal in the reference photo, not the small cashier terminals. Four yaw/pitch corners and a 360×640 projection base. A missing POS anchor is added in memory when entering Matrix (24 maximum); saved localStorage and existing custom corners/URLs are not rewritten. Save map persists the result. If removed during the session, TPV / POS restores it; re-entering adds it again. If the map is full, remove an anchor first. Imported maps are kept as supplied: TPV / POS adds the missing anchor. If you change its URL, use Open preview; playlist controls only play the POS catalog URL. Video failures allow retry without pausing the wall. Leaving Matrix releases its video and controller. No content is published to the physical POS device.

Fuente canónica / Canonical source: `admira-xp/scripts/starbucks-tpv.mjs`. Regenerar contratos / Regenerate contracts: `node admira-xp/scripts/export-starbucks-tpv.mjs`. Controlador separado / Separate controller: `createScreenPlaylist` with one muted video; it loops the playlist on `ended`. No wall synchronization or music transport coupling. Yokup #220.


## Gestión compartida / Shared management

MCP `matrix_state` y `matrix_playlist_update` gestionan esta playlist. El JSON estático es la semilla; al gestionar el canal vía MCP prevalece el estado compartido / Static JSON is bootstrap; after managing the channel via MCP the shared state takes precedence. Guía / Guide: https://www.xpaceos.com/admira-xp/docs/matrix-mcp.md

## Experiencia de cesta / Basket experience

[Muffin a la caja / Muffin to the register](https://www.admira.store/admira-xp/docs/pos-muffin.md) · cesta local y sugerencia explícita de café / local basket and explicit coffee suggestion.


## Agua / Water

ES: El TPV incorpora ahora botellas de agua del botellero ITIL, 13 → 12 y oferta del 10 % en pared e iPad. [Guía agua](pos-water.md).

EN: The POS now accepts water bottles from the ITIL rack, 13 → 12 and a 10% offer on wall screens and iPad. [Water guide](pos-water.md).
