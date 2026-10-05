# Vídeo y archivo Stock / Video and Stock archive

## Español

Experto → Crear contenidos → Crear vídeo: escribe en Qué quieres anunciar (hasta 1500 caracteres) y pulsa Generar vídeo (Grok). Se crea un vídeo de 8 segundos, 16:9 y 720p, con el idioma ESP/ENG seleccionado. El estado muestra generación y guardado; al terminar aparece el reproductor y Ver en Stock. Imágenes, vídeos y locuciones ElevenLabs se archivan automáticamente en Stock con ID, número de catálogo, hash y URL estable. Una locución se genera una vez y se reproduce tres veces. La sesión Admira existente sirve para las tres funciones, sin otra contraseña. Reintentar recupera el mismo trabajo; el servidor puede terminar el guardado aunque cierres la página. Un nuevo trabajo consume otra generación de pago. Publicar en Stock sigue sus contratos y distribución existentes; este botón no crea una campaña ni conecta equipos físicos.

1. Abre Opciones → Vídeo.
2. Describe el anuncio y pulsa Generar vídeo (Grok).
3. Espera a Vídeo guardado en Stock y usa el reproductor o Ver en Stock.
4. Tras una interrupción, vuelve a abrir el panel o reintenta con el mismo texto para recuperar el trabajo.

## English

Expert → Create media → Create video: enter What do you want to advertise? (up to 1500 characters), then press Generate video (Grok). It creates an 8-second, 16:9, 720p video in the selected ESP/ENG language. Status shows generation and saving; once complete, the player and Open in Stock appear. Images, videos and ElevenLabs announcements are automatically archived in Stock with an ID, catalog number, hash and stable URL. Each announcement is generated once and played three times. The existing Admira session covers all three functions, without another password. Retrying recovers the same operation; the server can finish archiving after you close the page. A new operation consumes another paid generation. Stock publication follows its existing contracts and distribution; this button does not create a campaign or connect physical devices.

1. Open Options → Video.
2. Describe the advertisement and press Generate video (Grok).
3. Wait for Video saved to Stock, then use the player or Open in Stock.
4. After an interruption, reopen the panel or retry the same brief to recover the job.

## Contrato compartido / Shared contract

Same-origin authenticated POST /admira-xp/advertising-image, /admira-xp/advertising-video and /admira-xp/announcement-tts accept {text,language,requestId}; audio additionally requires voice (male/female). requestId is a client UUID, scoped by a server-derived identity hash. GET /admira-xp/media-job?requestId=<UUID> recovers only that identity’s job and never starts paid generation. State: generating → pending (video only) → archiving → done, or failed. done requires Stock receipt {id,num,url,contentHash,mime}; video adds duration:8, aspect:16:9, resolution:720p. Image/audio are hashed before Stock publication; video uses deterministic internal ingest identity and actual Stock hash. The private AnnouncementTts entrypoint reuses existing providers, secrets, STOCK_BUCKET and Stock publish pipeline. Provider IDs and keys are not exposed. Conditional R2 leases prevent concurrent duplicate provider starts; durable job and pending records precede provider admission. No automatic provider restart after an ambiguous outcome. Archival failures retain generated output and retry only Stock. Existing */2 cron completes pending video/archival work after browser closure. Video provider output must use HTTPS x.ai. Tags: xpaceos, admira-xp, creatividad/locucion, es/en. Stock receipts expose https://api.admira.store/stock/asset/<id>; gallery uses https://www.pixeria.com/stock.html?highlight=<id>. These shared/public Stock assets are not private per-user media. Cancel/Stop stops local announcement playback; an accepted paid operation may finish in Stock. Original PA voice IDs, 44.1 kHz/192 kbps, three readings, ducking, counter image preview (30 s), video playback controls, CLI and /marca retained. Browser/free speech is local and does not produce an audio file to archive. First Google sign-in remains necessary where no session exists. xpaceos.com GoDaddy DNS migration remains pending; current interactive entry reaches admira.store.

Source: admira-xp/scripts/media-stock.js, video-prompt.js and pixer-worker/src/xpace-media.mjs. Existing private service binding ANNOUNCEMENT_TTS. MCP topics video-stock / media-stock / video; xpaceos://help, https://mcp.admira.store/help. No new remote generation tool: all 35 MCP tools retained.

Seguimiento / Tracking: FLT-101631 · vídeo y creatividades guardadas en Stock. Implemented contract; production verification is recorded in Yokup after deployment.

## Estado verificado / Verified state · 2026-10-05

Generaciones reales desde Opciones con sesión activa; recuperación tras recarga; idioma ES/EN; archivos públicos con SHA-256 e identidad confirmados en Stock. Vídeo decodificado: 1280 × 720, 8.04 s. Voz inglesa James: tres lecturas completadas. Ayuda MCP real 2.12.40 y 35 herramientas conservadas.

Real Options generations with an active session; reload recovery; ES/EN interface; public files checked against Stock SHA-256 and identity. Decoded video: 1280 × 720, 8.04 s. English James voice: three completed readings. Actual MCP help 2.12.40 retains all 35 tools.

| Tipo / Type | Pieza / Asset | URL estable / Stable URL |
|---|---|---|
| image | Stock #1376 · creatividad de café / coffee creative | https://api.admira.store/stock/asset/1791227596031-5ano5x |
| video | Stock #1378 · creatividad de café / coffee creative | https://api.admira.store/stock/asset/auto-8985fa5f5f9ec8776256 |
| audio | Stock #1379 · creatividad de café / coffee creative | https://api.admira.store/stock/asset/1791227936105-q53hjz |

El recibo confirma el archivo y sus metadatos; el recuento completo del catálogo y las notificaciones continúan en segundo plano. / The receipt confirms the file and metadata; catalogue-wide statistics and notifications continue in the background.

Cambiar explícitamente el texto, voz o idioma al generar inicia otro trabajo de pago; el anterior aceptado conserva su cola de Stock. Reintentar el mismo contenido pendiente conserva su UUID. / Explicitly generating changed text, voice or language starts another paid operation; the previous accepted job retains its Stock queue. Retrying the same pending content retains its UUID.

## Previos y lanzamiento / Previews and launch

ES: Opciones muestra un previo de cada imagen, vídeo o música nueva de Stock. Generar y guardar en Stock no envían ni reproducen el contenido. Revisa el previo y pulsa Lanzar para incorporarlo y reproducirlo en las pantallas o el hilo musical del Xpacio. Añadir a playlist y arrastrar al menú Playlist actual incorporan el contenido en la posición elegida sin interrumpir la emisión actual. Los menús compactos están al final de Hilo Musical y Vídeo: el título de una fila abre el previo, ▶ salta a ese contenido, arrastrar reordena y ↑ permite ordenar con teclado. En Matrix el selector indica la playlist y sus pantallas o TPV; se conservan las asignaciones y el contenido activo. Las imágenes duran 30 segundos en la playlist. Los previos de vídeo son silenciosos y no arrancan solos; el previo musical se escucha sólo al pulsar Play y baja temporalmente el hilo. Las canciones recibidas de PixerIA esperan en el previo. Los contenidos recién creados se excluyen de la selección automática XPL. Las locuciones conservan su botón explícito Emitir y sus tres lecturas. La emisión corresponde al reproductor virtual de esta página; no confirma publicación física.

EN: Options shows a preview of each new Stock image, video or music track. Generating and saving to Stock never send or play the content. Review it and press Launch to add it and play it on the Xpace screens or background music. Add to playlist and dropping onto Current playlist insert the content at the chosen position without interrupting current playback. Compact menus appear at the bottom of Background music and Video: a row title opens its preview, ▶ jumps to that content, dragging reorders and ↑ supports keyboard ordering. In Matrix the selector identifies the playlist and its screens or POS; assignments and the active item are retained. Playlist images last 30 seconds. Video previews stay muted and never autoplay; music previews require Play and temporarily lower background music. Tracks delivered by PixerIA wait in preview. Newly generated content is excluded from automatic XPL selection. Announcements keep their explicit Play announcement action and three readings. Playback refers to this page’s virtual player; it does not confirm physical broadcasting.

https://www.admira.store/admira-xp/docs/options-playlists.md


## Pixeria y arrastre / Pixeria and screen drops

ES: Opciones → Hilo Musical, Imagen o Vídeo conecta con la biblioteca publicada de Pixeria: elige un #hashtag y un contenido del desplegable. Importar prepara el previo sin emitir ni generar una copia. La generación está en Experto → Crear contenidos: imagen y vídeo conservan sus campos y trabajos recuperables; música abre el creador de Pixeria y sus entregas quedan preparadas en Stock. Arrastra la imagen o el asa del previo, o una fila de la playlist, directamente a la pantalla elegida en Good, Better, Best o Matrix. Soltar en una pantalla muestra sólo allí el contenido, sin audio y de forma temporal; Recargar pantalla recupera su programación guardada. En Matrix funciona con Layout cerrado y conserva las otras pantallas, TPV, asignaciones, IDs y música; las pantallas apagadas permanecen apagadas. Soltar en Playlist actual añade sin cambiar la emisión; Lanzar sigue incorporando y reproduciendo en el grupo elegido. El filtro de hashtags es exacto; también admite títulos y números de Stock. El catálogo mantiene los IDs y URLs estables y usa el archivo original disponible. La calidad de la vista no cambia la resolución del archivo. Son reproductores virtuales de este Xpacio, sin publicación física.

EN: Options → Background music, Image or Video connects to the published Pixeria library: choose a #hashtag and an item from the dropdown. Importing stages a preview without playback or generating a copy. Generation is in Expert → Create media: image and video retain their fields and recoverable jobs; music opens the Pixeria creator and its deliveries become staged Stock media. Drag the image or preview handle, or a playlist row, directly onto the chosen screen in Good, Better, Best or Matrix. Dropping on a screen displays the content only there, muted and temporarily; Reload screen restores its saved schedule. Matrix works with Layout closed and preserves other screens, POS, assignments, IDs and music; powered-off screens remain off. Dropping onto Current playlist adds without changing playback; Launch still adds and plays in the chosen group. Hashtag filters match exactly; titles and Stock numbers also work. The catalog retains stable IDs and URLs and uses the available original file. View quality does not change file resolution. These are virtual players in this Xpace, without physical publishing.

Guide: https://www.admira.store/admira-xp/docs/pixeria-screen-drop.md
