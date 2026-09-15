# Atributos de avatares presentes

El panel Instore cuenta los elementos actuales de `G.custs` y lee exclusivamente
los atributos ficticios `look.gender` y `look.age`. Comparte el panel existente
en Good, Better y Best, con su arrastre, cierre y selección Instore/DooH.
No usa imágenes, `LIVE_FACE`, cámara, apariencia del sprite, `npcSegment` de
Pixeria ni fichas de socios. No escribe atributos, playlists ni reglas.

Cada avatar presente pertenece a una categoría de cada reparto, incluido
«Sin dato»: la suma de género y, por separado, la suma de edad coinciden con
«Presentes ahora». No son entradas acumuladas, impactos ni personas reales.

`look.gender`: `m` → Hombre, `f` → Mujer; cualquier otro valor → Sin dato.
La franja del avatar usa esta convención explícita para las etiquetas existentes:

| `look.age` | Franja asignada |
| --- | --- |
| `nino` | <18 |
| `joven`, `adulto` | 18–60 |
| `senior` | >60 |
| Número finito ≥0 | <18, 18–60 o >60 según su valor |
| Ausente, inválido o etiqueta no reconocida | Sin dato |

Las categorías de texto no contienen una fecha de nacimiento ni permiten
deducir una edad exacta: esta tabla define su agrupación en la simulación. No
reclasifica usuarios importados ni transforma un dato desconocido en «adulto».
El campo `age` del propio viandante, fuera de `look`, mide tiempo de animación y
no se utiliza. DooH mantiene únicamente los agregados reales de Puerta Cam.

Pruebas: `node --test admira-xp/scripts/avatar-audience.test.mjs admira-xp/scripts/impact-segments.test.mjs`.
