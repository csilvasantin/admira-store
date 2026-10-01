# Visibilidad de personas — 29 septiembre 2026

HandON: base publicada `279a5f3`, posterior al relevo de Xtanco del 15 de septiembre.
La cafebrería ya tiene barra, mesas, librería, lounge y entrada canónica
`/xpacios/cafebreria/`. Mantiene la restricción anterior a Good; este cambio no
certifica ni habilita Better/Best/Matrix para esa vertical.

En el modo experto:

- `/gente on` y `/gente off`: personal y clientes juntos.
- `/personal on` y `/personal off`: solo los trabajadores.
- `/clientes on` y `/clientes off`: solo los clientes.

Se admiten mayúsculas y minúsculas. Cada orden cambia el grupo indicado;
`/gente off` seguido de `/personal on` deja visibles únicamente los trabajadores.
Son controles de presentación locales: preservan plantilla, visitantes,
simulación, ventas y aforo. Se guardan con la partida. Los viandantes exteriores
y actores especiales conservan sus controles propios.

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
people, simulation and audience counts. Passersby and special actors keep their
own controls.

Bilingual documentation: `/help/cli/`, `/help/#people-tutorial`, in-game `/help`
and manual, onboarding tutorial, `/mcp/` and `/mcp/llms.txt`. MCP embedded help:
`help({"topic":"people"})` or `help({"topic":"personas"})`, resource `xpaceos://help`.
No additional remote-control MCP tools are registered.

Tracking: `DCL-0166cf641d75ffb6afb7deb0` · OraculoMacMini.

## Panel experto / Expert panel

Arrastra el tirador superior para ajustar la altura. Los dos separadores verticales reparten el ancho entre comandos, controles operativos y vistas con Local view. Se guardan las medidas en este navegador. Con el separador enfocado usa las flechas; doble clic o Inicio restablece los anchos. Ocultar/Mostrar controla sólo Local view; la tercera columna y el selector de vistas siguen visibles. La información de Better, Best y Matrix (vista, cámara, estado y reloj) aparece en la tercera columna de Experto, debajo del selector Good/Better/Best/Matrix. Los rótulos, brújula y marcos permanentes desaparecen del Xpacio. En Matrix, Abrir incidencia y Vista inicial también están en Experto; el editor se abre al solicitarlo.

Drag the top handle to adjust height. The two vertical dividers distribute width between commands, operational controls and views with Local view. Sizes are saved in this browser. Focus a divider and use arrow keys; double-click or Home resets column widths. Hide/Show toggles only Local view; the third column and view selector remain visible. Better, Best and Matrix information (view, camera, status and clock) appears in the third Expert pane, below the Good/Better/Best/Matrix selector. Permanent labels, compass and frames no longer cover the Xpacio. In Matrix, Open incident and Reset view also live in Expert; the editor opens on demand.

Por defecto las tiendas empiezan con /gente OFF: personal y clientes ocultos hasta activarlos. Se conserva una elección explícita guardada en la partida.

Stores default to /people OFF: staff and customers stay hidden until enabled. An explicit choice saved in the game is preserved.
