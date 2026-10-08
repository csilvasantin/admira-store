# Starbucks · Arranque y avisos / Startup and announcements

ES: Cada entrada a Starbucks empieza con el tótem en modo quiosco de pedido y las seis pantallas de pared reproduciendo su playlist Starbucks. Un avatar elegido anteriormente no cambia ese arranque: /avatar good|better|best on o /totem off permite activarlo durante la visita; /totem on vuelve al quiosco. Se conserva el nivel elegido. La cesta y las botellas retiradas se conservan al recargar, pero la oferta del agua solo aparece tras una entrega en la visita actual; Recargar playlist o Reset la retira y recupera la programación. Cada pedido nuevo que pasa a Preparado se anuncia una vez en castellano (es-ES) y después una vez en inglés (en-GB), independientemente del idioma de la interfaz, esperando el final de cada voz. Se deduplica por ID del pedido; los que ya estaban listos al abrir no se anuncian. Sin nombre se usa el número. El gemelo es el emisor único: el iPad integrado usa voz=0 y los mensajes de aviso listo de experiencias incrustadas se acusan sin volver a locutarlos. /totem audio off y /audio mute paran los avisos; al reactivar no se repiten los pedidos ya vistos. No cambia la cola ni el contenido publicado por MCP, las reglas del agua, el stock comercial ni dispositivos físicos.

EN: Each Starbucks entry starts with the totem in ordering-kiosk mode and all six wall screens playing their Starbucks playlist. A previously selected avatar does not change this startup: /avatar good|better|best on or /totem off enables it during the visit; /totem on restores the kiosk. The selected tier is retained. The basket and removed bottles survive reloads, but the water offer appears only after a delivery in the current visit; Reload playlist or Reset removes it and restores the schedule. Each newly ready order is announced once in Spanish (es-ES), then once in English (en-GB), regardless of interface language, waiting for each voice to finish. Orders are deduplicated by order ID; orders already ready on entry are not announced. Without a name, the order number is used. The twin is the single announcer: the embedded iPad uses voz=0 and ready-order speech requests from embedded experiences are acknowledged without speaking again. /totem audio off and /audio mute stop announcements; enabling audio does not repeat seen orders. Shared MCP queues/content, water rules, commercial stock and physical devices are preserved.

## Tutorial ES

1. Abre Starbucks, también con project=starbucks sin loc: el tótem muestra el quiosco y la pared reproduce vídeo.
2. Si quieres un avatar, abre Experto y ejecuta /avatar best on (o good/better). /totem on recupera el quiosco. Al recargar vuelve el arranque de quiosco, conservando el nivel elegido.
3. Lleva agua a la caja para mostrar su oferta vertical en la pared y horizontal en iPad. Recargar playlist o Reset recupera la programación. Recargar la página conserva la cesta y abre con playlist.
4. Crea un pedido de demostración en el quiosco y pásalo a Preparado desde el gestor de colas: se oye una frase castellana y luego una inglesa. /totem audio off para los avisos.

## Tutorial EN

1. Open Starbucks, including project=starbucks without loc: the totem shows the kiosk and the wall plays video.
2. To use an avatar, open Expert and run /avatar best on (or good/better). /totem on restores the kiosk. Reload starts in kiosk mode while retaining the selected tier.
3. Deliver water to the register to show the portrait wall offer and landscape iPad offer. Reload playlist or Reset restores the schedule. Reloading the page retains the basket and starts with playlist playback.
4. Create a demo kiosk order and mark it Ready in the queue manager: one Spanish phrase plays, followed by one English phrase. /totem audio off stops announcements.

## Contrato / Contract

- Local scene IDs: starbucks-avatar-wall; starbucks-wall-01–06; starbucks-ipad-01.
- Source modules: totem-kiosko.js, matrix-wall-avatar.mjs, matrix-pos-experience.mjs, matrix-panorama.mjs, ipad-cola.js.
- Kiosk: https://www.ainimation.studio/xperiencias/kiosko-pedido/?store=starbucks-paseo-de-gracia&marca=starbucks ; wall iframe 400×900, vertical. Custom URLs and chosen tiers remain available.
- Queue: https://mcp-ainimation.admira.store/cola/estado?store=starbucks-paseo-de-gracia ; poll 3 s, initial-ready snapshot excluded, identity id with numero fallback. One announcer per twin page, not a global lock across independent tabs/devices.
- Voice: Spanish via existing ElevenLabs proxy with browser es-ES fallback; English browser en-GB. Real ended/error events advance the sequence; startup timeout and 20-second watchdog avoid a stuck queue. Mute/reset invalidates the pending sequence.
- Embedded expanded queue display: https://admira.tv/gestorColas/pantalla/?marca=starbucks&voz=0 ; the parent twin owns both languages. Standalone display remains independent.
- Wall source playlist starbucks-alsea-paseo-de-gracia-wall and existing shared MCP assignments/controls remain authoritative. No playlist contents, paid generation, physical player publishing, commercial inventory or payment changes.
- Basket storage retained: sessionStorage xpaceos.pos-basket.v1:alsea-sbux-021:starbucks-tpv-01. Water offer activation belongs to the current mounted visit; it is not restored from basket quantity alone.
- Previous localStorage xpace:totem-interactivo remains for other Xpaces. Starbucks starts in kiosk per page; explicit changes apply immediately during that page. Avatar tier keys are preserved.
- MCP help: starbucks-defaults, resource xpaceos://help. Existing 35 tools; no new tool.
