## Experto · Acciones, hover y arrastre / Actions, hover and dragging

ES: La fila Send / Show-Hide / Player y cámara / × está en la tercera columna de Experto, junto al selector Good/Better/Best/Matrix y Local view. La columna central queda para los controles operativos. Show/Hide sigue ocultando sólo el texto de Local view.

EN: The Send / Show-Hide / Player and camera / × row is in the third Expert column, together with Good/Better/Best/Matrix and Local view. The middle column holds operational controls. Show/Hide still toggles only Local view text.

ES: El altavoz de avisos no muestra ningún icono ni contorno en reposo, incluso durante la locución. El rectángulo aparece al pasar el ratón por encima o recibir foco de teclado, con animación suave salvo movimiento reducido. Sigue siendo pulsable sobre el altavoz real de la captura; en táctil se puede tocar directamente.

EN: The announcement speaker shows no icon or outline at rest, including during playback. Its rectangle appears on hover or keyboard focus, with a subtle animation unless reduced motion is enabled. The hotspot remains clickable over the captured speaker; touch users can tap it directly.

ES: En /layout, abre la playlist y arrastra una miniatura a la posición deseada. Ratón y táctil reordenan el borrador; al acercarse al borde del panel, la lista se desplaza. Escape cancela el arrastre; soltar fuera de la lista sólo cancela si no hay una pantalla o TPV de destino. Soltar sobre un dispositivo activa el previo temporal. También puedes enfocar la miniatura y usar ↑/↓, o pulsar los botones de flechas existentes. Pulsa Guardar playlist para aplicar y conservar el orden; Play guarda los cambios válidos antes de reproducir.

EN: In /layout, open the playlist and drag a thumbnail to the desired position. Mouse and touch reorder the draft; moving near the panel edge scrolls the list. Escape cancels the drag; dropping outside the list cancels only without a screen or POS target. Dropping on a device starts a temporary preview. You can also focus the thumbnail and use ↑/↓, or use the existing arrow buttons. Save playlist applies and persists the order; Play saves valid changes before playing.

MCP: Existing playlist_reorder changes shared wall/TPV/iPad/music order using the full order array and expected_revision. For custom shared playlists, use matrix_device_layout action=save_playlist with the same playlist_id, title and reordered tracks. Read matrix_state before writing. Browser drafts remain local until shared explicitly. UI dragging does not create new physical-device operations or tools. playlist_play continues to jump to saved content. Endpoint: https://mcp.admira.store/mcp.
