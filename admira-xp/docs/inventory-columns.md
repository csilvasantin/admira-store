# ITIL · contador y columnas / count and columns

## Español

La ficha Inventory/ITIL muestra el número de piezas y fichas propias del Xpacio, incluidas las registradas pendientes y las retiradas conservadas para recuperación; dos unidades de un modelo cuentan como dos piezas. Al pulsar Inventory/ITIL o ejecutar /inventario se abre Experto: lista y búsqueda en la segunda columna; al seleccionar una pieza, detalle en la tercera. La escena permanece visible. El contador refleja el inventario completo, también al buscar. Cafebrería conserva sus campos editables, visibilidad, editor y exportación JSON/CSV. Starbucks incluye sus unidades registradas y ocho fichas IoT virtuales. La vinculación física y los mapas de dureza siguen pendientes.

Entra en el Xpacio y local → pulsa Inventory/ITIL → comprueba el contador → busca o selecciona una pieza en la segunda columna → consulta su ficha en la tercera. Abrir modelo y desglose permite ir al catálogo de ese mismo Xpacio conservando local, idioma y marca. Añadir y Eliminar siguen en la categoría Inventario.

## English

The Inventory/ITIL card shows the number of items and records owned by the Xpace, including pending registered records and removed items retained for recovery; two units of one model count as two items. Press Inventory/ITIL or run /inventario to open Expert: list and search in the second column; select an item for details in the third column. The scene remains visible. The count reflects the full inventory, including while searching. Cafebrería retains its editable fields, visibility, editor and JSON/CSV export. Starbucks includes its registered units and eight virtual IoT records. Physical binding and collision maps remain pending.

Enter the Xpace and venue → press Inventory/ITIL → check the count → search or select an item in the second column → view its record in the third. Open model and breakdown opens that same Xpace catalogue, preserving venue, language and brand. Add and Delete remain in the Inventory category.

## Contrato compartido / Shared contract

- Runtime: `inventario/workspace-model.mjs` counts unique unit IDs from the active layout and its retained ledger; it does not read any other project. Starbucks registry uses `inventario/starbucks/manifest.json` and the existing screen/POS mappings, with 11 furniture units and 8 virtual IoT records. Architectural pillar is excluded. Empty layouts have zero scene units. Deliberate imports update that Xpace only.
- Native adapters: `XpaceInventorySource.read()` supplies the current space, project, own layout and removals. `XpaceInventoryUI.count` stays null until loaded; `open()` selects the native ITIL category. `xpace:inventory-select` routes list/detail; shared shell uses `xpace:expert-category`. No external navigation on default ITIL click.
- DOM contract: `.itil-unit-list` inside `.expert-controls-pane`; `[data-inventory-detail]` inside `.expert-view-pane`; native third-column label DETALLE / DETAIL. Changing category hides the record and disposes the preview. Counts refresh after layout changes and include all records during search.
- Identity: stable unit ID in `data-inventory-id`; model number remains independent. Starbucks models 44–50 retain PG103 references. `starbucks-wall-01`…`06`, `starbucks-tpv-01` and `starbucks-alsea-paseo-de-gracia` identify virtual channels with physical binding pending.
- Cafebrería retains all 96 initial scene records, existing scene focus and saved fields, visibility, Distribute editing and JSON/CSV export. Its existing record form is moved to the third column, preserving handlers and node identity. Explicit imports increase its own count.
- Optional model link: same-origin `/inventario/?space=<space>&project=<project>&asset=<stable-number>` publishes the active layout and retains venue, brand and language. Ownership filtering remains documented in `inventory-scope.md`.
- Existing `/inventario añadir`, `/inventario eliminar`, undo, CLI history, brand and identities remain available. No physical IoT state, collision map or remote lifecycle asset is changed. People stays OFF by default.

## Verificación / Verification

Unit-count, duplicate-model, own ledger and Starbucks registry tests; native shell, inventory/undo and Cafebrería regressions. Browser checks verify the real second/third column parents, selection, category changes, search count and own records in Estancos, Starbucks and Cafebrería. Public source, mirror and actual MCP help are verified after deployment.

Help ES/EN: `/admira-xp/help.html#inventory-columns`, `/help/#inventory-columns`, `/help/cli/#inventory-columns`, `/mcp/#inventory-columns`. Actual MCP help: `https://mcp.admira.store/help`, topic `inventory-columns`.

## Idioma ITIL / ITIL language

Inventario/ITIL sigue el idioma activo del Xpacio: en castellano muestra Inventario/ITIL y elementos; en inglés, Inventory/ITIL e items. Nombres estándar de mobiliario e IoT, categorías, búsqueda, modelo y detalle se presentan en ese idioma. Cambiar el idioma actualiza las columnas sin perder la selección ni el texto de búsqueda. Cafebrería traduce sus fichas, campos y acciones; conserva las ediciones sin guardar. Los nombres personalizados, identificadores, códigos ITIL, fichas guardadas y exportaciones JSON/CSV conservan sus datos originales. La traducción es de presentación. Continúan las diez subcategorías y el inventario propio de cada Xpacio.

Inventory/ITIL follows the active Xpace language: Spanish displays Inventario/ITIL and elementos; English displays Inventory/ITIL and items. Standard furniture and IoT names, categories, search, model and details use that language. Changing language updates the columns without losing selection or search text. Cafebrería translates records, fields and actions while retaining unsaved edits. Custom names, identifiers, ITIL codes, saved records and JSON/CSV exports retain their original data. Translation affects presentation. The ten subcategories and each Xpace’s own inventory remain available.

Contrato / Contract: `inventory-language.md`.
