# idIoT · nombre único de cada elemento IoT / unique IoT element name

Carlos, 7-oct-2026: cada elemento IoT dado de alta en un Xpacio de un Proyecto necesita un nombre único para
identificarlo y agruparlo. Formato: **`Proyecto_Xpacio_Tipo_n`** → `Starbucks_PaseodeGracia_103_Pantalla_1`.

ES: En ⌘ Experto, /inventario idIoT enseña el nombre único de cada elemento IoT dado de alta: Proyecto_Xpacio_Tipo_n, por ejemplo Starbucks_PaseodeGracia_103_Pantalla_1. El prefijo agrupa: «Starbucks_» es el proyecto y «Starbucks_PaseodeGracia_103_» el Xpacio. Sin argumento lista el Xpacio abierto; /inventario idIoT starbucks lista un proyecto (vale su nombre, un alias, un id de Xpacio como alsea-sbux-021 o cualquier texto del nombre); /inventario idIoT proyectos resume la red con Xpacios y elementos por proyecto; añadir «csv» al final descarga la lista completa. El Xpacio se nombra por calle y número; si la ficha no trae calle, por su nombre, y si dos centros coincidieran, por su número del catálogo: nunca hay dos idIoT iguales. Cada tipo se numera aparte (Pantalla, Escaparate, TPV, iPad, Altavoz, LED, Tablet, Mupi…). Cada línea dice qué elemento es, su código ITIL si lo tiene y el player vinculado, o «sin player vinculado». El Starbucks de Paseo de Gracia 103 usa su registro del gemelo: pantallas 1–6 de la pared, TPV, iPad y altavoz. El resto usa las superficies del catálogo de Xpacios. Una escena de demostración sin Xpacio del catálogo nombra el IoT de su inventario local y lo avisa. /marca limita lo que se ve al cliente activo. Los nombres están guardados en la ficha de cada Xpacio del catálogo central y ya no cambian aunque cambie su dirección o el orden de sus pantallas; un equipo nuevo recibe su nombre solo al darse de alta, con el proyecto que se elija allí. admira.tv los acepta como destino de una playlist. No cambian nada en equipos físicos.

EN: In ⌘ Expert, /inventario idIoT shows the unique name of every registered IoT element: Project_Xpace_Type_n, for example Starbucks_PaseodeGracia_103_Pantalla_1. The prefix groups: “Starbucks_” is the project and “Starbucks_PaseodeGracia_103_” the Xpace. With no argument it lists the open Xpace; /inventario idIoT starbucks lists a project (its name, an alias, an Xpace id such as alsea-sbux-021 or any text of the name); /inventario idIoT proyectos summarises the network with Xpaces and elements per project; appending “csv” downloads the full list. The Xpace is named after street and number; without a street, after its name, and if two venues would match, after its registry number: no two idIoT are ever equal. Each type is numbered separately (Pantalla, Escaparate, TPV, iPad, Altavoz, LED, Tablet, Mupi…). Each line states which element it is, its ITIL code when it has one and the bound player, or “no player bound”. Starbucks Paseo de Gracia 103 uses its twin registry: wall screens 1–6, POS, iPad and speaker. Every other Xpace uses the surfaces of the Xpace registry. A demo scene with no registry Xpace names the IoT of its local inventory and says so. /marca limits the view to the active client. Names are stored in each Xpace record of the central registry and no longer change when its address or screen order changes; a new device gets its name automatically when it is registered, under the project chosen there. admira.tv accepts them as a playlist destination. They change nothing on physical devices.

## Comandos / Commands (⌘ Experto · admira.store y xpaceos.com)

| Comando | Qué enseña / What it shows |
|---|---|
| `/inventario idIoT` | El Xpacio abierto / the open Xpace |
| `/inventario idIoT starbucks` | Un proyecto: nombre, alias o circuito / a project by name, alias or circuit |
| `/inventario idIoT alsea-sbux-021` | Un Xpacio por su id del catálogo / one Xpace by registry id |
| `/inventario idIoT PaseodeGracia` | Cualquier texto del idIoT, del nombre o de la dirección / any text |
| `/inventario idIoT proyectos` | Resumen de la red por proyecto / network summary per project |
| `… csv` | Descarga la selección completa / downloads the whole selection |

También se aceptan `/inventory idIoT`, `id-iot` e `id iot`. La consola enseña hasta 60 elementos y dice cuántos faltan.

## Cómo se forma el nombre / How the name is built

1. **Proyecto**: el que declara la ficha en `project` (lo elige quien da de alta el equipo en admira.tv/alta: uno
   del catálogo o uno escrito a mano); si no declara, el del circuito del Xpacio (`alsea_starbucks` → Starbucks); si no tiene circuito, el que indique su id
   (`bbva-0001-…` → BBVA) o su marca; lo que nadie reclama queda en `SinProyecto`.
2. **Xpacio**: calle y número de su dirección (`Paseo de Gracia 103` → `PaseodeGracia_103`); sin calle, su nombre sin la
   marca; sin nada útil, su número del catálogo. Si dos Xpacios del mismo proyecto coincidieran, se añade el número de
   su ficha. Sin tildes, espacios ni signos.
3. **Tipo**: Pantalla, Escaparate, Taquilla, Mostrador, PWA, Cajero, Audio, Altavoz, Totem, Vending, Robot (catálogo);
   LED, Pantalla, Mupi, Tablet, Aroma, Audio, Turnos, iPad, TPV (inventario del gemelo).
4. **n**: orden dentro del tipo en ese Xpacio. En la pared de Starbucks manda el número real de la pantalla (1–6).

## Fuente por Xpacio / Source per Xpace

Una sola, siempre la misma, para que un idIoT no nombre dos cosas según desde dónde se pregunte:

- **Starbucks Paseo de Gracia 103** (`alsea-sbux-021`): su registro del gemelo — `starbucks-screens.mjs`,
  `starbucks-tpv.mjs`, `starbucks-ipad.mjs` y el altavoz. Nueve elementos.
- **Cualquier otro Xpacio del catálogo** (`https://api.admira.store/da/locations`): sus `surfaces`.
- **Escena de demostración sin Xpacio del catálogo**: el IoT colocado en su inventario local; el comando lo avisa.

## Contrato para agentes / Agent contract

- Módulo puro / pure module: `https://www.xpaceos.com/inventario/idiot.mjs` — `buildIdIot({locations, projects, twin})`,
  `projectOf`, `xpaceLabel`, `uniqueXpaceLabels`, `nameElements`, `selectRows`, `toCsv`.
- Cada fila / each row: `idIoT, project, projectId, xpaceId, xpaceName, addr, type, n, name, code, player, source`.
- `xpaceId` es el id del catálogo: el mismo que usa admira.tv como destino de playlist (`xpacio:<id>`).

## Guardado en la ficha / Stored in the record

Desde el 7-oct-2026 el idIoT **se guarda** en el catálogo central de Xpacios (worker `omnipublicity-api`):

- `surfaces[i].idIoT` en cada superficie; en Starbucks Paseo de Gracia 103, `iot[]` con sus nueve elementos
  (`idIoT, type, n, name, instance, code, player`).
- Leer / read: `GET https://api.admira.store/locations/<id>`.
- Resolver un nombre / resolve a name: `GET https://api.admira.store/locations/iot/<idIoT>` →
  `{idIoT, element, location:{id,name,addr,circuit,brand}}`. No distingue mayúsculas.
- Guardar / write: `POST https://brain.digitalavatar.ai/locations/iot` con credencial (`Authorization: Bearer`),
  cuerpo `{names:{<id>:{surfaces:[idIoT|null…]}|{iot:[…]}}}`. Sólo **añade** nombres: no toca ningún otro campo de
  la ficha, no cambia un nombre ya guardado (salvo `force`) y rechaza el lote entero si dejara dos idIoT iguales.
- Herramienta / tool: `node inventario/tools/idiot-guardar.mjs` (ensayo) · `--aplicar` con `OMNIP_ADMIN_TOKEN`.
- El nombre guardado manda sobre el calculado. Volver a registrar un equipo conserva el idIoT de su pantalla.
- **El alta pone el nombre sola / registration names it automatically**: `POST /locations/register` (la página
  admira.tv/alta) devuelve el `idIoT` del equipo, lo guarda en su ficha y su enlace de canal ya lo declara (`&iot=`).
  Publicar el catálogo (`PUT /locations`) nombra las superficies nuevas y conserva los nombres guardados aunque
  llegue una copia vieja. El worker usa la misma regla que este módulo (su `src/idiot.js` es una copia: si cambias
  `inventario/idiot.mjs`, ejecuta allí `node tools/sync-idiot.mjs <ruta a xpaceos>` y despliega).

## Estado / Status

Entregado / delivered: comando, búsqueda, resumen y CSV; **24.885 nombres guardados en 9.119 fichas**, ninguno
repetido, sin tocar ningún otro campo (catálogo comparado antes y después). admira.tv acepta el idIoT como destino de
pantalla. Pruebas: `inventario/idiot.test.mjs`.

Pendiente / pending: ningún elemento del Starbucks de Pg. Gràcia 103 tiene player real vinculado. No hay herramienta MCP propia: los agentes
importan el módulo o leen la ficha.
