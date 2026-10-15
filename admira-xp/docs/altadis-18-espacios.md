# Los 18 espacios Altadis · gemelos 3D por formato

Misión Yokup DCL-d7966deb02734a6f34beb54e («los 18 espacios Altadis», demo a Alsea / Starbucks del 16-oct-2026), tarea c · SubNeoMBP14 · MacBookProNegro14 · 15-oct-2026.

## ES

**Qué es.** **`/xpacios/altadis-18/`**: un espacio tipo por cada uno de los 18 formatos de pantalla de Altadis (`cliente-01…18` de `admira.studio/adaptaciones/perfil-cliente-18.json`), en estanco (Xtanco) y en cafetería Starbucks. Galería de los 18 y, al elegir uno, su gemelo 3D con el vídeo adaptado a ese formato reproduciéndose en sus pantallas. Pública, como el resto de `/xpacios/`; sin datos ITIL.

**De dónde salen los datos** (contratos fijados entre los tres equipos):

| Qué | Primero | Respaldo |
|---|---|---|
| Índice `admira.espacios-formato/1` | `https://www.admira.biz/data/xpacios/altadis-18.json` | `/xpacios/altadis-18/planos/altadis-18.json` |
| 36 planos `admira.xpacio-plano/1` (`altadis-xtanco-NN`, `altadis-cafe-NN`) | `https://www.admira.biz/data/xpacios/<id>.json` | `/xpacios/altadis-18/planos/<id>.json` |
| Contenido de los Starbucks `admira.espacios-contenido/1` | `https://stock.admira.store/espacios/altadis-18/v1/manifest.json` | placeholder animado (nombre, píxeles y una barra que cruza el lienzo) |
| Contenido de los Xtanco (Altadis, sólo `es`) | `https://stock.admira.store/espacios/altadis-18/v1/manifest-xtanco.json` | el de los Starbucks, sin aviso; después, el placeholder |

La copia local va fuera de `/data/xpacios/` a propósito: allí la función de Pages serviría la versión pública de `plano-publico.mjs`, que quita `recorte`, `lienzo` y `formato`. Se refresca con `node scripts/altadis-18-planos.mjs` (de admira.biz) o `--desde <dir>` (del worktree del Arquitecto); valida todo antes de escribir y guarda la versión sin campos ITIL (`planoEspacioPublico`). Si el vídeo falla, las pantallas pasan al placeholder; si sólo tarda más de 12 s, el placeholder lo cubre mientras sigue cargando y el vídeo lo sustituye al llegar. La ficha dice qué se ve y por qué.

**Lo que ve el cliente.** La ficha y la galería dicen «Planos del Arquitecto · versión», en gris, venga el plano de admira.biz o de la copia local; qué fuente se usó y por qué va en el `title`. admira.biz tiene 2,5 s: si no responde (plazo, 404 o HTML), en lo que queda de sesión se va directo a la copia. Sin ids internos en la ficha (ni `cliente-NN`, ni `altadis-…`, ni «pared F»): formato, rejilla, pantallas físicas, zona y montaje, espacio y entrega («MP4 · H.264 · 25 fps»), en ES o EN. Las notas internas del Arquitecto (`fuente.avisos`, `fuente.sincro`) sólo se ven con **`?notas=1`**.

**Un solo vídeo por formato.** Cada pantalla física del plano trae `lienzo` (el del FORMATO, no el de `screenGeometry`) y `recorte` {x, y, w, h}. El visor abre un único `<video>` (muted, playsinline, loop, crossOrigin anonymous) y cada pantalla pinta su recorte con el offset/repeat de UV de esa región (`recorte.mjs`): todas cambian en el mismo fotograma. El motor lo hace con `ponerLienzo(canvas, uvs)` de `escena3d.mjs`, que ahora acepta un `<video>` (VideoTexture) además de un `<canvas>`.

**Lo nuevo del motor** (`xpacios/gran-de-gracia-51/`): tema `estanco` (gres cálido, pared del lineal en madera oscura, mostrador sin cafeteras), muebles `expositor` (lineal de tabaco; el bajo, cajonera) y `gondola`; la caja va antes que la barra en `tipoMueble`; escaparate de fachada como luna de cristal; pantallas LED con armario fino y rejilla de píxel; el cubo LED (`forma:'cubo-4-caras'`) como prisma sólo desde `cubo` {centro, lado, alto, peana, caras[]} sobre su peana (`m-peana`); su `recorte` y `dimensiones` son la cara que da a la sala y el encuadre lo mira por ella. `separacion` del plano manda siempre.

**Uso.** Enlaces: `?espacio=altadis-xtanco-NN` o `?formato=cliente-NN&tipo=cafe`; `?lang=en`; `?auto=1` (recorrido). Teclado: ← / → recorren los 18, Esc vuelve a la galería. Vistas: encuadre automático sobre las pantallas del formato (órbita alrededor), órbita de la sala y desde la puerta. Botones de la ficha: «Crear y adaptar en admira.studio» (`https://admira.studio/adaptaciones/?formato=cliente-NN`) y «Plano en el Arquitecto» (`https://www.admira.biz/arquitecto.html?formato=cliente-NN&tipo=xtanco|cafe`). Modo experto: `/espacio <1-18> [xtanco|cafe]`, `siguiente`, `anterior`, `galeria`, `recorrido`.

**Vídeo en iOS y recorrido.** `play()` en cuanto hay `src` y otra vez con el primer fotograma; si el navegador lo rechaza, con el primer toque. Al cambiar de idioma lo que se ve sigue en pantalla hasta que pinta el vídeo nuevo. El recorrido automático cuenta 12 s desde que el contenido pinta, con un tope de 20 s si el vídeo no llega. Un mueble que tapa las pantallas del formato desde la cámara (la góndola LED en la cabecera del lineal) se oculta, como las paredes.

**Rendimiento.** Un renderer para toda la página y un solo gemelo vivo: al cambiar de espacio se sueltan escena, texturas y `<video>`.

**Código y tests.** `xpacios/altadis-18/`: `index.html`, `visor.mjs` (DOM y three.js), `espacios.mjs` (índice, planos, fuentes, contenido y enlaces), `recorte.mjs` (UV), `vista.mjs` (encuadre y póster esquemático), `placeholder.mjs`, `altadis.css`; tests `espacios.test.mjs` y `recorte.test.mjs`.

## EN

**What it is.** **`/xpacios/altadis-18/`**: one model space for each of Altadis's 18 screen formats, as a tobacconist (Xtanco) and as a Starbucks café. A gallery of the 18 and, for each one, its 3D twin with the format-adapted video playing on its screens. Public like the rest of `/xpacios/`; no ITIL data.

**Content per type.** Xtanco spaces play the Altadis manifest (`manifest-xtanco.json`, Spanish only; English requests use Spanish without flagging it), falling back silently to the usual `manifest.json`; Starbucks spaces keep `manifest.json`. Gallery and card name each type's campaign (`campania.titulo`); poster URLs carry the manifest version.

**Data.** Shared plans and index on `www.admira.biz/data/xpacios/` first, local copies in `/xpacios/altadis-18/planos/` as the fallback (refresh with `node scripts/altadis-18-planos.mjs`). Content from `stock.admira.store/espacios/altadis-18/v1/manifest.json`; without it, or if a video fails, an animated placeholder with the format name and pixels.

**One video per format.** Each physical screen carries the format canvas (`lienzo`) and its `recorte`; a single `<video>` feeds every screen through per-screen UV offset/repeat, so they stay in sync. The cube LED is drawn as a prism from the plan's `cubo` field.

**What the client sees.** A neutral grey «Architect plans · version» line whatever the source (details in the `title`); admira.biz gets 2.5 s and, if it fails, the local copy is used directly for the rest of the session. No internal ids in the card; the Architect's internal notes only with `?notas=1`.

**Use.** `?espacio=altadis-xtanco-NN`, `?formato=cliente-NN&tipo=cafe`, `?lang=en`, `?auto=1`; ← / → step through the 18. Buttons open admira.studio adaptations and the Architect plan for the format.
