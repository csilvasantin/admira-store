// AdmiraDesk · núcleo de la lanzadera (Carlos, 26-nov-2026: «que el control real (átomos) y el virtual (bits)
// funcione exactamente igual»). Un único módulo, sin dependencias, que usan la función de Pages (servidor),
// el gemelo de control (navegador) y los tests. El plugin del Stream Deck XL NO lleva copia: pide la cara ya
// pintada al servidor y le manda cada pulsación, igual que el gemelo. Así hay una sola fuente de verdad
// (lanzadera.json), un solo estado (en la nube) y una sola ruta de acción (POST pulsar).
//
//  validar(cfg)                         -> lista de errores ([] = válida)
//  estadoInicial(cfg)                   -> estado vacío
//  pulsar(cfg, estado, pulsacion, ctx)  -> { estado, ordenes, respuesta }   (puro: no envía nada)
//  cara(cfg, estado, ctx)               -> 32 teclas { pos, tipo, titulo, svg }
//  teclaSVG(desc)                       -> SVG 144×144 de una tecla (lo que se ve en el XL y en el gemelo)
// ctx = { ahora (ms), piezas: [{num, titulo, id}] } · pulsacion = { tecla: "col,fila", origen: "fisico"|"gemelo"|... }

export const VERSION = 1;
export const LADO = 144;
export const ORIGENES = ['fisico', 'gemelo', 'test'];
export const TIPOS = ['info', 'ir', 'volver', 'panel', 'cmd', 'energia', 'sala', 'pieza'];
export const ENERGIA = { encender: { ruta: '/encender' }, apagar: { ruta: '/apagar' }, arrancar: { ruta: '/player', accion: 'arrancar' }, reiniciar: { ruta: '/player', accion: 'reiniciar' } };
// Rutas del panel de Planeta que puede pedir una tecla (las mismas que admite /contenido del panel).
export const RUTAS_PANEL = /^\/(show\/goto\/[0-3]|show\/prev|pause|play|next|stop|sync|walk-all|music|key\/(studio|admirito|pixeria|musica))$/;
export const CMD_OK = /^(next|prev|reload|generico|sync|standby|resume)$/;
// Pilares: ninguna tecla puede apuntar a estos equipos (Carlos: el Mac Studio y el Mac Mini nunca se apagan ni se reinician).
export const PILARES = /mac\s*studio|macstudio|mac\s*mini|macmini/i;

const pos = (c, f) => c + ',' + f;
export function posiciones(cfg) {
  const { columnas, filas } = cfg.rejilla; const out = [];
  for (let f = 0; f < filas; f++) for (let c = 0; c < columnas; c++) out.push(pos(c, f));
  return out;
}

export function validar(cfg) {
  const e = [];
  if (!cfg || cfg.version !== VERSION) e.push('version');
  const { columnas, filas } = (cfg && cfg.rejilla) || {};
  if (columnas !== 8 || filas !== 4) e.push('rejilla 8x4 (Stream Deck XL)');
  if (!cfg.paginas || !cfg.paginas.inicio) e.push('falta la página inicio');
  const energia = new Set(cfg.pcsEnergia || []);
  for (const pc of energia) if (!/^0[1-5]$/.test(pc)) e.push('pcsEnergia solo admite 01-05: ' + pc);
  for (const [nc, car] of Object.entries(cfg.carruseles || {})) {
    for (const d of car.destinos || []) {
      if (!d.e || !d.pantalla) e.push(nc + ': destino sin e/pantalla');
      if (PILARES.test(d.e + ' ' + d.pantalla)) e.push(nc + ': un pilar no puede ser destino: ' + d.e);
      if (d.pc && !energia.has(d.pc)) e.push(nc + ': pc fuera de 01-05: ' + d.pc);
    }
  }
  for (const [np, p] of Object.entries(cfg.paginas || {})) {
    if (p.carrusel && !(cfg.carruseles || {})[p.carrusel]) e.push(np + ': carrusel desconocido');
    for (const [k, t] of Object.entries(p.teclas || {})) {
      const [c, f] = k.split(',').map(Number);
      if (!(c >= 0 && c < 8 && f >= 0 && f < 4) || !/^\d,\d$/.test(k)) e.push(np + ' ' + k + ': posición');
      if (p.carrusel && f === 3) e.push(np + ' ' + k + ': la fila 3 es del carrusel');
      if (!TIPOS.includes(t.tipo)) e.push(np + ' ' + k + ': tipo ' + t.tipo);
      if (PILARES.test(JSON.stringify(t))) e.push(np + ' ' + k + ': tecla sobre un pilar');
      if (t.tipo === 'ir' && !cfg.paginas[t.pagina]) e.push(np + ' ' + k + ': página ' + t.pagina);
      if (t.tipo === 'panel' && !RUTAS_PANEL.test(t.ruta || '')) e.push(np + ' ' + k + ': ruta ' + t.ruta);
      if (t.tipo === 'cmd' && !CMD_OK.test(t.cmd || '')) e.push(np + ' ' + k + ': cmd ' + t.cmd);
      if (t.tipo === 'energia' && !ENERGIA[t.accion]) e.push(np + ' ' + k + ': energía ' + t.accion);
      if (t.tipo === 'energia' && p.carrusel !== 'zona') e.push(np + ' ' + k + ': energía solo con el carrusel de la zona');
      if (t.tipo === 'sala' && !((cfg.sala || {}).contenidos || {})[t.contenido]) e.push(np + ' ' + k + ': contenido ' + t.contenido);
      if (t.tipo === 'sala' && p.carrusel !== 'sala') e.push(np + ' ' + k + ': sala solo con el carrusel de la sala');
    }
    for (const h of p.huecosPiezas || []) if ((p.teclas || {})[h]) e.push(np + ' ' + h + ': hueco de pieza ocupado');
  }
  for (const c of Object.values((cfg.sala || {}).contenidos || {})) if (!/^https:\/\//.test(c.url || '')) e.push('sala: url no https');
  return e;
}

export function estadoInicial(cfg) {
  const sel = {}, carrusel = {};
  for (const n of Object.keys(cfg.carruseles || {})) { sel[n] = {}; carrusel[n] = 0; }
  return { v: VERSION, pagina: 'inicio', carrusel, sel, armado: null, ultima: null, registro: [] };
}

function normalizar(cfg, estado) {
  const base = estadoInicial(cfg);
  const e = Object.assign({}, base, estado || {});
  e.sel = Object.assign({}, base.sel, e.sel); e.carrusel = Object.assign({}, base.carrusel, e.carrusel);
  if (!cfg.paginas[e.pagina]) e.pagina = 'inicio';
  e.registro = Array.isArray(e.registro) ? e.registro : [];
  return e;
}

// Carrusel (fila de abajo): ‹ · hasta 6 destinos · ›. El último elemento de la lista es «Todos»/«Ambas».
function itemsCarrusel(cfg, n) { const c = cfg.carruseles[n]; return [...c.destinos, { e: c.todos || 'Todos', todos: true }]; }
function paginasCarrusel(cfg, n) { return Math.max(1, Math.ceil(itemsCarrusel(cfg, n).length / (cfg.carruseles[n].porPagina || 6))); }
function itemEn(cfg, e, n, col) {
  const por = cfg.carruseles[n].porPagina || 6, pag = Math.min(e.carrusel[n] || 0, paginasCarrusel(cfg, n) - 1);
  return itemsCarrusel(cfg, n)[pag * por + col - 1] || null;
}
function marcado(cfg, e, n, item) {
  if (!item) return false;
  const s = e.sel[n] || {};
  if (item.todos) return cfg.carruseles[n].destinos.length > 0 && cfg.carruseles[n].destinos.every((d) => s[d.e]);
  return !!s[item.e];
}
export function seleccionados(cfg, estado, n) {
  const s = (estado.sel || {})[n] || {};
  return cfg.carruseles[n].destinos.filter((d) => s[d.e]);
}

// Tecla de la página actual en la posición dada, con las piezas #streamdeck y el carrusel resueltos.
export function teclaEn(cfg, estado, p, ctx) {
  const e = normalizar(cfg, estado), pag = cfg.paginas[e.pagina];
  const [c, f] = p.split(',').map(Number);
  if (pag.carrusel && f === cfg.rejilla.filas - 1) {
    const n = pag.carrusel, total = paginasCarrusel(cfg, n), actual = Math.min(e.carrusel[n] || 0, total - 1);
    if (c === 0) return { tipo: 'flecha', carrusel: n, dir: -1, titulo: '‹', activa: actual > 0, texto: (actual + 1) + '/' + total };
    if (c === cfg.rejilla.columnas - 1) return { tipo: 'flecha', carrusel: n, dir: 1, titulo: '›', activa: actual < total - 1, texto: (actual + 1) + '/' + total };
    const item = itemEn(cfg, e, n, c);
    if (!item) return { tipo: 'vacia' };
    return { tipo: item.todos ? 'todos' : 'destino', carrusel: n, e: item.e, titulo: item.e, grupo: item.grupo || '', marcado: marcado(cfg, e, n, item) };
  }
  const fija = (pag.teclas || {})[p];
  if (fija) return Object.assign({}, fija);
  const hueco = (pag.huecosPiezas || []).indexOf(p);
  if (hueco >= 0) {
    const pz = ((ctx && ctx.piezas) || []).slice(0, (cfg.piezas || {}).max || 21)[hueco];
    if (pz) return { tipo: 'pieza', num: pz.num, titulo: pz.titulo, icono: '#' + pz.num, color: '#123d6b' };
  }
  return { tipo: 'vacia' };
}

function anota(e, entrada) { e.registro = [entrada, ...(e.registro || [])].slice(0, 20); }

// Lo que hace una pulsación. Puro: devuelve el nuevo estado y las órdenes; quien llama decide si las envía (dry o en vivo).
export function pulsar(cfg, estado, pulsacion, ctx) {
  const ahora = Number((ctx && ctx.ahora) || 0);
  const p = String((pulsacion && pulsacion.tecla) || '');
  const origen = ORIGENES.includes(pulsacion && pulsacion.origen) ? pulsacion.origen : 'gemelo';
  const e = JSON.parse(JSON.stringify(normalizar(cfg, estado)));
  if (!/^[0-7],[0-3]$/.test(p)) return { estado: e, ordenes: [], respuesta: { ok: false, error: 'tecla' } };
  const pagina = e.pagina, t = teclaEn(cfg, e, p, ctx), ordenes = [];
  let resultado = 'hecho', texto = '';
  const armadoAqui = e.armado && e.armado.pagina === pagina && e.armado.tecla === p && ahora <= e.armado.hasta;
  if (t.tipo !== 'energia') e.armado = null;
  const carrusel = (cfg.paginas[pagina] || {}).carrusel;
  const destinos = carrusel ? seleccionados(cfg, e, carrusel) : [];
  switch (t.tipo) {
    case 'ir': e.pagina = t.pagina; break;
    case 'volver': e.pagina = 'inicio'; break;
    case 'flecha': {
      const total = paginasCarrusel(cfg, t.carrusel), nueva = Math.max(0, Math.min(total - 1, (e.carrusel[t.carrusel] || 0) + t.dir));
      if (nueva === (e.carrusel[t.carrusel] || 0)) resultado = 'nada';
      e.carrusel[t.carrusel] = nueva; break;
    }
    case 'destino': { const s = e.sel[t.carrusel]; s[t.e] = !s[t.e]; if (!s[t.e]) delete s[t.e]; break; }
    case 'todos': {
      const todos = !t.marcado, s = {};
      if (todos) for (const d of cfg.carruseles[t.carrusel].destinos) s[d.e] = true;
      e.sel[t.carrusel] = s; break;
    }
    case 'panel': ordenes.push({ via: 'panel', ruta: '/contenido', cuerpo: { ruta: t.ruta } }); break;
    case 'cmd':
      for (const d of destinos) ordenes.push({ via: 'cmd', id: d.pantalla, cmd: t.cmd });
      if (!destinos.length) { resultado = 'sin-destino'; texto = 'Marca un destino'; }
      break;
    case 'pieza': {
      const sinc = destinos.filter((d) => d.pc && (cfg.sincro || []).includes(d.e));
      const juntos = sinc.length > 1;
      for (const d of destinos) {
        const enSincro = juntos && sinc.includes(d);
        ordenes.push({ via: 'cmd', id: d.pantalla, cmd: enSincro ? 'playat-' + t.num : 'loop' + t.num, sincro: enSincro || undefined });
      }
      if (!destinos.length) { resultado = 'sin-destino'; texto = 'Marca un destino'; }
      break;
    }
    case 'energia': {
      const pcs = destinos.filter((d) => d.pc && (cfg.pcsEnergia || []).includes(d.pc)).map((d) => d.pc);
      const unicos = [...new Set(pcs)].sort();
      if (!unicos.length) { resultado = 'sin-destino'; texto = 'Marca un PC 01-05'; e.armado = null; break; }
      if (!armadoAqui) {   // primera pulsación: solo arma; la segunda (en dobleToqueMs) ejecuta
        e.armado = { pagina, tecla: p, hasta: ahora + (cfg.dobleToqueMs || 4000), pcs: unicos };
        resultado = 'armado'; texto = '¿Seguro? Pulsa otra vez'; break;
      }
      e.armado = null;
      const en = ENERGIA[t.accion];
      ordenes.push({ via: 'panel', ruta: en.ruta, cuerpo: en.accion ? { pcs: unicos, accion: en.accion } : { pcs: unicos } });
      break;
    }
    case 'sala': {
      for (const d of destinos) ordenes.push({ via: 'cmd', id: d.pantalla + '-vigilante', cmd: 'abrir-' + t.contenido });
      if (!destinos.length) { resultado = 'sin-destino'; texto = 'Marca Philips o Pizarra'; }
      break;
    }
    default: resultado = 'nada';
  }
  if (ordenes.length) resultado = 'enviando';
  e.ultima = { pagina, tecla: p, origen, ts: ahora, resultado, texto, ordenes: ordenes.length };
  anota(e, { ts: ahora, origen, pagina, tecla: p, tipo: t.tipo, ordenes });
  return { estado: e, ordenes, respuesta: { ok: true, tipo: t.tipo, resultado, texto } };
}

// Resultado del envío (servidor): marca la última pulsación como hecha, parcial o error.
export function resolver(estado, ok, total, dry) {
  const e = JSON.parse(JSON.stringify(estado));
  if (!e.ultima) return e;
  e.ultima.resultado = dry ? 'simulado' : total > 0 && ok === total ? 'ok' : ok > 0 ? 'parcial' : 'error';
  e.ultima.texto = (dry ? 'DRY ' : '') + ok + '/' + total;
  return e;
}

// ── Pintado ────────────────────────────────────────────────────────────────────────────────────────
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function lineas(texto, max, n) {
  const pal = String(texto || '').split(/\s+/).filter(Boolean), out = [];
  let l = '';
  for (const w of pal) { if ((l + ' ' + w).trim().length > max && l) { out.push(l); l = w; } else l = (l + ' ' + w).trim(); }
  if (l) out.push(l);
  if (out.length > n) { out.length = n; out[n - 1] = out[n - 1].slice(0, max - 1) + '…'; }
  return out.map((x) => (x.length > max ? x.slice(0, max - 1) + '…' : x));
}
const COLOR_RESPUESTA = { enviando: '#f1c40f', ok: '#2ecc71', simulado: '#3fa7ff', parcial: '#f39c12', error: '#e74c3c', armado: '#e74c3c', 'sin-destino': '#e67e22' };

export function teclaSVG(d) {
  const L = LADO, fondo = d.color || (d.tipo === 'vacia' ? '#000000' : '#1b2430');
  let cuerpo = '';
  if (d.tipo !== 'vacia') {
    const borde = d.marcado ? '#2ecc71' : d.tipo === 'flecha' && !d.activa ? '#333333' : 'rgba(255,255,255,0.18)';
    cuerpo += `<rect x="4" y="4" width="${L - 8}" height="${L - 8}" rx="14" fill="${fondo}" stroke="${borde}" stroke-width="${d.marcado ? 8 : 3}"/>`;
    const icono = d.tipo === 'flecha' ? d.titulo : d.tipo === 'destino' || d.tipo === 'todos' ? (d.marcado ? '✓' : '') : d.icono || '';
    if (icono) cuerpo += `<text x="72" y="${d.tipo === 'flecha' ? 88 : 62}" font-family="Arial, Helvetica, sans-serif" font-size="${d.tipo === 'flecha' ? 64 : icono.length > 2 ? 30 : 42}" font-weight="700" fill="#ffffff" text-anchor="middle">${esc(icono)}</text>`;
    const etiqueta = d.tipo === 'flecha' ? d.texto : d.titulo;
    const ls = lineas(etiqueta, d.tipo === 'destino' || d.tipo === 'todos' ? 9 : 12, d.tipo === 'destino' ? 1 : 2);
    const y0 = d.tipo === 'destino' || d.tipo === 'todos' ? (icono ? 108 : 82) : d.tipo === 'flecha' ? 126 : ls.length > 1 ? 100 : 112;
    ls.forEach((l, i) => { cuerpo += `<text x="72" y="${y0 + i * 22}" font-family="Arial, Helvetica, sans-serif" font-size="${d.tipo === 'destino' ? 34 : 20}" font-weight="700" fill="#ffffff" text-anchor="middle">${esc(l)}</text>`; });
    if (d.grupo && (d.tipo === 'destino')) cuerpo += `<text x="72" y="130" font-family="Arial, Helvetica, sans-serif" font-size="16" fill="#cfd8e3" text-anchor="middle">${esc(d.grupo)}</text>`;
  }
  if (d.respuesta) {
    const col = COLOR_RESPUESTA[d.respuesta] || '#ffffff';
    cuerpo += `<rect x="0" y="0" width="${L}" height="${L}" rx="16" fill="none" stroke="${col}" stroke-width="10"/>`;
    cuerpo += `<rect x="8" y="8" width="${L - 16}" height="34" rx="8" fill="${col}"/>`;
    cuerpo += `<text x="72" y="32" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="700" fill="#000000" text-anchor="middle">${esc((d.respuestaTexto || d.respuesta).slice(0, 14))}</text>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${L}" viewBox="0 0 ${L} ${L}"><rect width="${L}" height="${L}" fill="#000000"/>${cuerpo}</svg>`;
}

export function cara(cfg, estado, ctx) {
  const e = normalizar(cfg, estado), ahora = Number((ctx && ctx.ahora) || 0);
  const u = e.ultima && e.ultima.pagina === e.pagina && ahora - e.ultima.ts < (cfg.respuestaMs || 2500) ? e.ultima : null;
  const arm = e.armado && e.armado.pagina === e.pagina && ahora <= e.armado.hasta ? e.armado : null;
  return posiciones(cfg).map((p) => {
    const t = teclaEn(cfg, e, p, ctx);
    const d = { pos: p, tipo: t.tipo, titulo: t.titulo || '', icono: t.icono, color: t.color, marcado: t.marcado, activa: t.activa, texto: t.texto, grupo: t.grupo };
    if (arm && arm.tecla === p) { d.respuesta = 'armado'; d.respuestaTexto = '¿Seguro?'; }
    else if (u && u.tecla === p && u.resultado !== 'hecho' && u.resultado !== 'nada') { d.respuesta = u.resultado; d.respuestaTexto = u.texto || u.resultado; }
    return { pos: p, tipo: t.tipo, titulo: d.titulo, svg: teclaSVG(d) };
  });
}

export function svgDataUrl(svg) { return 'data:image/svg+xml;charset=utf8,' + encodeURIComponent(svg); }

// Huella corta y estable de una cara (para comparar el XL y el gemelo tecla a tecla sin depender de crypto).
export function huella(teclas) {
  let h = 2166136261 >>> 0;
  const s = teclas.map((t) => t.pos + '|' + t.svg).join('\n');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

// Piezas #streamdeck del índice de Stock (mismo criterio que previos.py: etiqueta compacta, prioridad, lo último primero).
export function piezasDeStock(indice, etiqueta = 'streamdeck') {
  const compacta = (t) => String(t).trim().replace(/^#/, '').toLowerCase().replace(/[\s_\-]+/g, '');
  const obj = compacta(etiqueta);
  const items = Array.isArray(indice) ? indice : (indice && indice.items) || [];
  const pr = (i) => (Number.isInteger(i.prioridad) && i.prioridad >= 0 && i.prioridad <= 9 ? i.prioridad : 2);
  return items
    .filter((i) => i && !i.oculto && Array.isArray(i.tags) && i.tags.some((t) => compacta(t) === obj) && /^\d+$/.test(String(i.num || '')) && Number(i.num) > 0)
    .sort((a, b) => String(b.id || '').localeCompare(String(a.id || '')))
    .sort((a, b) => pr(a) - pr(b))
    .map((i) => ({ num: Number(i.num), titulo: String(i.title || i.id).slice(0, 60), id: String(i.id || '') }));
}
