// Versión pública de un plano admira.xpacio-plano/1 (misión DCL-6ae9d5b0e2d48ee2fd9c7b19).
// Criterio del ITIL de Yokup: un mapa público de qué pantalla hay en qué pared no debe estar
// abierto. Sin sesión se sirve la geometría para pintar el gemelo (salas, huecos, muebles,
// pantallas por orientación y tamaño), sin códigos ITIL, sin screenIds, sin la instalación de
// contenidos, sin Yokup y con la dirección reducida a calle y ciudad.
//
// Lógica pura: la usan la función de Pages functions/data/xpacios/[id].js (servidor, manda) y
// gemelo.mjs (cliente, por si la respuesta llega completa a una página sin sesión).

const SIN_NUMERO = /\s+\d+[a-zA-Z]?(?=\s*(?:$|[,·]))/g;
const TIPO_VIA = /^(?:carrer|calle|c\/|avinguda|avenida|avda\.?|av\.|passeig|paseo|pg\.|pla[cç]a|plaza|ronda|rambla|travessera|traves[ií]a)\s+(?:de\s+|del\s+|d')?/i;
const PERSONAL = /\s*·?\s*(?:puesto|mesa|silla|despacho)\s+de\s+[A-ZÁÉÍÓÚÑ][\p{L}]+/gu;

// «Carrer Gran de Gràcia 51, 1.ª planta · 08012 Barcelona» → «Gran de Gràcia · Barcelona».
export function direccionPublica(direccion = '') {
  const texto = String(direccion || '').trim();
  if (!texto) return '';
  const partes = texto.split(/\s*[,·]\s*/).filter(Boolean);
  const calle = (partes[0] || '').replace(TIPO_VIA, '').replace(/\s+\d+[a-zA-Z]?\b.*$/, '').trim();
  const ultima = partes.length > 1 ? partes[partes.length - 1] : '';
  const ciudad = ultima.replace(/\b\d{4,5}\b/g, '').replace(/\d+(\.ª|ª|º)?\s*planta/i, '').trim();
  return [calle, ciudad].filter(Boolean).join(' · ');
}

// «Laboratorio AdmiraNeXT · Gran de Gràcia 51» → «Laboratorio AdmiraNeXT · Gran de Gràcia».
export function nombrePublico(nombre = '') {
  return String(nombre || '').replace(SIN_NUMERO, '').replace(/\s{2,}/g, ' ').trim();
}

const limpiarPersonal = texto => String(texto || '').replace(PERSONAL, '').replace(/\s{2,}/g, ' ').trim();
const nombreHueco = h => (h.tipo === 'puerta' ? (/doble|pizarra/i.test(`${h.id} ${h.nombre || ''}`) ? 'Puerta doble · pizarras' : 'Puerta') : h.tipo === 'ventana' ? 'Ventana' : 'Hueco');

// Pieza del catálogo de xpaceos: {id: 'native:…', numero}. Nada más pasa a la copia pública.
const catalogoPublico = c => (c && /^native:[A-Za-z0-9]{1,64}$/.test(c.id || '') && Number.isSafeInteger(c.numero) && c.numero > 0) ? { id: c.id, numero: c.numero } : null;
export function planoPublico(plan) {
  if (!plan || typeof plan !== 'object') return plan;
  if (plan.publico === true) return plan;
  const pub = plan.publico && typeof plan.publico === 'object' ? plan.publico : {};
  const pantallas = (plan.pantallas || []).map((s, i) => {
    const portatil = /integrada|port[aá]til|laptop/i.test(`${s.nombre || ''}`);
    const o = s.orientacion === 'vertical' ? 'V' : 'H';
    return {
      id: `pantalla-${i + 1}`, nombre: portatil ? 'Pantalla integrada (portátil)' : `Pantalla ${o}`, corto: portatil ? 'Portátil' : o,
      tipo: 'pantalla', orientacion: s.orientacion, pulgadas: s.pulgadas, ...(s.aspecto ? { aspecto: s.aspecto } : {}), ...(s.dimensiones ? { dimensiones: s.dimensiones } : {}),
      ...(s.resolucion ? { resolucion: s.resolucion } : {}), pared: s.pared, s: s.s, z: s.z, ...(s.separacion != null ? { separacion: s.separacion } : {}),
      ...(s.player ? { player: s.player } : {}), ...(s.grupo ? { grupo: `mosaico-${[...new Set((plan.pantallas || []).map(x => x.grupo).filter(Boolean))].indexOf(s.grupo) + 1}`, grupoNombre: 'Mosaico' } : {}),
    };
  });
  const dispositivos = (plan.dispositivos || []).map(d => {
    const camara = /webcam|c[aá]mara|insta360|iot/i.test(`${d.categoria || ''} ${d.nombre || ''}`);
    const portatil = /port[aá]til|laptop/i.test(`${d.rol || ''}`);
    return {
      id: d.id, nombre: camara ? 'Cámara' : d.nombre, categoria: d.categoria || null, rol: camara ? 'cámara' : portatil ? 'portátil' : 'player',
      ...(d.pared ? { pared: d.pared } : {}), ...(d.s != null ? { s: d.s } : {}), ...(d.z != null ? { z: d.z } : {}),
    };
  });
  return {
    schema: plan.schema, id: plan.id, version: plan.version || null, publico: true,
    nombre: pub.nombre || nombrePublico(plan.nombre), direccion: pub.direccion || direccionPublica(plan.direccion),
    fuente: { titulo: (plan.fuente && plan.fuente.titulo) || '' },
    planta: plan.planta, ...(plan.criterios ? { criterios: plan.criterios } : {}),
    paredes: (plan.paredes || []).map(w => ({ id: w.id, nombre: limpiarPersonal(w.nombre) || `Pared ${w.id}`, a: w.a, b: w.b, ...(w.alto ? { alto: w.alto } : {}) })),
    huecos: (plan.huecos || []).map(h => ({ id: h.id, tipo: h.tipo, nombre: nombreHueco(h), pared: h.pared, desde: h.desde, ancho: h.ancho, base: h.base || 0, alto: h.alto })),
    // Tipo, base, pieza del catálogo y elemento del gemelo son geometría pública (el catálogo de xpaceos ya lo es);
    // el código ITIL de la pieza, no (orden «modelar» del Arquitecto, 18-oct-2026).
    mobiliario: (plan.mobiliario || []).map((m, i) => ({ id: `mueble-${i + 1}`, nombre: limpiarPersonal(m.nombre) || 'Mueble', x: m.x, y: m.y, w: m.w, d: m.d, alto: m.alto,
      ...(m.pared ? { pared: m.pared } : {}), ...(typeof m.tipo === 'string' ? { tipo: m.tipo } : {}), ...(m.base > 0 ? { base: m.base } : {}),
      ...(catalogoPublico(m.catalogo) ? { catalogo: catalogoPublico(m.catalogo) } : {}), ...(/^[a-z0-9][a-z0-9-]{0,63}$/i.test(m.gemelo || '') ? { gemelo: m.gemelo } : {}) })),
    dispositivos, pantallas,
  };
}

// Lo que nunca puede ir en la versión pública (lo comprueba el test).
export const CAMPOS_PRIVADOS = ['itil', 'itilPropuesto', 'screenId', 'yokup', 'contenidos', 'fleet', 'subgrupo', 'estado'];
