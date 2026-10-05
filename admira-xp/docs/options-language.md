# Iconos de Opciones e idioma / Options icons and language

ES: Megafonía, Hilo Musical, Imagen, Video, Avatar y Contador usan los mismos iconos SVG de línea, trazo de 1,5 y color cian que Avanzados. Sus desplegables conservan las acciones existentes. Abre ⌘ Experto, escribe /idioma ESP para castellano o /idioma ENG para inglés y pulsa Enter. La interfaz cambia sin recargar el Xpacio: barra superior, Opciones, Avanzados, Experto y controles de vistas. El idioma se guarda en este navegador y origen; la URL se actualiza a lang=es o lang=en. La portada, Lenovo, Ayuda, Comandos CLI, Documentación y Backoffice también traducen su propio contenido al momento y lo conservan al recargar: comparten la preferencia xtanco_lang y el evento admira:languagechange (assets/xpace-lang.js); una preferencia anterior (xpaceosLang, xpace_lang) se migra una sola vez. La orden explícita prevalece sobre el idioma de entrada, incluso langlock=1. Se conservan proyecto, local, calidad, escena, datos, marca blanca, dimensiones de paneles e historial CLI. Los nombres propios, contenidos y respuestas anteriores conservan su texto original. La orden es local y no se envía a Telegram ni al MCP.

EN: PA system, Background music, Image, Video, Avatar and Counter use the same cyan line SVG icons and 1.5 stroke as Advanced. Their dropdowns retain existing actions. Open ⌘ Expert, type /idioma ESP for Spanish or /idioma ENG for English and press Enter. The interface changes without reloading the Xpace: top bar, Options, Advanced, Expert and view controls. Language is saved in this browser and origin; the URL changes to lang=es or lang=en. The home page, Lenovo, Help, CLI commands, Documentation and Backoffice also translate their own content immediately and keep it after reloading: they share the xtanco_lang preference and the admira:languagechange event (assets/xpace-lang.js); an earlier preference (xpaceosLang, xpace_lang) is migrated once. An explicit command takes precedence over the incoming locale, including langlock=1. Project, venue, quality, scene, data, white label, panel sizes and CLI history are preserved. Proper names, content and earlier responses retain their original text. This is a local command, never sent to Telegram or MCP.

## Tutorial ES

1. Abre Opciones (☰) y selecciona un icono: Megafonía, Hilo Musical, Imagen, Video, Avatar o Contador.
2. Abre ⌘ Experto y escribe `/idioma ENG`; Enter cambia toda la interfaz a inglés sin reiniciar la escena.
3. Escribe `/idioma ESP`; Enter vuelve a castellano. La preferencia se recuerda al volver al mismo origen.

## Tutorial EN

1. Open Options (☰) and select PA system, Background music, Image, Video, Avatar or Counter.
2. Open ⌘ Expert, type `/idioma ENG` and press Enter to switch the interface to English without restarting the scene.
3. Type `/idioma ESP` and press Enter to return to Spanish. The preference is remembered on the same origin.

## Contrato compartido / Shared contract

- Comandos / Commands: `/idioma ESP`, `/idioma ENG`; aliases `/language ESP|ENG`, `es|en`, case insensitive. Invalid arguments return local usage and change nothing.
- Estado / State: `document.documentElement.lang`, `xtanco_lang`, `XPACE_LANG_OVERRIDE`, URL `lang=es|en`. An explicit command clears the incoming locale lock. Explicit URL language still takes priority on a new visit.
- Páginas con contenido propio / Pages with their own content: `/`, `/lenovo/`, `/help/`, `/help/cli/`, `/doc/`, `/backoffice/` load `assets/xpace-lang.js` synchronously (`XpaceLang.bind`). Order: URL `lang=` → `xtanco_lang` → one-time migration of `xpaceosLang`, `xpace_lang`, `loyalty_admin_lang` (copied only when `xtanco_lang` is empty, then removed) → page default (home ES, Lenovo EN, CLI/Doc browser locale). The initial default is not stored, so the twin keeps its own default for visitors who never chose. After `/idioma`, the shell emits `admira:languagechange` with `detail {lang, source:'xpace-shell'}`; pages repaint without reloading. A page language button stores `xtanco_lang`, rewrites an existing `lang=` and emits the same event with its own `source`.
- Recursos / Resources: `assets/xpace-shell.js` (local dispatcher), `admira-xp/scripts/expert-categories.js` (shared SVG factory), `expert-categories.css` (shared style), `interface-language.mjs` (declared interface translations, no DOM replacement).
- IDs de Opciones / Options IDs: `data-option-id=megafonia|music|pixerai|video|avatar|counter`; original accordion handlers and action IDs retained.
- MCP: help topic `options-language` / `idioma`, resource `xpaceos://help`, public help https://mcp.admira.store/help. No new remote tool, auth change or physical-device operation.
- URLs: https://www.admira.store/admira-xp/?autostart=xtanco and https://www.xpaceos.com/admira-xp/?autostart=xtanco. The two domains share implementation; local preferences remain separate by origin.
- Implementado / Implemented: shared SVG icons and local language switching with retained session and current ES/EN help. Verification is recorded in the publication evidence; no pending remote dependency is needed for this local operation.
