// Encuadre de la cámara y póster esquemático de un formato Altadis (misión
// DCL-d7966deb02734a6f34beb54e). Lógica pura, sin DOM ni three.js: la usan visor.mjs y los tests.
//
// Coordenadas del plano (plano3d.mjs): x e y en planta (y hacia dentro del local) y la altura
// aparte. La órbita del visor es la del laboratorio: posición = objetivo + dist ·
// (cos el · cos az, sin el, cos el · sin az) con x = x del plano y z = y del plano, así que mirar
// una pantalla de frente es az = atan2(ny, nx) con (nx, ny) su normal hacia la sala.

const rad = g => g * Math.PI / 180;

/** Esquinas en planta y altura de una pantalla colocada por escenaDesdePlano (cubo incluido). */
export function esquinas(p) {
  const [cx, cy] = p.centro;
  if (p.cubo) {
    const l = p.cubo.lado / 2, out = [];
    for (const dx of [-l, l]) for (const dy of [-l, l]) for (const h of [p.z, p.z + p.cubo.alto]) out.push([cx + dx, cy + dy, h]);
    return out;
  }
  const [ux, uy] = p.u || [1, 0], out = [];
  for (const k of [-0.5, 0.5]) for (const h of [p.z, p.z1]) out.push([cx + ux * p.w * k, cy + uy * p.w * k, h]);
  return out;
}

/**
 * Encuadre automático sobre las pantallas de un formato: objetivo en el centro de su caja,
 * de frente (la normal media de las pantallas) y a la distancia justa para que quepan en el
 * campo de la cámara con un margen. `fov` vertical en grados, `aspect` ancho/alto del visor.
 */
export function encuadre(pantallas, { fov = 40, aspect = 16 / 9, margen = 1.3, el = 0.14, minDist = 1.1, minAncho = 0, minAlto = 0 } = {}) {
  const ps = (pantallas || []).filter(p => p && p.centro);
  if (!ps.length) return null;
  const pts = ps.flatMap(esquinas);
  const min = i => Math.min(...pts.map(q => q[i])), max = i => Math.max(...pts.map(q => q[i]));
  const objetivo = [(min(0) + max(0)) / 2, (min(1) + max(1)) / 2, (min(2) + max(2)) / 2];
  let nx = 0, ny = 0;
  for (const p of ps) { nx += p.n[0]; ny += p.n[1]; }
  const nl = Math.hypot(nx, ny) || 1;
  nx /= nl; ny /= nl;
  // Ancho visto de frente (proyección sobre la perpendicular a la normal) y fondo (sobre la normal).
  const rx = -ny, ry = nx;
  const ancho = Math.max(...pts.map(q => q[0] * rx + q[1] * ry)) - Math.min(...pts.map(q => q[0] * rx + q[1] * ry));
  const fondo = Math.max(...pts.map(q => q[0] * nx + q[1] * ny)) - Math.min(...pts.map(q => q[0] * nx + q[1] * ny));
  const alto = max(2) - min(2);
  // Una pantalla pequeña (la góndola LED, la tablet) se encuadra con algo de su espacio alrededor.
  const vw = Math.max(ancho, minAncho), vh = Math.max(alto, minAlto);
  const tv = Math.tan(rad(fov) / 2), th = tv * aspect;
  const dist = Math.max(minDist, Math.max((vh / 2) / tv, (vw / 2) / th) * margen + fondo / 2);
  return { objetivo, dist, az: Math.atan2(ny, nx), el, ancho, alto, fondo, normal: [nx, ny] };
}

/**
 * La regla del encuadre automático (lo que usa visor.mjs): la cámara en la normal de las
 * pantallas del formato, mirándolas de frente y con su centro en el centro del cuadro, a la
 * distancia a la que llenan dos tercios del lado que manda. Un poco desde arriba (más si la
 * pantalla está baja, como la de un mostrador), nunca más de unos 13°. El cubo, frente a la cara
 * que da a la sala pero en diagonal (GIRO_CUBO), para que se vean dos caras; hacia el lado que
 * deja la cámara más cerca del centro de la sala si se da `sala`.
 */
export const GIRO_CUBO = 0.5;
/** Lo mínimo que enseña el encuadre en la escena realista (metros): la pantalla y su sitio. */
export const MIN_REALISTA = { minAncho: 1.3, minAlto: 0.9 };
export function camaraEncuadre(pantallas, { fov = 40, aspect = 16 / 9, sala = null, minAncho = 0, minAlto = 0 } = {}) {
  const ps = (pantallas || []).filter(p => p && p.centro);
  const cubo = ps.some(p => p.cubo);
  // minAncho / minAlto: en la escena realista una pantalla pequeña (la tablet, la góndola LED) se
  // encuadra con algo del local alrededor (MIN_REALISTA); en el Esquema, 0: llena dos tercios.
  const m = encuadre(ps, { fov, aspect, margen: 1.5, minDist: 0.6, el: 0, minAncho, minAlto });
  if (!m) return null;
  const el = cubo ? 0.3 : m.objetivo[2] < 1.2 ? 0.22 : 0.1;
  let az = m.az;
  if (cubo) {
    const lados = [m.az + GIRO_CUBO, m.az - GIRO_CUBO];
    const centro = sala && sala.centro;
    az = centro ? lados.map(a => [a, posicionOrbita({ objetivo: m.objetivo, dist: m.dist, az: a, el })]).sort((x, y) => Math.hypot(x[1][0] - centro[0], x[1][1] - centro[1]) - Math.hypot(y[1][0] - centro[0], y[1][1] - centro[1]))[0][0] : lados[0];
  }
  return { objetivo: m.objetivo, az, el, dist: m.dist, normal: m.normal, ancho: m.ancho, alto: m.alto, cubo };
}

/**
 * Campo vertical de la órbita: 40° en apaisado; en vertical (un móvil) se abre para conservar el
 * campo horizontal de un lienzo cuadrado, con un tope de 65°. Sin esto, un mural de 4 m en un
 * móvil pedía la cámara a unos 20 m.
 */
export function fovPara(aspectLienzo, base = 40, max = 65) {
  if (!(aspectLienzo > 0) || aspectLienzo >= 1) return base;
  return Math.min(max, 2 * Math.atan(Math.tan(base * Math.PI / 360) / aspectLienzo) * 180 / Math.PI);
}

/** Distancia de la cámara en la zona libre del visor (`escala` = alto de la zona / alto del lienzo), con tope: el doble de la de escritorio. */
export function distanciaEnZona(dist, escala, nominal = Infinity) {
  return Math.min(dist / Math.max(0.05, escala || 1), 2 * nominal);
}

/**
 * Planos de recorte según la distancia: near = dist / 100 (≥ 5 cm). La pantalla está a 0,3 mm de
 * su bisel; con near fijo en 3 cm y la cámara a 20 m, el búfer de profundidad no los separa y el
 * mural sale negro o rayado (z-fighting). Así la resolución a esa distancia queda en ~0,1 mm.
 */
export function planosCamara(dist, sala = null) {
  const near = Math.max(0.05, dist / 100);
  const diag = sala ? Math.hypot(sala.ancho, sala.fondo, sala.alto) : 20;
  return { near, far: dist + diag + 10 };
}

/** Puntos de una pantalla que tienen que verse: centro, esquinas (2 cm hacia dentro) y borde inferior. */
export function puntosVisibles(p) {
  const [cx, cy, cz] = p.centro, k = 0.02;
  const pts = [[cx, cy, cz]];
  for (const q of esquinas(p)) pts.push([q[0] + Math.sign(cx - q[0]) * k, q[1] + Math.sign(cy - q[1]) * k, q[2] + Math.sign(cz - q[2]) * k]);
  pts.push([cx, cy, p.z + k]);
  return pts;
}

/** Posición de la cámara de la órbita (en el plano: x, y, altura). */
export function posicionOrbita({ objetivo, dist, az, el }) {
  return [objetivo[0] + Math.cos(el) * Math.cos(az) * dist, objetivo[1] + Math.cos(el) * Math.sin(az) * dist, objetivo[2] + Math.sin(el) * dist];
}

/** ¿Cabe la cámara dentro de la sala? Si no, el visor recorta las paredes que le dan la espalda. */
export const dentroDeSala = (pos, sala) => pos[0] > 0 && pos[0] < sala.ancho && pos[1] > 0 && pos[1] < sala.fondo && pos[2] < sala.alto;

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Celdas (en píxeles del lienzo) de un formato del índice: su rejilla, o 4 caras si es el cubo. */
export function celdasFormato(f) {
  const cubo = f.zona === 'cubo' || /CUBO/i.test(f.nombre || '');
  const cols = cubo ? 4 : Math.max(1, f.grid?.cols || 1), rows = cubo ? 1 : Math.max(1, f.grid?.rows || 1);
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x0 = Math.round(c * f.ancho / cols), y0 = Math.round(r * f.alto / rows);
    out.push({ x: x0, y: y0, w: Math.round((c + 1) * f.ancho / cols) - x0, h: Math.round((r + 1) * f.alto / rows) - y0 });
  }
  return out;
}

/**
 * Póster esquemático de la tarjeta (SVG) mientras no hay póster del vídeo: el lienzo del
 * formato a escala dentro de un 16:9, con sus pantallas, y LED en ámbar.
 */
export function svgFormato(f, { W = 320, H = 180, pad = 18 } = {}) {
  const led = /LED/i.test(f.nombre || '') || f.zona === 'cubo';
  const k = Math.min((W - pad * 2) / f.ancho, (H - pad * 2) / f.alto);
  const w = f.ancho * k, h = f.alto * k, x0 = (W - w) / 2, y0 = (H - h) / 2;
  const color = led ? '#ffc867' : '#78f3ff';
  const celdas = celdasFormato(f).map(c => `<rect x="${(x0 + c.x * k + 1).toFixed(1)}" y="${(y0 + c.y * k + 1).toFixed(1)}" width="${Math.max(1, c.w * k - 2).toFixed(1)}" height="${Math.max(1, c.h * k - 2).toFixed(1)}" rx="1.5" fill="${color}" fill-opacity=".16" stroke="${color}" stroke-width="1.2"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(f.nombre)} · ${f.ancho} × ${f.alto} px"><rect width="${W}" height="${H}" fill="#0b1417"/>${celdas}<text x="${W - 8}" y="${H - 7}" text-anchor="end" font-family="ui-monospace,Menlo,monospace" font-size="11" fill="#9db1ad">${f.ancho}×${f.alto}</text></svg>`;
}
