# Starbucks PG103 · cestas trenzadas / woven baskets

ES: Tres piezas nuevas del Starbucks de Paseo de Gràcia (`alsea-sbux-021`), modeladas desde las fotos que hizo Carlos en la tienda el 17-10-2026. Las tres son cestas de cordón negro trenzado sobre un soporte de acero negro con cruceta en X a ras de suelo; las fotos muestran que el botellero real (50) es esa misma cesta.

EN: Three new pieces of the Paseo de Gràcia Starbucks (`alsea-sbux-021`), modelled from the photos Carlos took in store on 17-10-2026. All three are black woven-cord baskets on a black steel stand with a floor-level X brace; the photos show the real water rack (50) is the same basket.

| Catálogo / Catalog | Identidad / Identity | Instancia / Instance | Contenido / Contents | Referencia / Reference |
|---|---|---|---|---|
| 53 | `native:starbucksCupBasket` | `sb-cup-basket` | Cesta baja, cartel BE GREEN, 28 vasos reutilizables (14 caliente, 14 frío) / low basket, BE GREEN sign, 28 reusable cups | PG103-012, cartel PG103-014 |
| 54 | `native:starbucksSnackBasket` | `sb-snack-basket` | Cesta alta, cartel REFRIGERIS · SNACKS, 26 bolsas interpretadas / tall basket, sign, 26 interpreted bags | PG103-013, P21 |
| 55 | `native:starbucksCoffeeBasket` | `sb-coffee-basket` | Cesta alta, cartel Discover 1971, 11 bolsas Starbucks 1971 Dark Roast 250 g / tall basket, sign, 11 bags | — |

## En el gemelo / In the twin

ES: Abre el gemelo de Paseo de Gràcia (`/admira-xp/?loc=alsea-sbux-021`). La cesta de vasos está delante del pilar y la de snacks en la esquina de la caja, como en la foto; la de café, frente a la estantería de tazas. Good y Better dibujan un boceto con las mismas medidas; Best carga el modelo 53, 54 o 55 y lo cambia por el boceto en cuanto llega. Los clientes las esquivan: su huella entra en las colisiones.

EN: Open the Paseo de Gràcia twin (`/admira-xp/?loc=alsea-sbux-021`). The cup basket stands in front of the pillar and the snack basket at the counter corner, as in the photo; the coffee basket faces the mug shelf. Good and Better draw a same-size sketch; Best loads model 53, 54 or 55 and swaps it in when it arrives. Customers walk around them: their footprint is part of the colliders.

En el inventario / In the inventory: `/inventario/?asset=53`, `54`, `55` muestran Good, Better y Best y permiten descargar GLB y Blender. / show Good, Better and Best and offer GLB and Blender downloads.

## Contrato / Contract

- Archivos / Files: `inventario/assets/catalog/{53,54,55}/{good,better,best}.{glb,blend}`, `*.manifest.json`, `preview.png`; texturas fuente / source textures `inventario/assets/catalog/cestas/textures/`.
- Origen / Origin: esquina de la huella de .64 × .64 (glTF X = columna, Z = fila, frente +Z), como el resto de piezas colocadas del Starbucks. / Corner of the .64 × .64 footprint, like the other placed Starbucks pieces.
- Medidas nominales, sin medir en tienda: borde de .60, alto del borde .50 (53) y .84 (54, 55). / Nominal, unmeasured: .60 rim, rim height .50 (53) and .84 (54, 55).
- Productos: cada vaso o bolsa es un nodo propio con `item_instance` y `stock_quantity_verified: false`. No son existencias. / Each cup or bag is its own node; not stock.
- Texturas de foto / Photo textures: bolsa 1971 por sus cuatro caras, carteles BE GREEN y Discover 1971, sirena del vaso. Tejido, cuerda y acero son procedurales. Las bolsas de snacks son interpretadas: las fotos no muestran sus marcas de cerca. / Snack bags are interpreted; brands not confirmed.
- Las fotos originales no se publican porque salen clientes; solo recortes enderezados de objetos en `admira-xp/tools/taller-3d/fuentes/cestas-pg103/`. / Original photos are not published (customers appear); only object crops are kept.

## Regenerar / Rebuild

ES: Las tres cestas salen del [Taller 3D](taller-3d.md) con la receta `admira-xp/tools/taller-3d/recetas/cestas-pg103.json`, que guarda las esquinas de cada recorte, las texturas y cada pieza. La receta reproduce los modelos publicados nodo a nodo, también las posiciones de la física.

EN: The three baskets come from the [3D workshop](taller-3d.md) recipe `cestas-pg103.json`, which keeps every crop's corners, the textures and each piece. The recipe reproduces the published models node by node, physics poses included.

```sh
admira-xp/tools/taller-3d/taller.sh admira-xp/tools/taller-3d/recetas/cestas-pg103.json [--fotos <carpeta con las fotos originales>]
```

## Pendiente / Pending

- Alta de las tres cestas como CI en Yokup (`itil_ci_upsert`, propuesta `PDG103-CES-01/02/03`). Hasta entonces no aparecen entre las unidades de `/inventario/starbucks/` ni en el editor de superficies. / Yokup CI registration pending; until then they are not listed as units nor editable in the surface editor.
- Hiperreal y Matrix para 53–55. / Hiperreal and Matrix for 53–55.
- Rehacer el botellero (50) con la misma cesta trenzada. / Rebuild the water rack (50) with the same woven basket.
