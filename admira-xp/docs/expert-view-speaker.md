## Experto · Vistas y altavoz / Expert · Views and speaker

ES: La tercera columna del menú Experto contiene Good, Better, Best y Matrix, el estado de la vista y Local view. La zona media queda para los controles operativos (players, playlists, cámara, audio). Ocultar/Mostrar afecta sólo a Local view: conserva el selector y ambos separadores. Arrastra los separadores para ajustar anchos y el tirador superior para la altura. Sin barras de desplazamiento visibles.

EN: The third Expert column contains Good, Better, Best and Matrix, view status and Local view. The middle column holds operational controls (players, playlists, camera, audio). Hide/Show only affects Local view: the selector and both dividers remain available. Drag the dividers to resize columns and the top handle to resize height. Scrollbars remain hidden.

ES: El altavoz de avisos de Starbucks usa un rectángulo sin icono, oculto hasta hover o foco de teclado. Al pasar el cursor o enfocarlo con teclado, su contorno fluctúa suavemente. Pulsa o usa Enter/Espacio para emitir o detener la cuña. Durante el aviso el contorno sólo se ve al pasar el ratón o recibir foco de teclado, sin símbolos. La preferencia de movimiento reducido elimina la animación. El botón «Altavoz avisos» centra la cámara en el altavoz; «Aviso de cierre» ofrece la misma acción desde Experto.

EN: The Starbucks announcement speaker uses a rectangle without an icon, hidden until hover or keyboard focus. Hovering or focusing it with the keyboard softly pulses its outline. Click or press Enter/Space to play or stop the announcement. While playing, the outline is visible only on hover or keyboard focus, without a symbol. Reduced-motion preferences disable animation. “Announcement speaker” centers the camera on the speaker; “Closing announcement” provides the same action in Expert.

MCP: matrix_announcement remains the authenticated announcement trigger with expected_revision. No new tools or physical-device controls. UI layout and hover are local presentation; audio priority, music restoration and the fixed 22h announcement are unchanged. Details: https://www.xpaceos.com/admira-xp/docs/starbucks-announcement.md

## Experto · Acciones, hover y arrastre / Actions, hover and dragging

ES: La fila Send / Show-Hide / Player y cámara / × está en la tercera columna de Experto, junto al selector Good/Better/Best/Matrix y Local view. La columna central queda para los controles operativos. Show/Hide sigue ocultando sólo el texto de Local view.

EN: The Send / Show-Hide / Player and camera / × row is in the third Expert column, together with Good/Better/Best/Matrix and Local view. The middle column holds operational controls. Show/Hide still toggles only Local view text.

ES: El altavoz de avisos no muestra ningún icono ni contorno en reposo, incluso durante la locución. El rectángulo aparece al pasar el ratón por encima o recibir foco de teclado, con animación suave salvo movimiento reducido. Sigue siendo pulsable sobre el altavoz real de la captura; en táctil se puede tocar directamente.

EN: The announcement speaker shows no icon or outline at rest, including during playback. Its rectangle appears on hover or keyboard focus, with a subtle animation unless reduced motion is enabled. The hotspot remains clickable over the captured speaker; touch users can tap it directly.

ES: En /layout, abre la playlist y arrastra una miniatura a la posición deseada. Ratón y táctil reordenan el borrador; al acercarse al borde del panel, la lista se desplaza. Escape cancela el arrastre; soltar fuera de la lista sólo cancela si no hay una pantalla o TPV de destino. Soltar sobre un dispositivo activa el previo temporal. También puedes enfocar la miniatura y usar ↑/↓, o pulsar los botones de flechas existentes. Pulsa Guardar playlist para aplicar y conservar el orden; Play guarda los cambios válidos antes de reproducir.

EN: In /layout, open the playlist and drag a thumbnail to the desired position. Mouse and touch reorder the draft; moving near the panel edge scrolls the list. Escape cancels the drag; dropping outside the list cancels only without a screen or POS target. Dropping on a device starts a temporary preview. You can also focus the thumbnail and use ↑/↓, or use the existing arrow buttons. Save playlist applies and persists the order; Play saves valid changes before playing.

MCP: Existing playlist_reorder changes shared wall/TPV/music order using the full order array and expected_revision. For custom shared playlists, use matrix_device_layout action=save_playlist with the same playlist_id, title and reordered tracks. Read matrix_state before writing. Browser drafts remain local until shared explicitly. UI dragging does not create new physical-device operations or tools. playlist_play continues to jump to saved content. Endpoint: https://mcp.admira.store/mcp.
