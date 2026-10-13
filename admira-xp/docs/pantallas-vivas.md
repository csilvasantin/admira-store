# Pantallas vivas / Live screens · Matrix · Starbucks

Neo · MacStudio · 13-oct-2026. Encargo de Carlos: «mejorar la integración entre los contenidos y su representación en el gemelo digital».

URL estable / Stable URL: https://www.xpaceos.com/admira-xp/?quality=matrix&loc=alsea-sbux-021&project=starbucks&circuit=alsea_starbucks

admira.store: https://www.admira.store/admira-xp/?quality=matrix&loc=alsea-sbux-021&project=starbucks&circuit=alsea_starbucks

## ES

### Qué hace

En la vista Matrix del Starbucks, el contenido deja de ser un rectángulo pegado sobre la foto:

1. **Luz de pantallas.** Cada pantalla de pared, el TPV y el iPad arrojan sobre la sala la luz de lo que emiten. El color cambia con el contenido, en directo. Una incidencia abierta tiñe de rojo; una pantalla apagada no da luz.
2. **Cristal.** Un reflejo tenue y una viñeta dentro de la apertura calibrada, para que la pantalla asiente en la fotografía.
3. **Fundido entre piezas.** Al terminar una pieza se retiene su último fotograma y se funde con la siguiente. Antes había un corte a negro mientras cargaba.
4. **Ficha «En emisión».** Al pasar el ratón por una pantalla aparece qué pieza emite, de qué playlist, su posición (2/3), su número de Stock, el tiempo y la pieza siguiente. Todas las pantallas que comparten esa pieza se marcan a la vez.
5. **Llegadas.** Cuando una pieza entra fuera del orden normal (vista previa, salto, playlist nueva, orden por MCP), la ficha aparece sola unos segundos y la luz de esa pantalla da un pulso.
6. **Entrar en la pantalla.** Doble clic en una pantalla: la cámara se acerca a ella. Otro doble clic: vuelve a donde estaba.

### Cómo se usa

- **Ratón:** pasar por una pantalla, el TPV o el iPad muestra su ficha. Cerca del altavoz muestra la del hilo musical.
- **Experto → botones:** «Luz de pantallas» y «En emisión» (deja todas las fichas a la vista).
- **CLI:** `/emision` alterna las fichas · `/emision on|off` · `/emision luz on|off` · `/emision estado`. En inglés: `/onair`, `/onair light on|off`, `/onair status`.
- La elección se guarda en este navegador (`xpaceos.matrix.screen-light.v1`). Por defecto: luz encendida y fichas solo al pasar el ratón.

### Qué dice la ficha

| Estado | Significado |
|---|---|
| En emisión | La playlist asignada se reproduce. |
| En pausa | La playlist está detenida en esa pieza. |
| Vista previa | Contenido temporal (arrastre, cápsula o `matrix_preview`); no es la programación. |
| Reacción | Una regla IF·THEN·DO THAT ocupa la pantalla. |
| App en pantalla | Gestor de colas del iPad o cesta del TPV. |
| Incidencia | Hay una tarjeta de incidencia sobre la pantalla. |
| Apagada | La incidencia apagó la pantalla. |
| Sin señal / Sin contenido | Error de vídeo o playlist vacía. |

Las pantallas se agrupan por reloj compartido y por zona: «Pantallas 1–6», «TPV», «iPad». En Sincro IA la ficha indica una pieza distinta por pantalla con reloj común.

### Contrato y límites

- **Solo lectura.** No cambia playlists, asignaciones, relojes, mapeo ni el estado MCP. No añade herramientas MCP ni llamadas de red. No lee píxeles del vídeo.
- **Local.** Representa lo que reproduce este navegador. No confirma emisión en una pantalla física.
- **Recorte respetado.** La luz y las fichas viven fuera del player; dentro solo van el cristal y el fotograma retenido, por debajo de incidencias, reacciones y cesta.
- **Compatibilidad.** `/layout`, Asignar contenidos, arrastre desde Pixeria, incidencias, `/sincro`, Sincro IA, marca blanca y las demos siguen igual. Con `/layout` activo las fichas se ocultan.
- **Movimiento reducido.** Sin fundido ni pulsos; la luz se actualiza despacio.
- **Para agentes:** `window.XpaceMatrixOptions.screenLight.state()` devuelve `{light,onAir,hover,focused,groups[]}` y `.set({light,onAir})` cambia las preferencias.

### Entregado y pendiente

- Entregado: los seis puntos de arriba, en la vista Matrix del Starbucks.
- Good, Better y Best reproducen las playlists desde «Playlists en escena» (`playlists-en-escena.md`). Pendiente: la duración de las imágenes sigue fija en 30 s.
- Pendiente: la ayuda del servidor MCP real (`xpaceos-mcp`) no incluye aún el tema `pantallas-vivas`.

### Código y pruebas

`admira-xp/scripts/screen-light.mjs` · `screen-light.css` · `screen-light.test.mjs` (11 pruebas). Enganche en `matrix-panorama.mjs` y comando en `xtanco-visual-command.mjs`.

## EN

### What it does

In the Starbucks Matrix view, content is no longer a rectangle pasted on the photograph:

1. **Screen light.** Each wall screen, the POS and the iPad cast the light of what they play onto the room. The colour follows the content live. An open incident glows red; a powered-off screen casts no light.
2. **Glass.** A faint reflection and a vignette inside the calibrated aperture, so the screen sits in the photograph.
3. **Crossfade between items.** When an item ends its last frame is held and blended into the next one. Previously there was a cut to black while loading.
4. **“On air” card.** Hover a screen to see which item it plays, from which playlist, its position (2/3), Stock number, time and the next item. Every screen sharing that item is outlined together.
5. **Arrivals.** When an item arrives outside the normal order (preview, jump, new playlist, MCP command) the card shows by itself for a few seconds and that screen's light pulses.
6. **Move into the screen.** Double-click a screen and the camera moves in. Double-click again to return.

### How to use it

- **Mouse:** hover a screen, the POS or the iPad for its card. Near the speaker it shows the background music card.
- **Expert → buttons:** “Screen light” and “On air” (keeps every card visible).
- **CLI:** `/onair` toggles the cards · `/onair on|off` · `/onair light on|off` · `/onair status`. Spanish: `/emision`, `/emision luz on|off`, `/emision estado`.
- The choice is saved in this browser (`xpaceos.matrix.screen-light.v1`). Defaults: light on, cards on hover only.

### Card states

On air · Paused · Preview (temporary content, not the schedule) · Reaction (an IF·THEN·DO THAT rule owns the screen) · App on screen (iPad queue manager or POS basket) · Incident · Off · No signal / No content. Screens are grouped by shared clock and physical zone: “Screens 1–6”, “POS”, “iPad”.

### Contract and limits

- **Read-only.** It changes no playlist, assignment, clock, mapping or MCP state. No new MCP tool, no network call, no video pixel reads.
- **Local.** It represents what this browser plays. It does not confirm delivery to a physical screen.
- **Clipping respected.** Light and cards live outside the player; only the glass and the held frame are inside, below incidents, reactions and the basket.
- **Compatibility.** `/layout`, Assign content, Pixeria drag, incidents, `/sync`, AI sync, white label and demos are unchanged. Cards hide while `/layout` is active.
- **Reduced motion.** No crossfade or pulses; the light updates slowly.
- **For agents:** `window.XpaceMatrixOptions.screenLight.state()` returns `{light,onAir,hover,focused,groups[]}`; `.set({light,onAir})` changes the preferences.

### Delivered and pending

- Delivered: the six items above, in the Starbucks Matrix view.
- Good, Better and Best play playlists since “Scene playlists” (`playlists-en-escena.md`). Pending: image duration remains fixed at 30 s.
- Pending: the live MCP server help (`xpaceos-mcp`) does not yet include the `pantallas-vivas` topic.
