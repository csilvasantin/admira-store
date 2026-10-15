# Playlist del establecimiento / Venue playlist

Admira Hoy349 · DCL-797cc567ad5030dc8147416d.

## ES

Abre un Xpace con proyecto y establecimiento seleccionados. En **Opciones → Hilo musical → Playlist actual**, o en la ficha de un equipo → **DESPLEGAR MANDO INTERACTIVO**, se indica proyecto, establecimiento y canal. En **Opciones → Pantallas → Playlist actual**, elige la pantalla concreta antes de editar. La ficha del plano Gran de Gràcia incluye el mismo editor para las pantallas de su inventario público coincidente.

Pulsa **Añadir desde Stock**, busca por título o número habitual (por ejemplo **#1308**) y pulsa **Añadir** junto al resultado. **Ver en Admira Studio** abre su contenido canónico. Música acepta audio/vídeo; una pantalla acepta imagen/vídeo. **Quitar de esta playlist** retira sólo la asociación, nunca borra Stock. Los cambios persisten en Admira TV para ese proyecto, establecimiento y canal. No se aplican a otros locales de la misma marca.

La selección histórica conocida por servidor se conserva en la primera edición. Si existe una selección Stock anterior visible sólo en el navegador, aparece **Conservar selección Stock visible anterior en este local**, con sus títulos: marcarla adopta esos IDs junto con el primer cambio. No se copian URLs ni destinos. No se importan automáticamente preferencias globales ambiguas a otros locales. Las revisiones y asociaciones retiradas quedan en el historial de la autoridad D1.

Quitar la última pieza guarda una playlist vacía y detiene su reproducción. No reaparecen piezas automáticas, sintéticas ni del catálogo general. Quitar una pieza automática la excluye sólo de esta playlist, sin cambiar etiquetas Stock. Una revisión concurrente muestra conflicto, refresca la lista y pide revisar antes de repetir. Un error de red conserva la última lectura válida del mismo contexto; cambiar de establecimiento la descarta inmediatamente.

Un lector ve la lista pero no edita. Sin proyecto/establecimiento, con acceso denegado o superficie no contrastable, el editor falla cerrado. No acepta una pantalla física arbitraria. En un local virtual se muestra **Playlist del gemelo · sin player físico asociado**. Asociar hardware es una operación administrativa separada. La demo autorizada asocia exclusivamente `starbucks / alsea-sbux-021 / music` al iPhone `iphone17-mupi`; los demás locales tienen identidad propia y no siguen cambios futuros de ese teléfono. Guardado en D1 no equivale a recibo de reproducción.

Anterior, Escuchar/Silenciar, Siguiente y Lanzar controlan el reloj web del gemelo. El mando permanece abierto tras actualizar la playlist. El TPV sigue usando ese único audio y una composición vertical: vídeo sólo si es vertical confirmado; horizontal/cuadrado usa portada original llenando el área o carátula editorial. Incidencias, cesta, locuciones y silencio general conservan prioridad. iPad conserva sus dos vídeos horizontales y su cola; eInk queda fuera de este editor.

El editor común está montado en Opciones del shell y fichas existentes de Matrix/Best y del plano Gran de Gràcia. No crea una ficha nueva en páginas de laboratorio que sólo distribuyen artefactos. Un plano privado cuyos IDs no coincidan con el inventario público no permite editar esas superficies. No existe un nuevo comando CLI de edición; la ayuda CLI enlaza esta interfaz. Los escritores MCP legacy no sustituyen la nueva autoridad scoped.

## EN

Open an Xpace with an explicit project and venue. Use **Options → Background music → Current playlist**, or a device card → **EXPAND INTERACTIVE REMOTE**. The editor identifies project, venue and channel. Under **Options → Screens → Current playlist**, select the specific screen first. The Gran de Gràcia floor-plan detail uses the same editor for surfaces matching its public inventory.

Choose **Add from Stock**, search by title or Stock number such as **#1308**, then **Add**. **View in Admira Studio** opens the canonical content. Music accepts audio/video; signage accepts image/video. **Remove from this playlist** removes only the association, never the Stock asset. Changes persist in Admira TV for that venue/channel, without changing other venues of the same brand.

Server-known historical selections are adopted once. When a previous browser-only Stock selection is available, **Keep the previous visible Stock selection in this venue** previews its titles; explicitly checking it adopts validated IDs with the first change. Ambiguous global preferences are not silently copied to other venues. D1 retains revision history.

Removing the final item stores intentional empty and stops playback, without automatic/default/catalog fallback. Automatic exclusions are per playlist. Concurrent revisions refresh and report a conflict; review before retrying. Network failure retains only the current venue's last valid snapshot. Switching venue clears it immediately and discards late responses.

Viewers cannot edit; missing or unauthorized context fails closed. Virtual venues show **Twin playlist · no physical player associated**. Hardware association requires separate administrative authorization. Only the authorized `starbucks / alsea-sbux-021 / music` demo binds to `iphone17-mupi`; other venues have independent identities. Persistence is separate from physical playback receipts.

Previous, Listen/Mute, Next and Launch control the twin's web clock and keep the expanded remote open. The POS keeps one audio owner and its single portrait composition; landscape/square media uses portrait artwork, while confirmed portrait videos may play visually. Incidents, basket, announcements and master mute retain priority. The iPad two-video/queue demo and eInk are excluded.

The common editor is mounted in shell Options, existing Matrix/Best device cards and the Gran de Gràcia floor-plan detail. Artifact-only lab pages do not gain new screen remotes. Private surface IDs that cannot match the public inventory are rejected. No new editing CLI command or MCP tool is claimed; legacy MCP snapshots do not replace this scoped authority.

## Calidad / Quality

Elegir Matrix respeta el establecimiento: si hay loc/venue explícito distinto del demo de Paseo de Gràcia, se usa Better sin cambiar proyecto ni destino. La entrada genérica sin local y el demo concreto conservan Matrix.

Choosing Matrix preserves the venue: an explicit loc/venue outside the Paseo de Gràcia demo uses Better without changing project or destination. Generic entry without a venue and the concrete demo retain Matrix.

## API / contracts

- Store BFF: `GET/POST /admira-xp/api/context-playlist`, authenticated same-origin session; mutations require Origin and `X-Admira-Playlist-Request:1`.
- Stock picker: `GET /admira-xp/api/stock-search`, same scoped commercial permission.
- TV: `POST /api/xpace-playlists`, short-lived server-to-server signed grant; no grant or service key reaches the browser.
- Persistence: existing `PROGRAMACION_DB`, CAS revision + idempotent request receipt; tuple project/venue/channel, server-resolved screen.
- Physical association/migration: [TV ES/EN procedure](https://admira.tv/docs/xpace-local-playlist.md).
- Verification: unit/API scope, viewer, CSRF, late responses, conflicts, empty and #number cases; Chrome UI components across five controlled QA venue contexts. Production and hardware receipts are recorded separately in the mission; component fixtures are not production delivery.
