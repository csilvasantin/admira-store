# 01.- Un espacio, cuatro representaciones

Actualización: misión #208. Matrix permite editar el mobiliario de Avenida Admira por capas; Best mantiene la tienda 3D.

| Nivel visual | Entrada | Estado y correspondencia |
| --- | --- | --- |
| 01.- Good · 8 bits | Experto ⌘ / selector / CLI `good` | Canvas clásico; dueño de simulación, layout y controles. |
| 02.- Better · 16 bits | Mismos accesos / CLI `better` | Mismo snapshot de entidades. Cámara `mapped` por defecto; `Explorar 3D` no altera Good. |
| 03.- Best · 32 bits | Mismos accesos / CLI `best` | Tienda 3D en vivo, mobiliario Blender y personajes humanos con animación. |
| 04.- Matrix · Avenida Admira | Mismos accesos / CLI `matrix` / `visual=matrix` | Composición 2.5D por capas y cámara fija, con mobiliario editable de los 43 modelos del inventario compartido y visitantes del mismo snapshot vivo. CLI añadir/eliminar/deshacer. |

Los números anteriores pertenecen a los **niveles visuales**, no renumeran las funciones estables XP-F01–XP-F30. 8/16/32 son etiquetas artísticas, no profundidad de color ni una promesa de paridad.

## 02.- Registro geométrico Good → Better

Good proyecta `(col,row)` como `X=ox+(col-row)*tileW/2`, `Y=oy+(col+row)*tileH/2`.
Better interpreta `(x,y,z)=(col,altura,row)`. `life-camera.mjs` deriva azimut `π/4`, elevación `asin(tileH/tileW)` (20,487° para80×28), escala `tileW/√2` y frustum desde el origen y tamaño lógico de Good.

El HUD superior, el menú Experto inferior y el CLI son el chasis permanente de los cuatro modos. Better, Best y Matrix sustituyen solo los píxeles del rectángulo exacto de `#c`, siguiendo sus cambios de posición y tamaño mediante observadores. No usan un modal ni desmontan la interfaz de Good.

Se contiene el mismo rectángulo lógico en la superficie disponible, sin deformación. Pruebas con Three real registran puntos de suelo, alturas y anclas de actores, no igualdad píxel a píxel entre sprites2D y mallas interpretadas3D.

Cada entrada en Better vuelve a `mapped`. Girar, desplazar, acercar, Planta o Detalle son exploración libre. `Comparar con Good` restaura inmediatamente el registro. No se rota el canvas Good ni se crea otra simulación para imitar la cámara libre.

## 03.- Referencia Best y producción futura

`../assets/best-xtanco-mapped-20260915.png` fue generada con la herramienta integrada de imagen usando una captura de Better en `mapped` como referencia geométrica y la propuesta aprobada como referencia de materiales. El prompt se conserva junto al PNG. Es una aproximación artística, no una reconstrucción3D ni un asset registrado por puntos. La propuesta original se conserva en `best-xtanco-concept-20260915.png`.

Matrix conserva la cámara de Avenida Admira y usa únicamente `../assets/best-xtanco-avenida-admira-mudanza-20260915.png` como sala de fondo. `matrix-furniture.mjs` añade los muebles como capas independientes del mismo layout: recortes fotográficos calibrados donde corresponden y renders transparentes de Blender para los 43 modelos, con cuatro orientaciones por modelo. No se vuelve a superponer la fotografía amueblada completa. El número identifica siempre el modelo del registro; cada ejemplar conserva su ID. `/inventario añadir 1` coloca o recupera una unidad de Mostrador, `/inventario eliminar mostrador` retira sus unidades y `/inventario deshacer` revierte la última operación. Los cambios se comparten con Good/Better/Best y se guardan en este navegador.

`best-live-people.mjs` consume el mapa de dureza de la simulación y las huellas de los muebles visibles en Matrix. Las capas individuales de personas y muebles comparten orden de profundidad. Los adultos y los niños conservan sus recortes fotográficos, con variación determinista de escala. Esta composición 2.5D permite editar el mobiliario desde la cámara fija; no ofrece órbita ni reconstruye toda la escena en 3D.

`/mudanza` activa una capa de presentación vacía y reversible. Good deja de pintar mobiliario, personas, dispositivos y decoración; Better recibe el mismo espacio con `layout: []`, `actors: []` y arquitectura sin fixtures; Matrix oculta las capas de mobiliario y personas y conserva la sala limpia de fondo, placa 1504×940 creada mediante edición de la referencia. La simulación, el layout real, los mapas de dureza, las posiciones y los contadores continúan intactos. Una segunda ejecución de `/mudanza` restaura todos los objetos en sus posiciones anteriores.

Para un Best operativo, Blender/Unreal deberán consumir el mismo layout y los mismos IDs de entidades, junto al contrato de cámara; los assets deberán verificarse contra anclas y medidas. La capa actual sí sigue aproximadamente las posiciones de las personas, pero la imagen de fondo no cumple ese contrato de runtime ni permite afirmar sincronización exacta del escenario. Las30 áreas funcionales de Best siguen `planned` en `/mcp/funcionalidades.json`.

## 04.- Navegación y seguridad

Un único router y una única preferencia versionada gobiernan todos los selectores. Cada cambio conserva un fantasma local de la vista saliente y funde su opacidad con la entrante durante 820 ms; donde existe, también se usa la API nativa View Transitions. Los cambios cancelan la apertura anterior; `requestId` y `AbortSignal` impiden que resultados tardíos reabran una vista. Matrix confirma éxito después de cargar el fondo y los muebles y montar la capa de visitantes; Better y Best después de preparar su renderer. `good`, `better`, `best`, `matrix`, `/mudanza` y `/modo …` son comandos locales: no se envían a Telegram ni ejecutan herramientas MCP. Escape vuelve a Good. `pagehide` libera recursos sin borrar la preferencia.
