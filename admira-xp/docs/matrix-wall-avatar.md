# Avatar en pared y Create Media / Wall avatar and Create Media

ES: En Matrix de Starbucks Alsea, el avatar digital está anclado en la pared de ladrillo junto a la salida, a la izquierda de las estanterías. El botón Avatar digital de los controles centra esa pared. Pulsa el avatar para ampliar su vista y usar sus controles de conversación. Cerrar o Escape vuelve a la pared y reinicia el iframe para detener la voz. La conversación ampliada silencia temporalmente el hilo musical. Se reutilizan los renderizadores vivos de digitalavatar.ai y el nivel elegido en este navegador; no se activa el micrófono ni se envía una pregunta automáticamente. En las categorías de Experto, Crear contenidos / Create Media ocupa la antigua casilla de LiveCam y no se repite abajo. LiveCam sigue disponible en Avanzado y mediante /livecam. Se conservan los formularios legibles, las barras de creación, los previos ampliados, el arrastre centrado y los recibos de Stock.

EN: In Starbucks Alsea Matrix, the digital avatar is anchored on the brick wall beside the exit, left of the shelves. The Digital avatar control centres that wall. Click the avatar to enlarge its view and use its conversation controls. Close or Escape returns it to the wall and reloads the iframe to stop speech. The enlarged conversation temporarily silences background music. Existing live digitalavatar.ai renderers and this browser’s selected level are reused; no microphone or question starts automatically. In Expert categories, Create Media replaces the former LiveCam tile without a duplicate below. LiveCam remains available in Advanced and through /livecam. Readable forms, creation bars, enlarged previews, centred dragging and Stock receipts are retained.

## Tutorial ES

1. Abre ⌘ Experto. Crear contenidos está en la primera columna, tercera casilla; selecciona música, locución, imagen o vídeo en los formularios centrales.
2. Pulsa Avatar digital en los controles de Matrix para mirar hacia la pared marcada. Si el dock tapa la escena, pliégalo con ⌘.
3. Pulsa el avatar de la pared. La misma instancia del iframe se amplía; escribe o pulsa el micro de forma explícita para conversar.
4. Cerrar o Escape reinicia la sesión de voz y vuelve al avatar en la pared. La música recupera su volumen previo.

## Tutorial EN

1. Open ⌘ Expert. Create Media is the first column’s third tile; choose music, voiceover, image or video in the central forms.
2. Press Digital avatar in Matrix controls to face the marked wall. Collapse Expert with ⌘ if it covers the scene.
3. Click the wall avatar. The same iframe expands; type or explicitly press the microphone to converse.
4. Close or Escape resets the voice session and restores the wall view. Music returns to its prior volume.

## Contrato compartido / Shared contract

- Module: `admira-xp/scripts/matrix-wall-avatar.mjs`; stable local ID `starbucks-avatar-wall`. Four spherical corners in `STARBUCKS_AVATAR_WALL` refer to capture `alsea-starbucks-360`, independent of playlist and mapping seeds. Projection reuses `quadTransform`; perspective follows camera pan, zoom and resize. Hidden behind the camera or during screen calibration.
- Existing shared renderer URLs: Good `https://digitalavatar.ai/better.html?dock=1`, Better `https://digitalavatar.ai/best.html?dock=1&kiosk=0`, Best `https://digitalavatar.ai/metahuman.html?dock=1`. Read-only existing `admira-avatar:nivel` preference; no writes to the central on/off override. Unknown level falls back to Good. Renderer/model/brain availability belongs to DigitalAvatar.ai; this placement does not certify new Woz models or a new brain integration.
- The wall is a scene preview, separate from the floating assistant: existing `/avatar digital on|off`, `/avatarDigital`, `/avatar good|better|best`, mascot, and totem commands remain unchanged. Single wall iframe; modal expansion changes the native dialog’s top-layer status without moving or duplicating the iframe. Closing reloads it, cancelling conversation playback. Matrix disposal removes it and its level subscription.
- `expertQuickIcons` lists category `creation` in the previous `livecam` position, exactly once. `advQuickIcons` retains LiveCam. Creation forms, category selection, IDs, inputs and callbacks are retained; no new provider API.
- Stable demo: https://www.admira.store/admira-xp/?loc=alsea-sbux-021&project=starbucks&circuit=alsea_starbucks&quality=matrix&lang=es (use `lang=en` for English).
- MCP: help topic `matrix-wall-avatar`, existing help resource `xpaceos://help`; public https://mcp.admira.store/help. No new tool, remote player or Matrix-state mutation.
- Publication: publish the XpaceOS source and its retained contract before admira.store mirror. Both require this module and guide; earlier creation/recovery contracts remain in the manifest.
