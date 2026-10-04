/* Cliente activo de XpaceOS (Carlos, 4-oct-2026). Mismas reglas que Pixeria:
 * - Por defecto el cliente es Admira y Admira lo ve TODO: no se filtra nada y no hay selector visible.
 * - `/marca <cliente>` en ⌘ Experto (assets/xpace-shell.js) o `?cliente=<id>` en la URL (los enlaces
 *   desde pixeria.com lo traen) filtra las listas de Xpacios: lo de ese cliente más lo genérico de Admira.
 *   `/marca off` vuelve a Admira. Vale para la sesión de esta pestaña (sessionStorage pixeria:cliente:v2,
 *   la misma clave que Pixeria; al ser otro dominio no se comparte, por eso manda ?cliente=).
 * - Qué cliente es cada ficha: /data/clientes-mapeo.json (editable). Ambiguas: solo con Admira.
 * - Lista de clientes: https://www.admiranext.com/api/clientes (Admira = por_defecto).
 * API: window.XpaceCliente = {listo, activo, nombre, lista, resolver, fijar, clientesDe, visible, filtrar}
 * y el evento `xpace:cliente` en document cada vez que cambia (o al cargar el mapeo).
 */
(function () {
  if (window.XpaceCliente) return;
  var KEY = 'pixeria:cliente:v2';
  var CLIENTES_URL = 'https://www.admiranext.com/api/clientes';
  var MAPEO_URL = '/data/clientes-mapeo.json';
  var TODOS = /^(admira|todos|todas|all|off|ninguno)$/;
  var slug = function (v) { return String(v == null ? '' : v).toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64); };
  var plano = function (v) { return String(v == null ? '' : v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ''); };
  var mapeo = null, lista = [], listo = false, alListo = null;
  var pListo = new Promise(function (r) { alListo = r; });

  // Cliente pedido, ya en la primera pintura (sin esperar a la red).
  var activo = null, q = null, g = null;
  try { q = new URLSearchParams(location.search).get('cliente'); } catch (_) {}
  try { g = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (_) {}
  var pedido = slug(q != null ? q : g && g.id);
  activo = pedido && !TODOS.test(pedido) ? pedido : null;
  if (q != null) guardar();

  function guardar() {
    try { if (activo) sessionStorage.setItem(KEY, JSON.stringify({id: activo, nombre: nombre()})); else sessionStorage.removeItem(KEY); } catch (_) {}
  }
  function nombre() { var c = lista.filter(function (x) { return x.id === activo; })[0]; return c ? c.nombre : activo; }
  function avisar() { aplicarDom(); document.dispatchEvent(new CustomEvent('xpace:cliente', {detail: {id: activo}})); }
  function resolver(texto) {
    var t = plano(String(texto || '').trim().replace(/^\//, '').replace(/^proyecto/i, ''));
    if (!t) return null;
    if (TODOS.test(t)) return {id: 'admira', nombre: 'Admira'};
    return lista.filter(function (c) { return plano(c.id) === t || plano(c.nombre) === t; })[0] || null;
  }
  function fijar(id) {
    var c = TODOS.test(slug(id)) || !slug(id) ? null : resolver(id);
    if (slug(id) && !TODOS.test(slug(id)) && !c) return false;
    activo = c ? c.id : null;
    guardar();
    try { var u = new URL(location.href); if (activo) u.searchParams.set('cliente', activo); else u.searchParams.delete('cliente'); if (u.href !== location.href) history.replaceState(history.state, '', u.href); } catch (_) {}
    avisar();
    return true;
  }

  // Clientes de una ficha: {id, name, kind, cliente, href} o un elemento con data-cliente.
  function clientesDe(it) {
    if (!it || !mapeo) return [];
    var C = mapeo.clientes || {}, ids = Object.keys(C), gen = mapeo.genericos || [];
    var fijo = slug((mapeo.asignaciones || {})[it.id] || it.cliente || '');
    if (fijo && (C[fijo] || gen.indexOf(fijo) >= 0)) return [fijo];
    var out = [], add = function (id) { if (out.indexOf(id) < 0) out.push(id); };
    var marca = String(it.kind || '').split('·')[0].trim();
    ids.forEach(function (id) { if (marca && (C[id].marcas || []).indexOf(marca) >= 0) add(id); });
    var texto = [it.id, it.name, it.kind].filter(Boolean).join(' \n ');
    ids.forEach(function (id) {
      var pats = C[id]._re || (C[id]._re = (C[id].patrones || []).map(function (p) { try { return new RegExp(p, 'gi'); } catch (_) { return null; } }).filter(Boolean));
      pats.forEach(function (re) { re.lastIndex = 0; if (re.test(texto)) { add(id); re.lastIndex = 0; texto = texto.replace(re, ' '); } });
    });
    if (it.href) {
      var path = ''; try { path = new URL(it.href, location.href).pathname; } catch (_) {}
      ids.forEach(function (id) { if ((C[id].rutas || []).some(function (r) { return path === r || path.indexOf(r + '/') === 0; })) add(id); });
    }
    return out;
  }
  function visible(it) {
    if (!activo) return true; // Admira lo ve todo
    if (!mapeo) return true;
    var gen = mapeo.genericos || [];
    return clientesDe(it).every(function (c) { return c === activo || gen.indexOf(c) >= 0; });
  }
  function filtrar(items) { return activo && Array.isArray(items) ? items.filter(visible) : items; }

  // Fichas y enlaces de la página: [data-cliente] y enlaces a rutas de otro cliente (incluido el menú del shell).
  function aplicarDom() {
    if (!document.body) return;
    document.querySelectorAll('[data-cliente]').forEach(function (el) {
      var ver = visible({cliente: el.getAttribute('data-cliente')});
      if (!ver && !el.hidden) { el.hidden = true; el.setAttribute('data-cliente-oculto', ''); }
      else if (ver && el.hasAttribute('data-cliente-oculto')) { el.hidden = false; el.removeAttribute('data-cliente-oculto'); }
    });
    if (!mapeo) return;
    document.querySelectorAll('a[href]').forEach(function (a) {
      if (a.closest('[data-cliente]')) return;
      var ver = visible({href: a.getAttribute('href')});
      if (!ver && !a.hidden) { a.hidden = true; a.setAttribute('data-cliente-oculto', ''); }
      else if (ver && a.hasAttribute('data-cliente-oculto')) { a.hidden = false; a.removeAttribute('data-cliente-oculto'); }
    });
  }

  function cargar(url) { return fetch(url, {cache: 'no-store', credentials: 'omit'}).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
  Promise.all([
    cargar(MAPEO_URL).catch(function () { return {clientes: {}, genericos: ['admira']}; }),
    cargar(CLIENTES_URL).catch(function () { return []; })
  ]).then(function (r) {
    mapeo = r[0] || {clientes: {}};
    lista = (Array.isArray(r[1]) ? r[1] : []).filter(function (c) { return c && c.id && c.nombre; }).map(function (c) { return {id: slug(c.id), nombre: String(c.nombre)}; });
    if (activo && !lista.some(function (c) { return c.id === activo; }) && lista.length) { activo = null; guardar(); }
    listo = true;
    avisar();
    alListo(window.XpaceCliente);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aplicarDom); else aplicarDom();
  new MutationObserver(function () { if (activo && mapeo) { clearTimeout(aplicarDom._t); aplicarDom._t = setTimeout(aplicarDom, 60); } })
    .observe(document.documentElement, {childList: true, subtree: true});

  window.XpaceCliente = {
    listo: function () { return listo; },
    cuando: function () { return pListo; },
    activo: function () { return activo; },
    nombre: function () { return activo ? nombre() : 'Admira'; },
    lista: function () { return lista.slice(); },
    resolver: resolver, fijar: fijar, clientesDe: clientesDe, visible: visible, filtrar: filtrar
  };
})();
