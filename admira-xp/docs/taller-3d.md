# Taller 3D · recetas / 3D workshop · recipes

ES: El Taller 3D convierte las fotos de una visita en piezas del catálogo: modelos Good, Better y Best (y Hiperreal si se pide), maestros Blender, manifiestos, render de revisión y una hoja foto | 3D. Todo sale de una **receta**: un JSON por encargo que guarda las fotos de origen, los recortes, las texturas y cada pieza. Es la primera fase del Arquitecto automático que pidió Carlos el 18-10-2026; las siguientes llevarán la receta al Arquitecto de admira.biz.

EN: The 3D workshop turns the photos of a visit into catalogue pieces: Good, Better and Best models (and Hiperreal on request), Blender masters, manifests, a review render and a photo | 3D sheet. Everything comes from a **recipe**: one JSON per job holding the source photos, crops, textures and every piece. It is phase one of the automatic Architect Carlos asked for on 18-10-2026.

## Cómo se usa / How to use

1. Fotos en una carpeta local. Si salen personas, la receta lo marca (`"publicables": false`) y solo se guardan recortes de objetos. / Photos in a local folder; when people appear only object crops are kept.
2. Receta en `admira-xp/tools/taller-3d/recetas/`. / Recipe in that folder.
3. Ejecutar / run:
   ```sh
   TALLER_PY=<python con Pillow y NumPy> admira-xp/tools/taller-3d/taller.sh admira-xp/tools/taller-3d/recetas/<receta>.json [--fotos <carpeta>] [--piezas 53,54] [--hoja <carpeta>]
   ```
   Hace recortes (solo con `--fotos`), texturas, modelos con física, manifiestos, render y hoja de comparación. `--salida` y `--texturas` permiten un ensayo fuera del catálogo. / Builds crops, textures, physics-driven models, manifests, render and comparison sheet; `--salida`/`--texturas` allow a dry run.
4. Revisar la hoja foto | 3D; dar de alta la pieza en el inventario y en el layout; publicar con respaldo. / Review the sheet, register the piece, publish with a backup.

## Recetas / Recipes

| Receta / Recipe | Piezas / Pieces | Notas / Notes |
|---|---|---|
| `cestas-pg103.json` | 53 vasos BE GREEN, 54 snacks, 55 café 1971 | Fotos de Carlos del 17-10-2026, no publicables. Reproduce los modelos publicados nodo a nodo, también las posiciones de la física. / Reproduces the published models node by node. |
| `botellero-pg103.json` | 50 botellero Solán de Cabras | Rehecho el 18-10-2026 con la cesta trenzada de la foto ITIL y el panorama (antes torre de alambre). Conserva las 19 botellas editables, la botella suelta y el tamaño de cesta que usa Matrix · TPV (borde a 0,74 m, radio 0,215 m). Cartel «AIGUA MINERAL», como en el panorama. / Rebuilt with the woven basket; keeps the 19 editable bottles, standalone bottle and Matrix · POS basket size. |

## Formato / Format (`xpaceos.taller-3d.receta/1`)

- `encargo`, `descripcion`, `local`: identidad del encargo y del Xpacio. / Job and venue identity.
- `fotos`: autor, lugar, fecha, `publicables` y nota. / Author, place, date, publishable flag.
- `fuentes`: carpeta de recortes en `fuentes/`; `texturas_dir`: dónde quedan las texturas. / Crop folder and texture folder.
- `texturas`: operaciones con nombre, cada una con su semilla:
  - `recorte`: 4 esquinas, o cilindro para un vaso.
  - `tejido`, `cuerda`, `acero`: tejido, cuerda y acero procedurales.
  - `vaso`: tinta de la foto repintada en limpio.
  - `foto` y `foto_retocada`: recorte aplanado; la retocada rellena zonas y redibuja líneas.
  - `cartel_foto` y `cartel_texto`: carteles fotografiados o de texto.
  - `bolsa_snack`, `pet`, `orm`, `normal_polvo`, `collar`: bolsas, PET y mapas.
  - EN: named operations, each with its own seed.
- `piezas`: número e identidad de catálogo, nombres ES/EN, referencia, instancia, `origen` (`esquina` para piezas colocadas en el gemelo, `centro` para el botellero), `huella`, y:
  - `mueble`: familia `cesta_trenzada` con `borde` [alto, radio], `fondo` [alto, radio], `repeticion` del tejido y `pie` (apertura de la cruceta).
  - `carteles`: placa con cara impresa, de pie o en `poste`, con inclinación.
  - `contenido`: `vasos` (caen por tandas), `bolsas_almohada` (caen en capas), `bolsas_de_pie` (filas en abanico) o `botellas` (anillos, cada botella con identidad propia).
  - `hiperreal`: tanda y mapas compartidos de `inventario/assets/hiperreal-tex/`.
  - `comparar`: foto y recorte para la hoja foto | 3D.

## Física / Physics

ES: Vasos y bolsas caen con Bullet, que es determinista. Las reglas del taller evitan los fallos ya vistos:
- El centro de masas va en el centro de cada objeto. Si va en la base, el vaso se levanta solo.
- Los objetos nunca empiezan solapados.
- Un cuenco de colisión macizo, con tubo de guarda, impide que nada salga despedido.
- Las tandas caen desde poca altura.
- La construcción falla si algún objeto acaba fuera de la cesta.

EN: Bullet, deterministic. The mass centre sits mid-object, nothing starts overlapped, a solid guard bowl contains every drop, batches fall from low height, and the build fails if anything ends outside the basket.

## Hiperreal del taller / Workshop Hiperreal

ES: Para el botellero, el taller exporta el mismo modelo Best con barniz (clearcoat) en el PET y en el cordón, y con los mapas CC0 compartidos de pintura en polvo y plástico.
- Web: `hiperreal.glb`, con texturas WebP.
- HD: `hiperreal/hiperreal-hd.glb`.
- Mantiene los nombres de nodo y la identidad de Best.
- No aplica la luz de tienda ni las imperfecciones del pipeline Hiperreal completo (`admira-xp/tools/hiperreal`).

EN: Same Best model with clearcoat and the shared CC0 powder/plastic maps; WebP web LOD and HD; node names and identity preserved; no store lighting or imperfection pass.

## Siguientes fases / Next phases

1. **Orden «detallar» en el Arquitecto** (admira.biz):
   - Subes fotos o vídeo y eliges el local.
   - Admirito arquitecto propone qué objeto es cada uno, dónde va y qué parte sirve de textura.
   - Al confirmar, genera la receta y la manda al taller.
   - EN: "detail" order: upload photos, confirm the proposal, the recipe goes to the workshop.
2. **Cierre automático**:
   - El taller prepara el cambio con la hoja foto | 3D.
   - Carlos lo aprueba en el Arquitecto.
   - Se publica con respaldo y se da de alta en Yokup.
   - EN: the workshop prepares the change; Carlos approves; publish with backup and Yokup registration.

## Límites / Limits

- Medidas nominales, no medidas en tienda. Los contenidos son relleno visual, no existencias. / Nominal dimensions; contents are visual filling, not stock.
- Las fotos con personas no se publican nunca. / Photos showing people are never published.
- Volver a ejecutar una receta da el mismo modelo. Las texturas procedurales pueden cambiar en el ruido fino según la versión de NumPy. / Re-running gives the same model; fine noise may vary.
