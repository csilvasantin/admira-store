# Puerta Cam en directo sin abrir IEU · Sneakers Store

Carlos, 22-oct-2026. En la 360 de la Sneakers Store (`/xpacios/sneakerstore/`), la tarjeta **Puerta Cam** sobre la
puerta de Entrada y su **Ver stream** reproducen el directo de la calle sin abrir `digitaltwin.ieu.ai` ni compartir
pestañas.

## Cómo funciona

1. IEU emite enlaces firmados al directo de una cámara con un token de su hub de permiso **«Ver cámaras»**
   (`POST /hub/streams`, «solo Bearer camera_view»). Cada enlace vale 12 h sin sesión en cualquier reproductor; revocar
   el token los corta todos.
2. Ese token vive solo en el servidor de admira.store, como secreto `IEU_CAMERA_TOKEN` del proyecto de Pages
   `admira-store`. Nunca llega al navegador ni a un chat.
3. `functions/xpacios/sneakerstore/puerta-cam-stream.js` entrega el enlace solo a quien ha entrado en admira.store con
   permiso (perímetro de AdmiraNeXT) y solo a peticiones de la propia web.
4. La ventana lo reproduce con hls.js (HLS nativo en Safari). IEU sirve con CORS abierto, así que el segmentado puede
   analizar el mismo vídeo sin volver a preguntar.
5. Sin sesión, la ventana ofrece «Iniciar sesión para ver el directo». Sin token o sin cámara configurada, queda la
   pestaña de IEU compartida (`puerta-cam.mjs`), como en el segmentador.

## Puesta en marcha

1. En IEU, con tu cuenta: «Tus tokens» → **Crear token** → permiso **Ver cámaras**. IEU lo enseña una sola vez.
2. Guárdalo como secreto del proyecto (el valor se pide sin mostrarlo):
   `npx wrangler pages secret put IEU_CAMERA_TOKEN --project-name admira-store`
   o en Cloudflare → Workers & Pages → admira-store → Settings → Variables and Secrets → Add → Secret.
   Tras guardarlo, hace falta un despliegue nuevo (cualquier merge en `main`).
3. Con sesión de administrador, abre `https://www.admira.store/xpacios/sneakerstore/puerta-cam-stream?diagnostico=1`.
   Enseña los campos que pide `/hub/streams` y las herramientas del MCP de IEU con sus listados de oficinas y cámaras,
   sin token ni enlaces firmados. Con eso se rellena `PUERTA_CAM_REQUEST` (o la variable `IEU_PUERTA_CAM_STREAM`).

## Pruebas

`node --test xpacios/sneakerstore/*.test.mjs tests/puerta-cam-stream.test.mjs`
