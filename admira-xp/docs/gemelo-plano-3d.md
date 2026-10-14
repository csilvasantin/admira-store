# Gemelo 3D desde el plano · Laboratorio Gran de Gràcia 51 / 3D twin from the floor plan

Misión DCL-6ae9d5b0e2d48ee2fd9c7b19 (orden de Carlos, 14-oct-2026). Ruta: **`/xpacios/gran-de-gracia-51/`**.

## ES

**Qué es.** El gemelo 3D del laboratorio AdmiraNeXT (Carrer Gran de Gràcia 51, 1.ª planta, Barcelona), pintado desde el plano canónico `admira.xpacio-plano/1`, el mismo que abre `/redistribucion` en admira.biz. No hay coordenadas copiadas a mano: paredes, huecos, muebles, pantallas y dispositivos salen del JSON.

**Fuente del plano.** Manda el plano compartido `https://www.admira.biz/data/xpacios/<id>.json` (los clientes de las cinco soluciones comparten planos e inventario ITIL). Si no responde, contesta HTML (la portada de admira.biz para un plano que no existe), no valida o es de otro Xpacio, se usa la copia de este sitio `data/xpacios/<id>.json`. La ficha dice qué fuente se está usando y, en la copia local, por qué no se usó la compartida. `?loc=<id>` abre otro Xpacio con plano.

**Vistas** (`?vista=`): `orbital` (arrastrar gira, rueda o pellizco acerca), `puerta` (desde la puerta del pasillo, a 1,60 m), `webcam` (`&pan=` y `&tilt=` en grados, campo 72° × 44° de la Insta360 Link 2), `planta` (cenital a escala) y `alzado-F|D|P|I` (ortográfico, visto desde dentro de `a` a `b`, con reglas cada 0,5 m y sólo lo que queda a 0,9 m o menos de la pared). Botones abajo, en ▤ Avanzado y en ⌘ Experto: `/vista orbital|puerta|planta`, `/vista webcam 60`, `/vista alzado I`. `/redistribucion` sin argumento abre el plano 2D de este Xpacio (`XPACE_SHELL.plano`).

**Pantallas.** A escala por su diagonal y aspecto (misma geometría que `plano-core.mjs`): 27″ 16:9 = 0,598 × 0,336 m; MacBook Pro 16 de 16,2″. Cada una en su pared, `s` y `z`. Las que descansan en una mesa pegada a su pared se dibujan con pie, a 0,25 m de la pared (el portátil, a 0,35 m); colgadas, a 0,03 m. Cada pantalla de `starbucks-six` muestra su captura r2 de admira.studio. La del MacBook no tiene captura publicada y lo dice. Etiqueta por pantalla: código ITIL (`itil`) y screenId; en alzado, además `s`, `z` y pulgadas.

**Dispositivos.** Con `s` y `z` en el plano, donde dice el plano (la webcam, sobre la H del puesto de Carlos). Un player sin posición se deduce de sus pantallas: el portátil es su propia pantalla; el Mac Studio, sobre la mesa larga delante de su H; el Mac mini, bajo la mesa de la ventana porque no se ve en la cámara (deducido, por confirmar). El inventario ITIL marca qué posiciones son deducidas.

**Calibración de la webcam.** Con el pan 0 perpendicular a la pared F, las fotos del 14-oct (04 a 07) caen unos 27° más a la derecha que el plano. La vista webcam aplica un cero de pan de −27° (`?calibrar=0` lo quita). O la Link 2 tiene el cero girado hacia la pared D o el plano está corrido: se resuelve con metro.

**Muebles.** Volúmenes sencillos por tipo deducido del nombre (mesa, silla, nevera, recreativa, mueble). El plano no trae giro: lo que toca una pared mira a la sala; lo suelto (sillas), a la pared F.

**admira.tv.** El canal `admira.tv/canal?screen=<pantalla real>` emite como esa pantalla (proof-of-play y `/signage/now`; `playerType=virtual` sólo vale para pantallas `virtual-*`). Por eso la ficha enlaza la portada de admira.tv y no el canal de cada pantalla.

**Código.** `xpacios/gran-de-gracia-51/plano3d.mjs` (lógica pura y fuente del plano), `escena3d.mjs` (three.js r160 del sitio, `admira-xp/scripts/premium-three.mjs`), `gemelo.mjs` (página) y `plano3d.test.mjs`. Plano: `data/xpacios/lab-gran-de-gracia-51.json`. No añade herramientas MCP.

**Pendiente.** Medidas con metro; el giro de los muebles y la posición de los players en el plano; captura de la pantalla del MacBook; publicar el plano 3D de Starbucks 103 cuando tenga JSON.

## EN

**What it is.** The 3D twin of the AdmiraNeXT lab (Gran de Gràcia 51, 1st floor, Barcelona), rendered from the canonical `admira.xpacio-plano/1` plan that `/redistribucion` opens on admira.biz. Nothing is copied by hand.

**Plan source.** The shared plan at `https://www.admira.biz/data/xpacios/<id>.json` wins. If it fails, returns HTML, does not validate or belongs to another Xpace, the local copy `data/xpacios/<id>.json` is used and the card says which source is shown and why.

**Views** (`?vista=`): `orbital`, `puerta` (from the corridor door), `webcam` (`&pan=`, `&tilt=`; 72° × 44°), `planta` and `alzado-F|D|P|I` (orthographic elevation seen from inside, 0.5 m rulers, 0.9 m depth band). Expert: `/vista …`; `/redistribucion` with no argument opens this page's 2D plan.

**Screens** to scale (27″ 16:9 = 0.598 × 0.336 m; 16.2″ MacBook Pro), on their wall, `s` and `z`; desk-standing screens 0.25 m from the wall. starbucks-six screens show their r2 capture. Labels: ITIL code and screenId (plus `s`, `z` in elevations).

**Devices.** Plan positions when given (webcam on the H); otherwise derived from their screens and flagged as derived. Webcam view applies a −27° pan zero fitted to the 14-Oct photos (`?calibrar=0` disables it).

**admira.tv.** A real-screen channel URL would broadcast as that screen, so only the admira.tv home is linked.
