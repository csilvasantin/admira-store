# Comprobar paso / Check passage

## Español

Distribuir permite comprobar si cabe una Persona o el robot Unitree desde la entrada del Xpacio hasta la zona de acceso del mueble seleccionado. Sin selección, comprueba el acceso al centro del espacio. Usa el mismo mapa físico que las colisiones de Good, Better y Best: paredes, arquitectura, durezas fijas, huellas transformadas y salientes de las mallas. El radio conservador es de 0,72 celdas para Persona y 0,52 para Unitree; la comprobación incluye el cuerpo completo en cada tramo y curva.

1. Abre el Xpacio en Good, Better o Best y entra en Experto → Mobiliario → Distribuir, o ejecuta `/cli distribuir`. El editor común abre Better · 16 bits y conserva sus funciones de edición.
2. Selecciona un mueble, o deja la selección vacía para comprobar el centro.
3. En Comprobar paso, elige Persona o Unitree en Cuerpo y pulsa Comprobar.
4. Consulta Paso libre o Paso bloqueado, con radio y destino. Activa Ver mapa de dureza para ver la ruta completa y su volumen, origen azul, destino verde y bloqueadores naranja. Si está bloqueado, pulsa Seleccionar junto a un mueble bloqueador para editarlo: el destino comprobado se conserva. La lista muestra bloqueos implicados suficientes para explicar la falta de ruta; no promete un conjunto mínimo global. Un elemento de arquitectura fijo se identifica sin convertirlo en editable.
5. Si decides modificar la distribución, el diagnóstico se recalcula con la vista previa válida de mover, girar o escalar y tras guardar, bloquear, eliminar, añadir o Deshacer, también si cambia la geometría del espacio. Una vista previa inválida conserva la última pose válida. Una comprobación bloqueada no mueve ningún mueble automáticamente. Cerrar el editor limpia el diagnóstico.

El resultado indica que la puerta se considera **abierta virtualmente**. Esto comprueba la distribución con la entrada abierta; no abre la puerta real del gemelo, no comprueba su barrido de apertura y no acredita que la puerta cerrada permita pasar. La ruta libre debe cubrir entrada y destino completos; no basta un tramo parcial o un punto próximo al destino.

Comprobar paso sólo diagnostica: no mueve personas ni robots, no activa People, no guarda la distribución y no modifica fichas ITIL, identidades, datos, marca ni historial CLI. Los movimientos que se hagan después siguen usando las validaciones, guardado local y Deshacer existentes de Distribuir. Los radios no se reducen para obtener un resultado libre.

Cafebrería conserva sus paredes y su inventario importados, pero todavía no tiene un portal operativo de entrada definido para este diagnóstico. Muestra que la comprobación no está disponible; no inventa una entrada ni presenta un resultado libre. Las distribuciones interpretativas de los demás Xpacios tampoco son una medición del local físico.

**Implementado A:** diagnóstico local de paso Persona/Unitree, ruta o bloqueo, selección de muebles bloqueadores y recálculo del editor, con ayuda en castellano e inglés. **Pendientes B y C:** Mostrar ITIL en escena e IoT piloto. Tampoco se añade vinculación con robots físicos, stock real o telemetría IoT.

## English

Distribute checks whether a Person or the Unitree robot can fit from the Xpace entrance to the access area of the selected furniture item. With no selection, it checks access to the centre of the room. It uses the same physical map as collisions in Good, Better and Best: walls, architecture, fixed hardness, transformed footprints and mesh overhangs. The conservative radius is 0.72 tiles for Person and 0.52 for Unitree; every movement segment and bend includes the entire body.

1. Open the Xpace in Good, Better or Best and enter Expert → Furniture → Distribute, or run `/cli distribute`. The shared editor opens Better · 16 bits and retains its editing functions.
2. Select furniture, or leave selection empty to check the centre.
3. Under Check passage, choose Person or Unitree in Body and press Check.
4. Read Passage clear or Passage blocked, with radius and destination. Enable Show hardness map for the complete route and its volume, blue origin, green destination and orange blockers. If blocked, press Select next to a furniture blocker to edit it: the checked destination is retained. The list shows implicated blockers sufficient to explain the missing route; it does not promise a globally minimum set. Fixed architecture is identified without making it editable.
5. If you choose to edit the layout, the diagnostic recomputes during valid move, rotate or scale previews and after save, lock, delete, add or Undo, including external geometry changes. An invalid preview retains the last valid pose. A blocked check never moves furniture automatically. Closing the editor clears the diagnostic.

The result states that the door is **virtually open**. This checks the layout with an open entrance; it does not open the twin's actual door, check its opening sweep or establish passage through a closed door. A clear route must cover both the complete entry and destination; a partial route or a nearby point is insufficient.

Check passage only diagnoses: it does not move people or robots, enable People, save the layout or change ITIL records, identities, data, brand or CLI history. Subsequent edits retain Distribute's existing validation, browser-local saves and Undo. Body radii are never reduced to obtain a clear result.

Cafebrería retains its imported walls and inventory, but has no operational entrance portal defined for this diagnostic yet. It reports the check as unavailable; it does not invent an entrance or show a clear result. The other Xpaces' interpretive layouts are not a physical venue survey either.

**Delivered A:** local Person/Unitree passage diagnostic, route or blockage, furniture-blocker selection and editor recomputation, with Spanish and English help. **Pending B and C:** Show ITIL in scene and an IoT pilot. This also adds no binding to physical robots, real stock or IoT telemetry.

## Contrato compartido / Shared contract

- Guide / Guía: https://www.xpaceos.com/admira-xp/docs/check-passage.md
- Tutorial ES/EN: https://www.xpaceos.com/help/#check-passage
- CLI entry / Entrada CLI: existing `/cli distribuir`, `/cli distribute` and legacy `/cli distribuit`; the check is a control within the editor, not a new remote command.
- MCP 2.12.29: existing `help({"topic":"check-passage"})` or `help({"topic":"comprobar-paso"})`, and resource `xpaceos://help`. The existing 35 tools and resource IDs remain unchanged. Public human help: https://mcp.admira.store/help
- Editor: Better; entry from Good/Better/Best. Physics: shared navigation and physical colliders, human radius 0.72 and Unitree radius 0.52 tiles.
- Scope: current Xpace and current layout/preview; existing stable furniture IDs. No physical-device action, scene mutation, remote layout write or new MCP tool.
- Result: clear only with a complete swept-body route; blocked with identified causal obstacles; unavailable without an operational entrance portal. Door pose is open only in the diagnostic's copied scene.
- Selected furniture: approach points lie outside the union of its physical bounds, with the body radius plus 0.05 tiles of approach margin. The route ends outside the solid object. If the room centre is occupied, the nearest free centre point is chosen independently of the entrance's reachable component; a closed partition cannot move the destination to the starting side and produce a false clear result.
- Source: `admira-xp/scripts/passage-diagnostic.mjs` exports the read-only `diagnosePassage(scene, {actor:'human'|'unitree', targetId})`; it reuses `customer-navigation.mjs` and `physical-colliders.mjs`. `distribuit-ui.mjs` supplies the current draft and `passage-overlay.mjs` presents the result. These are local browser modules, not remote MCP tools.
- Result fields: `status`, `reason`, `actor`, `radius`, `origin`, `target`, `targetId`, `route`, `blockers`, `navigationKey`, `doorMode:'open'`, `actualDoorOpen`. Coordinates use `{col,row}`; blocker identities retain the existing `itemId`, or an architecture/hardness/boundary ID. Machine IDs are not translated; presentation labels are bilingual.
- Reasons: `clear`; `obstructed` or `boundary_blocked` for blocked routes; `entrance_unconfigured`, `invalid_scene`, `invalid_actor`, `invalid_origin`, `invalid_target`, `target_missing` or `target_unavailable` when unavailable. Imported scenes require a configured `passageEntrance`; Cafebrería currently has none.
- Pending: B Show ITIL in scene; C IoT pilot; physical robot/IoT binding and measured venue geometry.

## Verificación / Verification

Automated contracts check both language/topic aliases, stable help links, tool count, scope and the distinction between delivered A and pending B/C. Physical diagnostic tests cover complete routes, body-width bottlenecks, selected furniture and unavailable entrance portals. Browser verification uses the existing Distribuir editor, its previews and Undo; a clear result remains a virtual layout diagnostic.
