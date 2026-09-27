export const SCHEMA = 'xpaceos.xpacio.v1';
export const FIELDS = [
  'identificador', 'tipo', 'nombre', 'ubicacion', 'huella', 'aspecto',
  'estado', 'mantenimiento', 'incidencias', 'conexion', 'papel', 'pantalla',
  'compra', 'garantia',
];

export function cellMeters(doc) {
  const cell = doc.calibration.metersPerCell;
  return {
    widthOk: Math.abs(doc.plan.cols * cell - doc.plan.widthM) < 1e-6,
    depthOk: Math.abs(doc.plan.rows * cell - doc.plan.depthM) < 1e-6,
  };
}

export function garantia(item, today = '2026-09-25') {
  return item.compra.fin >= today ? 'en_garantia' : 'fuera';
}

export function ficha(item, today = '2026-09-25') {
  return { ...item, garantia: garantia(item, today) };
}
