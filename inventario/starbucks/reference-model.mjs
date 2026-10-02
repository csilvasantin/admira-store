const STATUSES = new Set(['registered', 'candidate', 'product_reference']);

export function referenceLabel(reference) {
  return String(reference.reference_number).padStart(3, '0');
}

export function referencePhotoURL(reference, baseURL) {
  if (typeof reference.photo !== 'string' || !/^\.\/photos\/[a-zA-Z0-9_-]+\.(?:webp|png|jpe?g)$/.test(reference.photo)) {
    throw new Error('Reference photo must be a local photograph in photos/');
  }
  return new URL(reference.photo, baseURL).href;
}

export function indexReferences(document, units = []) {
  if (!Array.isArray(document?.items)) throw new Error('Reference items unavailable');
  const byId = new Map(), byNumber = new Map(), byCode = new Map();
  const unitsByCode = new Map(units.map(unit => [unit.itil_code, unit]));
  for (const reference of document.items) {
    if (!Number.isSafeInteger(reference.reference_number) || reference.reference_number < 1 ||
        reference.reference_id !== 'PG103-' + referenceLabel(reference) ||
        !reference.name || !STATUSES.has(reference.status)) throw new Error('Invalid reference identity');
    if (byId.has(reference.reference_id) || byNumber.has(reference.reference_number)) throw new Error('Duplicate reference identity');
    referencePhotoURL(reference, 'https://www.xpaceos.com/inventario/starbucks/');
    if (reference.status === 'registered') {
      const unit = unitsByCode.get(reference.itil_code);
      if (!unit || unit.asset_number !== reference.asset_number) throw new Error('Registered reference does not match its inventory unit');
      if (byCode.has(reference.itil_code)) throw new Error('Duplicate inventory reference');
      byCode.set(reference.itil_code, reference);
    } else if (reference.itil_code != null || reference.asset_number != null) throw new Error('Unregistered references cannot claim an inventory unit or model');
    byId.set(reference.reference_id, reference);
    byNumber.set(reference.reference_number, reference);
  }
  for (const unit of units) {
    const reference = byCode.get(unit.itil_code);
    if (!reference) throw new Error('Inventory unit has no photographic reference');
    if (unit.reference_id && (unit.reference_id !== reference.reference_id || unit.reference_number !== reference.reference_number || unit.photo !== reference.photo)) throw new Error('Manifest and photographic reference disagree');
  }
  return { items: [...document.items].sort((a, b) => a.reference_number - b.reference_number), byId, byNumber, byCode };
}

export function selectReference(index, units, params) {
  const requestedReference = index.byId.get(params.get('ref'));
  const requestedUnit = units.find(unit => [unit.itil_code, unit.instance_id].includes(params.get('item')));
  const view = params.get('view') === 'references' || (requestedReference && requestedReference.status !== 'registered') ? 'references' : 'inventory';
  const reference = view === 'references'
    ? requestedReference || index.byCode.get(requestedUnit?.itil_code) || index.items[0]
    : index.byCode.get(requestedUnit?.itil_code) || (requestedReference?.status === 'registered' ? requestedReference : null) || index.byCode.get(units[0]?.itil_code);
  return { view, reference, unit: reference?.status === 'registered' ? units.find(unit => unit.itil_code === reference.itil_code) : null };
}

export function selectionURL(baseURL, { view, reference, unit, lang }) {
  const url = new URL(baseURL);
  url.searchParams.set('view', view === 'references' ? 'references' : 'inventory');
  if (reference) url.searchParams.set('ref', reference.reference_id); else url.searchParams.delete('ref');
  if (unit) url.searchParams.set('item', unit.itil_code); else url.searchParams.delete('item');
  if (lang) url.searchParams.set('lang', lang);
  return url;
}

export function nameFor(reference, unit, language) {
  return language === 'en' ? reference?.name_en || unit?.name_en || reference?.name || unit?.name : reference?.name || unit?.name;
}
