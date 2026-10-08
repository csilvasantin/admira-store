# Visibilidad de personas — 29 septiembre 2026

> **Vigente desde el 8 de octubre de 2026 / Current since 8 October 2026:** People ON
> por defecto en todos los Xpacios / People ON by default in every Xpace. Ver / see
> [Contrato vigente · 8 octubre 2026](#contrato-vigente--8-octubre-2026--current-contract--8-october-2026).
> Las secciones del 3 y 4 de octubre conservan el contrato anterior (OFF) como histórico /
> the 3–4 October sections keep the previous OFF contract as history.

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

Del 3 al 8-oct-2026 (histórico): todos los Xpacios empezaban con /people OFF (/gente OFF): personal, clientes, viandantes y personajes especiales humanos ocultos. /people on los activa; /personal y /clientes permiten activar sólo su grupo. Se conservan personas, aforo, simulación y elecciones explícitas guardadas. Los robots y los equipos IoT mantienen sus controles. Good, Better y Best comparten colisiones físicas de personas y robots; una ruta cerrada espera. La vinculación con equipos físicos y la telemetría IoT sigue pendiente.

From 3 to 8 Oct 2026 (history): all Xpaces defaulted to /people OFF (/gente OFF): staff, customers, passersby and special human characters stay hidden. /people on enables them; /staff and /customers enable only their own group. People, audience counts, simulation and explicit saved choices are retained. Robots and IoT devices keep their controls. Good, Better and Best share physical collisions for people and robots; a closed route waits. Physical equipment binding and IoT telemetry remain pending.

## Contrato anterior · 3 octubre 2026 / Previous contract · 3 October 2026 (sustituido el 8-oct / superseded on 8 Oct)

ES: El estado compartido es `G.peopleVisibility`: `staff`, `customers`, `passersby` y `specials` son false por defecto. `/people on|off` y `/gente on|off` controlan las cuatro categorías. `/staff` y `/customers` sólo cambian su grupo. Las partidas antiguas reciben OFF para los campos ausentes y conservan los true explícitos. Good filtra el dibujado y los clics; Better, Best y Matrix reciben los mismos actores filtrados desde `life-snapshot.mjs`. Cafebrería autónoma ya entrega `actors:[]`; los Xpacios heredados con Aforo mantienen su entrada desactivada. Los registros de cámaras, sus imágenes, las pantallas, MetaHuman y Unitree mantienen sus controles. No se borran personas ni se cambia su simulación. La navegación de actores usa el mapa físico compartido de Good, Better y Best; consulta actor-collision.md. La vinculación IoT con equipos reales sigue pendiente.

EN: Shared state is `G.peopleVisibility`: `staff`, `customers`, `passersby` and `specials` default to false. `/people on|off` and `/gente on|off` control all four categories. `/staff` and `/customers` change only their own group. Old saves receive OFF for missing fields and retain explicit true choices. Good filters rendering and hit targets; Better, Best and Matrix receive the same filtered actors from `life-snapshot.mjs`. Standalone Cafebrería already supplies `actors:[]`; legacy Xpaces with Occupancy keep their entry disabled. Camera records and images, screens, MetaHuman and Unitree keep their controls. No person is deleted or their simulation changed. Actor navigation uses the shared physical map in Good, Better and Best; see actor-collision.md. IoT binding to real equipment remains pending.

Implementación / Implementation: `admira-xp/index.html` (`defaultPeopleVisibility`, `executePeopleVisibilityCommand`, `initGame`, `loadGame`, human draw functions), `admira-xp/scripts/life-snapshot.mjs`. Ayuda real / Real help: https://mcp.admira.store/help — topic `people`.

## Colisiones vigentes · 4 octubre 2026 / Current collisions · 4 October 2026

ES: En Good, Better y Best, las personas y robots del interior usan el mismo mapa físico: perímetro, puertas, arquitectura y envolventes de las mallas de los muebles. Se comprueba el cuerpo completo y cada tramo del recorrido. Una ruta cerrada espera y se recalcula cuando cambia el espacio; no atraviesa el obstáculo ni registra entrada o salida sin llegar al destino correcto. La recuperación de una partida o de un actor cubierto por un mueble conserva su componente accesible; si queda lleno, se oculta temporalmente y reaparece al existir una posición válida. People seguía OFF por defecto (hasta el 8-oct; ahora ON) y conserva elecciones guardadas. Matrix aplica este mapa a sus actores heredados conservando fotografía y proyección. La conexión con robots físicos, stock real y telemetría IoT sigue pendiente.

EN: In Good, Better and Best, interior people and robots use the same physical map: perimeter, doors, architecture and furniture mesh envelopes. The full body and every swept movement segment are checked. A closed route waits and is recalculated when the space changes; it cannot bypass an obstacle or complete an entry or exit without reaching the correct destination. Save recovery or furniture covering an actor retains its reachable component; if full, the actor stays temporarily hidden and reappears when a valid position exists. People remained OFF by default (until 8 Oct; now ON) and retains saved choices. Matrix applies this map to its legacy actors while preserving its photograph and projection. Connection to physical robots, real stock and IoT telemetry remains pending.

Contrato / Contract: [actor-collision.md](actor-collision.md); topic MCP `actor-collision`.

## Contrato vigente · 8 octubre 2026 / Current contract · 8 October 2026

ES: Orden de Carlos: «saca a los personajes de xpaceos a caminar». Con las durezas y
colisiones ya validadas (4-oct, [actor-collision.md](actor-collision.md)), todos los
Xpacios vuelven a arrancar con People ON: personal, clientes, viandantes y personajes
especiales humanos caminan al abrir cualquier Xpacio, en Good, Better, Best y Matrix.

- Estado: `G.peopleVisibility = {staff, customers, passersby, specials}`. Partida nueva
  (`initGame`) → las cuatro categorías en `true`.
- Elección explícita: `/gente|/people`, `/personal|/staff` y `/clientes|/customers`
  `on|off` funcionan igual que antes y además marcan `elegido: true`. Una partida con
  esa marca conserva exactamente sus valores al guardar (`xtanco_save`) y cargar.
- Migración: las partidas guardadas entre el 3 y el 8-oct almacenaban `false` en los
  cuatro grupos aunque nadie lo eligiera. Una partida sin `elegido: true` (esas, las
  anteriores al 3-oct o un estado ausente o corrupto) vuelve a ON al cargarla.
- Presentación: Good (`peopleGroupVisible`) y Better/Best/Matrix (`life-snapshot.mjs`)
  sólo ocultan un grupo con un `false` explícito; un grupo ausente se muestra.
- Ejemplo: `/gente off` → `/personal on` deja sólo al personal; la elección queda
  marcada y se respeta al restaurar la partida. `/gente on` vuelve a mostrar a todos.
- Todas las entradas (catálogo, `?autostart=`, entrada directa Matrix de Starbucks,
  Xpace Creator, kiosco y QA) crean la partida con `initGame`, así que arrancan ON.
  Ningún flujo de entrada fuerza OFF.
- Sin personas por diseño, sin relación con este contrato: el editor Distribuir y el
  modo mudanza (el snapshot recibe `editor`/`moving`) y la Cafebrería autónoma
  `/xpacios/cafebreria/`, que aún no tiene actores simulados. Unitree, cámaras,
  pantallas, MetaHuman e IoT mantienen sus controles.
- No cambia: aforo, simulación, identidades, ventas ni registros de cámara. No se
  añade ninguna herramienta MCP remota.

EN: Carlos's order: "take the xpaceos characters out for a walk". With hardness maps
and collisions validated (4 Oct, [actor-collision.md](actor-collision.md)), every
Xpace starts with People ON again: staff, customers, passersby and special human
characters walk as soon as any Xpace opens, in Good, Better, Best and Matrix.

- State: `G.peopleVisibility = {staff, customers, passersby, specials}`. A new game
  (`initGame`) → all four groups `true`.
- Explicit choice: `/people|/gente`, `/staff|/personal` and `/customers|/clientes`
  `on|off` behave as before and also set `elegido: true`. A save carrying that marker
  keeps its exact values across save (`xtanco_save`) and load.
- Migration: saves written between 3 and 8 Oct stored `false` for all four groups even
  though nobody chose it. A save without `elegido: true` (those, pre-3-Oct saves, or a
  missing or corrupt state) returns to ON when loaded.
- Presentation: Good (`peopleGroupVisible`) and Better/Best/Matrix (`life-snapshot.mjs`)
  hide a group only on an explicit `false`; a missing group is shown.
- Example: `/people off` → `/staff on` leaves staff only; the choice is marked and kept
  when the save is restored. `/people on` shows everyone again.
- Every entry (catalogue, `?autostart=`, Starbucks direct Matrix entry, Xpace Creator,
  kiosk and QA) builds the game with `initGame`, so it starts ON. No entry flow forces OFF.
- No people by design, unrelated to this contract: the Distribute editor and moving mode
  (the snapshot receives `editor`/`moving`) and standalone Cafebrería
  `/xpacios/cafebreria/`, which has no simulated actors yet. Unitree, cameras, screens,
  MetaHuman and IoT keep their controls.
- Unchanged: occupancy, simulation, identities, sales and camera records. No remote MCP
  tool is added.

Notas para agentes / Agent notes: `loadGame()` aplica la migración pero hoy ningún flujo
lo llama al abrir un Xpacio (cada apertura pasa por `initGame`); si se conecta la
restauración de `xtanco_save`, la regla anterior ya está cubierta por pruebas /
`loadGame()` applies the migration but no flow calls it when an Xpace opens today (every
opening goes through `initGame`); if `xtanco_save` restoration is wired up, the rule above
is already covered by tests.

Implementación / Implementation: `admira-xp/index.html` (`peopleGroupVisible`,
`defaultPeopleVisibility`, `executePeopleVisibilityCommand`, `initGame`, `loadGame`),
`admira-xp/scripts/life-snapshot.mjs`. Pruebas / Tests:
`node --test admira-xp/scripts/people-visibility.test.mjs admira-xp/scripts/life-snapshot.test.mjs admira-xp/scripts/xtanco-visual-command.test.mjs`.
Ayuda / Help: `/admira-xp/help.html#people`, `/help/#people-tutorial`,
`/help/cli/#people-default`, `/mcp/#people-visibility`, `/mcp/llms.txt`; ayuda MCP real /
real MCP help `https://mcp.admira.store/help`, topic `people` (repo `csilvasantin/xpaceos-mcp`).
