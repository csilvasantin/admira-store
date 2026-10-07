# TPV · Muffin a la caja / POS · Muffin to the register

## Uso / Usage

ES: En Matrix de Starbucks Alsea, mantén pulsado el muffin de la vitrina y arrástralo a la caja junto al osito. La miniatura sigue al cursor y la caja se ilumina al aceptar el producto. Al soltarlo aparece la cesta con 1 × Muffin y «¿Lo acompañamos con un café?». Añadir café incorpora el acompañamiento; Sólo el muffin cierra la sugerencia. Quitar elimina una línea completa. Soltar fuera, Escape o perder el foco cancela el arrastre. Con teclado, enfoca el muffin y pulsa Enter o Espacio. TPV / POS y el enlace #tpv encuadran vitrina y caja. La cesta se conserva en esta pestaña al recargar y al cambiar de vista. Es una cesta del gemelo, sin cobro, precios, inventario ni conexión a una caja física; la publicidad del TPV, la pared y la música mantienen su programación. El gesto queda desactivado durante /layout, edición de geometría o una incidencia que apague el TPV. Good, Better y Best conservan su funcionamiento anterior.

EN: In Starbucks Alsea Matrix, hold the display-case muffin and drag it to the register beside the teddy bear. The thumbnail follows the pointer and the register lights up when it accepts the product. Releasing opens the basket with 1 × Muffin and “Would you like a coffee with it?”. Add coffee adds the companion product; Just the muffin dismisses the suggestion. Remove deletes a whole line. Dropping outside, Escape or losing focus cancels the drag. With a keyboard, focus the muffin and press Enter or Space. TPV / POS and the #tpv link frame the display case and register. The basket survives reloads and view changes in this tab. This is a digital twin basket with no payment, prices, inventory or physical register connection; POS advertising, wall screens and music retain their schedules. The gesture is disabled during /layout, geometry editing or an incident that turns the POS off. Good, Better and Best retain their previous behaviour.

[Entrar al TPV / Open POS](https://www.admira.store/admira-xp/?quality=matrix&loc=alsea-sbux-021&project=starbucks&circuit=alsea_starbucks#tpv)

## Contrato compartido / Shared contract

- Local / Venue: `alsea-sbux-021`; TPV / POS: `starbucks-tpv-01`.
- Productos de demostración / Demo product IDs: `muffin`, `coffee`. Sin SKU comercial ni precios / No commercial SKU or prices.
- Cesta / Basket: `{version:1,lines:[{id:"muffin",quantity:1}]}`; cantidades 1–99 / quantities 1–99.
- Almacenamiento / Storage: `sessionStorage:xpaceos.pos-basket.v1:alsea-sbux-021:starbucks-tpv-01`. Aislado por pestaña y dominio; no compartido por MCP / Scoped to tab and origin; not shared via MCP.
- Evento local / Local event: `window` → `xpace:pos-basket`; `detail={version:1,loc,posId,quality:"matrix",action:"add"|"remove",productId,basket}`. Sólo después del cambio aceptado / Only after an accepted change.
- Fuente / Source: `scripts/pos-basket.mjs`, `scripts/matrix-pos-experience.mjs`, `scripts/media-options.js`; `assets/pos/muffin-reference.png` procede de la referencia de Carlos / supplied by Carlos.
- Calibración / Calibration: cuatro esquinas yaw/pitch del muffin y caja en la captura Matrix; sigue el giro y zoom / four yaw/pitch corners on the Matrix capture; follows camera movement and zoom.
- El terminal publicitario conserva su mapa y playlist independientes / The advertising terminal retains its independent mapping and playlist.
- No hay herramientas MCP nuevas ni escritura de cesta en el estado Matrix compartido / No new MCP tools or basket writes to shared Matrix state.

## Entregado y pendiente / Delivered and pending

ES: Entregado: arrastre de un muffin, cantidades, cesta local, sugerencia de café explícita, teclado y textos ESP/ENG. Pendiente: catálogo y precios reales, reglas comerciales de upselling/crossselling, pago, ticket, inventario, sincronización entre clientes y conexión a TPV físico. La sugerencia inicial es determinista, sin servicio IA ni generación de pago.

EN: Delivered: one draggable muffin, quantities, local basket, explicit coffee suggestion, keyboard and ESP/ENG text. Pending: real catalog and prices, commercial upselling/crossselling rules, payment, receipt, inventory, multiuser sync and physical POS integration. The initial suggestion is deterministic, with no AI service or paid generation.
