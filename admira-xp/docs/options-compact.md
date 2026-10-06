# Opciones compactas / Compact Options

## ES

Opciones usa por defecto el menor ancho que permite leer completas las etiquetas del idioma activo, sin ocupar el espacio sobrante de la escena. Arrastra su borde interior hacia la izquierda para dejar una columna de iconos de 52 px; al pasar el cursor se muestra el nombre y los nombres accesibles siguen disponibles. Arrastra hacia la derecha para recuperar las etiquetas. Con el tirador enfocado, Flecha derecha recupera el ancho legible desde los iconos; Inicio o doble clic restaura el ancho mínimo legible. La anchura elegida se guarda por navegador y dominio; se conservan los ajustes manuales anteriores. En el gemelo, abrir una herramienta desde su icono amplía temporalmente Opciones para sus controles y previos; cerrarla recupera la anchura elegida. El sello permanece al pie como icono de información en la columna compacta y conserva ayuda y novedades. ☰ sigue plegando el menú completo. Avanzados y Experto mantienen sus controles y colores.

1. Abre ☰ Opciones. 2. Arrastra el borde derecho hacia la izquierda hasta ver sólo iconos. 3. Pasa sobre un icono para leer su nombre. 4. Pulsa el icono para abrir su herramienta. 5. Cierra la herramienta para recuperar la columna. 6. Arrastra hacia la derecha o pulsa Inicio en el tirador para recuperar las etiquetas.

## EN

Options defaults to the smallest width that fits every label in the active language, without filling the scene's leftover space. Drag its inner edge left to leave a 52 px icon rail; hover reveals each name and accessible names remain available. Drag right to restore labels. With the handle focused, Right arrow restores readable width from icons; Home or double-click resets the minimum readable width. The chosen width is saved per browser and origin; earlier manual sizes are retained. In the twin, opening a tool from its icon temporarily widens Options for its controls and previews; closing it restores the chosen width. The release stamp stays at the bottom as an information icon in the compact rail, retaining help and release notes. ☰ still collapses the entire panel. Advanced and Expert retain their controls and colours.

1. Open ☰ Options. 2. Drag its right edge left until only icons remain. 3. Hover an icon to read its name. 4. Click it to open its tool. 5. Close the tool to restore the rail. 6. Drag right or press Home on the handle to restore labels.

## Contrato / Contract

- ID: `options-compact`.
- Runtime: `/admira-xp/scripts/options-rail.mjs`; CSS: `/admira-xp/scripts/options-rail.css`.
- Panels: `.quad-left`, `#xpace-side-left`, `#xsOptions`; state class: `.xp-options-icons`.
- Existing storage retained: `xpace_side_width_left`, `xpaceos_shell_size_v1:left`. Reset removes only the width/size entry, retaining CLI history, brand, content and identities.
- Full collapse still uses ☰. No new MCP tool or remote publication.
- Implemented: native Good/Better/Best/Matrix and pages with XpaceOS shared shell. Other suite applications have their own sizing controllers; this release does not claim their compact mode is delivered.
- Public help: https://mcp.admira.store/help; MCP `help` topic `options-compact`.
