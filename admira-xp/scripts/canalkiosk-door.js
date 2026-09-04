/* ============================================================================
 * canalkiosk-door.js v4 — La puerta del Xtanco reproduce el CanalKiosk EXACTO.
 * ----------------------------------------------------------------------------
 * Player real de la parrilla (grid/day, screen sim-gracia-kiosko): mismo orden
 * de emisión y mismo ritmo (slotSeconds, 10 s/pieza), con el VÍDEO de verdad
 * pintado en la puerta (window.__doorMedia → drawExteriorAd). El índice es
 * determinista (reloj ÷ periodo), así la puerta y el kiosko van a la par.
 * Fallback por pieza: thumbnail del Stock. Una campaña real comprada del
 * marketplace sigue mandando sobre el canal. (Carlos, 14-jul-2026)
 * ========================================================================== */
(function () {
  if (typeof window === 'undefined') return;
  if (window.__CANALKIOSK_DOOR === '4') return; window.__CANALKIOSK_DOOR = '4';
  var GRID  = 'https://api.admira.store/grid/day?screen=sim-gracia-kiosko';
  // Dominio propio: LaLiga bloquea workers.dev/r2.dev en horas de fútbol (FLT-1633).
  var STOCK = 'https://stock.admira.store/stock/index.json';
  var items = [], thumbs = {}, period = 10000, curIdx = -1;
  var vid = document.createElement('video');
  vid.muted = true; vid.playsInline = true; vid.crossOrigin = 'anonymous'; vid.preload = 'auto'; vid.loop = true;
  var imgs = {};
  function im(u){ var x=imgs[u]; if(!x){ x=new Image(); x.crossOrigin='anonymous'; x.src=u; imgs[u]=x; } return x; }
  function tickPlay(){
    if (!items.length){ window.__doorMedia = null; return; }
    var idx = Math.floor(Date.now() / period) % items.length;
    var it = items[idx];
    if (curIdx !== idx){
      curIdx = idx;
      if (it.type === 'video'){ try{ vid.src = it.url; var p = vid.play(); if (p && p.catch) p.catch(function(){}); }catch(e){} }
      else { try{ vid.pause(); }catch(e){} }
    }
    var el = null;
    if (it.type === 'video' && vid.readyState >= 2) el = vid;
    else if (it.type === 'image') el = im(it.url);
    else if (it.thumb) el = im(it.thumb);
    if (el && !(el.videoWidth || el.naturalWidth)) el = it.thumb ? im(it.thumb) : null;
    window.__doorMedia = { el: el, title: it.title };
  }
  function load(){
    try {
      var pS = fetch(STOCK, { cache: 'no-store' }).then(function(r){ return r.json(); }).then(function(j){
        (j.items || []).forEach(function(x){ if (x && x.id && x.thumbnail) thumbs[x.id] = x.thumbnail; });
      }).catch(function(){});
      var pG = fetch(GRID, { cache: 'no-store' }).then(function(r){ return r.json(); });
      Promise.all([pS, pG]).then(function(rs){
        var gd = rs[1] || {};
        try{ var ss = gd.config && gd.config.slotSeconds; if (ss > 0) period = ss * 1000; }catch(e){}
        var band = (gd.bands || []).find(function(b){ return b.isNow; }) || (gd.bands || [])[0];
        var seen = {};
        items = ((band && band.slots) || []).filter(function(s){
          if (!((s.kind === 'own' || s.kind === 'paid') && s.creative && s.creative.url)) return false;
          if (s.bookingId){ if (seen[s.bookingId]) return false; seen[s.bookingId] = 1; }
          return true;
        }).map(function(s){
          return {
            url: s.creative.url.replace(/^https:\/\/www\.admira\.tv\//, 'https://admira.tv/'),
            type: s.creative.type || 'image',
            title: s.title || (s.creative && s.creative.name) || 'Parrilla',
            thumb: (s.stockId && thumbs[s.stockId]) || '',
            position: Number.isFinite(s.position) ? s.position : 9999,
          };
        }).sort(function(a,b){ return a.position - b.position; });
        curIdx = -1;
      }).catch(function(){});
    } catch (e) {}
  }
  load(); setInterval(load, 60000); setInterval(tickPlay, 300);
})();
