# /demo · Las cinco soluciones / The five solutions

## Uso / Usage

ES: Mismo patrón que [/demo tpv](demo-tpv.md), ampliado a las cinco soluciones para la demo de Alsea (Starbucks España y México). En el ⌘ Experto de cualquier web de la suite, `/demo` lista las cinco y `/demo <solución>` abre su demostración. Acepta el número (1…5), el nombre con o sin `admira.` y alias (`/demo yokup`, `/demo tienda`). `/demo siguiente` salta a la siguiente según la web en la que estás. Desde el avatar digital (Admirito, Luna o Neo) escribe o di «/demo store»: el avatar presenta la solución en dos frases y, al terminar de hablar, la página abre la demo. `/demo` a secas en el avatar sigue siendo el pitch de 30 s. En este gemelo, `/demo store` es `/demo tpv` y las demás soluciones abren su URL.

EN: Same pattern as [/demo tpv](demo-tpv.md), extended to the five solutions for the Alsea demo (Starbucks Spain and Mexico). In the ⌘ Expert of any suite site, `/demo` lists the five and `/demo <solution>` opens its demo. Accepts the number (1…5), the name with or without `admira.` and aliases (`/demo yokup`, `/demo tienda`). `/demo next` jumps to the next one from the current site. From the digital avatar (Admirito, Luna or Neo) type or say "/demo store": the avatar introduces the solution in two sentences and, once it finishes speaking, the page opens the demo. Bare `/demo` in the avatar is still the 30 s pitch. In this twin, `/demo store` is `/demo tpv` and the other solutions open their URL.

| # | /demo | Solución / Solution | Qué se enseña / What it shows | URL |
|---|---|---|---|---|
| 1 | `studio` | admira.studio | Contenidos con IA: locución, música, imagen, vídeo y adaptación de formatos / AI content: voiceover, music, image, video and format adaptation | https://www.admira.studio/ |
| 2 | `store` | admira.store | Gemelo Starbucks Alsea en Matrix + `/demo tpv` / Alsea Starbucks twin in Matrix + `/demo tpv` | https://www.admira.store/admira-xp/?marca=starbucks&loc=alsea-sbux-021&project=starbucks&circuit=alsea_starbucks&lang=es&demo=tpv#tpv |
| 3 | `tv` | admira.tv | Starbucks Passeig de Gràcia 103 desde la calle → Matrix / street view → Matrix | https://admira.tv/adcelerate/demo/?view=human&site=starbucks |
| 4 | `app` | admira.app · Yokup | Operación de la red: equipos, incidencias ITIL / Network operations: equipment, ITIL incidents | https://www.yokup.com/retailer?marca=starbucks |
| 5 | `biz` | admira.biz | Comercialización y retail media / Monetisation and retail media | https://www.admira.biz/ |

## Contrato / Contract

- `?demo=tpv` en esta página lanza `/demo tpv` como si se escribiera en Experto. Si la pestaña no ha recibido un gesto, espera al primer toque o tecla («Demo TPV lista · toca la pantalla para empezar») para que el navegador deje sonar la canción. El parámetro se retira de la URL al leerlo; recargar no repite la demo. / `?demo=tpv` runs `/demo tpv` as if typed in Expert; without a prior gesture it waits for the first tap or key so audio can play. The parameter is removed on read; reloading does not repeat it.
- Catálogo / Catalogue: `admiranext.com/suite/experto.js` (`AdmiraExperto.demos()`, `.parseDemo()`); copia en `admira-xp/scripts/xtanco-visual-command.mjs` (`DEMO_SOLUTIONS`), `admiranext.com/assets/avatar.js` y `digitalavatar.ai/assets/da-context.js`. Mantener las cuatro en sync. / Keep the four copies in sync.
- Avatar: la cara llama a `DAContext.demoAsk()` antes de preguntar y `DAContext.demoDone(answer)` tras la respuesta; manda `postMessage({type:'da-demo', id})` a la página, que lo acepta sólo de `https://digitalavatar.ai`. Sin página madre abre la URL directamente. / The face posts `da-demo` to the embedding page, accepted only from `https://digitalavatar.ai`; standalone it opens the URL itself.
- Lo que no es una solución (`/demo tpv`, `/demo off`, `/demo estado`) sigue siendo de cada web. Sin cobros, Telegram ni escrituras MCP. / Non-solution arguments stay with each site. No payments, Telegram or MCP writes.

## Estado / Status

ES: Implementado y probado con tests de unidad (parseo, catálogo, navegación, mensaje del avatar). Pendiente verificar en producción tras desplegar las cuatro webs y actualizar la ayuda del servidor MCP real (`xpaceos-mcp`). Las URL de studio, tv, app y biz son las demos públicas existentes; no se ha añadido autoarranque en ellas.

EN: Implemented and unit-tested (parsing, catalogue, navigation, avatar message). Pending production verification after deploying the four sites and updating the real MCP server help (`xpaceos-mcp`). The studio, tv, app and biz URLs are existing public demos; no autostart was added there.

## Subdemos de admira.studio / Studio subdemos

ES: En admira.studio y pixeria.com (misma plataforma), `/demo 1…5` son las subdemos de Studio, no las cinco soluciones: 1 `voz`/`locucion` (crear locución), 2 `musica`, 3 `imagen`, 4 `video`, 5 `adaptar`/`formatos` (adaptar formatos). `/demo help` lista solo esas. Modo muestra por defecto: se enseña el resultado preparado sin generar ni publicar. Manifiesto: https://www.admira.studio/demo/studio.subdemos.json (copia en https://www.admiranext.com/subdemos/studio.subdemos.json); resolución = `resolverDemo` de pixeria `demo/studio-comandos.mjs`. Los nombres (`/demo store`, `/demo biz`…) siguen abriendo las otras plataformas.

EN: On admira.studio and pixeria.com, `/demo 1…5` are Studio's subdemos (voice, music, image, video, adapt formats) and `/demo help` lists only those, in sample mode.
