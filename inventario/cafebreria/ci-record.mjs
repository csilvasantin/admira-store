import {recordForUnit, recordURL, recordFields, redactPrivateInventoryFields, assertCode} from '../ci-record.mjs';

export {recordForUnit, recordURL, recordFields, redactPrivateInventoryFields, assertCode};

export function unitByInstance(manifest, instanceId) {
  return (manifest?.units || []).find(u => u.instance_id === instanceId) || null;
}

export function unitByCode(manifest, code) {
  assertCode(code);
  const matches = (manifest?.units || []).filter(u => u.itil_code === code);
  if (matches.length > 1) throw Error('Ambiguous ITIL identity');
  return matches[0] || null;
}

export function publicRecord(manifest, instanceId, en = false) {
  const unit = unitByInstance(manifest, instanceId);
  const record = recordForUnit(manifest, unit);
  if (!record) return null;
  return { record, fields: recordFields(record, en), yokup: recordURL(record.code, 'https://www.xpaceos.com/xpacios/cafebreria/?inventory=1') };
}
