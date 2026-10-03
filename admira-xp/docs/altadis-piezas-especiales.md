# Altadis · propuesta de las 3 piezas propias (solo modelos gratuitos)

Misión FLT-101401 (encargo #4940) · 3-oct-2026 · NeoMacMini · MacMini. **Propuesta, no producida.**
Formatos de `admira-studio/adaptaciones/altadis-18.json` (fuente: «ALTADIS Resoluciones y formatos», p. 3):
MP4 · H.264 · 25 fps; Sincro VW y LOGO con la misma duración.

| Pieza | Píxeles | Proporción | Por qué no vale recortar |
|---|---|---|---|
| GONDOLA LED LIMITS-006 | 64 × 384 | 1:6 vertical | 64 px de ancho: un 9:16 recortado se queda en una franja ilegible |
| SHUTTLE STRETCH (sede) | 1920 × 158 | 12:1 | un 16:9 escalado deja 158 px de alto: el producto ocupa un sello |
| LED GRANADA-021 | 1536 × 192 | 8:1 | igual que el Shuttle, y en LED el texto fino desaparece |

## Idea común
No adaptar el spot: **componer una pieza nueva** con tres capas, a partir del material aprobado
de Altadis (logo, packshots, claim):
1. **Fondo** generado o extendido (textura de marca, sin producto).
2. **Producto** recortado limpio.
3. **Movimiento** con ffmpeg (scroll, barrido, entrada del logo) — determinista, sin IA en
   el render final, para que las 3 duren exactamente lo mismo que la pieza LOGO.

Se renderiza a 4× (p. ej. 256 × 1536 para la góndola) y se baja con lanczos al tamaño nativo:
en LED queda mucho más nítido que dibujar directamente a 64 px.

## Modelos (gratuitos, pesos abiertos, uso comercial permitido)
| Paso | Modelo / herramienta | Licencia |
|---|---|---|
| Fondo y extensión lateral (outpainting 12:1 y 8:1) | SDXL inpainting (diffusers) · alternativa FLUX.1-schnell | CreativeML Open RAIL++-M · Apache-2.0 |
| Recorte de packshots | rembg (BiRefNet / U²-Net) | MIT / Apache-2.0 |
| Reescalado de packshots pequeños | Real-ESRGAN | BSD-3 |
| Fondo animado opcional (loop 5 s) | Wan 2.1 T2V 1.3B | Apache-2.0 |
| Montaje, scroll, texto, H.264 25 fps | ffmpeg (`zoompan`, `overlay`, `drawtext`, `scale=flags=lanczos`) | LGPL/GPL |

Evitar FLUX.1-dev y FLUX.1-Fill-dev: su licencia no permite uso comercial.
Dónde: Mac Mini (MLX / mflux para FLUX.1-schnell) o DGX Spark cuando vuelva a estar en línea.

## Pieza a pieza
- **Góndola 64 × 384**: columna vertical: logo arriba (≥ 48 px de alto), un único packshot,
  y un claim de 1-2 palabras en scroll vertical lento. Sin texto de menos de 16 px nativos.
- **Shuttle 1920 × 158**: banda panorámica: fondo de marca extendido con outpainting a 12:1,
  3-4 packshots en fila que entran por la izquierda, logo fijo a la derecha. Altura útil del
  producto ~120 px.
- **LED Granada 1536 × 192**: como el Shuttle pero pensado para LED: colores planos de alto
  contraste, sin degradados finos ni texto de menos de 24 px, y movimiento en pasos enteros
  de píxel para no difuminar.

## Antes de producir
- Material de partida aprobado por Altadis (no generar el producto ni el logo con IA).
- Revisión de cumplimiento de la normativa de publicidad de tabaco en punto de venta antes de
  emitir.
- Prueba en el adaptador de Pixeria (`/adaptaciones/`) con los 3 formatos encendidos.
