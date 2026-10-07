# Continuidad Xtore y catálogo de demos / Xtore continuity and demo catalogue

Actualizado / Updated: 7 de octubre de 2026 / 7 October 2026. Alcance / Scope: cambios de este hilo sobre Starbucks Alsea, Experto, Pixeria y TPV. El inventario completo del producto sigue en [Catálogo funcional](https://www.xpaceos.com/mcp/funcionalidades.json).

## Español

### Estado y punto de entrada

[Entrar al gemelo Starbucks](https://www.admira.store/admira-xp/?marca=starbucks&loc=alsea-sbux-021&project=starbucks&circuit=alsea_starbucks&lang=es#tpv). Matrix es el modo por defecto sin `quality` o `visual` explícito. Una URL que fuerza Good/Better/Best conserva esa elección; el selector sigue disponible. La marca Starbucks muestra el imagotipo y STARBUCKS blanco, con Xpacio y Calidad en la barra. Opciones a la izquierda, Avanzado a la derecha, Experto abajo; los paneles empiezan cerrados y Experto se abre con ⌘. No sustituir el shell, sus extensiones, el historial CLI, /marca ni la integración /avatarDigital del consejero Woz al añadir demos.

### Lo entregado en este hilo

| Función | Uso actual | Contrato y guía |
|---|---|---|
| Avatar digital | Good · Admirito por defecto, independiente de Matrix. Pulsar la pantalla de la pared abre conversación; no la web Starbucks. ESP/ENG se hereda del sitio; modelos explícitos siguen disponibles. Se quitaron nota musical y siguiente sobre el avatar. | `starbucks-avatar-wall`; [avatar y modelos](matrix-wall-avatar.md). Hilo Musical mantiene Escuchar/Silenciar y Siguiente. |
| TPV y cesta | Arrastra el muffin de la vitrina a la caja junto al osito. La compra aparece en el TPV con cantidades. Añadir café es explícito; Editar cesta o pulsar caja abre Quitar y Sólo el muffin. La cesta flotante no se abre sola. | `muffin`, `coffee`, `alsea-sbux-021`, `starbucks-tpv-01`; [cesta](pos-muffin.md), [compra mapeada](advanced-icons-pos-checkout.md). |
| Demo TPV | `/demo tpv` enfoca, marca silueta, recoge, transporta y entrega un muffin; ejecuta las reacciones elegidas. `/demo off` o Escape detiene. | [Demo TPV](demo-tpv.md), motor `pos-demo.mjs`. Es la demo guiada automatizada disponible. |
| IF·THEN·DO THAT | `/ifthendothat`: IF coger o entregar muffin → uno o hasta ocho DO simultáneos. Música, locución, imagen y vídeo; elegir contenido guarda, no reproduce. Cada DO se resume y se abre para editar. | [Reglas y Pixeria](ifthendothat.md); regla v3 compatible con v1/v2. |
| Repositorio Pixeria | Reacción preselecciona `#musica`, `#locucion`, `#imagen`, `#video`. Se puede modificar o quitar el filtro para ver todo el tipo. Catálogo completo, sin corte de 200 vídeos. | `/admira-xp/media-catalog`, índice público Stock. IDs y URLs se resuelven antes de mostrar contenido. |
| DO en varias pantallas | Vídeo/imagen elige una o varias de las seis pantallas, TPV e iPad. El último visual gana en destinos solapados. Con locución/música, vídeo mudo; sin ellas, un solo destino emite audio. | Reproducción paralela del gemelo, sin garantía de sincronía de frames ni hardware físico. |
| Prioridad en TPV | Mientras haya compra, la capa de cesta tapa publicidad o reacción visual sólo en el TPV. Al vaciarla se descubre el contenido anterior vigente; no se sustituye la playlist ni se detienen las reglas. | `.matrix-pos-checkout`; edición geométrica, /layout y apagado la ocultan temporalmente. |
| Toggles y Avanzado | Un botón ON/OFF para tótem, avatar y audiencia: verde activo, rojo inactivo, ligado al estado real y CLI. Player y cámara tiene tarjetas SVG: Enviar, Mostrar/Ocultar, IF·THEN·DO, Player y cámara y Cerrar Experto. | [Toggles y resumen](expert-toggles-day-summary.md), [iconos](advanced-icons-pos-checkout.md). |
| Resumen del día | OFF por defecto. `/resumen dia on`, `/resumen dia off`, `/resumen dia estado`; elección local persistida. OFF mantiene histórico y avance de día sin modal. | También `/summary day on|off|status`; nunca activar el modal durante un tour salvo escenario específico. |
| Previos y medios | PREVIOS conserva la última creación y sus recibos; doble clic abre previo grande. Arrastres centrados de imagen/vídeo y controles de música/locución siguen disponibles. | [Previos](expert-previews.md), [creación](https://www.xpaceos.com/admira-xp/help.html#media-creation-experience), [arrastre](pixeria-screen-drop.md). Usar medios existentes para demos sin nueva generación. |
| Playlists y reset | Pared, TPV, iPad e hilo musical mantienen canales distintos. `/reset` recupera bases actuales, sin borrar creaciones/historial; no usarlo como limpieza de una demo si borra el contexto de una presentación personalizada. | [Matrix y Signage](matrix-signage-reset.md), [estado MCP](matrix-mcp.md). |

### Cómo enseñar hoy la demo automatizada

1. Entrar en Starbucks Matrix, cerrar /layout y edición de geometría, comprobar TPV encendido y esperar a que termine la carga. Usar una pestaña de demostración para no incrementar la compra del usuario: cada demo completa añade un muffin a la cesta existente y sólo esa pestaña guarda la cesta.
2. Abrir ⌘ y `/ifthendothat`. Escoger un IF y contenidos existentes de Pixeria. Para locución + vídeo simultáneos, añadir dos DO y seleccionar destinos de pared. Si también se selecciona TPV, la compra tendrá prioridad allí desde la entrega; usar pared o iPad para mostrar el vídeo junto a la compra.
3. Lanzar `/demo tpv` desde el CLI con gesto humano. El navegador prepara audio en ese gesto. No arrancar sonido al cargar la página ni sortear bloqueos de autoplay. Experto se oculta para ver el recorrido; puede reabrirse con ⌘.
4. Comprobar foco → silueta → recogida → viaje → entrega → compra y reacción. El recorrido alcanza la entrega nominalmente a los 6,4 segundos; eso no es un tiempo garantizado de carga o de audio.
5. `/demo estado` consulta fase. `completed` no prueba por sí solo audio audible ni reproducción de todos los DO: comprobar cada medio, su destino, `paused`, `readyState` y avance de tiempo, y escuchar el audio cuando forme parte de la aceptación.
6. Detener con botón, Escape o `/demo off`. Un nuevo inicio mientras corre devuelve busy. Cancelar antes de la entrega no añade productos; después conserva lo añadido. Antes de la entrega la cancelación recupera la cámara previa; al finalizar se conserva la vista de caja.
7. Si falla un medio, no anunciar éxito de toda la experiencia. Confirmar URL Stock, regla activa y evento, destinos disponibles, sesión y permiso de audio; las reacciones válidas pueden continuar. Documentar lo mostrado y la limitación por separado.

La pista semilla es **Bad Times Deep House**, ID `1790706121644-y5mqrq`, Stock 1308. Carlos propuso Bad Day; no se asignó esa canción porque no se obtuvo una referencia válida en la consulta inicial. No afirmar que Bad Day está configurada: buscar su ID en Pixeria para una sustitución futura.

La demo clásica del botón DEMO en la pantalla 0 pertenece al simulador histórico; no es el tour guiado de todas las nuevas posibilidades Matrix. Su comportamiento y sus controles se conservan.

### Catálogo de escenarios para enseñar todas las posibilidades

[Catálogo legible por agentes](https://www.xpaceos.com/admira-xp/demos/catalog.json). Cada ficha distingue funcionalidad entregada, nivel de automatización actual, preparación, evidencia y siguiente automatización. Incluye: entrada Matrix/marca, avatar, muffin a caja, café, cada reacción Pixeria, varios DO, varias pantallas, playlists, Navidad, Sincro IA, arrastre de medios, previos y resumen optativo.

**Disponible:** recorrido guiado `/demo tpv`; configuración manual de reglas y selección de contenido. Los modos de emisión `/navidad on|off` y `/sincro ia` existen, pero no son tours guiados de cámara con anotaciones. **Pendiente:** un catálogo runtime con selector de demo, un tour que encadene escenarios, pausa/continuación, evidencia por paso y restauración de contexto. Este documento y catalog.json no registran nuevos comandos ni ejecutan el tour. `/demo tour`, `/demo lista`, `/demo pausa` y `/demo continuar` son nombres propuestos, no órdenes disponibles.

### Contrato que debe implementar el siguiente agente

- Reutilizar el dispatcher local `xtanco-visual-command.mjs` y los controladores entregados; evitar coordenadas de ratón rígidas o eventos sintéticos como interfaz de automatización. Un solo recorrido activo; identificador de ejecución y token de cancelación para que promesas antiguas no reproduzcan tras Stop.
- Registro de recetas declarativas versionadas: ID estable, títulos ES/EN, contexto, requisitos, referencias Stock, objetivos de cámara, pasos, aserciones, efectos y limpieza. Resolver IDs reales; no inventar una URL o un éxito. Validar cada escenario y mostrar unavailable/blocked con motivo.
- Estados propuestos: idle, preparing, running, paused, completed, cancelled, error. Añadir el runner general y su selector sólo cuando funcionen; el motor TPV actual mantiene sus fases existentes. Pausa/continuación requiere pausar medios y reloj juntos y revalidar disponibilidad; no es simplemente reiniciar un timeout.
- Preparar toda reproducción desde un gesto autorizado. Conservar política de audio, supresión musical por referencias y un solo vídeo audible. Una selección guardada no prueba emisión; una escritura MCP aceptada tampoco es ACK de reproducción.
- Capturar contexto anterior: marca, idioma, calidad, cámara, ventanas, reglas/IDs, basket, playlists, preferencias, posiciones de medios y resumen. Ejecutar escenarios con configuración temporal aislada. El tour futuro no debe sobreescribir reglas ni vaciar la compra del usuario. La demo TPV actual sí suma un muffin: declarar ese efecto y usar pestaña dedicada.
- Limpieza en Stop, Escape, pagehide, cambio de vista o error: cancelar frames/trabajos, parar medios temporales, quitar capas, liberar supresión y restaurar el contexto afectado. No usar `/reset` como sustituto de un snapshot. No perder historial, recibos, preferencias ni estado remoto.
- No crear música, vídeo, imágenes o TTS de pago como efecto incidental de una demo. Mostrar recursos existentes; la generación necesita una acción expresamente escogida y su contrato de sesión. No añadir mensajes Telegram, escrituras remotas ni órdenes físicas por defecto.
- Evidencia por paso: señal DOM/estado real, destino visible, incremento esperado de cesta en la demo actual, error/cancelación, captura y verificación acústica cuando corresponde. URLs, revisiones y timestamp reales. Probar ES/EN, reapertura, repetición y cancelación antes y después de entrega.
- Cierre requerido: tutorial, help CLI/web, mcp/manifest.json, funcionalidades.json, llms.txt, ayuda del servidor MCP real, commit/push/despliegue, pruebas públicas y misión Yokup. Publicar capacidades como entregadas sólo después de esa verificación.

### IDs, recursos y fuentes para continuar

- Local/captura: `alsea-sbux-021` / `alsea-starbucks-360`. Pantallas: `starbucks-wall-01`…`starbucks-wall-06`, `starbucks-tpv-01`, `starbucks-ipad-01`; avatar `starbucks-avatar-wall`. P1…P6 visibles corresponden a wall-06…wall-01; mantener ese orden de mapping al etiquetar el tour.
- Cesta v1: `sessionStorage:xpaceos.pos-basket.v1:alsea-sbux-021:starbucks-tpv-01`. Reglas v3: `localStorage:xpaceos.xpl.retail.v1:alsea-sbux-021:starbucks-tpv-01`; lee v1/v2 y mantiene `xpl_rules`. Resumen: `localStorage:xpaceos.day-summary.v1`, ausencia=OFF. Persistencia aislada por dominio; la cesta además por pestaña.
- Eventos: `xpace:pos-basket` tras cambio aceptado, `xpace:retail-rules`, `xpace:retail-song`; presentación `data-pos-demo-phase` y `data-pos-demo-state` en `.matrix-panorama`.
- API local actual: `window.XpacePOSExperience.demo.start()`, `.stop()`, `.state()`; `.state()` añade `songTitle` al motor. `running` sólo cubre recorrido, `phase=checkout` puede seguir esperando medios. `song` es un indicador heredado de reacción activa, no prueba de canción audible; revisar DO individual.
- Fuentes: `admira-xp/scripts/pos-demo.mjs`, `matrix-pos-experience.mjs`, `pos-checkout-display.mjs`, `retail-rules.mjs`, `retail-rule-composer.mjs`, `retail-media-display.mjs`, `matrix-panorama.mjs`, `xtanco-visual-command.mjs`; `assets/expert-toggle.js`, `assets/day-summary.js`. `pos-demo-sound.mjs` es el adaptador usado por el reproductor de reglas para cada audio.
- Playlists fuente: `starbucks-playlist.mjs`, `starbucks-screens.mjs`, `starbucks-tpv.mjs`. Regenerar JSON con sus export scripts si cambian fuentes. Los JSON son semillas: tras gestión MCP prevalece `https://mcp.admira.store/matrix/starbucks`.
- MCP real: `https://mcp.admira.store/mcp`, repo `csilvasantin/xpaceos-mcp`, fuente `src/index.ts`. `help` con `topic="demo-catalog"` o `"xtore-continuity"` devuelve este contrato resumido; `"demo-tpv"`, `"ifthendothat"`, `"pos-muffin"`, `"expert-toggles-day-summary"`, `"advanced-icons-pos-checkout"` detallan cada función. `matrix_state` consulta programación; las escrituras requieren identidad propia y revisión vigente. No existe herramienta MCP para lanzar `/demo tpv` en un navegador remoto.
- Repositorios web: `csilvasantin/admira-store`, `csilvasantin/xpaceos`. Continuidad técnica de las implementaciones verificadas: commit `668e8a4 · iconos avanzados y compra TPV`, commit `b773fec · toggles y reacciones múltiples`, commit `ba6e25e · estado avatar en pared`. Misiones cerradas: `DCL-cda9379e2fa35630bf3e5b59 · iconos Matrix y compra TPV`, `DCL-a0128e306954834d12b413a4 · reglas múltiples y resumen optativo`. Consultar `/version.json` para versión pública actual, no inferirla de esos commits.

### Verificación, dependencias y pendientes

La última implementación fue comprobada públicamente en ESP/ENG: cinco iconos, Matrix tras elegir Good, cesta existente conservada, nueva entrega, café, edición y retirada de capa al vaciar; el vídeo anterior seguía reproduciéndose. Las reacciones simultáneas de locución y vídeo se verificaron en pared y TPV en la entrega anterior. Las cifras de catálogo varían: comprobar el índice actual, no fijar un total en el tour. Esta actualización documenta ese estado; no acredita nuevos recorridos automatizados.

La guía y los contratos estáticos responden públicamente en ambos dominios; tutorial y CLI de admira.store requieren sesión del perímetro si devuelven 401, y sus equivalentes públicos están en xpaceos.com. Las rutas interactivas de XpaceOS redirigen a admira.store conservando contexto. No eludir acceso ni credenciales. Pendientes: tour general y sus adaptadores, más productos/condiciones, reglas compartidas autenticadas, precios/cobro/inventario reales y conexión a TPV físico. No mezclar esos pendientes con lo entregado.

## English

### Delivered scope and entry

[Open Starbucks Matrix](https://www.admira.store/admira-xp/?marca=starbucks&loc=alsea-sbux-021&project=starbucks&circuit=alsea_starbucks&lang=es#tpv). Matrix is the default without explicit quality/visual. Explicit links and the selector keep their requested quality. Starbucks uses its imago and white wordmark. Options is left, Advanced right and Expert at the bottom; panels begin closed, ⌘ opens Expert. Retain the shared shell, extensions, CLI history, brand commands and Woz’s /avatarDigital integration when extending demos.

Delivered in this thread: Good · Admirito as the avatar default, site-language inheritance, direct wall conversation instead of the Starbucks website, and removal of the music/next icons above it; draggable muffin to the register; local basket with quantities and explicit coffee cross-selling; purchase shown on the mapped POS with Add coffee and Edit basket; guided `/demo tpv`; editable IF pickup/delivery followed by up to eight simultaneous DOs; Music, Voiceover, Image and Video from Pixeria with editable preset hashtags and the full catalogue; one or more visual destinations; compact editable DO summaries; single green/red ON/OFF toggles; readable Advanced SVG cards; end-of-day summary OFF by default and explicit persisted ON/OFF commands. Existing previews, receipts, media dragging, playlists, reset, language and brand functionality are retained. The Spanish table above links each bilingual feature guide.

### Presenting the automated demo today

1. Enter Starbucks Matrix, close layout/geometry editing, confirm the POS is powered on and wait for loading. Use a dedicated demo tab: each completed TPV run adds a muffin to that tab’s existing basket.
2. Open Expert and `/ifthendothat`. Choose pickup or delivery and existing Pixeria assets. For voiceover plus video add two DOs, using wall screens or iPad to show the video alongside the purchase. A nonempty purchase takes visual priority over ads and reactions on the POS only.
3. Start `/demo tpv` from a human CLI gesture. Media is primed there; do not autoplay on entry or bypass browser audio restrictions. Expert hides for the journey and can be reopened with ⌘.
4. Verify focus → outline → pickup → travel → drop → checkout → completed. Drop is nominally at 6.4 seconds in the camera timeline, not a guaranteed media/network completion time. Use `/demo status` for phase; completed alone proves neither audible audio nor every DO playing. Inspect each destination, readiness, paused state and advancing time; listen when audio is an acceptance criterion.
5. Stop demo, Escape or `/demo off` cancels. A concurrent run is rejected as busy. Cancelling before delivery adds nothing and restores the previous camera; stopping after delivery keeps the added muffin. A completed journey keeps the register view. Valid media can continue if another item fails; report each outcome separately.

The configured seed is Bad Times Deep House, Stock 1308, ID `1790706121644-y5mqrq`. Bad Day was the requested example but was not assigned because the initial lookup did not provide a valid reference. Resolve its actual Pixeria ID before replacing the seed.

### Current automation versus the next tour

The machine-readable [demo catalogue](https://www.xpaceos.com/admira-xp/demos/catalog.json) covers entry/brand, avatar, POS, coffee, four reaction types, nested DOs, multiple screens, playlists, Christmas, AI sync, media dragging, previews and optional summaries. Each recipe records preparation, current entry point, checks, effects and the missing adapter.

Only `/demo tpv` is the shipped guided camera/object journey. Christmas `/navidad on|off` and AI sync `/sincro ia` are existing playback modes, not annotated tours. Rules can be configured manually and triggered by the existing TPV journey. A general scenario selector, chained tour, pause/resume, per-step evidence and context restoration remain pending. `catalog.json` is documentation, not a runtime registry. `/demo tour`, `/demo lista`, `/demo pausa` and `/demo continuar` are proposed names, not executable commands or remote MCP tools.

### Implementation contract for the next agent

- Extend the local `xtanco-visual-command.mjs` dispatcher and existing controllers. No fixed pointer coordinates or synthetic events as the automation interface. One active run; execution ID and cancellation token must reject stale media promises.
- Versioned declarative recipes need stable ID, ES/EN title, context, prerequisites, resolved Stock references, camera targets, steps, assertions, effects and cleanup. Validate availability and report blocked/unavailable with the real reason.
- Proposed general runner states: idle, preparing, running, paused, completed, cancelled, error. Keep the current TPV engine’s phases. Pause/resume must pause clocks and media together and revalidate targets; do not merely restart a timeout.
- Prime media in a user gesture; retain audio policies, reference-counted music suppression and one audible video destination. Saving a rule or accepting an MCP write is not playback acknowledgement.
- Snapshot brand, language, quality, camera, panes, rule IDs/configuration, basket, playlists, preferences, media positions and summary. Use isolated temporary settings. Future tours must not overwrite user rules or empty the user basket; the current POS demo does add a muffin and needs a dedicated tab.
- Cleanup on Stop, Escape, pagehide, view change or failure: cancel work/frames, stop temporary media, remove layers, release suppression and restore affected context. `/reset` is not a substitute for a snapshot. Preserve receipts, history, preferences and remote state.
- Demonstrate existing Stock media. No incidental paid generation, physical writes, remote MCP mutations or Telegram messages. Generation must remain an explicitly chosen action under its session contract.
- Evidence per step uses actual DOM/controller state, visible destination, expected basket increment, real timestamp and revision, screenshot and acoustic checks where applicable. Test ES/EN, reopen, repeat and cancellation before/after delivery.
- Ship web help, CLI, tutorial, manifest/catalogue/llms, real MCP help, tests, commits, deployments, public verification and Yokup evidence before marking a new scenario delivered.

### Shared references and continuity

Venue/capture `alsea-sbux-021` / `alsea-starbucks-360`; virtual displays `starbucks-wall-01`…`06`, `starbucks-tpv-01`, `starbucks-ipad-01`; avatar `starbucks-avatar-wall`. Visible P1…P6 maps to wall-06…wall-01. Preserve calibrated geometry and user mappings.

Basket schema 1 uses `sessionStorage:xpaceos.pos-basket.v1:alsea-sbux-021:starbucks-tpv-01`. Rules schema 3 reads schemas 1/2 at `localStorage:xpaceos.xpl.retail.v1:alsea-sbux-021:starbucks-tpv-01`; legacy xpl_rules remains. Summary `localStorage:xpaceos.day-summary.v1` is OFF when absent. Browser/domain preferences are separate; basket is also tab-scoped.

Existing API `window.XpacePOSExperience.demo.start/stop/state`; state adds songTitle. running covers the journey; checkout can still await media. song is a legacy active-reaction indicator, not acoustic proof. Current events are xpace:pos-basket, xpace:retail-rules and xpace:retail-song; Matrix exposes data-pos-demo-phase and data-pos-demo-state. Sources and playlist exporters are listed in the Spanish reference section above and in the catalogue. pos-demo-sound.mjs is the per-audio adapter used by the rule player, not a separate demo transport.

The live MCP is https://mcp.admira.store/mcp, repository csilvasantin/xpaceos-mcp, src/index.ts. Call help with topic demo-catalog or xtore-continuity; detailed topics demo-tpv, ifthendothat, pos-muffin, expert-toggles-day-summary and advanced-icons-pos-checkout remain. matrix_state reads the live shared schedule; authenticated reviewed writes use a current revision. Static playlist JSON is bootstrap after a channel is managed. No remote MCP tool starts a browser’s `/demo tpv`.

Web repositories are csilvasantin/admira-store and csilvasantin/xpaceos; read /version.json for the current release. Prior verified changes and closed missions are named in the reference section. Public ESP/ENG acceptance covered icons, Matrix after a Good choice, preserved basket, new delivery, coffee, editing, empty purchase layer and continuing previous video. The previous release also checked concurrent voiceover/video on wall and POS. This documentation does not claim new automated tours or hardware integration.

Public guides and static contracts are accessible on both domains; admira.store tutorial/CLI may return 401 without its perimeter session, while xpaceos.com equivalents are public. Interactive XpaceOS routes redirect to admira.store preserving context. Do not bypass access. Remaining work: general tour and adapters, additional products/conditions, authenticated shared retail rules, real prices/payment/inventory and physical POS integration.

## Entrega concurrente que se conserva / Retained concurrent delivery

ES: Durante esta documentación, otro agente incorporó el quiosco de pedido del tótem: `/totem kiosko`, `/totem url <HTTPS>` y retorno `/totem off`, fuente `admira-xp/scripts/totem-kiosko.js`. Su ayuda original queda conservada. Es otro recorrido de pedido simulado, separado de la cesta del muffin Matrix; no fusionar sus órdenes ni anunciar conexión a TPV físico. Esta entrega documental no acredita una prueba nueva del quiosco o de su servicio externo; consultar la ayuda de su entrega y verificarlo antes de añadir un adaptador al tour.

EN: During this documentation release, another agent added the totem order kiosk: `/totem kiosko`, `/totem url <HTTPS>` and `/totem off` return, source `admira-xp/scripts/totem-kiosko.js`. Its original help is retained. This is a separate simulated order journey from the Matrix muffin basket; do not merge its orders or claim physical POS integration. This documentation does not certify a new kiosk/external-service test; consult its release help and verify it before adding a tour adapter.


## Ensayos locales de gestión / Local management rehearsals

ES: /demo help lista las cinco demos locales de Store: 1 locución, 2 música, 3 imágenes, 4 vídeo y 5 gestión del TPV (/demo caja). /demo auto o /demo todas las encadena con fases y resultados preparados; /demo pausa, /demo reanudar, /demo siguiente y /demo stop controlan el ensayo. /demo estado consulta el ensayo activo; sin ensayo activo consulta el TPV nativo. /demo tpv conserva el recorrido nativo del muffin, con estado y stop, sin pausa/reanudación. /demo studio, store, tv, app y biz abren las plataformas por nombre. No crea altas, ventas, emisiones físicas ni generación de pago.

EN: /demo help lists Store’s five local demos: 1 voiceover, 2 music, 3 images, 4 video and 5 POS management (/demo caja). /demo auto or /demo todas chains prepared phases and results; /demo pause, /demo resume, /demo next and /demo stop control the rehearsal. /demo status reads the active rehearsal; without one it reads the native POS journey. /demo tpv keeps the native muffin journey, with status and stop and without pause/resume. /demo studio, store, tv, app and biz open named platforms. No real registrations, sales, physical broadcasts or paid generation.

El tour general de todos los escenarios físicos sigue pendiente; sus propuestas anteriores de pausa/continuación no describen el motor local de gestión. / The general physical-scenario tour remains pending; its older pause/resume proposals do not describe the local management engine.

ES: La entrada `?ax_demo=store` en los dominios oficiales Store/XpaceOS carga el motor común también con la barra integrada del gemelo. Se renuevan los pins del shell y del cargador para evitar código retenido en caché; las visitas normales conservan su cargador. El recorrido opera la interfaz de ensayo, sin ventas ni emisión física.

EN: The `?ax_demo=store` entry on official Store/XpaceOS domains loads the shared engine with the twin’s inline toolbar too. Shell and loader pins are renewed to avoid cached code; normal visits keep their loader. The walkthrough operates the rehearsal interface, without sales or physical broadcasts.
