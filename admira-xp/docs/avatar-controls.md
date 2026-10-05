# Control del avatar digital / Digital avatar controls

ES: En Experto, /avatar digital on activa el asistente y /avatar digital off lo oculta y detiene su voz. Se mantienen /avatarDigital on|off, /avatarON, /avatarOFF y /cli ayudante on|off. En Avatar3D → Opciones, los botones «Avatar digital · on/off» controlan ese mismo asistente; «Encender/Apagar tótem» mantienen el avatar de la escena. La elección se recuerda por navegador y dominio. Los comandos son locales: no se envían a Telegram ni al MCP. Un fallo devuelve error, sin confirmar una activación inexistente. Se conservan modelos, marca blanca, idioma, historial CLI y datos del Xpacio.

EN: In Expert, /avatar digital on enables the assistant and /avatar digital off hides it and stops its voice. /avatarDigital on|off, /avatarON, /avatarOFF and /cli helper on|off remain available. In Avatar3D → Options, “Digital avatar · on/off” controls that same assistant; “Turn on/off totem” retains the scene avatar. The choice is remembered per browser and domain. Commands run locally and are never sent to Telegram or MCP. Failures report an error without confirming a nonexistent activation. Models, white label, language, CLI history and Xpace data are preserved.

## Tutorial ES

1. Abre ⌘ Experto y escribe `/avatar digital on`. El panel del asistente aparece.
2. Escribe `/avatar digital off`. Desaparecen panel y burbuja, y se detiene su voz.
3. En Experto selecciona Avatar3D: «Avatar digital · on/off» hace lo mismo; el tótem dispone de sus botones propios.
4. Recarga: se conserva tu elección en ese dominio. `/avatar` consulta el estado; `/avatar reset` devuelve el control al interruptor del proyecto.

## Tutorial EN

1. Open ⌘ Expert and enter `/avatar digital on`. The assistant panel appears.
2. Enter `/avatar digital off`. Panel and bubble disappear and its voice stops.
3. Select Avatar3D in Expert: “Digital avatar · on/off” does the same; the totem has its own controls.
4. Reload: your choice persists on that domain. `/avatar` reports status; `/avatar reset` follows the project switch again.

## Contrato compartido / Shared contract

- Local commands: `/avatar digital on|off`, `/avatarDigital on|off`, `/avatarON`, `/avatarOFF`, `/cli ayudante on|off`, `/cli helper on|off`. Bare `/avatarDigital` retains the central loader's mascot toggle; `/avatar good|better|best` retains its models.
- Dispatcher: `assets/xpace-shell.js` → `avatarCommandText` / `avatarCommand`; native composer, native `__xtExec`, shared Expert and native category actions use the same local adapter. `/avatar3d` remains independent.
- Renderer: existing `https://www.admiranext.com/assets/avatar.js`; `AdmiraAvatar.handle` and per-origin `admira-avatar:override`. Existing fallback `assets/avatar-digital.js` retains basic on/off if the central loader fails.
- Stable IDs: `telegramComposer`, `expertCategoryDetail`, `data-detail-category=avatar3d`. Existing nodes, scene data and model URLs are retained.
- URLs: https://www.admira.store/admira-xp/?autostart=xtanco and https://www.xpaceos.com/admira-xp/?autostart=xtanco. Preferences are independent by origin.
- MCP help topic: `avatar-controls`; resource `xpaceos://help`; public https://mcp.admira.store/help. No new tool or remote switch.
- Implementado / Implemented: local activation/deactivation and explicit native buttons. This control fix reuses the existing avatar loader; it does not deliver or certify new models or Woz's pending integration. Model/render/brain availability remains owned by those services.
