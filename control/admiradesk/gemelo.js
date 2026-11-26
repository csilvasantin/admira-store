// AdmiraDesk · gemelo de control. No pinta nada por su cuenta: muestra las 32 teclas tal como las devuelve el
// servidor (las mismas que el plugin pone en el Stream Deck XL) y manda cada clic a POST api/pulsar.
const API = new URL('./api/', location.href);
const $ = (id) => document.getElementById(id);
const rejilla = $('rejilla');
const botones = new Map();
let huellaActual = '', ocupado = false;

for (let f = 0; f < 4; f++) for (let c = 0; c < 8; c++) {
  const pos = c + ',' + f, b = document.createElement('button');
  b.className = 'tecla'; b.dataset.pos = pos; b.setAttribute('role', 'gridcell');
  const img = document.createElement('img'); img.alt = ''; b.append(img);
  b.addEventListener('click', () => pulsar(pos, b));
  rejilla.append(b); botones.set(pos, b);
}

const dataUrl = (svg) => 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(svg);
function pintar(c) {
  if (!c || !c.ok) return;
  $('modo').textContent = c.dry ? 'DRY · sin órdenes reales' : 'EN VIVO';
  $('modo').className = 'pill ' + (c.dry ? 'dry' : 'vivo');
  $('pagina').textContent = c.paginaTitulo; $('rev').textContent = c.rev; $('huella').textContent = c.huella;
  const u = c.ultima;
  $('ultima').textContent = u ? `${u.tecla} · ${u.origen} · ${u.resultado}${u.texto ? ' · ' + u.texto : ''}` : '—';
  $('armado').textContent = c.armado && c.armado.hasta >= c.ahora ? `${c.armado.tecla} (${(c.armado.pcs || []).join(', ')})` : '—';
  if (c.huella === huellaActual) return;
  huellaActual = c.huella;
  for (const t of c.teclas) {
    const b = botones.get(t.pos); if (!b) continue;
    const src = dataUrl(t.svg);
    if (b.firstChild.getAttribute('src') !== src) b.firstChild.setAttribute('src', src);
    b.dataset.svg = t.svg; b.dataset.tipo = t.tipo;
    b.classList.toggle('vacia', t.tipo === 'vacia');
    b.setAttribute('aria-label', t.titulo || 'vacía'); b.title = t.titulo || '';
  }
}
async function pedir(ruta, init) {
  const r = await fetch(new URL(ruta, API), { cache: 'no-store', credentials: 'same-origin', ...init });
  if (r.status === 401) { const j = await r.json().catch(() => ({})); if (j.login) location.href = j.login; return null; }
  return r.json();
}
async function pulsar(pos, b) {
  if (b.dataset.tipo === 'vacia') return;
  b.classList.add('pulsada'); setTimeout(() => b.classList.remove('pulsada'), 120);
  ocupado = true;
  try { pintar(await pedir('pulsar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tecla: pos }) })); }
  finally { ocupado = false; }
}
async function registro() {
  const e = await pedir('estado'); if (!e || !e.ok) return;
  $('registro').replaceChildren(...(e.registro || []).slice(0, 15).map((r) => {
    const li = document.createElement('li'); li.className = r.origen;
    li.textContent = `${new Date(r.ts).toLocaleTimeString('es-ES')} · ${r.origen} · ${r.pagina} ${r.tecla} · ${r.tipo}${r.ordenes.length ? ' → ' + r.ordenes.length + ' órdenes' : ''}`;
    return li;
  }));
}
async function fisico() {
  try {
    const r = await fetch('/objeto/stream-deck/api/estado', { cache: 'no-store' }); const j = await r.json();
    $('fisico').textContent = j.enLinea ? 'XL en línea · ' + (j.pageName || '') : 'XL sin conexión';
    $('fisico').className = 'pill ' + (j.enLinea ? 'on' : '');
  } catch { $('fisico').textContent = 'XL —'; }
}
async function bucle() { if (!ocupado) { try { pintar(await pedir('cara')); } catch {} } setTimeout(bucle, 1000); }
bucle(); fisico(); registro();
setInterval(registro, 2000); setInterval(fisico, 5000);
window.__admiradesk = { botones };
