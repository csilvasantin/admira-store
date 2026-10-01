# Starbucks · Pista actual y volver a emitir / Current track and resume playback

ES: En Matrix · Starbucks, el título completo de la pista actual aparece entre Escuchar/Silenciar y Siguiente canción en el menú Experto y se actualiza al avanzar, también en silencio. Pulsa la tarjeta verde CERRADA para quitar el aviso y reanudar la playlist asignada a esa pantalla virtual. La retirada se recuerda en este navegador para ese cierre; una incidencia nueva o reabierta vuelve a aparecer. Las tarjetas ABIERTA, EN CURSO y RECUPERADA siguen abriendo Yokup. Este clic no modifica ni reabre el ticket de Yokup y no confirma emisión en una pantalla física.

EN: In Matrix · Starbucks, the full current track title appears between Listen/Mute and Next track in the Expert menu and updates on track changes, including while muted. Click the green CLOSED card to dismiss the notice and resume that virtual screen’s assigned playlist. Dismissal is remembered in this browser for that closure; a new or reopened incident appears again. OPEN, IN PROGRESS and RECOVERED cards still open Yokup. This click does not modify or reopen the Yokup ticket and does not confirm playback on a physical screen.

Store: `starbucks-alsea-paseo-de-gracia`. URL: https://www.xpaceos.com/admira-xp/?autostart=xtanco&visual=matrix&loc=alsea-sbux-021.

MCP: `matrix_state`, `matrix_music_next`, `matrix_configure` and `screen_plug` retain their existing contracts. The title reads the live browser music transport; a managed playlist remains authoritative. Closed-card recovery is local UI behavior and sends no incident request or shared-state write. Do not call `incident_open` or `screen_plug` to dismiss a closed card. Shared MCP power changes remain separate, authenticated operations with `expected_revision`.

Persistence: `xpaceos.starbucks.dismissed.v1` stores the closed incident ID and `resolved_at` for the last 50 dismissals. A reopened ticket is displayed even if it has the same ID; a subsequent closure with a new resolution timestamp can be dismissed again. Older closed cards are not revived after dismissing the most recent closure. Undismissed closed cards keep their ten-minute visibility window. Status polling remains 15 seconds; counter refresh remains one second.

Validation: music transport and device-playback tests; browser interaction with a local incident fixture; public Matrix UI and bilingual help. The fixture is a simulation of Yokup status, not evidence of a new or resolved real incident.

Tutorial animado / Animated guide (15 s, 1080×1920, H.264/AAC; not a screen recording): https://api.yokup.com/media/fleet/1fd264a783522364.mp4

Yokup: Hoy #132 · DCL-ac2caee11ce573e634303ef8. MCP help: https://mcp.admira.store/help.
