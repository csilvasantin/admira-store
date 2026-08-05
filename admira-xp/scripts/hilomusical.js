/* ===========================================================================
 * hilomusical.js — Enlace pixeria → gemelo (Xtanco): hilo musical del Xpacio.
 *
 * AUTÓNOMO: no toca la lógica del juego (index.html). Sondea la cola del worker
 * pixer-eleven (/hilomusical/next) y, cuando llega una canción nueva (generada en
 * pixeria y YA publicada en el Stock), la pone en #bgMusic al vuelo. La canción
 * vive en el Stock (inventario, type=music, tag 'hilo-<store>'), así que también
 * es emitible en los players y vendible; aquí solo la reproducimos en el gemelo.
 *
 * id de la tienda: window.MEGAFONIA_STORE › STORE_CFG.loc › ?store › ?loc › ?play › 'default'
 * Disparo manual: window.HILOMUSICAL.add(sourceUrl, title)
 * ========================================================================= */
(function () {
  'use strict';
  if (window.HILOMUSICAL && window.HILOMUSICAL.__on) return;
  var API = 'https://api.admira.store';
  var POLL_MS = 6000;

  function storeId() {
    try {
      if (window.MEGAFONIA_STORE) return String(window.MEGAFONIA_STORE);
      var cfg = window.STORE_CFG || {};
      if (cfg.loc) return String(cfg.loc);
      var qs = new URLSearchParams(location.search);
      return qs.get('store') || qs.get('loc') || qs.get('play') || 'default';
    } catch (e) { return 'default'; }
  }

  var since = null;          // baseline = reloj del SERVIDOR (sin skew, sin repetir cola vieja)
  function bgMusicEl() { return document.getElementById('bgMusic'); }

  function playSong(item) {
    var m = bgMusicEl(); if (!m || !item || !item.url) return;
    try {
      m.src = item.url;      // el asset de Stock es reproducible (audio/mpeg)
      m.loop = true;         // el nuevo tema queda como hilo del Xpacio
      m.load();
      var p = m.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
    window.HILOMUSICAL.now = item;
    try { if (typeof showEv === 'function') showEv('🎵 Hilo musical: ' + String(item.title || '').slice(0, 50), '#8cffbd'); } catch (e) {}
  }

  function poll() {
    fetch(API + '/hilomusical/next?store=' + encodeURIComponent(storeId()) + '&since=' + (since == null ? 0 : since), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d) return;
        if (d.playlist) window.HILOMUSICAL.playlist = d.playlist;
        if (since == null) { since = d.now || Date.now(); return; }   // 1er poll: baseline
        if (d.pending && d.pending.length) {
          d.pending.forEach(function (e) { if (e.ts > since) since = e.ts; });
          playSong(d.pending[d.pending.length - 1]);                 // la más reciente
        }
      })
      .catch(function () {});
  }

  window.HILOMUSICAL = {
    __on: true, now: null, playlist: [], storeId: storeId, poll: poll,
    // Disparo manual: publica al Stock + encola (misma vía que el panel de pixeria).
    add: function (sourceUrl, title) {
      return fetch(API + '/hilomusical/push', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: storeId(), sourceUrl: sourceUrl, title: title || 'Canción', motor: 'manual' })
      }).then(function () { setTimeout(poll, 1000); }).catch(function () {});
    }
  };

  setInterval(poll, POLL_MS);
  poll();
})();
