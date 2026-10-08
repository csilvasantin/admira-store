# Botellero 2D → 3D e imagen → vídeo / Water rack 2D → 3D and image → video

## Español

Experto: /convertir 2da3d abre la foto original del botellero y su modelo 3D ITIL interactivo, compuesto con 13 botellas. Arrastra para girar; rueda o +/− para zoom; flechas para rotar. Reutiliza la conversión existente, sin regenerarla. En PREVIOS, una imagen muestra Crear vídeo · 10 s. También puedes elegirla en Crear contenidos → Crear vídeo → Imagen de origen; describe los detalles y mensajes que debe ampliar y elige horizontal (iPad) o vertical (pantallas). Generar usa esa imagen de Stock y crea 10 segundos a 720p. La barra refleja Preparar → Crear → Stock → Listo, sin porcentajes estimados del proveedor. Reintentar recupera el mismo trabajo; cambiar texto, imagen, idioma o formato inicia otro. El vídeo conserva la referencia de la imagen y se guarda en Stock antes del previo; crear no emite. Sin imagen sigue disponible el vídeo desde texto de 8 s. La oferta del agua se compone en vertical 720×1280 para starbucks-wall-01–06 y horizontal 1280×720 para starbucks-ipad-01, con la cantidad actual y el 10 % hasta agotarse.

## English

Expert: /convertir 2da3d opens the original rack photograph beside its interactive ITIL 3D model composed with 13 bottles. Drag to rotate; scroll or +/− to zoom; arrow keys rotate. It reuses the existing conversion without regenerating it. An image in PREVIEWS offers Create video · 10 s. You can also select it under Create media → Create video → Source image; describe the details and messages to expand, then choose landscape (iPad) or portrait (screens). Generate uses that Stock image and creates 10 seconds at 720p. The bar shows Prepare → Create → Stock → Ready, without estimated provider percentages. Retry recovers the same job; changing the brief, source image, language or format starts another. The video retains source-image provenance and is saved to Stock before preview; creating does not broadcast. Text-only 8-second video remains available. The water offer is composed as portrait 720×1280 for starbucks-wall-01–06 and landscape 1280×720 for starbucks-ipad-01, with current quantity and 10% off until sold out.

## Contrato compartido / Shared contract

```json
{
  "command": "/convertir 2da3d",
  "itil": "PDG103-BOT-01",
  "photo": "/inventario/starbucks/photos/sb-water-rack.webp",
  "model": "/inventario/assets/catalog/50/good.glb",
  "composition": 13,
  "wall": {
    "aspect": "9:16",
    "width": 720,
    "height": 1280
  },
  "ipad": {
    "aspect": "16:9",
    "width": 1280,
    "height": 720
  },
  "image_video": {
    "endpoint": "POST /admira-xp/advertising-video",
    "fields": [
      "text",
      "language",
      "requestId",
      "imageId",
      "aspect"
    ],
    "duration": 10,
    "resolution": "720p",
    "source": "Stock image ID, validated in R2",
    "progress": [
      "preparing",
      "pending",
      "archiving",
      "done"
    ],
    "recover": "GET /admira-xp/media-job?requestId=<UUID>",
    "paid": true,
    "broadcast": false
  }
}
```

ES: /convertir 2da3d compara el activo existente del botellero; no es un generador arbitrario de modelos. La composición local de 13 conserva el catálogo fuente. El prompt pide ampliar el relato visual sin inventar precios ni afirmaciones; revisa el resultado generado antes de Lanzar. Se mantiene sesión, origen, identidad derivada en servidor, UUID idempotente, archivo Stock y reintento sin regeneración. No se modifica stock comercial ni se emite en equipos físicos.

EN: /convertir 2da3d compares the existing rack asset; it is not an arbitrary 3D model generator. The local 13-bottle composition preserves the source catalogue. The prompt requests more visual detail without inventing prices or claims; review generated output before Launch. Existing session, origin, server-derived identity, idempotent UUID, Stock archival and recovery without regeneration remain. No commercial inventory changes or physical broadcasts.

Sources: scripts/water-conversion.mjs, video-prompt.js, expert-previews.js, pos-water.mjs; functions/_media-access.js; pixer-worker/src/xpace-media.mjs and xaiVideoStartHandler private invocation. The public legacy Pixeria image clip remains 5 seconds; the private XpaceOS image video requests 10 seconds.
