// Monta las pantallas de un formato en la escena realista de su tipo de local (misión
// DCL-a6cb621be0ce5932f50960de, 16-oct-2026). Lógica pura, sin DOM ni three.js.
//
// Entrada: las pantallas del formato tal como las coloca escenaDesdePlano() en el gemelo de
// siempre (mismos metros, `recorte`, `lienzo`, tecnología y cubo de 4 caras) y la entrada del
// registro escenas-realistas.mjs. Salida: las MISMAS pantallas, con la forma que espera el
// visor (centro, u, n, w, h, z, z1, recorte…), colocadas en la zona de montaje de su formato
// con displayPlacementForReference (catalogo.mjs), y una `escena` para el visor (sala, paredes
// que se cortan, pantallas). El vídeo y sus UV no cambian: cada pantalla conserva su recorte.
//
// Convenio: el modelo va en metros con Y arriba; el plano usa (x, y) en planta y la altura
// aparte, con y = z del modelo. Una pieza con rotación r mira a (sin r, cos r) en planta.

import { displayPlacementForReference, geometriaDesdePantallas } from './catalogo.mjs?v=real-1';
import { zonaDe } from './escenas-realistas.mjs?v=real-1';

/** Lo que el bisel añade alrededor de la pantalla (escena3d: 16 mm el LCD, 20 mm el armario LED). */
export const MARCO = 0.03;
const r9 = v => Math.round(v * 1e9) / 1e9;

/** Gira un vector de planta `ang` radianes (en el sentido de x hacia y). */
export const girar = ([x, y], ang) => [r9(x * Math.cos(ang) - y * Math.sin(ang)), r9(x * Math.sin(ang) + y * Math.cos(ang))];

/** Montaje que dice la ficha según el soporte de la zona (textos en espacios.mjs, MONTAJES). */
const MONTAJE_DE_SOPORTE = { four_side_led_pedestal: 'peana', overhead_fascia_rail: 'banda-alta' };


/**
 * El cubo LED: el prisma de la zona con las caras del plano, giradas para que la cara que da a la
 * sala en el gemelo de siempre (la de su `recorte`) mire aquí a la cámara (+z del modelo). El
 * orden de las caras (y sus recortes) no cambia: el lienzo sigue dando la vuelta al cubo seguido.
 */
function cuboRealista(p, placement) {
  const b = placement.bounds, lado = placement.width / 4, alto = placement.height;
  const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
  const frente = p.cubo.frente || (p.cubo.caras && p.cubo.caras[0].n) || p.n || [0, 1];
  const ang = Math.atan2(1, 0) - Math.atan2(frente[1], frente[0]);
  const caras = Array.isArray(p.cubo.caras) && p.cubo.caras.length === 4
    ? p.cubo.caras.map(c => ({ cara: c.cara, n: girar(c.n, ang), recorte: { ...c.recorte } }))
    : null;
  const bottom = placement.bottom;
  return {
    ...p, pared: 'zona', s: 0, x0: cx - lado / 2, x1: cx + lado / 2, z: bottom, z1: bottom + alto, w: lado, h: alto,
    n: [0, 1], u: [1, 0], yaw: 0, separacion: 0, centro: [cx, cz, bottom + alto / 2], apoyo: null, textura: null, player: null, portatil: false,
    montaje: 'peana', cubo: { ...p.cubo, lado, alto, centro: [cx, cz], peana: bottom, caras, frente: [0, 1] },
  };
}

/**
 * Coloca el formato en su zona. `pantallas`: las del formato en el gemelo de siempre.
 * `formato`: la entrada del índice (su `zona`) o su id. Devuelve { zona, placement, pantallas,
 * escala } o lanza si el formato no cabe ('placement-outside-zone').
 */
export function montarFormato(pantallas, def, formato) {
  const ps = (pantallas || []).filter(p => p && p.centro);
  if (!ps.length) throw new Error('sin-pantallas');
  const zona = zonaDe(def, formato);
  const g = geometriaDesdePantallas(ps);
  const placement = displayPlacementForReference(g, zona, { formatId: typeof formato === 'string' ? formato : formato?.formato, escala: 'fisica', base: g.base, marco: MARCO });
  const soporte = zona.definition.supports.type;
  if (g.cubo) return { zona, placement, escala: placement.physicalScale, pantallas: [cuboRealista(ps.find(p => p.cubo), placement)] };
  const porId = new Map(ps.map(p => [p.id, p]));
  const out = placement.pieces.map(pc => {
    const p = porId.get(pc.id);
    const r = pc.rotation, n = [r9(Math.sin(r)), r9(Math.cos(r))], u = [r9(Math.cos(r)), r9(-Math.sin(r))];
    const { x, y, z } = pc.position, w = pc.width, h = pc.height;
    return {
      ...p, pared: 'zona', s: 0, x0: x - w / 2, x1: x + w / 2, z: y - h / 2, z1: y + h / 2, w, h,
      n, u, yaw: Math.atan2(n[0], n[1]), separacion: 0, centro: [x, z, y], apoyo: null, textura: null, player: null, portatil: false,
      montaje: MONTAJE_DE_SOPORTE[soporte] || 'soporte', montajePlano: p.montaje || null,
    };
  });
  return { zona, placement, escala: placement.physicalScale, pantallas: out };
}

/** Paredes del modelo con la forma de escenaDesdePlano (para cortarlas y para «Desde la puerta»). */
export function paredesEscena(def) {
  return (def.paredes || []).map(w => {
    const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], len = Math.hypot(dx, dy) || 1;
    const n = [-dy / len, dx / len];
    return { id: w.id, nombre: w.nombre || w.id, a: w.a, b: w.b, len, alto: def.sala.alto, n, u: [dx / len, dy / len], yaw: Math.atan2(n[0], n[1]),
      huecos: (w.huecos || []).map(h => ({ ...h, pared: w.id })), macizos: [] };
  });
}

/** La escena que maneja el visor en modo Realista: la sala del modelo, sus paredes y las pantallas montadas. */
export function escenaMontada(def, montado, { id = def.id, nombre = def.nombre?.es || def.id } = {}) {
  const { ancho, fondo, alto } = def.sala;
  return { id, nombre, realista: true, version: def.modelo.id, avisos: [],
    sala: { ancho, fondo, alto, centro: [ancho / 2, fondo / 2] },
    paredes: paredesEscena(def), pantallas: montado.pantallas, dispositivos: [], muebles: [], grupos: [] };
}

/** ¿Está cada pantalla (con su marco) dentro de la caja de la zona? Para los tests y el visor. */
export function dentroDeZona(pantallas, zona, marco = MARCO) {
  const b = zona.definition.mount.zone, eps = 1e-6;
  return pantallas.every(p => {
    const pts = [];
    if (p.cubo) {
      const l = p.cubo.lado / 2 + marco / 2;
      for (const dx of [-l, l]) for (const dy of [-l, l]) for (const h of [p.z - marco / 2, p.z1 + marco / 2]) pts.push([p.centro[0] + dx, p.centro[1] + dy, h]);
    } else {
      const [ux, uy] = p.u, hw = p.w / 2 + marco / 2;
      for (const k of [-1, 1]) for (const h of [p.z - marco / 2, p.z1 + marco / 2]) pts.push([p.centro[0] + ux * hw * k, p.centro[1] + uy * hw * k, h]);
    }
    return pts.every(([x, y, h]) => x >= b.min.x - eps && x <= b.max.x + eps && y >= b.min.z - eps && y <= b.max.z + eps && h >= b.min.y - eps && h <= b.max.y + eps);
  });
}
