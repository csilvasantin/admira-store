# Imagen · qué quieres anunciar / Image · advertising brief

## Español

Opciones → Imagen: escribe en Qué quieres anunciar el producto, oferta o anuncio (hasta 1500 caracteres) y pulsa Generar imagen (PixerIA). El campo está visible en el desplegable, conserva el texto al cambiar de idioma y evita envíos duplicados mientras genera. La imagen usa el generador PixerIA existente y aparece durante 30 segundos en la pantalla del contador; no publica una campaña ni envía contenido a tiendas físicas. Un texto vacío pide completar el campo; un fallo se muestra en el estado. /creaimagen mantiene su uso anterior.

1. Abre Opciones → Imagen.
2. Escribe el anuncio en el campo visible.
3. Pulsa Generar imagen (PixerIA) y consulta el estado de generación.
4. La imagen aparece en la pantalla del contador. El texto queda disponible para editar y volver a generar.

## English

Options → Image: enter the product, offer or announcement in What do you want to advertise? (up to 1500 characters), then press Generate image (PixerIA). The field is visible inside the panel, retains text across language changes and prevents duplicate submissions while generating. It uses the existing PixerIA generator and displays the image on the counter screen for 30 seconds; it does not publish a campaign or send content to physical stores. An empty brief asks you to fill the field; failures are shown in the status. /creaimagen retains its existing behavior.

1. Open Options → Image.
2. Write the advertising brief in the visible field.
3. Press Generate image (PixerIA) and check generation status.
4. The image appears on the counter screen. Your brief remains editable for the next image.

## Contrato / Contract

Module: admira-xp/scripts/image-prompt.js; internal controller window.XpaceImagePrompt.generate(window.admiraCreaImagen). UI: #imagePrompt, #imagePromptLabel, #imagePromptStatus. Existing imgGen action and /creaimagen command retained. Text is local to this page and retained across accordion/language changes; it is sent only when generating. The existing /grok/image provider receives the advertising brief. No credentials or new service bindings. Existing counter-screen preview lasts 30 seconds; no campaign publication or physical store broadcast. Empty input sends no request; the generate button is disabled while a request is pending. Keyboard entry is isolated from game shortcuts and CLI history.

Stable guide: https://www.admira.store/admira-xp/docs/image-prompt.md . Source: https://www.xpaceos.com/admira-xp/docs/image-prompt.md . MCP topic image-prompt / imagen, resource xpaceos://help; https://mcp.admira.store/help . All 35 tools retained.

Seguimiento / Tracking: FLT-101627 · idioma de voces y campo Imagen. The existing generation provider remains a dependency; failures are displayed without confirming a generated image.
