# Acabado 2D / 2D finish

Estado / Status: entrega v.27.10.2026.r2.23:49 · Acabado 2D + lector Good / 2D finish + Good reader.
Canonical generator: https://www.admira.store/assets/ ; English: https://www.admira.store/assets/en/ . The XpaceOS package redirects to Store. This release updates the generator, the Good reader and optional Stock sprite metadata; Studio remains focused on multimedia.

## Uso / Usage

Acabado 2D : en Resultado, compara el original con el acabado. Elige paleta Original, Automática o Personalizada de 8/16/32 colores, compartida entre las caras. Tamaño por cara: 32, 64, 128 o 256 px; personalizado de 16 a 256 px por lado, sin deformar y con apoyo centrado abajo. Descargar PNG + JSON entrega un ZIP con hoja horizontal y metadatos admira.sprite/1: caras, orden, huella fp, altura ph, punto de apoyo y región de contenido. Hoja completa conserva las cuatro caras; Solo la cara visible exporta una explícitamente. Los cambios parten del original y no recalculan huella ni altura, ni llaman a la IA o al Stock. Publicar original como Mobiliario mantiene la publicación existente del original; el acabado es una descarga independiente.

2D finish : under Result, compare the session original with the finish. Choose Original, Automatic or Custom palette with 8/16/32 colors shared across views. Per-view size: 32, 64, 128 or 256 px; custom dimensions from 16 to 256 px per side, without stretching and with a bottom-center anchor. Download PNG + JSON produces a ZIP containing a horizontal sheet and admira.sprite/1 metadata: views, order, footprint fp, display height ph, anchor and content region. Complete sheet retains all four views; Current view only explicitly exports one. Changes derive from the original, never recalculate footprint or display height, and make no AI or Stock requests. Publish original as furniture retains existing original publishing; the finish is a separate download.

1. ES: Genera una pieza o sube PNG/WebP. La primera cara provisional de una generación de cuatro vistas no habilita exportaciones; espera la hoja completa. EN: Generate a sprite or upload PNG/WebP. A provisional first view in a four-view generation does not enable export; wait for the complete sheet.
2. ES: Elige paleta y dimensiones. Original conserva RGB; Automática obtiene hasta el límite elegido; Personalizada permite editar cada muestra. La transparencia no consume un color. EN: Choose palette and dimensions. Original retains RGB; Automatic extracts up to the selected limit; Custom allows editing each swatch. Transparency does not consume a color.
3. ES: Gira el original para comparar la misma cara. Huella y altura se editan en Brief de pieza y pasan al JSON sin depender de la resolución. EN: Rotate the original to compare the same view. Edit footprint and display height in the piece brief; they transfer to JSON independently of resolution.
4. ES: Hoja completa es la selección inicial. PNG + JSON descarga un ZIP con ambos archivos; PNG y JSON permiten descargarlos por separado. EN: Complete sheet is the initial selection. PNG + JSON downloads a ZIP containing both files; PNG and JSON download them separately.

Sólo se recuerdan las preferencias de acabado en este origen, bajo `admira:assets:finish2d:v1`; no se guarda la imagen original en localStorage. Cada acabado se calcula desde el maestro de la sesión, nunca desde el acabado anterior. Cambiar dimensiones o paleta no hace consultas. Una generación nueva reinicia la cara y la selección a hoja completa. Los ajustes y las exportaciones no modifican el catálogo, los IDs, el monedero ni el historial del editor.

Only finish preferences are saved for this origin under `admira:assets:finish2d:v1`; the source image is not saved in localStorage. Each finish derives from the session master, never from a previous finish. Settings and export make no network requests. A new generation resets the view and selection to the complete sheet. Catalogue, IDs, wallet and editor history are preserved.

## Contrato PNG + JSON / PNG + JSON contract

Schema: `admira.sprite/1`. PNG uses RGBA8 at the selected native resolution (no visual zoom baked into the file). Alpha is copied from sampled source pixels; no dithering. PNG encoding writes straight RGBA bytes directly, so partial-alpha colors do not drift through canvas premultiplication. Resampling uses nearest-neighbor from one common source cell, fitted proportionally, aligned bottom-center. A four-view source always uses a palette extracted across all four views.

| Field | Contract |
| --- | --- |
| `image.file`, `image.width`, `image.height` | Matching PNG filename and full sheet dimensions. |
| `frames` | 4 for a complete four-view source; 1 for a single source or explicit current-view export. |
| `frameW`, `frameH` | Selected width and height of each cell. Sheet width equals `frames × frameW`. |
| `facing` | Complete order: `front-right`, `front-left`, `back-left`, `back-right`. Current-view export names its actual face. A single uploaded image is treated as `front-right`; views are not invented. |
| `anchor` | Normalized bottom-center `{x:0.5,y:1}` in every frame. |
| `contentRect` | Shared fitted source region `{x,y,width,height}` inside every output cell; includes any transparency already in the source cell. |
| `fp` | Copy of the explicitly selected tile footprint `[width,depth]`. |
| `ph` | Copy of the existing display height; distinct from exported pixel height. |
| `source` | Original sheet width, height, frames and frameW. `rgbaSha256`, where Web Crypto is available, hashes decoded RGBA8 bytes in row-major order, not the PNG file. Explicit single-view export retains original source.frames. |
| `palette` | Mode, selected limit, RGB colors and `transparency:preserve-alpha`. Original has null limit/colors. Automatic may use fewer colors when the source has fewer. Custom contains the selected slots, including duplicate values if needed. |

Good: abre el gemelo con calidad Good, despliega Avanzadas → Assets 2D y selecciona el PNG y su JSON. Revisa las caras y pulsa Guardar aquí y colocar. La pieza conserva huella, altura de referencia y caras al recargar; los giros de 90° muestran una cara cada vez. El tamaño del archivo no recalcula la huella ni la escala histórica de altura. El guardado es local a este navegador y dominio, sin envío a Stock ni al espejo LIVE. Para compartir una sala con piezas locales hace falta una fuente compartida explícita. Los PNG anteriores mantienen su dibujo. El Stock transporta el descriptor validado en publicaciones originales, catálogo y monedero; una contradicción de metadatos se comunica sin reemplazar IDs ni cobrar dos veces.

Good: open the twin at Good quality, expand Advanced → Assets 2D and select the PNG and JSON. Review the views and press Save here and place. Footprint, reference height and views survive reload; quarter-turns display one view at a time. File size never recalculates the footprint or the historical height scale. Saving is local to this browser and origin, without Stock or LIVE reporting. Sharing a room containing local items requires an explicit shared source. Legacy PNG rendering is retained. Stock carries the validated descriptor through original publication, catalogue and wallet; metadata conflicts are reported without replacing IDs or charging twice.

The reader stores a normalized `sprite` descriptor next to the existing root `fp` and `ph`, binds it to the PNG SHA-256 and keeps legacy PNGs on their historical path. The source RGBA hash is provenance, not the exported PNG digest. `ph` retains the historical Good multiplier and wall clamp; it is not an absolute on-screen pixel height. Four-view images use a common crop and bottom-center anchor, with uniform nearest-neighbor scaling.

Local imports persist the PNG data URL with metadata. They block LIVE/distribution publication until shared explicitly. Storage failure rolls the import back; a saved blob URL is never used. Catalogue, instance IDs, inventory restore/undo and the wallet retain metadata. Duplicate binaries with incompatible placement/descriptor return a conflict. Image replacements cannot silently inherit old sprite geometry. Pixel painting retains a validated sheet; whole-sheet trimming of structured sprites is guarded to keep cell boundaries. Legacy painting/trimming remains available.

## Validación local / Local validation

Run `node --test tests/assets-generator.test.mjs tests/finish-2d.test.mjs tests/assets-sprite.test.mjs` from the repository root. Tests cover shared palette, alpha, four-view order, rectangular sizes, immutable source, explicit single-view export, placement metadata, malformed input, independently read ZIP CRC/UTF-8 filenames and exact PNG RGBA decoding (including partial alpha). Both language entries compile and all relative modules resolve.

The browser check used local fixture responses for the existing front/back generation path, including its native mirror and sheet composition. Downloads were inspected independently: exact PNG dimensions, colors limited to the manifest palette, alpha and preserved fp/ph. Real AI generation, Stock writes and production publication were not performed.

Local implementation: `assets/generator/finish-2d-core.mjs`, `finish-2d.mjs`, `finish-2d.css` and hooks in both language entry pages. Web help, tutorial, CLI help, static MCP descriptions and the real MCP help source carry ES/EN instructions. No MCP generation or export tool is introduced.

The wider MCP checkout suite has 18 pre-existing failures (104/122 pass), reproduced on its unchanged base. The targeted actual MCP finish-help test passes; no new broad-suite failures were introduced.

Release checks: 17 generator/Good tests; 364 API tests including five sprite persistence tests; local browser import and actual reload recovered fp=[3,2], ph=88, frames=4. Inventory extraction regression and 18 wider MCP failures reproduce on their unchanged bases; actual page scripts compile and targeted MCP help passes. No paid generation or real Stock purchase was used for validation.
