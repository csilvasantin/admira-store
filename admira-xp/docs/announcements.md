# Locuciones / Public Announcement System

## Castellano

Opciones → Locuciones: escribe el texto y pulsa Emitir locución. El navegador lo lee completo tres veces consecutivas con voz castellana (es-ES); en inglés, Public Announcement System → Make Announcement usa en-US. El contador muestra 1/3, 2/3, 3/3 y la finalización. Detener cancela la lectura y las repeticiones pendientes. Un nuevo envío sustituye al anterior. La música del gemelo baja durante la emisión y recupera su volumen al finalizar o detener. El texto se conserva al cambiar /idioma ESP o /idioma ENG. Si el audio maestro está silenciado, falta síntesis de voz o falla la reproducción, se muestra un error sin confirmar una emisión. Es audio local del navegador que reproduce la tienda virtual; no envía avisos a tiendas físicas ni contrata voces de pago. /comunicar y /aviso conservan sus funciones anteriores.

1. Abre Opciones y Locuciones.
2. Escribe el texto (hasta 1500 caracteres) en Texto de la locución.
3. Pulsa Emitir locución: comienza 1/3 y continúa automáticamente hasta Locución completada · 3/3.
4. Pulsa Detener para cancelar las lecturas restantes. Puedes editar y volver a emitir.

## English

Options → Public Announcement System: write the text and press Make Announcement. The browser reads the full text three times sequentially using an English voice (en-US); in Spanish, Locuciones → Emitir locución uses es-ES. The counter shows 1/3, 2/3, 3/3 and completion. Stop cancels the reading and pending repetitions. A new submission replaces the previous one. Twin music is lowered during playback and its volume restored on completion or stop. Text is retained when switching /idioma ESP or /idioma ENG. Master mute, unavailable speech synthesis or playback failures show an error without confirming playback. Audio plays locally in the browser running the virtual store; it does not send announcements to physical stores or purchase paid voices. /comunicar and /aviso retain their earlier behavior.

1. Open Options and Public Announcement System.
2. Enter your text (up to 1500 characters) in Announcement text.
3. Press Make Announcement: playback starts at 1/3 and continues automatically to Announcement complete · 3/3.
4. Press Stop to cancel remaining readings. You can edit and submit again.

## Contrato compartido / Shared contract

- Module: admira-xp/scripts/announcements.js. Local controller: window.XpaceAnnouncements.play(text, {language, muted}), stop(), state().
- UI IDs: #announcementText, #announcementTextLabel, #announcementStatus; existing actions data-xp-do="mega" and data-xp-do="megaStop" retained.
- Lifecycle: exactly three completed speech readings; fresh utterance for each repetition; 250 ms between readings. Stop, replacement, master mute and page exit invalidate pending callbacks. Speech errors stop the batch and restore music. No remote delivery acknowledgement.
- Voices: available es-ES/en-US voice, with same-language fallback and browser voice selection. Requires browser/OS speech synthesis and enabled audio; no microphone or API key.
- Music: #bgMusic and #starbucksMusic lowered temporarily without altering pause, mute or playback position. A volume changed during playback is retained.
- Content is retained in the editable field during interface language changes; a running batch keeps its starting voice language. No persistent text storage added.
- Scope: both public native /admira-xp/ twins, Good/Better/Best/Matrix native menu. No change to /comunicar, paid ElevenLabs CLI engine, remote Pixeria queue or Starbucks closing announcement /aviso.
- Stable guide: https://www.xpaceos.com/admira-xp/docs/announcements.md; Spanish mirror: https://www.admira.store/admira-xp/docs/announcements.md.
- MCP help topic: announcements or locuciones; existing resource xpaceos://help and https://mcp.admira.store/help. All 35 tools retained; no new tool or physical store integration.
