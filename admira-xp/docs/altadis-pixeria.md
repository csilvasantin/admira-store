# Altadis · Adaptador Pixeria · demo neutra

Encargo #5038 · demo Pixeria en nueve estancos Altadis.
Encargo #4967 · demo del Adaptador con estancos Altadis.
Encargo #4969 · exclusión de contenido competidor en Altadis.

## ES · Cómo usar la demo

Abre https://altadis-adaptador.xpaceos.pages.dev/admira-xp/?autostart=xtanco&loc=altadis-bcn-001&adaptado=1&quality=good&lang=es

En «Recorrido del circuito», alterna **Sin adaptar / Adaptado con Pixeria**. En el mostrador horizontal, Sin adaptar muestra la pieza vertical completa con bandas negras; Adaptado con Pixeria reproduce su MP4 1920×1080 con fondo desenfocado. La pantalla del escaparate conserva 9:16 con MP4 1080×1920. Usa anterior/siguiente o [ y ] para recorrer los nueve locales. El modo elegido se conserva, incluida la vuelta del noveno al primero. El indicador cuenta las pantallas que realmente están reproduciendo. La ventana mantiene movimiento, cambio de tamaño y reapertura desde Avanzado → Ventanas.

Reserva autorizada por Carlos: naturaleza sin marca del Stock de Pixeria, referencia 1783975679206-g3u9ej. El motor `assets/signage-perfiles.js` y `scripts/signage-bateria.mjs --fondo-desenfocado` de Pixeria generó y comprobó las dos adaptaciones. No se generaron laterales con IA ni se contrataron modelos. El original pequeño se escala; no se crea detalle nuevo. Los MP4 servidos son silenciosos. La demostración es reproducción en gemelos; no envía contenido a equipos físicos. Dos formatos cubren 18 destinos registrados; no hay LED o videowall registrados.

La campaña oficial de Altadis sigue pendiente. Cuando Carlos avise, Lucas dejará sus composiciones en `/workspace/altadis-estancos/neutro/` de GrokBotBox. Se sustituirán las asignaciones por estanco y pantalla tras comprobar contenido, medidas reales y reproducción.

## Contrato de ficheros / File contract

Manifiesto público: `/admira-xp/altadis/demo.json`; copia compatible `/altadis/demo.json`. `locations[].surfaces[]` declara `screen`, `w`, `h`, `files.original`, `files.adapted` y `expectedFiles`. Cada entrada real contiene `url`, `width` y `height`. `expectedFiles` describe los destinos de futuras composiciones oficiales; nunca dispara descargas. La reserva utiliza archivos compartidos, pero cada pantalla tiene su propia asignación y puede recibir una composición diferente.

URL HTTPS o relativa al sitio. Adaptado debe coincidir exactamente con w/h de la pantalla. Se comprueba otra vez videoWidth/videoHeight al cargar: un archivo equivocado se oculta y muestra error. Null produce marcador gris, sin campaña alternativa. Original conserva su relación completa. Recarga tras cambiar asignaciones. El manifiesto técnico de los MP4 está en `/admira-xp/altadis/media-manifest.json`.

## EN · Usage and limits

Open the demo URL. Original / Adapted with Pixeria compares the complete vertical source with the native output for each screen. The landscape version fills its frame using a blurred background derived from the source; portrait stays 9:16. Previous/next and [ / ] navigate all nine shops and preserve mode. The playback counter reflects running video elements. Existing window, Expert, inventory and brand controls are retained.

This is a neutral, silent nature reserve from Pixeria Stock. Two native formats serve 18 assigned surfaces. Upscaling adds no new detail; blurred fill is not generative AI. No physical delivery or proof of play is asserted. The official Altadis campaign remains pending. Replace each shop/screen assignment only after validating the official files and metadata. Expected paths never download anything. Wrong dimensions fail to an error or neutral marker.

## Minitutorial / Mini tutorial

Guion para el generador oficial https://www.admiranext.com/tiktok/:
1. Dónde: demo Altadis, ventana Recorrido del circuito.
2. Cómo: alterna Sin adaptar / Adaptado con Pixeria; pulsa anterior o siguiente.
3. Resultado: cada pantalla reproduce su formato; el mostrador cambia de bandas negras a fondo desenfocado, el escaparate mantiene 9:16.
4. Límite: reserva neutra, sin audio, sin IA de pago ni entrega física; campaña oficial pendiente.

El generador produce una animación explicativa, no una grabación real de pantalla. Registrar aquí y en Yokup el enlace del vídeo exportado únicamente tras verificar el archivo.
