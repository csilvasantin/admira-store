# Mobiliario Matrix · Avenida Admira

Matrix es una composición 2.5D con cámara fija: sala vacía, piezas independientes y visitantes del Xtanco en ejecución. Comparte las identidades, altas, bajas y cambios del inventario de Good, Better y Best. No es una cámara 3D orbital.

## Uso

En el CLI: `/inventario`, `/inventario eliminar 1`, `/inventario añadir 22`, `/inventario deshacer`. Se acepta número o nombre. Eliminar retira todas las instancias del modelo; deshacer recupera el cambio con sus identidades y posiciones. Los cambios se guardan en el navegador, sin borrar el catálogo.

Cada mueble de Matrix es seleccionable por ratón o teclado y muestra su número. El contador indica las instancias realmente cargadas. Los obstáculos de visitantes se recalculan al variar el mobiliario. `/mudanza` oculta muebles y decoración y deja la sala limpia.

## Representaciones

- `avenida-furniture-atlas-v1.png`: atlas fotográfico RGBA, 1586 × 992. Piezas originales conservadas sobre transparencia. `matrix-photo-pieces.mjs` define recortes SVG independientes; el archivo fuente no se modifica al añadir o quitar muebles.
- `catalog/`: 43 modelos Blender renderizados desde cuatro orientaciones reales, 172 PNG transparentes de 384 × 384. Se carga únicamente la orientación utilizada. Véase su README para reproducción y validación.
- Las piezas de la escena original usan sus recortes fotográficos en orientación inicial. El resto del catálogo y los giros usan renders Blender; el acabado entre ambos puede diferir.
- Suelo y paredes proceden de `../best-xtanco-avenida-admira-mudanza-20260915.png`. Lámparas de techo y cuadros impresos permanecen como decoración arquitectónica; no se inventan registros de inventario para ellos.

`matrix-floor.mjs` calibra las cuatro esquinas de esta sala. Muebles y visitantes utilizan esa misma proyección del layout actual. La altura de los modelos Pixeria respeta el valor de la escena. No se modifica la simulación ni la geometría del inventario para componer la imagen.

## Apoyos y oclusión

`matrix-photo-pieces.mjs` registra `ground`: puntos de apoyo de zócalos, patas y bases de maceta medidos sobre el lienzo de diseño de 1600 × 1000. En bases rectangulares, la esquina posterior oculta se infiere de las tres visibles. Son datos de colocación; los píxeles del PNG no se modifican. `matrix-furniture.mjs` centra estos apoyos sobre la huella física y reduce uniformemente la fotografía hasta contenerlos, considerando la escala y el espejo finales. La altura de una vitrina o el follaje de una planta nunca se utilizan como anchura de colisión.

La estantería tiene una corrección declarativa de espejo porque el eje largo de su fotografía era opuesto al de la huella nativa 1 × 2. Si una orientación o edición exigiría reducir la fotografía por debajo del 60 % de su tamaño anterior, se usa la vista Blender correspondiente. Los giros siempre utilizan las cuatro vistas Blender; las piezas de pared conservan su calibración de montaje.

La profundidad de un sólido se ordena por el borde frontal de su huella proyectada. Una persona cuyos pies están detrás queda ocluida por el mueble; quienes pasan por delante se dibujan por encima. La navegación usa la huella del inventario y el margen corporal, incluso mientras una imagen está cargando. El DOM expone `data-furniture-floor-zone` y `data-furniture-depth-y` para comprobar la composición.

Pruebas: `node --test admira-xp/scripts/matrix-furniture.test.mjs admira-xp/scripts/best-live-people.test.mjs`. Se reconstruyen las coordenadas de apoyo desde el recorte SVG y su transformación CSS, comprobando contención con desplazamientos, escalas y espejos. Calibración y movimiento: misión Yokup #224 (`DCL-f148d38193c01721ee69b785`).

## Procedencia del atlas

Generado con la herramienta integrada `image_gen` de Codex, el 15 de septiembre de 2026. No se usó la CLI de ImageGen ni una clave API del proyecto. Referencia: `../best-xtanco-avenida-admira-framelock-20260915.png`.

Prompt exacto (una generación):

> Use case: background-extraction. Asset type: one transparent compositing atlas for an interactive store inventory. Edit this exact image by removing ONLY all architecture, walls, window frames, street, floor, text street plaque and background. Retain EVERY movable piece of furniture, device, lamp, potted plant, wall poster and decor in its EXACT original position, scale, lighting and camera perspective on the same 8:5 canvas. This is NOT a rearranged product sheet. Preserve the left checkout counter, separate magazine rack, center manager desk/chair, DJ console, both rear shelving units, back low cabinet, vending fridge, central digital advertising totem, foreground ticket kiosk, plants, gold lamps, wall display posters and air conditioning unit. Preserve their original colors and fine photorealistic details. All voids and all floor pixels between or beneath the pieces must be genuinely transparent alpha, not painted white/black/checkerboard. Keep disconnected objects at their original coordinates. No shadows or floor patches; cut contours cleanly. Do not add objects, people, text, labels or scenery. Output ONE transparent PNG with all retained objects aligned with the reference, suitable for compositing onto the existing empty-room plate.

El resultado se copió sin transformación al atlas de este directorio. Se verificó el canal alfa y se revisó la composición en el navegador. Los recortes son aproximaciones fotográficas; las superficies ocultas en la referencia se representan con Blender al girar la pieza.

Misión Yokup: `DCL-62027ba4aea5648aa1872ace` (#208).
