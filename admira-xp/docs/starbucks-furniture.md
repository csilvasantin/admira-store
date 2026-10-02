# Starbucks PG103 · mobiliario / furniture

ES: Carlos confirmó el listado el 1 de octubre de 2026. Yokup es el maestro ITIL de `alsea-sbux-021`: barra de preparación `PDG103-BAR-01`, mostrador `PDG103-MOS-01`, vitrina `PDG103-VIT-01`, estantería `PDG103-EST-01`, mesas `PDG103-MES-01/02`, sillas `PDG103-SIL-01/02/03/04` y botellero `PDG103-BOT-01`. Son once unidades de categoría mobiliario; pantallas, TPV y altavoz conservan sus CIs existentes. Sin medidas de campo, fabricante, serie, compra o garantía inventados.

EN: Carlos confirmed the list on 1 October 2026. Yokup is the ITIL master for `alsea-sbux-021`: preparation counter `PDG103-BAR-01`, checkout counter `PDG103-MOS-01`, display case `PDG103-VIT-01`, shelves `PDG103-EST-01`, tables `PDG103-MES-01/02`, chairs `PDG103-SIL-01/02/03/04` and water rack `PDG103-BOT-01`. Eleven furniture units; existing screen, POS and speaker CIs remain separate. Field dimensions, manufacturer, serial, purchase and warranty information remain unknown.

## Ver y descargar / View and download

[Visor y once unidades / Viewer and eleven units](https://www.xpaceos.com/inventario/starbucks/). Selecciona una unidad, arrastra para girar, cambia frontal/trasera/lateral y descarga GLB o Blender. El parámetro `?item=PDG103-BOT-01` abre el botellero directamente; `lang=en` cambia el idioma. / Select a unit, drag to orbit, choose front/back/side and download GLB or Blender. `?item=PDG103-BOT-01` opens the water rack directly; `lang=en` selects English.

[Manifest](https://www.xpaceos.com/inventario/starbucks/manifest.json): `itil_code` ↔ `instance_id` ↔ `asset_number` ↔ `model3d`/`master`. Catálogo permanente 44–50: barra, mostrador, vitrina, estantería, mesa, silla y botellero. Las dos mesas comparten asset 48; las cuatro sillas comparten asset 49. / Permanent catalog numbers 44–50: preparation counter, checkout counter, case, shelves, table, chair and water rack. Two tables share asset 48; four chairs share asset 49.

Los modelos 44–49 conservan sus 18 GLB y sus 18 maestros Blender construidos desde las piezas de `scripts/starbucks-room.js`, con sillas separadas y geometría propia por tipo. Good/Better/Best son estilos, no precisión métrica; unidades de escena sin calibrar. El visor permite editar acabados por unidad; no publica cambios de distribución. La escena actual mantiene sus sillas agrupadas en las mesas; la galería ofrece los modelos independientes. / Models 44–49 retain their 18 GLBs and 18 Blender masters derived from shared scene parts, separating chairs and retaining type-specific geometry. Good/Better/Best are styles, not measured accuracy. The viewer edits finishes per unit without publishing layout changes. The current scene still groups chairs under tables; the gallery provides independent models.

## Botellero Solán de Cabras / Solán de Cabras water rack

ES: [Abrir botellero](https://www.xpaceos.com/inventario/starbucks/?item=PDG103-BOT-01). CI `PDG103-BOT-01` ↔ instancia `sb-water-rack` ↔ catálogo `50`, tipo `native:starbucksWaterRack`. Se interpreta la foto y el panorama 360 del Starbucks: cesta circular metálica negra, patas finas, cartel AGUA y botellas de plástico PET azul con tapones blancos. Carlos identifica la marca Solán de Cabras; la etiqueta recreada es aproximada. La huella nominal del modelo es 0,44 × 0,46 m, sin medición de campo. Good/Better/Best tienen GLB y maestro Blender; las texturas PBR se incluyen dentro del GLB. Las 19 botellas son una composición visual editable para llenar la cesta, no un recuento de existencias reales. El manifest registra `visual_filling` separado del CI. La botella individual también puede descargarse en [GLB](https://www.xpaceos.com/inventario/assets/catalog/50/bottle.glb) y [Blender](https://www.xpaceos.com/inventario/assets/catalog/50/bottle.blend).

EN: [Open water rack](https://www.xpaceos.com/inventario/starbucks/?item=PDG103-BOT-01&lang=en). CI `PDG103-BOT-01` ↔ instance `sb-water-rack` ↔ catalog `50`, type `native:starbucksWaterRack`. The model interprets the photo and Starbucks 360 panorama: a circular black metal basket, thin legs, AGUA sign and blue PET plastic bottles with white caps. Carlos identifies the Solán de Cabras brand; the recreated label is approximate. The nominal footprint is 0.44 × 0.46 m, without field measurement. Good/Better/Best each provide GLB and a Blender master; PBR textures are embedded in the GLB. The 19 bottles are an editable visual filling composition, not a count of actual stock. The manifest records `visual_filling` separately from the CI. A standalone bottle is also available in [GLB](https://www.xpaceos.com/inventario/assets/catalog/50/bottle.glb) and [Blender](https://www.xpaceos.com/inventario/assets/catalog/50/bottle.blend).

MCP: `itil_inventory_get` / `itil_ci_upsert` de Yokup leen/registran CIs por código; el manifest enlaza los archivos 3D sin introducir una herramienta de escritura nueva. / Yokup tools read/register CIs by code; the manifest links 3D files without a new remote write tool.

## Paneles / Side panels

Opciones y Avanzado siguen el borde inferior real de la barra superior y el borde superior de los docks inferiores visibles, sin hueco adicional. El cálculo reacciona a cambios de tamaño y visibilidad; conserva los anchos guardados. / Options and Advanced follow the actual header bottom and visible bottom-dock top, without an extra gap. Bounds react to size and visibility changes while retaining saved widths.

## Referencias fotográficas / Photo references

ES: Cada nombre incluye número de referencia y foto real del panorama. En «Referencias reales», revisa 60 fichas numeradas: PG103-001–011 corresponden a las unidades registradas; 012–039 son elementos por revisar y 040–060 variantes de productos. Pulsa una ficha para ampliar la foto. Mesas y sillas comparten referencia de tipo sin identificar la unidad exacta. Los candidatos no se dan de alta automáticamente. Las miniaturas aparecen junto al nombre en la galería, en el catálogo 44–50 y en las tarjetas y fichas ITIL de Yokup.

EN: Each name includes a reference number and a real panorama photo. In “Real references”, review 60 numbered records: PG103-001–011 map to registered units; 012–039 are elements to review and 040–060 are product variants. Select a record to enlarge its photo. Tables and chairs share a type reference without identifying the exact unit. Candidates are not automatically registered. Thumbnails appear beside the name in the gallery, catalog 44–50 and Yokup ITIL cards and equipment sheets.

[Referencias / References](https://www.xpaceos.com/inventario/starbucks/?view=references) · [JSON](https://www.xpaceos.com/inventario/starbucks/references.json). `?view=references&ref=PG103-012` abre una ficha directamente; `lang=en` mantiene la referencia. / Opens an individual record directly; `lang=en` preserves its selection.

Contrato / Contract: `reference_number`, `reference_id`, `key`, `status`, `photo`, `photo_scope`, `basis`, `confidence`, `visible_quantity`, `zone`, `source` y `source_crop`. Las once registradas enlazan `itil_code` y `asset_number`; `manifest.json` también incorpora su referencia y foto. Los números de referencia 001–060 son distintos de los números permanentes de catálogo 44–50. Las cantidades visibles son observaciones, no existencias ni unidades confirmadas. La fuente es la fotografía panorámica 8192×4096 del modo Matrix, no un vídeo verificado. / The eleven registered records link ITIL code and catalog number; manifest.json includes their photo and reference. Reference numbers 001–060 are separate from permanent catalog numbers 44–50. Visible quantities are observations, not stock or confirmed units. Source: the 8192×4096 Matrix panorama photograph, not a verified video.

Dependencia de lectura / Read dependency: Yokup obtiene este JSON público sin credenciales y sólo enlaza códigos registrados del establecimiento `alsea-sbux-021`. Si la fotografía o el JSON no están disponibles, la ficha ITIL conserva sus datos. No se altera el maestro de inventario ni se conceden herramientas de escritura nuevas. / Yokup fetches the public JSON without credentials and only maps registered codes at this venue. An unavailable image/JSON leaves the ITIL data readable. The inventory master and write permissions are unchanged.

## Marco cuadrático / Quadratic frame

Marco cuadrático Admira: por defecto solo se ve la barra horizontal superior. Opciones a la izquierda, Avanzados a la derecha y Experto/CLI abajo empiezan replegados; las vistas del inventario están dentro de Opciones. ☰ y ◨ muestran u ocultan paneles; ⌘ abre el CLI y Escape los cierra. En móvil se usan los mismos botones. Opciones reúne vistas, búsqueda y filtros; Avanzados reúne cámara, malla, descargas, ayuda y conexiones.

Admira quadratic frame: only the horizontal top bar is visible by default. Options on the left, Advanced on the right and Expert/CLI at the bottom start collapsed; inventory views live inside Options. ☰ and ◨ toggle panels; ⌘ opens the CLI and Escape closes them. Mobile uses the same buttons. Options contains views, search and filters; Advanced contains camera, wireframe, downloads, help and connections.

En las páginas del inventario, /inventario sin argumentos abre el catálogo; /inventario con argumentos conserva la ejecución en el gemelo de XpaceOS. Desde Yokup se indica abrir el gemelo. Navegación: /inventario, /starbucks, /referencias, /ref PG103-001, /equipo PDG103-BOT-01, /xpaceos, /yokup y /ayuda. La unidad seleccionada conserva su código ITIL al abrir Yokup o volver a XpaceOS. Los candidatos enlazan el portal sin inventar fichas ITIL. Añadir, eliminar o mover muebles se realiza en la Xperience; las fichas patrimoniales se editan en Yokup con sus permisos existentes.

On inventory pages, /inventario without arguments opens the catalogue; arguments retain execution in the XpaceOS twin. From Yokup it prompts opening the twin. Navigation: /inventory, /starbucks, /references, /ref PG103-001, /equipment PDG103-BOT-01, /xpaceos, /yokup and /help. A selected unit retains its ITIL code when opening Yokup or returning to XpaceOS. Candidates link to the portal without inventing ITIL records. Add, remove or move furniture in the Xperience; edit lifecycle records in Yokup with existing permissions.

Contrato: https://www.xpaceos.com/admira-xp/docs/inventory-frame.md · Misión DCL-1be5b59b234e7be48381c4ee.

## Ficha unificada / Unified record

En Inventario → Starbucks PG103, selecciona una unidad: «Ficha ITIL y 3D» reúne código, instancia, modelo compartido, zona observada y medidas pendientes. Abre el histórico del vínculo visual y la ficha maestra de Yokup con sus permisos. En Experto: /ficha PDG103-MES-02; /marca y /marca off conservan el cambio de aspecto. /avatarDigital de Woz sigue pendiente de publicación. Los candidatos no se dan de alta y la ficha no acredita telemetría real.

In Inventory → Starbucks PG103 select a unit: “ITIL and 3D record” shows code, instance, shared model, photo-observed zone and pending measurements. Open visual-link history and the Yokup master record with its existing permissions. In Expert: /record PDG103-MES-02; /marca and /marca off retain appearance changes. Woz’s /avatarDigital is pending publication. Candidates are not registered automatically; this record does not establish real telemetry.

[Contrato / Contract](https://www.xpaceos.com/admira-xp/docs/itil-3d-record.md)


Editor de superficies / Surface editor: [guía y límites](surface-editor.md).
