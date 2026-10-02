# Cafebrería · librería reutilizable / reusable bookcase

ES: Cafebrería recuperada en /xpacios/cafebreria/ con la escena original confirmada, nogal, verde café y crema. La librería interactiva es la pieza 51 del catálogo ITIL: 1,60 × 0,28 × 1,10 m nominales, dos laterales, cuatro tableros, trasera, listón de latón, libros, vinilos y tele retro. Best/Better permiten seleccionar libros y contenidos; el libro seleccionado aparece en la pizarra original y en la tele integrada cuando se importa. Sus fichas tienen asa y X. En otro Xpacio ejecuta /inventario añadir 51; /inventario deshacer revierte el alta. Se conserva el ID native:cafebreriaLibrary y el montaje de pared a 1,15 m. Good ofrece pixel art sin suavizado. Descarga GLB y Blender desde el catálogo; el GLB conserva la geometría y XpaceOS añade las interacciones descritas en library.package.json. Fuera de XpaceOS hay que integrar ese comportamiento. Plantilla visual reutilizable, no alta patrimonial ni existencias físicas. Datos desconocidos de fabricante, serie y garantía permanecen vacíos. Fuente viva Stock con respaldo local y cargas acotadas. La tele usa un reproductor virtual; no publica en equipos físicos. /marca, Experto e historial CLI conservan sus funciones.

EN: Cafebrería is recovered at /xpacios/cafebreria/ with the confirmed original scene, walnut, café green and cream. Its interactive bookcase is ITIL catalogue piece 51: nominal 1.60 × 0.28 × 1.10 m, two sides, four horizontal boards, back, brass trim, books, records and retro TV. Better/Best support book and content selection; the selected book appears on the original board and on the integrated TV after import. Content windows have handles and X controls. In another XpaceOS project run /inventario añadir 51; /inventario deshacer reverses the addition. Identity native:cafebreriaLibrary and wall mounting at 1.15 m are retained. Good renders crisp pixel art. Download GLB and Blender from the catalogue; GLB retains geometry and XpaceOS adds the interactions described by library.package.json. Other engines require behavior integration. This is a reusable visual template, not a physical stock or lifecycle record. Unknown manufacturer, serial and warranty fields remain empty. Live Stock content has a local fallback and bounded loads. The TV uses a virtual player and does not publish to physical devices. /marca, Expert and CLI history retain their behavior.

## Uso / Usage

1. [Cafebrería recuperada](https://www.xpaceos.com/xpacios/cafebreria/): Explorar librería / Explore bookcase.
2. [Pieza 51](https://www.xpaceos.com/inventario/?asset=51&quality=best#mostrador): seleccionar libro / choose a book; Desglose / Breakdown lists structural components.
3. Abra el proyecto de destino en Better o Best y ejecute `/inventario añadir 51`. Abra la librería tocándola; cada importación conserva su propia identidad. / Open the target project in Better or Best and run `/inventario añadir 51`. Tap the bookcase to explore it; each imported instance retains its identity.
4. [Manifiesto del paquete](https://www.xpaceos.com/inventario/cafebreria/library.package.json): IDs, dependencias y hashes / IDs, dependencies and hashes. GLB + Blender are self-contained geometry files. Runtime behavior requires the shared module and contents metadata.

## Procedencia / Provenance

Carlos confirmó la demo preservada v=4e5d47c. Se conserva Stock `1790375438696-1ladz7` (escena completa, sin sobrescribirla), SHA-256 `d8e9d1422ecdec63ddde0ed66c3c4fd9fc588319639d5e4258b88269a05be5d9`. La librería original se generaba en tiempo de ejecución; la pieza 51 exporta esa estructura por separado, con 32 mallas editables y textura original MAT_nogal. / Carlos confirmed preserved demo v=4e5d47c. Original full-scene Stock identity and hash remain unchanged; piece 51 extracts the runtime structure into an independent template, with 32 editable meshes and the original MAT_nogal texture.

Nominal cabinet height: 1.10 m. Exported bounding height including brass trim: 1.136 m. Initial GLB arrangement: six books and six record placeholders; live interactive contents are independent and may change. Good, Better and Best retain the same original structure; rendering and texture sampling differ, not the nominal dimensions.

Dependencies: shared Three r160, GLTFLoader, life-renderer/life-scene, floating-panels, original book/capsule metadata, local seed, Stock live index, optional browser speech, Apple preview availability and virtual Admira.tv player. Source builder: `admira-xp/tools/xpacios-blender/build_cafebreria_library.py`; verification: `verify_cafebreria_library.py`.

ES: No se crea una ficha patrimonial física en Yokup ni se declara una nueva herramienta MCP. La escena recuperada es la experiencia original; el gemelo/editor general conserva su ruta propia.

EN: No physical Yokup lifecycle record or new MCP tool is created. The recovered scene restores the original experience; the general twin/editor retains its own route.

## Verificación / Verification · 2026-10-03

ES: 113 pruebas de inventario, importación/deshacer, cámara, editor, selección y ventanas correctas; cuatro pruebas de ayuda del servidor MCP real correctas. Good, Better y Best reabiertos en Blender y reimportados desde GLB: 32 mallas por perfil. La escena original y los seis archivos GLB/Blender públicos coinciden con sus hashes. Cafebrería y catálogo responden en ambos dominios; las ayudas bilingües de XpaceOS y del servidor MCP son públicas. Las rutas /help/ y /help/cli/ de Admira.store conservan su autenticación existente; `/help` y la herramienta MCP `help` recuperan la sección por Cafebrería, bookcase y 51. Selección de cápsulas, Parar y cierre comprobados en la web publicada. Importar la pieza en Xtanco y deshacer comprobados en navegador local.

EN: 113 relevant inventory, import/undo, camera, editor, selection and window tests passed; four actual MCP help tests passed. All three Blender files were reopened and their GLBs reimported: 32 meshes per profile. Original scene and all six published GLB/Blender downloads match their hashes. Public café and catalogue were checked on both domains; bilingual XpaceOS and MCP help are public. Admira.store /help/ and /help/cli/ retain their existing authentication; MCP `/help` and `help` expose the new section. Capsule selection, stop and close were checked publicly; importing into Xtanco and undoing the addition were checked in a local browser.

ES: Cinco fallos heredados de `mcp/funcionalidades.test.mjs` se reproducen contra el HEAD anterior; pertenecen al contrato general y no fueron introducidos por esta recuperación. EN: Five pre-existing failures in the general functional catalogue tests were reproduced against the preceding HEAD; this recovery does not introduce them.

## Contexto de calle / Street context · 2026-10-03

ES: La Cafebrería está asentada en una calle de XpaceOS: aceras, calzada con marcas viales, edificios y zona verde del mismo entorno del Xtanco. Opciones → Ver cafetería devuelve la vista del local y su barrio; Explorar librería acerca la cámara al mueble. Avanzado → Luz de día, Atardecer o Noche ajusta también el exterior. Las ventanas conservan su tirador y X. La pieza ITIL 51 sigue siendo un mueble independiente para importar en otros proyectos.

EN: Cafebrería sits on a XpaceOS street: sidewalks, a road with lane markings, buildings and green space from the same Xtanco surroundings. Options → View café returns to the café and its neighbourhood; Explore bookcase brings the camera closer to the furniture. Advanced → Daylight, Sunset or Night adjusts the exterior too. Floating windows retain their handles and X controls. ITIL piece 51 remains independent furniture for importing into other projects.

Shared source: `admira-xp/scripts/life-exterior.mjs`, the existing Xtanco street. `createLifeScene` accepts `surroundings:true` alongside `inventory:true` for imported rooms, with exteriorY:0.44 placing sidewalks at Y=0. Café grounding uses the actual floor top at Y=0.025, not the complete source bounding box (which includes a stray construction cube). The street footprint follows the floor dimensions and origin. Other scenes and isolated catalogue previews retain their existing defaults. The exterior owns its animation, lighting and disposal through the shared scene lifecycle; it introduces no furniture IDs, physical stock or new MCP tool. Original scene and all piece 51 download hashes remain unchanged.

Validation: 37 scene, exterior, camera and reusable-library tests passed; local WebGL composition reviewed.

## Corrección del apoyo / Grounding correction · 2026-10-03

ES: El suelo real define el apoyo: acabado a 2,5 cm sobre la acera y losa en contacto con el terreno. La calle se ajusta a los 11 × 7,5 m del suelo. El cubo auxiliar original (glb-node:794), que elevaba el local y atravesaba la fachada junto a la nevera, queda excluido de la vista; su ID y su registro ITIL se conservan. Las coordenadas X/Z y distribuciones guardadas se mantienen.

EN: The actual floor defines the support: its finish sits 2.5 cm above the sidewalk and the slab contacts the ground. The street matches the 11 × 7.5 m floor. The original auxiliary cube (glb-node:794), which lifted the café and intersected the façade beside the fridge, is excluded from the view; its ID and ITIL record are retained. X/Z coordinates and saved layouts are preserved.
