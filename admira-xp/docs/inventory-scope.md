# ITIL del Xpacio / Xpace ITIL inventory

## Español

ITIL abre el inventario del Xpacio visitado en la segunda columna de Experto y el detalle seleccionado en la tercera. El enlace opcional al catálogo conserva el mismo dominio, proyecto, local, idioma y marca y publica primero la distribución actual en este navegador. Tarjetas, selector 3D, desgloses y descargas se limitan a sus modelos; un enlace a una pieza ajena no la carga. Un Xpacio desconocido muestra un inventario vacío y pide abrir ITIL desde la escena. /inventario en el gemelo lista sólo sus modelos, conservando los números permanentes y las piezas retiradas para su recuperación. Las importaciones explícitas y Deshacer mantienen su funcionamiento. Starbucks PG103 conserva sus unidades y modelos 44–50 e incluye sus seis pantallas virtuales, TPV y altavoz; no acredita vinculación ni telemetría física. Cafebrería conserva su inventario completo de la escena y su librería 51. El catálogo general sin contexto sigue disponible para consultar plantillas. No crea altas patrimoniales en Yokup.

Entra en el Xpacio y local → pulsa Inventory/ITIL → comprueba el contador → busca o selecciona una pieza en la segunda columna → consulta su ficha en la tercera. Abrir modelo y desglose permite ir al catálogo de ese mismo Xpacio conservando local, idioma y marca. Añadir y Eliminar siguen en la categoría Inventario.

## English

ITIL opens the inventory of the Xpace being visited in the second Expert column and the selected details in the third. The optional catalogue link preserves the same origin, project, venue, language and brand and first publishes the current layout in this browser. Cards, the 3D selector, breakdowns and downloads are limited to its models; links to foreign pieces do not load them. Unknown Xpacios show an empty inventory and ask users to open ITIL from the scene. /inventario in the twin lists only its models, preserving permanent numbers and removed pieces for recovery. Explicit imports and Undo retain their behavior. Starbucks PG103 keeps its units and models 44–50 and includes its six virtual screens, POS and speaker; this does not establish physical binding or telemetry. Cafebrería retains its full scene inventory and bookcase 51. The general catalogue without context remains available for browsing templates. No Yokup lifecycle assets are created.

Enter the Xpace and venue → press Inventory/ITIL → check the count → search or select an item in the second column → view its record in the third. Open model and breakdown opens that same Xpace catalogue, preserving venue, language and brand. Add and Delete remain in the Inventory category.

## Contrato compartido / Shared contract

- Default entry: Expert second-column inventory and third-column detail. Optional catalogue: same-origin `/inventario/?space=<active-space>&project=<active-project>`, with venue, circuit, language, brand and quality retained.
- Spaces: `xtanco` (Estancos), `starbucks_pg103` (venue `alsea-sbux-021`), `cafebreria`, other active native spaces; Altadis uses its own `xtanco_altadis-bcn-00N` inventory key.
- Current layout: `XpaceInventory.publish(space, shopLayout)` before optional catalogue navigation. Only `xpaceos:inventory-layout:<space>` and that space's existing ledger are read. IDs, data, preferences, CLI history and existing import/undo operations remain available.
- Membership: actual layout and explicitly imported objects; Starbucks declared units resolve via `inventario/starbucks/manifest.json`, including legacy scene types; Cafebrería retains `scene.inventory.json` and its existing panel. Reference units do not pretend to have scene positions or visibility controls.
- Stable catalogue numbers never derive from array positions. Unnumbered objects retain their instance/source IDs and appear as pending numbered models.
- Starbucks virtual screen/POS IDs come from `starbucks-screens.mjs` and `starbucks-tpv.mjs`; speaker owner is `starbucks-alsea-paseo-de-gracia`. Physical player IDs remain unbound. No remote inventory write is added.
- Direct foreign-model links, unknown/mismatched project scopes and empty layouts do not expose the global inventory. The explicit unscoped template catalogue remains unchanged.
- Display selection and visibility do not switch off real hardware or modify collision maps. People is ON by default since 8 Oct 2026, with hardness maps validated (actor-collision.md); physical IoT binding remains pending.

## Verificación / Verification

Automated scope, instance ownership, ITIL unit counts and column routing, same-origin catalogue navigation, CLI isolation, inventory persistence/undo and common-shell regression tests. Browser checks cover Estancos, Starbucks, Cafebrería, foreign asset links and unknown scopes. Public release verification is recorded in Yokup after deployment.

Sources: `inventario/context.mjs`, `model.mjs`, `app.mjs`, `frame.mjs`, native ITIL action, existing per-Xpacio inventory store. Help: `/help/#inventory-scope`, `/help/cli/#inventory-scope`, `/admira-xp/help.html#inventory-scope`. Real MCP: `https://mcp.admira.store/help`, help topic `inventory-scope` / `inventario del Xpacio`.

## Idioma ITIL / ITIL language

Inventario/ITIL sigue el idioma activo del Xpacio: en castellano muestra Inventario/ITIL y elementos; en inglés, Inventory/ITIL e items. Nombres estándar de mobiliario e IoT, categorías, búsqueda, modelo y detalle se presentan en ese idioma. Cambiar el idioma actualiza las columnas sin perder la selección ni el texto de búsqueda. Cafebrería traduce sus fichas, campos y acciones; conserva las ediciones sin guardar. Los nombres personalizados, identificadores, códigos ITIL, fichas guardadas y exportaciones JSON/CSV conservan sus datos originales. La traducción es de presentación. Continúan las diez subcategorías y el inventario propio de cada Xpacio.

Inventory/ITIL follows the active Xpace language: Spanish displays Inventario/ITIL and elementos; English displays Inventory/ITIL and items. Standard furniture and IoT names, categories, search, model and details use that language. Changing language updates the columns without losing selection or search text. Cafebrería translates records, fields and actions while retaining unsaved edits. Custom names, identifiers, ITIL codes, saved records and JSON/CSV exports retain their original data. Translation affects presentation. The ten subcategories and each Xpace’s own inventory remain available.

Contrato / Contract: `inventory-language.md`.
