# Inventory/ITIL · diez subcategorías / ten subcategories

## Español

Inventory/ITIL unifica Inventario e ITIL en la posición anterior de Inventory, junto a Percepción. Debajo muestra el número total de items propios del Xpacio. La cuadrícula tiene diez subcategorías y elimina la ficha Pixeria. Al pulsar Inventory/ITIL, la lista y la búsqueda aparecen en la segunda columna; seleccionar un objeto muestra su detalle en la tercera. Se conservan las acciones de añadir/eliminar, las identidades, el historial y las fichas editables de Cafebrería. La importación desde PixerIA sigue disponible en Mobiliario → Distribuir. Yokup sigue siendo el maestro ITIL; esta interfaz no acredita vinculación física IoT.

Experto → Inventory/ITIL → selecciona una pieza → consulta la tercera columna.

## English

Inventory/ITIL merges Inventory and ITIL at the former Inventory position, next to Perception. Its subtitle shows the total number of items owned by the Xpace. The grid has ten subcategories and removes the Pixeria card. Press Inventory/ITIL for the list and search in the second column; select an object for details in the third. Add/remove actions, identities, history and editable Cafebrería records are retained. PixerIA import remains available under Furniture → Distribute. Yokup remains the ITIL master; this interface does not establish physical IoT binding.

Expert → Inventory/ITIL → select an item → view the third column.

## Contrato compartido / Shared contract

- Category IDs in order: signage, admiralive, livecam, dvr, anonymizer, editor, avatar3d, impactos, inventory, perception. The label Inventory/ITIL and subtitle `<count> items` are identical in ES/EN. The own unit count includes retained removals and registered pending records; searching does not alter the total.
- Native: `advInventoryCli` and `#expertQuickIcons [data-category-id=inventory]` share the same entry. `XpaceInventoryUI.open("itil")` resolves to inventory for compatibility. Common shell `expertWorkspace.select("itil")` also resolves to inventory; legacy pixerai selection resolves to Furniture/editor. No standalone ITIL or Pixeria card remains.
- List/search and existing Add/Delete controls remain in the second column; selected detail remains in the third. Cafebrería retains its full scene inventory, record form, visibility, editor and JSON/CSV export; bookcase actions are merged into Inventory/ITIL. PixerIA import is accessible inside Furniture → Distribute.
- Existing permanent IDs, `/inventario`, add/remove/undo, saved layouts, `/marca`, CLI history and brand preferences remain available. No new remote tool or physical publication. Physical IoT binding and collision-map work remain pending. People OFF is retained.
- Sources: `assets/expert-workspace.mjs`, native quickLaunchScript, native inventory-workspace.mjs and Cafebrería inventory adapter/configuration. Ownership and count contracts: `inventory-scope.md`, `inventory-columns.md`.
- Verification: shared-shell/category contract, inventory count and isolation, persistence/undo and Cafebrería tests; browser checks confirm exactly ten cards, one Inventory/ITIL with own count, second-column list and third-column selection.

Help ES/EN: `/help/#inventory-merged`, `/help/cli/#inventory-merged`, `/admira-xp/help.html#inventory-merged`, `/mcp/#inventory-merged`. Actual MCP: `https://mcp.admira.store/help`, topic `inventory-merged`.
