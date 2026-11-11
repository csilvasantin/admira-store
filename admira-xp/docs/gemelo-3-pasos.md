# Crea tu gemelo en 3 pasos / Create your twin in 3 steps

Neo, 11-nov-2026. Asistente público en `/xpacios/gemelo/`. Código: `xpacios/gemelo/` (lógica común `gemelo.js`). Test: `xpacios/gemelo/gemelo.test.mjs`.

## ES

Tres páginas separadas, sin anclas:

| Paso | Ruta | Qué hace |
|---|---|---|
| Inicio | `/xpacios/gemelo/` | Presenta los 3 pasos; si hay borrador, ofrece seguir. |
| 1 · Tu espacio | `/xpacios/gemelo/1/` | Nombre, ciudad, sector y fondo: foto del local, plano o cuadrícula. La imagen se reduce a JPEG de 960 px en el navegador. |
| 2 · Pantallas y muebles | `/xpacios/gemelo/2/` | Paleta (pantalla, videowall, tótem, escaparate, mostrador, estantería, mesa, sofá/cama, probador, entrada, cámara/sensor). Pulsar coloca, arrastrar mueve; nombre, girar 90°, duplicar, quitar, deshacer y vista 3D. |
| 3 · Publicar | `/xpacios/gemelo/3/` | Resumen y vista 3D. Publicar exige sesión (al login con vuelta al paso 3). |
| Visor | `/xpacios/gemelo/ver/?id=<id>` | Página propia de cada gemelo publicado, en 3D o plano. `?id=borrador` muestra el borrador local. |

- Sin sesión se puede probar todo: el borrador vive en `localStorage` (`gemelo-borrador`).
- Publicar escribe en `api.admira.store /layout/report`: `gemelo-<id>` (datos y elementos), `gemelo-<id>-foto` (imagen, aparte) y añade o actualiza la entrada en el índice compartido `xpacios-index` con `kind:"gemelo"`. El índice `/xpacios/` abre estas entradas en el visor.
- Id: `gm-<nombre>-<base36>`; volver a publicar actualiza el mismo gemelo.
- Pendiente: el almacén de layouts acepta escrituras sin autenticar (ver `perimetro-publico.md`).

## EN

Three separate pages: `/xpacios/gemelo/1/` (name, city, sector and a photo, floor plan or grid), `/2/` (place screens and furniture: click to add, drag to move, rename, rotate, duplicate, remove, undo, 3D view) and `/3/` (review and publish; publishing requires a session). Each published twin opens at `/xpacios/gemelo/ver/?id=<id>`. The draft lives in `localStorage` until published; publishing writes `gemelo-<id>`, `gemelo-<id>-foto` and the shared `xpacios-index` entry (`kind:"gemelo"`) through `api.admira.store /layout/report`.

## Compartir e incrustar / Share and embed (mejora 2, 11-nov-2026)

- En el visor, «🔗 Compartir»: copiar enlace, WhatsApp, LinkedIn y código `<iframe>` para insertar el gemelo en otra web (`&embed=1`; también se detecta dentro de un iframe). Incrustado se ve solo el gemelo y la firma «Hecho con admira.store». En móvil abre el menú nativo de compartir.
- Vista previa al compartir: `functions/xpacios/gemelo/ver/[[path]].js` escribe en el servidor `<title>`, descripción, `og:*` y `twitter:*` del gemelo (los robots de WhatsApp/LinkedIn no ejecutan JS). Imagen: `/xpacios/gemelo/og?id=<id>` (`functions/xpacios/gemelo/og.js`) sirve la foto o plano publicado; sin foto, 302 a la tarjeta genérica. Lógica común: `functions/xpacios/gemelo/_compartir.js`. Test: `xpacios/gemelo/compartir.test.mjs`.

EN: the viewer's «Share» copies the link, opens WhatsApp/LinkedIn and gives an `<iframe>` embed code (`&embed=1`). The server writes the twin's title, description and Open Graph/Twitter tags; `/xpacios/gemelo/og?id=` serves the published photo or plan as preview image.

## Plantillas por sector / Sector templates (mejora 3, 11-nov-2026)

Paso 1 ofrece «Empieza desde una plantilla»: Tienda de zapatillas, Hamburguesería, Hotel · recepción, Estanco o En blanco, cada una con miniatura 3D. Aplicarla fija el sector y coloca pantallas y muebles típicos (que luego se ajustan en el paso 2); si ya había elementos, pide confirmación. Conserva la foto o plano si ya se subió. Fuente: `PLANTILLAS` en `xpacios/gemelo/gemelo.js`. Nombres genéricos: ninguna marca de cliente (Benny's, Casa Creel, etc. viven en la DMZ de PortAventura).

EN: step 1 offers sector templates (sneaker shop, burger restaurant, hotel reception, tobacconist, blank). Applying one sets the sector and places typical screens and furniture, keeping any uploaded photo or plan.
