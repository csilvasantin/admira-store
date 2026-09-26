# Visitantes compartidos · Matrix, Better y Best

24 personajes ficticios: 16 adultos, 4 mayores y 4 niños. El catálogo canónico es [`visitor-profiles.mjs`](../../../scripts/visitor-profiles.mjs); cada perfil reúne un recorte fotográfico, colores, peinado, ropa, accesorios y proporciones.

| Vista | Representación |
| --- | --- |
| Matrix | Hojas de caminata fotográficas (8 fotogramas + reposo, de frente y de espaldas): se hornean desde el cuerpo GLB de Best con la variante de cada perfil y se pasan a acabado hiperrealista con grok-imagine (una rejilla 3×3 por vista para que las 9 poses sean la misma persona; croma recortado, fotogramas realineados al render y silueta del render como molde). Los recortes fotográficos quedan como reserva. Ver [`../matrix-walk`](../matrix-walk/manifest.json) y `tools/walk-sprites/`. |
| Better | Cuerpos articulados de estilo 16 bits con el peinado, accesorios, colores y proporciones del perfil. |
| Best | Cuatro cuerpos GLB animados existentes con variantes de peinado, accesorios, materiales y proporciones. No son 24 anatomías modeladas por separado. |

El asignador conserva el perfil de cada visitante mientras exista su actor en la simulación. Los cambios entre Matrix, Better y Best comparten la misma asignación. Las nuevas entradas prefieren los perfiles compatibles menos utilizados; pueden repetirse cuando se agota el conjunto compatible. La edad y el género existentes se respetan; las paletas del juego y sus contadores no se modifican. Personal, robots y personajes especiales conservan sus representaciones propias.

## Imágenes y prompts

Generadas el 15 de septiembre de 2026 con la herramienta integrada **imagegen**, sin CLI, sin fotografías de personas reales como referencia. Cada archivo conserva los bytes originales y el canal alpha generado. Los cuatro PNG son RGBA de 1536 × 1024, con seis personajes por atlas en tres columnas y dos filas.

- [Atlas A](atlas-a.png) · [prompt exacto](atlas-a.prompt.txt)
- [Atlas B](atlas-b.png) · [prompt exacto](atlas-b.prompt.txt)
- [Atlas C](atlas-c.png) · [prompt exacto](atlas-c.prompt.txt)
- [Atlas D](atlas-d.png) · [prompt exacto](atlas-d.prompt.txt)

[`atlas-layout.json`](atlas-layout.json) contiene los límites de cada figura derivados de su alpha, con margen de tres píxeles. [`visitor-atlas-layout.mjs`](../../../scripts/visitor-atlas-layout.mjs) publica esos mismos datos al navegador. El recorte ocurre mediante CSS; no se han retocado ni reescalado los PNG. Un error de carga mantiene los recortes anteriores como alternativa e informa del estado.

## Verificación

`node --test admira-xp/scripts/visitor-profiles.test.mjs admira-xp/scripts/best-live-people.test.mjs admira-xp/scripts/life-snapshot.test.mjs admira-xp/scripts/life-scene.test.mjs admira-xp/scripts/best-person-asset.test.mjs`

Se comprueban reparto, estabilidad entre vistas, compatibilidad con la simulación, límites de recorte, carga alternativa, las 24 variantes GLB y liberación de recursos. La revisión visual incluye las 24 variantes en Better y Best, además de clientes en el Xtanco Matrix en funcionamiento.

## Profundidad y dureza en Matrix (24-sep-2026)

Los visitantes se ordenan contra cada mueble que solapan en pantalla con la regla isométrica de su caja de suelo (delante si pasan su col o fila máxima, detrás si no llegan a la mínima), no por la esquina delantera del mueble. La base dibujada de cada mueble, medida sobre las imágenes con `tools/walk-sprites/measure-hardness.js`, queda dentro de su caja lógica más la holgura de 0,24 casillas de la navegación compartida: [`../../matrix-hardness-audit.json`](../../matrix-hardness-audit.json).

## Personas de Pixeria en los cuatro modos (24-sep-2026)

Una persona del Anonimizador de pixeria.com entra en la tienda con su NPC 8-bit (Good). Si el envío trae además la persona realista, el worker `api.admira.store` (`/twin/persona*`) fabrica una sola vez su paquete: ficha (sexo, edad, paleta, peinado, ropa) que Better 16 y Best 32 aplican a sus cuerpos, y rejillas de caminata que visten el cuerpo base (`matrix-walk/grid-*.jpg`, `base-*.webp`) para Matrix 64. `scripts/pixeria-personas.mjs` dirige los pasos, recorta el croma y alinea cada fotograma con el cuerpo base en el navegador.
