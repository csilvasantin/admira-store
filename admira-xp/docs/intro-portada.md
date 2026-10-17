# Intro en vídeo de la portada · Homepage video intro

Estado: publicado en xpaceos.com el 17-oct-2026 (sello `v.17.10.2026.r1`); versión en inglés y música el mismo día (sello `v.17.10.2026.r2.19:52`). Autor: NeoMacStudio · MacStudio.

## Español

Al entrar en la portada de xpaceos.com sale a pantalla completa el vídeo «Todo en orden» (15 segundos): dos minutos antes de abrir fallan pantallas, música, aroma y wifi; pasa XpaceOS y todo queda en verde; cierra con el logo y la frase de la portada.

- **Idioma:** sale en el idioma de la portada (`XpaceLang`: `?lang=`, después la preferencia guardada, y si no, español). En inglés es el mismo vídeo con el texto traducido y los mismos tiempos («All in order»); el cierre usa la frase de la portada en inglés (`hero.title`): «Save money by supervising the space's IoT.»
- **Música:** dos bandas sonoras originales hechas para esta intro, que se alternan en cada intro (`localStorage`, clave `xpaceos_intro_musica`): «Tic-tac y campanas» (cada momento con su sonido) y «Pulso» (lo mismo con un ritmo electrónico). El audio va aparte del vídeo y se ajusta a su tiempo. Al empezar intenta sonar; si el navegador no lo deja (lo normal sin un clic previo), sigue en silencio y queda el botón «🔊 Activar sonido» (después, «🔇 Silenciar»). `?musica=campanas` o `?musica=pulso` fija una; `?musica=0` la quita. Las dos son originales (Web Audio, compuestas el 17-oct-2026); no hay derechos de terceros.
- **Cuándo sale:** la primera vez en cada sesión del navegador **y en cada idioma** (`sessionStorage`, clave `xpaceos_intro_a`, con los idiomas ya vistos: `es`, `en` o `es,en`). **Al pasar a castellano** (o a inglés) con el botón ESP/ENG o con `/idioma` (evento `admira:languagechange`), la intro sale en el idioma nuevo si aún no se ha visto en él; si está en marcha, el vídeo cambia al otro idioma en el mismo segundo y la música sigue (Carlos, 17-oct-2026: «al pasar a castellano tenemos que ver la intro en castellano»).
- **Cuándo no sale:** con «reducir movimiento» en el sistema, en un idioma sin vídeo o con `?intro=0`.
- **Solo con el look por defecto** (17-oct-2026, «con el look and feel de admira.store por default»): si la pestaña tiene una marca blanca activa no sale, para no meter XpaceOS en la demo de un cliente. Cuenta como marca activa: `?marca=<id>`, `?project=`, un local Starbucks (`?loc=alsea-sbux-…`) o la marca recordada en `sessionStorage` (`mb:marca`), con las mismas prioridades que `assets/marca-blanca.js`. `?marca=admira` (u `off`, `default`…) es el modo por defecto. `?intro=1` la fuerza igual.
- **Las dos webs:** el mismo script, los mismos vídeos y la misma música en xpaceos.com y en admira.store, porque el look por defecto de admira.store es el de XpaceOS.
- **Forzarla:** `https://www.xpaceos.com/?intro=1` (español) o `https://www.xpaceos.com/?lang=en&intro=1` (inglés), para enseñarla aunque ya se haya visto.
- **Cerrar:** botón «Saltar intro ✕», tecla Esc, o sola al terminar. Si el vídeo no arranca en 4 segundos (red lenta, reproducción automática bloqueada), se quita sola.
- **Ficheros:** `assets/intro-portada.js` (lógica y estilo) y los vídeos de `assets/video/`:
  - español: `intro-xpaceos-a-1080.mp4` (1920 × 1080, 7,97 MB) e `intro-xpaceos-a-720.mp4` (1280 × 720, 5,16 MB);
  - inglés: `intro-xpaceos-a-en-1080.mp4` (1920 × 1080, 7,76 MB) e `intro-xpaceos-a-en-720.mp4` (1280 × 720, 5,06 MB);
  - música: `intro-xpaceos-a-musica-campanas.mp4` (288 KB) e `intro-xpaceos-a-musica-pulso.mp4` (316 KB), AAC de 15 s en contenedor .mp4 (Cloudflare no sirve .m4a por rangos), sirven para los dos idiomas.
  - Desde 1600 píxeles reales de ancho se sirve la de 1080p.
- **Pruebas:** `tests/intro-portada.test.mjs`.
- **Cómo se hizo el vídeo:** maqueta animada en HTML, capturada fotograma a fotograma con Chrome sin ventana (30 fps) y codificada en H.264 con AVFoundation en el Mac Studio. La versión en inglés sale de la misma maqueta con `?lang=en`. No cambia el uso del producto: la ayuda, el tutorial y el MCP no cambian.
- **Pendiente:** llevarla a admira.studio si gusta.

## English

The xpaceos.com homepage opens with the full-screen video «All in order» («Todo en orden», 15 seconds): two minutes before opening, screens, music, scent and wifi fail; XpaceOS sweeps through and everything turns green; it ends with the logo and the homepage claim.

- **Language:** the video follows the homepage language (`XpaceLang`: `?lang=`, then the stored preference, else Spanish). The English cut is the same animation with translated copy and identical timing; the end card uses the English homepage claim (`hero.title`): «Save money by supervising the space's IoT.»
- **Music:** two original soundtracks made for this intro alternate on each showing (`localStorage`, key `xpaceos_intro_musica`): «Tic-tac y campanas» (a sound for every moment) and «Pulso» (the same over an electronic beat). Audio is separate from the video and follows its time. It first tries to play with sound; if the browser blocks it (usual without a prior click), it stays silent and shows «🔊 Turn sound on» (then «🔇 Mute»). `?musica=campanas` or `?musica=pulso` fixes one; `?musica=0` removes it. Both are original (Web Audio, composed on 17-oct-2026); no third-party rights.
- **When it plays:** once per browser session **and per language** (`sessionStorage` key `xpaceos_intro_a` lists the languages seen). **Switching language** with the ESP/ENG button or `/idioma` (`admira:languagechange`) plays the intro in the new language if it has not been seen in it; if it is already playing, the video switches language at the same second and the music continues.
- **When it does not:** with reduced motion enabled, in a language without a video, or with `?intro=0`.
- **Default look only:** with an active white-label brand (`?marca=<id>`, `?project=`, a Starbucks `?loc=alsea-sbux-…` or the brand remembered in `sessionStorage` `mb:marca`) it does not play, so client demos never show the XpaceOS intro. `?marca=admira` (or `off`, `default`…) is the default mode. `?intro=1` still forces it.
- **Both sites:** the same script, videos and music on xpaceos.com and admira.store.
- **Force it:** `https://www.xpaceos.com/?intro=1` (Spanish) or `https://www.xpaceos.com/?lang=en&intro=1` (English).
- **Close:** «Skip intro ✕» button, Esc key, or automatically at the end. If the video has not started after 4 seconds, it removes itself.
- **Files:** `assets/intro-portada.js` and, in `assets/video/`, `intro-xpaceos-a-1080.mp4` / `intro-xpaceos-a-720.mp4` (Spanish) and `intro-xpaceos-a-en-1080.mp4` / `intro-xpaceos-a-en-720.mp4` (English), 1920 × 1080 and 1280 × 720, plus `intro-xpaceos-a-musica-campanas.mp4` and `intro-xpaceos-a-musica-pulso.mp4` (15 s AAC, both languages). The 1080p file is served from 1600 physical pixels wide.
- **Tests:** `tests/intro-portada.test.mjs`.
- Product usage does not change: help, tutorial and MCP are unchanged.
- **Pending:** port to admira.studio if approved.
