# Inventario ITIL · castellano e inglés / Spanish and English

## Español

Inventario/ITIL sigue el idioma activo del Xpacio: en castellano muestra Inventario/ITIL y elementos; en inglés, Inventory/ITIL e items. Nombres estándar de mobiliario e IoT, categorías, búsqueda, modelo y detalle se presentan en ese idioma. Cambiar el idioma actualiza las columnas sin perder la selección ni el texto de búsqueda. Cafebrería traduce sus fichas, campos y acciones; conserva las ediciones sin guardar. Los nombres personalizados, identificadores, códigos ITIL, fichas guardadas y exportaciones JSON/CSV conservan sus datos originales. La traducción es de presentación. Continúan las diez subcategorías y el inventario propio de cada Xpacio.

Tutorial: elige castellano, abre Experto → Inventario/ITIL y selecciona una ficha. La lista aparece en la segunda columna y el detalle en la tercera. Al cambiar el idioma se conserva la pieza y la búsqueda. En Cafebrería, Guardar ficha conserva el nombre original cuando sólo cambia su traducción; un nombre editado permanece tal como se escribió.

## English

Inventory/ITIL follows the active Xpace language: Spanish displays Inventario/ITIL and elementos; English displays Inventory/ITIL and items. Standard furniture and IoT names, categories, search, model and details use that language. Changing language updates the columns without losing selection or search text. Cafebrería translates records, fields and actions while retaining unsaved edits. Custom names, identifiers, ITIL codes, saved records and JSON/CSV exports retain their original data. Translation affects presentation. The ten subcategories and each Xpace’s own inventory remain available.

Tutorial: choose English, open Expert → Inventory/ITIL and select a record. The list appears in the second column and details in the third. Language changes retain the selected item and search text. In Cafebrería, Save record retains the original name when only its translation changed; an edited name remains exactly as entered.

## Contrato compartido / Shared contract

- Scope: the native Expert inventory workspace and Cafebrería scene ITIL panel. Shared view labels: `inventario/labels.mjs`. Authored model, layout and café names have English presentation; unknown/custom labels are retained. Brands, IDs and reference codes stay unchanged.
- Locale: current `document.documentElement.lang`, ES fallback; native workspace and café observe changes immediately. URL lang remains explicit for model links. No extra language preference or persisted translation is introduced.
- Native: own rows and canonical assets are copied for presentation. Selection and query survive a language change. IoT records retain their virtual/pending binding status.
- Café: original manifest and imported/persisted records remain canonical. Untouched translated name fields save the original name. Dirty fields survive a language switch. JSON/CSV export original metadata and stable IDs.
- Category ID `inventory`, ten cards, own counts, add/remove/undo, /marca, CLI history and brand preferences remain. This introduces no remote tool, no physical IoT publication and no new master ITIL source. Yokup remains the master. People OFF and existing collision-map work remain unchanged.
- Verification: authored catalogue/layout/café name coverage; locale round trip and immutable sources; native and café browser views; live language changes preserve selection/query and unsaved fields; saving an English default retains its Spanish canonical value.

Help ES/EN: `/admira-xp/help.html#inventory-language`, `/help/#inventory-language`, `/help/cli/#inventory-language`, `/mcp/#inventory-language`. Real MCP: `https://mcp.admira.store/help`, topic `inventory-language`.
