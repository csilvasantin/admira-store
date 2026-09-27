// Dos salas, un solo registro. La marca es una capa. El número no cambia.
// El 44 no se da de alta: el catálogo rechaza un número sin GLB.

export const FIELDS = [
  'identificador', 'tipo', 'nombre', 'ubicacion', 'huella', 'aspecto',
  'estado', 'mantenimiento', 'incidencias', 'conexion', 'papel', 'pantalla',
  'compra', 'garantia',
];

const care = {
  ultima: '2026-09-25',
  proxima: '2026-12-25',
  responsable: 'SmithMacMini',
};

const compraEjemplo = {
  ejemplo: true,
  fecha: '2026-03-01',
  proveedor: 'Ejemplo Suministros',
  factura: 'PED-EJEMPLO-100',
  serie: 'SER-EJEMPLO',
  fin: '2027-09-25',
};

function piece({ id, number, tipo, nombre, xpacio, zona, casilla, orientacion, huella, papel, pantalla = null, conexion = null, estado = 'en_marcha', reparable = true, compra = null, modeloTienda = null }) {
  return {
    identificador: id,
    modeloTienda,
    modeloEjemplo: modeloTienda == null || String(modeloTienda).startsWith('ejemplo'),
    numero: number,
    tipo,
    nombre,
    ubicacion: { xpacio, zona, casilla, orientacion },
    huella,
    aspecto: { 8: `skins/8/${String(number).padStart(2, '0')}-r0.png`, 16: `skins/16/${String(number).padStart(2, '0')}-r0.png`, 32: `catalog/${String(number).padStart(2, '0')}-r0.png`, 64: `skins/64/${String(number).padStart(2, '0')}-r0.png` },
    estado,
    reparable,
    mantenimiento: care,
    incidencias: [],
    conexion,
    papel,
    pantalla,
    compra: { ...compraEjemplo, ...(compra || {}), serie: (compra && compra.serie) || `SER-EJEMPLO-${number}` },
  };
}

export const ALSEA = [
  piece({ id: 'alsea-barra', number: 1, tipo: 'mostrador', nombre: 'Barra', xpacio: 'cafeteria-alsea', zona: 'barra', casilla: 'A1', orientacion: 0, huella: [1, 2], papel: 'Atiende el pedido. Es el mostrador 1 del Xtanco, con la capa Alsea.', conexion: 'xpacio:alsea:barra' }),
  piece({ id: 'alsea-menu-1', number: 13, tipo: 'pantalla', nombre: 'Pizarra 1', xpacio: 'cafeteria-alsea', zona: 'barra', casilla: 'B1', orientacion: 0, huella: [1, 1], papel: 'Primera pizarra del menú, en fila.', pantalla: { campana: 'Menú del día', circuito: 'Alsea Starbucks 100' }, conexion: 'xpacio:alsea:menu-1' }),
  piece({ id: 'alsea-menu-2', number: 13, tipo: 'pantalla', nombre: 'Pizarra 2', xpacio: 'cafeteria-alsea', zona: 'barra', casilla: 'B2', orientacion: 0, huella: [1, 1], papel: 'Segunda pizarra del menú, en fila.', pantalla: { campana: 'Menú del día', circuito: 'Alsea Starbucks 100' }, conexion: 'xpacio:alsea:menu-2' }),
  piece({ id: 'alsea-menu-3', number: 13, tipo: 'pantalla', nombre: 'Pizarra 3', xpacio: 'cafeteria-alsea', zona: 'barra', casilla: 'B3', orientacion: 0, huella: [1, 1], papel: 'Tercera pizarra del menú, en fila. Ejemplo de avería: fuera de garantía y no reparable.', pantalla: { campana: 'Menú del día', circuito: 'Alsea Starbucks 100' }, conexion: 'xpacio:alsea:menu-3', estado: 'averiado', reparable: false, compra: { serie: 'SER-EJEMPLO-013', fin: '2025-06-01', factura: 'PED-EJEMPLO-013' }, modeloTienda: 'ejemplo-pantalla' }),
  piece({ id: 'alsea-escaparate', number: 12, tipo: 'pantalla', nombre: 'Escaparate', xpacio: 'cafeteria-alsea', zona: 'fachada', casilla: 'C1', orientacion: 0, huella: [1, 1], papel: 'Anuncia desde la calle.', pantalla: { campana: 'Fachada', circuito: 'Alsea Starbucks 100' }, conexion: 'xpacio:alsea:escaparate' }),
  piece({ id: 'alsea-mesa-1', number: 37, tipo: 'mesa', nombre: 'Mesa', xpacio: 'cafeteria-alsea', zona: 'sala', casilla: 'D1', orientacion: 0, huella: [1, 1], papel: 'Mesa de sala.' }),
  piece({ id: 'alsea-mesa-2', number: 37, tipo: 'mesa', nombre: 'Mesa', xpacio: 'cafeteria-alsea', zona: 'sala', casilla: 'D2', orientacion: 0, huella: [1, 1], papel: 'Segunda mesa de sala.' }),
  piece({ id: 'alsea-silla-1', number: 43, tipo: 'silla', nombre: 'Silla', xpacio: 'cafeteria-alsea', zona: 'sala', casilla: 'E1', orientacion: 0, huella: [1, 1], papel: 'Silla 43 junto a la mesa.' }),
  piece({ id: 'alsea-silla-2', number: 43, tipo: 'silla', nombre: 'Silla', xpacio: 'cafeteria-alsea', zona: 'sala', casilla: 'E2', orientacion: 2, huella: [1, 1], papel: 'Silla 43 enfrente.' }),
  piece({ id: 'alsea-sofa', number: 39, tipo: 'sofa', nombre: 'Sofá', xpacio: 'cafeteria-alsea', zona: 'sala', casilla: 'F1', orientacion: 0, huella: [1, 1], papel: 'Sofá de espera.' }),
  piece({ id: 'alsea-lampara', number: 10, tipo: 'lampara', nombre: 'Lámpara', xpacio: 'cafeteria-alsea', zona: 'techo', casilla: 'G1', orientacion: 0, huella: [1, 1], papel: 'Alumbra la barra desde el techo. Sigue siendo la lámpara 10: el 44 no entra sin modelo.' }),
  piece({ id: 'alsea-planta', number: 9, tipo: 'planta', nombre: 'Planta', xpacio: 'cafeteria-alsea', zona: 'sala', casilla: 'H1', orientacion: 0, huella: [1, 1], papel: 'Testigo de la sala. Es la planta 9.' }),
];

export const XTANCO = [
  piece({ id: 'xtanco-mostrador', number: 1, tipo: 'mostrador', nombre: 'Mostrador', xpacio: 'xtanco-jti', zona: 'caja', casilla: 'A1', orientacion: 0, huella: [1, 2], papel: 'Base de la sala. Atiende al cliente.', conexion: 'xpacio:xtanco:mostrador' }),
  piece({ id: 'xtanco-expositor', number: 2, tipo: 'expositor', nombre: 'Estantería', xpacio: 'xtanco-jti', zona: 'sala', casilla: 'B1', orientacion: 0, huella: [1, 2], papel: 'Expositor. Es la estantería 2, no un registro nuevo.' }),
  piece({ id: 'xtanco-tablet', number: 15, tipo: 'pantalla', nombre: 'Pantalla de mostrador', xpacio: 'xtanco-jti', zona: 'caja', casilla: 'A1', orientacion: 0, huella: [1, 1], papel: 'Pantalla sobre el mostrador.', pantalla: { campana: 'Linea JTI', circuito: 'JTI Xtanco 100' }, conexion: 'xpacio:xtanco:mostrador-pantalla' }),
  piece({ id: 'xtanco-escaparate', number: 12, tipo: 'pantalla', nombre: 'Escaparate', xpacio: 'xtanco-jti', zona: 'fachada', casilla: 'C1', orientacion: 0, huella: [1, 1], papel: 'Pantalla de escaparate.', pantalla: { campana: 'Fachada JTI', circuito: 'JTI Xtanco 100' }, conexion: 'xpacio:xtanco:escaparate' }),
  piece({ id: 'xtanco-vending', number: 5, tipo: 'expendedora', nombre: 'Máquina expendedora', xpacio: 'xtanco-jti', zona: 'sala', casilla: 'D1', orientacion: 0, huella: [1, 1], papel: 'Expende. Es la máquina 5.' }),
  piece({ id: 'xtanco-silla', number: 43, tipo: 'silla', nombre: 'Silla del estanquero', xpacio: 'xtanco-jti', zona: 'caja', casilla: 'E1', orientacion: 1, huella: [1, 1], papel: 'Asiento del estanquero. Es la silla 43.' }),
  piece({ id: 'xtanco-lampara', number: 10, tipo: 'lampara', nombre: 'Lámpara', xpacio: 'xtanco-jti', zona: 'suelo', casilla: 'F1', orientacion: 0, huella: [1, 1], papel: 'Alumbra el mostrador desde el suelo.' }),
  piece({ id: 'xtanco-planta', number: 9, tipo: 'planta', nombre: 'Planta', xpacio: 'xtanco-jti', zona: 'sala', casilla: 'G1', orientacion: 0, huella: [1, 1], papel: 'Testigo. Es la planta 9.' }),
];

export function garantia(item, today = '2026-09-25') {
  return item.compra.fin >= today ? 'en_garantia' : 'fuera';
}

export function health(item) {
  if (item.estado === 'averiado' || item.incidencias.length) return 'rojo';
  if (item.estado === 'revision') return 'ambar';
  return 'verde';
}

export function salida(item, today = '2026-09-25') {
  if (item.estado !== 'averiado') return null;
  if (garantia(item, today) === 'en_garantia') return 'reclamacion_fabricante';
  if (item.reparable) return 'incidencia_yokup';
  return 'reponer';
}

export function slugModelo(value) {
  const slug = String(value || 'ejemplo-pantalla').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return slug || 'ejemplo-pantalla';
}

function dato(value) {
  return String(value ?? '').trim();
}

/** Id o nombre del local, solo si la ficha ya lo trae. */
function localDe(item) {
  return dato(item.local) || dato(item.ubicacion?.local) || dato(item.ubicacion?.xpacio);
}

/** Id o nombre de la pantalla, solo si la ficha ya lo trae. */
function pantallaDe(item) {
  const pantalla = item.pantalla;
  if (pantalla == null || pantalla === false) return '';
  if (typeof pantalla === 'string') return dato(pantalla);
  return dato(pantalla.nombre) || dato(pantalla.id) || dato(pantalla.identificador) || dato(item.nombre);
}

export function reponerUrl(item) {
  const modelo = slugModelo(item.modeloTienda);
  const query = new URLSearchParams({
    origen: 'yokup',
    equipo: item.identificador,
  });
  const local = localDe(item);
  const pantalla = pantallaDe(item);
  if (local) query.set('local', local);
  if (pantalla) query.set('pantalla', pantalla);
  return `https://admira.shop/p/${modelo}/?${query}`;
}

export function ficha(item, today = '2026-09-25') {
  return { ...item, garantia: garantia(item, today) };
}

export function sameNumber(a, b) {
  return a.numero === b.numero;
}
