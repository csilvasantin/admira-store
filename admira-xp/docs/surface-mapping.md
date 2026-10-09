# Encaje de pantallas virtuales / Virtual screen fit

## Español

La apertura es el área activa dentro del marco de una pantalla. El contenido se aplica a esa apertura; el bisel, la pared, las juntas, la puerta y los objetos que están delante conservan su representación original. El mismo límite sirve para NEXT STEP, las campañas de Creador y los players virtuales de Matrix.

En SneakerStore, Entrada, Centro y Fondo utilizan las fotografías originales de IEU. La fotografía se muestrea por la dirección del rayo de cámara y las aperturas usan esa misma referencia angular. Girar o ampliar mantiene ambas capas alineadas; el encaje no depende de la posición inicial del visor. Los puntos de calibración pertenecen al área activa interior, no al borde exterior del soporte. Los mapas inválidos se ocultan en vez de producir una superficie fuera de su soporte.

Jordan conserva cinco aperturas independientes, con los recortes del maestro común. El LED del fondo utiliza tres zonas físicas en las tres fotografías: lateral izquierdo, parte superior y lateral derecho. El hueco de la puerta y la silueta del mostrador se protegen por separado. El contenido continuo puede atravesar los recortes del maestro, pero cada fragmento queda dentro de su pantalla.

En la planta 3D, aplicar una campaña cambia la textura y su recorte. Conserva la geometría del soporte y los límites de su área activa, también en la pantalla vertical de entrada, la columna, el iPad y las tiras de exposición. El contenido se ajusta dentro de esos límites conservando su aspecto; cuando las proporciones difieren, deja bandas en lugar de estirarse. Los siete perfiles de composición originales se mantienen. Al detener se recuperan las texturas y playlists originales; IDs, distribución guardada, historial y preferencias se mantienen.

Matrix utiliza un contenedor exterior que recorta la pintura de su player antes de la transformación de cuatro esquinas. Así, el contenido hijo no rebasa la apertura con bordes, sombras o sus propias dimensiones. La calibración personalizada y los IDs/URLs guardados se conservan. Para ajustar una pantalla en el Editor de geometría, marca las cuatro esquinas interiores siguiendo el orden indicado, revisa el resultado al girar y ampliar y guarda o exporta el mapa con los controles existentes.

Para revisar SneakerStore, abre [Entrada](https://www.admira.store/xpacios/sneakerstore/?campaign=next-step&scene=entrada&lang=es), cambia a Centro y Fondo y usa el arrastre, las flechas y +/−. Revisa los cuatro bordes de la pantalla junto a la puerta, la columna LG vertical, los cinco paneles Jordan y el contorno completo del LED trasero. Pausa permite ver un fotograma estable; reiniciar y parar mantienen el reloj y la restauración de ambas representaciones.

El recorrido fotográfico 360 gira y amplía desde un punto fijo. No simula desplazamiento ni paralaje medido. La planta 3D sigue siendo una interpretación de las fotografías, pendiente de medición de la tienda. El encaje virtual no certifica la anamorfosis física ni la sincronización de equipos.

Calibración aplicada a 50 superficies en las tres posiciones. Validación del render: 17 vistas de escritorio y formato vertical, FOV 35–95°, giros e inclinaciones; cero píxeles fuera de las aperturas con un píxel de tolerancia y cobertura interior mínima observada del 99,93 %. La prueba utiliza PNG del render GPU; las capturas JPEG no sirven para medir bordes. Evidencia reproducible: `xpacios/sneakerstore/mapping-validation.json`. Cada publicación requiere también revisión visible de las URLs públicas.

## English

The aperture is the active area inside a screen frame. Content is applied to that aperture; bezels, walls, joints, the doorway and foreground objects retain their original representation. The same boundary applies to NEXT STEP, Creator campaigns and Matrix virtual players.

SneakerStore Entrance, Centre and Rear use the original IEU photographs. Photograph sampling follows the camera-ray direction and apertures use the same angular reference. Rotation and zoom retain alignment between both layers; fit does not depend on the initial view. Calibration points belong to the inner active area, not the outside edge of the support. Invalid maps are hidden rather than rendering beyond their support.

Jordan retains five independent apertures with crops from the shared master. The rear LED uses three physical zones in all three photographs: left side, upper section and right side. The doorway opening and counter silhouette are protected separately. Continuous content may span the master crops, while each fragment stays inside its screen.

In the 3D floor plan, applying a campaign changes its texture and crop. Support geometry and active-area bounds are retained, including the entrance portrait screen, vertical column, iPad and exhibition strips. Content fits inside those bounds while preserving its aspect; differing proportions produce letterboxing rather than stretching. All seven original composition profiles are retained. Stop restores original textures and playlists; IDs, saved layout, history and preferences are retained.

Matrix uses an outer container that clips player paint before the four-corner transformation. Child content cannot cross the aperture through borders, shadows or its own dimensions. Custom calibration and saved IDs/URLs are retained. To adjust a screen in Geometry editor, mark the four inner corners in the indicated order, inspect rotation and zoom, then save or export the map with the existing controls.

To review SneakerStore, open [Entrance](https://www.admira.store/xpacios/sneakerstore/?campaign=next-step&scene=entrada&lang=en), switch to Centre and Rear and use drag, arrow keys and +/−. Inspect all four edges of the screen beside the doorway, the vertical LG column, all five Jordan panels and the full rear LED outline. Pause holds a stable frame; restart and stop retain the shared clock and restoration in both representations.

The photographic 360 tour rotates and zooms from one fixed position. It does not simulate translation or measured parallax. The 3D floor plan remains an interpretation of the photographs and awaits a measured shop survey. Virtual fit does not certify physical anamorphic calibration or hardware synchronization.

Calibration applied to 50 surfaces across the three positions. Renderer validation: 17 desktop and narrow views, FOV 35–95°, rotation and tilt; zero pixels outside the apertures with one-pixel tolerance and minimum observed interior coverage of 99.93%. Tests use GPU-render PNG exports; JPEG screenshots cannot measure boundaries. Reproducible evidence: `xpacios/sneakerstore/mapping-validation.json`. Each release also requires visible review of the public URLs.

## Contrato para agentes / Agent contract

- Source photographs: `xpacios/sneakerstore/panoramas/{entrada,centro,fondo}.jpg`; files remain unchanged.
- Shared camera-ray photograph/aperture renderer: `admira-xp/scripts/panorama-surface.mjs`; finite/convex projective validation: `admira-xp/scripts/surface-projection.mjs`.
- Calibration: `xpacios/sneakerstore/next-step/panorama-map.mjs`, inner-aperture points on the 2048 × 1024 reference grid. Jordan source: `xpacios/sneakerstore/jordan-reference.mjs`.
- Optional `surface.aperture`: clockwise source-photo polygon on the 2048 × 1024 grid; default boundary follows `quad[0], quad[1], quad[3], quad[2]`. The inward safety clip is 0.2 reference pixels; rear shared zone joins use `guard:0` after calibrating their outer edges inside the LED. Invalid projective or aperture geometry fails closed.
- Photo view: `xpacios/sneakerstore/panorama.mjs` and `next-step/panorama-overlay.mjs`; one fixed-origin perspective camera, yaw/pitch and FOV controls.
- Campaign application: `xpacios/sneakerstore/next-step/twin.mjs`; source texture/crop and bounded content-plane fit within fixed `userData.aperture {w,h}` bounds, shared local clock and exact original map/UV/position/scale/visibility restoration on stop. The shared fit helper is `xpacios/sneakerstore/screen-format.mjs` → `fitScreenAperture`.
- Matrix players: `admira-xp/scripts/matrix-panorama.mjs` and its outer-player styles; retain saved maps and clip child paint to the aperture.
- Contracts: `mcp/manifest.json` → `nextStepCampaign.panorama.surfaceMapping`; `mcp/funcionalidades.json` → `next_step_360.surfaceMapping`.
- Actual MCP: [mcp.admira.store](https://mcp.admira.store/mcp), existing `help({topic:"next-step"})`, `help({topic:"campanas-instalacion"})` or `help({topic:"surface-mapping"})`; bilingual read-only help, no new physical write action.
- Local GPU validation: `tests/fixtures/sneaker-surface-fit.html` and `tests/validate-panorama-fit.py --canvas-only`; export the original and magenta PNGs at the same camera pose, plus the visible metadata.
- Acceptance: check active-aperture containment, rear-zone coverage and foreground protection during rotation and zoom; include desktop and narrow viewports, both languages, NEXT STEP and a recovered Creator campaign, pause/restart/stop and saved Matrix-map preservation. Test results and public proof are recorded separately at delivery.
- Pending: measured physical geometry, translational reconstruction/parallax, physical anamorphic export calibration and hardware synchronization.
