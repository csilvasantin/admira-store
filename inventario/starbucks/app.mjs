import {mountSurfaceEditor} from '../surface-editor.mjs?v=surfaces-1';
import {recordFor, recordURL, recordFields} from './ci-record.mjs?v=ci-record-1';
import {mountCounterStage} from '../counter-stage.mjs?v=windows-menu-1';
import {indexReferences, referenceLabel, referencePhotoURL, selectReference, selectionURL, nameFor} from './reference-model.mjs?v=photo-references-1';

const params = new URLSearchParams(location.search), language = params.get('lang') === 'en' ? 'en' : 'es', en = language === 'en';
const $ = selector => document.querySelector(selector);
const copy = en ? {
  inventory:'3D inventory', references:'Real references', units:'Registered units', refs:'Numbered references', all:'All references',
  registered:'In inventory', candidate:'To review', product_reference:'Product reference', photo:'Real photo', unavailable:'Photo unavailable',
  element:'Photograph of this element', type:'Shared photograph of this furniture/product type; it does not identify an individual unit', context:'Context photograph; other elements also appear',
  ref:'Ref.', asset:'3D model', code:'Inventory', showModel:'View 3D model', photoLink:'Open real photo ↗', permalink:'Link to this reference',
  zone:'Zone', quantity:'Visible quantity', basis:'Reference basis', source:'Source', confidence:'Observation confidence',
  candidateNote:'Reference to review and choose the next model. It has no inventory registration or 3D model yet.',
  productNote:'Product observed in the 360 for future modelling. This reference does not represent stock or an individual inventory unit.',
  empty:'No references in this group.', loading:'Loading model…', error:'References unavailable: ', total:'references', models:'independent models', registeredUnits:'registered units'
} : {
  inventory:'Inventario 3D', references:'Referencias reales', units:'Unidades registradas', refs:'Referencias numeradas', all:'Todas las referencias',
  registered:'En inventario', candidate:'Por revisar', product_reference:'Producto de referencia', photo:'Foto real', unavailable:'Foto no disponible',
  element:'Fotografía de este elemento', type:'Foto compartida del tipo de mueble/producto; no identifica una unidad individual', context:'Foto de contexto; también aparecen otros elementos',
  ref:'Ref.', asset:'Modelo 3D', code:'Inventario', showModel:'Ver modelo 3D', photoLink:'Abrir foto real ↗', permalink:'Enlace a esta referencia',
  zone:'Zona', quantity:'Cantidad visible', basis:'Base de la referencia', source:'Fuente', confidence:'Confianza de la observación',
  candidateNote:'Referencia para revisar y elegir el siguiente modelo. Aún sin alta de inventario ni modelo 3D.',
  productNote:'Producto observado en el 360 para futuros modelos. Esta referencia no representa existencias ni una unidad individual de inventario.',
  empty:'No hay referencias en este grupo.', loading:'Cargando modelo…', error:'Referencias no disponibles: ', total:'referencias', models:'modelos independientes', registeredUnits:'unidades registradas'
};
document.documentElement.lang = language;
$('#inventory-view').textContent = copy.inventory; $('#references-view').textContent = copy.references;
$('#inventory-view').disabled = true; $('#references-view').disabled = true;
$('#show-model').textContent = copy.showModel; $('#photo-link').textContent = copy.photoLink; $('#reference-link').textContent = copy.permalink;
$('#empty-list').textContent = copy.empty;
for (const option of $('#reference-filter').options) option.textContent = option.value === 'all' ? copy.all : copy[option.value];
if (en) {
  document.title = 'Starbucks PG103 · Inventory and real references';
  $('#subtitle').textContent = 'Yokup inventory and photographic references';
  $('#basis').textContent = 'Each reference number identifies an element and its real photograph. Photos come from the Matrix 360 or supplied references. Reference numbers and 3D model numbers are independent.';
  $('#reference-note').textContent = '“To review” and “Product reference” are observations from the 360; they do not register new units or represent stock. Shared type or context photos are indicated on each record. Existing models use interpretative proportions; measurements and warranties are pending.';
  $('#catalog-link').textContent = 'Catalogue'; $('#matrix-link').textContent = 'Open Matrix 360 ↗';
  $('nav').setAttribute('aria-label', 'Navigation'); $('.view-switch').setAttribute('aria-label', 'Inventory view');
  $('#units').setAttribute('aria-label', 'Numbered elements'); $('#reference-filter').setAttribute('aria-label', 'Filter references');
  $('#model-heading').textContent = 'Interpretative 3D model'; $('#wire-label').textContent = 'Wireframe';
  $('canvas').setAttribute('aria-label', '3D model: drag or use arrow keys to orbit');
  for (const [selector, label] of [['[data-view="front"]','Front'],['[data-view="back"]','Back'],['[data-view="side"]','Side'],['[data-bottle-glb]','Bottle GLB ↓'],['[data-bottle-blend]','Bottle Blender ↓']]) $(selector).textContent = label;
  for (const [selector, label] of [['[data-view="home"]','Perspective view'],['[data-zoom="in"]','Zoom in'],['[data-zoom="out"]','Zoom out']]) $(selector).setAttribute('aria-label', label);
}

const node = (tag, text, className) => { const element = document.createElement(tag); if (text != null) element.textContent = text; if (className) element.className = className; return element; };
const localized = value => value && typeof value === 'object' ? value[language] || value.es || value.en || '' : value;
const field = (reference, key) => localized(en ? reference[key + '_en'] ?? reference[key] : reference[key]);
let manifest, references, view = 'inventory', selectedReference, selectedUnit, filter = 'all', dispose, queue = Promise.resolve(), revision = 0;

function createPhoto(reference, className) {
  const image = node('img', null, className);
  image.src = referencePhotoURL(reference, location.href); image.alt = copy.photo + ': ' + nameFor(reference, null, language);
  image.loading = 'lazy'; image.decoding = 'async'; image.width = 88; image.height = 72;
  image.addEventListener('error', () => { const unavailable = node('span', copy.unavailable, className + ' photo-unavailable'); image.replaceWith(unavailable); }, {once:true});
  return image;
}

function updateURLs() {
  const url = selectionURL(location.href, {view, reference:selectedReference, unit:selectedUnit}); history.replaceState(null, '', url);
  $('#reference-link').href = selectionURL(location.href, {view:'references', reference:selectedReference, unit:selectedUnit}).href;
  for (const link of document.querySelectorAll('[data-language]')) link.href = selectionURL(location.href, {view, reference:selectedReference, unit:selectedUnit, lang:link.dataset.language}).href;
}

function renderList() {
  $('#inventory-grid').dataset.view = view;
  $('#inventory-view').setAttribute('aria-pressed', String(view === 'inventory'));
  $('#references-view').setAttribute('aria-pressed', String(view === 'references'));
  $('#reference-filter').hidden = view !== 'references'; $('#list-title').textContent = view === 'references' ? copy.refs : copy.units;
  const items = view === 'inventory' ? manifest.units.map(unit => references.byCode.get(unit.itil_code)) : references.items.filter(reference => filter === 'all' || reference.status === filter);
  $('#units').replaceChildren(...items.filter(Boolean).map(reference => {
    const button = node('button', null, 'unit-row'), text = node('span', null, 'unit-text');
    button.type = 'button'; button.dataset.reference = reference.reference_id; button.setAttribute('aria-pressed', String(reference === selectedReference));
    text.append(node('span', copy.ref + ' ' + referenceLabel(reference), 'ref-number'), node('strong', nameFor(reference, null, language)));
    text.append(node('small', reference.status === 'registered' ? reference.itil_code + ' · ' + copy.asset + ' ' + reference.asset_number : copy[reference.status]));
    button.append(createPhoto(reference, 'photo-thumb'), text); button.onclick = () => select(reference); return button;
  }));
  $('#empty-list').hidden = items.length > 0;
  const models = new Set(manifest.units.map(unit => unit.asset_number)).size;
  $('#view-count').textContent = view === 'references' ? references.items.length + ' ' + copy.total + ' · ' + manifest.units.length + ' ' + copy.registeredUnits : manifest.units.length + ' ' + copy.registeredUnits + ' · ' + models + ' ' + copy.models;
}

function showReferenceDetails(reference, unit) {
  const label = copy.ref + ' ' + referenceLabel(reference), name = nameFor(reference, unit, language);
  $('#selected-name').textContent = label + ' · ' + name;
  $('#selected-status').replaceChildren(node('span', copy[reference.status], 'status ' + reference.status));
  $('#selected-identity').textContent = reference.reference_id + (unit ? ' · ' + unit.itil_code + ' · ' + copy.asset + ' ' + unit.asset_number : '');
  renderCIRecord(reference);
  const image = $('#selected-photo'); image.hidden = false; image.src = referencePhotoURL(reference, location.href); image.alt = copy.photo + ': ' + name;
  image.onerror = () => { image.hidden = true; $('#photo-caption').textContent = copy.unavailable + ' · ' + label; };
  $('#photo-caption').textContent = copy.photo + ' · ' + label + '. ' + (copy[reference.photo_scope] || copy.element) + '. ' + (field(reference, 'photo_basis') || (unit ? field(unit, 'photo_basis') : '') || '');
  $('#photo-link').href = image.src; $('#show-model').hidden = !unit || view === 'inventory';
  $('#reference-meta').hidden = view === 'inventory'; $('#reference-meta').replaceChildren();
  for (const [key, value] of [['zone', field(reference, 'zone')], ['quantity', field(reference, 'visible_quantity')], ['basis', field(reference, 'basis')], ['source', field(reference, 'source')], ['confidence', field(reference, 'confidence')]]) {
    if (value != null && value !== '') $('#reference-meta').append(node('dt', copy[key]), node('dd', String(value)));
  }
  $('#candidate-note').hidden = Boolean(unit); $('#candidate-note').textContent = reference.status === 'product_reference' ? copy.productNote : copy.candidateNote;
  const show3d = Boolean(unit) && view === 'inventory'; $('#model-panel').hidden = !show3d; $('#model-controls').hidden = !show3d; $('#model-downloads').hidden = !show3d;
  for (const selector of ['[data-glb]', '[data-blend]', '[data-bottle-glb]', '[data-bottle-blend]']) $(selector).removeAttribute('href');
  if (unit) { $('[data-glb]').href = unit.model3d; $('[data-blend]').href = unit.master; }
  const filling = unit?.visual_filling;
  $('#unit-basis').textContent = filling ? (en ? 'Photo/360 interpretation with nominal dimensions. The 19 editable bottles form a visual composition; actual stock is unknown. Embedded PBR textures; approximate label.' : 'Interpretación de foto/360 con dimensiones nominales. Las 19 botellas editables forman una composición visual; las existencias reales son desconocidas. Texturas PBR embebidas y etiqueta aproximada.') : '';
  for (const [selector, url] of [['[data-bottle-glb]', filling?.model3d], ['[data-bottle-blend]', filling?.master]]) { const link = $(selector); link.hidden = !url; if (url) link.href = url; }
  return show3d;
}

function renderCIRecord(reference) {
  const record = recordFor(manifest, reference), panel = $('#ci-record');
  panel.hidden = !record;
  $('#ci-record-fields').replaceChildren(); $('#ci-record-history').replaceChildren();
  $('#ci-record-link').removeAttribute('href');
  if (!record) return;
  $('#ci-record-title').textContent = en ? 'ITIL and 3D record' : 'Ficha ITIL y 3D';
  $('#ci-record-note').textContent = en ? 'Public link confirmed on ' + record.confirmed_on + '. Yokup owns lifecycle data and history. This view does not verify current operational status.' : 'Vínculo público confirmado el ' + record.confirmed_on + '. Yokup mantiene los datos y el histórico patrimonial. Esta vista no verifica el estado operativo actual.';
  for (const [label, value] of recordFields(record, en)) $('#ci-record-fields').append(node('dt', label), node('dd', value));
  $('#ci-record-link').textContent = en ? 'Open master record and history in Yokup ↗' : 'Abrir ficha maestra e histórico en Yokup ↗';
  $('#ci-record-link').href = recordURL(record.code, location.href);
  $('#ci-history-title').textContent = en ? 'History of this visual link' : 'Histórico de este vínculo visual';
  for (const event of record.history) {
    const item = node('li', event.date + ' · ' + (en ? event.description_en : event.description));
    const link = node('a', en ? ' Source' : ' Fuente'); link.href = event.source; item.append(link); $('#ci-record-history').append(item);
  }
  // Shared shell remains the owner of /marca, CLI history and the forthcoming /avatarDigital.
}

function select(reference) {
  if (!reference) return;
  selectedReference = reference; selectedUnit = reference.status === 'registered' ? manifest.units.find(unit => unit.itil_code === reference.itil_code) : null;
  const unit = selectedUnit, currentRevision = ++revision;
  const show3d = showReferenceDetails(reference, unit); updateURLs(); renderList();
  queue = queue.catch(() => {}).then(async () => {
    dispose?.(); dispose = null;
    if (currentRevision !== revision || !show3d) return;
    const canvas = $('#model-panel canvas'); canvas.replaceWith(canvas.cloneNode(false));
    $('#model-status').textContent = copy.loading;
    dispose = await mountCounterStage($('#model-panel'), {number:unit.asset_number, name:nameFor(reference, unit, language)}, {controlsHost:document,onReady:api=>mountSurfaceEditor($('#model-panel'),api,{venue:manifest.location_id,instance:unit.instance_id,code:unit.itil_code},{en})});
    if (currentRevision !== revision) { dispose?.(); dispose = null; }
  }).catch(error => { if (currentRevision === revision) $('#model-status').textContent = (en ? 'Model unavailable: ' : 'Modelo no disponible: ') + error.message; });
}

function setView(nextView) {
  view = nextView;
  if (view === 'inventory' && selectedReference?.status !== 'registered') select(references.byCode.get(manifest.units[0].itil_code));
  else select(selectedReference || references.items[0]);
}
$('#inventory-view').onclick = () => setView('inventory'); $('#references-view').onclick = () => setView('references');
$('#show-model').onclick = () => setView('inventory'); $('#reference-filter').onchange = event => { filter = event.target.value; renderList(); };

try {
  const responses = await Promise.all([fetch('./manifest.json'), fetch('./references.json')]);
  if (responses.some(response => !response.ok)) throw Error(en ? 'Reload to try again.' : 'Recarga para volver a intentarlo.');
  const documents = await Promise.all(responses.map(response => response.json()));
  [manifest] = documents; references = indexReferences(documents[1], manifest.units);
  $('#inventory-view').disabled = false; $('#references-view').disabled = false;
  if (params.get('item') && !manifest.units.some(unit => [unit.itil_code,unit.instance_id].includes(params.get('item')))) throw Error(en ? 'The requested unit has no confirmed 3D link.' : 'La unidad solicitada no tiene un vínculo 3D confirmado.');
  const initial = selectReference(references, manifest.units, params); view = initial.view; select(initial.reference);
  if (params.get('ref') && !references.byId.has(params.get('ref'))) { $('#page-error').hidden = false; $('#page-error').textContent = en ? 'The requested reference does not exist; showing the first available reference.' : 'La referencia solicitada no existe; se muestra la primera referencia disponible.'; }
} catch (error) {
  $('#page-error').hidden = false; $('#page-error').textContent = copy.error + error.message; $('#view-count').textContent = ''; $('#viewer').hidden = true;
}
window.addEventListener('pagehide', () => { revision++; dispose?.(); });
