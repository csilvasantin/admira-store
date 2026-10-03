# ITIL del Xpacio / Xpace ITIL inventory

## Español

ITIL abre el inventario del Xpacio visitado en el mismo dominio, conservando proyecto, local, idioma y marca. Publica primero su distribución actual en este navegador. Tarjetas, selector 3D, desgloses y descargas se limitan a sus modelos; un enlace a una pieza ajena no la carga. Un Xpacio desconocido muestra un inventario vacío y pide abrir ITIL desde la escena. /inventario en el gemelo lista sólo sus modelos, conservando los números permanentes y las piezas retiradas para su recuperación. Las importaciones explícitas y Deshacer mantienen su funcionamiento. Starbucks PG103 conserva sus unidades y modelos 44–50 e incluye sus seis pantallas virtuales, TPV y altavoz; no acredita vinculación ni telemetría física. Cafebrería conserva su inventario completo de la escena y su librería 51. El catálogo general sin contexto sigue disponible para consultar plantillas. No crea altas patrimoniales en Yokup.

Entra en el proyecto y local → abre Avanzado o Experto → pulsa ITIL. Comprueba el nombre del Xpacio en la barra. Abre Opciones para filtrar Mobiliario o IoT; el selector 3D ofrece sólo modelos de ese Xpacio. Volver al Xpacio conserva el local. Para Cafebrería, Inventario ITIL muestra todas sus fichas de escena y la librería enlaza su modelo propio.

## English

ITIL opens the inventory of the Xpace being visited on the same origin, preserving project, venue, language and brand. It first publishes the current layout in this browser. Cards, the 3D selector, breakdowns and downloads are limited to its models; links to foreign pieces do not load them. Unknown Xpacios show an empty inventory and ask users to open ITIL from the scene. /inventario in the twin lists only its models, preserving permanent numbers and removed pieces for recovery. Explicit imports and Undo retain their behavior. Starbucks PG103 keeps its units and models 44–50 and includes its six virtual screens, POS and speaker; this does not establish physical binding or telemetry. Cafebrería retains its full scene inventory and bookcase 51. The general catalogue without context remains available for browsing templates. No Yokup lifecycle assets are created.

Enter the project and venue → open Advanced or Expert → press ITIL. Check the Xpace name in the header. Open Options to filter Furniture or IoT; the 3D selector offers only models belonging to that Xpace. Back to the Xpace preserves the venue. In Cafebrería, ITIL inventory shows all scene records and the bookcase links to its own model.

## Contrato compartido / Shared contract

- Entry point: same-origin `/inventario/?space=<active-space>&project=<active-project>`, with venue, circuit, language, brand and quality retained.
- Spaces: `xtanco` (Estancos), `starbucks_pg103` (venue `alsea-sbux-021`), `cafebreria`, other active native spaces; Altadis uses its own `xtanco_altadis-bcn-00N` inventory key.
- Current layout: `XpaceInventory.publish(space, shopLayout)` before ITIL navigation. Only `xpaceos:inventory-layout:<space>` and that space's existing ledger are read. IDs, data, preferences, CLI history and existing import/undo operations remain available.
- Membership: actual layout and explicitly imported objects; Starbucks declared units resolve via `inventario/starbucks/manifest.json`, including legacy scene types; Cafebrería retains `scene.inventory.json` and its existing panel. Reference units do not pretend to have scene positions or visibility controls.
- Stable catalogue numbers never derive from array positions. Unnumbered objects retain their instance/source IDs and appear as pending numbered models.
- Starbucks virtual screen/POS IDs come from `starbucks-screens.mjs` and `starbucks-tpv.mjs`; speaker owner is `starbucks-alsea-paseo-de-gracia`. Physical player IDs remain unbound. No remote inventory write is added.
- Direct foreign-model links, unknown/mismatched project scopes and empty layouts do not expose the global inventory. The explicit unscoped template catalogue remains unchanged.
- Display selection and visibility do not switch off real hardware or modify collision maps. People remains OFF by default; completion of hardness maps and physical IoT binding remains pending.

## Verificación / Verification

Automated scope, instance ownership, same-origin ITIL navigation, CLI isolation, inventory persistence/undo and common-shell regression tests. Browser checks cover Estancos, Starbucks, Cafebrería, foreign asset links and unknown scopes. Public release verification is recorded in Yokup after deployment.

Sources: `inventario/context.mjs`, `model.mjs`, `app.mjs`, `frame.mjs`, native ITIL action, existing per-Xpacio inventory store. Help: `/help/#inventory-scope`, `/help/cli/#inventory-scope`, `/admira-xp/help.html#inventory-scope`. Real MCP: `https://mcp.admira.store/help`, help topic `inventory-scope` / `inventario del Xpacio`.
