// La caja del local: el segundo TPV, con la cesta y el IF·THEN·DO THAT de Paseo de Gràcia (Carlos, 16-oct-2026: «en
// el tpv donde está la gestión de colas va la música y en el otro el arrastre del muffin o el agua que muestra el if
// then do that»). Se coge el muffin o una botella de agua de la vitrina de la foto 360 y se suelta en la caja: se
// suma a la cesta y saltan las reacciones de las reglas de /ifthendothat (las mismas que en el gemelo de Paseo de
// Gràcia: retail-rules.mjs), en las pantallas del local que corresponden a las de allí (muro, caja e iPad). El agua
// enseña su oferta («solo nos quedan N botellas») en las pantallas de su regla. Cesta del gemelo: sin precios, ni
// pago, ni órdenes a ningún aparato.
import { retailRulebook, createRetailRulePlayer, waterOfferScreens } from '../../admira-xp/scripts/retail-rules.mjs?v=water-finish-3';
import { POS_PRODUCTS, restoreBasket, addBasketProduct, removeBasketProduct } from '../../admira-xp/scripts/pos-basket.mjs?v=water-finish-3';
import { WATER_INITIAL, waterRemaining, waterOfferURL, waterOfferOrientation } from '../../admira-xp/scripts/pos-water.mjs?v=water-finish-3';

export const ANCHO = 720, ALTO = 1280;

// Pantallas de las reglas (las del gemelo de Paseo de Gràcia) → piezas del local en la foto 360.
export function mapaPantallas({ muro = [], caja = null, ipad = null } = {}) {
  const m = {};
  muro.slice(0, 6).forEach((id, i) => { m['starbucks-wall-0' + (i + 1)] = id; });
  if (caja) m['starbucks-tpv-01'] = caja;
  if (ipad) m['starbucks-ipad-01'] = ipad;
  return m;
}

const nombre = (id, en) => (en && POS_PRODUCTS[id].titleEn) || POS_PRODUCTS[id].title;

export function crearCajaTPV({ doc = document, win = globalThis, T, musica = null, clave = 'local', mapa = {}, reglas = retailRulebook } = {}) {
  const lienzo = doc.createElement('canvas'); lienzo.width = ANCHO; lienzo.height = ALTO;
  const ctx = lienzo.getContext('2d');
  const CLAVE = 'xpaceos.pos-basket.v1:' + clave;
  let cesta = restoreBasket(null), aviso = '', ofertaActiva = false;
  try { cesta = restoreBasket(JSON.parse(win.sessionStorage.getItem(CLAVE))); } catch { /* sin cesta guardada */ }
  const guardar = () => { try { win.sessionStorage.setItem(CLAVE, JSON.stringify(cesta)); } catch { /* sin almacenamiento */ } };
  const en = () => doc.documentElement.lang === 'en';

  // Lo que se pinta encima de cada pieza mientras dura una reacción (o la oferta del agua): pieza → { el, textura }.
  const reacciones = new Map(), ofertas = new Map();
  function texturaDe(el) {
    const t = el.tagName === 'VIDEO' ? new T.VideoTexture(el) : new T.Texture(el);
    t.colorSpace = T.SRGBColorSpace; t.minFilter = T.LinearFilter; t.generateMipmaps = false; if (el.tagName !== 'VIDEO') t.needsUpdate = true;
    return t;
  }
  function quitarDe(mapaReac, pieza, el) { const r = mapaReac.get(pieza); if (r && (!el || r.el === el)) { r.textura.dispose(); mapaReac.delete(pieza); } }

  // Adaptador de pantalla para el reproductor de reglas (mismo contrato que retail-media-display.mjs).
  function adaptador(destino, { muted = false } = {}) {
    const pieza = mapa[destino]; let el = null, gen = 0, soltar = null; const oyentes = new Set();
    function parar() { gen++; soltar?.(); soltar = null; if (el) { if (el.tagName === 'VIDEO') { el.pause(); el.removeAttribute('src'); el.load(); } if (pieza) quitarDe(reacciones, pieza, el); } el = null; }
    const fin = v => { parar(); oyentes.forEach(f => f(v)); };
    return {
      prepare(asset) {
        parar(); const g = gen;
        el = doc.createElement(asset.kind === 'image' ? 'img' : 'video'); el.crossOrigin = 'anonymous'; el.dataset.retailReaction = asset.kind;
        if (asset.kind === 'video') { el.playsInline = true; el.muted = true; el.loop = false; el.preload = 'auto'; el.addEventListener('ended', () => { if (g === gen) fin({}); }); }
        el.addEventListener('error', () => { if (g === gen) fin({ error: 'media' }); });
        el.src = asset.url;
      },
      async play() {
        const g = gen, nodo = el; if (!nodo || !pieza) throw Error('display');
        if (nodo.tagName === 'IMG' && !(nodo.complete && nodo.naturalWidth)) await new Promise((ok, mal) => { nodo.addEventListener('load', ok, { once: true }); nodo.addEventListener('error', () => mal(Error('image')), { once: true }); });
        if (g !== gen) throw Error('cancelled');
        quitarDe(reacciones, pieza); reacciones.set(pieza, { el: nodo, textura: texturaDe(nodo) });
        if (nodo.tagName === 'VIDEO') { nodo.currentTime = 0; nodo.muted = muted; if (!muted && musica && musica.suppress) soltar = musica.suppress(); await nodo.play(); }
      },
      stop: parar, dispose: parar,
      subscribe(f) { oyentes.add(f); return () => oyentes.delete(f); },
    };
  }

  const libro = reglas();
  const audioDe = () => { const a = doc.createElement('audio'); a.hidden = true; a.dataset.retailAudio = 'true'; doc.body.append(a); return a; };
  const jugador = createRetailRulePlayer({
    book: libro, audio: audioDe(), audioFactory: audioDe,
    music: musica || { suppress: () => () => {} },
    visualFactory: (destino, opciones) => adaptador(destino, opciones),
  });

  // La oferta del agua en las pantallas de su regla (por defecto, iPad y las 6 del muro), mientras quede agua en la cesta.
  function pintarOfertas() {
    for (const p of [...ofertas.keys()]) quitarDe(ofertas, p);
    const quedan = waterRemaining(cesta);
    if (!ofertaActiva || quedan >= WATER_INITIAL) return;
    for (const destino of waterOfferScreens(libro.state().rules)) {
      const pieza = mapa[destino]; if (!pieza) continue;
      const img = new Image(); img.src = waterOfferURL(quedan, en() ? 'en' : 'es', waterOfferOrientation(destino));
      img.onload = () => { if (!ofertaActiva) return; quitarDe(ofertas, pieza); ofertas.set(pieza, { el: img, textura: texturaDe(img) }); };
    }
  }

  function pintar() {
    const W = ANCHO, H = ALTO, ingles = en();
    ctx.fillStyle = '#f4f1ea'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#00704a'; ctx.fillRect(0, 0, W, 150);
    ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = '800 54px system-ui, sans-serif';
    ctx.fillText(ingles ? 'POS · BASKET' : 'TPV · CESTA', 44, 78);
    ctx.textBaseline = 'alphabetic';
    let y = 270;
    if (!cesta.lines.length) {
      ctx.fillStyle = '#1e3932'; ctx.font = '700 48px system-ui, sans-serif';
      (ingles ? ['Drag a muffin', 'or a water bottle', 'to the register'] : ['Arrastra un muffin', 'o una botella de agua', 'hasta la caja']).forEach((l, n) => ctx.fillText(l, 44, y + n * 66));
      y += 260;
    } else {
      for (const l of cesta.lines) {
        ctx.fillStyle = '#1e3932'; ctx.font = '800 60px system-ui, sans-serif'; ctx.fillText(l.quantity + ' ×', 44, y);
        ctx.font = '600 48px system-ui, sans-serif'; ctx.fillText(nombre(l.id, ingles).split(' · ')[0], 190, y);
        y += 92;
      }
    }
    ctx.fillStyle = '#1e3932'; ctx.font = '600 36px system-ui, sans-serif';
    ctx.fillText((ingles ? 'Water · ' : 'Agua · ') + waterRemaining(cesta) + ' / ' + WATER_INITIAL, 44, H - 210);
    if (aviso) { ctx.fillStyle = '#00704a'; ctx.font = '700 36px system-ui, sans-serif'; ctx.fillText(aviso.slice(0, 32), 44, H - 150); }
    ctx.fillStyle = '#6b7f78'; ctx.font = '500 28px system-ui, sans-serif';
    ctx.fillText(ingles ? 'Twin basket · simulated, nothing is charged' : 'Cesta del gemelo · simulada, no se cobra', 44, H - 60);
  }
  pintar();

  const api = {
    lienzo, pintar,
    get cesta() { return restoreBasket(cesta); },
    get quedanAgua() { return waterRemaining(cesta); },
    // La reacción o la oferta que tapa una pieza ahora mismo (textura de three), o null.
    reaccionDe(pieza) { const r = reacciones.get(pieza) || ofertas.get(pieza); if (r && r.el.tagName === 'VIDEO' && r.el.readyState < 2) return null; return r ? r.textura : null; },
    get reacciones() { return [...reacciones.keys(), ...ofertas.keys()]; },
    // Coger: con el gesto se preparan las reacciones (el navegador deja sonar) y salta «Cojo un muffin».
    coger(id) { try { jugador.prepare(); } catch { /* reglas sin cargar */ } if (id === 'muffin') void jugador.fire('muffinPicked').catch(() => {}); },
    // Soltar en la caja: a la cesta y «Llevo un muffin a la caja» o el agua (locución y oferta).
    soltar(id) {
      try { cesta = addBasketProduct(cesta, id); } catch { aviso = id === 'water' ? (en() ? 'Water sold out' : 'Agua agotada') : (en() ? 'Could not add' : 'No se pudo añadir'); pintar(); return false; }
      guardar(); aviso = (en() ? 'Added: ' : 'Añadido: ') + nombre(id, en()).split(' · ')[0];
      if (id === 'muffin') void jugador.fire('muffinDelivered').catch(() => {});
      if (id === 'water') { ofertaActiva = true; pintarOfertas(); void jugador.fire('waterDelivered').catch(() => {}); }
      pintar(); win.dispatchEvent(new win.CustomEvent('xpace:pos-basket', { detail: { version: 1, loc: clave, action: 'add', productId: id, basket: restoreBasket(cesta) } }));
      return true;
    },
    quitar(id) { cesta = removeBasketProduct(cesta, id); if (id === 'water') { ofertaActiva = false; pintarOfertas(); } guardar(); aviso = ''; pintar(); },
    vaciar() { cesta = restoreBasket(null); ofertaActiva = false; pintarOfertas(); guardar(); aviso = ''; pintar(); },
    detener() { jugador.stop(); ofertaActiva = false; pintarOfertas(); aviso = ''; pintar(); },
    nombre: id => nombre(id, en()),
    imagen: id => POS_PRODUCTS[id] && POS_PRODUCTS[id].image,
    get reglas() { return libro.state().rules.length; },
  };
  return api;
}
