/* ===========================================================================
 * megafonia.js — Enlace pixeria → gemelo (Xtanco): avisos de audio (megafonía).
 *
 * AUTÓNOMO: no toca la lógica del juego (index.html). Sondea la cola de avisos
 * del worker pixer-eleven (/megafonia/next) y, cuando llega uno nuevo, BAJA la
 * música de fondo (#bgMusic) y reproduce el aviso TTS (cualquier voz/idioma,
 * generado en pixeria con ElevenLabs), restaurando la música al terminar.
 *
 * Flujo: pixeria/megafonia.html → POST /megafonia/push (genera mp3 + encola)
 *        gemelo (este script) → GET /megafonia/next → reproduce con ducking.
 *
 * id de la tienda: window.MEGAFONIA_STORE › STORE_CFG.loc › ?store › ?loc › ?play › 'default'
 * Disparo manual local: window.MEGAFONIA.say('texto', 'voice_id'?, 'lang'?)
 * ========================================================================= */
(function () {
  'use strict';
  if (window.MEGAFONIA && window.MEGAFONIA.__on) return;
  var API = 'https://api.admira.store';
  var POLL_MS = 4000;

  function storeId() {
    try {
      if (window.MEGAFONIA_STORE) return String(window.MEGAFONIA_STORE);
      var cfg = window.STORE_CFG || {};
      if (cfg.loc) return String(cfg.loc);
      var qs = new URLSearchParams(location.search);
      return qs.get('store') || qs.get('loc') || qs.get('play') || 'default';
    } catch (e) { return 'default'; }
  }

  var since = null;          // baseline = reloj del SERVIDOR en el 1er poll (sin skew)
  var playing = false;
  var queue = [];

  function bgMusicEl() { return document.getElementById('bgMusic'); }

  // Ducking: guarda el volumen y lo baja mientras suena el aviso; lo restaura al final.
  function duck(on) {
    var m = bgMusicEl(); if (!m) return;
    try {
      if (on) { if (m._megaPrevVol == null) m._megaPrevVol = m.volume; m.volume = Math.min(m.volume, 0.06); }
      else if (m._megaPrevVol != null) { m.volume = m._megaPrevVol; m._megaPrevVol = null; }
    } catch (e) {}
  }

  function playNext() {
    if (playing) return;
    var item = queue.shift(); if (!item) return;
    playing = true; duck(true);
    var a = new Audio(item.url);
    try { a.muted = !!window.dsMasterMute; } catch (e) {}   // respeta el mute maestro /audio
    var done = function () { if (!playing) return; playing = false; duck(false); setTimeout(playNext, 250); };
    a.addEventListener('ended', done);
    a.addEventListener('error', done);
    a.play().catch(done);
    try { if (typeof showEv === 'function') showEv('📢 Megafonía: ' + String(item.text || '').slice(0, 60), '#8cffbd'); } catch (e) {}
    window.MEGAFONIA.last = item;
  }

  function poll() {
    fetch(API + '/megafonia/next?store=' + encodeURIComponent(storeId()) + '&since=' + (since == null ? 0 : since), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d) return;
        if (since == null) { since = d.now || Date.now(); return; }   // 1er poll: no repite cola vieja
        if (d.pending && d.pending.length) {
          d.pending.forEach(function (e) { queue.push(e); if (e.ts > since) since = e.ts; });
          playNext();
        }
      })
      .catch(function () {});
  }

  window.MEGAFONIA = {
    __on: true, last: null, storeId: storeId, poll: poll,
    // Disparo manual: genera el aviso y lo reproduce (útil por consola/StreamDeck).
    say: function (text, voice_id, lang) {
      return fetch(API + '/megafonia/push', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: storeId(), text: text, voice_id: voice_id || undefined, lang: lang || undefined })
      }).then(function () { setTimeout(poll, 800); }).catch(function () {});
    }
  };

  setInterval(poll, POLL_MS);
  poll();
})();
