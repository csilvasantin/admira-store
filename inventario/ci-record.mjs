// Public visual identity. Yokup remains the lifecycle master; no private data is copied.
const CODE = /^[A-Z0-9]{2,12}(-[A-Z0-9]{2,12}){1,3}$/;

export function assertCode(code) {
  if (!CODE.test(code)) throw Error('Invalid ITIL code');
  return code;
}

export function recordFor(manifest, reference) {
  if (reference?.status !== 'registered') return null;
  const matches = manifest.units.filter(u => u.itil_code === reference.itil_code);
  if (matches.length !== 1) throw Error('Ambiguous ITIL identity');
  const unit = matches[0];
  if (!CODE.test(unit.itil_code) || !unit.instance_id || unit.asset_number !== reference.asset_number || unit.reference_id !== reference.reference_id) throw Error('ITIL / 3D identity mismatch');
  return recordFromUnit(manifest, unit, reference);
}

/** Scene locales (Cafebrería…): unit alone is enough when status is registered. */
export function recordForUnit(manifest, unit) {
  if (!unit || unit.status !== 'registered') return null;
  const matches = manifest.units.filter(u => u.itil_code === unit.itil_code);
  if (matches.length !== 1) throw Error('Ambiguous ITIL identity');
  if (!CODE.test(unit.itil_code) || !unit.instance_id) throw Error('ITIL / 3D identity mismatch');
  return recordFromUnit(manifest, unit, unit);
}

function recordFromUnit(manifest, unit, observation = {}) {
  return {
    code: unit.itil_code,
    instance: unit.instance_id,
    asset: unit.asset_number,
    location: manifest.location_id,
    confirmed_on: unit.confirmed_on || manifest.confirmed_on,
    lifecycle: unit.lifecycle || "registered",
    observed_zone: observation.zone || unit.zone || '',
    observed_zone_en: observation.zone_en || unit.zone_en || '',
    dimensions: unit.measurements?.verified === true ? unit.measurements : null,
    geometry_basis: unit.geometry_basis || manifest.geometry_basis,
    history: (manifest.record_history || []).filter(event => event.codes.includes(unit.itil_code))
  };
}

export function recordURL(code, baseURL) {
  assertCode(code);
  const base = new URL(baseURL), url = new URL('https://www.yokup.com/equipo-inventario');
  url.searchParams.set('code', code);
  // Carry explicitly selected appearance/language; never send credentials or session data.
  for (const key of ['lang', 'marca']) if (base.searchParams.has(key)) url.searchParams.set(key, base.searchParams.get(key));
  return url.href;
}

export function recordFields(record, en = false) {
  const row = (es, english, value) => [en ? english : es, value];
  const pending = en ? 'Pending field measurement' : 'Pendiente de medición de campo';
  const protectedData = en ? 'Consult in Yokup with authorised access' : 'Consultar en Yokup con acceso autorizado';
  return [
    row('Código ITIL', 'ITIL code', record.code),
    ...(record.lifecycle==='virtual_planned'?[row('Estado','Status',en?'Virtual planned device; physical installation pending':'Dispositivo virtual previsto; instalación física pendiente')]:[]),
    row('Instancia 3D', '3D instance', record.instance),
    row('Modelo compartido', 'Shared model', String(record.asset)),
    row('Xpacio', 'Space', record.location),
    row('Zona observada en la foto', 'Zone observed in photo', (en ? record.observed_zone_en : record.observed_zone) || (en ? 'No observation' : 'Sin observación')),
    row('Posición física exacta', 'Exact physical position', en ? 'Not verified by the photo; consult Yokup' : 'No verificada por la foto; consultar Yokup'),
    row('Medidas verificadas', 'Verified dimensions', record.dimensions ? record.dimensions.label : pending),
    row('Garantía y datos de compra', 'Warranty and purchase data', protectedData),
    row('Nº de serie', 'Serial number', protectedData),
    row('Última confirmación del vínculo', 'Last link confirmation', record.confirmed_on || (en ? 'Unknown' : 'Sin dato'))
  ];
}

/** Public gallery / export: never emit warranty or serial values. */
export function redactPrivateInventoryFields(row = {}) {
  const out = { ...row };
  for (const key of ['garantia', 'warranty', 'warranty_until', 'serial', 'serie', 'purchase_date', 'compra']) {
    if (key in out) out[key] = '';
  }
  return out;
}

export { CODE as ITIL_CODE_PATTERN };
