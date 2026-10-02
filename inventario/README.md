# Inventario · mobiliario de la Xperience

Página pública `/inventario/`, con 18 tipos nativos y catálogo `furni` de Pixeria (25 piezas en la copia inicial). No requiere iniciar el simulador para explorar las piezas. La creación original continúa en https://www.pixeria.com/crear/ con su propia autenticación.

## Representaciones

8/16/32 designan estilos. Nativos: vistas interpretadas desde la geometría compartida de `life-scene.mjs`, con raster pixelado, materiales simplificados y PBR respectivamente. No se afirma que la miniatura Good sea una captura del sprite legacy. Pixeria: sprite original (separación de cuatro caras cuando el registro lo indica) y relieves de vóxeles derivados a dos resoluciones. No se inventa la geometría posterior ni se presenta una reconstrucción hiperrealista.

Una única instancia WebGL genera miniaturas bajo demanda; las imágenes remotas se limitan al endpoint de assets de Admira. Fallos de CORS/carga se indican. La copia inicial permite consultar el catálogo aunque falle `/stock/list`; Actualizar consulta hasta 200 registros y avisa si el servidor limita la respuesta. No se descargan ni republican binarios de Pixeria.

## Identidad y visibilidad

`native:<type>` y `pixeria:<stock-id>` identifican modelos. Los IDs del layout identifican ejemplares. Ocultar uno no oculta otros ejemplares ni otros Xpacios. El juego conserva el layout lógico y publica una copia local; Good y el snapshot de Better/Best consumen el mismo filtro de presentación.

Se persiste en localStorage por Xpacio y se propaga entre pestañas del mismo origen. La visibilidad no es sincronización multiusuario ni cambia dispositivos, recorridos o colisiones. La distribución base se identifica como tal hasta recibir un layout del gemelo. El gemelo puede recibir distribuciones de su servicio existente; esas variaciones no son cambios del inventario.

Better y Best operativos corresponden al Xtanco. Las vistas de catálogo existen para todos los tipos; Supermercado/Creator conservan sus capacidades Good actuales. La CMDB patrimonial anterior se enlaza sin migrar ni sobrescribir datos.

## Best editable

Al abrir con `inventory=1`, o al tener una instancia oculta o retirada, Best monta objetos independientes del snapshot usando el renderer PBR compartido. Mantiene la cámara alineada, controles generales y simulación. La referencia fotográfica y personas recortadas se conservan en Best normal cuando no se solicita edición ni hay piezas ocultas. Best editable se identifica como PBR y no como el escenario fotográfico. No implica paridad de las 30 funciones del catálogo MCP.

## Verificación

`node --test inventario/*.test.mjs admira-xp/scripts/*.test.mjs xpacios/lab/assets.test.mjs homepage-twin-cta.test.mjs mcp/*.test.mjs help/funcionalidades/*.test.mjs`

QA navegador: ficha Mostrador, Good/Better/Best, ocultar/restaurar (Best 16 → 17 objetos visibles, ID counter y posición 1,6 conservados), búsqueda de sofá Pixeria y separación de sus cuatro caras. Rutas externas de creación requieren autorización propia. No añade credenciales, tools MCP ni llamadas de pago.

Misión de entrega: DCL-05d05f2d3c78975819d24430 · proyecto xpaceos.

## CLI e identificación permanente

La ruta canónica es `/inventario/`; `/inventari/` redirige conservando query y fragmento. `registry.json` reserva números permanentes: 1 = Mostrador, 2 = Estantería, hasta 43. La galería y el CLI cargan el mismo registro. No se renumera al filtrar, refrescar metadatos o retirar un ejemplar. Las altas futuras deben añadir una identidad con el siguiente número libre; nunca reutilizar números anteriores. Actualizar desde Pixeria refresca las piezas registradas sin asignar números temporales a las nuevas.

En el CLI de la Xperience o `window.__xtExec`:

- `/inventario`: enumera todos los modelos y la cantidad de ejemplares en el Xpacio activo.
- `eliminar el 1` (también `/inventario eliminar 1`): retira todos los ejemplares del modelo 1 del Xpacio actual. Conserva el modelo en el catálogo.
- `/inventario deshacer`: restaura la última eliminación, con posiciones originales, sin sobrescribir IDs ya ocupados ni deshacer otros cambios del editor.

La eliminación se guarda **en este navegador y por Xpacio**, con un registro de retiradas que impide que los layouts de fábrica vuelvan a insertar las piezas. A diferencia de ocultar, sí retira del layout lógico y reconstruye la ocupación del suelo. Los cambios y el undo se propagan a pestañas del mismo origen. No es baja global multiusuario ni borrado del asset Pixeria; no modifica dispositivos reales. Se conserva la antigua clave de visibilidad para migrar sin perder preferencias.

El compositor y el dispatcher interceptan estos comandos antes de Telegram, IA, memoria y registro de comandos. Los errores de sintaxis, carga o almacenamiento permanecen locales. La escritura de los slots del layout es local y no invoca el espejo de publicación de Pixeria. La eliminación queda sin aplicar si falla el guardado; el adaptador revierte slots y escena ante un fallo. Undo persiste tras recargar y se limita a la última eliminación del Xpacio.

QA de esta entrega: 43 filas CLI, `eliminar el 1`, recarga con Mostrador = 0, undo = 1, búsqueda Estantería = 02 y Best editable. Misión DCL-e60b74a2900b00147b614708 · #163.

## Piloto Blender · Mostrador 1

`/inventario/#mostrador` muestra el GLB completo en WebGL, con órbita por arrastre/teclado, frontal, trasera, lateral, zoom, malla y descarga del maestro Blender. Los tres perfiles se generan con Blender 5.2.2 LTS y el script `admira-xp/tools/xpacios-blender/build_counter.py`. La revisión añade puertas, tiradores y bisagras posteriores e identidad `native:counter`, número 1.

Los assets actuales viven en `inventario/assets/mostrador/`; el antiguo laboratorio queda como referencia histórica. Las tres miniaturas del mostrador se generan desde estos GLB (Good rasteriza a 88 px). Better carga el GLB intermedio y Best editable el completo. Good en el simulador conserva su renderer clásico. El TPV 3D reutiliza la superficie del reproductor compartido; no se crea otro reproductor.

El GLB se cuelga del nodo lógico existente, aplicando posición, orientación y escala una sola vez. Las retiradas CLI y los filtros de visibilidad siguen controlando el mismo ID. Si la pieza tarda o falla, permanece la versión procedural; una respuesta tardía nunca reinserta una pieza retirada. El visor mantiene un caché acotado a tres GLB y no necesita CDN ni extensiones de Blender. Los recursos de cada visor se liberan al cerrarlo.

Diseño interpretado, pendiente de valoración humana; las proporciones de casilla todavía no están calibradas con medidas de un mueble real. 8/16/32 son estilos, no profundidades de color ni niveles de precisión geométrica.

Verificado: importación GLB y apertura `.blend` en Blender para los tres perfiles; materiales empaquetados, 110 objetos de malla, geometría posterior y exclusión de cámaras/luces de estudio. QA navegador: parte posterior, malla, Best con modelo Blender, CLI eliminar 1 (17→16) y deshacer (16→17). Misión DCL-fe628ccda18b44ba84ba5717 · #169.

## Marco cuadrático / Quadratic frame

Marco cuadrático Admira: por defecto solo se ve la barra horizontal superior. Opciones a la izquierda, Avanzados a la derecha y Experto/CLI abajo empiezan replegados; las vistas del inventario están dentro de Opciones. ☰ y ◨ muestran u ocultan paneles; ⌘ abre el CLI y Escape los cierra. En móvil se usan los mismos botones. Opciones reúne vistas, búsqueda y filtros; Avanzados reúne cámara, malla, descargas, ayuda y conexiones.

Admira quadratic frame: only the horizontal top bar is visible by default. Options on the left, Advanced on the right and Expert/CLI at the bottom start collapsed; inventory views live inside Options. ☰ and ◨ toggle panels; ⌘ opens the CLI and Escape closes them. Mobile uses the same buttons. Options contains views, search and filters; Advanced contains camera, wireframe, downloads, help and connections.

En las páginas del inventario, /inventario sin argumentos abre el catálogo; /inventario con argumentos conserva la ejecución en el gemelo de XpaceOS. Desde Yokup se indica abrir el gemelo. Navegación: /inventario, /starbucks, /referencias, /ref PG103-001, /equipo PDG103-BOT-01, /xpaceos, /yokup y /ayuda. La unidad seleccionada conserva su código ITIL al abrir Yokup o volver a XpaceOS. Los candidatos enlazan el portal sin inventar fichas ITIL. Añadir, eliminar o mover muebles se realiza en la Xperience; las fichas patrimoniales se editan en Yokup con sus permisos existentes.

On inventory pages, /inventario without arguments opens the catalogue; arguments retain execution in the XpaceOS twin. From Yokup it prompts opening the twin. Navigation: /inventory, /starbucks, /references, /ref PG103-001, /equipment PDG103-BOT-01, /xpaceos, /yokup and /help. A selected unit retains its ITIL code when opening Yokup or returning to XpaceOS. Candidates link to the portal without inventing ITIL records. Add, remove or move furniture in the Xperience; edit lifecycle records in Yokup with existing permissions.

Contrato: https://www.xpaceos.com/admira-xp/docs/inventory-frame.md · Misión DCL-1be5b59b234e7be48381c4ee.
