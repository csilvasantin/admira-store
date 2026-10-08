# Ficha ITIL y 3D / ITIL and 3D record

ES: En https://www.xpaceos.com/inventario/starbucks/ selecciona una unidad registrada. Su ficha reúne código ITIL, instancia 3D, modelo compartido, Xpacio, zona observada en la fotografía y datos pendientes. Dos mesas pueden compartir modelo 48 manteniendo CIs distintos. Las fotografías de tipología no identifican la posición física de cada unidad. Las medidas siguen pendientes de medición de campo; las proporciones del modelo no son medidas verificadas.

EN: Select a registered unit at https://www.xpaceos.com/inventario/starbucks/. Its record brings together ITIL code, 3D instance, shared model, space, photo-observed zone and outstanding data. Two tables can share model 48 while retaining different CIs. Type photographs do not identify each unit's physical location. Dimensions remain pending field measurement; model proportions are not verified dimensions.

ES: «Abrir ficha maestra e histórico en Yokup» conserva el código exacto y abre /equipo-inventario?code=… en otra pestaña. El acceso autorizado de Yokup sigue siendo necesario. La galería no copia datos de compra, garantía, serie ni histórico privado. No comprueba el estado operativo actual. Los 28 candidatos y las 21 referencias de producto conservan su condición: no tienen ficha CI nueva ni alta automática.

EN: “Open master record and history in Yokup” retains the exact code and opens /equipo-inventario?code=… in another tab. Authorised Yokup access is still required. The gallery does not copy purchase, warranty, serial or private history data. It does not verify current operational status. The 28 candidates and 21 product references retain their status: no new CI record or automatic registration.

## Histórico y compatibilidad / History and compatibility

ES: «Histórico de este vínculo visual» recoge la confirmación del listado de Carlos del 1-oct-2026 y la incorporación de esta vista del 2-oct-2026. Es historial del vínculo, no una auditoría de cambios físicos o patrimoniales. El maestro y su histórico permanecen en Yokup. Los códigos, referencias 001–060, modelos 44–50, GLB y Blender se conservan; no se borran preferencias ni el historial CLI.

EN: “History of this visual link” records Carlos's list confirmation on 1 October 2026 and this view's addition on 2 October 2026. It is link history, not a physical or lifecycle change audit. The master and its history stay in Yokup. Codes, references 001–060, models 44–50, GLB and Blender remain intact; preferences and CLI history are retained.

ES: En ⌘ Experto, /ficha PDG103-MES-02 (alias /record) abre la unidad. /marca <id>, /brand y /marca off conservan el cambio de aspecto; al enlazar la ficha se mantienen lang y marca explícitos de la URL. El shell compartido conserva el registro extensible de comandos. /avatarDigital pertenece al trabajo de Woz (FLT-101350, rama smith/avatar-digital-4882): sigue pendiente de publicación y no se sustituye por otro avatar ni se anuncia operativo por esta entrega.

EN: In ⌘ Expert, /record PDG103-MES-02 (Spanish alias /ficha) opens the unit. /marca <id>, /brand and /marca off retain appearance changes; record links carry explicit lang and marca URL values. The shared shell retains its extensible command registry. /avatarDigital belongs to Woz's work (FLT-101350, branch smith/avatar-digital-4882): publication is pending; this release does not replace it or claim it is live.

## Contrato / Contract

manifest.json units remain the confirmed visual mapping. New additive record_history events have date, kind, codes, description, description_en and source. No renumbering. ci-record.mjs refuses ambiguous codes and mismatched model/reference identity. Unknown measurement data is explicit. Public record links forward only code, lang and marca. Yokup retains its existing authenticated itil_inventory_get / itil_ci_upsert and audit; no new remote write tool or permission.

Tutorial ES: 1. Abre Inventario → Starbucks PG103. 2. Selecciona una pieza. 3. Lee «Ficha ITIL y 3D» y abre «Histórico de este vínculo visual». 4. Abre Yokup para la ficha maestra y el histórico patrimonial. 5. Usa ⌘ → /marca starbucks para probar el aspecto, y /marca off para volver.

Tutorial EN: 1. Open Inventory → Starbucks PG103. 2. Select a unit. 3. Read “ITIL and 3D record” and expand “History of this visual link”. 4. Open Yokup for the master record and lifecycle history. 5. Use ⌘ → /marca starbucks to try the appearance and /marca off to return.

## Minitutorial oficial / Official mini tutorial

[Vídeo / Video](https://api.yokup.com/media/fleet/f21a6bf5c07eb5ae.mp4): ADmira Motion, H264/AAC, 1080 × 1920, 15.162313 s. Tres escenas exportadas y verificadas. Guía animada, no grabación de pantalla. / Three exported scenes verified. Animated guide, not a screen recording.

Misión / Mission: DCL-8d385725c93e5609c146afeb · Yokup 2-oct-2026 #68.


## Segundo local · Cafebrería / Second locale · Cafebrería

ES: Más allá del piloto Starbucks PG103, Cafebrería publica un mapeo visual→CI en `/inventario/cafebreria/manifest.json` (códigos `CAF-*`, local `cafebreria-xpacio-001`). En `/xpacios/cafebreria/?inventory=1` selecciona una unidad registrada (barra, mesas, librería, pantallas…) para ver la ficha ITIL y 3D. El vínculo a Yokup solo lleva `code`, `lang` y `marca`. Garantía y nº de serie no se copian a la galería pública ni al CSV/JSON exportado; el texto es «Consultar en Yokup con acceso autorizado». Las medidas siguen pendientes de campo. El alta maestra de los códigos CAF-* en Yokup queda pendiente de confirmación de Carlos (`yokup_alta: pending_carlos`).

EN: Beyond the Starbucks PG103 pilot, Cafebrería publishes a visual→CI mapping in `/inventario/cafebreria/manifest.json` (`CAF-*` codes, locale `cafebreria-xpacio-001`). At `/xpacios/cafebreria/?inventory=1` select a registered unit (bar, tables, bookcase, screens…) to open the ITIL and 3D record. The Yokup link forwards only `code`, `lang` and `marca`. Warranty and serial are not copied into the public gallery or CSV/JSON export; the label is “Consult in Yokup with authorised access”. Dimensions remain pending field measurement. Master registration of CAF-* codes in Yokup awaits Carlos confirmation (`yokup_alta: pending_carlos`).

Tutorial ES: 1. Inventario → Cafebrería (o `/xpacios/cafebreria/?inventory=1`). 2. Abre una pieza registrada (p. ej. barra). 3. Lee «Ficha ITIL y 3D» y abre Yokup. 4. Comprueba que PG103 `/inventario/starbucks/` sigue igual.

Tutorial EN: 1. Inventory → Cafebrería (or `/xpacios/cafebreria/?inventory=1`). 2. Open a registered unit (e.g. bar). 3. Read “ITIL and 3D record” and open Yokup. 4. Confirm PG103 `/inventario/starbucks/` is unchanged.

Contrato compartido: `inventario/ci-record.mjs` (Starbucks reexporta desde `inventario/starbucks/ci-record.mjs`).


## Estantería Starbucks 47 / Starbucks shelf 47

La estantería Starbucks 47 conserva native:starbucksShelves, la instancia sb-mugs y el CI PDG103-EST-01. Best muestra el mueble de cinco niveles interpretado desde la foto de Carlos. Despiece y productos abre una colección 3D con vasos, termos, tazas y café independientes y 26 referencias visuales descargables. Cada objeto conserva su identidad de componente. Los productos son una composición visual: no son SKU comerciales ni fichas CI nuevas y las cantidades no acreditan stock. El maestro patrimonial sigue en Yokup.

Starbucks shelf 47 retains native:starbucksShelves, instance sb-mugs and CI PDG103-EST-01. Best shows the five-level cabinet interpreted from Carlos’s photograph. Separated parts and products opens a 3D collection of independent cups, tumblers, mugs and coffee with 26 downloadable visual references. Each object keeps its component identity. Products form a visual composition: they are not commercial SKUs or new CI records, and quantities do not establish stock. Yokup remains the lifecycle master.

[Guía ES/EN / ES/EN guide](https://www.xpaceos.com/admira-xp/docs/starbucks-coffee-display.md) · [Colección 3D / 3D collection](/inventario/assets/catalog/47/collection/preview/)
