# Matrix47 · Proyecto Unreal nativo / Native Unreal project

## Abrir y revisar / Open and inspect

ES: Descomprime `matrix47-unreal.zip` y abre `Matrix47.uproject` con Unreal Engine **5.8**. Conserva las carpetas **Content**, **Config**, **Scripts** y **SourceAssets** junto al proyecto. Abre el mapa **`/Game/Matrix47/Matrix47`** desde Content Browser. En World Outliner selecciona **`Studio47 · Matrix hero camera`** y usa Pilot para revisar el encuadre del estudio. La secuencia de Movie Render Queue es **`/Game/Matrix47/Matrix47Studio`**. La escena nativa está construida, guardada y reabierta; el render está verificado localmente.

EN: Extract `matrix47-unreal.zip` and open `Matrix47.uproject` in Unreal Engine **5.8**. Keep **Content**, **Config**, **Scripts** and **SourceAssets** beside the project. Open the **`/Game/Matrix47/Matrix47`** map from the Content Browser. Select **`Studio47 · Matrix hero camera`** in the World Outliner and use Pilot to inspect the studio composition. The Movie Render Queue sequence is **`/Game/Matrix47/Matrix47Studio`**. The native scene is built, saved and reopened; its render is verified locally.

## Luz y render / Lighting and rendering

ES: Este proyecto usa **Lumen mediante software ray tracing**, luces de área y sombras virtuales, sin requerir hardware ray tracing. El actor **Matrix · Lumen studio settings** mantiene la iluminación global y reflejos Lumen y la exposición manual calibrada en **EV 8**. Para ajustar la luz, selecciona los RectLight del estudio; sus nombres permiten distinguir luz principal, relleno, borde y tiras cálidas de las baldas. Conserva los IDs y grupos de productos al modificar luces o cámara.

EN: This project uses **Lumen with software ray tracing**, area lights and virtual shadows, without requiring hardware ray tracing. The **Matrix · Lumen studio settings** actor retains Lumen global illumination/reflections and manual exposure calibrated at **EV 8**. To adjust the lighting, select the studio RectLight actors; their names distinguish key, fill, rim and warm shelf strips. Retain product IDs and groups when editing lights or the camera.

| Actor / Actor | Función / Purpose | Temperatura / Temperature |
| --- | --- | --- |
| `Key · large warm window` | Principal cálida / warm key | 5200 K |
| `Fill · cool photographic bounce` | Relleno frío / cool fill | 6500 K |
| `Top rim · warm sheen` | Borde superior / top rim | 4100 K |
| `Shelf … Bay … warm strip` | Luz cálida de balda / warm shelf strip | 3600 K |

ES: Abre **`/Game/Matrix47/Matrix47Studio`** y usa Movie Render Queue para repetir la imagen fija con **1920 × 1600**, **8 muestras espaciales** y una muestra temporal. `Scripts/render_matrix.py` conserva esos ajustes, la cámara y el calentamiento del render; `Scripts/refine_studio.py` conserva la calibración de exposición y encuadre. La salida nativa es `Renders/unreal-studio.0000.png`; la imagen distribuida se llama `preview/unreal-studio.png`. `unreal-verification.json` registra engine, IDs y render confirmado.

EN: Open **`/Game/Matrix47/Matrix47Studio`** and use Movie Render Queue to repeat the still at **1920 × 1600**, **8 spatial samples** and one temporal sample. `Scripts/render_matrix.py` retains those settings, the camera and rendering warm-up; `Scripts/refine_studio.py` retains exposure and composition calibration. Native output is `Renders/unreal-studio.0000.png`; the distributed image is `preview/unreal-studio.png`. `unreal-verification.json` records the engine, IDs and confirmed render.

ES: [Ver render de Unreal](https://www.xpaceos.com/inventario/assets/catalog/47/collection-matrix/preview/unreal-studio.png) · [Descargar proyecto Unreal](https://github.com/csilvasantin/xpaceos/releases/download/matrix47-20261008/matrix47-unreal.zip).

EN: [View Unreal render](https://www.xpaceos.com/inventario/assets/catalog/47/collection-matrix/preview/unreal-studio.png) · [Download Unreal project](https://github.com/csilvasantin/xpaceos/releases/download/matrix47-20261008/matrix47-unreal.zip).

## Objetos e identidad / Objects and identity

ES: El mueble conserva el número de catálogo **47**, `native:starbucksShelves`, la instancia `sb-mugs` y el CI padre `PDG103-EST-01`. Sus cinco baldas y dos bahías contienen **115 productos independientes**, agrupados en **26 referencias visuales**. Los grupos raíz son actores de clase `Actor`; cada producto mantiene sus componentes de malla, tapa, asa, pajita y rotulación. Selecciona el actor raíz para mover el producto completo o expándelo para revisar sus mallas. El actor raíz del mueble conserva `CI_CABINET`.

EN: The cabinet retains catalogue number **47**, `native:starbucksShelves`, instance `sb-mugs` and parent CI `PDG103-EST-01`. Its five shelves and two bays contain **115 independent products** grouped into **26 visual references**. Root groups are actors of class `Actor`; each product keeps its mesh, lid, handle, straw and printed components. Select the root actor to move the complete product, or expand it to inspect its meshes. The cabinet root retains `CI_CABINET`.

| Dato / Field | Contrato / Contract |
| --- | --- |
| Identidad del producto / Product identity | `47-P001`…`47-P115` |
| Nodo raíz / Root node | `CI_…`, coincidente con el manifest / matching the manifest |
| Referencia visual / Visual reference | Una de 26 referencias compartidas / one of 26 shared references |
| Procedencia / Source | Foto de referencia y reconstrucción interpretativa / reference photograph and interpretive reconstruction |
| Existencias verificadas / Verified stock | `stock_verified: false` |
| Medidas / Dimensions | Nominales y aproximadas / nominal and approximate |

ES: Las etiquetas de los actores conservan los IDs de componentes y la condición de stock no verificado. El manifest de la colección es el vínculo entre las referencias y las instancias. Las 26 referencias describen diseños visuales, no SKU comerciales. No se crean fichas CI para cada producto. Yokup sigue siendo el maestro patrimonial.

EN: Actor tags retain component IDs and the unverified-stock condition. The collection manifest links references and instances. Its 26 references describe visual designs, not commercial SKUs. No new product CI records are created. Yokup remains the lifecycle master.

## Verificación nativa / Native verification

ES: Unreal Engine **`5.8.0-55116800`** confirmó construcción, guardado y reapertura de la escena y render Movie Render Queue. La versión Matrix final conserva **2061 StaticMeshActors**, **115 raíces independientes de producto Actor**, **26 referencias** y **40 slots de materiales de vidrio**, con todos los IDs y el CI padre. El render nativo está **verificado** a **1920 × 1600** con **8 muestras espaciales** y Lumen por software. La publicación pública y los enlaces se comprueban por separado en la entrega.

EN: Unreal Engine **`5.8.0-55116800`** confirmed scene construction, saving, reopening and Movie Render Queue rendering. The final Matrix revision retains **2061 StaticMeshActors**, **115 independent product Actor roots**, **26 references** and **40 glass-material slots**, with all IDs and the parent CI. The native render is **verified** at **1920 × 1600** with **8 spatial samples** and software Lumen. Public deployment and links are verified separately at delivery.

## Matrix en navegador / Matrix in the browser

ES: El [visor Matrix de la pieza 47](https://www.xpaceos.com/inventario/?asset=47&quality=matrix#mostrador) sigue usando **WebGL/Three.js**, materiales PBR y luces de estudio portables. Mantiene los objetos 3D seleccionables; la [comparación Todos](https://www.xpaceos.com/inventario/?asset=47&quality=all#mostrador) muestra Good, Better, Best y Matrix para esta pieza. El proyecto Unreal y su render Lumen son entregables nativos separados. La [descarga portable coffee-display-matrix-itil.zip](https://github.com/csilvasantin/xpaceos/releases/download/matrix47-20261008/coffee-display-matrix-itil.zip) conserva los GLB, el visor y el manifest. Los ZIP se distribuyen mediante una release del mismo repositorio público XpaceOS; la imagen renderizada mantiene su ruta canónica.

EN: The [Matrix viewer for piece 47](https://www.xpaceos.com/inventario/?asset=47&quality=matrix#mostrador) continues to use **WebGL/Three.js**, PBR materials and portable studio lights. Its 3D objects remain selectable; the [All comparison](https://www.xpaceos.com/inventario/?asset=47&quality=all#mostrador) shows Good, Better, Best and Matrix for this piece. The Unreal project and its Lumen render are separate native deliverables. The [portable coffee-display-matrix-itil.zip download](https://github.com/csilvasantin/xpaceos/releases/download/matrix47-20261008/coffee-display-matrix-itil.zip) retains the GLBs, viewer and manifest. ZIPs are distributed through a release of the same public XpaceOS repository; the rendered image keeps its canonical path.

## macOS

ES: Este proyecto elige software Lumen para su flujo en Mac. Epic documenta software Lumen en equipos compatibles y soporte experimental de hardware ray tracing en determinados Apple Silicon; consulta los requisitos vigentes para tu equipo antes de cambiar el modo de render.

EN: This project uses software Lumen for its Mac workflow. Epic documents software Lumen on compatible systems and experimental hardware ray tracing on certain Apple Silicon systems; check the current requirements for your hardware before changing the rendering mode.

Fuente oficial / Official source: [Epic · macOS development requirements](https://dev.epicgames.com/documentation/unreal-engine/macos-development-requirements-for-unreal-engine?lang=en-US), consultada / checked 8 October 2026.

Guía de la colección / Collection guide: [Starbucks coffee display 47](https://www.xpaceos.com/admira-xp/docs/starbucks-coffee-display.md).
