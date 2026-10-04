# Visibilidad de personas — 29 septiembre 2026

HandON: base publicada `279a5f3`, posterior al relevo de Xtanco del 15 de septiembre.
La cafebrería ya tiene barra, mesas, librería, lounge y entrada canónica
`/xpacios/cafebreria/`. Mantiene la restricción anterior a Good; este cambio no
certifica ni habilita Better/Best/Matrix para esa vertical.

En el modo experto:

- `/gente on` y `/gente off`: todas las personas de la escena.
- `/personal on` y `/personal off`: solo los trabajadores.
- `/clientes on` y `/clientes off`: solo los clientes.

Se admiten mayúsculas y minúsculas. Cada orden cambia el grupo indicado;
`/gente off` seguido de `/personal on` deja visibles únicamente los trabajadores.
Son controles de presentación locales: preservan plantilla, visitantes,
simulación, ventas y aforo. Se guardan con la partida. /gente incluye viandantes y personajes especiales humanos; los robots mantienen sus controles.

El compositor, `__xtExec` y `xtAPI.command` usan el mismo manejador.
Los usos anteriores (`/clientes <n>`, `/gente store <n>`, `/personal dashboard`)
conservan su ruta. Canvas Good y snapshots de las otras vistas comparten estado.

Verificación: seis combinaciones en Chrome, entrada real del modo experto,
zonas de clic y snapshot de actores. 385 de 386 pruebas generales pasan;
`anonymizer-launch.test.mjs` tiene el fallo previo `scene is not defined`,
reproducido sin los cambios sobre `279a5f3`.

Seguimiento: Yokup `DCL-44f4acbe2054dd3a0bd435e2` · OraculoMacMini.

## English commands and documentation

`/people on|off` controls both staff and customers; `/staff on|off` controls only
workers; `/customers on|off` controls only customers. These are exact aliases of
`/gente`, `/personal` and `/clientes`, including uppercase ON/OFF. Replies and
validation messages follow the twin language. Old commands keep their behavior.

Try `/people off`, then `/staff on` (staff only), `/customers on` (both),
and `/people on` (restore both). This changes local visibility and preserves
people, simulation and audience counts. /people includes passersby and special human characters; robots keep their controls.

Bilingual documentation: `/help/cli/`, `/help/#people-tutorial`, in-game `/help`
and manual, onboarding tutorial, `/mcp/` and `/mcp/llms.txt`. MCP embedded help:
`help({"topic":"people"})` or `help({"topic":"personas"})`, resource `xpaceos://help`.
No additional remote-control MCP tools are registered.

Tracking: `DCL-0166cf641d75ffb6afb7deb0` · OraculoMacMini.

## Panel experto / Expert panel

Arrastra el tirador superior para ajustar la altura. Los dos separadores verticales reparten el ancho entre comandos, controles operativos y vistas con Local view. Se guardan las medidas en este navegador. Con el separador enfocado usa las flechas; doble clic o Inicio restablece los anchos. Ocultar/Mostrar controla sólo Local view; la tercera columna y el selector de vistas siguen visibles. La información de Better, Best y Matrix (vista, cámara, estado y reloj) aparece en la tercera columna de Experto, debajo del selector Good/Better/Best/Matrix. Los rótulos, brújula y marcos permanentes desaparecen del Xpacio. En Matrix, Abrir incidencia y Vista inicial también están en Experto; el editor se abre al solicitarlo.

Drag the top handle to adjust height. The two vertical dividers distribute width between commands, operational controls and views with Local view. Sizes are saved in this browser. Focus a divider and use arrow keys; double-click or Home resets column widths. Hide/Show toggles only Local view; the third column and view selector remain visible. Better, Best and Matrix information (view, camera, status and clock) appears in the third Expert pane, below the Good/Better/Best/Matrix selector. Permanent labels, compass and frames no longer cover the Xpacio. In Matrix, Open incident and Reset view also live in Expert; the editor opens on demand.

Todos los Xpacios empiezan con /people OFF (/gente OFF): personal, clientes, viandantes y personajes especiales humanos ocultos. /people on los activa; /personal y /clientes permiten activar sólo su grupo. Se conservan personas, aforo, simulación y elecciones explícitas guardadas. Los robots y los equipos IoT mantienen sus controles. Good, Better y Best comparten colisiones físicas de personas y robots; una ruta cerrada espera. La vinculación con equipos físicos y la telemetría IoT sigue pendiente.

All Xpaces default to /people OFF (/gente OFF): staff, customers, passersby and special human characters stay hidden. /people on enables them; /staff and /customers enable only their own group. People, audience counts, simulation and explicit saved choices are retained. Robots and IoT devices keep their controls. Good, Better and Best share physical collisions for people and robots; a closed route waits. Physical equipment binding and IoT telemetry remain pending.

## Contrato vigente · 3 octubre 2026 / Current contract · 3 October 2026

ES: El estado compartido es `G.peopleVisibility`: `staff`, `customers`, `passersby` y `specials` son false por defecto. `/people on|off` y `/gente on|off` controlan las cuatro categorías. `/staff` y `/customers` sólo cambian su grupo. Las partidas antiguas reciben OFF para los campos ausentes y conservan los true explícitos. Good filtra el dibujado y los clics; Better, Best y Matrix reciben los mismos actores filtrados desde `life-snapshot.mjs`. Cafebrería autónoma ya entrega `actors:[]`; los Xpacios heredados con Aforo mantienen su entrada desactivada. Los registros de cámaras, sus imágenes, las pantallas, MetaHuman y Unitree mantienen sus controles. No se borran personas ni se cambia su simulación. La navegación de actores usa el mapa físico compartido de Good, Better y Best; consulta actor-collision.md. La vinculación IoT con equipos reales sigue pendiente.

EN: Shared state is `G.peopleVisibility`: `staff`, `customers`, `passersby` and `specials` default to false. `/people on|off` and `/gente on|off` control all four categories. `/staff` and `/customers` change only their own group. Old saves receive OFF for missing fields and retain explicit true choices. Good filters rendering and hit targets; Better, Best and Matrix receive the same filtered actors from `life-snapshot.mjs`. Standalone Cafebrería already supplies `actors:[]`; legacy Xpaces with Occupancy keep their entry disabled. Camera records and images, screens, MetaHuman and Unitree keep their controls. No person is deleted or their simulation changed. Actor navigation uses the shared physical map in Good, Better and Best; see actor-collision.md. IoT binding to real equipment remains pending.

Implementación / Implementation: `admira-xp/index.html` (`defaultPeopleVisibility`, `executePeopleVisibilityCommand`, `initGame`, `loadGame`, human draw functions), `admira-xp/scripts/life-snapshot.mjs`. Ayuda real / Real help: https://mcp.admira.store/help — topic `people`.

## Colisiones vigentes · 4 octubre 2026 / Current collisions · 4 October 2026

ES: En Good, Better y Best, las personas y robots del interior usan el mismo mapa físico: perímetro, puertas, arquitectura y envolventes de las mallas de los muebles. Se comprueba el cuerpo completo y cada tramo del recorrido. Una ruta cerrada espera y se recalcula cuando cambia el espacio; no atraviesa el obstáculo ni registra entrada o salida sin llegar al destino correcto. La recuperación de una partida o de un actor cubierto por un mueble conserva su componente accesible; si queda lleno, se oculta temporalmente y reaparece al existir una posición válida. People sigue OFF por defecto y conserva elecciones guardadas. Matrix aplica este mapa a sus actores heredados conservando fotografía y proyección. La conexión con robots físicos, stock real y telemetría IoT sigue pendiente.

EN: In Good, Better and Best, interior people and robots use the same physical map: perimeter, doors, architecture and furniture mesh envelopes. The full body and every swept movement segment are checked. A closed route waits and is recalculated when the space changes; it cannot bypass an obstacle or complete an entry or exit without reaching the correct destination. Save recovery or furniture covering an actor retains its reachable component; if full, the actor stays temporarily hidden and reappears when a valid position exists. People remains OFF by default and retains saved choices. Matrix applies this map to its legacy actors while preserving its photograph and projection. Connection to physical robots, real stock and IoT telemetry remains pending.

Contrato / Contract: [actor-collision.md](actor-collision.md); topic MCP `actor-collision`.
