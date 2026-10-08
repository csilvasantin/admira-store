# Hiperreal · pipeline por tandas

Hiperreal es el acabado fotorrealista del catálogo: texturas PBR CC0 reales, imperfección (huellas, manchas, variación de posición y giro), cantos biselados y luz de tienda. Se generó a mano en la pieza 47 (piloto) y ahora sale de un pipeline reutilizable que se ejecuta por tandas.

## Estado

| Tanda | Piezas | Publicada |
|---|---|---|
| 0 · piloto | 47 Estantería de tazas y café Starbucks | 08-10-2026 |
| 1 · Starbucks | 44 Barra de preparación, 45 Mostrador de caja, 46 Vitrina, 48 Mesa redonda, 49 Silla, 50 Botellero Solán de Cabras, 52 iPad horizontal | 08-10-2026 |
| 2–6 · nativas y Pixeria | 2–43 y 51 (ver cada tanda abajo) | 08-10-2026 |

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
   - Variación sembrada por nombre en objetos sueltos (bollería, platos, etiquetas).
   - Exporta el HD y guarda el máster.
2. `lod.sh <n>` · `gltf-transform`: dedup → resize 2K/1K → WebP q84 (→ quantize si pasa de 5 MB).
3. `pipeline.py --mode before|after` · render rápido en Cycles (32 muestras): estudio Matrix neutro frente a tienda (HDRI comfy_cafe, focos cálidos, suelo de hormigón, pared de yeso, polvo y bisel de sombreado sólo en render).
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

Pendiente: la pieza 1 (Mostrador) usa `assets/mostrador/counter-interpreted-*.glb` y `counterURL`, fuera del catálogo; necesita soporte propio en `counter-asset.mjs` antes de tener Hiperreal. Las piezas 4, 6, 17, 18 y 11 mejoran solo por materiales.

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
- Comprobación: además de cargar el GLB, captura de cada pieza en el visor web publicado (`/inventario/?asset=<n>&quality=hiperreal#mostrador`).

## Despliegue de admira-store (Cloudflare Pages)

`.github/cloudflare-grandes.sh` (lo llaman el flujo `cloudflare-pages.yml` y `deploy.sh`) quita del paquete todo archivo de más de 25 MiB y antepone en `_redirects` un 302 a la copia de XpaceOS: primero `raw.githubusercontent.com/csilvasantin/xpaceos/<commit espejado>/…` (de `version.json.mirrorOf`), si no `www.xpaceos.com/…`, y como último recurso la copia de la propia tienda en GitHub. Sólo acepta un destino que responda 200 con el mismo tamaño y nunca apunta a admira.store: sin bucles. Ya no hay entradas a mano en `.gitattributes` ni en `_redirects`.
