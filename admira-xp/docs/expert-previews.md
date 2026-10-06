# Experto · PREVIOS de lo creado / Expert · PREVIEWS of created media

Estado: entregado el 06-10-2026 (petición de Carlos, 12:21). Archivos: `admira-xp/scripts/expert-previews.js`, `expert-previews.css`, `voiceover-prompt.js`; cambios en `media-options.js`, `announcements.js`, `video-prompt.js`, `hilomusical.js`, `starbucks-music.mjs` y `admira-xp/index.html`. Prueba: `tests/expert-previews.test.mjs`.

## ES

El menú inferior del modo Experto tiene tres columnas: **CONTROL XTORE** (CLI y categorías), la **columna central** (opciones de la categoría; en Crear contenidos, los formularios) y **PREVIOS**, a la derecha del todo.

Lo que se crea en **Experto → Crear contenidos** se abre ahora en **PREVIOS**, el último primero (hasta seis piezas):

- **Crear imagen** (PixerIA): miniatura de la imagen.
- **Crear locución** (nuevo, ElevenLabs): reproductor de audio. Voz femenina o masculina; idioma ESP/ENG de la interfaz.
- **Crear vídeo** (Grok): reproductor de vídeo silencioso, sin arranque automático.
- **Crear música** (Pixeria): cuando llega la entrega nueva al hilo musical, reproductor de audio.

Cada tarjeta muestra tipo, número de Stock, hora y título, y dos acciones: **▶ Lanzar** (a pantallas o al hilo musical; añade a la playlist y reproduce en los players virtuales de este Xpacio) y **Ver en Stock**. La locución usa **📢 Emitir ×3**: suena tres veces bajando el hilo musical, sin volver a generarla; **⏹ Detener** la corta. Los formularios siguen en la columna central. Crear nunca emite: sólo Lanzar o Emitir reproducen.

La lista se conserva al recargar la página durante la sesión del navegador (`sessionStorage: xpaceos.expert-previews.v1`). El previo de Opciones (Imagen, Vídeo, Hilo Musical) se mantiene igual que antes; importar desde la biblioteca de Pixeria no es «crear» y no entra en PREVIOS. En una columna estrecha (móvil) la tarjeta se apila: medio arriba y acciones a lo ancho.

Locución: la generación usa la ruta con sesión `/admira-xp/announcement-tts` (la misma de Opciones → Locuciones), que guarda el MP3 en Stock · Megafonía. No se usa `POST https://api.admira.store/megafonia/push` (la que usa `clearchannel-tv/tools/crear-demo`): esa cola la reproducen al momento los gemelos de la tienda, y aquí la locución debe esperar en el previo. Una generación de pago por locución; reintentar con el mismo texto y voz recupera el mismo trabajo.

Por qué no se veía antes: los creadores llamaban a `XpaceMediaOptions.stage()`, que pinta el previo en `[data-media-ready]` dentro del menú lateral Opciones (plegado en Experto). La columna PREVIOS sólo contenía la respuesta del CLI y la placa de calidad (`04 · MATRIX · 64 BITS`). El mensaje «Revisa el previo y pulsa Lanzar» apuntaba a un previo que no estaba a la vista.

## EN

The Expert bottom menu has three columns: **CONTROL XTORE** (CLI and categories), the **middle column** (category options; for Create media, the forms) and **PREVIEWS** on the far right.

Media created in **Expert → Create media** now opens in **PREVIEWS**, newest first (up to six items): image thumbnail (PixerIA), voiceover audio player (new **Create voiceover**, ElevenLabs, female or male voice, ESP/ENG interface language), muted video player without autoplay (Grok) and audio player for new music deliveries from the Pixeria creator.

Each card shows type, Stock number, time and title, plus **▶ Launch** (to screens or background music: adds to the playlist and plays on this Xpace's virtual players) and **Open in Stock**. Voiceovers use **📢 Play ×3**: three readings with background music lowered, without generating again; **⏹ Stop** cuts it. Forms stay in the middle column. Creating never plays.

The list survives a reload within the browser session (`sessionStorage: xpaceos.expert-previews.v1`). Options previews are unchanged; Pixeria library imports are not "created" and stay out of PREVIEWS. In a narrow column (mobile) the card stacks.

Voiceover generation uses the session route `/admira-xp/announcement-tts`, archived to Stock · Public announcements. `POST /megafonia/push` is not used because that queue plays immediately in the store twins. One paid generation per voiceover; retrying the same text and voice recovers the same job.

Contract for agents: `window.XpaceExpertPreviews.add(kind, stockReceipt)` with `kind` ∈ `image|music|voice|video` and a receipt `{id, url:'https://api.admira.store/stock/asset/<id>', num, title}`; or `XpaceMediaOptions.stage(kind, receipt, {created:true})`, which dispatches `xpace:media-created`. `XpaceMediaOptions.launch(kind, receipt)` and `XpaceAnnouncements.playStock(url, text, {language, onState})`.

Pendiente / Pending: update the real MCP server help (`csilvasantin/xpaceos-mcp`, https://mcp.admira.store/help) and port this change to `csilvasantin/xpaceos`, whose daily mirror (`sync-xpaceos-minus-1d.yml`) would otherwise overwrite admira.store.
