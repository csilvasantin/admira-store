import * as THREE from 'three';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { OrbitControls } from './vendor/OrbitControls.js';

const $ = (id) => document.getElementById(id);
const container = $('canvas-container');
const packageURL = new URL('../', import.meta.url);
const modelURL = new URL('assets/coffee-display.glb', packageURL);
const manifestURL = new URL('inventory.json', packageURL);
const scene = new THREE.Scene();
const objects = new Map();
const originalPositions = new Map();
const originalVisible = new Map();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const translations = {
  es: {
    unrealRender: 'Render Unreal', unrealSource: 'Proyecto Unreal', downloadPack: 'Pack completo ZIP', blenderSource: 'Fuente Blender', back: 'Inventario', collection: 'MATRIX · COLECCIÓN 47', modelFormat: 'MODELO 3D · GLB', displayType: 'EXPOSITOR MODULAR', studioHeadline: 'Una colección.<br>Cada pieza, independiente.', dimensionOrder: 'ANCHO × ALTO × FONDO', nominalDimensionOrder: 'ORIENTATIVAS · ANCHO × ALTO × FONDO', loadingTitle: 'Cargando la colección', loadingMessage: 'Preparando el modelo y su inventario…', perspective: 'Perspectiva', front: 'Frontal', rotate: 'Girar', reset: 'Restaurar', hint: 'ARRASTRA PARA GIRAR · SCROLL PARA ACERCAR', explode: 'Vista despiece', studioFooter: 'ESTUDIO DE ACTIVOS / ESCALA EN METROS', inventoryEyebrow: 'INVENTARIO DE LA COLECCIÓN', explore: 'Explora las piezas', pieces: 'PIEZAS', models: 'MODELOS', shelves: 'BALDAS', showAll: 'Ver todo', selectedPiece: 'PIEZA SELECCIONADA', isolate: 'Aislar pieza', restoreCollection: 'Ver colección', downloadPiece: 'Descargar pieza', downloadCollection: 'Descargar colección GLB', consultManifest: 'Consultar inventario JSON', inventoryFooter: 'Cada pieza tiene un ID único y un modelo propio para incorporarla a tu inventario.', search: 'Buscar taza, termo, café…', all: 'Todo', location: 'Ubicación', measurements: 'Medidas', shelf: 'Balda', bay: 'Módulo', display: 'Expositor', empty: 'No hay piezas que coincidan con tu búsqueda.<br>Prueba otra palabra o categoría.', errorTitle: 'No se ha podido abrir el modelo', loadingModel: 'Cargando modelo GLB', canvas: 'Modelo 3D del expositor. Arrastra para girar, usa la rueda para acercar y pulsa una pieza para seleccionarla.', selectPiece: 'Seleccionar una pieza', closeDetail: 'Cerrar detalle', clearSelection: 'Quitar selección', frontTitle: 'Vista frontal', perspectiveTitle: 'Vista perspectiva', rotateTitle: 'Activar giro automático', resetTitle: 'Restaurar colección y cámara', explodeTitle: 'Separar piezas del expositor', catalogTitle: 'Catálogo de activos', viewerTitle: 'Visor 3D interactivo', contextError: 'El visor ha perdido el contexto gráfico. Recarga la página para continuar.', fileError: 'Abre este visor desde un servidor local: ejecuta python3 -m http.server en la carpeta del paquete y visita http://localhost:8000/preview/. Los navegadores requieren HTTP para cargar GLB y JSON.', manifestError: 'El inventario no contiene una lista de piezas válida.', missingManifest: 'No se encuentra inventory.json', missingNodes: 'Hay piezas del inventario sin su nodo 3D. Comprueba que el GLB y el JSON pertenecen a la misma colección.', genericError: 'Comprueba que el paquete contiene assets/coffee-display.glb e inventory.json.'
  },
  en: {
    unrealRender: 'Unreal render', unrealSource: 'Unreal project', downloadPack: 'Complete ZIP package', blenderSource: 'Blender source', back: 'Inventory', collection: 'MATRIX · COLLECTION 47', modelFormat: '3D MODEL · GLB', displayType: 'MODULAR DISPLAY', studioHeadline: 'One collection.<br>Every piece, independent.', dimensionOrder: 'WIDTH × HEIGHT × DEPTH', nominalDimensionOrder: 'ESTIMATED · WIDTH × HEIGHT × DEPTH', loadingTitle: 'Loading the collection', loadingMessage: 'Preparing the model and its inventory…', perspective: 'Perspective', front: 'Front', rotate: 'Rotate', reset: 'Reset', hint: 'DRAG TO ROTATE · SCROLL TO ZOOM', explode: 'Exploded view', studioFooter: 'ASSET STUDIO / SCALE IN METERS', inventoryEyebrow: 'COLLECTION INVENTORY', explore: 'Explore the pieces', pieces: 'PIECES', models: 'MODELS', shelves: 'SHELVES', showAll: 'Show all', selectedPiece: 'SELECTED PIECE', isolate: 'Isolate piece', restoreCollection: 'View collection', downloadPiece: 'Download piece', downloadCollection: 'Download collection GLB', consultManifest: 'View JSON inventory', inventoryFooter: 'Each piece has a unique ID and its own model to add to your inventory.', search: 'Search mugs, tumblers, coffee…', all: 'All', location: 'Location', measurements: 'Dimensions', shelf: 'Shelf', bay: 'Bay', display: 'Display', empty: 'No pieces match your search.<br>Try another word or category.', errorTitle: 'Unable to open the model', loadingModel: 'Loading GLB model', canvas: '3D display model. Drag to rotate, scroll to zoom, and click a piece to select it.', selectPiece: 'Select a piece', closeDetail: 'Close details', clearSelection: 'Clear selection', frontTitle: 'Front view', perspectiveTitle: 'Perspective view', rotateTitle: 'Enable automatic rotation', resetTitle: 'Reset collection and camera', explodeTitle: 'Separate the pieces from the display', catalogTitle: 'Asset catalog', viewerTitle: 'Interactive 3D viewer', contextError: 'The viewer lost its graphics context. Reload the page to continue.', fileError: 'Open this viewer through a local server: run python3 -m http.server in the package folder and visit http://localhost:8000/preview/. Browsers require HTTP to load GLB and JSON.', manifestError: 'The inventory does not contain a valid list of pieces.', missingManifest: 'Cannot find inventory.json', missingNodes: 'Some inventory pieces have no matching 3D node. Check that the GLB and JSON belong to the same collection.', genericError: 'Check that the package contains assets/coffee-display.glb and inventory.json.'
  }
};
const englishLabels = {
  'coffee-kati': 'Kati Kati Blend coffee', 'coffee-pike': 'Pike Place Roast coffee', 'coffee-guatemala': 'Guatemala Antigua coffee', 'coffee-ethiopia': 'Ethiopia coffee', 'coffee-verona': 'Caffè Verona coffee', 'coffee-iced': 'Iced Coffee Blend', 'coffee_box-red': 'Espresso Roast coffee pods', 'coffee_box-yellow': 'Blonde Roast coffee pods', 'coffee_box-black': 'Dark Roast coffee pods', 'cold_cup-crimson': 'Clear tumbler · red lid', 'mug-city_box': 'City collection mug in gift box', 'mug-pumpkin': 'Wide orange ceramic mug', 'thermos-emerald': 'Emerald metallic thermos', 'thermos-ribbed': 'Green ribbed thermos', 'cold_cup-emerald': 'Emerald cold cup with straw', 'thermos-gold_rim': 'Green thermos · gold rim', 'mug-scale_green': 'Green mug · scale relief', 'cold_cup-confetti': 'Black and white confetti tumbler', 'cold_cup-checker': 'Green and cream checker tumbler', 'cold_cup-wave': 'Green wave tumbler', 'cold_cup-clear': 'Clear tumbler with straw', 'travel_mug-lid_green': 'Black travel cup · green lid', 'travel_mug-band_green': 'Black travel cup · green band', 'thermos-blackgreen': 'Black thermos · green band', 'mug-white_green': 'White mug · green interior', 'mug-black': 'Black ceramic mug'
};
const englishCategories = { 'Café en bolsa': 'Coffee bags', 'Café en caja': 'Coffee pods', Vasos: 'Tumblers', 'Tazas en caja': 'Gift mugs', Tazas: 'Mugs', Termos: 'Thermoses', 'Vasos térmicos': 'Travel cups' };
let language = 'es';
const urlLanguage = new URL(location.href).searchParams.get('lang');
try { language = ['es', 'en'].includes(urlLanguage) ? urlLanguage : localStorage.getItem('coffee-collection-language') || 'es'; } catch { language = ['es', 'en'].includes(urlLanguage) ? urlLanguage : 'es'; }
if (!translations[language]) language = 'es';
const t = (key) => translations[language][key] || translations.es[key] || key;
const locale = () => language === 'en' ? 'en-GB' : 'es-ES';
const normalizeSearch = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(locale());
const categoryNames = { coffee: 'Café', cafe: 'Café', mugs: 'Tazas', mug: 'Tazas', tazas: 'Tazas', tumblers: 'Vasos', tumbler: 'Vasos', cups: 'Vasos', vasos: 'Vasos', thermos: 'Termos', bottles: 'Termos', bottle: 'Termos', termos: 'Termos', boxes: 'Cajas', packaging: 'Cajas', caja: 'Cajas', cabinet: 'Mueble', furniture: 'Mueble' };
const iconPaths = {
  coffee: '<path d="M7 3h10l1 3-1 15H7L6 6z M7 6h10 M9 10h6 M9 13h6"/><path d="M12 16c-3-2-3 3 0 3 3 0 3-5 0-3Z"/>',
  mugs: '<path d="M4 7h12v12H4z M16 9h2a3 3 0 0 1 0 6h-2 M7 4h6"/>',
  tumblers: '<path d="M6 7h12l-2 14H8z M5 7V5h14v2 M12 5V1"/>',
  thermos: '<path d="M8 7h8l1 13H7z M8 4h8v3H8z M9 1h6v3 M9 11h6"/>',
  boxes: '<path d="m12 3 9 5v11l-9 4-9-4V8z M3 8l9 4 9-4 M12 12v11 M8 5l9 5"/>',
  cabinet: '<path d="M3 3h18v18H3z M12 3v18 M3 8h18 M3 13h18 M3 18h18"/>'
};
let inventory = null;
let model = null;
let renderer = null;
let controls = null;
let helper = null;
let selected = null;
let isolate = false;
let activeCategory = 'all';
let query = '';
let explosion = 0;
let view = 'perspective';
let pointerStart = null;
let pointerMoved = false;
let cameraTransition = null;
let products = [];
let cabinet = null;
let fullBounds = null;
let renderRequested = true;
const camera = new THREE.PerspectiveCamera(34, 1, .01, 150);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function assetHref(asset) {
  if (!asset) return null;
  return new URL(asset.replace(/^\.\//, ''), packageURL).href;
}

function categoryLabel(category) {
  if (language === 'en' && englishCategories[category]) return englishCategories[category];
  return categoryNames[String(category).toLowerCase()] || String(category).replace(/[_-]/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

function categoryIcon(category) {
  const label = String(category).toLowerCase();
  const key = /café|coffee/.test(label) ? (/caja|pods|box/.test(label) ? 'boxes' : 'coffee') : /taza|mug/.test(label) ? 'mugs' : /termo|thermos/.test(label) ? 'thermos' : /mueble|cabinet/.test(label) ? 'cabinet' : 'tumblers';
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths[key]}</svg>`;
}

function productLabel(item) {
  return language === 'en' ? item.label_en || englishLabels[item.sku] || item.label || item.sku : item.label || item.sku;
}

function renderDimensions() {
  if (!inventory?.dimensions) return;
  const { width, height, depth, basis } = inventory.dimensions;
  $('cabinet-dimensions').innerHTML = `${[width, height, depth].map((value) => Number(value).toLocaleString(locale(), { maximumFractionDigits: 2 })).join(' × ')} m<span>${t(basis === 'nominal_unmeasured' ? 'nominalDimensionOrder' : 'dimensionOrder')}</span>`;
}

function updateLanguage(nextLanguage, persist = true) {
  language = translations[nextLanguage] ? nextLanguage : 'es';
  if (persist) {
    try { localStorage.setItem('coffee-collection-language', language); } catch { /* Storage may be disabled in an embedded viewer. */ }
    const url = new URL(location.href);
    url.searchParams.set('lang', language);
    history.replaceState(null, '', url);
  }
  document.documentElement.lang = language;
  $('back-to-inventory').href = `/inventario/?asset=47&quality=matrix&lang=${language}#mostrador`;
  document.title = language === 'en' ? 'Matrix Coffee Collection — ITIL 3D Inventory' : 'Matrix Coffee Collection — Inventario 3D ITIL';
  for (const element of document.querySelectorAll('[data-i18n]')) {
    if (element.dataset.i18n === 'studioHeadline') element.innerHTML = t(element.dataset.i18n);
    else element.textContent = t(element.dataset.i18n);
  }
  $('search').placeholder = t('search');
  $('search').setAttribute('aria-label', t('search'));
  for (const id of ['lang-es', 'lang-en']) {
    const active = id === `lang-${language}`;
    $(id).classList.toggle('is-active', active);
    $(id).setAttribute('aria-pressed', String(active));
  }
  for (const [id, key] of [['view-front', 'frontTitle'], ['view-perspective', 'perspectiveTitle'], ['rotate', 'rotateTitle'], ['reset', 'resetTitle'], ['explode', 'explodeTitle'], ['close-detail', 'closeDetail'], ['clear-selection', 'clearSelection']]) {
    $(id).setAttribute('title', t(key));
    $(id).setAttribute('aria-label', t(key));
  }
  document.querySelector('.library').setAttribute('aria-label', t('catalogTitle'));
  document.querySelector('.studio').setAttribute('aria-label', t('viewerTitle'));
  if (renderer) renderer.domElement.setAttribute('aria-label', t('canvas'));
  $('isolate').textContent = t(isolate ? 'restoreCollection' : 'isolate');
  if (inventory) {
    renderDimensions();
    renderFilters();
    renderCatalog();
    if (selected) selectItem(selected);
  }
}

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', t('canvas'));
  renderer.domElement.setAttribute('role', 'img');
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = .075;
  controls.minDistance = .25;
  controls.maxDistance = 14;
  controls.maxPolarAngle = Math.PI * .49;
  controls.minPolarAngle = .14;
  controls.autoRotateSpeed = .55;
  controls.addEventListener('change', () => { renderRequested = true; });
  controls.addEventListener('start', () => { cameraTransition = null; });
  renderer.domElement.addEventListener('pointerdown', (event) => {
    pointerStart = { x: event.clientX, y: event.clientY };
    pointerMoved = false;
  });
  renderer.domElement.addEventListener('pointermove', (event) => {
    if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 5) pointerMoved = true;
  });
  renderer.domElement.addEventListener('pointerup', selectFromPointer);
  renderer.domElement.addEventListener('pointercancel', () => { pointerStart = null; });
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    showError(t('contextError'));
  });
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe(container);
  resize();
  addStudio();
  renderer.setAnimationLoop(render);
}

function addStudio() {
  scene.add(new THREE.HemisphereLight(0xfffbec, 0xa1aa91, 1.1));
  const main = new THREE.DirectionalLight(0xfff2dc, 2.8);
  main.position.set(-3, 5.5, 4.5);
  main.castShadow = true;
  main.shadow.mapSize.set(2048, 2048);
  main.shadow.camera.left = -3.8;
  main.shadow.camera.right = 3.8;
  main.shadow.camera.top = 3.8;
  main.shadow.camera.bottom = -3.8;
  main.shadow.camera.near = .1;
  main.shadow.camera.far = 16;
  main.shadow.bias = -.0003;
  main.shadow.normalBias = .015;
  main.shadow.radius = 3;
  scene.add(main);
  const fill = new THREE.DirectionalLight(0xf0f6ff, 1.15);
  fill.position.set(4, 2.3, 2.5);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffefc3, 1.6);
  rim.position.set(1, 3.5, -3);
  scene.add(rim);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ color: 0x6b6a56, opacity: .16 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.012;
  floor.receiveShadow = true;
  scene.add(floor);
  const environment = new THREE.Scene();
  environment.background = new THREE.Color(0xdfdfd8);
  const room = new THREE.Mesh(new THREE.BoxGeometry(12, 9, 12), new THREE.MeshBasicMaterial({ color: 0xeae8df, side: THREE.BackSide }));
  room.position.y = 3;
  environment.add(room);
  const panel = (width, height, position, rotation, power) => {
    const material = new THREE.MeshBasicMaterial();
    material.color.setRGB(power, power * .98, power * .94);
    const lightPanel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    lightPanel.position.set(...position);
    lightPanel.rotation.set(...rotation);
    environment.add(lightPanel);
  };
  panel(3.5, 5, [-4, 2.5, 2], [0, Math.PI / 2, 0], 4);
  panel(2, 4.5, [4, 3, 1], [0, -Math.PI / 2, 0], 2.2);
  panel(4, 4, [0, 6.5, 0], [Math.PI / 2, 0, 0], 3.2);
  const generator = new THREE.PMREMGenerator(renderer);
  panel(.65, 4.5, [-1.4, 3, 5], [0, Math.PI, 0], 4.8);
  const envMap = generator.fromScene(environment, .025);
  scene.environment = envMap.texture;
  generator.dispose();
  environment.traverse((object) => { if (object.isMesh) { object.geometry.dispose(); object.material.dispose(); } });
}

function resize() {
  if (!renderer) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (!width || !height) return;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderRequested = true;
}

function render() {
  if (cameraTransition) {
    renderRequested = true;
    const amount = Math.min((performance.now() - cameraTransition.start) / cameraTransition.duration, 1);
    const eased = 1 - Math.pow(1 - amount, 3);
    camera.position.lerpVectors(cameraTransition.from, cameraTransition.to, eased);
    controls.target.lerpVectors(cameraTransition.targetFrom, cameraTransition.targetTo, eased);
    if (amount === 1) cameraTransition = null;
  }
  controls.update();
  if (renderRequested) {
    if (helper && selected) helper.update();
    renderer.render(scene, camera);
    renderRequested = false;
  }
}

function setCamera(type = 'perspective', bounds = fullBounds, instant = false) {
  if (!bounds || bounds.isEmpty()) return;
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const vertical = size.y / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  const horizontal = Math.max(size.x, size.z) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
  const distance = Math.max(vertical, horizontal, .35) * (bounds === fullBounds ? 1.48 : 1.8);
  const direction = type === 'front' ? new THREE.Vector3(0, .06, 1) : new THREE.Vector3(.58, .28, 1);
  const destination = center.clone().add(direction.normalize().multiplyScalar(distance));
  if (instant || reducedMotion) {
    camera.position.copy(destination);
    controls.target.copy(center);
    cameraTransition = null;
  } else {
    cameraTransition = { start: performance.now(), duration: 650, from: camera.position.clone(), to: destination, targetFrom: controls.target.clone(), targetTo: center };
  }
  view = type;
  renderRequested = true;
  $('view-front').classList.toggle('is-active', type === 'front');
  $('view-perspective').classList.toggle('is-active', type === 'perspective');
}

function normalizeInventory(data) {
  if (!Array.isArray(data.items)) throw new Error(t('manifestError'));
  inventory = data;
  const grouped = new Map();
  for (const item of inventory.items) {
    const sku = item.sku || item.id;
    if (!grouped.has(sku)) {
      const definition = (inventory.skus || []).find((entry) => entry.sku === sku || entry.id === sku) || {};
      grouped.set(sku, { ...item, ...definition, sku, instances: [] });
    }
    grouped.get(sku).instances.push(item);
  }
  products = [...grouped.values()];
  $('stat-items').textContent = inventory.items.length;
  $('stat-skus').textContent = products.length;
  const shelfCount = new Set(inventory.items.map((item) => item.shelf).filter((value) => value !== undefined && value !== null)).size;
  $('stat-shelves').textContent = shelfCount || 5;
  renderDimensions();
  if (inventory.asset || inventory.model) $('download-collection').href = assetHref(inventory.asset || inventory.model);
  renderFilters();
  renderCatalog();
}

function renderFilters() {
  $('filters').replaceChildren();
  const categories = [...new Set(products.map((product) => product.category))];
  const all = document.createElement('button');
  all.className = `filter${activeCategory === 'all' ? ' is-active' : ''}`;
  all.textContent = t('all');
  all.dataset.category = 'all';
  all.setAttribute('aria-pressed', String(activeCategory === 'all'));
  $('filters').append(all);
  for (const category of categories) {
    const button = document.createElement('button');
    button.className = `filter${activeCategory === category ? ' is-active' : ''}`;
    button.textContent = categoryLabel(category);
    button.dataset.category = category;
    button.setAttribute('aria-pressed', String(activeCategory === category));
    $('filters').append(button);
  }
  $('filters').onclick = (event) => {
    const button = event.target.closest('button[data-category]');
    if (!button) return;
    activeCategory = button.dataset.category;
    applyFilters();
  };
}

function matches(item) {
  const categoryMatches = activeCategory === 'all' || item.category === activeCategory;
  const text = [item.label, productLabel(item), item.sku, item.category, categoryLabel(item.category), item.id, item.description].join(' ');
  const normalizedText = normalizeSearch(text);
  return categoryMatches && (!query || normalizedText.includes(query));
}

function renderCatalog() {
  const filtered = products.filter(matches);
  $('list-count').textContent = language === 'en' ? `${filtered.length} AVAILABLE MODEL${filtered.length === 1 ? '' : 'S'}` : `${filtered.length} MODELO${filtered.length === 1 ? '' : 'S'} DISPONIBLE${filtered.length === 1 ? '' : 'S'}`;
  $('catalog').replaceChildren();
  if (!filtered.length) {
    $('catalog').innerHTML = `<p class="catalog-empty">${t('empty')}</p>`;
    return;
  }
  for (const product of filtered) {
    const button = document.createElement('button');
    button.className = `catalog-item${selected?.sku === product.sku ? ' is-selected' : ''}`;
    button.dataset.sku = product.sku;
    button.setAttribute('aria-label', `${productLabel(product)}, ${product.instances.length} ${t('pieces').toLowerCase()}. ${t('selectPiece')}.`);
    button.innerHTML = `<span class="product-swatch">${categoryIcon(product.category)}</span><span class="product-info"><span class="product-label">${escapeHTML(productLabel(product))}</span><span class="product-sub">${escapeHTML(categoryLabel(product.category))} · ${escapeHTML(product.sku)}</span></span><span class="product-count">×${product.instances.length}</span>`;
    button.addEventListener('click', () => {
      const currentIndex = product.instances.findIndex((item) => item.id === selected?.id);
      const instance = product.instances[(currentIndex + 1) % product.instances.length];
      selectItem(instance);
    });
    $('catalog').append(button);
  }
}

function applyFilters() {
  for (const button of $('filters').querySelectorAll('button')) {
    const active = button.dataset.category === activeCategory;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  }
  $('clear-filter').hidden = activeCategory === 'all' && !query;
  if (selected && !matches(selected) && !isolate) clearSelection();
  updateVisibility();
  renderCatalog();
}

function updateVisibility() {
  if (!model) return;
  for (const item of inventory.items) {
    const object = objects.get(item.node);
    if (object) object.visible = isolate ? selected?.node === item.node : matches(item);
  }
  if (cabinet) cabinet.visible = !isolate;
  if (helper) helper.visible = Boolean(selected && objects.get(selected.node)?.visible);
  renderer.shadowMap.needsUpdate = true;
  renderRequested = true;
}

function selectFromPointer(event) {
  if (!model || !pointerStart || pointerMoved) { pointerStart = null; return; }
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  pointerStart = null;
  const hits = raycaster.intersectObject(model, true);
  for (const hit of hits) {
    let object = hit.object;
    let visible = true;
    for (let ancestor = object; ancestor; ancestor = ancestor.parent) if (!ancestor.visible) visible = false;
    if (!visible) continue;
    while (object && object !== model) {
      const item = inventory.items.find((candidate) => candidate.node === object.name);
      if (item) { selectItem(item); return; }
      object = object.parent;
    }
    // Visible cabinet surfaces occlude products behind them.
    break;
  }
  clearSelection();
}

function selectItem(item) {
  const object = objects.get(item.node);
  if (!object) return;
  selected = item;
  if (helper) { scene.remove(helper); helper.geometry.dispose(); helper.material.dispose(); }
  helper = new THREE.BoxHelper(object, 0x258560);
  helper.material.depthTest = false;
  helper.material.transparent = true;
  helper.material.opacity = .72;
  helper.renderOrder = 20;
  scene.add(helper);
  $('detail').hidden = false;
  $('selection-tag').hidden = false;
  $('selection-label').textContent = productLabel(item);
  $('detail-label').textContent = productLabel(item);
  $('detail-category').textContent = categoryLabel(item.category);
  const fields = [['ID', item.id, true], ['SKU', item.sku, true], [t('location'), `${item.shelf !== undefined ? `${t('shelf')} ${item.shelf}` : t('display')}${item.bay !== undefined ? ` · ${t('bay')} ${item.bay}` : ''}`]];
  const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
  fields.push([t('measurements'), `${[size.x, size.y, size.z].map((value) => (value * 100).toLocaleString(locale(), { maximumFractionDigits: 1 })).join(' × ')} cm`]);
  $('detail-fields').innerHTML = fields.map(([key, value, mono]) => `<dt>${escapeHTML(key)}</dt><dd${mono ? ' class="mono"' : ''}>${escapeHTML(value)}</dd>`).join('');
  const product = products.find((candidate) => candidate.sku === item.sku);
  const href = assetHref(item.asset || product?.asset);
  const link = $('download-piece');
  link.hidden = !href;
  if (href) { link.href = href; link.download = `${item.sku}.glb`; }
  updateVisibility();
  renderCatalog();
  if (isolate) setCamera(view, new THREE.Box3().setFromObject(object));
}

function clearSelection() {
  if (isolate) {
    isolate = false;
    $('isolate').textContent = t('isolate');
    setCamera(view);
  }
  selected = null;
  if (helper) { scene.remove(helper); helper.geometry.dispose(); helper.material.dispose(); helper = null; }
  $('detail').hidden = true;
  $('selection-tag').hidden = true;
  updateVisibility();
  if (inventory) renderCatalog();
}

function explodeItems(amount) {
  explosion = amount;
  $('explode-value').textContent = `${Math.round(amount * 100)} %`;
  if (!model) return;
  for (const item of inventory.items) {
    const object = objects.get(item.node);
    const original = originalPositions.get(item.node);
    if (!object || !original) continue;
    const sign = item.bay === 'left' || item.bay === 'L' || item.bay === 'izquierda' ? -1 : item.bay === 'right' || item.bay === 'R' || item.bay === 'derecha' ? 1 : original.x < 0 ? -1 : 1;
    const shelf = Number(item.shelf) || 1;
    object.position.copy(original);
    // Every root remains independent and keeps its original rotation and scale.
    object.position.x += sign * amount * (.2 + Math.abs(original.x) * .5);
    object.position.y += amount * (.03 + Math.max(0, shelf - 1) * .018);
    object.position.z += amount * (.48 + ((item.row ?? 0) === 0 ? .12 : 0) + Math.abs(original.x) * .13);
  }
  if (isolate && selected) setCamera(view, new THREE.Box3().setFromObject(objects.get(selected.node)));
  renderer.shadowMap.needsUpdate = true;
  renderRequested = true;
}

function resetAll() {
  if (!model) return;
  clearSelection();
  controls.autoRotate = false;
  $('rotate').classList.remove('is-active');
  $('rotate').setAttribute('aria-pressed', 'false');
  $('search').value = '';
  query = '';
  activeCategory = 'all';
  $('explode').value = 0;
  explodeItems(0);
  applyFilters();
  setCamera('perspective');
}

function showError(message) {
  $('loading').hidden = false;
  $('loading').classList.add('error');
  $('loading').querySelector('strong').textContent = t('errorTitle');
  $('loading-message').textContent = message;
}

$('view-front').addEventListener('click', () => setCamera('front', isolate && selected ? new THREE.Box3().setFromObject(objects.get(selected.node)) : fullBounds));
$('view-perspective').addEventListener('click', () => setCamera('perspective', isolate && selected ? new THREE.Box3().setFromObject(objects.get(selected.node)) : fullBounds));
$('rotate').addEventListener('click', () => {
  if (!controls) return;
  cameraTransition = null;
  controls.autoRotate = !controls.autoRotate;
  $('rotate').classList.toggle('is-active', controls.autoRotate);
  $('rotate').setAttribute('aria-pressed', String(controls.autoRotate));
});
$('reset').addEventListener('click', resetAll);
$('explode').addEventListener('input', (event) => explodeItems(Number(event.target.value) / 100));
$('search').addEventListener('input', (event) => { query = normalizeSearch(event.target.value.trim()); applyFilters(); });
$('clear-filter').addEventListener('click', () => { activeCategory = 'all'; query = ''; $('search').value = ''; applyFilters(); });
$('clear-selection').addEventListener('click', clearSelection);
$('close-detail').addEventListener('click', clearSelection);
$('isolate').addEventListener('click', () => {
  if (!selected) return;
  isolate = !isolate;
  $('isolate').textContent = t(isolate ? 'restoreCollection' : 'isolate');
  updateVisibility();
  setCamera(view, isolate ? new THREE.Box3().setFromObject(objects.get(selected.node)) : fullBounds);
});
window.addEventListener('keydown', (event) => { if (event.key === 'Escape') clearSelection(); });
$('lang-es').addEventListener('click', () => updateLanguage('es'));
$('lang-en').addEventListener('click', () => updateLanguage('en'));
$('back-to-inventory').hidden = !location.pathname.startsWith('/inventario/');
updateLanguage(language);

async function loadCollection() {
  if (location.protocol === 'file:') {
    showError(t('fileError'));
    return;
  }
  try {
    initRenderer();
    const response = await fetch(manifestURL);
    if (!response.ok) throw new Error(`${t('missingManifest')} (${response.status}).`);
    normalizeInventory(await response.json());
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(modelURL.href, (event) => {
      $('loading-message').textContent = event.total ? `${t('loadingModel')} · ${Math.round(event.loaded / event.total * 100)} %` : `${t('loadingModel')} · ${(event.loaded / 1048576).toLocaleString(locale(), { maximumFractionDigits: 1 })} MB`;
    });
    model = gltf.scene;
    scene.add(model);
    model.traverse((object) => {
      if (object.name) objects.set(object.name, object);
      if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        if (object.material) {
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => { material.envMapIntensity = .65; });
        }
      }
    });
    cabinet = objects.get('CI_CABINET') || null;
    const missing = [];
    for (const item of inventory.items) {
      const object = objects.get(item.node);
      if (object) { originalPositions.set(item.node, object.position.clone()); originalVisible.set(item.node, object.visible); }
      else missing.push(item.node);
    }
    if (missing.length) throw new Error(`${missing.length}: ${t('missingNodes')}`);
    fullBounds = new THREE.Box3().setFromObject(model);
    renderer.shadowMap.needsUpdate = true;
    setCamera('perspective', fullBounds, true);
    $('loading').hidden = true;
    updateVisibility();
    // Exposed read-only diagnostics help verify the exported assets and selection.
    window.coffeeViewer = { inventory, model, scene, camera, renderer, controls, objects, get selected() { return selected; }, get explosion() { return explosion; }, selectItem: (id) => selectItem(inventory.items.find((item) => item.id === id)), reset: resetAll };
  } catch (error) {
    console.error('Coffee collection:', error);
    showError(error.message || t('genericError'));
  }
}

loadCollection();
