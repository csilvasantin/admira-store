// Proyectos que deja abrir la marca con la que se entra (Carlos, 15-oct-2026): con la marca personalizada
// de un cliente (?marca=<id> o /marca <id>) el selector «Proyecto y local» sólo ofrece sus proyectos;
// como Admira o sin marca, todos. La marca que pone el propio proyecto al elegirlo no encierra: quien
// entra como Admira y prueba Starbucks puede volver a cualquier otro.

// Proyectos de cada marca. Sin entrada, una marca abre el proyecto con su mismo id.
export const PROYECTOS_DE_MARCA = Object.freeze({
  starbucks: Object.freeze(['starbucks', 'starbucks-mexico']),
  altadis: Object.freeze(['altadis', 'estancos']),
});

const ADMIRA = new Set(['admira', 'off', 'none', 'ninguna', 'sin', 'default']);
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/;

/** La marca que limita el selector: la puesta a mano (mb:manual = '1') y que no es Admira. Si no, ''. */
export function marcaQueLimita({ marca, manual } = {}) {
  // «alsea» es Starbucks (Carlos, 15-oct-2026), igual que en assets/marca-blanca.js.
  const m0 = String(marca == null ? '' : marca).trim().toLowerCase();
  const m = m0 === 'alsea' ? 'starbucks' : m0;
  return manual === '1' && ID.test(m) && !ADMIRA.has(m) ? m : '';
}

/** Los proyectos que se ofrecen con esa marca. Una marca sin proyecto propio no deja el selector vacío. */
export function proyectosPermitidos(marca, proyectos) {
  if (!marca) return proyectos;
  const propios = PROYECTOS_DE_MARCA[marca] || [marca];
  const suyos = proyectos.filter(p => propios.includes(p.id));
  return suyos.length ? suyos : proyectos;
}
