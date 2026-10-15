// Qué centro abrir según la dirección. El selector «Proyecto y local» del gemelo Matrix llega con el
// local del registro central (?venue=… y ?loc=…); un enlace directo puede traer ?centro=… .
// Orden: centro explícito, después el local (venue y loc), y si no, el primer centro con modelo.

const ID = /^[a-z0-9][a-z0-9_-]{1,79}$/;

export function centroDesdeURL(search, centros) {
  const p = new URLSearchParams(search);
  const porId = id => centros.find(c => c.id === id);
  const porLocal = id => (ID.test(id || '') ? centros.find(c => (c.locales || []).includes(id)) : null);
  return porId(p.get('centro')) || porLocal(p.get('venue')) || porLocal(p.get('loc')) || centros.find(c => !c.enlace) || centros[0];
}
