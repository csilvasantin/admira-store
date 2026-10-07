# Store · demos locales y plataformas / Local demos and platforms

ES: Abre ⌘ Experto y escribe `/demo help`. Los números 1–5 seleccionan las funciones de Store; los nombres de plataformas siguen abriendo otras soluciones.

EN: Open ⌘ Expert and type `/demo help`. Numbers 1–5 select Store functions; platform names still open other solutions.

| Número / Number | Comando / Command | Función / Function |
|---|---|---|
| 1 | `/demo locucion`, `/demo voz` | Gestión de locuciones / Voiceover management |
| 2 | `/demo musica`, `/demo playlist` | Gestión de música / Music management |
| 3 | `/demo imagenes`, `/demo imagen` | Gestión de imágenes / Image management |
| 4 | `/demo video` | Gestión de vídeo / Video management |
| 5 | `/demo caja`, `/demo venta` | Gestión del TPV / POS management |

ES: `/demo auto`, `/demo todas`, `/demo todos` o `/demo all` encadenan las cinco demos sin nuevas órdenes. Cada fase muestra el guion, el caso preparado y su muestra. `/demo pausa`, `/demo reanudar`, `/demo siguiente` y `/demo stop` controlan el ensayo; `/demo estado` consulta el activo. También acepta `pause`, `resume`, `continuar`, `next` y `parar`. Detener o Escape liberan los reproductores. Son datos de demostración: no hay alta real, venta, emisión física, edición de playlist compartida ni generación de pago.

EN: `/demo auto`, `/demo todas`, `/demo todos` or `/demo all` chain all five demos without further commands. Each phase shows its script, prepared case and sample. `/demo pause`, `/demo resume`, `/demo next` and `/demo stop` control the rehearsal; `/demo status` reads the active one. Spanish aliases are accepted. Stop or Escape releases the players. Prepared data only: no real registration, sale, physical broadcast, shared playlist edit or paid generation.

## TPV nativo conservado / Native POS retained

ES: El comando exacto `/demo tpv` mantiene el recorrido nativo del muffin en Matrix. `/demo tpv estado` consulta y `/demo tpv off` o `/demo tpv stop` detienen ese recorrido explícitamente. Sin ensayo local activo, `/demo estado`, `/demo status`, `/demo off` y `/demo stop` también controlan el TPV nativo. Este recorrido nativo no admite pausa/reanudación. Una compra del gemelo conserva su cesta por pestaña, sin cobro ni conexión física; detener después de entregar el muffin no lo borra. `?demo=tpv` conserva su arranque al primer gesto.

EN: The exact `/demo tpv` command retains the native muffin journey in Matrix. `/demo tpv status` reads it; `/demo tpv off` or `/demo tpv stop` explicitly stops it. Without an active local rehearsal, `/demo status`, `/demo estado`, `/demo off` and `/demo stop` also control native POS. This native journey does not support pause/resume. The twin basket remains per tab, without payment or physical connection; stopping after delivery retains its muffin. `?demo=tpv` retains first-gesture startup.

## Contrato compartido / Shared contract

- Motor / Engine: `https://www.admiranext.com/suite/experto.js`, cargado al primer comando local con una URL fresca; API `AdmiraExperto.demo(text, logDOM)` y `demoEstado()` / loaded lazily with a fresh URL.
- Catálogo / Catalog: `https://www.admiranext.com/subdemos/store.subdemos.json`; IDs `store/voz`, `store/musica`, `store/imagenes`, `store/video`, `store/tpv`.
- Integración / Integration: `admira-xp/scripts/store-demo-bridge.mjs` y `xtanco-visual-command.mjs`; ambos pasan por el compositor original y `__xtExec`. No se registra un segundo CLI, no se borra historial, no se cambia marca ni se envía la orden a Telegram. / Original composer and history remain; no second CLI or Telegram dispatch.
- Salida por nombre / Named platform exit: `/demo studio`, `/demo store`, `/demo tv`, `/demo app`, `/demo biz` (y los alias del catálogo compartido). Los números nunca seleccionan una plataforma global en Store. / Numbers never select global platforms on Store.
- Si el motor no carga, el CLI muestra un error local y permite reintentar; no declara una demo ejecutada. / Engine load failures stay local and allow retry without claiming success.

## Verificación y publicación / Verification and release

ES: La rama de integración se verifica con pruebas del dispatcher, carga/error del motor, conservación del TPV y previo en navegador. Producción y ayuda del servidor MCP real `xpaceos-mcp` requieren la publicación coordinada del motor y de Store. No se añade una herramienta MCP remota para lanzar demos.

EN: The integration branch is checked with dispatcher, engine load/error, native POS preservation and browser preview tests. Production and the real `xpaceos-mcp` help require coordinated engine and Store publication. No remote MCP demo-launch tool is added.


## Primer uso del avatar y espejo / First avatar use and mirroring

ES: Al abrir el avatar, Store precarga el motor y envía el catálogo local a su iframe; no ejecuta un ensayo. Frames propios / Owned frames: `#da-suite-frame` y `#starbucks-avatar-wall[data-mode="avatar"] iframe`; la vista previa inerte de pared no precarga. Los mensajes `da-demo` del iframe propio, con origen exacto `https://digitalavatar.ai`, usan el mismo dispatcher nativo de Experto y evitan una segunda ejecución del cargador central. Si el mensaje llega antes de precargar, la orden carga el motor. Experto sigue cargándolo al primer `/demo`.

EN: Opening the avatar preloads the engine and sends the local catalog to its iframe without starting a rehearsal. `da-demo` messages from the owned iframe at the exact `https://digitalavatar.ai` origin use the native Expert dispatcher and prevent duplicate central-loader dispatch. An early command can load the engine itself. Expert still loads it on its first `/demo`.

ES: El espejo diario valida `mcp/manifest.json.store_demo_contract` antes de `rsync --delete`. Si XpaceOS publicado no conserva runtime, bootstrap y ayuda equivalentes, el sync se detiene antes de modificar Store. Hay que publicar ese contrato en XpaceOS antes de reanudar el espejo; no se retiran los controles de acceso ni se modifican datos del origen.

EN: Daily mirroring validates `mcp/manifest.json.store_demo_contract` before `rsync --delete`. If published XpaceOS lacks equivalent runtime, bootstrap or help, sync stops before changing Store. Publish that contract in XpaceOS before resuming mirroring; access controls and source data are retained.

El iframe propio puede incluir `requestId` en `da-demo`; Store responde `da-demo-result` después de ejecutar la orden local, con `ok`, `message`, `estado` y `result`. Los IDs usan `^[a-zA-Z0-9_.:-]{1,128}$`; se conservan 128 por iframe sin expulsar antiguos. Repetir un ID con la misma orden devuelve su resultado sin ejecutarla de nuevo; reutilizarlo para otra orden se rechaza. Al límite hay que recargar la página. Ayuda, estado y errores permanecen visibles en la conversación. Las respuestas limitan el mensaje a 4.000 caracteres y el resultado serializado a 8.192 bytes UTF-8.

The owned iframe may include `requestId` in `da-demo`; Store returns `da-demo-result` after local execution with `ok`, `message`, `estado` and `result`. IDs use `^[a-zA-Z0-9_.:-]{1,128}$`; 128 are retained per iframe without eviction. Repeating the same ID/command returns the prior result without another execution; reuse for a different command is rejected. Reload at the limit. Help, status and errors remain visible in the conversation. Messages are limited to 4,000 characters and serialized results to 8,192 UTF-8 bytes.
