# Fase 2 · Escanear productos reales Starbucks (tazas y vasos)

Objetivo: que las tazas de la estantería 47 sean el producto real, no una interpretación. Con 1–2 tazas basta para el piloto.

## Qué necesitamos de cada taza

- **Fotos:** 60–80 por taza con el móvil (cámara principal, sin zoom, sin modo retrato ni filtros). Mejor en RAW/ProRAW o JPG de máxima calidad.
- **Tres vueltas completas** alrededor de la taza, de unas 20–25 fotos cada una, girando unos 15° entre foto y foto:
  1. a la altura de la taza;
  2. unos 30° por encima;
  3. casi cenital (60–70°), para el interior y el borde.
- **Base:** dale la vuelta y repite una vuelta corta (10–12 fotos) para la base.
- **Detalles:** 5–6 fotos de cerca del logotipo, el asa y el borde.
- **Solape:** cada foto debe compartir dos tercios con la anterior. La taza debe ocupar al menos el 60 % del encuadre y estar siempre enfocada.

## Cómo preparar la sesión

- **Luz:** suave y uniforme. Un día nublado junto a una ventana o dos lámparas con difusor. Sin sol directo, sin flash.
- **Brillos:** la cerámica brilla y eso confunde la reconstrucción. Si se puede, una capa muy fina de spray mate de escaneo (se evapora en unas horas, tipo AESUB) o polvo de talco. Si no, polarizador en la lámpara y en el móvil.
- **Fondo:** mesa con un papel de periódico o un mantel con dibujo (ayuda al cálculo), nunca un fondo blanco liso. Sin moverse la taza durante cada vuelta: mejor gira tú alrededor que usar un plato giratorio.
- **Escala:** pon una regla o una tarjeta de crédito al lado en algunas fotos para medir el tamaño real.
- **Color:** una foto con una carta de color o, como mínimo, una hoja blanca junto a la taza para equilibrar el blanco.

## Qué hacemos nosotros con las fotos

1. Fotogrametría (RealityScan o Metashape) para la malla y las texturas reales a 4K.
2. Gaussian Splatting (Polycam o Postshot) con las mismas fotos para la versión más fotográfica en la web.
3. Limpieza en Blender: retopología, mapas PBR (color, rugosidad, normal) y 3 niveles de detalle: web ligero, gemelo y Unreal Nanite.
4. Sustituimos la taza interpretada por la escaneada en la pieza 47, conservando sus IDs `47-P…`.

## Cómo enviarlas

Sube cada taza en una carpeta (`taza-1`, `taza-2`) a Drive o pásalas por AirDrop al Mac Mini. Unos 300–600 MB por taza.

Alternativa rápida: la app **Polycam** o **RealityScan** en el iPhone guía la captura y exporta las fotos; envíanos las fotos originales, no solo el modelo.
