/* ===========================================================================
 * hilomusical.js — Enlace pixeria → gemelo (Xtanco): hilo musical del Xpacio.
 *
 * AUTÓNOMO: no toca la lógica del juego (index.html). Sondea la cola del worker
 * pixer-eleven (/hilomusical/next) y, cuando llega una canción nueva (generada en
 * pixeria y YA publicada en el Stock), la deja en el previo de Opciones, sin cambiar #bgMusic. La canción
 * vive en el Stock (inventario, type=music, tag 'hilo-<store>'), así que también
 * es emitible en los players y vendible; Lanzar la añade explícitamente al hilo del gemelo.
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

  // created=true: entrega NUEVA de Pixeria (Crear música) → también se abre en PREVIOS del Experto.
  function previewSong(item, created) {
    if (!item || !item.id || !item.url) return;
    try { window.XpaceMediaOptions?.stage('music', item, { created: !!created }); } catch (_) {}
  }

  function poll() {
    fetch(API + '/hilomusical/next?store=' + encodeURIComponent(storeId()) + '&since=' + (since == null ? 0 : since), { cache: 'no-store' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!d) return;
        if (d.playlist) window.HILOMUSICAL.playlist = d.playlist;
        if (since == null) { since = d.now || Date.now(); if (!window.XpaceMediaOptions?.get('music') && d.playlist?.length) previewSong(d.playlist[d.playlist.length - 1]); return; }   // 1er poll: baseline
        if (d.pending && d.pending.length) {
          d.pending.forEach(function (e) { if (e.ts > since) since = e.ts; });
          previewSong(d.pending[d.pending.length - 1], true);           // la más reciente
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
      }).then(function (r) { if (!r.ok) throw Error('Stock unavailable'); return r.json(); }).then(function (item) { previewSong(item, true); return item; }).catch(function () {});
    }
  };

  setInterval(poll, POLL_MS);
  poll();
})();
