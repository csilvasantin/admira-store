# Avatar en pared y Create Media / Wall avatar and Create Media

ES: Starbucks arranca con el quiosco de pedido en la pared de ladrillo. /avatar good|better|best on o /totem off activa manualmente el avatar, conservando el nivel elegido; /totem on recupera el quiosco. Cerrar o Escape devuelve la pantalla a la pared y recupera el hilo musical. Al recargar, Starbucks vuelve al kiosco. Crear contenidos, previos, Reset, voces y arrastre se conservan.

EN: Starbucks starts with the ordering kiosk on the brick-wall screen. /avatar good|better|best on or /totem off enables the avatar manually while retaining its chosen tier; /totem on restores the kiosk. Close or Escape restores the wall screen and background music. Reload starts Starbucks in kiosk mode. Create media, previews, Reset, voices and dragging remain available.

Tutorial ES/EN: [Arranque y avisos / Startup and announcements](starbucks-defaults.md).

## Contrato compartido / Shared contract

- Module: `admira-xp/scripts/matrix-wall-avatar.mjs`; stable local ID `starbucks-avatar-wall`. Four spherical corners in `STARBUCKS_AVATAR_WALL` refer to capture `alsea-starbucks-360`, independent of playlist and mapping seeds. Projection reuses `quadTransform`; perspective follows camera pan, zoom and resize. Hidden behind the camera or during screen calibration.
- Existing shared renderer URLs: Good `https://digitalavatar.ai/nube.html?dock=1` (Admirito, la nube animada), Better `https://digitalavatar.ai/best.html?dock=1&kiosk=0`, Best `https://digitalavatar.ai/metahuman.html?dock=1`. Read-only existing `admira-avatar:nivel` preference; no writes to the central on/off override. Unknown level falls back to Good. Renderer/model/brain availability belongs to DigitalAvatar.ai; this placement does not certify new Woz models or a new brain integration.
- The wall is a scene preview, separate from the floating assistant: existing `/avatar digital on|off`, `/avatarDigital`, `/avatar good|better|best`, mascot, and totem commands remain unchanged. Single wall iframe; modal expansion changes the native dialog’s top-layer status without moving or duplicating the iframe. Closing preserves the kiosk iframe in kiosk mode and resets conversation playback in avatar mode. Matrix disposal removes it and its level subscription.
- `expertQuickIcons` lists category `creation` in the previous `livecam` position, exactly once. `advQuickIcons` retains LiveCam. Creation forms, category selection, IDs, inputs and callbacks are retained; no new provider API.
- Stable demo: https://www.admira.store/admira-xp/?loc=alsea-sbux-021&project=starbucks&circuit=alsea_starbucks&quality=matrix&lang=es (use `lang=en` for English).
- MCP: help topic `matrix-wall-avatar`, existing help resource `xpaceos://help`; public https://mcp.admira.store/help. No new tool, remote player or Matrix-state mutation.
- Publication: publish the XpaceOS source and its retained contract before admira.store mirror. Both require this module and guide; earlier creation/recovery contracts remain in the manifest.

## Contexto del cliente / Client context (06-10-2026)

Contexto (06-10-2026): la conversación de la pared abre el avatar con loc=alsea-sbux-021, sector=cafeteria, idioma, marca y nivel (tier); en best también le llega la canción del hilo musical (postMessage da-context). Las sugerencias y respuestas son de cafetería en good, better y best.

Context (06-10-2026): the wall conversation opens the avatar with loc=alsea-sbux-021, sector=cafeteria, language, brand and level (tier); in best it also receives the current background-music track (postMessage da-context). Suggestions and answers are coffee-shop ones in good, better and best.

- `wallAvatarUrl(level, context)` y `AVATAR_WALL_CONTEXT` en `matrix-wall-avatar.mjs`; `mountWallAvatar(surface,{t,onChange,context,live})`. `context` (objeto o función) se suma a loc/sector/idioma/marca por defecto; `live` devuelve el texto en vivo que se envía sólo a `https://digitalavatar.ai`.
- El sondeo de 1 s recarga el iframe sólo al cambiar de modelo; idioma y contexto se envían por `da-context` a la instancia existente. `live` se reenvía cuando cambia.
- Test: `admira-xp/scripts/matrix-wall-avatar.test.mjs`.

## Nivel, idioma y burbuja en Matrix / Level, language and bubble in Matrix (06-10-2026)

ES: Al abrir el avatar se hereda el idioma actual del site: ESP en castellano y ENG en inglés. El modelo inicial es Good · Admirito, independiente de la calidad del Xpacio (también en Matrix). El selector Modelo del avatar permite elegir Good · Admirito, Better · Chica o Best · Neo; también sirven /avatar digital good, /avatar digital better y /avatar digital best. Una elección explícita de modelo se conserva en esta pestaña. ESP muestra Micrófono, Detener y Preguntar; ENG muestra Microphone, Stop y Ask. Cambiar ESP/ENG dentro de la conversación conserva la pregunta escrita y detiene la voz/escucha anterior, sin enviar una pregunta ni activar el micrófono. Al cerrar y reabrir vuelve a heredarse el idioma del site; cambiar el idioma del site actualiza la conversación abierta sin recargar el iframe. Best utiliza el MetaHuman Neo y conserva el respaldo web existente cuando el host no emite.

EN: Opening the avatar inherits the current site language: ESP for Spanish and ENG for English. The initial model is Good · Admirito, independent of Xpace quality (including Matrix). The Avatar model selector offers Good · Admirito, Better · Girl or Best · Neo; /avatar digital good, /avatar digital better and /avatar digital best also work. An explicit model choice is retained for this tab. ESP shows Micrófono, Detener and Preguntar; ENG shows Microphone, Stop and Ask. Switching ESP/ENG in the conversation preserves the typed question and stops the previous speech/listening without sending a question or enabling the microphone. Closing and reopening inherits the site language again; changing the site language updates the open conversation without reloading its iframe. Best uses the Neo MetaHuman and retains the existing web fallback when the render host is unavailable.

- `wallAvatarLevel({chosen,tier,stored})` y `AVATAR_WALL_CHOICE_KEY` (`admira-avatar:nivel-elegido`, sessionStorage, lo escribe el cargador común) en `matrix-wall-avatar.mjs`; `mountWallAvatar(…,{tier:'best'})` devuelve `focus()`, `enlarge()`, `expanded` y `level`.
- `window.XpaceMatrixOptions.focusAvatar({talk})` (gira la cámara; `talk:true` además lo amplía) y `avatarState()`; el botón de controles `data-map="avatar"` usa `focusAvatar()`.
- Escucha el evento cancelable `admira-avatar:open` del cargador (`avatar.js?v=20261006-avatar-nube-1`) y lo cancela mientras Matrix está activo.
- Sin herramienta MCP nueva / No new MCP tool. Test: `admira-xp/scripts/matrix-wall-avatar.test.mjs`.

## Kiosko local / Local kiosk · 06-10-2026

- Default URL: `/admira-xp/kiosk/starbucks/index.html`. Spanish content matching the requested `/es/` reference; parent controls remain ES/EN. Local CSS, JS and images in that directory; `assets/sources.json` records original asset URLs. No copied remote JavaScript, API proxy, cookies or provider generation. Home, catalogue filters/details, recipe details, search and coffee finder are simulated locally; this is not a full copy of the live catalogue. No checkout or accounts.
- Default wall mode is `kiosk`; explicit Talk switches the single iframe to the existing avatar. Its polling preserves selected level/language/brand but never replaces an active kiosk. Close restores the home page and stops the avatar. `focusAvatar({talk:true})` remains an explicit conversation shortcut.
- Local kiosk Escape message: `starbucks-kiosk:close`; parent accepts only the exact iframe window, same origin and expanded kiosk mode. Speech permissions are absent in kiosk mode. No background avatar or auto-microphone.
- Official reference refuses embedding via `X-Frame-Options: SAMEORIGIN` and CSP `frame-ancestors 'self'` (verified 06-10-2026). Demo does not bypass these headers: it serves its own local simulation. Official external link uses `noopener noreferrer`.

# Idioma y controles del avatar / Avatar language and controls

ES: Al abrir el avatar se hereda el idioma actual del site: ESP en castellano y ENG en inglés. El modelo inicial es Good · Admirito, independiente de la calidad del Xpacio (también en Matrix). El selector Modelo del avatar permite elegir Good · Admirito, Better · Chica o Best · Neo; también sirven /avatar digital good, /avatar digital better y /avatar digital best. Una elección explícita de modelo se conserva en esta pestaña. ESP muestra Micrófono, Detener y Preguntar; ENG muestra Microphone, Stop y Ask. Cambiar ESP/ENG dentro de la conversación conserva la pregunta escrita y detiene la voz/escucha anterior, sin enviar una pregunta ni activar el micrófono. Al cerrar y reabrir vuelve a heredarse el idioma del site; cambiar el idioma del site actualiza la conversación abierta sin recargar el iframe. Best utiliza el MetaHuman Neo y conserva el respaldo web existente cuando el host no emite.

EN: Opening the avatar inherits the current site language: ESP for Spanish and ENG for English. The initial model is Good · Admirito, independent of Xpace quality (including Matrix). The Avatar model selector offers Good · Admirito, Better · Girl or Best · Neo; /avatar digital good, /avatar digital better and /avatar digital best also work. An explicit model choice is retained for this tab. ESP shows Micrófono, Detener and Preguntar; ENG shows Microphone, Stop and Ask. Switching ESP/ENG in the conversation preserves the typed question and stops the previous speech/listening without sending a question or enabling the microphone. Closing and reopening inherits the site language again; changing the site language updates the open conversation without reloading its iframe. Best uses the Neo MetaHuman and retains the existing web fallback when the render host is unavailable.

## Contrato / Contract

- Renderers: `/nube.html` (Good), `/best.html` (Better), `/metahuman.html` (Best); `/better.html` retains historical 3D controls. Assets: `/assets/da-conversation-controls.js`, `/assets/da-conversation-controls.css`.
- Language source: `DAContext.lang`, initially `?lang=es|en`; native language listeners also update placeholders, chips and recognition/request language. No new API or voices.
- Parent notification: `{type:"da-language-selected",lang:"es"|"en"}` sent only to the trusted embedding origin. XpaceOS validates `event.source`, `https://digitalavatar.ai`, the expanded conversation and the language.
- Opening language source: current site `<html lang>`; legacy language storage never overrides it. Manual conversation-language choice is local to the open conversation. Model choice uses sessionStorage `admira-avatar:nivel-elegido`, shared with the existing CLI. No shared MCP write or physical-screen configuration change.
- Native Stop cancels listening/speech using each renderer’s existing handler. The render host and speech providers retain their existing availability requirements.
- Tutorial ES: ampliar la pared → Hablar con el avatar → ESP/ENG → escribir y Preguntar, o Micrófono; Detener interrumpe la voz. Cerrar vuelve al kiosko.
- Tutorial EN: enlarge wall → Talk to the avatar → ESP/ENG → type and Ask, or Microphone; Stop interrupts speech. Close returns to the kiosk.
