/* ============================================================================
 * circuito-nav.js — Gemelo por punto de un circuito de admira.app (FLT-101349).
 * ----------------------------------------------------------------------------
 * 1) ORIENTACIÓN POR PANTALLA. Cada surface del punto (KV omnipublicity) puede
 *    declarar `orient: 'vertical' | 'horizontal'`. La pantalla larga (TFT del
 *    mostrador) se queda la primera horizontal; el resto va, en orden, a las
 *    pantallas DS de la pared corta. Una DS vertical se dibuja 9:16 y una
 *    horizontal 16:9 dentro de su tramo de pared (mismo quad para el div y para
 *    el hueco del canvas). Sin `orient` → comportamiento de siempre. Si todas
 *    traen `media` (vídeo del Stock adaptado), cada una va a una DS y lo reproduce.
 *    `&media=formatos18` (o `&mv=`/`&mh=`) sustituye esa media por orientación.
 * 2) ANTERIOR / SIGUIENTE entre los puntos del circuito, en su `tourOrder`
 *    (como el recorrido de admira.app / CanalKiosk): HUD inferior, teclas
 *    [ y ], y `&tour=<segundos>` para el recorrido automático.
 * Se inyecta desde xtanco-runtime-config.js (index.html lo regenera el sync).
 * ========================================================================== */
(function () {
  if (typeof window === 'undefined' || window.__CIRCUITO_NAV) return;
  window.__CIRCUITO_NAV = '1';
  var qs = new URLSearchParams(location.search);
  var LOC = (qs.get('loc') || '').trim().toLowerCase();
  if (!LOC) return;

  // ── 1) Orientación ────────────────────────────────────────────────────────
  // `&media=formatos18` (o `&mv=<url>` / `&mh=<url>`) sustituye el vídeo de cada
  // pantalla según su orientación: vertical → 9:16, horizontal → 16:9. El preset
  // `formatos18` usa los renders 01-vertical / 02-horizontal de los 18 formatos
  // Altadis servidos con el propio sitio (/altadis/media/). Sin parámetro → la
  // media de la ficha del punto, como siempre. La navegación conserva el parámetro.
  var MEDIA_PRESETS = {
    formatos18: { vertical: '/altadis/media/01-vertical-1080x1920.mp4', horizontal: '/altadis/media/02-horizontal-1920x1080.mp4' }
  };
  function okUrl(u) { return typeof u === 'string' && (/^https:\/\//.test(u) || /^\/[^\/]/.test(u)); }
  var MEDIA_OVR = (function () {
    var o = Object.assign({}, MEDIA_PRESETS[(qs.get('media') || '').trim().toLowerCase()] || {});
    if (okUrl(qs.get('mv'))) o.vertical = qs.get('mv');
    if (okUrl(qs.get('mh'))) o.horizontal = qs.get('mh');
    return (o.vertical || o.horizontal) ? o : null;
  })();
  window.circuitoMediaOverride = MEDIA_OVR;
  function screenSurfaces() {
    var c = window.STORE_CFG; if (!c || !Array.isArray(c.surfaces)) return [];
    var ss = c.surfaces.filter(function (s) { return s && (s.surface === 'pantalla' || s.surface === 'escaparate'); });
    if (MEDIA_OVR) ss.forEach(function (s) { var u = MEDIA_OVR[s.orient]; if (u && s.media !== u) { s.mediaFicha = s.mediaFicha || s.media || ''; s.media = u; } });
    return ss;
  }
  // Si TODAS las pantallas del punto traen `media` (vídeo del Stock ya adaptado a
  // su formato), cada una va a una DS de pared corta con su vídeo; la TFT larga
  // sigue con su contenido de siempre.
  function allMedia() { var ss = screenSurfaces(); return ss.length > 0 && ss.length <= 2 && ss.every(function (s) { return okUrl(s.media); }); }
  // Orientaciones de las DS de pared corta (índice 0, 1).
  function dsOrients() {
    var o = screenSurfaces().map(function (s) { return s.orient || ''; });
    if (!o.some(Boolean)) return [];
    if (allMedia()) return o;
    var iH = o.indexOf('horizontal'); if (iH >= 0) o.splice(iH, 1); else o.shift();
    return o;
  }
  window.circuitoDsOrients = dsOrients;
  // Quad en coordenadas internas del canvas: {x, y, w, h, skew}.
  function dsQuad(i) {
    var sc = DS_SCREENS[i]; if (!sc) return null;
    var pT = toIso(0, sc.rowT), pB = toIso(0, sc.rowB);
    var midWallFrac = 0.12, H0 = ISO.wallH * 0.75;
    var x1 = pB.x, y1 = pB.y - ISO.wallH + ISO.wallH * midWallFrac;
    var x2 = pT.x, y2 = pT.y - ISO.wallH + ISO.wallH * midWallFrac;
    var mw = x2 - x1, t0 = 0, t1 = 1, h = H0, dy = 0;
    var or = dsOrients()[i] || '';
    if (or === 'vertical') { var w = Math.min(mw, H0 * 9 / 16 * 1.15); t0 = (1 - w / mw) / 2; t1 = t0 + w / mw; }
    else if (or === 'horizontal') { h = Math.min(H0, mw * 9 / 16); dy = (H0 - h) * 0.35; }
    return { x: x1 + (x2 - x1) * t0, y: y1 + (y2 - y1) * t0 + dy, w: mw * (t1 - t0), h: h, dyw: (y2 - y1) * (t1 - t0), skew: Math.atan2(pT.y - pB.y, pT.x - pB.x) * 180 / Math.PI, or: or };
  }
  function install() {
    if (typeof positionDSOnLeftWall !== 'function' || typeof punchDsScreenHoles !== 'function' || typeof DS_SCREENS === 'undefined') return false;
    var origPos = positionDSOnLeftWall, origPunch = punchDsScreenHoles;
    window.positionDSOnLeftWall = function (el, rowT, rowB) {
      var i = DS_SCREENS.findIndex(function (s) { return s.rowT === rowT && s.rowB === rowB; });
      if (i < 0 || !dsOrients()[i]) return origPos(el, rowT, rowB);
      var q = dsQuad(i), r = cv.getBoundingClientRect(), sx = r.width / W, sy = r.height / H;
      el.style.display = 'block';
      el.style.left = (r.left + q.x * sx) + 'px'; el.style.top = (r.top + q.y * sy) + 'px';
      el.style.width = (q.w * sx) + 'px'; el.style.height = (q.h * sy) + 'px';
      el.style.transformOrigin = 'bottom left'; el.style.transform = 'skewY(' + q.skew + 'deg)';
      el.dataset.orient = q.or;
      var sf = allMedia() ? screenSurfaces()[i] : null;
      if (sf) {
        var mv = el.querySelector('video.circuito-media');
        if (!mv) { mv = document.createElement('video'); mv.className = 'circuito-media'; mv.muted = true; mv.loop = true; mv.playsInline = true; mv.autoplay = true; mv.setAttribute('playsinline', ''); mv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:2;background:#000'; el.appendChild(mv); }
        if (mv.getAttribute('src') !== sf.media) { mv.setAttribute('src', sf.media); var pr = mv.play(); if (pr && pr.catch) pr.catch(function () {}); }
      }
      try { var v = el.querySelector('video') || (el.tagName === 'VIDEO' ? el : null); if (v) v.style.objectFit = 'cover'; } catch (e) {}
    };
    window.punchDsScreenHoles = function () {
      if (!dsOrients().length) return origPunch();
      if (typeof state !== 'undefined' && typeof S !== 'undefined' && state !== S.GAME) return;
      [videoEl, videoEl2].forEach(function (el, i) {
        if (!el || el.style.display === 'none') return;
        var q = dsQuad(i); if (!q) return;
        cx.save(); cx.globalCompositeOperation = 'destination-out'; cx.beginPath();
        cx.moveTo(q.x, q.y); cx.lineTo(q.x + q.w, q.y + q.dyw); cx.lineTo(q.x + q.w, q.y + q.dyw + q.h); cx.lineTo(q.x, q.y + q.h);
        cx.closePath(); cx.fill(); cx.restore();
      });
    };
    return true;
  }
  // Con vídeo propio en cada pantalla se muestran tantas DS como pantallas tenga el punto.
  function ensureScreens() { var c = window.STORE_CFG; if (c && allMedia()) { var n = screenSurfaces().length + 1; if ((c.screens | 0) < n) c.screens = n; } }
  window.addEventListener('storecfg', ensureScreens); setTimeout(ensureScreens, 0);
  (function waitInstall(n) { if (!install() && n < 80) setTimeout(function () { waitInstall(n + 1); }, 250); })(0);

  // ── 2) Anterior / siguiente ──────────────────────────────────────────────
  var API = 'https://api.admira.store/da/locations';
  function goTo(id) {
    var p = new URLSearchParams(location.search); p.set('loc', id);
    if (/^altadis-bcn-\d+$/.test(id)) { p.set('autostart', 'xtanco'); if (!p.get('project')) p.set('project', 'estancos'); }
    else if (!p.get('autostart')) p.set('autostart', 'xtanco');
    location.href = location.pathname + '?' + p.toString() + location.hash;
  }
  function hud(items, idx, tourSec) {
    var cur = items[idx], prev = items[(idx - 1 + items.length) % items.length], next = items[(idx + 1) % items.length];
    var d = document.createElement('div'); d.id = 'circuito-nav';
    d.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99990;display:flex;gap:8px;align-items:center;' +
      'background:rgba(8,10,16,.88);color:#e8ecf3;border:1px solid #ff6a3d;border-radius:999px;padding:6px 10px;font:600 12px system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.5)';
    var b = 'background:#1b2030;color:#e8ecf3;border:1px solid #39415a;border-radius:999px;padding:5px 11px;cursor:pointer;font:inherit';
    var ors = screenSurfaces().map(function (s) { return s.orient === 'vertical' ? '▯ vertical' : s.orient === 'horizontal' ? '▭ horizontal' : ''; }).filter(Boolean).join(' + ');
    d.innerHTML = '<button data-go="prev" style="' + b + '" title="Anterior ([)">◀ ' + (prev.tourOrder || '') + '</button>' +
      '<span style="padding:0 6px;text-align:center;line-height:1.25"><span style="color:#ff6a3d">' + (cur.circuitLabel || cur.circuit) + '</span> · ' + (idx + 1) + '/' + items.length +
      '<br><span style="font-weight:400">' + (cur.name || cur.id) + (ors ? ' · ' + ors : '') + (MEDIA_OVR ? ' · <span style="color:#ff6a3d">pieza JTI 9:16 / 16:9</span>' : '') + '</span></span>' +
      '<button data-go="tour" style="' + b + '">' + (tourSec ? '■' : '▶ Recorrido') + '</button>' +
      '<button data-go="next" style="' + b + '" title="Siguiente (])">' + (next.tourOrder || '') + ' ▶</button>';
    d.addEventListener('click', function (ev) {
      var g = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-go'); if (!g) return;
      if (g === 'prev') goTo(prev.id);
      else if (g === 'next') goTo(next.id);
      else { var p = new URLSearchParams(location.search); if (tourSec) p.delete('tour'); else p.set('tour', '12'); location.search = p.toString(); }
    });
    document.body.appendChild(d);
    document.addEventListener('keydown', function (ev) {
      if (/INPUT|TEXTAREA/.test((ev.target && ev.target.tagName) || '')) return;
      if (ev.key === '[') goTo(prev.id); if (ev.key === ']') goTo(next.id);
    });
    if (tourSec) setTimeout(function () { goTo(next.id); }, tourSec * 1000);
  }
  fetch(API, { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (d) {
    var list = (d && Array.isArray(d.locations)) ? d.locations : [];
    var me = list.find(function (x) { return x && String(x.id).toLowerCase() === LOC; });
    if (!me || !me.circuit || !Number.isFinite(me.tourOrder)) return;
    var items = list.filter(function (x) { return x && x.circuit === me.circuit && Number.isFinite(x.tourOrder); })
      .sort(function (a, b) { return a.tourOrder - b.tourOrder; });
    if (items.length < 2) return;
    var idx = items.findIndex(function (x) { return x.id === me.id; });
    var tourSec = Math.max(0, Math.min(600, parseInt(qs.get('tour') || '0', 10) || 0));
    var label = { altadis_bcn: 'Altadis · Estancos Barcelona', alsea_mexico: 'Alsea México' }[me.circuit];
    items.forEach(function (x) { x.circuitLabel = label || me.circuit; });
    var waited = 0; // espera a STORE_CFG (orientaciones de pantalla) hasta ~6 s
    var mount = function () { if (!window.STORE_CFG_READY && !screenSurfaces().length && waited++ < 30) return setTimeout(mount, 200); hud(items, idx, tourSec); };
    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  }).catch(function () {});
})();
