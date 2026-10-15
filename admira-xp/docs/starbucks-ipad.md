# iPad Starbucks · playlist horizontal y colas / Landscape playlist and queue

## Español

El iPad virtual de Starbucks reproduce en horizontal la misma playlist que el iPad real ipad-admin-mupi: la demo de dos vídeos, en su orden, sin importar los otros 25 contenidos. Stock → Starbucks → Demo iPad es el destino físico. Sin pedidos en Recibido, En preparación ni Preparado se ve la playlist; cualquier pedido activo superpone el gestor de colas y al recogerse el último vuelven los vídeos. Los fallos de lectura conservan la última lista y el último estado de cola válidos. /ipad cola activa este cambio automático; /ipad off lo desactiva y deja la playlist; /ipad abrir abre manualmente el gestor. La escena mantiene la cola sin voz propia. Pared, TPV e hilo musical conservan sus fuentes. No se garantiza sincronía de fotograma entre iPad real y virtual.

## English

The Starbucks virtual iPad plays the same landscape playlist as physical iPad ipad-admin-mupi: the two-video demo, in order, without importing the other 25 items. Stock → Starbucks → Demo iPad selects the physical destination. With no Received, Preparing or Ready orders the playlist is visible; any active order overlays the queue manager and collecting the final order restores the videos. Failed reads retain the last valid playlist and queue state. /ipad cola enables this automatic switch; /ipad off disables it and keeps the playlist; /ipad abrir manually opens the manager. The scene queue has no independent voice. Wall, POS and background music retain their sources. Frame-accurate sync between physical and virtual iPads is not guaranteed.

## Contrato compartido / Shared contract

Source / Fuente: GET https://admira.tv/api/playlist?screen=ipad-admin-mupi, draft.items followed by auto with stock-ID deduplication; read-only Store proxy /admira-xp/api/ipad-playlist. Poll 15 s, request timeout 8 s. Virtual device starbucks-ipad-01; landscape 1024×768; mapped corners retained. Queue / Cola: GET https://admira.tv/gestorColas/api/estado?sala=starbucks-paseo-de-gracia&publico=1, poll 3 s, timeout 5 s, arrays recibido/preparando/listo. QA override ?ipadQueueRoom=starbucks-qa (legacy ?cola= preserved), strict slug 2–80 chars, read-only. MCP playlists.ipad remains a legacy snapshot and no longer governs the visible iPad; edit the physical playlist through Admira TV/Stock. Store does not publish to the physical device.

## Ensayo / Rehearsal

ES: Abrir el gemelo Starbucks en Matrix (también Good/Better/Best). Comprobar los mismos dos IDs y orden que la pantalla física. Sin pedidos deben verse los vídeos horizontales. Ensayar recibido → preparando → listo → recogido sólo en starbucks-qa, usando ?ipadQueueRoom=starbucks-qa. Comprobar que al vaciarse vuelven los vídeos; simular un fallo de lectura y verificar continuidad. El control manual ampliado abre el gestor aunque la cola esté vacía. La verificación del hardware y del audio requiere aceptación independiente; los acuses no demuestran imagen física. Registrar las evidencias y el minitutorial exportado en admira.app.

EN: Open the Starbucks twin in Matrix (also Good/Better/Best). Compare the exact two IDs and their order with the physical screen. With no orders, landscape videos must be visible. Rehearse received → preparing → ready → collected only in starbucks-qa, with ?ipadQueueRoom=starbucks-qa. Verify videos return when the queue empties; simulate a failed read and check continuity. The enlarged manual view opens the manager even when empty. Hardware and audio require separate acceptance; acknowledgements do not prove physical images. Record evidence and the exported minitutorial in admira.app.

ES: Antes de la primera lectura física válida se espera sin reproducir otra playlist semilla. Después de una lectura válida, un fallo conserva esa misma lista.

EN: Before the first valid physical read the screen waits without substituting a seed playlist. After a valid read, a failure retains that same list.
