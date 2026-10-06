# Avatar en pared y Create Media / Wall avatar and Create Media

ES: En Matrix de Starbucks Alsea, la pantalla de la pared de ladrillo arranca en modo kiosko con una simulación local navegable de Starbucks at Home en castellano. Pulsa la pantalla para ampliar la portada, menú, búsqueda, catálogo con filtros, recetas de ejemplo y selector de café. «Hablar con el avatar» abre la conversación existente con su nivel, idioma y contexto; «Web Starbucks» vuelve al kiosko. Cerrar o Escape detiene la conversación y devuelve la pantalla a la portada del kiosko. Las imágenes están guardadas localmente y la demo se identifica como simulación. No hay compras ni formularios personales, y no se cargan scripts de Starbucks. La web oficial se abre sólo mediante su enlace externo porque bloquea los iframes. Se conservan Create Media en lugar de LiveCam en Experto, el previo único grande, Reset, las voces, el arrastre y el estado MCP compartido.

EN: In Starbucks Alsea Matrix, the brick-wall screen starts in kiosk mode with a locally navigable Spanish simulation of Starbucks at Home. Click the screen to enlarge its home page, menu, search, filtered coffee catalogue, example recipes and coffee finder. "Talk to the avatar" opens the existing conversation with its level, language and context; "Starbucks website" returns to the kiosk. Close or Escape stops the conversation and restores the kiosk home page on the wall. Images are stored locally and the demo is labelled as a simulation. There are no purchases or personal-data forms, and Starbucks scripts are not loaded. The official website opens only through its external link because it blocks iframes. Create Media replacing LiveCam in Expert, the latest large preview, Reset, voices, dragging and shared MCP state are retained.

## Tutorial ES

1. Abre ⌘ Experto. Crear contenidos está en la primera columna, tercera casilla; selecciona música, locución, imagen o vídeo en los formularios centrales.
2. Pulsa Avatar digital en los controles de Matrix para mirar hacia la pared marcada. Si el dock tapa la escena, pliégalo con ⌘.
3. Pulsa la pantalla para ampliar el kiosko. Explora su menú o pulsa Hablar con el avatar para conversar.
4. Cerrar o Escape detiene la voz y vuelve a la portada del kiosko en la pared. La música recupera su volumen previo.

## Tutorial EN

1. Open ⌘ Expert. Create Media is the first column’s third tile; choose music, voiceover, image or video in the central forms.
2. Press Digital avatar in Matrix controls to face the marked wall. Collapse Expert with ⌘ if it covers the scene.
3. Click the wall screen to enlarge the kiosk. Explore its menu or press Talk to the avatar to converse.
4. Close or Escape stops speech and restores the kiosk home page on the wall. Music returns to its prior volume.

## Contrato compartido / Shared contract

- Module: `admira-xp/scripts/matrix-wall-avatar.mjs`; stable local ID `starbucks-avatar-wall`. Four spherical corners in `STARBUCKS_AVATAR_WALL` refer to capture `alsea-starbucks-360`, independent of playlist and mapping seeds. Projection reuses `quadTransform`; perspective follows camera pan, zoom and resize. Hidden behind the camera or during screen calibration.
- Existing shared renderer URLs: Good `https://digitalavatar.ai/better.html?dock=1`, Better `https://digitalavatar.ai/best.html?dock=1&kiosk=0`, Best `https://digitalavatar.ai/metahuman.html?dock=1`. Read-only existing `admira-avatar:nivel` preference; no writes to the central on/off override. Unknown level falls back to Good. Renderer/model/brain availability belongs to DigitalAvatar.ai; this placement does not certify new Woz models or a new brain integration.
- The wall is a scene preview, separate from the floating assistant: existing `/avatar digital on|off`, `/avatarDigital`, `/avatar good|better|best`, mascot, and totem commands remain unchanged. Single wall iframe; modal expansion changes the native dialog’s top-layer status without moving or duplicating the iframe. Closing loads the local kiosk, cancelling conversation playback. Matrix disposal removes it and its level subscription.
- `expertQuickIcons` lists category `creation` in the previous `livecam` position, exactly once. `advQuickIcons` retains LiveCam. Creation forms, category selection, IDs, inputs and callbacks are retained; no new provider API.
- Stable demo: https://www.admira.store/admira-xp/?loc=alsea-sbux-021&project=starbucks&circuit=alsea_starbucks&quality=matrix&lang=es (use `lang=en` for English).
- MCP: help topic `matrix-wall-avatar`, existing help resource `xpaceos://help`; public https://mcp.admira.store/help. No new tool, remote player or Matrix-state mutation.
- Publication: publish the XpaceOS source and its retained contract before admira.store mirror. Both require this module and guide; earlier creation/recovery contracts remain in the manifest.

## Contexto del cliente / Client context (06-10-2026)

Contexto (06-10-2026): la conversación de la pared abre el avatar con loc=alsea-sbux-021, sector=cafeteria, idioma, marca y nivel (tier); en best también le llega la canción del hilo musical (postMessage da-context). Las sugerencias y respuestas son de cafetería en good, better y best.

Context (06-10-2026): the wall conversation opens the avatar with loc=alsea-sbux-021, sector=cafeteria, language, brand and level (tier); in best it also receives the current background-music track (postMessage da-context). Suggestions and answers are coffee-shop ones in good, better and best.

- `wallAvatarUrl(level, context)` y `AVATAR_WALL_CONTEXT` en `matrix-wall-avatar.mjs`; `mountWallAvatar(surface,{t,onChange,context,live})`. `context` (objeto o función) se suma a loc/sector/idioma/marca por defecto; `live` devuelve el texto en vivo que se envía sólo a `https://digitalavatar.ai`.
- El sondeo de 1 s recarga el iframe sólo si cambia la URL (nivel, idioma o marca); si no, reenvía `live` cuando cambia.
- Test: `admira-xp/scripts/matrix-wall-avatar.test.mjs`.

## Nivel, idioma y burbuja en Matrix / Level, language and bubble in Matrix (06-10-2026)

ES: Al pulsar Hablar con el avatar, Matrix (64 bits) abre el avatar de la pared en nivel best (Neo); si el MetaHuman no está emitiendo, digitalavatar.ai enseña el avatar web («MODO WEB») en lugar de una pantalla negra. Orden del nivel: `/avatar good|better|best` elegido en esta pestaña > nivel que pide la página (Matrix → best) > último nivel guardado > good. La burbuja del avatar digital y `/avatar digital on` no abren un segundo avatar en el panel lateral: giran la cámara hacia la pared de ladrillo y resaltan «Starbucks at Home ↗» (pulsa para ampliar el kiosko y elegir Hablar con el avatar). El idioma de la página (`?lang=`) llega al avatar con sus chips.

EN: When Talk to the avatar is pressed, Matrix (64-bit) opens the wall avatar at the best level (Neo); if the MetaHuman is not streaming, digitalavatar.ai shows the web avatar ("WEB MODE") instead of a black screen. Level order: `/avatar good|better|best` chosen in this tab > level the page asks for (Matrix → best) > last stored level > good. The digital-avatar bubble and `/avatar digital on` do not open a second avatar in the side panel: they turn the camera to the brick wall and highlight "Starbucks at Home ↗" (click it to enlarge the kiosk and choose Talk to the avatar). The page language (`?lang=`) reaches the avatar with its chips.

- `wallAvatarLevel({chosen,tier,stored})` y `AVATAR_WALL_CHOICE_KEY` (`admira-avatar:nivel-elegido`, sessionStorage, lo escribe el cargador común) en `matrix-wall-avatar.mjs`; `mountWallAvatar(…,{tier:'best'})` devuelve `focus()`, `enlarge()`, `expanded` y `level`.
- `window.XpaceMatrixOptions.focusAvatar({talk})` (gira la cámara; `talk:true` además lo amplía) y `avatarState()`; el botón de controles `data-map="avatar"` usa `focusAvatar()`.
- Escucha el evento cancelable `admira-avatar:open` del cargador (`avatar.js?v=20261006-avatar-ctx-2`) y lo cancela mientras Matrix está activo.
- Sin herramienta MCP nueva / No new MCP tool. Test: `admira-xp/scripts/matrix-wall-avatar.test.mjs`.

## Kiosko local / Local kiosk · 06-10-2026

- Default URL: `/admira-xp/kiosk/starbucks/index.html`. Spanish content matching the requested `/es/` reference; parent controls remain ES/EN. Local CSS, JS and images in that directory; `assets/sources.json` records original asset URLs. No copied remote JavaScript, API proxy, cookies or provider generation. Home, catalogue filters/details, recipe details, search and coffee finder are simulated locally; this is not a full copy of the live catalogue. No checkout or accounts.
- Default wall mode is `kiosk`; explicit Talk switches the single iframe to the existing avatar. Its polling preserves selected level/language/brand but never replaces an active kiosk. Close restores the home page and stops the avatar. `focusAvatar({talk:true})` remains an explicit conversation shortcut.
- Local kiosk Escape message: `starbucks-kiosk:close`; parent accepts only the exact iframe window, same origin and expanded kiosk mode. Speech permissions are absent in kiosk mode. No background avatar or auto-microphone.
- Official reference refuses embedding via `X-Frame-Options: SAMEORIGIN` and CSP `frame-ancestors 'self'` (verified 06-10-2026). Demo does not bypass these headers: it serves its own local simulation. Official external link uses `noopener noreferrer`.
