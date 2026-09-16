# Best: producción del gemelo fotorealista

Best sustituirá progresivamente los modelos de Better por piezas creadas en Blender a partir del local real. Ambos deben mostrar el mismo snapshot, personas, mobiliario, reproducción e interacciones. Better sigue disponible y aporta la representación de cualquier pieza cuyo modelo Best aún no esté validado.

Estado de navegación: **Avanzado → Best · 32 bits** y el selector dentro de las vistas abren una **vista previa conceptual estática**, con regreso a Good o Better. La preview no sigue el snapshot ni implementa las funciones operativas de Best. Los 30 IDs del catálogo conservan su estado `planned`; el resto de este documento describe la producción futura y el piloto de assets existente.

## Punto de partida comprobado

- `life-scene.mjs` construye geometría procedural con Three local; todavía no hay un cargador GLB de mobiliario en esta escena.
- `life-snapshot.mjs` conserva actores y metadatos del juego; el layout contiene `id`, `type`, `label`, `col`, `row`, `sx`, `sy`, `rot`, `flipX`, `fp`, `ph` y, para paredes, `wallY`.
- Las posiciones y `fp` están en casillas. `ph`, `wallY` y `wallHeight` proceden de la geometría de pantalla convertida a unidades del mundo. **No hay una equivalencia casilla–metro autenticada.**
- Al comenzar no había fuentes `.blend` ni modelos GLB de este mobiliario en el árbol inspeccionado. Ahora existe el piloto interpretado documentado abajo; aún no se carga dentro del juego.
- `xpacios/xtanco-barcelona/index.html` y `xpacios/xtanco-valencia/index.html` se describen como «render interpretado del plano». Sus cotas compartidas no acreditan medidas de ninguno de los dos locales; no se usarán como levantamiento.
- El 14-09-2026 se verificó Blender **5.2.1 LTS** en el MacBookPro16, ejecutando `/Applications/Blender.app/Contents/MacOS/Blender --version`. El trabajo se realiza por CLI en procesos aislados con `--background --factory-startup --python-exit-code 1`; no necesita activar un servidor MCP ni modificar la sesión gráfica del usuario.

## Niveles de presentación

Good **8-bit**, Better **16-bit** y Best **32-bit / hiperrealista** son nombres artísticos de calidad, no profundidades de color, arquitecturas de CPU ni una promesa de fidelidad física. La vista Better actual continúa siendo 3D estilizado. El propósito del pipeline es representar los mismos IDs, medidas verificadas, objetos y funciones con distintos niveles de geometría y materiales; no mantener tres simulaciones divergentes.

En la consola del gemelo de XpaceOS, `/modo good`, `/modo better` y `/modo best` acceden al router público. Los aliases `/modo 8`, `/modo 16` y `/modo 32` apuntan a esos mismos niveles. Una apertura correcta de Best devuelve `ok:true`, `preview:true` y `availability:"preview"`: confirma una vista estática, no un gemelo fotorealista operativo. `/render` conserva sus estilos del motor clásico y no es el selector de niveles nuevos. Better permite comparar una cámara mapped con Good o explorar 3D de forma independiente; alinear cámaras no recupera los controles pendientes.

Unreal 5.8.0 también está instalado en este equipo y contiene el plugin experimental `ModelContextProtocol`, desactivado por defecto. Se ha inspeccionado su disponibilidad, **no conectado ni activado**. Blender produce fuentes editables y exportaciones; Unreal puede ser otro destino de render. Un MCP es el canal de automatización, no el modelo, su fidelidad ni su publicación en la web.

Referencias de automatización: [Blender CLI](https://docs.blender.org/manual/en/5.2/advanced/command_line/arguments.html), [Python en Unreal Editor](https://dev.epicgames.com/documentation/unreal-engine/scripting-the-unreal-editor-using-python). La versión local y la ejecución real prevalecen sobre instrucciones genéricas de versiones anteriores.

## Entrada necesaria para el primer mueble

Identificar el local concreto y confirmar qué mostrador corresponde al `id` activo. El layout de fábrica incluye `counter` (`type: counter`, etiqueta «Mostrador+Caja+PC»), pero el layout guardado puede contener otras instancias.

Recoger fotografías frontal, posterior, laterales, superior y de conjunto; detalles de cantos, juntas, tiradores, zócalo, acabado y equipo de caja. Añadir una referencia de escala visible y evitar confundir reflejos o sombras con textura del material.

Registrar medidas verificadas de ancho, fondo y altura; espesor y vuelo de la encimera; zócalo, huecos, cajones y ubicación del TPV. Asociar cada medida a su foto o documento de origen. Registrar lo que no se pudo medir como pendiente, sin completar dimensiones por intuición.

Para colocar el modelo en metros dentro del gemelo harán falta dimensiones comprobadas del local y puntos de referencia del layout. Hasta calibrar esa relación, cualquier encaje en casillas será un ajuste visual identificado como tal, no una réplica métrica.

## Piloto: mostrador completo

1. Preparar una ficha de referencias y medidas para una única instancia real. Separar mostrador, encimera, TPV y accesorios cuando tengan materiales o interacciones propias.
2. Crear un bloqueo simple en Blender y contrastar silueta, proporciones, alturas y posición del equipo con las referencias antes de añadir detalle.
3. Modelar cantos con biseles, juntas y piezas visibles; reservar el detalle fino para normales y texturas cuando no cambie la silueta.
4. Crear UV y materiales PBR: color base, rugosidad, metalicidad, normales y oclusión cuando proceda. Mantener la iluminación separada del color base; incluir procedencia y licencia de las texturas.
5. Conservar el `.blend` editable con materiales, referencias y colección de exportación. Generar un GLB optimizado por pieza, con transformaciones y normales comprobadas; evitar exportar cámaras o luces de prueba por accidente.
6. Integrar sólo esa pieza en Best, medir su coste en el navegador y compararla con Better y con las fotografías. Continuar con el siguiente mueble tras resolver las diferencias del piloto.

## Piloto producido el 14-09-2026

El pipeline reproducible está en [`../tools/xpacios-blender/`](../tools/xpacios-blender/README.md). Genera desde una configuración común tres perfiles de detalle del mostrador y ocho conjuntos editables: cuerpo, encimera, cajón de caja, TPV, terminal de pago, impresora, rótulo y accesorios. El GLB contiene una superficie `screen_tpv_main` para una futura conexión al player compartido; no reproduce contenido ni modifica la simulación.

| Perfil del asset | Triángulos | GLB |
| --- | ---: | ---: |
| good | 2.982 | 320.568 bytes |
| better | 20.966 | 1.346.000 bytes |
| best | 40.022 | 3.488.148 bytes |

Cada fuente Blender se abrió de nuevo y cada GLB se reimportó: jerarquía semántica, textos editables, texturas empaquetadas, pivot y exclusión del estudio comprobados. El render principal usa EEVEE y es una imagen fija. Los archivos y su ficha están en `/xpacios/lab/`; los perfiles del asset **no sustituyen todavía** los modos públicos del juego. Sus proporciones son de diseño en casillas sin calibración métrica, no medidas reales.

## Estructura propuesta para piezas validadas del local

```text
assets/best/<local-confirmado>/
  manifest.json
  counter/<asset-id>/
    source/counter.blend
    references.md
    textures/...
    web/counter.glb
    review/...
```

`references.md` documentará local, instancia, fotografías autorizadas, medidas y dudas pendientes. El `.blend` y las texturas fuente son los originales de trabajo; `web/` contiene exportaciones reproducibles. Decidir almacenamiento de fuentes pesadas antes de incorporarlas a Git; el navegador no debe descargarlas.

El futuro manifiesto asociará cada `layoutId` validado con un `assetId`, archivo GLB, revisión, estado de validación, pivot de anclaje, orientación, límites del modelo y conversión de unidades. Las dimensiones medidas conservarán unidad y procedencia. Estos campos son una propuesta, no metadatos que ya existan en el snapshot.

## Contrato de integración

- Resolver el modelo por la instancia `layoutId`. Reutilizar un `assetId` en varios muebles sólo cuando sean realmente el mismo modelo; compartir `type` no demuestra que tengan dimensiones iguales.
- Mantener el padre seleccionable `furniture:<id>` y sus metadatos. El GLB será hijo de ese padre, con un ajuste de unidades y pivot explícito; la carga asíncrona no creará otra entidad del juego.
- Aplicar las posiciones `col/row` y las transformaciones de la escena actual una sola vez. Suelo: X=columna, Z=fila, Y=altura; giro `-rot·π/2`, escala horizontal `sx`, vertical `sy` y `flipX`. No aplicar la proyección 2D a la malla orbital.
- Definir el origen del asset sobre el plano de apoyo y un anclaje compatible con el footprint; verificar orientación después de exportar desde Blender. No duplicar la conversión de ejes ni corregir proporciones físicas con escalas arbitrarias ocultas.
- Para piezas de pared, conservar el contrato específico de `wallY` y las dimensiones ya convertidas; resolver cada tipo al integrarlo para evitar multiplicar escalas por segunda vez.
- Conservar colisiones, navegación, footprint e interacción del juego. Un modelo visual no sustituye esos datos por su bounding box. Si la medida real contradice el layout, registrar la discrepancia y calibrar por separado.
- Conservar pantallas como superficies identificables del modelo; reasignarles la textura compartida del player existente. No incrustar una segunda reproducción ni hornear su contenido dentro de las texturas del mueble.
- Incorporar un cargador glTF compatible con la versión local de Three; cualquier compresión necesitará también su decodificador disponible. Verificar la exportación básica antes de introducir compresión.
- Compartir geometrías y texturas entre instancias compatibles, cargar por necesidad y liberar recursos con su dueño. Ante error de carga, formato incompatible o asset pendiente, mostrar el mueble Better y mantener sus controles operativos.

## Orden después del piloto

| Lote | Tipos presentes en el proyecto | Motivo |
| --- | --- | --- |
| 1 | `counter` | Piloto completo de forma, PBR, escala, carga e interacción. |
| 2 | `shelves`, `wineRack`, `magazines` | Módulos repetibles y productos; validar cada variante real. |
| 3 | `lottery`, `vending`, `manager` | Carcasas, vitrinas y equipos reconocibles. |
| 4 | `djBooth`, `tablet`, `turnKiosk`, `metahuman`, `tft`, `led`, `aroma` | Equipos conectados y superficies vinculadas a funciones existentes. |
| 5 | `plant`, `floorLamp`, `rug`, `door`; arquitectura | Vegetación, iluminación, textiles y envolvente con referencias del local. |

Los elementos `custom` requieren ficha y correspondencia propias. Los personajes conservan inicialmente su representación y estado Better; producir avatares fotorealistas sería una línea de trabajo independiente, no un efecto automático de importar muebles.

## Validación y entrega de cada pieza

Comparar fotografías y renders desde puntos equivalentes: silueta, proporciones, materiales, escala de vetas, desgaste visible y reflejos. En la web, revisar además luz de día/atardecer/noche, encuadre isométrico habitual y acercamiento. Un render Cycles puede servir de referencia artística; WebGL tiene otra iluminación y no garantiza igualdad exacta con Cycles.

Verificar edición de posición, giro, escala y espejo; selección y acción original; circulación de clientes; reproducción única; cambio Better/Best; cierre y reapertura. Probar carga fallida para comprobar el fallback y medir peso transferido, tiempo de carga, memoria GPU, llamadas de dibujo y fluidez en los dispositivos objetivo.

Entregar `.blend`, GLB, texturas, manifiesto, ficha de procedencia, comparativas visuales y resultados de la revisión. Marcar como validadas únicamente las piezas aceptadas contra referencias identificadas; una mezcla de assets en producción y muebles Better debe mostrar su estado real.
