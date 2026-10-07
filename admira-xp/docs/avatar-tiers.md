# Avatar3D · Good / Better / Best

**Carlos, 7-oct-2026.** En Experto → Avatar3D, el botón «Opciones del avatar» se sustituye por tres interruptores con estado ON/OFF.

| Interruptor | Avatar | Renderer existente |
|---|---|---|
| Good · Admirito | la nube verde de digitalavatar.ai | `https://digitalavatar.ai/nube.html` |
| Better · Luna | anfitriona web (Ready Player Me) | `https://digitalavatar.ai/best.html` |
| Best · Neo | MetaHuman | `https://digitalavatar.ai/metahuman.html` |

## ES

En Experto → Avatar3D, «Opciones del avatar» pasa a ser tres interruptores con estado ON/OFF: Good · Admirito (la nube verde de digitalavatar.ai), Better · Luna y Best · Neo (MetaHuman). Encienden o apagan ese avatar en el tótem de la escena. Son exclusivos: el tótem es una sola pantalla, así que encender uno apaga el anterior y, si el tótem estaba en modo interactivo (quiosco), lo pasa a avatar (Tótem · OFF). Apagar el que está ON deja el tótem sin avatar; /totem on vuelve al quiosco y /totem off (o encender cualquier nivel) devuelve el avatar. CLI de Control Xtore: /avatar good on|off, /avatar better on|off, /avatar best on|off; /avatar good, /avatar better y /avatar best a secas alternan ON↔OFF. Alias: avatar/admirito, human/luna, metahuman/neo. En Matrix · Starbucks la cámara mira al tótem al encender uno. El nivel elegido manda sobre la calidad del gemelo y se recuerda en este navegador. «Avatar digital · ON/OFF» (el asistente flotante) es independiente. /help los lista. Comandos locales: no van a Telegram ni al MCP.

### Por qué son exclusivos

El tótem de la escena es una sola pantalla (en Matrix · Starbucks, la pared junto a la salida; en Good/Better/Best 8-32 bits, el pin `DS_PIN.metahuman`). Solo puede enseñar un avatar a la vez, así que Good, Better y Best funcionan como un selector con opción «ninguno». El quiosco (Tótem · ON) ocupa la misma pantalla: encender un avatar lo quita y encender el quiosco deja los tres en OFF (el nivel elegido se recuerda para cuando vuelva el avatar).

### Tutorial

1. Abre el gemelo (Matrix · Starbucks), ⌘ Experto → Avatar3D. Verás «Tótem · ON», «Avatar digital», «Good · Admirito · OFF», «Better · Luna · OFF», «Best · Neo · OFF».
2. Pulsa «Best · Neo». El quiosco sale del tótem, la cámara lo mira y aparece Neo. «Tótem · OFF», «Best · Neo · ON».
3. Pulsa «Good · Admirito»: Neo se apaga y sale Admirito.
4. Pulsa otra vez «Good · Admirito»: el tótem queda sin avatar. `/totem on` vuelve al quiosco.
5. Lo mismo por CLI: `/avatar best on`, `/avatar best off`, `/avatar good` (alterna). `/help` → «Avatar de la escena · tótem».

## EN

In Expert → Avatar3D, “Avatar options” becomes three toggles with ON/OFF state: Good · Admirito (the green cloud from digitalavatar.ai), Better · Luna and Best · Neo (MetaHuman). They switch that avatar on or off on the scene totem. They are exclusive: the totem is a single screen, so turning one on turns the previous one off and, if the totem was in interactive (kiosk) mode, switches it to avatar (Totem · OFF). Turning off the active one leaves the totem without an avatar; /totem on brings back the kiosk and /totem off (or turning any level on) brings back the avatar. Control Xtore CLI: /avatar good on|off, /avatar better on|off, /avatar best on|off; bare /avatar good, /avatar better and /avatar best toggle ON↔OFF. Aliases: avatar/admirito, human/luna, metahuman/neo. In Matrix · Starbucks the camera looks at the totem when one is turned on. The chosen level overrides the twin quality and is remembered in this browser. “Digital avatar · ON/OFF” (the floating assistant) is independent. /help lists them. Local commands: never sent to Telegram or MCP.

### Why they are exclusive

The scene totem is a single screen (in Matrix · Starbucks, the wall beside the exit; in Good/Better/Best 8-32 bit, the `DS_PIN.metahuman` pin). It can show only one avatar at a time, so Good, Better and Best behave as a selector with a “none” option. The kiosk (Totem · ON) uses the same screen: turning an avatar on removes it and turning the kiosk on leaves all three OFF (the chosen level is remembered for when the avatar returns).

## Contrato compartido / Shared contract

- Fuente / Source: `admira-xp/scripts/avatar-tiers.js` → `window.XpaceAvatarTiers` `{active(), chosen(), off(), set(tier,on), toggle(tier), command(text), match(text)}`; event `xpace:avatar-tier`.
- Dispatcher: wraps `XpaceShell.isAvatarCommand` / `avatarCommand` in the twin, so the native composer, `__xtExec` and Expert share it. `/avatar digital on|off` (floating assistant) and `/avatar3d` are unchanged. `/digital avatar on|off` and `/digital on|off` are accepted as aliases of `/avatar digital on|off`.
- Matrix wall: `matrix-wall-avatar.mjs` reads sessionStorage `admira-avatar:nivel-elegido` (level) and localStorage `xpace:avatar-escena` = `off` (no avatar, black screen). `XpaceMatrixOptions.avatarState()` → `{level, expanded, mode, off}`.
- Classic twin: `avatar3dTotemUrl()` honours the explicit choice (`AVATAR3D_TOTEM_BY_TIER`) over the twin quality; `setAvatar3dTotem(true|false)`.
- Stored per browser: localStorage `xpace:avatar-escena-nivel`, `xpace:avatar-escena`.
- No new MCP tool, no remote switch. Neo depends on the existing MetaHuman render host (owned by digitalavatar.ai).

## Idioma en el avatar ampliado

En el modal del avatar (Matrix), el selector ESP/ENG vive en la barra superior junto al desplegable del modelo. El gemelo carga el renderer con `langui=host`, y digitalavatar.ai oculta entonces sus propias pastillas de idioma. El cambio se envía al iframe con `da-context` (`lang`), sin recargarlo.
