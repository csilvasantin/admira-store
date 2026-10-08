# Hiperreal · pipeline por tandas

Hiperreal es el acabado fotorrealista del catálogo: texturas PBR CC0 reales, imperfección (huellas, manchas, variación de posición y giro), cantos biselados y luz de tienda. Se generó a mano en la pieza 47 (piloto) y ahora sale de un pipeline reutilizable que se ejecuta por tandas.

## Estado

| Tanda | Piezas | Publicada |
|---|---|---|
| 0 · piloto | 47 Estantería de tazas y café Starbucks | 08-10-2026 |
| 1 · Starbucks | 44 Barra de preparación, 45 Mostrador de caja, 46 Vitrina, 48 Mesa redonda, 49 Silla, 50 Botellero Solán de Cabras, 52 iPad horizontal | 08-10-2026 |
| 2–6 · nativas y Pixeria | 2–43 y 51 (ver cada tanda abajo) | 08-10-2026 |
| 7 · Mostrador | 1 (fuera del catálogo, `assets/mostrador/`) | 08-10-2026 |
| r23 · manuales | piezas a mano en 4, 6, 17, 18; etiquetas de 2 | 08-10-2026 |

Las piezas con Hiperreal están en `HIPERREAL_BATCHES` de `inventario/quality-model.mjs`.

## Dónde se ve

- Inventario: `/inventario/?asset=<n>&quality=hiperreal` (o `quality=all` para comparar). Cada pieza enlaza su render antes/después en Cycles y su GLB HD.
- Gemelo, perfil **Best**: `/inventario añadir <n>` y la escena del proyecto Starbucks colocan el GLB Hiperreal; si no existe o falla la descarga, cae a Matrix y después a Best (`cloneTwinFurniture`). Better y Good no cambian.
- En la escena Starbucks (Best) los cuerpos de la barra (44), la caja (45) y la vitrina (46) vienen del catálogo; las cafeteras, vasos y la pantalla del TPV siguen siendo procedurales y en vivo. Mesas y sillas siguen procedurales en la escena (la mesa se dibuja junto a sus sillas); en el Inventario sí tienen Hiperreal.
- En el gemelo sólo los materiales Hiperreal/Matrix reciben reflejos de un pequeño entorno de paneles de luz; el resto de la escena conserva su aspecto y su coste.

## Ficheros por pieza

- `inventario/assets/catalog/<nn>/hiperreal.glb` · LOD web (texturas de color a 2K y mapas de datos a 1K en WebP; objetivo ≤ 5 MB).
- `inventario/assets/catalog/<nn>/hiperreal/hiperreal-hd.glb` · LOD HD para Unreal (color 4K, datos 2K).
- `inventario/assets/catalog/<nn>/hiperreal.blend` · máster; las texturas de la biblioteca se comparten en `inventario/assets/hiperreal-tex/` (ruta relativa `//../../hiperreal-tex/`).
- `inventario/assets/catalog/<nn>/hiperreal.manifest.json` · clases de material, tamaños, fuentes CC0.
- `inventario/assets/catalog/<nn>/hiperreal/preview/` · comparativa antes/después.

Se conservan los nombres de objeto y todas las propiedades de inventario (`inventoryNumber`, `inventoryId`, `mediaSurface`, `surfaceId`, `screenTarget`…).

## Pipeline (`admira-xp/tools/hiperreal/`)

1. `pipeline.py --mode build` (Blender 5.2, sobre el `.blend` del perfil de origen, normalmente Best):
   - Escala uniforme de productos cuando un padre los aplasta (`uniform_products`, el problema de la 47).
   - Aplica los biseles procedurales a la geometría.
   - Clasifica cada material por nombre (palabras clave), por color de la paleta Starbucks o por color/metalicidad, y le asigna un juego PBR CC0: `wood`, `wood_dark`, `wood_stained`, `stone`, `metal`, `metal_dark`, `powder`, `glass`, `led`, `ceramic`, `paper`, `cardboard`, `plastic`, `pastry`, `rubber`, `screen`, `gloss_black`, `keep`.
   - `texlib.py` tiñe la veta real (roble Poly Haven 4K, piedra) al color de diseño de cada material y genera ORM con huellas y manchas (ambientCG).
   - UV a escala física (veta a lo largo de la tabla).
   - Variación sembrada por nombre en objetos sueltos (bollería, platos, tiques), girando sobre el centro de cada objeto. Las calcomanías planas (< 1,5 mm, `decal_max_m`: etiquetas impresas) no se mueven nunca.
   - Exporta el HD y guarda el máster.
2. `lod.sh <n>` · `gltf-transform`: dedup → resize 2K/1K → WebP q84 (→ quantize si pasa de 5 MB).
3. `pipeline.py --mode before|after` · render rápido en Cycles (32 muestras): estudio Matrix neutro frente a tienda (HDRI comfy_cafe, focos cálidos, suelo de hormigón, pared de yeso, polvo y bisel de sombreado sólo en render).
3b. `webglass.py` (dentro de `lod.sh`) · regla del LOD web para el cristal, ver tanda 7.
4. `compose.py <tanda> "<piezas>"` · `/workspace/uploads/hiperreal-tanda<N>-comparativa.png` y JPG por pieza.

`run_batch.sh "<piezas>" [muestras]` encadena build + before + after. Los ajustes por pieza van en `pieces.json` (`material_classes`, `coat`, `front`, `expo`, `led_render`, `keep_uvs`, `jitter`…).

## Límites honestos

- Hiperreal mejora materiales, luz e imperfección; no remodela. Las piezas de geometría muy simple (silla 49, mesa 48, cajas de la barra) siguen siendo cajas bien acabadas.
- El botellero 50 ya era PBR: gana sobre todo peso web (4,96 MB → 1,0 MB) y la luz Hiperreal.
- Las medidas siguen siendo interpretativas, no un levantamiento.

## Tanda 2 · piezas nativas de demo (08-10-2026)

Piezas: 2 Estantería, 3 Botellero, 7 Escritorio, 9 Planta, 10 Lámpara, 13 Pantalla TFT, 15 Tablet de satisfacción, 51 Librería
(no existe `catalog/01`). `admira-xp/demos/catalog.json` solo tiene escenarios Starbucks: no hay escena 365/Lenovo con piezas del catálogo que priorizar.

**Detalle geométrico real** (`detail()` en `pipeline.py`, tras los materiales y antes de las UV):
- cajas de 8 vértices (madera, lacado, metal, plástico, piedra): bisel real de hasta 4 mm (2 segmentos);
- tableros finos de madera: cantos de ABS (material propio, un 16 % más oscuro y satinado);
- tableros verticales grandes (>35 cm): panel con ranura perimetral (inset 4 cm, 3 mm de fondo);
- por pieza: `kick_plate` (zócalo empotrado de aluminio oscuro) y `detail.handles` (tirador de barra en frentes de cajón/puerta);
- las cajas ya redondeadas de las piezas nativas (98 vértices) y las mallas trianguladas no se tocan.
- los textos 3D (letreros) se exportan también (tipo FONT) para no perder la identidad visual.

**Encuadre**: `front` admite `-Y`, `+Y`, `+X`, `-X` (la estantería 2 mira a `+X`). La pared, el zócalo de pared y las luces se colocan según ese frente.

**Fondo de las comparativas**: microcemento cálido liso y pared pintada mate con rodapié; sin texturas de hormigón ni yeso. El polvo de las superficies superiores baja a la mitad.

**Límites honestos**: las piezas nativas 3, 7, 9, 10, 13 y 15 están hechas con cajas ya redondeadas o mallas trianguladas, así que el detalle geométrico automático no les añade nada; mejoran solo por materiales. El escritorio 7 no recibió tirador (su cajonera no es una caja simple). Donde más se nota el detalle es en la librería 51 (biseles, cantos y panel trasero) y en la estantería 2 (paneles laterales y zócalo).

## Tanda 3 · resto de nativas (08-10-2026)

Piezas: 4 Lotería, 5 Vending, 6 Revistero, 8 Puerta, 11 Alfombra, 12 LED Banner, 14 Mupi Metahuman, 16 Aroma, 17 Mesa DJ, 18 Gestor de turnos.

Overrides nuevos en `pieces.json` para piezas de formas redondeadas o trianguladas (donde `detail()` no actúa):
- `add_parts`: piezas reales con nombre `Hiperreal …` en coordenadas de mundo (caja o cilindro, clase de material y color). Usado en 5 (trampilla, tirador, zócalo), 7 (tirador del cajón), 8 (bisagras, placa de patada), 12 (soportes, cable) y 16 (rejilla). Pasan después por el bisel automático.
- `place_on_front`: coloca objetos con nombre (letreros 3D) sobre el frente de la pieza: `[dx, dz, escala, plano]`. Arregla los letreros de 13 y 14, que en Best estaban 2,4 m bajo el suelo.
- `material_classes` → `powder` en la alfombra 11 para el relieve fino del tejido.

Pendiente: la pieza 1 (Mostrador) usa `assets/mostrador/counter-interpreted-*.glb` y `counterURL`, fuera del catálogo; necesita soporte propio en `counter-asset.mjs` antes de tener Hiperreal. La alfombra 11 mejora solo por materiales; 4, 6, 17 y 18 recibieron piezas manuales en r23 (ver abajo).

## Tanda 4 · primeras Pixeria (19–27)

- Nuevas clases de material: `fabric` (trama tejida en normal + sheen de terciopelo, sin laca), `leather` (grano y laca suave) y `carpaint` (laca 1.0 / rugosidad 0.03). Mosaico en `tile_m`: tela 0,12 m, cuero 0,35 m.
- `object_classes` en `pieces.json`: separa un material compartido por nombre de objeto (p. ej. el `black` del sillín pasa a cuero mientras los neumáticos siguen siendo goma).
- `add_parts` admite `rot` (grados) para discos de freno y antenas inclinadas.
- Texturas de autor: si un material ya trae su propia imagen de color base, el pipeline ya no le reescribe las UV con proyección de caja (era la causa de la madera a rayas en la estantería 2 y la librería 51 en el visor web).
- `install.py TANDA "n …"` copia LOD web, HD y .blend al catálogo y escribe `hiperreal.manifest.json`.
- Caché por pieza: `HIPERREAL_REVISION` en `inventario/quality-model.mjs` sube la revisión de una pieza ya publicada cuando se reconstruye.

## Tanda 5 · Pixeria 28–35

- `metal_dark` se neutraliza (85 % hacia gris) antes de subir la luminancia: el hierro no hereda el tinte del color original (correas azuladas del 27).
- Pinball 30: `add_parts` con lanzador y botones de flipper. El cristal sobre el tablero se quitó: el visor web no tiene transmisión y lo pintaba como una losa gris opaca.
- Cloudflare Pages (xpaceos.pages.dev): el workflow quita del paquete todo archivo de más de 25 MiB y lo redirige (302) a `raw.githubusercontent.com/<repo>/<commit>/…`, la copia fija del mismo commit. No hace falta tocar `.gitattributes` al añadir piezas pesadas.

## Tanda 6 · Pixeria 36–43 (catálogo completo)

Piezas: 36 Mesa casco espacial, 37 Mesa ogro, 38 Sillón gorila, 39 Sofá verde, 40 Chanclas azules, 41 Máquina arcade, 42 Caballo de madera, 43 Silla de madera. Con ellas todas las piezas del catálogo (2–52) tienen Hiperreal; la pieza 1 (Mostrador) sigue fuera del catálogo.

- Sin clases nuevas: sólo `material_classes` y `object_classes` en `pieces.json` (patas de hierro en 36, asiento de tela en 38, patas de madera oscura en 39, suela de goma en 40, puerta de monedas metálica en 41).
- **Nada de `glass` sobre superficies**: el visor web no tiene transmisión y lo pinta como una losa gris opaca (lección del pinball 30). Visera del casco 36 y pantalla de la arcade 41 usan `screen` (laca brillante), no cristal.
- `jitter: {}` en la mesa ogro 37: ojos y sonrisa son piezas pequeñas de cerámica y la variación por defecto los despegaba de la cara.
- Todas son mallas redondeadas: `detail()` no añade geometría y mejoran por materiales y luz. Web 0,05–0,97 MB, HD 0,35–7,0 MB.
- Coche 29 (revisión 2): la sirena del techo y los faros pasan de `glass` a `plastic` brillante. En el visor web el cristal perdía el rojo de la sirena; se vio al revisar 28–35 en el visor publicado.
- ~~Siguen con `glass`: botellas ámbar de 2, faros/parabrisas de 19, 20 y 23 y la vitrina 46.~~ Resuelto en la tanda 7 (r22) con `webglass.py`; la vitrina 46 conserva su cristal.
- Comprobación: además de cargar el GLB, captura de cada pieza en el visor web publicado (`/inventario/?asset=<n>&quality=hiperreal#mostrador`).

## Despliegue de admira-store (Cloudflare Pages)

`.github/cloudflare-grandes.sh` (lo llaman el flujo `cloudflare-pages.yml` y `deploy.sh`) quita del paquete todo archivo de más de 25 MiB y antepone en `_redirects` un 302 a la copia de XpaceOS: primero `raw.githubusercontent.com/csilvasantin/xpaceos/<commit espejado>/…` (de `version.json.mirrorOf`), si no `www.xpaceos.com/…`, y como último recurso la copia de la propia tienda en GitHub. Sólo acepta un destino que responda 200 con el mismo tamaño y nunca apunta a admira.store: sin bucles. Ya no hay entradas a mano en `.gitattributes` ni en `_redirects`.

## Tanda 7 · Mostrador (pieza 1) y cristal en el LOD web (r22)

**Mostrador (pieza 1)**. No está en `catalog/`: sus perfiles son `inventario/assets/mostrador/counter-interpreted-<perfil>.{glb,blend,manifest.json}`.
- `pieces.json` → `"1"` con `source: counter-interpreted-best` (el `.blend` se pasa a mano; `run_batch.sh` sólo conoce `catalog/<nn>/`), clases por material (terrazo → `stone`, roble aceitado → `wood` con su textura de autor, laca petróleo → `plastic` con capa 0,45, latón satinado → `metal`, luz de estado → `led`, pantalla del TPV → `keep`) y `jitter: {}`.
- `pipeline.py` quita del `.blend` los objetos de estudio que nunca forman parte del asset (`exclude_re`, por defecto `not_exported`: el `studio_ground_not_exported` del Mostrador).
- Instalación: `counter-interpreted-hiperreal.glb` (web, 1,9 MB), `mostrador/hiperreal/hiperreal-hd.glb` (HD, 11,9 MB), `counter-interpreted-hiperreal.blend` (máster; `remap_tex.py` reescribe las texturas a `//../hiperreal-tex/`), `counter-interpreted-hiperreal.manifest.json` y `mostrador/hiperreal/preview/hiperreal-1-comparativa.jpg`.
- Código: `counter-asset.mjs` admite `hiperreal` (`COUNTER_TIERS`, caché `COUNTER_HIPERREAL_VERSION`) y `hiperrealExtrasBase(n)` da la carpeta del render y del HD (catálogo o mostrador). `HIPERREAL_BATCHES[7]=[1]`: el inventario ofrece Hiperreal y el gemelo Best carga Hiperreal → Best (la pieza 1 no tiene Matrix). Se conservan nombres de nodo, `componentId`, `inventoryNumber 1`, `inventoryId native:counter` y la superficie `existing_shared_player` del TPV.
- Límite honesto: el Mostrador ya venía biselado (4 segmentos), así que `detail()` no añade geometría; mejora por materiales, imperfección y luz.

**Cristal en el LOD web** (`webglass.py`, último paso de `lod.sh`). El visor web no tiene transmisión fiable: el cristal pequeño desaparecía (faros de 19, 20 y 23) o se veía como una losa (pinball 30). Regla por defecto: un material que el pipeline clasificó como `glass` (`extras.hiperreal_class`) y cuyas mallas miden ≤ 0,35 m en su lado mayor pasa, sólo en el LOD web, a laca opaca brillante con su tinte original (se deshace el aclarado del 78 %), capa 1/0,03 y un brillo suave si es una lente blanca (faro). El HD para Unreal conserva el cristal real.
- Aplicado a 2 (botellas ámbar), 19 (faro y parabrisas), 20 (faro y parabrisas ahumado) y 23 (faro); `HIPERREAL_REVISION` sube su caché (2 → 3; 19, 20, 23 → 2).
- No se toca: la vitrina 46 (cristal grande, 6 m), el PET azul de 50 y el piloto 47 (cristal de autor, clase `keep`).
- `webglass.py <glb> --dry` lista los cristales de un GLB y si son pequeños o grandes; `--max` cambia el umbral.

**Comprobación en el visor**: `visor_shot.py BASE OUT n:calidad[:vista+zoom]` (Chromium sin cabeza, WebGL por SwiftShader) guarda capturas del visor publicado, p. ej. `python3 visor_shot.py https://www.xpaceos.com shots 1:hiperreal 19:hiperreal 2:hiperreal:front+4`.

## r23 · piezas manuales (4, 6, 17, 18) y etiquetas de la estantería 2

**Piezas manuales** (`add_parts` en `pieces.json`, nombres `Hiperreal …`, se biselan solas):
- 4 Lotería: barra reposapiés de latón con dos soportes; terminal de lotería sobre la encimera (cuerpo, pantalla inclinada 20° clase `screen`, ranura y boleto impreso).
- 6 Revistero: una varilla de latón Ø 1 cm con dos postes delante de las revistas de cada grada (z 0,29 / 0,61 / 0,93).
- 17 Mesa DJ: la misma barra reposapiés que la Lotería (comparten bajo de mostrador), 8 potenciómetros negros a los lados del canal del mezclador y 2 faders.
- 18 Gestor de turnos: dispensador de tiques en el poste (cuerpo, botón rojo, ranura y tique) y brida de anclaje con 4 tornillos.
- Sin cristal (regla del visor web). Web 0,26 MB (18) – 2,4 MB (4); se conservan nombres de nodo e `inventoryNumber`. `HIPERREAL_REVISION` → 2.

**Etiquetas de la estantería 2**: las etiquetas impresas de los paquetes son mallas planas cuyo origen está en el origen de la estantería. La variación de papel (3 mm, 3°) las giraba sobre ese origen y las desplazaba varios centímetros: se metían en el paquete o en el de al lado. Ahora `pipeline.py` no aplica variación a objetos de grosor < `decal_max_m` (1,5 mm por defecto) y el giro de los demás es sobre el centro de su geometría. Estantería 2 reconstruida (`jittered_items` 0, `decals_kept` 90), `HIPERREAL_REVISION` 2 → 4.

**Revisados sin cambios en r23**: la estantería de tazas 47 (cristal de autor) y el PET azul del botellero 50 se ven bien en el visor web publicado, al nivel de Best.
