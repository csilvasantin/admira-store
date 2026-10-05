# Imagen · qué quieres anunciar / Image · advertising brief

## Español

Opciones → Imagen: escribe en Qué quieres anunciar el producto, oferta o anuncio (hasta 1500 caracteres) y pulsa Generar imagen (PixerIA). El campo está visible en el desplegable, conserva el texto al cambiar de idioma y evita envíos duplicados mientras genera. Requiere sesión autorizada y consume una generación de pago. La imagen usa el generador PixerIA existente y se guarda en Stock y aparece durante 30 segundos en la pantalla del contador; no publica una campaña ni envía contenido a tiendas físicas. Un texto vacío pide completar el campo; un fallo se muestra en el estado. /creaimagen mantiene su uso anterior.

1. Abre Opciones → Imagen.
2. Escribe el anuncio en el campo visible.
3. Pulsa Generar imagen (PixerIA) y consulta el estado de generación.
4. La imagen aparece en la pantalla del contador. El texto queda disponible para editar y volver a generar.

## English

Options → Image: enter the product, offer or announcement in What do you want to advertise? (up to 1500 characters), then press Generate image (PixerIA). The field is visible inside the panel, retains text across language changes and prevents duplicate submissions while generating. An authorized session is required and one paid image generation is consumed. It uses the existing PixerIA generator and saves the image to Stock and displays it on the counter screen for 30 seconds; it does not publish a campaign or send content to physical stores. An empty brief asks you to fill the field; failures are shown in the status. /creaimagen retains its existing behavior.

1. Open Options → Image.
2. Write the advertising brief in the visible field.
3. Press Generate image (PixerIA) and check generation status.
4. The image appears on the counter screen. Your brief remains editable for the next image.

## Contrato / Contract

Module: admira-xp/scripts/image-prompt.js; internal controller window.XpaceImagePrompt.generate(window.admiraCreaImagen). UI: #imagePrompt, #imagePromptLabel, #imagePromptStatus. Existing imgGen action and /creaimagen command retained. Text is local to this page and retained across accordion/language changes; it is sent only when generating. Same-origin POST /admira-xp/advertising-image accepts {text,language,requestId} with an existing signed perimeter session and same-origin validation. It invokes generateImage with the brief, language, UUID and server-derived owner on the existing private ANNOUNCEMENT_TTS binding. The JSON response is a durable job; done includes a Stock receipt. The existing PixerIA xaiImageHandler uses grok-imagine-image with n=1 and private base64 output archived before preview; caller-supplied model or batch size is ignored. XAI_KEY stays in pixer-eleven. No credentials are copied and no new service binding is created. The old grok.admira.store endpoint cannot generate images from these origins and is no longer used by this action. An accepted provider request may consume credits even if the page is closed. Existing counter-screen preview lasts 30 seconds; no campaign publication or physical store broadcast. Empty input sends no request; the generate button is disabled while a request is pending. Keyboard entry is isolated from game shortcuts and CLI history.

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
