const manifestUrl = new URL('./assets/counter-interpreted-best.manifest.json', import.meta.url);
const text = (id, value) => { document.getElementById(id).textContent = value; };
const formatNumber = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });

function bytesLabel(bytes) {
  return Number.isFinite(bytes) ? `${formatNumber.format(bytes / 1024 / 1024)} MB` : '';
}

function assetUrl(path) {
  const url = new URL(path, manifestUrl);
  if (url.origin !== location.origin || !url.pathname.startsWith(new URL('./assets/', import.meta.url).pathname)) {
    throw new Error('El archivo debe pertenecer al piloto.');
  }
  return url;
}

function downloadLink({ path, bytes }, title, extension, description) {
  const link = document.createElement('a');
  link.className = 'download';
  link.href = assetUrl(path);
  link.download = '';
  const type = document.createElement('span');
  type.className = 'file-type';
  type.textContent = extension;
  const body = document.createElement('span');
  body.className = 'file-text';
  const heading = document.createElement('strong');
  heading.textContent = title;
  const detail = document.createElement('small');
  detail.textContent = [description, bytesLabel(bytes)].filter(Boolean).join(' · ');
  body.append(heading, detail);
  const arrow = document.createElement('span');
  arrow.className = 'download-arrow';
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↓';
  link.append(type, body, arrow);
  return link;
}

async function showExportProfiles(downloads) {
  const profiles = await Promise.all(['good', 'better'].map(async quality => {
    const response = await fetch(new URL(`counter-interpreted-${quality}.manifest.json`, manifestUrl));
    if (!response.ok) throw new Error('No se puede cargar un perfil de exportación.');
    return { quality, manifest: await response.json() };
  }));
  const group = document.createElement('div');
  group.className = 'export-profiles';
  const title = document.createElement('p');
  title.className = 'profile-heading';
  title.textContent = 'OTROS PERFILES DEL MISMO MÓDULO';
  const grid = document.createElement('div');
  grid.className = 'profile-grid';
  for (const { quality, manifest } of profiles) {
    const link = document.createElement('a');
    link.className = 'profile-download';
    link.href = assetUrl(manifest.files.web);
    link.download = '';
    const name = document.createElement('strong');
    name.textContent = quality === 'good' ? 'Good · 8 bits ↓' : 'Better · 16 bits ↓';
    const detail = document.createElement('small');
    detail.textContent = `GLB · ${bytesLabel(manifest.counts.glb_bytes)} · ${formatNumber.format(manifest.counts.evaluated_triangles)} triángulos`;
    link.append(name, detail);
    grid.append(link);
  }
  const note = document.createElement('p');
  note.className = 'small-note';
  note.textContent = 'Estos perfiles ajustan geometría y texturas del activo. Todavía no sustituyen el mostrador en el juego.';
  group.append(title, grid, note);
  downloads.append(group);
}

async function showPilot() {
  const response = await fetch(manifestUrl);
  if (!response.ok) throw new Error('No se puede cargar el manifiesto del piloto.');
  const manifest = await response.json();
  const footprint = manifest.coordinates?.footprint_grid;
  if (!Array.isArray(footprint) || footprint.length !== 2 || !footprint.every(Number.isFinite)) {
    throw new Error('El manifiesto no incluye una huella de modelo válida.');
  }
  text('scene-dimensions', `${footprint.map(n => formatNumber.format(n)).join(' × ')} casillas`);
  text('scene-geometry', `${formatNumber.format(manifest.counts.mesh_objects)} piezas`);
  text('blender-version', manifest.blender_version || '');
  const img = document.getElementById('scene-render');
  img.addEventListener('load', () => { img.hidden = false; document.getElementById('render-message').hidden = true; }, { once: true });
  img.addEventListener('error', () => { text('render-message', 'No se ha podido cargar el render. Puedes consultar los archivos del piloto más abajo.'); }, { once: true });
  img.src = assetUrl(manifest.files.preview);
  const links = [
    downloadLink({ path: manifest.files.source }, 'Fuente editable de Blender', 'BLEND', 'Geometría, materiales, luces y cámara'),
    downloadLink({ path: manifest.files.web, bytes: manifest.counts.glb_bytes }, 'Módulo para otros motores', 'GLB', 'Intercambio glTF · importación por validar en Unreal'),
    downloadLink({ path: manifest.files.preview }, 'Render del piloto', 'PNG', 'Vista fija renderizada desde el modelo'),
  ];
  const source = document.createElement('a');
  source.className = 'download manifest';
  source.href = manifestUrl;
  source.textContent = 'Consultar manifiesto del modelo ↗';
  links.push(source);
  const downloads = document.getElementById('downloads');
  downloads.replaceChildren(...links);
  showExportProfiles(downloads).catch(error => console.error('[Xpacios Lab] Perfiles adicionales', error));
}

showPilot().catch(error => {
  text('render-message', 'Los archivos del piloto no están disponibles en esta copia.');
  text('scene-dimensions', 'No disponible');
  text('downloads', 'No se ha podido leer el manifiesto. Vuelve a cargar la página cuando los archivos del piloto estén disponibles.');
  console.error('[Xpacios Lab]', error);
});
