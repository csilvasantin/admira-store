# Gemelo 3D desde el plano · Laboratorio Gran de Gràcia 51 / 3D twin from the floor plan

Misión DCL-6ae9d5b0e2d48ee2fd9c7b19 (orden de Carlos, 14-oct-2026). Ruta: **`/xpacios/gran-de-gracia-51/`**.

## ES

**Qué es.** El gemelo 3D del laboratorio AdmiraNeXT (Carrer Gran de Gràcia 51, 1.ª planta, Barcelona), pintado desde el plano canónico `admira.xpacio-plano/1`, el mismo que abre `/redistribucion` en admira.biz. No hay coordenadas copiadas a mano: paredes, huecos, muebles, pantallas y dispositivos salen del JSON.

**Acceso (criterio del ITIL de Yokup: un mapa público de qué pantalla hay en qué pared no debe estar abierto).**
- **Sin sesión:** la página pide sólo `/data/xpacios/<id>.json` de este sitio. La función `functions/data/xpacios/[id].js` la entrega en su versión pública (`xpacios/plano-publico.mjs`): sólo geometría, sin códigos ITIL, screenIds, Yokup, instalación de contenidos ni dirección exacta («Gran de Gràcia · Barcelona»). Rótulos genéricos (V/H, pulgadas, player), sin inventario ni enlaces al plano 2D ni a Yokup. Las pantallas muestran un rótulo neutro, sin capturas (su URL lleva el screenId). Nunca se llama a admira.biz ni a admira.tv. La página recorta otra vez el plano en el navegador, por si llegara completo.
- **Con sesión** (`GET /auth/session` del perímetro → 200): manda el plano compartido `https://www.admira.biz/data/xpacios/<id>.json`. Si falla, se usa la copia de este sitio, que con sesión sale completa si lo es (la del repositorio es pública, ver abajo). La ficha dice la fuente.
- **El repositorio es público en GitHub.** Por eso `data/xpacios/` guarda sólo la versión pública, generada con `node scripts/plano-publico.mjs <plano-completo.json> data/xpacios/<id>.json`. El plano completo vive en admira.biz.

**Espejo de admira.tv (con sesión).** Cada pantalla con screenId pinta lo que su pantalla real emite AHORA. Lo lee de `/signage/now` de api.admira.store, el mismo dato que publica el canal de admira.tv (`canal.html`, `_postNow`) y que lee la ficha de admira.biz (`renderSurfMirror`, umbral de 200 s).
- api.admira.store no admite CORS desde www.admira.store, así que pasa por `GET /xpacios/senal?screen=<id>` (`functions/xpacios/senal.js`). Es de solo lectura, exige sesión y devuelve sólo el asset en emisión: ni IP, ni telemetría, ni salud.
- Refresco cada 20 s, sólo con la pestaña visible.
- Sin dato reciente, en standby o si el asset no se puede pintar, se ve la captura r2 y se dice («sin señal · captura del 13-oct»). La ficha de cada pantalla lleva su estado y la etiqueta, un punto verde cuando está en vivo.

**Reproducir en admira.tv: no se abre el canal de una pantalla real.** Comprobado en `admira-tv/canal.html`:
- `canal?screen=<real>` emite como esa pantalla: proof-of-play (`emitRecord`/`emitFlush` → `/emit`), `/signage/now`, mando (`/control/playlist`) y cola de órdenes (`pollCmd`, acuses).
- `playerType=virtual` sólo vale para ids `virtual-*`.
- El previo `?rundown=<screen>&playlist=…` tampoco es seguro:
  - no reporta `/emit` ni `/signage/now` como la pantalla del rundown;
  - pero `scr.screen` sale de `?screen=` o del `localStorage` del navegador (`adtv_screen`). En PREVIEW se llama a `cacheReport()` cada 30 s (POST `/screen/cache` como esa pantalla), y `pollCmd()` atiende y acusa órdenes como ella;
  - sin borrador, `previewFallback()` pone `PREVIEW.on=false` y vuelve a la emisión normal.

La vía correcta es un player virtual `virtual-gdg51-*` dado de alta en admira.tv/virtual-players, que requiere sesión de edición. Con el campo `playerVirtual` en la pantalla del plano, la ficha abre `https://admira.tv/canal.html?screen=<virtual>&playerType=virtual&clean=1&muted=1&cam=0&shot=0&rtb=0`. Sin él, enlaza la portada de admira.tv. Lo construye `urlAdmiraTv()` en `espejo.mjs`, que nunca pone el screenId real ni `machine`.

**Vistas** (`?vista=`): `orbital` (arrastrar gira, rueda o pellizco acerca), `puerta` (desde la puerta del pasillo, a 1,60 m), `webcam` (`&pan=` y `&tilt=` en grados, campo 72° × 44° de la Insta360 Link 2), `planta` (cenital a escala) y `alzado-F|D|P|I` (ortográfico, visto desde dentro de `a` a `b`, con reglas cada 0,5 m y sólo lo que queda a 0,9 m o menos de la pared). Botones abajo, en ▤ Avanzado y en ⌘ Experto: `/vista orbital|puerta|planta`, `/vista webcam 60`, `/vista alzado I`. `/redistribucion` sin argumento abre el plano 2D de este Xpacio (`XPACE_SHELL.plano`).

**Pantallas.** A escala por su diagonal y aspecto (misma geometría que `plano-core.mjs`): 27″ 16:9 = 0,598 × 0,336 m; MacBook Pro 16 de 16,2″. Cada una en su pared, `s` y `z`. Las que descansan en una mesa pegada a su pared se dibujan con pie, a 0,25 m de la pared (el portátil, a 0,35 m); colgadas, a 0,03 m. Cada pantalla de `starbucks-six` muestra su captura r2 de admira.studio. La del MacBook no tiene captura publicada y lo dice. Etiqueta por pantalla: código ITIL (`itil`) y screenId; en alzado, además `s`, `z` y pulgadas.

**Dispositivos.** Con `s` y `z` en el plano, donde dice el plano (la webcam, sobre la H del puesto de Carlos). Un player sin posición se deduce de sus pantallas: el portátil es su propia pantalla; el Mac Studio, sobre la mesa larga delante de su H; el Mac mini, bajo la mesa de la ventana porque no se ve en la cámara (deducido, por confirmar). El inventario ITIL marca qué posiciones son deducidas.

**Calibración de la webcam.** Con el pan 0 perpendicular a la pared F, las fotos del 14-oct (04 a 07) caen unos 27° más a la derecha que el plano. La vista webcam aplica un cero de pan de −27° (`?calibrar=0` lo quita). O la Link 2 tiene el cero girado hacia la pared D o el plano está corrido: se resuelve con metro.

**Muebles.** Volúmenes sencillos por tipo deducido del nombre (mesa, silla, nevera, recreativa, mueble). El plano no trae giro: lo que toca una pared mira a la sala; lo suelto (sillas), a la pared F.

**admira.tv.** El canal `admira.tv/canal?screen=<pantalla real>` emite como esa pantalla (proof-of-play y `/signage/now`; `playerType=virtual` sólo vale para pantallas `virtual-*`). Por eso la ficha enlaza la portada de admira.tv y no el canal de cada pantalla.

**Código.** `xpacios/gran-de-gracia-51/plano3d.mjs` (lógica pura, fuente y acceso), `espejo.mjs` (espejo y enlace a admira.tv), `escena3d.mjs` (three.js r160 del sitio, `admira-xp/scripts/premium-three.mjs`), `gemelo.mjs` (página), `xpacios/plano-publico.mjs` (versión pública), `functions/data/xpacios/[id].js` y `functions/xpacios/senal.js`. Tests: `plano3d.test.mjs`, `espejo.test.mjs`, `xpacios/plano-publico.test.mjs` y `tests/xpacio-plano-acceso.test.mjs`. Plano público: `data/xpacios/lab-gran-de-gracia-51.json`. No añade herramientas MCP.

**Pendiente.**
- Medidas con metro. El giro de los muebles y la posición de los players en el plano.
- Captura de la pantalla del MacBook.
- Players virtuales `virtual-gdg51-*` y su campo `playerVirtual`.
- admira.biz sirve el plano completo sin sesión, con CORS `*`: el mismo criterio pide cerrarlo allí.
- El historial público del repositorio conserva la copia completa del 14-oct.
- La ruta y el id llevan el número de la calle.

### Segundo Xpacio: Starbucks Paseo de Gracia (14-oct-2026)

**Ruta.** **`/xpacios/starbucks-paseo-de-gracia/`**, con el plano `alsea-sbux-021`: el mismo que abre `/redistribucion` en admira.biz (planta de 14 × 8 m, techo de 3,30 m, plano esquemático por confirmar en visita técnica).

**Mismo motor.** La página no copia código: carga `xpacios/gran-de-gracia-51/gemelo.mjs` y le dice qué Xpacio pinta con `window.XPACIO_GEMELO` (`loc`, `tema`, `orbita`, `aviso`, `puerta`). Sin ese objeto, el motor pinta el laboratorio como siempre. Sin webcam en el plano no se ofrece la vista de webcam; sin puerta, tampoco la de la puerta.

**Acabado de cafetería** (`tema:'cafeteria'`, `TEMAS` en `escena3d.mjs`): tarima de roble, paredes cálidas, la pared de la barra en verde oscuro y tres puntos de luz a lo largo de la sala.

**Muebles de cafetería** (tipo deducido del nombre en `tipoMueble`): `barra` (madera oscura con frente de listones, encimera de piedra, cafeteras y molino), `caja` (con TPV), `vitrina` (urna de cristal con bollería), `estanteria` (baldas con tazas) y `pilar` (hasta el techo). Las mesas llevan tablero de roble.

**Mural doble H.** Seis pantallas de 55″ en la pared F, V–H–V–V–H–V, por encima de la barra (base a 1,75 m las V y a 2,02 m las H). Sin sesión, rótulos genéricos; con sesión, el plano completo de admira.biz trae sus screenIds y cada pantalla pinta su captura starbucks-six y el espejo de admira.tv, como en el laboratorio.

**Mural como un solo lienzo** (mejora 3). La campaña starbucks-six de admira.studio describe un lienzo de 8160 × 1920 con el rectángulo de cada pantalla (`installations[].screens`). `mural.mjs` pinta ese lienzo en un `<canvas>` —el titular «Tu café sigue contigo.» cruza las seis pantallas, la frase de cierre va al revés, la banda de café se desplaza y la sirena late en las dos H— y `escena3d.mjs` (`ponerLienzo`) lo pone en las seis con una sola textura y las UV de cada trozo: las seis cambian en el mismo fotograma. Es una aproximación en el navegador, no el vídeo de admira.studio, y lo dice. Con sesión casan por screenId; sin sesión, por su orden en la pared F si las orientaciones V–H–V–V–H–V coinciden (si no, no se adivina). Lo que una pantalla real emite EN VIVO (espejo de admira.tv) manda sobre el lienzo; la captura o la falta de señal la devuelven al mural. 20 fotogramas por segundo con la pestaña visible; con «reducir movimiento», un fotograma fijo. Botón «❚❚ Mural» en la barra de vistas. El motor avisa con el evento `xpacio:listo` (y `window.XpacioGemelo`) para que cada página monte lo suyo: `mural-pagina.mjs`.

**Mejora 2 · las seis pantallas en vivo: sin señal todavía** (comprobado 14-oct 17:30). El espejo de admira.tv ya funciona aquí con sesión, pero `api.admira.store/signage/now` da `lastSeen: null` en las seis (`macstudio-starbucks-*`, `macmini-starbucks-*`): sus players (AdmiraStarbucks*.app, que cargan `admira.tv/canal`) no han emitido con esos screenIds. Cuando emitan, el gemelo los pinta en vivo sin cambiar nada.

**Código y tests.** `xpacios/starbucks-paseo-de-gracia/index.html`, plano público `data/xpacios/alsea-sbux-021.json` (generado con `scripts/plano-publico.mjs` desde el de admira.biz) y `xpacios/starbucks-paseo-de-gracia/gemelo.test.mjs`; el mural: `mural.mjs`, `mural-pagina.mjs` y `mural.test.mjs`. Está en la lista de `/xpacios/`.

## EN

**What it is.** The 3D twin of the AdmiraNeXT lab (Gran de Gràcia 51, 1st floor, Barcelona), rendered from the canonical `admira.xpacio-plano/1` plan that `/redistribucion` opens on admira.biz. Nothing is copied by hand.

**Plan source.** The shared plan at `https://www.admira.biz/data/xpacios/<id>.json` wins. If it fails, returns HTML, does not validate or belongs to another Xpace, the local copy `data/xpacios/<id>.json` is used and the card says which source is shown and why.

**Views** (`?vista=`): `orbital`, `puerta` (from the corridor door), `webcam` (`&pan=`, `&tilt=`; 72° × 44°), `planta` and `alzado-F|D|P|I` (orthographic elevation seen from inside, 0.5 m rulers, 0.9 m depth band). Expert: `/vista …`; `/redistribucion` with no argument opens this page's 2D plan.

**Screens** to scale (27″ 16:9 = 0.598 × 0.336 m; 16.2″ MacBook Pro), on their wall, `s` and `z`; desk-standing screens 0.25 m from the wall. starbucks-six screens show their r2 capture. Labels: ITIL code and screenId (plus `s`, `z` in elevations).

**Devices.** Plan positions when given (webcam on the H); otherwise derived from their screens and flagged as derived. Webcam view applies a −27° pan zero fitted to the 14-Oct photos (`?calibrar=0` disables it).

**Access.** Without a session only this site's `/data/xpacios/<id>.json` is requested. The Pages Function returns its public version: geometry only, with no ITIL codes, screenIds, Yokup, contents or exact address. Labels are generic, with no inventory, and admira.biz and admira.tv are never contacted. With a session (`/auth/session` 200), the shared admira.biz plan wins. The repository is public, so `data/xpacios/` holds only public plans (`scripts/plano-publico.mjs`).

**admira.tv mirror (signed in).** Each screen shows what its real screen is airing now, through `/xpacios/senal` (read-only, session required, asset fields only), every 20 s while the tab is visible. Otherwise it falls back to the r2 capture and says why.

**Second Xpace: Starbucks Paseo de Gracia.** `/xpacios/starbucks-paseo-de-gracia/` renders plan `alsea-sbux-021` (the one `/redistribucion` opens on admira.biz; schematic, to be confirmed on a site visit) with the same engine: the page loads `xpacios/gran-de-gracia-51/gemelo.mjs` and configures it through `window.XPACIO_GEMELO` (`loc`, `tema`, `orbita`, `aviso`, `puerta`); without it the lab renders as before. Café finish (`tema:'cafeteria'`): oak floor, warm walls, a dark green bar wall and three lights. Café furniture from its name: bar, checkout with POS, display case, cup shelf and pillar. The six 55″ screens of the double-H mural hang over the bar on wall F as V–H–V–V–H–V. No webcam in the plan, so no webcam view. **One-canvas mural:** `mural.mjs` paints the 8160 × 1920 starbucks-six canvas (headline crossing the six screens, coffee band, siren on the two H) and `ponerLienzo` maps it onto the six screens with one texture and per-screen UVs, all in the same frame; a live admira.tv signal wins over the canvas. Matching by screenId when signed in, by order along wall F (if V–H–V–V–H–V agrees) when public. The six real players have not reported to `/signage/now` yet (`lastSeen: null`). Public plan: `data/xpacios/alsea-sbux-021.json`; tests: `xpacios/starbucks-paseo-de-gracia/gemelo.test.mjs`.

**admira.tv links.** A real-screen channel would broadcast as that screen. The `rundown` preview still reports the cache and answers commands as the screen stored in the browser, and falls back to normal playback. Only a registered `virtual-*` player opens the channel (`playerVirtual`); otherwise the admira.tv home is linked.
