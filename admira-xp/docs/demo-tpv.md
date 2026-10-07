# /demo tpv · Demostración guiada / Guided demo

## Uso / Usage

ES: En Experto, /demo muestra la ayuda y /demo tpv abre Matrix Starbucks Alsea e inicia una demostración guiada: acerca la cámara a los muffins, marca la silueta de uno, lo recoge, lo lleva a la caja junto al osito y añade una unidad a la cesta existente. La canción y su disparador se eligen con /ifthendothat; por defecto, al coger el muffin suena Bad Times Deep House, Stock 1308. Experto se oculta para ver el recorrido; puedes volver a abrirlo con ⌘. Detener demo, Escape o /demo off cancelan el recorrido y paran su canción; /demo estado consulta la fase. Una segunda orden no inicia otra demo mientras hay una en curso. Cancelar antes de la caja no añade productos; detener después conserva el muffin añadido. La canción usa un reproductor local y baja temporalmente el hilo musical, que recupera su volumen al parar o terminar; conserva su playlist y pista. Repetir una demo completa añade otro muffin. Un bloqueo de audio muestra error para reintentar. /layout, la edición de geometría o un TPV apagado impiden la demo. Son acciones del gemelo, sin cobro ni conexión física; no se envían a Telegram ni escriben el estado compartido MCP. Bad Day no aparece en el catálogo consultado; esta versión usa la pista disponible Bad Times Deep House.

EN: In Expert, /demo shows help and /demo tpv opens Starbucks Alsea Matrix and starts a guided demo: the camera moves towards the muffins, outlines one, picks it up, carries it to the register beside the teddy bear and adds one unit to the existing basket. The song and its trigger are editable with /ifthendothat; by default, pickup plays Bad Times Deep House, Stock 1308. Expert hides so you can watch; reopen it with ⌘. Stop demo, Escape or /demo off cancels the journey and stops its song; /demo status reports the phase. A second command cannot overlap a running demo. Cancelling before the register adds no products; stopping afterwards retains the added muffin. The song uses a local player and temporarily lowers background music, which recovers its volume when stopped or finished; its playlist and current track are retained. Repeating a completed demo adds another muffin. Blocked audio reports an error so you can retry. /layout, geometry editing or a powered-off POS prevent the demo. These are digital twin actions with no payment or physical connection; they are not sent to Telegram and do not write shared MCP state. Bad Day was absent from the checked catalog; this version uses the available Bad Times Deep House track.

[Starbucks TPV](https://www.admira.store/admira-xp/?quality=matrix&loc=alsea-sbux-021&project=starbucks&circuit=alsea_starbucks&lang=es#tpv)

## Contrato / Contract

- Orden local / Local command: `/demo` ayuda/help; `/demo tpv` inicio/start; `/demo off` o/or `/demo tpv off` detiene/stops; `/demo estado` o/or `/demo status` consulta/status.
- API: `window.XpacePOSExperience.demo.start()`, `.stop()`, `.state()`; estado/state: `phase`, `running`, `song`, `error`.
- Motor / Engine: `scripts/pos-demo.mjs`; presentación / presentation: `scripts/matrix-pos-experience.mjs`; audio / sound: `scripts/pos-demo-sound.mjs`.
- Secuencia / Sequence: focus → outline → pick → travel → drop → checkout → completed. Cancelación limpia y sin solapamiento / Clean cancellation, no overlapping runs.
- Cesta existente / Existing basket: `alsea-sbux-021` / `starbucks-tpv-01` / `muffin`; usa el mismo receptor `addProduct` y evento `xpace:pos-basket` que el arrastre manual / same receiver and event as manual dragging.
- Audio: `#starbucksPOSDemoSong`, Stock 1308 · Bad Times Deep House; fuente/source `https://stock.admira.store/stock/1790706121644-y5mqrq/asset.mp4?v=35775129`. Se prepara silenciado; la regla decide cuándo suena / Primed muted; the rule determines when it plays. El audio anterior conserva posición y playlist / Existing audio retains position and playlist.
- UI: silueta SVG sobre cuatro esquinas del muffin; miniatura fotografiada sigue el plano / SVG outline on the muffin's four corners; photographed thumbnail follows the camera. La cámara sigue el camino angular más corto / Camera takes the shortest angular path.
- Límites / Limits: cesta de pestaña, hasta 99 unidades por producto, sin precios/pago/stock; sin órdenes a hardware ni escrituras MCP / tab basket, 99 units per product, no prices/payment/inventory, hardware commands or MCP writes.

## Estado verificado y dependencias / Verified state and dependencies

ES: Verificada localmente desde el CLI real de Experto: foco, silueta, recogida, llegada, incremento de cesta, canción desilenciada, detener y Escape. La demostración usa Bad Times Deep House como pista provisional disponible. Pendiente sustituirla por Bad Day si Carlos aporta su referencia, y conectar TPV físico; las reglas muffin → canción ya son editables con /ifthendothat. El navegador puede bloquear el audio; se informa sin anunciar reproducción inexistente.

EN: Locally verified through the actual Expert CLI: focus, outline, pickup, arrival, basket increment, unmuted song, stop and Escape. The demo uses the available Bad Times Deep House as a provisional track. Pending replacement with Bad Day if Carlos supplies a reference, physical POS integration; muffin → song rules are already editable with /ifthendothat. Browsers may block audio; failures are shown without claiming playback.

[Reglas visuales / Visual rules](ifthendothat.md)


ES: /ifthendothat ahora permite música, locución, imagen o vídeo con filtro Pixeria editable. Matrix es la calidad inicial. /marca starbucks combina imagotipo y texto blanco STARBUCKS.

EN: /ifthendothat now supports music, voiceover, image or video with an editable Pixeria filter. Matrix is the entry quality. /brand starbucks combines the imago and white STARBUCKS wordmark.
