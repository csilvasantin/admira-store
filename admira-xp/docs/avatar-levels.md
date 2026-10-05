# Avatar · good, better y best / Avatar levels

Estado: implementado en el shell común de admira.store (4-oct-2026). El cargador vive en admiranext.com. No añade herramienta MCP.

Implemented in the admira.store common shell (4 Oct 2026). The loader lives on admiranext.com. No new MCP tool.

## Uso / Use

En ⌘ Experto, en cualquier página:

| Orden | Efecto |
|---|---|
| `/avatar good` | Abre el calvo (cara 3D, 52 blendshapes). |
| `/avatar better` | Abre la chica (Ready Player Me, gafas). |
| `/avatar best` | Abre a Neo (MetaHuman). Si el host de render está apagado, entra la chica. |
| `/avatar` | Dice el estado. No cambia de cara. |
| `/avatarON` / `/avatarOFF` | Muestra u oculta el avatar y lo recuerda en este sitio. |
| `/avatar reset` | Vuelve al interruptor del proyecto. |
| `/cli` | Como en admira.app: dice el estado del avatar. `/cli good`, `/cli better` y `/cli best` abren ese nivel. `/cli ayudante [on\|off]` sigue igual; el resto de `/cli <orden>` va al gemelo. |

`/help` lista estas órdenes. Alias: `/avatarDigital`, `/digitalAvatar`, `/cli ayudante`, `/cli helper`.

In ⌘ Expert, on any page: `/avatar good` opens the bald 3D face, `/avatar better` opens the girl (Ready Player Me, glasses) and `/avatar best` opens Neo (MetaHuman; if the render host is off, the girl takes over). `/avatar` alone shows the status. `/avatarON` and `/avatarOFF` show or hide it. `/avatar reset` follows the project switch. `/help` lists them.

`/cli` alone shows the avatar status, as on admira.app; `/cli good|better|best` opens that level. Other `/cli <command>` orders still go to the twin.

El ⌘ Experto lleva la piel común de la suite (`experto.css/js` de admiranext.com, look digitalavatar.ai). Entra minimizado: sólo la línea `› /help`, escribible, con un asa encima para abrir. Una orden escrita en minimizado lo abre para enseñar la respuesta. Las tres columnas nativas quedan detrás de «＋ vista».

## Contrato / Contract

- Estas órdenes se quedan en el avatar. No se guardan en `xpaceos_expert_pending_v1` y no abren el gemelo.
- `good`, `better` y `best` sueltos siguen siendo las vistas del gemelo y sí viajan a `/admira-xp/`.
- Cargador: `https://www.admiranext.com/assets/avatar.js?v=20261004-avatar-5`.
- Sello del shell en las páginas: `/assets/xpace-shell.js?v=20261005-avatar-controls-1` (y el CSS con el mismo sello).
- El estado se recuerda en este sitio, en el navegador (`admira-avatar:override`; `da-avatar:<host>` sólo en el fallback / fallback only). No hay claves en la página.
- La ficha que responde el cerebro está en `functions/avatar-ask.js`. Si el cerebro no contesta, se usa esa ficha.
- `/avatarDigital` sigue en el registro del shell (FLT-101350, Woz). Esta entrega no lo sustituye ni anuncia una publicación distinta de la suya.
- Pendiente fuera de este repo: el host de render de Neo. Si está apagado, best cae a la chica. No hay herramienta MCP nueva.

These commands stay with the avatar. They are not stored in `xpaceos_expert_pending_v1` and they do not open the twin. Bare `good`, `better` and `best` remain twin views and still travel to `/admira-xp/`. Loader: `https://www.admiranext.com/assets/avatar.js?v=20261004-avatar-5`. Shell cache token on pages: `/assets/xpace-shell.js?v=20261005-avatar-controls-1` (CSS uses the same token). State is remembered on this site, in the browser. There are no keys in the page. The fallback sheet is `functions/avatar-ask.js`. `/avatarDigital` stays in the shell registry (FLT-101350, Woz); this delivery does not replace it. Pending outside this repo: Neo’s render host. If it is off, best falls back to the girl. No new MCP tool.


Control local y tutorial actualizado ES/EN / Updated local controls and ES/EN tutorial: [avatar-controls](avatar-controls.md). `/avatar digital on` / `/avatar digital off` también funcionan en el gemelo nativo / also work in the native twin. `/avatarDigital` sin argumentos alterna la mascota del cargador central / without arguments toggles the central loader mascot.
