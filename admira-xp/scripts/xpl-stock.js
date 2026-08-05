/* ============================================================================
 * XPL · resolver del STOCK real (Pixeria)  —  window.XPLStock
 * ----------------------------------------------------------------------------
 * El puente entre el lenguaje de reglas (XPL) y el CONTENIDO REAL de Pixeria.
 * La acción `showContent` del runtime no pinta una creatividad de juguete:
 * pide aquí un ASSET real del Stock (R2) que case con el segmento de la regla.
 *
 * Fuente = el índice vivo del worker pixer-eleven, servido por dominio propio
 * `api.admira.store/stock/list` (evita el 401 de R2 directo y el bloqueo ISP-ES).
 *
 * Una única fuente de verdad: esta misma lógica de pooling (audience → edad →
 * franja → categoría → keywords → todo) la estrenó el "Target Publicity" del
 * gemelo (pickCreative); aquí queda extraída y reutilizable por XPL y por la TV.
 *
 *   XPLStock.ensure()                  -> Promise<items[]>   (carga + caché)
 *   XPLStock.pick({category,audience,age,timeSlot,tag,type}) -> asset | null (sync, sobre caché)
 *   XPLStock.pickAsync(query)          -> Promise<asset|null> (asegura carga y elige)
 *   XPLStock.ready()                   -> bool   ·  XPLStock.count() -> n
 *
 * Vanilla JS, sin build. Se carga ANTES de xpl-gemelo.js.
 * ========================================================================== */
(function (root) {
  'use strict';
  if (root.XPLStock) return; // idempotente

  var SOURCE   = 'https://api.admira.store/stock/list?limit=200';
  var LS_CACHE = 'xpl_stock_cache';   // { ts, items }
  var TTL_MS   = 10 * 60 * 1000;      // 10 min — el stock no cambia cada segundo
  var RENDERABLE = { image: 1, video: 1, animation: 1 };

  var ITEMS = [];        // assets renderizables ya filtrados
  var loadedAt = 0;      // timestamp del último índice en memoria
  var inflight = null;   // Promise de carga en curso (dedupe)
  var recent = [];       // ids servidos hace poco (anti-repetición inmediata)

  // ---- caché en localStorage (sobrevive recargas, arranque instantáneo) ----
  function readLS() {
    try {
      var c = JSON.parse(localStorage.getItem(LS_CACHE) || 'null');
      if (c && Array.isArray(c.items) && c.items.length) { ITEMS = c.items; loadedAt = c.ts || 0; }
    } catch (e) {}
  }
  function writeLS() {
    try { localStorage.setItem(LS_CACHE, JSON.stringify({ ts: loadedAt, items: ITEMS })); } catch (e) {}
  }

  function fresh() { return ITEMS.length && (Date.now() - loadedAt) < TTL_MS; }

  // ---- carga del índice vivo (con dedupe y caché) ----
  function ensure() {
    if (fresh()) return Promise.resolve(ITEMS);
    if (inflight) return inflight;
    inflight = fetch(SOURCE, { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        var raw = (d && Array.isArray(d.items)) ? d.items : [];
        var items = raw.filter(function (it) { return it && it.url && RENDERABLE[it.type]; });
        if (items.length) { ITEMS = items; loadedAt = Date.now(); writeLS(); }
        inflight = null;
        return ITEMS;
      })
      .catch(function () { inflight = null; return ITEMS; /* offline → caché */ });
    return inflight;
  }

  // Fallback por keywords (title+tags) para stock aún sin categorizar.
  var KW = {
    atraer:   ['oferta', 'descuento', 'bienvenid', 'promo', 'rebaja', 'atraer'],
    producto: ['producto', 'novedad', 'catalogo', 'catálogo'],
    promo:    ['promo', '2x1', 'descuento', 'oferta'],
    marca:    ['marca', 'brand', 'premium', 'exclusiv'],
    f:        ['mujer', 'femenin', 'ella', 'women', 'woman'],
    m:        ['hombre', 'masculin', 'men', 'man']
  };

  function hasAgeBucket(it, age) {
    return it.ageBucket === age || it.age === age ||
      (it.segmentation && Array.isArray(it.segmentation.ageBuckets) && it.segmentation.ageBuckets.indexOf(age) >= 0);
  }
  function hasTimeSlot(it, ts) {
    return it.timeSlot === ts ||
      (it.segmentation && Array.isArray(it.segmentation.timeSlots) && it.segmentation.timeSlots.indexOf(ts) >= 0);
  }

  // Construye el "pool" de candidatos para un segmento, de lo más específico a lo
  // más general — misma cascada que estrenó el Target Publicity del gemelo.
  function poolFor(q) {
    var items = ITEMS;
    if (q.type && RENDERABLE[q.type]) items = items.filter(function (it) { return it.type === q.type; });
    if (!items.length) items = ITEMS;

    var pool = null;

    // 1) Segmento de público (género + edad + franja)
    if (q.audience) {
      var p = items.filter(function (it) { return it.audience === q.audience; });
      if (q.age) { var pa = p.filter(function (it) { return hasAgeBucket(it, q.age); }); if (pa.length) p = pa; }
      if (q.timeSlot) { var pt = p.filter(function (it) { return hasTimeSlot(it, q.timeSlot); }); if (pt.length) p = pt; }
      pool = p.length ? p : items.filter(function (it) { return it.audience === 'all'; });
    }

    // 2) Categoría estructurada (atraer/producto/marca/promo)
    if ((!pool || !pool.length) && q.category) {
      var ex = items.filter(function (it) { return it.category === q.category; });
      if (ex.length) pool = ex;
    }

    // 3) Tag libre explícito
    if ((!pool || !pool.length) && q.tag) {
      var tg = items.filter(function (it) { return Array.isArray(it.tags) && it.tags.indexOf(q.tag) >= 0; });
      if (tg.length) pool = tg;
    }

    // 4) Keywords en title+tags (stock sin categorizar)
    if (!pool || !pool.length) {
      var kws = KW[q.category] || KW[q.audience] || [];
      if (kws.length) {
        var mt = items.filter(function (it) {
          var t = ((it.title || '') + ' ' + ((it.tags || []).join(' '))).toLowerCase();
          return kws.some(function (k) { return t.indexOf(k) >= 0; });
        });
        if (mt.length) pool = mt;
      }
    }

    // 5) Todo lo renderizable
    if (!pool || !pool.length) pool = items;
    return pool;
  }

  // Elige un asset del pool, evitando repetir los últimos servidos.
  function choose(pool) {
    if (!pool || !pool.length) return null;
    var fresh2 = pool.filter(function (it) { return recent.indexOf(it.id) < 0; });
    var bag = fresh2.length ? fresh2 : pool;
    var pick = bag[Math.floor(Math.random() * bag.length)];
    if (pick) {
      recent.push(pick.id);
      if (recent.length > 8) recent.shift();
    }
    return pick || null;
  }

  // pick síncrono sobre la caché en memoria (null si aún no hay índice).
  function pick(query) {
    if (!ITEMS.length) return null;
    return choose(poolFor(normalize(query)));
  }

  // pickAsync: asegura el índice cargado y elige (refresca en 2º plano si caducó).
  function pickAsync(query) {
    var q = normalize(query);
    if (ITEMS.length) {
      if (!fresh()) ensure(); // refresco en background, no bloquea
      return Promise.resolve(choose(poolFor(q)));
    }
    return ensure().then(function () { return choose(poolFor(q)); });
  }

  function normalize(q) {
    q = q || {};
    return {
      category: q.category || '',
      audience: q.audience || '',   // 'f' | 'm' | ''
      age:      q.age || '',        // 'joven' | 'adulto' | 'senior' | ...
      timeSlot: q.timeSlot || '',   // 'manana' | 'mediodia' | 'tarde' | 'noche'
      tag:      q.tag || '',
      type:     q.type || ''        // 'image' | 'video' | ''
    };
  }

  readLS();
  ensure(); // precarga al arrancar

  root.XPLStock = {
    ensure: ensure,
    pick: pick,
    pickAsync: pickAsync,
    ready: function () { return ITEMS.length > 0; },
    count: function () { return ITEMS.length; },
    source: SOURCE
  };
})(typeof window !== 'undefined' ? window : globalThis);
