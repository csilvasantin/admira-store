# Experto · PREVIOS de lo creado / Expert · PREVIEWS of created media

Estado: entregado el 06-10-2026 (petición de Carlos, 12:21). Archivos: `admira-xp/scripts/expert-previews.js`, `expert-previews.css`, `voiceover-prompt.js`; cambios en `media-options.js`, `announcements.js`, `video-prompt.js`, `hilomusical.js`, `starbucks-music.mjs` y `admira-xp/index.html`. Prueba: `tests/expert-previews.test.mjs`.

## ES

El menú inferior del modo Experto tiene tres columnas: **CONTROL XTORE** (CLI y categorías), la **columna central** (opciones de la categoría; en Crear contenidos, los formularios) y **PREVIOS**, a la derecha del todo.

Lo que se crea en **Experto → Crear contenidos** se abre ahora en **PREVIOS**, sólo con la última creación, en grande, con las acciones debajo:

- **Crear imagen** (PixerIA): previo grande de la imagen.
- **Crear locución** (nuevo, ElevenLabs): reproductor de audio. Voz femenina o masculina; idioma ESP/ENG de la interfaz.
- **Crear vídeo** (Grok): reproductor de vídeo silencioso, sin arranque automático.
- **Crear música** (Pixeria): cuando llega la entrega nueva al hilo musical, reproductor de audio.

Cada tarjeta muestra tipo, número de Stock, hora y título, y dos acciones: **▶ Lanzar** (a pantallas o al hilo musical; añade a la playlist y reproduce en los players virtuales de este Xpacio) y **Ver en Stock**. La locución usa **📢 Emitir**: suena una vez bajando el hilo musical, sin volver a generarla; **⏹ Detener** la corta. Los formularios siguen en la columna central. Crear nunca emite: sólo Lanzar o Emitir reproducen.

La última creación se conserva al recargar la página incluso después de cerrar el navegador (`localStorage: xpaceos.created-media.v2:<loc|store|project>`). El previo de Opciones (Imagen, Vídeo, Hilo Musical) se mantiene igual que antes; importar desde la biblioteca de Pixeria no es «crear» y no entra en PREVIOS. El medio siempre ocupa el espacio superior y las acciones quedan debajo, también en una columna estrecha.

Locución: la generación usa la ruta con sesión `/admira-xp/announcement-tts` (la misma de Opciones → Locuciones), que guarda el MP3 en Stock · Megafonía. No se usa `POST https://api.admira.store/megafonia/push` (la que usa `clearchannel-tv/tools/crear-demo`): esa cola la reproducen al momento los gemelos de la tienda, y aquí la locución debe esperar en el previo. Una generación de pago por locución; reintentar con el mismo texto y voz recupera el mismo trabajo.

Experto cerrado por defecto: el menú inferior arranca oculto (`body.xp-left-hidden`) y ⌘ lo muestra. PREVIOS se mantiene montado aunque el Experto esté cerrado: lo que termine de generarse mientras tanto (p. ej. un vídeo pendiente) entra como único previo y se ve al abrir ⌘.

Sello flotante: el chip común «v.… NUEVO» (`www.admiranext.com/assets/sello-novedades.js`) sólo se eleva sobre el dock de la piel de la suite. En el gemelo, con el Experto abierto, quedaba en la esquina inferior izquierda encima de las categorías y tapaba «Crear contenidos» con el menú bajo. `scripts/sello-chip-dock.js` lo coloca 8 px por encima del borde superior de `#telegramDock` mientras el menú está visible; con el Experto cerrado vuelve a su sitio.

Por qué no se veía antes: los creadores llamaban a `XpaceMediaOptions.stage()`, que pinta el previo en `[data-media-ready]` dentro del menú lateral Opciones (plegado en Experto). La columna PREVIOS sólo contenía la respuesta del CLI y la placa de calidad (`04 · MATRIX · 64 BITS`). El mensaje «Revisa el previo y pulsa Lanzar» apuntaba a un previo que no estaba a la vista.

## EN

The Expert bottom menu has three columns: **CONTROL XTORE** (CLI and categories), the **middle column** (category options; for Create media, the forms) and **PREVIEWS** on the far right.

Media created in **Expert → Create media** now opens in **PREVIEWS**, showing only the latest creation at the largest available size, with actions below: large image preview (PixerIA), voiceover audio player (new **Create voiceover**, ElevenLabs, female or male voice, ESP/ENG interface language), muted video player without autoplay (Grok) and audio player for new music deliveries from the Pixeria creator.

Each card shows type, Stock number, time and title, plus **▶ Launch** (to screens or background music: adds to the playlist and plays on this Xpace's virtual players) and **Open in Stock**. Voiceovers use **📢 Play**: one reading with background music paused, without generating again; **⏹ Stop** cuts it. Forms stay in the middle column. Creating never plays.

The latest creation survives a reload after closing and reopening the browser (`localStorage: xpaceos.created-media.v2:<loc|store|project>`). Options previews are unchanged; Pixeria library imports are not "created" and stay out of PREVIEWS. Media fills the upper space and actions stay below, including narrow columns.

Expert closed by default: the bottom menu starts hidden and ⌘ shows it. PREVIEWS stays mounted while closed, so anything that finishes meanwhile (e.g. a pending video) becomes the sole preview when ⌘ opens. Version seal: `scripts/sello-chip-dock.js` keeps the shared floating chip 8 px above `#telegramDock` while the menu is visible, so it no longer covers the Create media category.

Voiceover generation uses the session route `/admira-xp/announcement-tts`, archived to Stock · Public announcements. `POST /megafonia/push` is not used because that queue plays immediately in the store twins. One paid generation per voiceover; retrying the same text and voice recovers the same job.

Contract for agents: `window.XpaceExpertPreviews.add(kind, stockReceipt)` with `kind` ∈ `image|music|voice|video` and a receipt `{id, url:'https://api.admira.store/stock/asset/<id>', num, title}`; or `XpaceMediaOptions.stage(kind, receipt, {created:true})`, which dispatches `xpace:media-created`. `XpaceMediaOptions.launch(kind, receipt)` and `XpaceAnnouncements.playStock(url, text, {language, onState})`.

Contrato actualizado también en el servidor MCP real y en la fuente XpaceOS. / Contract also updated in the real MCP server and XpaceOS source.

## Recuperación y legibilidad / Recovery and legibility

Experto usa fondos opacos y texto claro con contraste estable, también con /marca Starbucks. PREVIOS, la tercera columna, muestra sólo la última creación (imagen, vídeo, música o locución) al máximo tamaño disponible, con las acciones debajo, sin reloj ni placa de estado. Los recibos se guardan por Xpacio y navegador y se recuperan tras cerrar o recargar. Crear nunca emite: revisa el previo y pulsa Lanzar o Emitir. Matrix silencia el rumor, la cafetera y la lluvia sintéticos; Escuchar y los avisos siguen disponibles. Los previos gráficos se arrastran por el centro, alineados con el cursor.

Expert uses opaque backgrounds and readable text with stable contrast, including /brand Starbucks. PREVIEWS, the third column, shows only the latest creation (image, video, music or voiceover) at the largest available size, with actions below, without a clock or scene status plate. Receipts are saved per Xpace and browser and restored after closing or reloading. Creating never plays: review the preview, then press Launch or Play. Matrix silences synthetic cafe ambience, coffee-machine sounds and rain; Listen and announcements remain available. Graphic previews drag by their centre, aligned with the pointer.

El recibo se registra al completar la generación, antes de montar PREVIOS. Los enlaces de Stock y su identidad se conservan; cerrar el Experto no cancela una creación. No se regenera contenido para recuperar un previo. No hay sincronización del historial local entre dominios, ordenadores o perfiles. / The receipt is recorded when generation completes, before PREVIEWS mounts. Stock links and identities are retained; closing Expert does not cancel creation. Recovery never regenerates media. Local receipt history does not synchronize between domains, computers or profiles.

El espejo valida `retained_ui_contract` antes de copiar: si XpaceOS carece del contrato publicado o de un archivo necesario, se detiene sin borrar el destino. Publicar siempre primero la fuente XpaceOS. / The mirror validates `retained_ui_contract` before copying: missing source contracts or required files stop it before target deletion. Always publish XpaceOS first.

En PREVIOS puedes arrastrar la imagen, el fotograma o la carátula al dispositivo o playlist: se usa el centro gráfico y el recibo propio de esa tarjeta, aunque haya una creación posterior. Los controles de vídeo y audio conservan su uso. / In PREVIEWS, drag the image, video frame or cover to a device or playlist: the graphic centre and that card's own receipt are used even after a later creation. Video and audio controls remain usable.

## Barra de evolución y doble clic / Stage bar and double-click

La creación muestra una barra por fases: Preparar, Crear, Stock y Listo. La animación indica espera sin inventar porcentajes ni tiempos; sólo termina cuando el recibo de Stock y el contenido están listos. Música se crea en Pixeria: al abrir el creador se muestra «esperando la nueva entrega en Stock» hasta recibirla en este Xpacio. Haz doble clic sobre una imagen, vídeo, carátula o audio en PREVIOS o en el previo de Opciones/playlist para abrirlo grande en el centro. También puedes enfocar el previo y pulsar Enter. Cerrar, Escape o pulsar el fondo cierra el previo y detiene su audio/vídeo. Abrir no reproduce ni publica; los controles del previo sólo actúan en este navegador. El arrastre sigue disponible al mantener pulsado y mover.

Creation shows a stage bar: Prepare, Create, Stock and Ready. Animation indicates waiting without invented percentages or times; it finishes only once the Stock receipt and media are ready. Music is created in Pixeria: opening the creator shows “waiting for the new Stock delivery” until this Xpace receives it. Double-click an image, video, cover or audio in PREVIEWS or the Options/playlist preview to open it large in the centre. You can also focus the preview and press Enter. Close, Escape or clicking the backdrop closes the preview and stops its audio/video. Opening does not play or publish; preview controls act only in this browser. Hold and move to keep using drag and drop.

Contrato / Contract: `XpaceMediaExperience.progress(kind, phase, {title, requestId})` para feedback local; `bind(node, {kind,id,url,title,thumbnail})` y `open(receipt, trigger)` amplían sólo recibos válidos de Stock. `kind`: music, voice, image, video. Los estados del servidor de imagen, vídeo y locución alimentan la barra del mismo trabajo; no se inicia otra generación al ampliar o recuperar un previo. La integración musical conserva su creador externo y la confirmación de entrega existente; no recibe porcentajes internos de Pixeria. / Image, video and voice server states drive the same job bar; enlargement and recovery never regenerate. Music retains its external creator and existing delivery confirmation; internal Pixeria percentages are unavailable.


## Previo único / Single preview

ES: PREVIOS muestra sólo la última creación multimedia. La imagen, el vídeo o la carátula ocupa el máximo ancho y alto disponible sin recortar sus proporciones; el reproductor de audio y las acciones quedan debajo. Imagen y vídeo ofrecen Lanzar a pantalla y Ver en Stock; música conserva Lanzar al hilo y la locución Emitir. Una nueva creación sustituye el previo y detiene su reproductor local anterior, sin emitir automáticamente. El historial de recibos guardado se conserva; al recargar sólo se muestra la última creación. Se mantienen el arrastre centrado, el doble clic y los formularios centrales.

EN: PREVIEWS shows only the latest multimedia creation. The image, video or cover uses the largest available width and height without cropping its proportions; audio controls and actions sit below. Images and videos offer Launch to screen and Open in Stock; music keeps Launch to music and voiceovers Play. A new creation replaces the preview and stops its previous local player without automatic playback. Saved receipt history is preserved; reload shows only the latest creation. Centred dragging, double-click enlargement and middle-column forms remain available.

Tutorial ES: crea una pieza, revisa el previo grande de la derecha y usa las acciones inferiores. Crea otra pieza: sustituye a la anterior. Recarga: se recupera sólo la última.

Tutorial EN: create media, review the large right-hand preview and use the actions below. Create another item: it replaces the previous preview. Reload: only the latest item returns.

## Matrix y reset local / Matrix and local reset

Matrix controla exclusivamente la captura y sus ocho dispositivos: seis pantallas de pared, TPV e iPad. Las capas de Good se ocultan mientras Matrix está abierto y reaparecen al volver a Good. Signage muestra destinos Matrix; arrastrar un contenido lo previsualiza sólo en la pantalla elegida, sin pines Good ni escritura de playlists compartidas. Los previos de pantallas diferentes se mantienen independientes. PREVIOS conserva sólo la última creación y ocupa toda la tercera columna del Experto, también con Signage abierto; Lanzar a pantalla y Ver en Stock quedan debajo. /reset, sin argumentos, restaura los trece contenidos básicos y su orden original en Signage, libera los pines y devuelve Matrix a sus playlists base de pared, TPV e iPad desde el principio. Los imports se apartan de la playlist activa sin borrarse de IndexedDB, y las creaciones, recibos de Stock, banco de voces, historial CLI, idioma y marca se conservan. El hilo musical no cambia. Las playlists compartidas MCP y los equipos físicos no se modifican; el estado MCP vigente sigue siendo la programación base. El comando se ejecuta en este navegador sin enviar mensajes a Telegram.

Matrix exclusively owns the capture and its eight devices: six wall screens, POS and iPad. Good layers are hidden while Matrix is open and return when switching to Good. Signage shows Matrix destinations; dropping an item previews it only on the chosen screen without Good pins or shared playlist writes. Previews on different screens remain independent. PREVIEWS keeps only the latest creation and fills the third Expert column, including when Signage is open; Launch to screen and Open in Stock sit below. /reset, without arguments, restores the thirteen basic Signage items in their original order, releases pins and returns Matrix to its base wall, POS and iPad playlists from the beginning. Imports are excluded from the active playlist without being deleted from IndexedDB; creations, Stock receipts, voice bank, CLI history, language and brand are retained. Background music is unchanged. Shared MCP playlists and physical devices are not modified; current MCP state remains the base schedule. The command runs in this browser without sending Telegram messages.


## Reset desde PREVIOS / Reset from PREVIEWS

ES: En PREVIOS, las imágenes y vídeos muestran Reset a la derecha de Ver en Stock. Tras Lanzar a pantalla o arrastrar, Reset devuelve los dispositivos a su programación inicial mediante la misma restauración local que /reset: Signage básico y playlists base vigentes de Matrix. Conserva la última creación visible, su archivo y recibo de Stock, historial y estado MCP compartido; no modifica el hilo musical. Durante la operación muestra progreso y evita repetir el clic. Si falla, informa del error y permite reintentar.

EN: In PREVIEWS, images and videos show Reset to the right of Open in Stock. After Launch to screen or a drop, Reset returns devices to their initial schedule using the same local restoration as /reset: basic Signage and the current Matrix base playlists. It keeps the latest creation visible, its Stock file and receipt, history and shared MCP state; background music is unchanged. While running it shows progress and prevents duplicate clicks. Failures are reported and can be retried.
