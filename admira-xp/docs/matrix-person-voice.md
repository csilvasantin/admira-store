# Locuciones por persona y CLI / Staff voiceovers and CLI

En Matrix de Starbucks Alsea, pulsa la chica para emitir la última locución de Sara Martín en castellano o Cassidy en inglés; pulsa el chico con gafas para David Martín en castellano o James en inglés. Se reproduce el audio ya guardado en Stock tres veces, sin otra generación de pago. Pulsar de nuevo detiene la lectura; cambiar de persona cancela la búsqueda o reproducción anterior. La música baja durante la locución y vuelve al terminar. Cada voz e idioma conserva su último recibo por Xpacio, aunque cambie PREVIOS o recargues. Si no hay recibo local, se busca audio publicado desde XpaceOS en Stock, con coincidencia explícita de voz e idioma; no se sustituye por una voz diferente ni por el aviso de cierre. Si no existe audio coincidente o Stock no responde, se informa para crear esa locución o reintentar. Las personas siguen al panorama al girar y hacer zoom. El CLI conserva la escritura de /avatar digital good, /avatar digital better y /avatar digital best; el autocompletado de /aviso no se transforma en /sincro. Enter ejecuta y Shift+Enter añade una línea; se conservan la marca blanca y el cargador central del avatar.

In Starbucks Alsea Matrix, click the woman to play the latest Sara Martín voiceover in Spanish or Cassidy in English; click the man with glasses for David Martín in Spanish or James in English. Saved Stock audio plays three times without another paid generation. Click again to stop; changing person cancels the previous lookup or playback. Music is reduced during the voiceover and restored afterwards. Each voice and language retains its latest receipt per Xpace even when PREVIEWS changes or the page reloads. Without a local receipt, published XpaceOS audio is recovered from Stock using explicit voice and language metadata; another voice or the closing announcement is never substituted. Missing matching audio or a Stock error is reported so you can create that voiceover or retry. People follow panorama movement and zoom. The CLI preserves /avatar digital good, /avatar digital better and /avatar digital best while typing; /aviso autocomplete never turns into /sincro. Enter runs the command and Shift+Enter adds a line; white label and the central avatar loader are retained.

| Persona / Person | Castellano / Spanish | Inglés / English |
|---|---|---|
| Chica / Woman | Sara Martín | Cassidy |
| Chico con gafas / Man with glasses | David Martín | James |

## Contrato / Contract

- `voice-receipts.js`: `XpaceVoiceReceipts.remember(receipt)`, `latest(voice,language)` y `get(voice,language)`. `voice`: `female|male`; `language`: `es|en`; cuatro últimos recibos independientes en `localStorage:xpaceos.voice-receipts.v1:<loc|store|project>`. IDs/URLs canónicos de Stock. No modifica PREVIOS ni su historial. / Four independent latest receipts; canonical Stock IDs/URLs; PREVIEWS history remains unchanged.
- `media-stock.js` y `voiceover-prompt.js` conservan la voz y el idioma del trabajo completado. Un borrador pendiente de otro idioma inicia un trabajo explícito distinto al generar. / Completed jobs retain voice and language; an explicitly generated different language uses a separate job.
- Recuperación histórica / Historical recovery: GET `https://api.admira.store/stock/list?type=locucion&limit=100`; sólo `type=locucion`, motor ElevenLabs, etiqueta `xpaceos` y comentario `Created in XpaceOS · female|male · es|en`. El audio histórico es el publicado desde XpaceOS en Stock compartido, pues esos recibos antiguos no registraban el Xpacio. Los nuevos recibos locales se separan por Xpacio. / Historical audio is published XpaceOS content in shared Stock because those older receipts did not record the Xpace; new local receipts are separated per Xpace.
- `matrix-person-announcements.mjs`: zonas calibradas de chico/chica en la captura Alsea, proyectadas con el mismo mapa esférico que las pantallas; Enter/Espacio del botón reproduce, segundo clic detiene. Cambio de persona/idioma y desmontaje invalidan una consulta tardía. / Calibrated staff body zones share the screen spherical projection; native button keyboard activation; stale reads cancelled on person/language change or disposal.
- `XpaceAnnouncements.playStock()` reutiliza el reproductor de tres lecturas; silencia temporalmente el hilo musical Matrix sin cambiar su selección. No POST de generación, micrófono ni emisión a player físico al pulsar. / Three saved-audio readings with Matrix music suppression; no synthesis POST, microphone or physical player publication on click.
- `expert-composer.mjs`: refresca la sugerencia del mismo prefijo; no convierte `/aviso` en `/sincro`. Los eventos del textarea se aíslan de los atajos de escena sin impedir Enter/Shift+Enter. Alias `/avatar digital good|better|best` normalizados por el shell existente y enviados al cargador de `admiranext.com/assets/avatar.js`; no reemplaza los modelos ni la integración Woz. / Same-prefix suggestions, scene-key isolation, existing shell aliases and central loader retained.

## Tutorial ES

1. Experto → Crear contenidos → Crear locución, elige idioma y voz y genera. Se guarda en Stock y PREVIOS sin emisión automática.
2. Cierra o reduce Experto para ver a las personas: chica para la voz femenina, chico para la masculina del idioma actual.
3. Pulsa de nuevo para detener, o pulsa la otra persona para cambiar. Si falta audio, crea una locución con la voz indicada.
4. Para cambiar el asistente: escribe `/avatar digital good`, `/avatar digital better` o `/avatar digital best` en el CLI y pulsa Enter.

## Tutorial EN

1. Expert → Create media → Create voiceover; choose language and voice, then generate. Stock and PREVIEWS save it without autoplay.
2. Close or reduce Expert to see the staff: the woman uses the female voice, the man the male voice of the current language.
3. Click again to stop or click the other person to switch. If no matching audio exists, create a voiceover with the indicated voice.
4. Type `/avatar digital good`, `/avatar digital better` or `/avatar digital best` in the CLI and press Enter to change the assistant.
