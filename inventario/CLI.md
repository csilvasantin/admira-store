# Mobiliario en el CLI del Xtanco

Desde el menú avanzado (▤), «Inventario · Añadir / eliminar · CLI» abre el CLI y enumera los 43 modelos. En Better y Best, las piezas colocadas utilizan sus modelos Blender. Matrix comparte los mismos 43 modelos y comandos: Avenida Admira muestra cada pieza en una capa independiente, con cámara fija y sin cambiar de modo al añadir o retirar muebles.

```
/inventario
/inventario añadir 43
/inventario añadir silla de madera
/inventario eliminar 43
/inventario eliminar silla de madera
/inventario deshacer
```

En Matrix, pulsa un mueble para consultar su número y nombre. La vista usa recortes y renders transparentes en 2.5D; la cámara no orbita.

El número siempre identifica el modelo, no la posición de una fila. Los nombres ignoran tildes, mayúsculas y signos; una coincidencia parcial única se acepta. Si «sofá» coincide con varios modelos, se muestran los números y nombres completos y no se modifica nada.

Añadir coloca una unidad. Primero recupera una unidad retirada de ese modelo, con su identificador original. Si no hay ninguna, crea una instancia nueva. Se comprueba la huella completa, la ocupación por otros muebles y personas y se reserva el borde de entrada del Xtanco. Para LED, TFT y aroma se busca anchura libre en la pared. Si no existe hueco, el comando informa y no escribe. Una pieza recuperada vuelve a su sitio si está libre; en caso contrario se reubica. Puede moverse después mediante el editor.

Eliminar retira todas las unidades de ese modelo del Xpacio activo. El catálogo, los archivos Blender y la numeración permanecen intactos. Deshacer revierte el último cambio del inventario. Al deshacer una retirada se respeta la posición original; si ha sido ocupada, se propone añadir para encontrar otro hueco.

El estado se guarda en este navegador. El registro compartido conserva altas, retiradas y la última acción; la distribución se persiste en el slot actual y su respaldo. Las otras pestañas aplican deltas sin reemplazar movimientos ajenos. Un fallo al guardar revierte los registros. Los comandos se interceptan antes del bot, de los logs remotos y de Telegram. No modifican equipos físicos.

Pruebas: `command.test.mjs`, `placement.test.mjs` y el arnés del CLI real en `admira-xp/index.html`. Misión DCL-45730b4b77ac334c3c742acd · Hoy #183.
