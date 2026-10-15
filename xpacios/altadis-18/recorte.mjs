// Qué trozo del vídeo enseña cada pantalla física de un formato Altadis (misión
// DCL-d7966deb02734a6f34beb54e, los 18 espacios Altadis, 15-oct-2026).
//
// Un formato de varias pantallas (VIDEOWALL 4X1 H, SINCRO VW 4X1 H…) es UN lienzo de
// W × H píxeles y UN solo vídeo: cada pantalla del plano trae su `recorte` {x, y, w, h}, la
// región del lienzo que muestra. En el gemelo hay un único <video> por formato y cada
// pantalla pinta su recorte con el offset/repeat de UV de esa región, así todas cambian en
// el mismo fotograma. El cubo LED (forma 'cubo-4-caras') es una pantalla con 4 caras: su
// recorte se parte en 4 tiras verticales, una por cara (o las que traiga el plano en cubo.caras).
//
// Lógica pura, sin DOM ni three.js: la usan escena3d.mjs (vía visor.mjs) y los tests.
// Convenio de UV de three.js: u a la derecha y v hacia ARRIBA; el lienzo, como los píxeles,
// con y hacia ABAJO. El orden de los 8 valores es el de los vértices de PlaneGeometry:
// arriba-izquierda, arriba-derecha, abajo-izquierda, abajo-derecha.

const num = v => typeof v === 'number' && Number.isFinite(v);
const entero = v => Number.isInteger(v);

/** ¿Es [W, H] un lienzo de píxeles válido? */
export function lienzoValido(lienzo) {
  return Array.isArray(lienzo) && lienzo.length === 2 && lienzo.every(v => entero(v) && v > 0);
}

/**
 * Errores de un recorte dentro de su lienzo (vacío si vale). Píxeles enteros, dentro del
 * lienzo y con área: un recorte que se sale pintaría el borde repetido del vídeo.
 */
export function erroresRecorte(recorte, lienzo) {
  if (!lienzoValido(lienzo)) return ['El lienzo debe ser [ancho, alto] en píxeles enteros positivos'];
  const r = recorte || {};
  if (![r.x, r.y, r.w, r.h].every(entero)) return ['El recorte necesita x, y, w y h enteros'];
  const [W, H] = lienzo, errores = [];
  if (r.w <= 0 || r.h <= 0) errores.push('El recorte necesita ancho y alto positivos');
  if (r.x < 0 || r.y < 0 || r.x + r.w > W || r.y + r.h > H) errores.push(`El recorte ${r.x},${r.y} ${r.w}×${r.h} se sale del lienzo ${W}×${H}`);
  return errores;
}

/**
 * Cómo se apoya el medio (vídeo o placeholder de mw × mh) sobre el lienzo W × H.
 * 'cover' (por defecto) recorta lo que sobra centrado; 'stretch' lo estira. Si el vídeo ya
 * viene a tamaño nativo (lo normal: el equipo de contenido lo adapta a W × H), es la
 * identidad. Devuelve el {offset, repeat} que lleva el UV del lienzo (0..1) al del medio.
 */
export function ajusteMedio(lienzo, medio, modo = 'cover') {
  const id = { offset: [0, 0], repeat: [1, 1] };
  if (!lienzoValido(lienzo) || !Array.isArray(medio) || !medio.every(v => num(v) && v > 0) || modo === 'stretch') return id;
  const la = lienzo[0] / lienzo[1], ma = medio[0] / medio[1];
  if (Math.abs(la - ma) < 1e-6) return id;
  if (ma > la) { const rx = la / ma; return { offset: [(1 - rx) / 2, 0], repeat: [rx, 1] }; }
  const ry = ma / la;
  return { offset: [0, (1 - ry) / 2], repeat: [1, ry] };
}

/**
 * Offset/repeat de UV del recorte dentro del lienzo, compuesto con el ajuste del medio.
 * u0 = x/W y ru = w/W; en v, la base del recorte (y + h) es el origen porque v sube.
 */
export function uvRecorte(recorte, lienzo, ajuste = { offset: [0, 0], repeat: [1, 1] }) {
  const errores = erroresRecorte(recorte, lienzo);
  if (errores.length) throw new Error(errores[0]);
  const [W, H] = lienzo, { x, y, w, h } = recorte;
  const local = { offset: [x / W, 1 - (y + h) / H], repeat: [w / W, h / H] };
  return {
    offset: [ajuste.offset[0] + local.offset[0] * ajuste.repeat[0], ajuste.offset[1] + local.offset[1] * ajuste.repeat[1]],
    repeat: [local.repeat[0] * ajuste.repeat[0], local.repeat[1] * ajuste.repeat[1]],
  };
}

/** Los 8 UV de un plano a partir de su offset/repeat (orden de vértices de PlaneGeometry). */
export function uvPlano({ offset, repeat }) {
  const [u0, v0] = offset, u1 = u0 + repeat[0], v1 = v0 + repeat[1];
  return [u0, v1, u1, v1, u0, v0, u1, v0];
}

/**
 * Las caras de un cubo LED: el recorte se parte en `n` tiras verticales de igual ancho, de
 * izquierda a derecha (cara 1 la que mira al frente y cada una a la derecha de la anterior: el
 * lienzo da la vuelta al cubo seguido). Con 1600 × 600 y 4 caras: cuatro de 400 × 600.
 */
export function carasCubo(recorte, n = 4) {
  if (!recorte || !entero(recorte.w) || !(n > 0)) return [];
  const caras = [];
  for (let i = 0; i < n; i++) {
    const x0 = recorte.x + Math.round(i * recorte.w / n), x1 = recorte.x + Math.round((i + 1) * recorte.w / n);
    caras.push({ x: x0, y: recorte.y, w: x1 - x0, h: recorte.h });
  }
  return caras;
}

/**
 * UV de cada pantalla física de un formato. `pantallas`: las del plano con su `recorte` y,
 * si no traen `lienzo`, se usa el del formato. Devuelve Map id → 8 UV, o id → lista de 4
 * listas de 8 UV para un cubo. Una pantalla sin recorte enseña el lienzo entero.
 */
export function uvsFormato(pantallas, { lienzo, medio = null, modo = 'cover' } = {}) {
  const out = new Map();
  for (const p of pantallas || []) {
    const L = lienzoValido(p.lienzo) ? p.lienzo : lienzo;
    if (!lienzoValido(L)) continue;
    const r = p.recorte || { x: 0, y: 0, w: L[0], h: L[1] };
    const aj = ajusteMedio(L, medio, modo);
    // Las caras del cubo: las del plano (cubo.caras[].recorte, en su orden) o el recorte partido en 4.
    const caras = p.cubo && Array.isArray(p.cubo.caras) && p.cubo.caras.length === 4 && p.cubo.caras.every(c => c && c.recorte) ? p.cubo.caras.map(c => c.recorte) : null;
    if (p.forma === 'cubo-4-caras') out.set(p.id, (caras || carasCubo(r, 4)).map(c => uvPlano(uvRecorte(c, L, aj))));
    else out.set(p.id, uvPlano(uvRecorte(r, L, aj)));
  }
  return out;
}

/**
 * ¿Cubren los recortes el lienzo entero sin pisarse? Avisos (no errores): un formato puede
 * dejar a propósito una celda apagada, pero casi siempre es un plano mal cuadrado.
 */
export function coberturaLienzo(recortes, lienzo) {
  const avisos = [];
  if (!lienzoValido(lienzo) || !Array.isArray(recortes) || !recortes.length) return { cubierto: 0, avisos: ['Sin recortes o sin lienzo'] };
  const [W, H] = lienzo;
  let area = 0;
  for (let i = 0; i < recortes.length; i++) {
    const a = recortes[i];
    area += a.w * a.h;
    for (let j = i + 1; j < recortes.length; j++) {
      const b = recortes[j];
      const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (ix > 0 && iy > 0) avisos.push(`Los recortes ${i + 1} y ${j + 1} se pisan`);
    }
  }
  const cubierto = area / (W * H);
  if (!avisos.length && Math.abs(cubierto - 1) > 1e-9) avisos.push(`Los recortes cubren el ${Math.round(cubierto * 1000) / 10} % del lienzo`);
  return { cubierto, avisos };
}
