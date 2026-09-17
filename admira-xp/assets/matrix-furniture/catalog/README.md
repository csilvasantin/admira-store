# Catálogo de muebles para Matrix

Esta carpeta contiene **172 renders transparentes: 43 muebles × 4 orientaciones**. Son imágenes derivadas de los modelos editables de Best mediante Blender. Sirven para añadir piezas del inventario a la composición de Matrix; no son recortes ni reconstrucciones fotográficas del mobiliario de la imagen original de Avenida Admira.

## Procedencia

La identidad y el número estable de cada pieza proceden de `inventario/registry.json`. El nombre y la huella se conservan desde el catálogo y los manifiestos de Best.

| Números | Fuentes editables, desde la raíz del repositorio |
| --- | --- |
| 1 · Mostrador | `inventario/assets/mostrador/counter-interpreted-best.blend` |
| 2–18 · Elementos nativos de Xtanco | `inventario/assets/catalog/NN/best.blend` |
| 19–43 · Interpretaciones del catálogo de Pixeria | `inventario/assets/catalog/NN/best.blend` |

`NN` utiliza dos dígitos. El [manifiesto](manifest.json) enumera las 43 fuentes concretas, su SHA256, su ID, su número y los archivos de las cuatro vistas. Los modelos son interpretaciones de diseño en unidades de cuadrícula sin calibración física. Este paso conserva su procedencia; no incorpora activos nuevos de terceros ni modifica los `.blend`.

## Contrato de integración

Los archivos `01-r0.png` … `43-r3.png` son PNG RGBA8 de 384 × 384 píxeles. Cada `items[]` del manifiesto incluye `number`, `inventoryId`, `name`, `footprint`, `bounds_gltf`, `source`, `sourceSha256` y `views[]`.

Por vista:

| Campo | Significado |
| --- | --- |
| `rotation` | Entero 0–3 que corresponde a `item.rot`, normalizado módulo 4. Es un render diferente del modelo, no un reflejo. |
| `url` | Ruta respecto a `/admira-xp/`. Cargar solo la orientación utilizada. |
| `width`, `height` | Dimensiones del PNG. |
| `anchor` | Coordenadas en píxeles del origen del layout, con origen de imagen arriba a la izquierda. Puede quedar fuera del rectángulo visible de la pieza. |
| `floorCenter` | Proyección del centro horizontal de su volumen sobre altura cero. Permite situar una sombra de contacto independiente. |
| `pixelsPerGridUnit` | Escala ortográfica del render. |
| `projectedBounds` | Límites del volumen proyectado en unidades de cuadrícula, antes del encuadre. |
| `sha256` | Hash del PNG publicado. |

El espacio de Three `(col, altura, row)` corresponde en Blender a `(col, -row, altura)`. La orientación aplica `-rotation × π/2` alrededor de Y en Three y de Z en Blender. La vista elegida ya lleva esa rotación: no hay que volver a rotar el PNG.

Para un destino isométrico compatible, con origen proyectado `(x, y)` y escala `targetPixelsPerGridUnit`:

```js
const scale = targetPixelsPerGridUnit / view.pixelsPerGridUnit;
const left = x - view.anchor[0] * scale;
const top = y - view.anchor[1] * scale;
const width = view.width * scale;
const height = view.height * scale;
```

La proyección fotográfica de Matrix necesita además su calibración de posición y escala local. El manifiesto no sustituye ese registro ni administra colisiones, visibilidad o selección de objetos.

## Reproducción

Desde la raíz del repositorio, con Blender disponible como `blender` en `PATH`:

```sh
blender --background --factory-startup --python-exit-code 1 \
  --python admira-xp/tools/xpacios-blender/render_matrix_catalog.py -- \
  --rotations 0,1,2,3 --size 384 --samples 8 --threads 4
```

Se generaron con Blender **5.2.2 LTS**, Cycles CPU, 8 muestras, reducción de ruido, luces cálidas y una cámara ortográfica de azimut 45° y elevación 20,487315°. El fondo es realmente transparente; no hay plano de suelo ni sombra de suelo incrustada. Las piezas conservan sus propias sombras. El script solo lee los modelos fuente y escribe los PNG y el manifiesto en esta carpeta.

Para revisar únicamente las tres piezas de referencia:

```sh
blender --background --factory-startup --python-exit-code 1 \
  --python admira-xp/tools/xpacios-blender/render_matrix_catalog.py -- \
  --numbers 1,2,43 --rotations 0,1,2,3 --size 384 --samples 8 --threads 4
```

`--root` permite indicar otro checkout y `--output` otra carpeta de destino. La versión de Blender y la plataforma pueden producir diferencias de píxeles; los hashes del manifiesto identifican los archivos efectivamente generados, no prometen identidad binaria entre entornos.

## Verificación

El comprobador portable usa únicamente la biblioteca estándar de Python. Lee directamente PNG, reconstruye su canal alpha y comprueba hashes sin editar imágenes:

```sh
python3 admira-xp/tools/xpacios-blender/check_matrix_catalog.py
```

Puede ejecutarse desde cualquier directorio y admite `--root` y `--catalog`. La validación de la entrega confirmó:

- 43 IDs y números coincidentes con el registro, con cuatro vistas por pieza.
- 172 PNG RGBA8 de 384 × 384, con píxeles transparentes y opacos.
- Ninguna parte opaca toca los bordes del PNG: el encuadre contiene las piezas completas.
- Anchors finitos, escalas positivas y SHA256 correctos para los PNG y las 43 fuentes Blender.
- 14.487.576 bytes en PNG; lote completo renderizado en 332 segundos.

Se inspeccionaron visualmente el mostrador, la estantería, la silla de madera y el sofá Matrix, incluyendo orientaciones traseras. El comprobador debe ejecutarse con Python normal, sin `-O`, ya que sus verificaciones utilizan `assert`.

## Límites

Estos sprites tienen cámara fija y cuatro orientaciones discretas. No permiten órbita libre, cambio de elevación ni iluminación dinámica: para eso se utilizan los modelos GLB/Blender originales de Best. Tampoco contienen profundidad por píxel, de modo que la composición con personas y otros muebles depende del orden de capas y la geometría lógica del escenario. Los recortes originales de Matrix conservan prioridad cuando existe una pieza original segmentada; este catálogo da cobertura a las demás adiciones.
