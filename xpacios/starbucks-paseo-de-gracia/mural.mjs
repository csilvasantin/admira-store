// El mural doble H de Starbucks como UNA sola pantalla (mejora 3 de la demo de Starbucks,
// Carlos 14-oct-2026). La campaña starbucks-six de admira.studio describe un lienzo de
// 8160 × 1920 y el rectángulo de cada pantalla dentro de él (installations[].screens). Aquí se
// pinta ese lienzo en un <canvas> —titular que viaja de pantalla en pantalla, banda de café que
// se desplaza, la sirena en las dos H— y el gemelo enseña en cada pantalla SU trozo, todas en el
// mismo fotograma. Es una aproximación en el navegador de la pieza de admira.studio, no su vídeo.
//
// Lógica pura (reparto y posiciones) separada del dibujo para poder probarla sin navegador.

export const CAMPANA_STARBUCKS_SIX = 'https://www.admira.studio/adaptaciones/campanas/starbucks-six.json';
export const ESCALA = 0.25;            // 8160 × 1920 → 2040 × 480 px: nítido en el 3D y ligero de subir
export const FPS = 20;

const esV = r => r.h > r.w;

/** La instalación del mural dentro de la campaña (por id, o la primera de fase «mural»). */
export function instalacionDe(campana, id = 'starbucks-six') {
  const lista = Array.isArray(campana && campana.installations) ? campana.installations : [];
  const ins = lista.find(i => i && i.id === id) || lista.find(i => i && i.phase === 'mural');
  if (!ins || !(ins.width > 0 && ins.height > 0) || !Array.isArray(ins.screens) || !ins.screens.length) return null;
  const screens = ins.screens.filter(s => s && s.id && [s.x, s.y, s.w, s.h].every(n => typeof n === 'number' && Number.isFinite(n)) && s.w > 0 && s.h > 0);
  return screens.length ? { id: ins.id, width: ins.width, height: ins.height, screens } : null;
}

/**
 * Qué trozo del lienzo enseña cada pantalla del gemelo. Con sesión las pantallas traen su
 * screenId y se casan por él. Sin sesión (plano público: pantalla-1…6, sin ids) se casan por
 * su orden a lo largo de la pared contra el orden x de la campaña, y sólo si la secuencia de
 * orientaciones coincide (V–H–V–V–H–V): si no, no se adivina y se devuelve null.
 */
export function repartoPantallas(pantallas, instalacion) {
  if (!instalacion || !Array.isArray(pantallas) || !pantallas.length) return null;
  const porId = new Map(instalacion.screens.map(s => [s.id, s]));
  const reparto = new Map();
  const conId = pantallas.filter(p => p.screenId && porId.has(p.screenId));
  if (conId.length === pantallas.length) {
    for (const p of pantallas) reparto.set(p.id, porId.get(p.screenId));
    return reparto;
  }
  if (pantallas.length !== instalacion.screens.length) return null;
  const pared = new Set(pantallas.map(p => p.pared));
  if (pared.size !== 1) return null;
  const orden = [...pantallas].sort((a, b) => a.s - b.s);
  const rects = [...instalacion.screens].sort((a, b) => a.x - b.x);
  for (let i = 0; i < orden.length; i++) {
    if ((orden[i].orientacion === 'vertical') !== esV(rects[i])) return null;
    reparto.set(orden[i].id, rects[i]);
  }
  return reparto;
}

/** UV del trozo (x, y, w, h) en un lienzo W × H, en el orden de vértices de PlaneGeometry. */
export function uvDeRect(r, W, H) {
  const u0 = r.x / W, u1 = (r.x + r.w) / W, vt = 1 - r.y / H, vb = 1 - (r.y + r.h) / H;
  return [u0, vt, u1, vt, u0, vb, u1, vb];
}

/**
 * Dónde está cada elemento en el segundo t (unidades del lienzo completo). El titular cruza
 * el mural de izquierda a derecha en `segundos` (24 s en la campaña); la frase de cierre va al
 * revés a mitad de ciclo; la luz y la banda de café avanzan despacio.
 */
export function posiciones(t, { ancho = 8160, segundos = 24, titular = 3000, cierre = 1800 } = {}) {
  const ciclo = ((t % segundos) + segundos) % segundos / segundos;
  const recorrido = ancho + titular;
  const desfase = (ciclo + 0.5) % 1;
  return {
    titularX: -titular + ciclo * recorrido,
    cierreX: ancho - desfase * (ancho + cierre),
    luzX: ciclo * ancho,
    bandaX: -(t * 90) % ancho,
    pulso: 0.5 + 0.5 * Math.sin(ciclo * Math.PI * 4),
  };
}

const absoluta = (ruta, base) => { try { return new URL(ruta, base).href; } catch (_) { return null; } };

function cargarImagen(url, doc) {
  return new Promise(resolve => {
    if (!url) return resolve(null);
    const img = new (doc.defaultView || globalThis).Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Crea el lienzo del mural. `pintar(t)` dibuja el fotograma del segundo t. Las imágenes
 * (café y sirena) son de admira.studio con CORS abierto; si alguna no llega, el mural sigue
 * con color y texto.
 */
export async function crearMural(campana, instalacion, { doc = globalThis.document, base = 'https://www.admira.studio/', escala = ESCALA } = {}) {
  const W = instalacion.width, H = instalacion.height;
  const canvas = doc.createElement('canvas');
  canvas.width = Math.round(W * escala); canvas.height = Math.round(H * escala);
  const g = canvas.getContext('2d');
  const [cafe, sirena] = await Promise.all([cargarImagen(absoluta(campana.product, base), doc), cargarImagen(absoluta(campana.logo, base), doc)]);
  const fondo = campana.background || '#003e2e', texto = campana.foreground || '#fffaf0', acento = campana.accent || '#e8e5c9';
  const titular = campana.headline || 'Tu café sigue contigo.', cierre = campana.cta || '';
  const segundos = campana.seconds > 0 ? campana.seconds : 24;
  const hs = instalacion.screens.filter(s => !esV(s));
  g.font = '800 250px Montserrat, "Helvetica Neue", Arial, sans-serif';
  const anchoTitular = g.measureText(titular).width;
  g.font = '600 120px Montserrat, "Helvetica Neue", Arial, sans-serif';
  const anchoCierre = g.measureText(cierre).width;

  function pintar(t) {
    const p = posiciones(t, { ancho: W, segundos, titular: anchoTitular, cierre: anchoCierre });
    g.setTransform(escala, 0, 0, escala, 0, 0);
    // Fondo verde de la campaña con una luz que recorre el mural.
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, fondo); gr.addColorStop(1, '#00261c');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const luz = g.createRadialGradient(p.luzX, H * 0.3, 40, p.luzX, H * 0.3, 1500);
    luz.addColorStop(0, 'rgba(255,240,200,.20)'); luz.addColorStop(1, 'rgba(255,240,200,0)');
    g.fillStyle = luz; g.fillRect(0, 0, W, H);
    // Banda de café en la mitad baja, desplazándose sin fin y fundida con el verde.
    if (cafe) {
      const bh = H * 0.5, bw = bh * cafe.width / cafe.height;
      g.save(); g.globalAlpha = 0.85;
      for (let x = p.bandaX; x < W; x += bw) g.drawImage(cafe, x, H - bh, bw, bh);
      g.restore();
      const fun = g.createLinearGradient(0, H - bh, 0, H - bh * 0.55); fun.addColorStop(0, fondo); fun.addColorStop(1, 'rgba(0,62,46,0)');
      g.fillStyle = fun; g.fillRect(0, H - bh - 2, W, bh * 0.45 + 2);
    }
    // La sirena centrada en cada H, con un pulso suave.
    if (sirena) for (const s of hs) {
      const lado = s.h * (0.32 + 0.03 * p.pulso);
      g.drawImage(sirena, s.x + s.w / 2 - lado / 2, s.y + s.h * 0.08, lado, lado);
    }
    // Titular que cruza las seis pantallas, y la frase de cierre en sentido contrario.
    g.textBaseline = 'middle';
    g.fillStyle = 'rgba(0,0,0,.28)'; g.font = '800 250px Montserrat, "Helvetica Neue", Arial, sans-serif';
    g.fillText(titular, p.titularX + 8, H * 0.40 + 10);
    g.fillStyle = texto; g.fillText(titular, p.titularX, H * 0.40);
    if (cierre) { g.fillStyle = acento; g.font = '600 120px Montserrat, "Helvetica Neue", Arial, sans-serif'; g.fillText(cierre, p.cierreX, H * 0.63); }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  pintar(0);
  return { canvas, ancho: W, alto: H, segundos, pintar, imagenes: { cafe: Boolean(cafe), sirena: Boolean(sirena) } };
}
