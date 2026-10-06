# Avatar · good, better y best / Avatar levels

Estado: implementado en el shell común de admira.store (4-oct-2026). El cargador vive en admiranext.com. No añade herramienta MCP.

Implemented in the admira.store common shell (4 Oct 2026). The loader lives on admiranext.com. No new MCP tool.

## Uso / Use

En ⌘ Experto, en cualquier página:

| Orden | Efecto |
|---|---|
| `/avatar good` | Abre a Admirito, la nube animada (2D ligera: mueve los labios y hace cosas si nadie la toca; en el gemelo, con calidad Good, también sale en el tótem). |
| `/avatar better` | Abre la chica (Ready Player Me, gafas). |
| `/avatar best` | Abre a Neo (MetaHuman). Si el host de render está apagado, entra la chica. |
| `/avatar` | Dice el estado. No cambia de cara. |
| `/avatarON` / `/avatarOFF` | Muestra u oculta el avatar y lo recuerda en este sitio. |
| `/avatar reset` | Vuelve al interruptor del proyecto. |
| `/cli` | Como en admira.app: dice el estado del avatar. `/cli good`, `/cli better` y `/cli best` abren ese nivel. `/cli ayudante [on\|off]` sigue igual; el resto de `/cli <orden>` va al gemelo. |

`/help` lista estas órdenes. Alias: `/avatarDigital`, `/digitalAvatar`, `/cli ayudante`, `/cli helper`.

In ⌘ Expert, on any page: `/avatar good` opens Admirito, the animated cloud (light 2D: moves its lips and does things when idle; in the twin at Good quality it is also on the totem), `/avatar better` opens the girl (Ready Player Me, glasses) and `/avatar best` opens Neo (MetaHuman; if the render host is off, the girl takes over). `/avatar` alone shows the status. `/avatarON` and `/avatarOFF` show or hide it. `/avatar reset` follows the project switch. `/help` lists them.

`/cli` alone shows the avatar status, as on admira.app; `/cli good|better|best` opens that level. Other `/cli <command>` orders still go to the twin.

El ⌘ Experto lleva la piel común de la suite (`experto.css/js` de admiranext.com, look digitalavatar.ai). Entra minimizado: sólo la línea `› /help`, escribible, con un asa encima para abrir. Una orden escrita en minimizado lo abre para enseñar la respuesta. Las tres columnas nativas quedan detrás de «＋ vista».

## Contrato / Contract

- Estas órdenes se quedan en el avatar. No se guardan en `xpaceos_expert_pending_v1` y no abren el gemelo.
- `good`, `better` y `best` sueltos siguen siendo las vistas del gemelo y sí viajan a `/admira-xp/`.
- Cargador: `https://www.admiranext.com/assets/avatar.js?v=20261006-avatar-nube-1`.
- Sello del shell en las páginas: `/assets/xpace-shell.js?v=20261005-avatar-controls-1` (y el CSS con el mismo sello).
- El estado se recuerda en este sitio, en el navegador (`admira-avatar:override`; `da-avatar:<host>` sólo en el fallback / fallback only). No hay claves en la página.
- La ficha que responde el cerebro está en `functions/avatar-ask.js`. Si el cerebro no contesta, se usa esa ficha.
- `/avatarDigital` sigue en el registro del shell (FLT-101350, Woz). Esta entrega no lo sustituye ni anuncia una publicación distinta de la suya.
- Pendiente fuera de este repo: el host de render de Neo. Si está apagado, best cae a la chica. No hay herramienta MCP nueva.

These commands stay with the avatar. They are not stored in `xpaceos_expert_pending_v1` and they do not open the twin. Bare `good`, `better` and `best` remain twin views and still travel to `/admira-xp/`. Loader: `https://www.admiranext.com/assets/avatar.js?v=20261006-avatar-nube-1`. Shell cache token on pages: `/assets/xpace-shell.js?v=20261005-avatar-controls-1` (CSS uses the same token). State is remembered on this site, in the browser. There are no keys in the page. The fallback sheet is `functions/avatar-ask.js`. `/avatarDigital` stays in the shell registry (FLT-101350, Woz); this delivery does not replace it. Pending outside this repo: Neo’s render host. If it is off, best falls back to the girl. No new MCP tool.


Control local y tutorial actualizado ES/EN / Updated local controls and ES/EN tutorial: [avatar-controls](avatar-controls.md). `/avatar digital on` / `/avatar digital off` también funcionan en el gemelo nativo / also work in the native twin. `/avatarDigital` sin argumentos alterna la mascota del cargador central / without arguments toggles the central loader mascot.

## Contexto del cliente / Client context (06-10-2026)

Contexto del cliente (06-10-2026): el avatar habla del negocio del local en los tres niveles. El cargador envía loc, idioma, sector, marca (mb:marca) y nivel a digitalavatar.ai; en el gemelo el sector sale del proyecto (estancos → estanco, Cafebrería y Starbucks → cafetería), no del loc xtanco-generic. good = persona del sector y sugerencias; better = además tono de la marca y datos del local; best = además lo que suena y el historial de la charla. Las reglas legales se aplican en todos los niveles: en estancos (Ley 28/2005) sólo información, sin recomendar ni promocionar tabaco o vapeo. No responde horarios: no hay datos fiables.

Client context (06-10-2026): the avatar talks about the venue's business at all three levels. The loader sends loc, language, sector, brand (mb:marca) and level to digitalavatar.ai; in the twin the sector comes from the project (estancos → tobacconist, Cafebrería and Starbucks → coffee shop), not from the xtanco-generic loc. good = sector persona and suggestions; better = plus brand tone and venue data; best = plus what is playing and the chat history. Legal rules apply at every level: tobacconists (Spanish Law 28/2005) get information only, never tobacco or vape recommendations or promotion. Opening hours are not answered: there is no reliable data.

- Catálogo de sectores / Sector catalogue: https://www.admiranext.com/avatar/sectores.json · perfil / profile: `GET https://brain.digitalavatar.ai/metahuman/profile?loc=&sector=&brand=&tier=&lang=`.
- Gemelo / Twin: `avatar3dSector()`, `avatar3dAskLoc()`, `avatar3dContextQS()` y `window.AdmiraAvatarContext` en `admira-xp/index.html`; `avatar3dLoc()` no cambia para métricas, campañas y día / unchanged for metrics, campaigns and day data.
- Sin herramienta MCP nueva / No new MCP tool.

## Nivel según la calidad del gemelo / Level from the twin's quality (06-10-2026)

ES: En el gemelo, el avatar abre con el nivel de la calidad visual: Good 8 bits = good, Better 16 bits = better, Best 32 bits y Matrix 64 bits = best (Matrix nunca cae a good). `/avatar good|better|best` escrito en la pestaña manda sobre eso. `window.AdmiraAvatarContext` lleva `tier` y `lang` (el de `<html lang>`, que sigue a `?lang=`); si cambian con el panel abierto, el gemelo llama a `AdmiraAvatar.setContext({tier, lang})` y la cara cambia de nivel o de idioma (chips incluidos). En Matrix la burbuja lleva a la pared de ladrillo en lugar de abrir el panel lateral ([matrix-wall-avatar](matrix-wall-avatar.md)).

EN: In the twin, the avatar opens at the level of the visual quality: Good 8-bit = good, Better 16-bit = better, Best 32-bit and Matrix 64-bit = best (Matrix never falls back to good). `/avatar good|better|best` typed in the tab overrides it. `window.AdmiraAvatarContext` carries `tier` and `lang` (from `<html lang>`, which follows `?lang=`); if they change with the panel open, the twin calls `AdmiraAvatar.setContext({tier, lang})` and the face switches level or language (chips included). In Matrix the bubble goes to the brick wall instead of opening the side panel ([matrix-wall-avatar](matrix-wall-avatar.md)).
