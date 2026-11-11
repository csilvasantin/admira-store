// Crea tu gemelo en 3 pasos (Neo, 11-nov-2026): une foto/plano, pantallas y muebles y publicar.
// 1 · Tu espacio  2 · Pantallas y muebles  3 · Publicar  →  /xpacios/gemelo/ver/?id=<id>
// El borrador vive en localStorage hasta publicar: sin sesión se puede probar todo.
// Publicar exige sesión (escribe en el índice compartido de Xpacios, como «＋ Nuevo Xpacio»).
// Datos publicados en api.admira.store /layout/report: screen «gemelo-<id>» (plano y elementos)
// y «gemelo-<id>-foto» (la imagen, aparte para que el gemelo cargue aunque la foto falle).
(function (root) {
  'use strict';
  const API = 'https://api.admira.store';
  const IDX = 'xpacios-index';
  const KEY = 'gemelo-borrador';
  const MAX_ITEMS = 200;

  // Catálogo de elementos. w/h: huella en fracción del plano. alto: altura del alzado (px) en vista 3D.
  const TIPOS = {
    pantalla:   {n:'Pantalla',        e:'📺', w:.09, h:.018, alto:34, pantalla:true},
    videowall:  {n:'Videowall',       e:'🟦', w:.18, h:.02,  alto:50, pantalla:true},
    totem:      {n:'Tótem',           e:'🗼', w:.035,h:.035, alto:60, pantalla:true},
    escaparate: {n:'Escaparate',      e:'🪟', w:.22, h:.018, alto:44},
    mostrador:  {n:'Mostrador / caja',e:'🧾', w:.16, h:.06,  alto:20},
    estanteria: {n:'Estantería',      e:'🗄️', w:.13, h:.035, alto:46},
    mesa:       {n:'Mesa',            e:'🍽️', w:.07, h:.07,  alto:14},
    sofa:       {n:'Sofá / cama',     e:'🛋️', w:.12, h:.06,  alto:16},
    probador:   {n:'Probador',        e:'🚪', w:.08, h:.08,  alto:44},
    entrada:    {n:'Entrada',         e:'⬆️', w:.12, h:.015, alto:4},
    sensor:     {n:'Cámara / sensor', e:'📷', w:.025,h:.025, alto:8},
  };
  const SECTORES = {tienda:'Tienda', restaurante:'Restaurante', hotel:'Hotel', estanco:'Estanco', oficina:'Oficina', otro:'Otro'};

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const num = (v, d) => (Number.isFinite(Number(v)) ? Number(v) : d);
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function slug(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 28) || 'gemelo';
  }
  function nuevoId(nombre, ahora = Date.now()) { return 'gm-' + slug(nombre) + '-' + Math.floor(ahora / 1000).toString(36).slice(-5); }
  const ID_VALIDO = /^gm-[a-z0-9-]{1,40}$/;

  // Deja un borrador en forma: tipos conocidos, coordenadas dentro del plano, textos cortos.
  function normaliza(b) {
    b = b && typeof b === 'object' ? b : {};
    const fondo = b.fondo && typeof b.fondo === 'object' ? b.fondo : {};
    const items = (Array.isArray(b.items) ? b.items : []).filter(it => it && TIPOS[it.t]).slice(0, MAX_ITEMS).map((it, i) => ({
      id: String(it.id || ('e' + i)).slice(0, 24),
      t: it.t,
      x: clamp(num(it.x, .5), 0, 1),
      y: clamp(num(it.y, .5), 0, 1),
      r: ((Math.round(num(it.r, 0) / 90) * 90) % 360 + 360) % 360,
      n: String(it.n || '').slice(0, 60),
    }));
    return {
      v: 1,
      id: ID_VALIDO.test(b.id || '') ? b.id : null,
      nombre: String(b.nombre || '').trim().slice(0, 80),
      ciudad: String(b.ciudad || '').trim().slice(0, 80),
      sector: SECTORES[b.sector] ? b.sector : 'tienda',
      plantilla: String(b.plantilla || '').slice(0, 30),
      fondo: {
        tipo: ['foto', 'plano', 'rejilla'].includes(fondo.tipo) ? fondo.tipo : 'rejilla',
        img: typeof fondo.img === 'string' && /^(data:image\/(jpeg|png|webp);base64,|\/)/.test(fondo.img) ? fondo.img : null,
        w: clamp(num(fondo.w, 4), 1, 10000), h: clamp(num(fondo.h, 3), 1, 10000),
      },
      items,
      creado: num(b.creado, Date.now()),
      publicado: num(b.publicado, 0) || null,
    };
  }
  function cuenta(b) {
    const n = {pantallas:0, muebles:0};
    for (const it of b.items) (TIPOS[it.t].pantalla ? n.pantallas++ : n.muebles++);
    return n;
  }
  function pasoListo(b, paso) {
    if (paso >= 2 && !b.nombre) return 1;
    if (paso >= 3 && !b.items.length) return 2;
    return paso;
  }

  // ─── Navegador ───
  function carga() { try { return normaliza(JSON.parse(localStorage.getItem(KEY) || 'null')); } catch (e) { return normaliza(null); } }
  function guarda(b) { const n = normaliza(b); try { localStorage.setItem(KEY, JSON.stringify(n)); } catch (e) { /* foto demasiado grande */ } return n; }
  function borra() { try { localStorage.removeItem(KEY); } catch (e) {} }

  // Foto o plano → JPEG reducido (cabe en localStorage y en el almacén de layouts).
  function reduceImagen(file, max = 960, q = 0.62) {
    return new Promise((ok, ko) => {
      const rd = new FileReader();
      rd.onerror = () => ko(new Error('no se pudo leer'));
      rd.onload = () => {
        const im = new Image();
        im.onerror = () => ko(new Error('no es una imagen'));
        im.onload = () => {
          const k = Math.min(1, max / Math.max(im.width, im.height));
          const c = document.createElement('canvas');
          c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
          const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
          g.drawImage(im, 0, 0, c.width, c.height);
          ok({img: c.toDataURL('image/jpeg', q), w: c.width, h: c.height});
        };
        im.src = rd.result;
      };
      rd.readAsDataURL(file);
    });
  }

  // Pinta el plano con sus elementos. opts: {iso, sel, editable}
  function pinta(el, b, opts = {}) {
    const f = b.fondo;
    el.classList.add('gm-plano');
    el.classList.toggle('gm-iso', !!opts.iso);
    el.classList.toggle('gm-rejilla', f.tipo === 'rejilla' || !f.img);
    el.style.aspectRatio = f.w + ' / ' + f.h;
    el.style.backgroundImage = f.img ? 'url("' + f.img.replace(/"/g, '%22') + '")' : '';
    el.innerHTML = b.items.map(it => {
      const T = TIPOS[it.t]; const giro = it.r % 180 !== 0;
      const w = (giro ? T.h * f.w / f.h : T.w) * 100, h = (giro ? T.w * f.h / f.w : T.h) * 100;
      return '<div class="gm-el' + (T.pantalla ? ' gm-pant' : '') + (opts.sel === it.id ? ' gm-sel' : '') + '" data-id="' + esc(it.id) + '" data-t="' + it.t + '"' +
        ' style="left:' + (it.x * 100).toFixed(2) + '%;top:' + (it.y * 100).toFixed(2) + '%;width:' + w.toFixed(2) + '%;height:' + h.toFixed(2) + '%;--alto:' + T.alto + 'px"' +
        ' title="' + esc(it.n || T.n) + '"><i class="gm-alzado"></i><span class="gm-et">' + T.e + (it.n ? ' ' + esc(it.n) : '') + '</span></div>';
    }).join('');
  }

  async function sesion() {
    try { const r = await fetch('/auth/session', {cache:'no-store'}); const j = r.ok ? await r.json() : null; return j && j.ok ? j : null; } catch (e) { return null; }
  }
  async function leeLayout(screen) {
    const r = await fetch(API + '/layout/current?screen=' + encodeURIComponent(screen) + '&_=' + Date.now(), {cache:'no-store'});
    const j = await r.json(); return j && j.current;
  }
  async function escribeLayout(screen, snapshot) {
    const r = await fetch(API + '/layout/report', {method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({snapshot: Object.assign({furniture: []}, snapshot), screen})});
    if (!r.ok) throw new Error('el almacén respondió ' + r.status);
  }
  // Lo que se publica del gemelo (sin la foto, que va aparte).
  function publicable(b) {
    return {nombre:b.nombre, ciudad:b.ciudad, sector:b.sector, plantilla:b.plantilla,
      fondo:{tipo:b.fondo.tipo, w:b.fondo.w, h:b.fondo.h, img: b.fondo.img && b.fondo.img[0] === '/' ? b.fondo.img : null},
      items:b.items, creado:b.creado, publicado:b.publicado};
  }
  async function publica(b) {
    b = normaliza(b);
    const nuevo = !b.id;
    if (nuevo) b.id = nuevoId(b.nombre);
    b.publicado = Date.now();
    await escribeLayout('gemelo-' + b.id, {gemelo: publicable(b)});
    if (b.fondo.img && b.fondo.img.startsWith('data:')) {
      try { await escribeLayout('gemelo-' + b.id + '-foto', {img: b.fondo.img}); } catch (e) { /* el gemelo se ve igual, sobre rejilla */ }
    }
    // Índice compartido de Xpacios: una entrada por gemelo.
    let items = [];
    try { const c = await leeLayout(IDX); if (c && Array.isArray(c.items)) items = c.items; } catch (e) {}
    const entrada = {id:b.id, name:b.nombre, city:b.ciudad, kind:'gemelo', sector:b.sector, base:'gemelo', createdAt:b.creado, updatedAt:b.publicado};
    const i = items.findIndex(x => x && x.id === b.id);
    if (i >= 0) items[i] = Object.assign({}, items[i], entrada); else items.push(entrada);
    await escribeLayout(IDX, {items});
    return guarda(b);
  }
  async function cargaPublicado(id) {
    if (!ID_VALIDO.test(id || '')) throw new Error('id no válido');
    const c = await leeLayout('gemelo-' + id);
    if (!c || !c.gemelo) throw new Error('no encontrado');
    const b = normaliza(Object.assign({}, c.gemelo, {id}));
    if (!b.fondo.img && c.gemelo.fondo && c.gemelo.fondo.tipo !== 'rejilla') {
      try { const f = await leeLayout('gemelo-' + id + '-foto'); if (f && f.img) b.fondo = normaliza({fondo:Object.assign({}, b.fondo, {img:f.img})}).fondo; } catch (e) {}
    }
    return b;
  }

  // Barra de pasos 1·2·3: cada paso es una página aparte (Neo: páginas cortas numeradas, sin anclas).
  function pasos(el, actual, b) {
    const P = [[1, 'Tu espacio'], [2, 'Pantallas y muebles'], [3, 'Publicar']];
    const max = pasoListo(b, 3);
    el.className = 'gm-pasos';
    el.innerHTML = P.map(([n, t]) => n === actual
      ? '<li class="gm-actual"><span aria-current="step"><b>' + n + '</b>' + t + '</span></li>'
      : (n <= max ? '<li class="' + (n < actual ? 'gm-hecho' : '') + '"><a href="/xpacios/gemelo/' + n + '/"><b>' + n + '</b>' + t + '</a></li>'
        : '<li><span><b>' + n + '</b>' + t + '</span></li>')).join('');
  }

  const Gemelo = {API, pasos, TIPOS, SECTORES, MAX_ITEMS, ID_VALIDO, esc, slug, nuevoId, normaliza, cuenta, pasoListo,
    carga, guarda, borra, reduceImagen, pinta, sesion, publica, publicable, cargaPublicado};
  if (typeof module === 'object' && module.exports) module.exports = Gemelo;
  else root.Gemelo = Gemelo;
})(typeof self !== 'undefined' ? self : this);
