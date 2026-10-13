# Hiperreal vivo / Live Hiperreal · Best · Xtanco

Neo · MacStudio · 13-oct-2026. Encargo de Carlos: «tenemos que ser capaces de poner los players virtuales también aquí y que los objetos se puedan mover levantándolos en 3D».

URL estable / Stable URL: https://www.xpaceos.com/admira-xp/?autostart=xtanco&from=portada&visual=hiperreal

admira.store: https://www.admira.store/admira-xp/?autostart=xtanco&from=portada&visual=hiperreal

## ES

### Qué hace

1. **Players virtuales.** Cada pantalla de la sala emite contenido, en perspectiva y en directo: el tótem, las dos pantallas de pared (los dos cuadros), la pantalla LED, el portátil del escritorio, el terminal de lotería, el gestor de turnos y la tablet de satisfacción. Al girar un mueble, emiten también las pantallas que queden de cara (por ejemplo, el monitor del mostrador).
2. **Luz de pantalla.** Cada pantalla tiene un resplandor de su propio contenido y, si el mueble está en el suelo, echa luz sobre la tarima delante de él.
3. **Fichas «En emisión».** Al pasar el ratón por una pantalla: qué emite, de dónde sale, su número de Stock, el tiempo y la etiqueta que la identifica.
4. **Levantar muebles.** Una pieza se coge, se eleva sobre la sala, se lleva a otro sitio y se posa. Su sombra se queda en el suelo. Una huella dice dónde va a quedar: verde si cabe, roja si no.
5. **Muebles y sombras nuevos.** Los 43 modelos del catálogo están renderizados de nuevo en Blender (Cycles), en sus cuatro giros, con más detalle y con su sombra de suelo aparte.

### Qué emite cada pantalla (por orden)

1. Una **vista previa** (arrastre desde Pixeria, cápsula, `/demo`). Siempre gana.
2. **Lo que Good tiene fijado** en esa misma pantalla. Vale para sus cuatro superficies: pared 1, pared 2, escaparate y tótem. Se usa el mismo vídeo que reproduce Good, así el gemelo es uno. Si lo fijado es una web (quiosco de pedido, canal admira.tv), se proyecta sobre el tótem.
3. **Su canal por etiqueta.** El contenido del Stock que lleve la etiqueta de esa pantalla, en `tags` o como `#etiqueta` en el comentario. Pieza tras pieza y en bucle.
4. **La parrilla de la casa.** El anuncio «JTI · Tu sitio de siempre» en el formato que mejor encaja con la pantalla (9:16, 4:5, 1:1 o 16:9).
5. Con los players apagados, la pantalla enseña el dibujo propio del mueble. Los dos cuadros vuelven a ser cuadros.

### Etiquetas de los players

| Pantalla | Etiqueta |
| --- | --- |
| Tótem Metahuman | `XT-GRACIA-MH` |
| Pantalla de pared 1 (cuadro de la pared verde) | `XT-GRACIA-P1` |
| Pantalla de pared 2 (cuadro de la pared clara) | `XT-GRACIA-P2` |
| Pantalla de escaparate (mueble «Pantalla TFT») | `XT-GRACIA-ESC` |
| LED Banner | `XT-GRACIA-LED` |
| Pantalla del escritorio | `XT-GRACIA-OFICINA` |
| Terminal de lotería | `XT-GRACIA-LOTERIA` |
| Gestor de turnos | `XT-GRACIA-TURNOS` |
| Tablet de satisfacción | `XT-GRACIA-TABLET` |
| TPV del mostrador | `XT-GRACIA-TPV` |
| Mueble de Pixeria con pantalla | `XT-GRACIA-` + su nombre |

Las cuatro primeras son las mismas etiquetas que ya usa Good.

### Cómo se mueven los muebles

1. **Arrastrar** una pieza la levanta. Se elige por lo que se ve de ella, no por su caja.
2. **Soltar** la posa en la casilla marcada. El paso es de un cuarto de casilla.
3. Si el sitio está ocupado, la huella **busca el hueco libre más cercano**, hasta una casilla de distancia. Si no lo hay, la huella se pone roja, el mueble que estorba se marca y, al soltar, la pieza vuelve a su sitio.
4. **R** o la **rueda** giran la pieza en el aire un cuarto de vuelta. **Esc** cancela.
5. **Clic** elige una pieza y muestra su barra: nombre, «Girar» y «Deshacer».
6. Con una pieza elegida: **flechas** la mueven un cuarto de casilla, **R** la gira en su sitio, **Esc** la suelta.
7. **Ctrl/⌘+Z** deshace el último movimiento. Se recuerdan los últimos de esta visita.
8. No se mueven las piezas colgadas en la pared (LED, pantalla TFT, aroma, puerta) ni las bloqueadas. El tótem y la tablet sí: aquí están de pie en el suelo.

### Órdenes

- `/emision` alterna las fichas fijas · `/emision on|off`.
- `/emision luz on|off` enciende o apaga la luz de las pantallas.
- `/emision escena on|off` enciende o apaga los players (canales por etiqueta y parrilla de la casa).
- `/emision estado` resume lo que hay.
- En inglés: `/onair`, `/onair light`, `/onair scene`, `/onair status`.
- Con esta vista abierta las órdenes actúan aquí y no cambian de vista.

### Contrato y límites

- **Guardado.** Soltar una pieza guarda por el mismo puente que Distribuir (`window.__xtancoFurnitureEditor`), con un método nuevo, `place`, que valida solo el destino: límites de la sala, otros muebles y celdas fijas. Vale para Good, Better y Best a la vez.
- **Al recargar** el Xtanco vuelve a la distribución del repositorio (`layouts/…xml`). Es el comportamiento de siempre; esta función no lo cambia.
- **Mientras se lleva una pieza** la simulación se pausa, como en Distribuir, y se reanuda al soltar.
- **Players: solo lectura.** No cambian el Stock, los pines de Good, las playlists ni ningún estado remoto. Leen el índice del Stock cada 60 s, solo mientras la vista pinta.
- **Local.** Representa lo que reproduce este navegador. No confirma emisión en una pantalla física.
- **Coste.** Un vídeo oculto y mudo por canal en uso, no uno por pantalla. Las pantallas que emiten la parrilla comparten vídeo por formato. Todo se detiene con la pestaña oculta o al salir de la vista.
- **La web del tótem** se enseña inerte: no recibe clics en la sala, para que el tótem se pueda coger. **Doble clic** sobre su pantalla la abre a tamaño táctil (la vista que ya existía). Mientras esta vista está abierta, Good aparca su propia copia para que no haya dos.
- **Otros verticales.** Las etiquetas y la parrilla son del Xtanco. En otro vertical la vista conserva las vistas previas y el movimiento de muebles, sin players.
- **Sin los renders nuevos** (fichero ausente) la vista sigue con el catálogo anterior, sin sombras.
- **Preferencias** en este navegador: `xpaceos.xtanco-players.v1` (players) y `xpaceos.best.screens.v1` (fichas y luz). Por defecto: players y luz encendidos, fichas al pasar el ratón.
- **Para agentes:** `window.XpaceHiperreal` existe mientras la vista está abierta. `players.state()` y `players.set(true|false)`; `screens.state()` y `screens.set({onAir,light})`; `lift.state()`, `lift.select(id)`, `lift.move(id,col,row,rot)`, `lift.nudge(dc,dr)`, `lift.turn()`, `lift.undo()`; `furniture.screens()`.

### Observado y no tocado

En Good, el canal por etiqueta descarga el contenido pero no llega a fijarlo: el pin llega como dirección `blob:` y se rechaza. Pasa también en producción. Esta vista reproduce el canal por su cuenta, así que aquí sí se ve. Queda propuesto como tarea aparte.

### Cómo se generan los renders

```bash
blender --background --factory-startup --python admira-xp/tools/xpacios-blender/render_hiperreal_sprites.py -- --size 1024 --samples 64 --shadow-size 512 --shadow-samples 32
```

Salida: `admira-xp/assets/matrix-furniture/hiperreal/` — por pieza y giro, la imagen (`NN-rR.webp`), su sombra (`NN-rR-s.webp`) y un `manifest.json` con el ancla, la escala y las esquinas de cada pantalla. `--numbers 1,14` limita las piezas y `--rotations 0,3` los giros. Hecho con Blender 5.2.2 LTS.

Las pantallas de los muebles fotográficos y de los dos cuadros se midieron a mano sobre el atlas y están en `matrix-photo-pieces.mjs`.

### Código y pruebas

`admira-xp/scripts/matrix-furniture.mjs` (sombras, pantallas, selección por píxel) · `furniture-lift.mjs` (la mano) · `xtanco-players.mjs` (players) · `playlist-painter.mjs` (relojes compartidos con las playlists del Starbucks) · `best-onair.mjs` (fichas) · `best-preview-ui.mjs` (montaje) · `distribuit.mjs` (`validateFurniturePlacement`) · `matrix-floor.mjs` (`unprojectMatrixFloor`) · `index.html` (`place`, `__xtancoSurfaceMedia`, `__xtancoSurfaceWeb`).

Pruebas: `furniture-lift.test.mjs`, `xtanco-players.test.mjs` y casos nuevos en `matrix-furniture.test.mjs` y `best-preview-ui.test.mjs`.

## EN

### What it does

1. **Virtual players.** Every screen in the room plays content, live and in perspective: the totem, the two wall screens (the two framed prints), the LED screen, the desk laptop, the lottery terminal, the queue kiosk and the feedback tablet. When a piece is turned, the screens that come to face the camera play too (the counter monitor, for instance).
2. **Screen light.** Each screen glows with its own content and, when its piece stands on the floor, lights the boards in front of it.
3. **“On air” cards.** Hover a screen: what it plays, where it comes from, its Stock number, the time and the tag that addresses it.
4. **Lifting furniture.** A piece is picked up, raised over the room, carried elsewhere and set down. Its shadow stays on the floor. A footprint shows where it will land: green if it fits, red if not.
5. **New furniture and shadows.** The 43 catalog models are rendered again in Blender (Cycles), in their four turns, with more detail and a separate floor shadow.

### What each screen plays (in order)

1. A **preview** (Pixeria drag, capsule, `/demo`). It always wins.
2. **What Good has pinned** on that same screen. This covers its four surfaces: wall 1, wall 2, storefront and totem. The very video Good plays is used, so the twin stays one. If the pin is a web page (ordering kiosk, admira.tv channel), it is projected onto the totem.
3. **Its tagged channel.** Stock content carrying that screen's tag, in `tags` or as a `#tag` in the comment. Item after item, looping.
4. **The house schedule.** The “JTI · Tu sitio de siempre” advert in the shape closest to the screen (9:16, 4:5, 1:1 or 16:9).
5. With players off, the screen shows the drawing of its own piece. The two frames are prints again.

### Player tags

| Screen | Tag |
| --- | --- |
| Metahuman totem | `XT-GRACIA-MH` |
| Wall screen 1 (print on the green wall) | `XT-GRACIA-P1` |
| Wall screen 2 (print on the light wall) | `XT-GRACIA-P2` |
| Storefront screen (“Pantalla TFT” piece) | `XT-GRACIA-ESC` |
| LED banner | `XT-GRACIA-LED` |
| Desk screen | `XT-GRACIA-OFICINA` |
| Lottery terminal | `XT-GRACIA-LOTERIA` |
| Queue kiosk | `XT-GRACIA-TURNOS` |
| Feedback tablet | `XT-GRACIA-TABLET` |
| Counter POS | `XT-GRACIA-TPV` |
| Pixeria piece with a screen | `XT-GRACIA-` + its name |

The first four are the tags Good already uses.

### How furniture moves

1. **Drag** a piece to lift it. It is chosen by what is drawn of it, not by its box.
2. **Release** to set it on the marked tile. The step is a quarter tile.
3. If the spot is taken, the footprint **looks for the nearest free tile**, up to one tile away. With none, the footprint turns red, the piece in the way is highlighted and, on release, the piece goes back.
4. **R** or the **wheel** turn the piece in the air a quarter turn. **Esc** cancels.
5. **Click** chooses a piece and shows its bar: name, “Turn” and “Undo”.
6. With a piece chosen: **arrows** move it a quarter tile, **R** turns it in place, **Esc** lets go.
7. **Ctrl/⌘+Z** undoes the last move. The latest moves of this visit are remembered.
8. Pieces hanging on a wall (LED, TFT screen, aroma, door) and locked ones do not move. The totem and the tablet do: here they stand on the floor.

### Commands

- `/onair` toggles pinned cards · `/onair on|off`.
- `/onair light on|off` turns the screen light on or off.
- `/onair scene on|off` turns the players on or off (tagged channels and house schedule).
- `/onair status` sums it up.
- Spanish: `/emision`, `/emision luz`, `/emision escena`, `/emision estado`.
- With this view open the commands act here and never switch views.

### Contract and limits

- **Saving.** Releasing a piece saves through the same bridge as Distribuir (`window.__xtancoFurnitureEditor`), with a new method, `place`, that validates the destination only: room limits, other furniture and fixed cells. It holds for Good, Better and Best at once.
- **On reload** the Xtanco returns to the repository layout (`layouts/…xml`). That is the existing behaviour; this feature does not change it.
- **While a piece is carried** the simulation pauses, as in Distribuir, and resumes on release.
- **Players: read-only.** They change no Stock item, Good pin, playlist or remote state. They read the Stock index every 60 s, only while the view paints.
- **Local.** It represents what this browser plays. It does not confirm delivery to a physical screen.
- **Cost.** One hidden, muted video per channel in use, not one per screen. Screens on the house schedule share a video per shape. Everything stops in a hidden tab or on leaving the view.
- **The totem page** is shown inert: it takes no clicks in the room, so the totem can be grabbed. **Double-click** its screen to open it at touch size (the existing view). While this view is open, Good parks its own copy so there are never two.
- **Other verticals.** Tags and the house schedule belong to the Xtanco. Elsewhere the view keeps previews and furniture lifting, without players.
- **Without the new renders** (file missing) the view carries on with the previous catalog, without shadows.
- **Preferences** in this browser: `xpaceos.xtanco-players.v1` (players) and `xpaceos.best.screens.v1` (cards and light). Defaults: players and light on, cards on hover.
- **For agents:** `window.XpaceHiperreal` exists while the view is open. `players.state()` and `players.set(true|false)`; `screens.state()` and `screens.set({onAir,light})`; `lift.state()`, `lift.select(id)`, `lift.move(id,col,row,rot)`, `lift.nudge(dc,dr)`, `lift.turn()`, `lift.undo()`; `furniture.screens()`.

### Observed and left untouched

In Good, the tagged channel downloads its content but never pins it: the pin arrives as a `blob:` address and is rejected. It happens in production too. This view plays the channel by itself, so here it shows. It is proposed as a separate task.

### How the renders are made

```bash
blender --background --factory-startup --python admira-xp/tools/xpacios-blender/render_hiperreal_sprites.py -- --size 1024 --samples 64 --shadow-size 512 --shadow-samples 32
```

Output: `admira-xp/assets/matrix-furniture/hiperreal/` — per piece and turn, the picture (`NN-rR.webp`), its shadow (`NN-rR-s.webp`) and a `manifest.json` with the anchor, the scale and the corners of every screen. `--numbers 1,14` limits the pieces and `--rotations 0,3` the turns. Made with Blender 5.2.2 LTS.

The screens of the photographed pieces and of the two framed prints were measured by hand on the atlas and live in `matrix-photo-pieces.mjs`.

### Code and tests

`admira-xp/scripts/matrix-furniture.mjs` (shadows, screens, per-pixel picking) · `furniture-lift.mjs` (the hand) · `xtanco-players.mjs` (players) · `playlist-painter.mjs` (clocks shared with the Starbucks playlists) · `best-onair.mjs` (cards) · `best-preview-ui.mjs` (mounting) · `distribuit.mjs` (`validateFurniturePlacement`) · `matrix-floor.mjs` (`unprojectMatrixFloor`) · `index.html` (`place`, `__xtancoSurfaceMedia`, `__xtancoSurfaceWeb`).

Tests: `furniture-lift.test.mjs`, `xtanco-players.test.mjs` and new cases in `matrix-furniture.test.mjs` and `best-preview-ui.test.mjs`.
