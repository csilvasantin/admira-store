## Playlist · Previo y Play / Preview and Play

ES: En Matrix → /layout → dispositivo, cada fila muestra un previo silencioso junto al número. El botón ▶ está a la derecha de × y salta al inicio de ese contenido. Todos los dispositivos virtuales activos que usan esa playlist cambian juntos, reanudando los pausados; después continúa el orden normal. Las otras playlists y el hilo musical no cambian. Play guarda primero los cambios válidos e ignora filas vacías. Los dispositivos apagados permanecen apagados. El previo no reproduce audio. Si falla el vídeo, se indica el error y Play permite reintentar.

EN: In Matrix → /layout → device, each row shows a silent preview beside its number. The ▶ button is immediately to the right of × and jumps to the beginning of that content. All active virtual devices using that playlist switch together, resuming paused members; normal playlist order continues afterwards. Other playlists and background music are unaffected. Play saves valid draft changes first and ignores empty rows. Powered-off devices stay off. Previews never play audio. Failed videos show an error and Play retries.

MCP: playlist_play {playlist_id, track_id, expected_revision}. Read matrix_state first. playlist_id is wall, tpv or a shared playlist-<id>. track_id is the saved content ID, not its row number. Authenticated fleet key required. Saving in the editor publishes a stable #playlist UUID; screen assignments remain local. For UUID playlists read playlist_list, not matrix_state, for the revision. The UI Play action remains local to the current browser. MCP commands reach already-open Matrix clients at the next poll (approximately 5 seconds); old commands are not replayed when entering Matrix. Each browser synchronizes its assigned devices locally; this does not guarantee frame accuracy between browsers or publish to physical players. Selecting a regular video exits AI sync. An acknowledgement records the command, not successful playback.

ES: Los agentes pueden leer, editar y saltar a contenido compartido por MCP. EN: Agents can read, edit and jump to shared content through MCP. Endpoint: https://mcp.admira.store/mcp. Example: read matrix_state, then playlist_play with playlist_id="wall", track_id from state.playlists.wall.tracks and the current expected_revision.

## Experto · Acciones, hover y arrastre / Actions, hover and dragging

ES: La fila Send / Show-Hide / Player y cámara / × está en la tercera columna de Experto, junto al selector Good/Better/Best/Matrix y Local view. La columna central queda para los controles operativos. Show/Hide sigue ocultando sólo el texto de Local view.

EN: The Send / Show-Hide / Player and camera / × row is in the third Expert column, together with Good/Better/Best/Matrix and Local view. The middle column holds operational controls. Show/Hide still toggles only Local view text.

ES: El altavoz de avisos no muestra ningún icono ni contorno en reposo, incluso durante la locución. El rectángulo aparece al pasar el ratón por encima o recibir foco de teclado, con animación suave salvo movimiento reducido. Sigue siendo pulsable sobre el altavoz real de la captura; en táctil se puede tocar directamente.

EN: The announcement speaker shows no icon or outline at rest, including during playback. Its rectangle appears on hover or keyboard focus, with a subtle animation unless reduced motion is enabled. The hotspot remains clickable over the captured speaker; touch users can tap it directly.

ES: En /layout, abre la playlist y arrastra una miniatura a la posición deseada. Ratón y táctil reordenan el borrador; al acercarse al borde del panel, la lista se desplaza. Escape cancela el arrastre; soltar fuera de la lista sólo cancela si no hay una pantalla o TPV de destino. Soltar sobre un dispositivo activa el previo temporal. También puedes enfocar la miniatura y usar ↑/↓, o pulsar los botones de flechas existentes. Pulsa Guardar playlist para aplicar y conservar el orden; Play guarda los cambios válidos antes de reproducir.

EN: In /layout, open the playlist and drag a thumbnail to the desired position. Mouse and touch reorder the draft; moving near the panel edge scrolls the list. Escape cancels the drag; dropping outside the list cancels only without a screen or POS target. Dropping on a device starts a temporary preview. You can also focus the thumbnail and use ↑/↓, or use the existing arrow buttons. Save playlist applies and persists the order; Play saves valid changes before playing.

MCP: Existing playlist_reorder changes shared wall/TPV/music order using the full order array and expected_revision. For custom shared playlists, use matrix_device_layout action=save_playlist with the same playlist_id, title and reordered tracks. Read matrix_state before writing. Browser drafts remain local until shared explicitly. UI dragging does not create new physical-device operations or tools. playlist_play continues to jump to saved content. Endpoint: https://mcp.admira.store/mcp.
