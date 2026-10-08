# Personas y robots · colisiones / People and robots · collisions

## Español

Good, Better y Best comparten la geometría física del Xpacio. Clientes, personal,
visitantes, ladrón, guardia, opinador y Unitree del interior respetan el perímetro,
las puertas, la arquitectura y los muebles. Los viandantes conservan su recorrido
exterior; una marca `outside` de un actor que entra no le permite cruzar la pared.
Matrix aplica el mismo mapa y cuerpo a sus actores heredados, conservando la
fotografía, la proyección y el contexto de la imagen.

La navegación comprueba el cuerpo completo y todo el segmento de cada paso. El
radio horizontal conservador es 0,72 casillas para humanos y 0,52 para Unitree;
la escala puede aumentarlo. Incluye manos, hombros, accesorios y la envolvente de
la animación Best. Cambiar Good/Better/Best no reduce ese espacio. Las huellas
incluyen los salientes de las mallas, el giro alrededor del origen, el espejo y
la escala de suelo; los registros del inventario no sustituyen la geometría.
Ocultar un mueble o filtrar el catálogo no elimina su dureza física.

Si el cuerpo no cabe por una puerta o un pasillo, espera. La ruta se recalcula
cuando cambia el mapa o se libera el paso. No se fuerza el cruce ni se da por
completada una entrada o salida en una posición del lado incorrecto. En Xtanco,
el tótem de la distribución original puede cerrar físicamente la entrada a un
cuerpo real: cambiar de calidad no lo convierte en un paso válido.

Al cargar una partida o colocar un mueble sobre un actor se recupera una posición
libre sin animar un cruce por el objeto. Un actor ya existente conserva el
componente accesible anterior, también si ha tenido que ocultarse temporalmente.
Si ese componente queda lleno, reaparece cuando vuelve a existir una posición
válida. La presentación 3D no escribe estados comerciales ni destinos del juego.

People está ON por defecto desde el 8-oct-2026: personal, clientes, viandantes y
personajes especiales caminan al abrir cualquier Xpacio (antes OFF hasta validar
estas durezas). `/gente on|off` = `/people on|off`,
`/personal on|off` = `/staff on|off` y `/clientes on|off` = `/customers on|off`
conservan identidades, personas, aforo y elecciones guardadas. Unitree mantiene
sus controles de simulación. La conexión con un robot físico, el stock real y
la telemetría IoT sigue pendiente; una colisión correcta del gemelo no verifica
esas conexiones.

Para comprobarlo: abre un Xpacio (las personas ya caminan), alterna
Good/Better/Best y observa sus recorridos; en Experto puedes dejar sólo un grupo.
En Mobiliario → Distribuir puedes mover un mueble editable; al cerrar el editor
se actualiza la navegación. Una distribución
cerrada produce espera, no una entrada o salida ficticia.

## English

Good, Better and Best share the Xpace's physical geometry. Interior customers,
staff, visitors, thief, guard, critic and Unitree respect the perimeter, doors,
architecture and furniture. Pavement passersby retain their exterior route;
an entering actor's `outside` flag does not permit crossing a wall.
Matrix applies the same map and body to its legacy actors while preserving the
photograph, projection and image context.

Navigation checks the complete body and every swept movement segment. The
conservative horizontal radius is 0.72 tiles for humans and 0.52 for Unitree;
scale can increase it. This includes hands, shoulders, accessories and the
Best animation envelope. Switching Good/Better/Best does not shrink that space.
Footprints include mesh overhangs, rotation about the origin, mirroring and floor
scale; inventory records do not replace physical geometry. Hiding furniture or
filtering the catalogue does not remove its physical collision bounds.

If the body cannot fit through a door or aisle, it waits. Routes are recalculated
when the map changes or the passage clears. No obstacle bypass or arrival on the
wrong side completes an entry or exit. Xtanco's original totem can physically
close its entrance to a full body; switching quality does not make it passable.

Loading a save or placing furniture over an actor recovers a free position
without animating a crossing through the object. An existing actor retains its
previous reachable component, including while temporarily hidden. If that
component is full, it reappears when a valid position becomes available. The 3D
presentation does not write the game's commercial states or destinations.

People is ON by default since 8 Oct 2026: staff, customers, passersby and special
characters walk as soon as any Xpace opens (previously OFF until these hardness maps
were validated). `/people on|off` = `/gente on|off`,
`/staff on|off` = `/personal on|off` and `/customers on|off` = `/clientes on|off`
retain identities, people, audience counts and saved choices. Unitree retains
its simulation controls. Connection to a physical robot, real stock and IoT
telemetry remains pending; correct twin collisions do not establish those links.

To check: open an Xpace (people already walk), switch Good/Better/Best and
observe their routes; in Expert you can keep a single group. Under Furniture →
Distribute, move an editable object; closing the editor updates navigation. A closed layout produces waiting, not
a fictional entry or exit.

## Contrato compartido / Shared contract

- `customer-navigation.mjs`: `ACTOR_BODY_RADIUS = .72`;
  `buildCustomerNavigation(scene, {radius, allowOutside})` returns `isWalkable`,
  `segmentClear`, `route` and `resolve`. It checks the full expanded solids,
  including arbitrarily long segments and diagonal corners.
- `scene.colliders`: `{id, minCol, maxCol, minRow, maxRow}` physical floor bounds;
  `scene.hardness.fixed`: existing Distribuir cells such as `"2,3"`.
  Furniture footprints remain a conservative additional envelope. Geometry,
  radius, door opening and vestibule depth participate in the navigation key.
- `resolve(point, {from, accept, strict})`: `from` requires a reachable
  correction; `accept` restricts it to the semantic destination region;
  `strict: true` requires the exact requested destination to be valid.
  A sealed entry cannot resolve its inside target to an outside waiting point.
  An exit requires an actual reachable exterior destination.
- `physical-colliders.mjs`: `actorCollisionRadius(actor)` supplies the same
  human/Unitree radius across qualities; `physicalColliders(scene)` includes
  architecture and transformed furniture mesh envelopes. Catalogue bounds live
  in `catalog-collision-bounds.mjs`, retaining existing asset and instance IDs.
- `customer-motion.mjs`: `createCustomerMotion` preserves source snapshots,
  follows collision-tested waypoint legs and keeps corner frames separate.
  It retains the old reachable component during recovery and rebases time
  without replaying hidden movement. Malformed observations stop pursuit.
- Native Good simulation and the Life renderer apply this map to every
  interior actor, including Unitree and special visitors. Frame guards prevent
  older scripted movement, separation or a restored position from bypassing
  the physical contract. Cafebrería currently supplies no moving actors;
  its imported architecture remains represented by physical bounds.
- `best-live-people.mjs` retains the legacy Matrix actor layer and applies the
  same physical collider/radius contract; its photographic projection and
  context remain available.
- No new remote-control MCP tool or Stock/IoT asset is created. The stable help
  topic is `actor-collision`; the shared help resource remains `xpaceos://help`.

## Comprobación / Validation

The collision bounds cover the 51 catalogue models in their three existing
qualities (153 GLBs) and Starbucks procedural fixture parts. Body tests measure
the animated Best meshes and all 24 visitor profiles, with the Unitree shell
checked separately. Navigation tests cover thin walls, rotated/scaled furniture,
diagonal corners, off-grid passages, sealed doors, invalid targets, temporary
map occupancy, safe recovery and motion after a map changes. Real native entry
and leave state tests reject false arrivals and exits. Older narrow-passage
algorithm fixtures explicitly use a small 0.24-tile body; they do not claim
that a rendered adult can fit through those passages.

Verification commands:

```sh
node --test admira-xp/scripts/customer-physical-navigation.test.mjs admira-xp/scripts/customer-navigation.test.mjs admira-xp/scripts/customer-motion.test.mjs admira-xp/scripts/customer-corridor.test.mjs admira-xp/scripts/physical-colliders.test.mjs admira-xp/scripts/robot-collision.test.mjs
```

Help ES/EN: `/admira-xp/help.html#actor-collision`, `/help/#actor-collision`,
`/help/cli/#actor-collision`, `/mcp/#actor-collision`. Real MCP help:
`https://mcp.admira.store/help`, topic `actor-collision`. Publication is checked
against the deployed implementation and real help endpoint for this release.
