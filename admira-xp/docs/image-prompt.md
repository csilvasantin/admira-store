# Imagen · qué quieres anunciar / Image · advertising brief

## Español

Opciones → Imagen: escribe en Qué quieres anunciar el producto, oferta o anuncio (hasta 1500 caracteres) y pulsa Generar imagen (PixerIA). El campo está visible en el desplegable, conserva el texto al cambiar de idioma y evita envíos duplicados mientras genera. Requiere sesión autorizada y consume una generación de pago. La imagen usa el generador PixerIA existente y se guarda en Stock y aparece en el previo de Opciones; pulsa Lanzar para enviarla a la playlist de pantallas; no publica una campaña ni envía contenido a tiendas físicas. Un texto vacío pide completar el campo; un fallo se muestra en el estado. /creaimagen genera y prepara el previo sin autoemisión.

1. Abre Opciones → Imagen.
2. Escribe el anuncio en el campo visible.
3. Pulsa Generar imagen (PixerIA) y consulta el estado de generación.
4. La imagen aparece en el previo de Opciones. Pulsa Lanzar para emitirla. El texto queda disponible para editar y volver a generar.

## English

Options → Image: enter the product, offer or announcement in What do you want to advertise? (up to 1500 characters), then press Generate image (PixerIA). The field is visible inside the panel, retains text across language changes and prevents duplicate submissions while generating. An authorized session is required and one paid image generation is consumed. It uses the existing PixerIA generator and saves the image to Stock and shows it in the Options preview; press Launch to send it to the screen playlist; it does not publish a campaign or send content to physical stores. An empty brief asks you to fill the field; failures are shown in the status. /creaimagen generates and stages the preview without autoplay.

1. Open Options → Image.
2. Write the advertising brief in the visible field.
3. Press Generate image (PixerIA) and check generation status.
4. The image appears in the Options preview. Press Launch to play it. Your brief remains editable for the next image.

## Contrato / Contract

Module: admira-xp/scripts/image-prompt.js; internal controller window.XpaceImagePrompt.generate(window.admiraCreaImagen). UI: #imagePrompt, #imagePromptLabel, #imagePromptStatus. Existing imgGen action and /creaimagen command retained. Text is local to this page and retained across accordion/language changes; it is sent only when generating. Same-origin POST /admira-xp/advertising-image accepts {text,language,requestId} with an existing signed perimeter session and same-origin validation. It invokes generateImage with the brief, language, UUID and server-derived owner on the existing private ANNOUNCEMENT_TTS binding. The JSON response is a durable job; done includes a Stock receipt. The existing PixerIA xaiImageHandler uses grok-imagine-image with n=1 and private base64 output archived before preview; caller-supplied model or batch size is ignored. XAI_KEY stays in pixer-eleven. No credentials are copied and no new service binding is created. The old grok.admira.store endpoint cannot generate images from these origins and is no longer used by this action. An accepted provider request may consume credits even if the page is closed. After explicit Launch, playlist images last 30 seconds; no campaign publication or physical store broadcast. Empty input sends no request; the generate button is disabled while a request is pending. Keyboard entry is isolated from game shortcuts and CLI history.

Stable guide: https://www.admira.store/admira-xp/docs/image-prompt.md . Source: https://www.xpaceos.com/admira-xp/docs/image-prompt.md . MCP topic image-prompt / imagen, resource xpaceos://help; https://mcp.admira.store/help . All 35 tools retained.

Seguimiento / Tracking: FLT-101627 · idioma de voces y campo Imagen. The existing generation provider remains a dependency; failures are displayed without confirming a generated image.

A sign-in prompt links to the existing Google login and retains the advertising draft for the return visit. Successful status requires a decoded image. Interactive XpaceOS entry routes to admira.store while GoDaddy DNS migration remains pending; embedded players retain public access.

## Sesión conservada / Retained session

Acceso con la cuenta Google de Admira: al abrir el Xpacio como aplicación se verifica tu identidad antes de generar imágenes o locuciones. La sesión humana se conserva durante 30 días de uso en este navegador y se renueva al volver, sin una contraseña propia de XpaceOS. Google reutiliza la cuenta conectada cuando puede; el primer acceso o una sesión Google cerrada pueden requerir elegir la cuenta o autenticarse en Google. Los permisos de AdmiraNeXT siguen activos y revocables. Imagen y Locuciones muestran Sesión activa cuando la sesión está verificada. Cerrar sesión impide la reconexión automática inmediata. No se almacenan claves en el navegador. Por ahora, la entrada interactiva de xpaceos.com abre admira.store conservando ruta, Xpacio, idioma y parámetros; los reproductores incrustados conservan su acceso público. La migración del DNS de GoDaddy a Cloudflare Pages sigue pendiente.

Access with your Admira Google account: opening the Xpace as an application verifies your identity before image or announcement generation. Human sessions are retained for 30 days of use in this browser and renewed on return, without a separate XpaceOS password. Google reuses a connected account when available; the first visit or a signed-out Google session may require choosing an account or authenticating with Google. AdmiraNeXT permissions remain enforced and revocable. Image and Public Announcement System show Session active when access is verified. Signing out prevents immediate automatic reconnection. No keys are stored in the browser. For now, interactive xpaceos.com entry opens admira.store while retaining the route, Xpace, language and parameters; embedded players retain public access. GoDaddy DNS migration to Cloudflare Pages remains pending.

Contract: https://www.admira.store/admira-xp/docs/session-access.md

## Archivo automático / Automatic archive

Opciones → Vídeo: escribe en Qué quieres anunciar (hasta 1500 caracteres) y pulsa Generar vídeo (Grok). Se crea un vídeo de 8 segundos, 16:9 y 720p, con el idioma ESP/ENG seleccionado. El estado muestra generación y guardado; al terminar aparece el reproductor y Ver en Stock. Imágenes, vídeos y locuciones ElevenLabs se archivan automáticamente en Stock con ID, número de catálogo, hash y URL estable. Una locución se genera una vez y se reproduce tres veces. La sesión Admira existente sirve para las tres funciones, sin otra contraseña. Reintentar recupera el mismo trabajo; el servidor puede terminar el guardado aunque cierres la página. Un nuevo trabajo consume otra generación de pago. Publicar en Stock sigue sus contratos y distribución existentes; este botón no crea una campaña ni conecta equipos físicos.

Options → Video: enter What do you want to advertise? (up to 1500 characters), then press Generate video (Grok). It creates an 8-second, 16:9, 720p video in the selected ESP/ENG language. Status shows generation and saving; once complete, the player and Open in Stock appear. Images, videos and ElevenLabs announcements are automatically archived in Stock with an ID, catalog number, hash and stable URL. Each announcement is generated once and played three times. The existing Admira session covers all three functions, without another password. Retrying recovers the same operation; the server can finish archiving after you close the page. A new operation consumes another paid generation. Stock publication follows its existing contracts and distribution; this button does not create a campaign or connect physical devices.

Contrato actual / Current contract: [Vídeo y Stock](https://www.admira.store/admira-xp/docs/video-stock.md). Image JSON now returns a Stock job, not base64; audio returns MP3 with X-Stock-Id/Url/Num and X-Media-Job, or JSON while archiving. POST requests include requestId and the private RPC receives server-derived owner; see the shared guide.

## Previos y lanzamiento / Previews and launch

ES: Opciones muestra un previo de cada imagen, vídeo o música nueva de Stock. Generar y guardar en Stock no envían ni reproducen el contenido. Revisa el previo y pulsa Lanzar para incorporarlo y reproducirlo en las pantallas o el hilo musical del Xpacio. Añadir a playlist y arrastrar al menú Playlist actual incorporan el contenido en la posición elegida sin interrumpir la emisión actual. Los menús compactos están al final de Hilo Musical y Vídeo: el título de una fila abre el previo, ▶ salta a ese contenido, arrastrar reordena y ↑ permite ordenar con teclado. En Matrix el selector indica la playlist y sus pantallas o TPV; se conservan las asignaciones y el contenido activo. Las imágenes duran 30 segundos en la playlist. Los previos de vídeo son silenciosos y no arrancan solos; el previo musical se escucha sólo al pulsar Play y baja temporalmente el hilo. Las canciones recibidas de PixerIA esperan en el previo. Los contenidos recién creados se excluyen de la selección automática XPL. Las locuciones conservan su botón explícito Emitir y sus tres lecturas. La emisión corresponde al reproductor virtual de esta página; no confirma publicación física.

EN: Options shows a preview of each new Stock image, video or music track. Generating and saving to Stock never send or play the content. Review it and press Launch to add it and play it on the Xpace screens or background music. Add to playlist and dropping onto Current playlist insert the content at the chosen position without interrupting current playback. Compact menus appear at the bottom of Background music and Video: a row title opens its preview, ▶ jumps to that content, dragging reorders and ↑ supports keyboard ordering. In Matrix the selector identifies the playlist and its screens or POS; assignments and the active item are retained. Playlist images last 30 seconds. Video previews stay muted and never autoplay; music previews require Play and temporarily lower background music. Tracks delivered by PixerIA wait in preview. Newly generated content is excluded from automatic XPL selection. Announcements keep their explicit Play announcement action and three readings. Playback refers to this page’s virtual player; it does not confirm physical broadcasting.

https://www.admira.store/admira-xp/docs/options-playlists.md
