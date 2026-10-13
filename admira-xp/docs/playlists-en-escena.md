# Playlists en escena / Scene playlists · Good · Better · Best · Starbucks

Neo · MacStudio · 13-oct-2026. Encargo de Carlos: «que Good, Better y Best reproduzcan la playlist, no solo Matrix».

URL estable / Stable URL: https://www.xpaceos.com/admira-xp/?quality=best&loc=alsea-sbux-021&project=starbucks&circuit=alsea_starbucks (también `quality=good` y `quality=better`).

admira.store: https://www.admira.store/admira-xp/?quality=best&loc=alsea-sbux-021&project=starbucks&circuit=alsea_starbucks

## ES

### Qué hace

Hasta ahora, en Good, Better y Best las pantallas del Starbucks eran menús dibujados y solo enseñaban contenido si se arrastraba una vista previa. Ahora reproducen la misma programación que Matrix:

1. **Pared, TPV e iPad** reproducen sus playlists, pieza tras pieza y en bucle.
2. **Mismo origen que Matrix:** semilla del repo, playlists gestionadas por MCP (`https://mcp.admira.store/matrix/starbucks`), asignaciones por pantalla y pantallas apagadas por incidencia.
3. **Reparto `/sincro`:** un vídeo repartido entre 1–3 / 4 / 5–6 o entre las seis, igual que en Matrix.
4. **Sin deformar:** el contenido se pinta con la proporción física de cada pantalla. Si sobra espacio, las bandas se rellenan con el propio fotograma, ampliado y oscurecido.
5. **Entre piezas** se mantiene el último fotograma y se funde con la siguiente. La pantalla no vuelve al menú dibujado.
6. **Una pieza que no carga** se salta a los pocos segundos.

### Qué manda sobre qué

1. Una **vista previa** (arrastre desde Pixeria, cápsula, `/demo`) siempre gana.
2. Después, la **programación**.
3. En el iPad, mientras su playlist no tenga vídeo, sigue el **gestor de colas**, como en Matrix.
4. Si la playlist está vacía o la función está apagada, queda el **menú ilustrativo** de siempre.

### Cómo se usa

- No hay que hacer nada: al abrir Good, Better o Best en el Starbucks, las pantallas emiten.
- **CLI:** `/emision escena` alterna · `/emision escena on|off`. En inglés: `/onair scene on|off`. No cambia de vista.
- La elección se guarda en este navegador (`xpaceos.scene-playlists.v1`). Por defecto: encendido.
- `/sincro`, `/sincrototal` y `/sincro off` cambian el reparto en todas las vistas.

### Contrato y límites

- **Solo lectura.** No cambia playlists, asignaciones, reparto ni estado MCP. Consulta el estado vivo cada 5 s, solo mientras una escena pinta.
- **Local.** Representa lo que reproduce este navegador. No confirma emisión en una pantalla física.
- **Reloj propio.** Cada vista lleva su reloj: al pasar de Matrix a Good la pieza no continúa en el mismo segundo.
- **Coste.** Un vídeo oculto y mudo por playlist en uso (uno para las seis pantallas de pared), no uno por pantalla. Se detiene solo en Matrix, con la pestaña oculta y fuera del Starbucks.
- **Ruta de los ficheros.** Las escenas pintan en lienzos y texturas, que exigen lectura cruzada. Se usa la ruta estable del Stock (`https://api.admira.store/stock/asset/<id>`), la misma de Pixeria y las vistas previas.
- **Fuera de alcance por ahora:** Sincro IA (seis piezas distintas) se ve como la playlist normal de la pared. `/navidad` solo llega si se activa por MCP. Las imágenes duran 30 s fijos. Sin luz sobre la sala ni ficha «En emisión» en estas tres vistas.
- **Para agentes:** `window.XpaceScenePlaylists.state()` devuelve `{enabled,awake,revision,mode,groups[],off[]}`; `.set(true|false)` lo enciende o apaga.

### Corrección incluida

El secuenciador dejaba una playlist en pausa si el estado de MCP la sustituía mientras su primera pieza aún cargaba. Le pasaba al TPV en Matrix: se quedaba parado en el segundo 0. Ahora arranca. Una pausa pedida por el usuario se respeta.

### Código y pruebas

`admira-xp/scripts/scene-playlists.mjs` · `scene-playlists.test.mjs` (15 pruebas) · enganche en `screen-media.js` (`setSchedule`) · refresco en `life-renderer.mjs` · corrección en `screen-playlist.mjs`.

## EN

### What it does

Until now, in Good, Better and Best the Starbucks screens were drawn menus that only showed content when a preview was dropped on them. They now play the same schedule as Matrix:

1. **Wall, POS and iPad** play their playlists, item after item, looping.
2. **Same source as Matrix:** repo seeds, playlists managed through MCP (`https://mcp.admira.store/matrix/starbucks`), per-screen assignments and screens powered off by an incident.
3. **`/sync` layout:** one video across 1–3 / 4 / 5–6 or across all six, as in Matrix.
4. **No distortion:** content is painted with each screen's physical proportion. Spare space is filled with the frame itself, enlarged and darkened.
5. **Between items** the last frame is held and blended into the next. The screen never falls back to the drawn menu.
6. **An item that fails to load** is skipped after a few seconds.

### Precedence

1. A **preview** (Pixeria drag, capsule, `/demo`) always wins.
2. Then the **schedule**.
3. On the iPad, while its playlist has no video, the **queue manager** stays, as in Matrix.
4. With an empty playlist or the feature off, the usual **illustrative menu** remains.

### How to use it

- Nothing to do: open Good, Better or Best at Starbucks and the screens play.
- **CLI:** `/onair scene` toggles · `/onair scene on|off`. Spanish: `/emision escena on|off`. It does not switch views.
- Saved in this browser (`xpaceos.scene-playlists.v1`). Default: on.
- `/sync`, `/synctotal` and `/sync off` change the layout in every view.

### Contract and limits

- **Read-only.** It changes no playlist, assignment, layout or MCP state. It reads live state every 5 s, only while a scene paints.
- **Local.** It represents what this browser plays. It does not confirm delivery to a physical screen.
- **Own clock.** Each view keeps its clock: switching from Matrix to Good does not resume at the same second.
- **Cost.** One hidden, muted video per playlist in use (one for the six wall screens), not one per screen. It stops by itself in Matrix, in a hidden tab and outside Starbucks.
- **Media route.** Scenes paint into canvases and textures, which need cross-origin reads. The stable Stock route (`https://api.admira.store/stock/asset/<id>`) is used, as in Pixeria and previews.
- **Out of scope for now:** AI sync (six different clips) shows as the normal wall playlist. `/christmas` only applies when set through MCP. Images last a fixed 30 s. No room light or “On air” card in these three views.
- **For agents:** `window.XpaceScenePlaylists.state()` returns `{enabled,awake,revision,mode,groups[],off[]}`; `.set(true|false)` turns it on or off.

### Included fix

The sequencer left a playlist paused when MCP state replaced it while its first item was still loading. It happened to the POS in Matrix, stuck at second 0. It now starts. A pause requested by the user is kept.
