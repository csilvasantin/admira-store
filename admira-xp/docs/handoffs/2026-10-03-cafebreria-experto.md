# handOFF · Admira.store / XpaceOS · 3 octubre 2026

Autor: OraculoMacMini · MacMini. Carlos pide parar: «handOFF y mañana más». No continuar cambios de interfaz ni operar Chrome durante este cierre.

## Lo primero al retomar

**Pendiente y no aceptado por Carlos: Cafebrería debe tener el mismo modo Experto que Starbucks y Xtanco.** El último mensaje de Carlos muestra una Cafebrería con la consola anterior (título MODO EXPERTO · CLI, log ancho y entrada de una línea) frente al menú nativo de tres columnas. La respuesta anterior que lo dio por terminado no resuelve esa discrepancia.

El 3-oct se publicaron tres columnas en el shell común y se verificaron en una pestaña nueva de Admira.store. Después Carlos volvió a mostrar la consola antigua. En la comprobación más reciente, el HTML público de www.admira.store, admira.store, www.xpaceos.com y xpaceos.com apuntaba a xpace-shell.js/css?v=20261003-expert-1 y contenía expertPanels. **No se ha identificado la causa de lo que ve Carlos.** Caché, una pestaña cargada antes de publicar o una ruta distinta son hipótesis, no diagnóstico confirmado.

Próximo paso: identificar la URL y el DOM de la Cafebrería que Carlos está usando y comparar su menú con el nativo de Starbucks/Xtanco. Verificar recursos efectivamente cargados, no solo el HTML recuperado desde otra pestaña. Conseguir igualdad visible y de comportamiento en esa ruta. No presentar una reproducción aproximada o una captura de otra pestaña como prueba suficiente.

La inspección de Chrome encontró una ventana con digitalsignage.ai y otra pestaña titulada XpaceOS.com; no se llegó a inspeccionar esta última. Chrome notificó un cambio del usuario; el turno fue interrumpido. No hubo corrección nueva después de la objeción. No mover ni redimensionar ventanas del Mac.

Capturas de Carlos:
- Cafebrería con consola antigua: /var/folders/1r/269mlqt92pq5lf_070_z32zc0000gn/T/codex-clipboard-7441ec58-be6b-49f3-bc19-8871f48494c0.png
- Referencia Starbucks/Xtanco: /var/folders/1r/269mlqt92pq5lf_070_z32zc0000gn/T/codex-clipboard-e65e5cf9-3589-4ae8-a83c-5ce9fcafa53b.png

## Estado publicado antes de este handOFF

- Admira.store: c41d16a5387dad7b22c556354b104691bad7c90b. Implementación: e0e2f85; c41d16a ajusta el sello de publicación.
- XpaceOS: 19b706542813007ff18b89a4bbb149572cfc5e3d. Implementación: a66eafa.
- MCP real: e94e54be3e575e253ea2e36493e2dfe168ebbaa6. Worker: f260161e-a9d4-48fe-acc9-0830b23de4c3.
- Cloudflare y GitHub Pages de ambos sitios terminaron success para esas revisiones.
- Esta nota generará un commit documental posterior; no cambia el runtime.

URLs:
- Cafebrería original: https://www.admira.store/xpacios/cafebreria/
- Espejo: https://www.xpaceos.com/xpacios/cafebreria/
- Xtanco de referencia: https://www.admira.store/admira-xp/?autostart=xtanco&from=portada&project=estancos&circuit=estancos&quality=better
- Inventario: https://www.xpaceos.com/inventario/?asset=2&quality=all#mostrador
- Librería reutilizable: https://www.xpaceos.com/inventario/?asset=51&quality=best#mostrador
- Guía actual: https://www.xpaceos.com/admira-xp/docs/expert-workspace.md
- Ayuda MCP: https://mcp.admira.store/help

## Implementación que hay que revisar

El menú nativo de Starbucks/Xtanco vive en admira-xp/index.html: telegramDock, telegramComposer, expertQuickIcons, expertCategoryDetail y telegramLastResponse. Sus iconos y separadores están en admira-xp/scripts/expert-categories.js/css y expert-dock.js. El shell común no sustituye el menú nativo cuando detecta su barra en línea.

El shell común usa assets/xpace-shell.js/css y assets/expert-workspace.mjs. Tiene xsExpert, xsCliForm, xsCli (textarea), xsLog y las doce categorías en el orden nativo. Usa los iconos y separadores del nativo. Configuración de Cafebrería en xpacios/cafebreria/index.html: expertCategories y expertPanels conectan editor, Inventario, ITIL y Pixeria con los nodos reales, sin clonarlos. El acoplamiento mueve el mismo nodo al centro; ↗ o cerrar Experto lo devuelve a su padre original. floating-window.mjs y panel-resize.mjs suspenden movimiento y redimensión flotantes mientras está acoplado.

Preservar:
- Historial CLI xpaceos_expert_history_v1 y /marca (/brand).
- /avatarDigital es la integración de Woz; no sustituirla.
- xpace_expert_columns_v1 comparte las proporciones de columnas; xpaceos_shell_size_v1:<panel> conserva tamaños.
- Mejora publicada por Morfeo en XpaceOS 7c80053, incorporada a esta implementación: los paneles se superponen y entran cerrados en cada carga; el cuerpo central no cambia de tamaño ni posición al abrirlos.
- Identidades, modelos, materiales, fichas y distribución guardada del Xpacio.

Cafebrería: cafe.mjs, cafe.css, grounding.mjs e inventory-panel.mjs. Escena original inventario/cafebreria/scene.glb; catálogo scene.inventory.json. La librería original y sus componentes forman parte del ITIL y el editor existentes. La escena tiene 96 fichas, 83 geometrías y 13 pendientes; no convertir pendientes en stock o modelos confirmados.

El desplegable de proyectos ya se corrigió: project-selector.mjs y central-project-client.mjs, sello cafebreria-route-3. Solo demo-cafebreria del proyecto/circuito cafebreria dirige al Xpacio original. El temporizador conserva las opciones mientras se abre el menú nativo; la caducidad de sesiones sigue retirando proyectos autorizados. No revertirlo.

## Verificaciones realizadas y sus límites

Pruebas correctas: Expert compartido, identidad/transferencia/restauración de herramientas, cierre y desacoplamiento, guardas de geometría flotante, editor Distribuir, inventario de Cafebrería, selector de proyectos, marca/CLI y contratos ES/EN. Guardián tests/shell-cuadratico.test.mjs actualizado: Cafebrería real usa el shell; inventario/cafebreria/index.html es el redirect.

Comandos relevantes:

    node --test assets/expert-workspace.test.mjs tests/shell-cuadratico.test.mjs mcp/quadratic-resize.test.mjs admira-xp/scripts/floating-panels.test.mjs
    node --test admira-xp/scripts/distribuit.test.mjs admira-xp/scripts/distribuit-objects.test.mjs admira-xp/scripts/distribuit-docs.test.mjs xpacios/cafebreria/editor.test.mjs xpacios/cafebreria/canonical-entry.test.mjs admira-xp/scripts/project-selector.test.mjs

MCP: expert-workspace-help.test.mjs, quadratic-resize-help.test.mjs y consultas reales GET /help y tools/call help. 22 recursos públicos se compararon byte a byte con el checkout, y se verificaron páginas café/ayuda de ambos sitios. Navegador: editor acoplado, Inventario→ITIL, desacoplar/cerrar, Enter CLI, tamaño del dock y columnas; inglés en Cafebrería. Esto confirma esas pestañas de prueba, **no explica la consola antigua de la captura de Carlos**.

Captura de la pestaña pública probada:
/Users/csilvasantin/.codex/visualizations/2026/10/02/01a0fde7-1cbc-7822-8467-ec906b89d881/cafebreria-experto-starbucks-20261003.jpg

Verificador reutilizable: /tmp/verify-expert-public.py. El servidor local propio 8879 fue cerrado; no tocar el servidor preexistente 8765.

## Workspaces y cierre operativo

- Checkout principal: /Users/csilvasantin/Documents/ChatGPT/admira.store, rama codex/itil-inventory-link, origin csilvasantin/admira-store.
- Espejo: /tmp/itil-xpaceos, origin csilvasantin/xpaceos.
- MCP: /tmp/itil-xpaceos-mcp, origin csilvasantin/xpaceos-mcp.
- Los tres estaban limpios al preparar esta nota. Fetch antes de editar: puede haber trabajo de otros agentes. No sobreescribir sus cambios.
- AGENTS.md exige ayuda web, tutorial, CLI, manifiestos y MCP real ES/EN para cada implementación; commit, push, despliegue y verificación pública. Carlos autoriza publicar sin reconfirmación.
- Yokup: DCL-9ac4e7781dec778d5fee8eb4, Hoy #49, quedó resolved con a/b/c done y owner OraculoMacMini después de las pruebas técnicas. La objeción posterior de Carlos significa que la igualdad del menú **sigue pendiente de aceptación y diagnóstico**; no usar ese cierre como prueba de resolución del problema actual.
- Desplegable anterior: DCL-2cbf85cf088cd8fdb92382f7, resuelto.
- No hay automatización para mañana ni un objetivo en segundo plano. Esperar a Carlos.

## English continuation note

Carlos stopped work and requested this handoff. His latest screenshots show the old single-column Cafebrería CLI versus the native Starbucks/Xtanco three-column Expert panel. A common three-column implementation was deployed and verified in separate tabs, but the cause of his old UI is unresolved. Start by inspecting the actual URL, DOM and loaded resources he uses, then ensure visible and behavioral parity with the native Expert panel. Do not assume cache is the cause or report the task complete from a different test tab. Preserve the recent overlay/closed-on-entry behavior, existing CLI history, white label, Woz avatar integration and all scene/inventory identities. No further work until he resumes.
