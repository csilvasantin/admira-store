# Locuciones / Public Announcement System

## Castellano

Opciones → Locuciones: escribe el texto, elige Femenina · Sara Martín o Masculina · David Martín (castellano de España, es-ES) y pulsa Emitir locución. ElevenLabs genera el audio una sola vez con Eleven v4 a 44,1 kHz y 192 kbps (máxima salida del plan Creator); el navegador lo reproduce tres veces. Requiere sesión autorizada de admira.store/XpaceOS y consume créditos en la generación, no en las tres lecturas. La opción Voz local del navegador sigue siendo gratuita y usa es-ES o en-US según el idioma. El contador muestra 1/3, 2/3 y 3/3; Detener cancela la generación local pendiente y las repeticiones. La elección se recuerda en este navegador. La música baja durante la reproducción y recupera su volumen al terminar, detener o fallar. El texto se conserva al cambiar de idioma. Un fallo o audio silenciado se muestra como error, sin confirmar emisión ni sustituir silenciosamente la voz. Es reproducción local en la tienda virtual; no emite a tiendas físicas. /comunicar y /aviso conservan su función.

1. Abre Opciones → Locuciones.
2. Elige Sara Martín o David Martín.
3. Escribe hasta 1500 caracteres y pulsa Emitir locución. Si se pide sesión, usa Iniciar sesión y vuelve al gemelo.
4. Espera la preparación y las tres lecturas, o pulsa Detener.

## English

Options → Public Announcement System: enter the text, choose Female · Sara Martín or Male · David Martín (Castilian Spanish from Spain, es-ES), then press Make Announcement. ElevenLabs generates the audio once with Eleven v4 at 44.1 kHz and 192 kbps (the maximum output for the Creator plan); the browser plays it three times. An authorized admira.store/XpaceOS session is required; generation spends credits, the three readings do not. The free Local browser voice remains available and uses es-ES or en-US according to the interface language. The counter shows 1/3, 2/3 and 3/3; Stop cancels the pending local generation request and remaining repetitions. Voice choice is remembered in this browser. Music is lowered during playback and restored on completion, stop or failure. Text is retained across language changes. Failures or master mute show an error without confirming playback or silently replacing the voice. Playback is local to the virtual store; it does not broadcast to physical stores. /comunicar and /aviso retain their behavior.

1. Open Options → Public Announcement System.
2. Choose Sara Martín or David Martín.
3. Enter up to 1500 characters and press Make Announcement. If required, Sign in and return to the twin.
4. Wait for preparation and all three readings, or press Stop.

## Contrato compartido / Shared contract

- Controller: `window.XpaceAnnouncements.play(text,{language,muted,voice})`, `stop()`, `state()`. Voice values: `female`, `male`, `browser`.
- UI: `#announcementText`, `#announcementVoice`, `#announcementStatus`, actions `mega` and `megaStop`. Preference key: `xpace-announcement-voice-v1`.
- Same-origin POST `/admira-xp/announcement-tts` accepts `{text,voice}`. Mandatory existing perimeter session and same-origin request. Only the two fixed voice IDs are allowed; 1500 characters maximum. Keys never reach the browser.
- Female: Sara Martín, Gentle and Layered, `KHCvMklQZZo0O30ERnVn`. Male: David Martín, Confident and Balanced, `Nh2zY9kknu6z4pZy6FhD`. Both native Castilian Spanish from Spain. Source: https://elevenlabs.io/text-to-speech/spanish .
- Server: private `AnnouncementTts` entrypoint (`pixer-eleven`), ElevenLabs `eleven_v4` through `/v1/text-to-dialogue`, `language_code=es`, `mp3_44100_192`. Existing Creator tier supports 192 kbps; lossless 44.1 kHz needs Pro, no plan upgrade performed. Source: https://elevenlabs.io/docs/api-reference/text-to-dialogue/convert .
- One audio generation per submission, reused for exactly three completed readings with 250 ms gaps. Stop/replacement/master mute/page exit abort the pending browser request, invalidate callbacks, release blob URLs and restore music. A generation already accepted by ElevenLabs may still consume credits after cancellation.
- Both music players retain position, mute and pause state; volume changes made during playback are retained. No silent fallback from premium to browser voice.
- `ANNOUNCEMENT_TTS` is a private Cloudflare service binding to the named `AnnouncementTts` entrypoint in `pixer-eleven`. It only accepts these two voices and 1500 characters. The Pages proxy validates the signed perimeter session and origin before invoking it. No service credential is copied into Pages; the ElevenLabs key remains in its existing Worker.
- Spanish mirror: https://www.admira.store/admira-xp/docs/announcements.md . Source: https://www.xpaceos.com/admira-xp/docs/announcements.md . MCP help topic: announcements/locuciones; xpaceos://help; https://mcp.admira.store/help . All 35 tools retained. No physical store integration.

## Configuración y validación / Configuration and validation

El enlace privado `ANNOUNCEMENT_TTS` está configurado en admira.store y XpaceOS. Ambas voces se han generado realmente con Eleven v4 a MP3 44,1 kHz/192 kbps. Las pruebas cubren tres lecturas, cancelación, restauración de música y el control de sesión/origen. La versión desplegada se consulta en `/version.json`; la reproducción requiere sesión autorizada y audio habilitado. Seguimiento: misión FLT-101624 · voces españolas para Locuciones.

The private `ANNOUNCEMENT_TTS` binding is configured in admira.store and XpaceOS. Both voices have been generated with Eleven v4 at MP3 44.1 kHz/192 kbps. Tests cover three readings, cancellation, music restoration and session/origin checks. The deployed release is available at `/version.json`; playback requires an authorized session and enabled audio. Tracking: mission FLT-101624 · Spanish voices for announcements.
