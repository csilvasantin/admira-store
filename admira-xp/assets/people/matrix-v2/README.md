# Visitantes compartidos · Matrix, Better y Best

24 personajes ficticios: 16 adultos, 4 mayores y 4 niños. El catálogo canónico es [`visitor-profiles.mjs`](../../../scripts/visitor-profiles.mjs); cada perfil reúne un recorte fotográfico, colores, peinado, ropa, accesorios y proporciones.

| Vista | Representación |
| --- | --- |
| Matrix | Recortes fotográficos transparentes, con tamaño y apoyo de los pies normalizados. |
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
