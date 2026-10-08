# handOFF · Sneakers Store y demo global · 9 octubre 2026

Autor: OraculoMacMini · Codex · MacMini. Carlos: «handoff hasta mañana». Detener trabajo y esperar a que Carlos retome. No programar automatizaciones ni continuar en segundo plano.

## Resultado publicado

- Demo global: https://www.admira.biz/demo/?lang=es . Proyecto `sneakers-store`, circuito `sneakerstore`, Xpacio `sneakers-store-santa-rosa-19`, Carrer de Santa Rosa 19, Barcelona. Alta/gestión reales; recorrido Proyecto → Xpacio → Playlist → Gemelo → Cámara y guía. Gmail y cuenta corporativa de Carlos tienen gestión de catálogo verificada; no se amplió control de hardware.
- Gemelo: https://www.admira.store/xpacios/sneakerstore/ . Recorrido 360 con las fotografías originales IEU Entrada/Centro/Fondo y planta 3D editable; shell común Opciones izquierda, Avanzado derecha, Experto abajo.
- Pared Jordan + LCD: https://www.admira.store/xpacios/sneakerstore/?view=jordan&lang=es . Mirando esa pared: Jordan de cinco paneles a la izquierda, LCD gigante a su derecha. Jordan es una captura original IEU, no vídeo vivo.
- Fondo LED: https://www.admira.store/xpacios/sneakerstore/?view=rear&lang=es . LED continuo con puerta central independiente y oscura; mesa de caja pegada a la pared derecha mirando desde la entrada. LED y LCD comparten el canal horizontal, sin estirar ni espejar el vídeo. Botón Fondo LED y acceso Avanzado disponibles en ES/EN.
- Playlist horizontal: `playlist-be8a1e99-1cce-4818-a796-da3372216d1e`, revisión 2, Stock 665 (1280×720). Playlist vertical: `playlist-cadea3fa-89fe-40f9-828f-bd37ce4720db`, revisión 1, Stock 990 (1080×1920) y 964 (360×640). Tags orientación/ratio completados en Pixeria real sin borrar tags anteriores. Preparar playlists por formato conserva IDs y valida tags; el player comprueba además dimensiones decodificadas y bloquea formatos incompatibles/desconocidos/contradictorios.
- Layout `rear-led-door-v5`: respaldo del estado anterior y corrección sólo de mesa en posición predeterminada; conserva movimientos explícitos, fichas, bloqueos, visibilidad, borrados e historial. Convención puerta→fondo: derecha x=0, izquierda x=4, puerta z=0, fondo z=14. Tapa de mesa llega a x=0. Proporciones interpretativas, sin medición física.

## Versiones, repositorios y contratos

- Store: `/Users/csilvasantin/Documents/ChatGPT/admira.store`, `main`, limpio al handoff. `7ca870c` · fondo LED puerta y mesa; `cecd979` · etiquetas predeterminadas del inventario; `19f649a` · vídeo sin espejo y puerta lisa; `b96fc4f` · prueba geométrica y ayuda; `5705f37` · sello final del fondo. Release `v.09.10.2026.r4.00:12`; Cloudflare https://18fd411a.admira-store.pages.dev . Este handoff añade después un commit documental sin despliegue funcional nuevo.
- Biz: `/private/tmp/sneakers-biz-20261008`, repo `csilvasantin/clearchannel-tv`, `main`, limpio. `2f32976` · tutorial del fondo real. Release `v.09.10.2026.r2.00:09`; https://d77db746.clearchannel-tv.pages.dev . No borrar el checkout temporal antes de revisar si aún hace falta; todo el código está en origin/main.
- MCP real: `/private/tmp/xpaceos-mcp-xtore-demo-20261008`, repo `csilvasantin/xpaceos-mcp`, `main`, limpio. `6934020` · contrato LED puerta y mesa; versión `2.12.89`; Worker `1d505a1f-2bcf-416d-8e94-85ffe0cc6e0b` · ayuda del fondo publicada. https://mcp.admira.store/help . El checkout habitual `~/Claude/repos/xpaceos-mcp` no se actualizó; hacer fetch/pull antes de usarlo.
- Contrato canónico: https://www.admira.store/xpacios/sneakerstore/contract.json . Referencia fotográfica y hashes: `xpacios/sneakerstore/reference.json`. Guía: https://www.admira.store/admira-xp/docs/demo-global.md y https://www.admira.biz/docs/demo-global.md . MCP catálogo/manifiesto y ayuda web/tutorial/CLI actualizados en ES/EN.
- Estado público horizontal: https://www.admira.biz/api/demo-global?project=sneakers-store&channel=horizontal . Vertical: https://www.admira.biz/api/demo-global?project=sneakers-store&channel=vertical . Ninguna respuesta/exportación contiene credenciales de edición.

## Verificaciones y evidencia

- Publicación Store comprobada visualmente ES/EN: LED con hueco de puerta y mesa a la derecha; vídeo horizontal 1280×720 reproduciendo. Módulos `scene.mjs`, `store.mjs` y `layout-reference.mjs` con query `rear-8` coincidieron byte a byte con fuente. Sello público r4 confirmado. Consola EN sin errores.
- 13 pruebas focalizadas de importación, formatos y migración pasadas; tras cambio de etiquetas, 7 pruebas de migración pasadas. Prueba geométrica adicional pasada: UV sin espejo, proporción, hueco de puerta, mesa contra pared y rechazo del vídeo vertical en LED. Grupos solapados: no sumarlos como pruebas distintas.
- Formatos anteriores: 4 pruebas Biz y 9 pruebas MCP pasadas. Preparación real verificada con sesión renovada Gmail; tags consultados de nuevo por MCP público.
- Evidencia durable: [captura pública del fondo](2026-10-09-sneakerstore-rear.png). Copia remota: https://api.yokup.com/media/fleet/75e5f24c1ef8e57e.jpeg . La pestaña de Carlos quedó en Fondo LED. Servidor local temporal 9138 apagado; no trabajo en segundo plano programado.
- Yokup cerrado canónicamente: `FLT-101737` · pared Jordan y LCD; `FLT-101738` · formatos y tags Pixeria; `FLT-101741` · LED puerta y mesa. Última misión confirmó `resolved`, `has_report=true`, tareas a/b/c/z1 done e `inbox_updated=true`. No reabrir estas misiones para enviar otro informe.

## Pendientes y continuación

1. Esperar el siguiente mensaje de Carlos. No comenzar automáticamente mañana ni ejecutar rutina de cerrar el día: no la ha solicitado aquí.
2. La apertura/preparación automática de IEU sigue pendiente de su equipo. Flujo operativo actual: abrir IEU → Store → Entrada → Puerta Cam → Ver stream; volver a Xtore, compartir pestaña y marcar dos puntos. El permiso de compartir depende del navegador. No anunciar autopreparación completa.
3. La geometría 3D sigue siendo aproximada; contrastar nuevas correcciones con las panorámicas originales y Carlos. Las pantallas dentro de fotografías conservan la captura; Jordan no tiene playlist viva. iPad y LED estrecho siguen referencias gráficas; los players activos son LCD, LED del fondo y pantalla vertical de entrada.
4. Reutilizar la guía y las playlists por formato para el siguiente proyecto; no duplicar proyecto/local, borrar tags ni reiniciar el mobiliario guardado. La regla nueva cubre SneakerStore y su preparación; no afirmar que se ha modificado toda la flota de players Admira.
5. Rutas preexistentes: `/help/index.html` y `/help/cli/index.html` de Store requieren sesión; ayuda web normal redirige de `/admira-xp/help.html` a `/admira-xp/help`. `/mcp` de Biz conserva puerta legacy. Contratos operativos están en Store y MCP real. No eludir ni ampliar permisos para comprobar rutas.
6. Si una sesión migrada durante las publicaciones intermedias conserva una etiqueta antigua de inventario («mural»), verificar su metadata sin resetear posiciones: el guard de v5 evita repetir la migración. Es diagnóstico por comprobar, no un fallo visual confirmado del fondo publicado.
7. Aparecieron ajustes compatibles en paralelo durante la entrega (puerta lisa, UV y prueba geométrica); fueron revisados, conservados e integrados. Comprobar `git status` y `origin/main` al retomar antes de tocar archivos.

## English continuation

Stop until Carlos resumes; no background work or scheduled wake-up. Sneakers Store, project/venue and global walkthrough are published. Rear LED has a separate central dark door and checkout table flush to the right wall from the entrance. LCD and rear LED share validated landscape content; entrance has a separate portrait playlist. Pixeria tags and decoded dimensions guard playback. Jordan remains an IEU still. Layout migration preserves explicit edits and history. Public ES/EN UI, contracts, live MCP help and focused tests were checked; geometry still awaits measurements. Automatic IEU camera preparation requires the external team; current tab sharing/crop remains manual. Three related Yokup missions are resolved. Previous handoff: [Admirito Good, 6 October](2026-10-06-admirito-good.md).
