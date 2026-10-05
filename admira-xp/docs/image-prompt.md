# Imagen · qué quieres anunciar / Image · advertising brief

## Español

Opciones → Imagen: escribe en Qué quieres anunciar el producto, oferta o anuncio (hasta 1500 caracteres) y pulsa Generar imagen (PixerIA). El campo está visible en el desplegable, conserva el texto al cambiar de idioma y evita envíos duplicados mientras genera. Requiere sesión autorizada y consume una generación de pago. La imagen usa el generador PixerIA existente y aparece durante 30 segundos en la pantalla del contador; no publica una campaña ni envía contenido a tiendas físicas. Un texto vacío pide completar el campo; un fallo se muestra en el estado. /creaimagen mantiene su uso anterior.

1. Abre Opciones → Imagen.
2. Escribe el anuncio en el campo visible.
3. Pulsa Generar imagen (PixerIA) y consulta el estado de generación.
4. La imagen aparece en la pantalla del contador. El texto queda disponible para editar y volver a generar.

## English

Options → Image: enter the product, offer or announcement in What do you want to advertise? (up to 1500 characters), then press Generate image (PixerIA). The field is visible inside the panel, retains text across language changes and prevents duplicate submissions while generating. An authorized session is required and one paid image generation is consumed. It uses the existing PixerIA generator and displays the image on the counter screen for 30 seconds; it does not publish a campaign or send content to physical stores. An empty brief asks you to fill the field; failures are shown in the status. /creaimagen retains its existing behavior.

1. Open Options → Image.
2. Write the advertising brief in the visible field.
3. Press Generate image (PixerIA) and check generation status.
4. The image appears on the counter screen. Your brief remains editable for the next image.

## Contrato / Contract

Module: admira-xp/scripts/image-prompt.js; internal controller window.XpaceImagePrompt.generate(window.admiraCreaImagen). UI: #imagePrompt, #imagePromptLabel, #imagePromptStatus. Existing imgGen action and /creaimagen command retained. Text is local to this page and retained across accordion/language changes; it is sent only when generating. Same-origin POST /admira-xp/advertising-image accepts {text,language} with an existing signed perimeter session and same-origin validation. It invokes generateImage on the existing private ANNOUNCEMENT_TTS binding. The existing PixerIA xaiImageHandler uses grok-imagine-image with n=1 and base64 output; caller-supplied model or batch size is ignored. XAI_KEY stays in pixer-eleven. No credentials are copied and no new service binding is created. The old grok.admira.store endpoint cannot generate images from these origins and is no longer used by this action. An accepted provider request may consume credits even if the page is closed. Existing counter-screen preview lasts 30 seconds; no campaign publication or physical store broadcast. Empty input sends no request; the generate button is disabled while a request is pending. Keyboard entry is isolated from game shortcuts and CLI history.

Stable guide: https://www.admira.store/admira-xp/docs/image-prompt.md . Source: https://www.xpaceos.com/admira-xp/docs/image-prompt.md . MCP topic image-prompt / imagen, resource xpaceos://help; https://mcp.admira.store/help . All 35 tools retained.

Seguimiento / Tracking: FLT-101627 · idioma de voces y campo Imagen. The existing generation provider remains a dependency; failures are displayed without confirming a generated image.

A sign-in prompt links to the existing Google login and retains the advertising draft for the return visit. Successful status requires a decoded image. XpaceOS main-domain generation depends on its pending Cloudflare Pages migration; admira.store is active.
