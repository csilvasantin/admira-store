// Shell cuadrático común de XpaceOS (xpaceos.com = admira.store) · FLT-101337.
//
// El gemelo (admira-xp/index.html) define la interfaz de cuatro bandas: barra superior
// con ☰ Opciones a la izquierda y ▤ Avanzado · ⌘ Experto a la derecha, panel izquierdo
// de Opciones (.quad-left), panel derecho de Opciones avanzadas (.quad-right) y, abajo,
// el modo Experto (la consola). Cualquier otra página obtiene la misma barra, los mismos
// glifos y las mismas clases cargando este fichero:
//
//   <link rel="stylesheet" href="/assets/xpace-shell.css?v=…">          (después del CSS propio)
//   <script defer src="/assets/xpace-shell.js?v=…" data-section="/ ayuda" data-section-en="/ help"></script>
//
// La página declara lo suyo en window.XPACE_SHELL (antes del script) o con atributos:
//   data-shell-slot="options|advanced|expert"  mueve ese elemento (con sus manejadores) al panel;
//   data-shell-nav                             reparte los <a>/<button> de esa navegación: anclas
//                                              internas (#…) a ▤ Avanzado y el resto a ☰ Opciones;
//   data-shell-replace                         la cabecera propia que deja paso a la barra común
//                                              (se elimina después de mover lo marcado).
// En el gemelo, que trae la barra en línea, este fichero no pinta nada: solo deja el API.
// Ver admira-xp/docs/shell-cuadratico.md.
(function (root) {
  'use strict';

  // Clave antigua del estado abierto/cerrado. Ya no se restaura: los paneles entran CERRADOS en
  // cada carga (Carlos, 3-oct-2026). Se borra al arrancar; el tamaño sí se recuerda
  // (xpaceos_shell_size_v1:<panel>).
  const PANELS_KEY = 'xpaceos_shell_panels_v1';
  const HISTORY_KEY = 'xpaceos_expert_history_v1';   // historial del CLI (↑/↓)
  const PENDING_KEY = 'xpaceos_expert_pending_v1';   // orden para el gemelo (nunca en la URL)
  const PENDING_TTL = 2 * 60 * 1000;
  const TWIN_HOME = '/admira-xp/';
  const BAR_HEIGHT = 46;

  const COMMON_OPTIONS = [
    {href: '/', es: 'Inicio', en: 'Home'},
    {href: '/admira-xp/?autostart=xtanco&visual=better', es: 'Gemelo digital', en: 'Digital twin'},
    {href: '/inventario/', es: 'Inventario', en: 'Inventory'},
    {href: 'https://www.yokup.com/retailer#itil', es: 'Inventario ITIL · Yokup', en: 'ITIL inventory · Yokup'},
    {href: '/help/', es: 'Ayuda', en: 'Help'},
    {href: '/help/cli/', es: 'Comandos CLI', en: 'CLI commands'},
  ];

  // Verbos que viven en el gemelo (su /help: helpSections() de admira-xp/index.html). Fuera
  // del gemelo se guardan en sessionStorage, se abre el gemelo y se ejecutan allí al cargar.
  const TWIN_VERBS = [
    'gente', 'people', 'personal', 'staff', 'clientes', 'customers', 'status', 'stock', 'turno',
    'hire', 'train', 'restock', 'nuevomiembro', 'echarmiembro', 'report', 'velocidad', 'dvr',
    'envivo', 'calendario', 'resetaudiencia', 'ad', 'upgrade', 'aforo', 'visit', 'save',
    'camiseta', 'reloj', 'time', 'tiempo', 'weather', 'lamp', 'hue', 'livecam', 'mocap', 'pixeria',
    'admiralive', 'comunicar', 'admiratube', 'say', 'targetpublicity', 'generovideo', 'impactos',
    'audienciain', 'audienciaout', 'ds', 'info', 'admiratv', 'tiktok', 'xpl', 'condicional', 'dj',
    'ladron', 'guardiacivil', 'opinador', 'robot', 'sponsor', 'socio', 'door', 'subasta', 'socios',
    'heatmap', 'ambiente', 'voces', 'devolucion', 'pedido', 'grok', 'draw', 'metahuman', 'avatar3d',
    'log', 'import', 'importtube', 'money', 'sat', 'fame', 'set', 'music', 'musica', 'song', 'next',
    'prev', 'seoul2026', 'seul', 'seultrap', 'seultecno', 'catalogo', 'importar', 'mobiliario',
    'layout', 'cli', 'distribuir', 'distribute', 'inventario', 'eliminar', 'good', 'better', 'best',
    'matrix', 'sincro', 'sincrototal', 'sync', 'synctotal', 'mudanza', 'modo', 'render', 'xpacio',
    'mapa', 'map', 'red', 'equipo', 'streamdeck', 'sd', 'debug', 'present', 'aviso', 'navidad',
  ];
  // Las vistas del gemelo se escriben sin barra (good, better, best, matrix).
  const BARE_TWIN = ['good', 'better', 'best', 'matrix'];
  const SHELL_VERBS = ['help', 'ayuda', 'limpiar', 'clear', 'gemelo', 'twin', 'marca', 'brand', 'idioma', 'language', 'languague', 'avatar', 'avatardigital', 'digitalavatar', 'admirito', 'avataron', 'avataroff'];

  const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const pick = (lang, item) => (typeof item === 'string' ? item : lang === 'en' ? (item.en || item.es || '') : (item.es || item.en || ''));
  // Texto bilingüe: el shell lo traduce al cambiar <html lang>.
  const bilingual = (lang, item) => (typeof item === 'string'
    ? ` data-shell-es="${esc(item)}" data-shell-en="${esc(item)}">${esc(item)}`
    : ` data-shell-es="${esc(item.es || item.en)}" data-shell-en="${esc(item.en || item.es)}">${esc(pick(lang, item))}`);
  const safeHref = href => (/^\s*javascript:/i.test(String(href || '')) ? '#' : String(href || '#'));
  const langOf = value => (String(value || '').toLowerCase().indexOf('en') === 0 ? 'en' : 'es');

  function normalizeConfig(raw, attrs) {
    const cfg = Object.assign({}, raw || {});
    const data = attrs || {};
    if (cfg.section == null && data.section) cfg.section = data.sectionEn ? {es: data.section, en: data.sectionEn} : data.section;
    const list = value => (Array.isArray(value) ? value.filter(item => item && (item.href || item.id) && (typeof item === 'string' || item.es || item.en)) : []);
    cfg.options = list(cfg.options);
    cfg.advanced = list(cfg.advanced);
    cfg.verbs = Array.isArray(cfg.verbs) ? cfg.verbs.filter(v => v && typeof v.run === 'function' && /^[a-z0-9-]+$/i.test(v.id || '')) : [];
    cfg.home = typeof cfg.home === 'string' && /^\/(?![\/\\])/.test(cfg.home) ? cfg.home : '/';
    cfg.common = cfg.common !== false;
    return cfg;
  }

  function itemMarkup(lang, item, cls) {
    const id = item.id ? ` id="${esc(item.id)}"` : '';
    const label = bilingual(lang, item);
    if (item.href) return `<a class="${cls}"${id} href="${esc(safeHref(item.href))}"${item.newTab ? ' target="_blank" rel="noopener"' : ''}${label}</a>`;
    return `<button type="button" class="${cls}"${id}${label}</button>`;
  }

  // Marcado del shell: mismos ids, clases y glifos que la barra del gemelo.
  function markup(rawCfg, {lang = 'es', version = ''} = {}) {
    const cfg = normalizeConfig(rawCfg);
    const T = (es, en) => (lang === 'en' ? en : es);
    const section = cfg.section ? `<span class="xs-section"${bilingual(lang, cfg.section)}</span>` : '';
    const bar = `<div id="topBar" class="show xs-bar" data-xpace-shell>
  <button type="button" class="quad-icon" id="pfOptions" data-quad-toggle="left" aria-controls="xsOptions" aria-expanded="false" data-shell-label-es="Opciones" data-shell-label-en="Options" aria-label="${T('Opciones', 'Options')}" title="${T('Opciones', 'Options')}">☰</button>
  <span class="xs-brand-wrap"><a class="xs-brand" href="${esc(cfg.home)}" data-shell-label-es="XpaceOS · volver al inicio" data-shell-label-en="XpaceOS · back to home" title="${T('XpaceOS · volver al inicio', 'XpaceOS · back to home')}"><span class="xs-brand-name">XpaceOS</span></a>${section}</span>
  <div class="spacer"></div>
  <div id="pfToggles" class="pf-toggles" role="group" aria-label="${T('Modos: avanzado, experto', 'Modes: advanced, expert')}">
    <button type="button" class="quad-icon" data-quad-toggle="right" aria-controls="xsAdvanced" aria-expanded="false" data-shell-label-es="Desplegar menú avanzado" data-shell-label-en="Open advanced menu" aria-label="${T('Desplegar menú avanzado', 'Open advanced menu')}" title="${T('Menú avanzado', 'Advanced menu')}">▤</button>
    <button type="button" class="quad-icon" id="pfExpert" data-quad-toggle="expert" aria-controls="xsExpert" aria-pressed="false" data-shell-label-es="Modo experto — mostrar u ocultar el menú inferior" data-shell-label-en="Expert mode — show or hide the bottom menu" aria-label="${T('Modo experto — mostrar u ocultar el menú inferior', 'Expert mode — show or hide the bottom menu')}" title="${T('Modo experto · mostrar/ocultar menú inferior', 'Expert mode · show/hide bottom menu')}">⌘</button>
  </div>
</div>`;
    const common = cfg.common ? COMMON_OPTIONS.map(o => (o.href === '/' ? Object.assign({}, o, {href: cfg.home}) : o)) : [];
    const options = `<nav class="quad-menu quad-left xs-panel is-collapsed" id="xsOptions" aria-label="${T('Opciones', 'Options')}" data-shell-label-es="Opciones" data-shell-label-en="Options">
  <div class="qm-title"${bilingual(lang, {es: 'Opciones', en: 'Options'})}</div>
  <div class="xs-links xs-common">
    ${common.map(o => itemMarkup(lang, o, 'xs-link')).join('\n    ')}
  </div>
  <div class="xs-links xs-page-options">
    ${cfg.options.map(o => itemMarkup(lang, o, 'xs-link')).join('\n    ')}
  </div>
  <span class="qm-version" id="xsVersion">${esc(version)}</span>
</nav>`;
    const advanced = `<nav class="quad-menu quad-right xs-panel is-collapsed" id="xsAdvanced" aria-label="${T('Opciones Avanzadas', 'Advanced options')}" data-shell-label-es="Opciones Avanzadas" data-shell-label-en="Advanced options">
  <div class="qm-title"${bilingual(lang, {es: 'Opciones Avanzadas', en: 'Advanced options'})}</div>
  <div class="xs-actions">
    ${cfg.advanced.map(item => itemMarkup(lang, item, 'xs-action')).join('\n    ')}
  </div>
  <p class="qm-hint xs-empty"${bilingual(lang, {es: 'Esta página no tiene acciones avanzadas.', en: 'This page has no advanced actions.'})}</p>
</nav>`;
    const expert = `<section class="quad-menu quad-bottom xs-expert is-collapsed" id="xsExpert" aria-label="${T('Modo experto', 'Expert mode')}" data-shell-label-es="Modo experto" data-shell-label-en="Expert mode">
  <div class="expert-workspace">
    <div class="tg-cli-row">
      <form class="xs-cli" id="xsCliForm" autocomplete="off">
        <div class="xs-command-head"><strong class="expert-section-label">⠿ CONTROL XTORE</strong><button type="submit" data-shell-label-es="Ejecutar orden" data-shell-label-en="Run command" aria-label="${T('Ejecutar orden','Run command')}" title="${T('Enter: ejecutar · Mayús+Enter: nueva línea','Enter: run · Shift+Enter: newline')}">↵</button></div>
        <textarea id="xsCli" rows="2" spellcheck="false" autocapitalize="off" placeholder="/help" aria-label="${T('Orden del modo experto', 'Expert mode command')}" data-shell-label-es="Orden del modo experto" data-shell-label-en="Expert mode command"></textarea>
      </form>
      <section class="expert-category-panel" aria-labelledby="expertCategoriesLabel"><strong class="expert-section-label" id="expertCategoriesLabel"${bilingual(lang,{es:'CATEGORÍAS',en:'CATEGORIES'})}</strong><div id="expertQuickIcons"></div></section>
      <p class="xs-hint"${bilingual(lang, {es: 'Tab completa · ↑/↓ historial · /help ayuda', en: 'Tab completes · ↑/↓ history · /help help'})}</p>
    </div>
    <div class="expert-divider" data-expert-divider="0" role="separator" aria-orientation="vertical" tabindex="0"></div>
    <div class="expert-controls-pane" aria-labelledby="expertControlsLabel"><strong class="expert-section-label" id="expertControlsLabel"${bilingual(lang,{es:'OPCIONES DE CATEGORÍA',en:'CATEGORY OPTIONS'})}</strong><div class="xs-expert-slot"></div><div id="expertCategoryDetail"></div></div>
    <div class="expert-divider" data-expert-divider="1" role="separator" aria-orientation="vertical" tabindex="0"></div>
    <div class="expert-view-pane"><div class="xs-expert-head"><strong class="expert-section-label" id="expertPreviewLabel"${bilingual(lang,{es:'PREVIOS',en:'PREVIEWS'})}</strong><button type="button" class="xs-close" data-shell-close="expert" data-shell-label-es="Cerrar modo experto" data-shell-label-en="Close Expert mode" aria-label="${T('Cerrar modo experto','Close Expert mode')}">×</button></div><ol class="xs-log" id="xsLog" role="log" aria-live="polite"></ol></div>
  </div>
</section>`;
    // Los paneles viven en una capa fija que recorta su desplazamiento: plegados no crean scroll horizontal.
    return {bar, options, advanced, expert, html: [bar, '<div class="xs-layer">', options, advanced, expert, '</div>'].join('\n')};
  }

  // ─── CLI: piezas puras (se prueban en node: tests/xpace-shell.test.mjs) ───
  function parseCommand(text) {
    const raw = String(text == null ? '' : text).trim();
    if (!raw) return null;
    const m = raw.match(/^(\/?)([^\s@]+)(?:@\S+)?(?:\s+([\s\S]*))?$/);
    if (!m) return null;
    return {raw, slash: !!m[1], verb: m[2].toLowerCase(), args: (m[3] || '').trim()};
  }
  // The digital assistant belongs to this browser; /avatar3d remains the scene totem.
  function avatarCommandText(text) {
    const p = parseCommand(text);
    if (!p) return null;
    let verb = p.verb, args = p.args;
    if (verb === 'avatar' && /^digital(?:\s|$)/i.test(args)) {
      verb = 'avatardigital'; args = args.replace(/^digital(?:\s+|$)/i, '').trim();
    }
    if (verb === 'cli') {
      if (/^(good|better|best)?$/i.test(args)) return ('/avatar ' + args.toLowerCase()).trim();
      if (!/^(ayudante|helper)(?:\s|$)/i.test(args)) return null;
    } else if (!['avatardigital', 'digitalavatar', 'admirito', 'avataron', 'avataroff'].includes(verb)) {
      if (verb !== 'avatar' || !/^(on|off|reset|status|estado|good|better|best|encender|apagar|mostrar|ocultar|show|hide)?$/i.test(args)) return null;
    }
    if (/^(status|estado)$/i.test(args)) return '/avatar';
    return '/' + verb + (args ? ' ' + args : '');
  }
  function isAvatarCommand(text) { return avatarCommandText(text) !== null; }
  const isTwinVerb = verb => TWIN_VERBS.includes(String(verb || '').toLowerCase());
  // Orden canónica para el gemelo: las vistas van sin barra; el resto con barra.
  function twinCommand(parsed) {
    if (!parsed) return '';
    const verb = parsed.verb;
    if (BARE_TWIN.includes(verb) && !parsed.args) return verb;
    return '/' + verb + (parsed.args ? ' ' + parsed.args : '');
  }
  function savePending(storage, command, now = Date.now()) {
    const cmd = String(command || '').trim();
    if (!storage || !cmd || cmd.length > 500) return false;
    try { storage.setItem(PENDING_KEY, JSON.stringify({cmd, at: now, from: (root.location && root.location.pathname) || ''})); return true; } catch (_) { return false; }
  }
  // Lee y borra la orden pendiente; caduca a los 2 minutos.
  function takePending(storage, now = Date.now()) {
    if (!storage) return null;
    let raw = null;
    try { raw = storage.getItem(PENDING_KEY); storage.removeItem(PENDING_KEY); } catch (_) { return null; }
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (!data || typeof data.cmd !== 'string' || !data.cmd.trim()) return null;
      if (!(now - Number(data.at) >= 0 && now - Number(data.at) <= PENDING_TTL)) return null;
      return data.cmd.trim();
    } catch (_) { return null; }
  }
  function commonPrefix(list) {
    return list.reduce((a, b) => { let i = 0; while (i < a.length && a[i] === b[i]) i++; return a.slice(0, i); }, list[0] || '');
  }
  // Tab: completa el verbo y, tras /marca, los ids de marca. → {value, options}
  function complete(value, verbs, brandIds) {
    const text = String(value == null ? '' : value);
    const m = text.match(/^(\s*)(\/?)(\S*)$/);
    if (m) {
      const typed = m[3].toLowerCase();
      const pool = [...new Set(verbs)].filter(v => v.indexOf(typed) === 0).sort();
      if (!pool.length) return {value: text, options: []};
      if (pool.length === 1) return {value: m[1] + '/' + pool[0] + ' ', options: pool};
      return {value: m[1] + '/' + commonPrefix(pool), options: pool};
    }
    const a = text.match(/^(\s*\/?(\S+)\s+)(\S*)$/);
    if (!a || !/^(marca|brand|marcablanca)$/i.test(a[2])) return {value: text, options: []};
    const pool = [...new Set([...(brandIds || []), 'off'])].filter(o => o.indexOf(a[3].toLowerCase()) === 0);
    if (!pool.length) return {value: text, options: []};
    if (pool.length === 1) return {value: a[1] + pool[0], options: pool};
    return {value: a[1] + commonPrefix(pool), options: pool};
  }

  // ─── Marca blanca (FLT-101337): el verbo /marca, con los textos de admira.app y Pixeria ───
  // Semilla del catálogo de admiranext.com/marcablanca: vale para el Tab sin red. Con la
  // marca blanca cargada se usa la lista real (AdmiraMarca.conocidas()).
  const BRAND_SEED = ['admira', 'lumbre', 'brumelle', 'frescaria'];
  const MARCA_VERB = /^\/?(?:marca|brand|marcablanca)$/i;
  const MB_SESSION_KEY = 'mb:marca';
  const MB_PROJECT_KEY = 'mb:proyecto';
  const SITE = 'https://www.xpaceos.com';
  // ¿Pide marca esta pestaña? ?marca=, ?project=, el local de Starbucks, o una marca/proyecto recordados.
  // Sin proyecto ni marca no se carga nada y no se habla con admiranext.com.
  function wantsBrand(search, storage) {
    let params = null;
    try { params = new URLSearchParams(search || ''); } catch (_) {}
    if (params) {
      if (params.get('marca') != null) return true;
      if (params.get('project')) return true;
      if (params.get('loc') === 'alsea-sbux-021') return true;
    }
    try { return !!(storage && (storage.getItem(MB_SESSION_KEY) || storage.getItem(MB_PROJECT_KEY))); } catch (_) { return false; }
  }
  // /marca <id|off|web> (alias /brand). M es window.AdmiraMarca (assets/marca-blanca.js);
  // write pinta una línea en la consola. → Promise<{ok}>
  function runMarca(arg, M, en, write) {
    function t(es, english) { return en ? english : es; }
    function tag(b) { return b && b.propuesta ? t(' · propuesta automática, no es la marca oficial', ' · automatic proposal, not the official brand') : b && b.ejemplo ? t(' · marca ficticia de ejemplo', ' · fictional sample brand') : ''; }
    function list(items) { return items.map(function (b) { return b.id + (b.propuesta ? t(' (propuesta)', ' (proposal)') : b.ejemplo ? t(' (ejemplo)', ' (sample)') : ''); }).join(', '); }
    if (!M) { write(t('La marca blanca aún no está lista en esta página. Vuelve a intentarlo en un momento.', 'White label is not ready on this page yet. Try again in a moment.')); return Promise.resolve({ok: false}); }
    var p = M.parseArg(arg);
    if (p.kind === 'invalid') {
      write(t('Marca no válida: «' + p.input + '».', 'Invalid brand: “' + p.input + '”.') + '\n' +
        t('Usa un id del catálogo (' + M.conocidas().map(function (b) { return b.id; }).join(', ') + '), off para volver a Admira o una web (starbucks.es) para analizarla.',
          'Use a catalogue id (' + M.conocidas().map(function (b) { return b.id; }).join(', ') + '), off to return to Admira or a website (starbucks.es) to analyse it.'));
      return Promise.resolve({ok: false});
    }
    if (p.kind === 'status') {
      var now = M.actual();
      write(now
        ? t('Marca activa: ' + now.nombre + ' (' + now.id + ')' + tag(now) + '. /marca off vuelve a Admira.', 'Active brand: ' + now.nombre + ' (' + now.id + ')' + tag(now) + '. /marca off returns to Admira.')
        : t('Sin marca blanca: ves el aspecto de Admira.', 'No white label: you see the Admira look.'));
      return M.listar().then(function (items) { write(t('Disponibles: ', 'Available: ') + list(items) + '.'); return {ok: true}; },
        function () { write(t('No se pudo leer el catálogo de admiranext.com. Conocidas: ', 'Could not read the admiranext.com catalogue. Known: ') + list(M.conocidas()) + '.'); return {ok: false}; });
    }
    if (p.kind === 'off') {
      var r = M.desactivar();
      write(r.changed && r.previous
        ? t('Marca ' + r.previous.nombre + ' desactivada: vuelve Admira.', r.previous.nombre + ' brand turned off: back to Admira.')
        : t('No había ninguna marca blanca activa: ya ves Admira.', 'No white label was active: you already see Admira.'));
      return Promise.resolve({ok: true});
    }
    if (p.kind === 'web') {
      var w = M.analizar(p.url);
      write(t('Abriendo el analizador de marca blanca en otra pestaña: ' + w.href, 'Opening the white-label analyser in a new tab: ' + w.href) + '\n' +
        t('Allí se analiza la web y se guarda en el catálogo; después actívala aquí con /marca <id>.', 'There the site is analysed and saved to the catalogue; then turn it on here with /marca <id>.'));
      return Promise.resolve({ok: !!w.ok});
    }
    write(t('Aplicando la marca ' + p.id + '…', 'Applying the ' + p.id + ' brand…'));
    return M.activar(p.id).then(function (res) {
      if (res.ok) { write(t('Marca ' + res.nombre + ' (' + res.id + ') activa' + tag(res) + '. Se mantiene al navegar en esta pestaña; /marca off vuelve a Admira.', res.nombre + ' (' + res.id + ') brand on' + tag(res) + '. It stays while you browse in this tab; /marca off returns to Admira.')); return {ok: true}; }
      if (res.reason === 'unknown') {
        write(t('La marca «' + p.id + '» no está en el catálogo de admiranext.com. No se ha aplicado nada.', 'The brand “' + p.id + '” is not in the admiranext.com catalogue. Nothing was applied.') + '\n' +
          t('Disponibles: ', 'Available: ') + list(M.conocidas()) + t('. Para crearla: /marca <web de la marca>.', '. To create it: /marca <brand website>.'));
        return {ok: false};
      }
      write(t('No se pudo contactar con admiranext.com. No se ha aplicado nada; vuelve a intentarlo.', 'Could not reach admiranext.com. Nothing was applied; try again.'));
      return {ok: false};
    });
  }
  // /marca desde Telegram, el MCP o /twin/cmd (__xtExec, xtAPI.command): ahí no hay un
  // navegador que vestir. Se responde con el enlace que la abre, sin cambiar ninguna pantalla.
  function remoteMarca(arg, en, site) {
    const base = (site || SITE).replace(/\/+$/, '');
    const t = (es, english) => (en ? english : es);
    const raw = String(arg == null ? '' : arg).trim().replace(/^(?:marca|brand|id|web|url)\s*=\s*/i, '');
    const off = /^(?:off|admira|ninguna|ninguno|none|default|apagar|quitar|reset)$/i;
    const note = t(' La marca blanca se aplica en el navegador que abre el enlace; desde aquí no cambia ninguna pantalla.', ' White label applies in the browser that opens the link; nothing changes on any screen from here.');
    if (!raw) {
      const url = base + '/admira-xp/?marca=starbucks';
      return {ok: true, url, message: t('Marca blanca del catálogo de admiranext.com/marcablanca. Abre el gemelo con ?marca=<id>, p. ej. ' + url + ', o escribe /marca <id> en ⌘ Experto de cualquier página de XpaceOS. /marca off vuelve a Admira.', 'White label from the admiranext.com/marcablanca catalogue. Open the twin with ?marca=<id>, e.g. ' + url + ', or type /marca <id> in ⌘ Expert on any XpaceOS page. /marca off returns to Admira.') + note};
    }
    if (off.test(raw)) {
      const url = base + '/admira-xp/?marca=admira';
      return {ok: true, url, message: t('Para volver a Admira: ' + url + ' (o /marca off en ⌘ Experto).', 'To return to Admira: ' + url + ' (or /marca off in ⌘ Expert).') + note};
    }
    if (/[.:/]/.test(raw)) {
      let web = raw;
      if (!/^https?:\/\//i.test(web)) web = 'https://' + web;
      let ok = false;
      try { const u = new URL(web); ok = /^https?:$/.test(u.protocol) && /\./.test(u.hostname) && !u.username && !u.password; web = u.href; } catch (_) {}
      if (ok) {
        const url = 'https://www.admiranext.com/marcablanca/?web=' + encodeURIComponent(web);
        return {ok: true, url, message: t('Analizador de marca blanca: ' + url + ' . Allí se analiza la web y se guarda en el catálogo; después: ' + base + '/admira-xp/?marca=<id>.', 'White-label analyser: ' + url + ' . There the site is analysed and saved to the catalogue; then: ' + base + '/admira-xp/?marca=<id>.')};
      }
    }
    const id = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (!/^[a-z0-9][a-z0-9-]{0,40}$/.test(id)) return {ok: false, message: t('Marca no válida: «' + raw + '». Usa un id del catálogo (starbucks, lumbre…), off o una web.', 'Invalid brand: “' + raw + '”. Use a catalogue id (starbucks, lumbre…), off or a website.')};
    const url = base + '/admira-xp/?marca=' + encodeURIComponent(id);
    return {ok: true, url, message: t('Marca «' + id + '»: abre ' + url + ' para ver el gemelo con esa marca (vale en cualquier página de XpaceOS con ?marca=' + id + ').', 'Brand “' + id + '”: open ' + url + ' to see the twin wearing it (works on any XpaceOS page with ?marca=' + id + ').') + note};
  }

  // Idioma compartido con las páginas (assets/xpace-lang.js): misma clave y mismo evento.
  const LANG_KEY = 'xtanco_lang';
  const LANG_EVENT = 'admira:languagechange';

  function normalizeLangToken(s) {
    const n = String(s == null ? '' : s).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z]/g, '');
    if (!n) return '';
    if (/^(en|eng|english|ingles)$/.test(n)) return 'en';
    if (/^(es|esp|spa|spanish|espanol|castellano)$/.test(n)) return 'es';
    return null;
  }
  // /idioma · /language · /languague (typo); arg vacío = toggle; ESP|ENG|es|en; pegados (idiomaESP).
  function parseLangCommand(text) {
    const raw = String(text == null ? '' : text).trim();
    if (!raw) return null;
    const body = raw.replace(/^\//, '').trim().replace(/^(idioma|language|languague)@[a-z0-9_]+(?=\s|$)/i, '$1');
    if (/[\r\n]/.test(body) && /^(idioma|language|languague)/i.test(body)) return {ok: false};
    const m = body.match(/^(idioma|language|languague)(?:[\s_-]*(.*))?$/i);
    if (!m) return null;
    const token = normalizeLangToken(m[2] || '');
    if (token === null) return {ok: false, verb: m[1].toLowerCase()};
    return {ok: true, verb: m[1].toLowerCase(), token, toggled: !token};
  }
  function languageCommand(text, env = {}) {
    const parsed = parseLangCommand(text);
    if (!parsed) return null;
    const usage = env.lang === 'en'
      ? 'Use /idioma or /language (toggle), /idioma ESP|ENG (or es|en). Also languageENG, idiomaESP…'
      : 'Usa /idioma o /language (toggle), /idioma ESP|ENG (o es|en). También languageENG, idiomaESP…';
    if (!parsed.ok) return {ok:false, local:true, message: usage};
    const current = (env.lang === 'en') ? 'en' : 'es';
    const next = parsed.token || (current === 'en' ? 'es' : 'en');
    // An explicit local choice overrides a locale pinned by the incoming URL.
    // No navigation: retain the active scene, panel state and CLI history.
    const win = env.window;
    if (win) {win.XPACE_LANG_OVERRIDE = next; win.XPACE_LANG_LOCKED = false;}
    try {env.storage?.setItem(LANG_KEY, next);} catch (_) {}
    try {
      const url = new URL(env.url);
      url.searchParams.set('lang', next); url.searchParams.delete('langlock');
      env.history?.replaceState(env.history.state, '', url.href);
    } catch (_) {}
    env.apply?.(next);
    return {ok:true, local:true, language:next, message: next === 'en' ? 'Language: English' : 'Idioma: español'};
  }

  const api = {PANELS_KEY, HISTORY_KEY, LANG_KEY, LANG_EVENT, PENDING_KEY, PENDING_TTL, TWIN_HOME, TWIN_VERBS, BARE_TWIN, SHELL_VERBS, COMMON_OPTIONS,
    BRAND_SEED, MARCA_VERB, MB_SESSION_KEY, MB_PROJECT_KEY,
    esc, normalizeConfig, markup, parseCommand, parseLangCommand, normalizeLangToken, languageCommand, avatarCommandText, isAvatarCommand, isTwinVerb, twinCommand, savePending, takePending, complete, wantsBrand, runMarca, remoteMarca};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof document === 'undefined') return;

  // ─── Navegador ───
  const doc = document, html = doc.documentElement;
  const script = doc.currentScript;
  const VERSION = (() => { try { return new URL(script.src).searchParams.get('v') || ''; } catch (_) { return ''; } })();
  const local = (() => { try { return root.localStorage; } catch (_) { return null; } })();
  const session = (() => { try { return root.sessionStorage; } catch (_) { return null; } })();
  const lang = () => langOf(html.lang);
  const T = (es, en) => (lang() === 'en' ? en : es);
  const shared = Object.assign({}, api, {version: VERSION, session: () => session});
  shared.language = (text, apply) => languageCommand(text, {window:root, storage:local, history:root.history, url:root.location.href, lang:lang(), apply:next => {
    html.lang = next;
    if (apply) apply(next);
    else if (typeof root.setLanguage === 'function') root.setLanguage(next);
    else if (typeof root.applyHtmlLang === 'function') root.applyHtmlLang(next);
    doc.querySelectorAll('[data-shell-es][data-shell-en]').forEach(node => {node.textContent = node.getAttribute('data-shell-' + next);});
    // Las páginas con contenido bilingüe propio (portada, ayudas…) escuchan este evento.
    try {root.dispatchEvent(new CustomEvent(LANG_EVENT, {detail: {lang: next, source: 'xpace-shell'}}));} catch (_) {}
  }});
  // Cliente activo (assets/xpace-cliente.js): Admira lo ve todo; /marca <cliente> o ?cliente=<id> filtra
  // las listas de Xpacios, sin selector visible. Como la marca blanca, solo se descarga si hace falta:
  // con ?cliente=<id> (o un cliente recordado) o al usar /marca <cliente>. Una visita normal no carga nada.
  let clientePromise = null;
  function clientePedido() {
    let id = '';
    try { id = new URLSearchParams(root.location.search).get('cliente') || ''; } catch (_) {}
    if (!id) { try { id = (JSON.parse(session && session.getItem('pixeria:cliente:v2') || 'null') || {}).id || ''; } catch (_) {} }
    return !!id && !/^(admira|todos|todas|all|off|ninguno)$/i.test(id);
  }
  function cargarCliente() {
    if (root.XpaceCliente) return root.XpaceCliente.cuando();
    if (!clientePromise) {
      clientePromise = new Promise(resolve => {
        const sc = doc.createElement('script');
        sc.src = '/assets/xpace-cliente.js' + (VERSION ? '?v=' + encodeURIComponent(VERSION) : '');
        sc.async = true;
        sc.setAttribute('data-xpace-cliente', '');
        sc.onload = () => (root.XpaceCliente ? root.XpaceCliente.cuando().then(resolve) : resolve(null));
        sc.onerror = () => { sc.remove(); clientePromise = null; resolve(null); };
        (doc.head || html).append(sc);
      });
    }
    return clientePromise;
  }
  if (clientePedido()) cargarCliente();
  // /marca y el cliente (Carlos, 4-oct-2026): /marca <cliente> filtra por ese cliente (y si además es
  // marca del catálogo, la viste como siempre); /marca off vuelve a Admira, que lo ve todo; /marca todas
  // lista los clientes (en XpaceOS no hay selector visible). → true si ya no hace falta la marca blanca.
  function marcaCliente(arg, write) {
    const a = String(arg || '').trim();
    // Sin cliente cargado, /marca, /marca off y /marca <web> siguen siendo solo marca blanca.
    if (!root.XpaceCliente && (!a || /^off$/i.test(a) || /[.:\/]/.test(a))) return Promise.resolve(false);
    return cargarCliente().then(C => (C ? marcaClienteListo(C, a, write) : false));
  }
  function marcaClienteListo(C, a, write) {
    if (/^(todas|todos|all)$/i.test(a)) {
      write(T('Clientes: ', 'Clients: ') + C.lista().map(c => c.id).join(', ') + T('. /marca <cliente> filtra los Xpacios; /marca off vuelve a Admira (todo).', '. /marca <client> filters the Xpaces; /marca off returns to Admira (everything).'));
      return Promise.resolve(true);
    }
    if (/^off$/i.test(a)) { if (C.activo()) { C.fijar(''); write(T('Cliente Admira: ves todos los Xpacios.', 'Admira client: you see every Xpace.')); } return Promise.resolve(false); }
    if (!a) { if (C.activo()) write(T('Cliente activo: ', 'Active client: ') + C.nombre() + '.'); return Promise.resolve(false); }
    const c = C.resolver(a);
    if (!c) return Promise.resolve(false);
    C.fijar(c.id);
    if (c.id === 'admira') { write(T('Cliente Admira: ves todos los Xpacios.', 'Admira client: you see every Xpace.')); return Promise.resolve(false); }
    write(T('Cliente activo: ' + c.nombre + ' (' + c.id + '). Solo sus Xpacios y los genéricos de Admira; /marca off vuelve a Admira.', 'Active client: ' + c.nombre + ' (' + c.id + '). Only its Xpaces plus Admira generic ones; /marca off returns to Admira.'));
    return cargarMarca().then(M => (M ? M.listar().catch(() => M.conocidas()) : []))
      .then(items => !(items || []).some(b => b.id === c.id || b.id === a.toLowerCase()), () => true);
  }

  // ─── Marca blanca: el único enganche. assets/marca-blanca.js se inserta con el sello de
  // este fichero solo si la pestaña pide marca o se usa /marca; sin marca, una visita no
  // descarga nada más ni habla con admiranext.com. ───
  let marcaPromise = null;
  function cargarMarca() {
    if (root.AdmiraMarca) return Promise.resolve(root.AdmiraMarca);
    if (!marcaPromise) {
      marcaPromise = new Promise(resolve => {
        const s = doc.createElement('script');
        let src = '/assets/marca-blanca.js';
        try { src = new URL('marca-blanca.js', script.src).pathname; } catch (_) {}
        s.src = src + (VERSION ? '?v=' + encodeURIComponent(VERSION) : '');
        s.async = true;
        s.setAttribute('data-xpace-marca', '');
        s.onload = () => resolve(root.AdmiraMarca || null);
        s.onerror = () => { s.remove(); marcaPromise = null; resolve(null); };
        doc.head.append(s);
      });
    }
    return marcaPromise;
  }
  Object.assign(shared, {
    brandSeed: BRAND_SEED,
    cargarMarca,
    marca: (arg, write) => marcaCliente(arg, write).then(hecho => (hecho ? {ok: true} : cargarMarca().then(M => runMarca(arg, M, lang() === 'en', write)))),
    marcaCatalog: () => cargarMarca().then(M => (M ? M.listar().catch(() => null) : null)),
  });
  // Una página muy pintada a mano (CMDB) pide que la marca vista solo la barra y los paneles.
  if (script && script.dataset.marca === 'barra') html.setAttribute('data-mb-alcance', 'barra');
  if (wantsBrand(root.location && root.location.search, session)) cargarMarca();
  // Cambiar de proyecto (selector, gemelo o cliente) aplica la marca sin esperar a otra visita.
  function projectEventId(ev) {
    const detail = ev && ev.detail;
    if (detail && (detail.id || detail.project)) return detail.id || detail.project;
    try {
      const params = new URLSearchParams(root.location.search);
      if (params.get('loc') === 'alsea-sbux-021') return 'starbucks';
      return params.get('project') || '';
    } catch (_) { return ''; }
  }
  function onProject(ev) {
    const id = projectEventId(ev);
    if (!id) return;
    cargarMarca().then(M => { if (M && typeof M.aplicarProyecto === 'function') return M.aplicarProyecto(id); });
  }
  if (typeof root.addEventListener === 'function') root.addEventListener('xpaceos:project-change', onProject);
  if (doc && typeof doc.addEventListener === 'function') doc.addEventListener('xpace:cliente', onProject);

  // Avatar digital (encargo avatar · 4-oct-2026). Lo gobierna el cargador común de
  // admiranext.com: elección del visitante > interruptor del proyecto > apagado. El
  // cargador pesa poco y, apagado, solo consulta la bandera: el avatar en sí no se
  // descarga. Sin data-brain: GitHub Pages no ejecuta /avatar-ask, así que las
  // preguntas van al relevo central https://www.admiranext.com/api/avatar-ask.
  // Si el cargador no llega, queda el módulo antiguo /assets/avatar-digital.js.
  const AVATAR_LOADER = 'https://www.admiranext.com/assets/avatar.js?v=20261004-avatar-5';
  function avatarKey() {
    try { return 'da-avatar:' + ((root.location && root.location.host) || ''); } catch (_) { return 'da-avatar:'; }
  }
  function avatarStoredOn() {
    try { return !!(local && local.getItem(avatarKey()) === '1'); } catch (_) { return false; }
  }
  let avatarPromise = null;
  let loaderPromise = null;
  function cargarCargador() {
    if (root.AdmiraAvatar) return Promise.resolve(root.AdmiraAvatar);
    if (!loaderPromise) {
      loaderPromise = new Promise(resolve => {
        const s = doc.querySelector('script[data-admira-avatar]') || doc.createElement('script');
        if (s.isConnected) {
          s.addEventListener('load', () => resolve(root.AdmiraAvatar || null), {once: true});
          s.addEventListener('error', () => resolve(null), {once: true});
          return;
        }
        s.src = AVATAR_LOADER;
        s.async = true;
        s.setAttribute('data-admira-avatar', '');
        s.onload = () => resolve(root.AdmiraAvatar || null);
        s.onerror = () => { s.remove(); loaderPromise = null; resolve(null); };
        (doc.head || doc.documentElement).append(s);
      });
    }
    return loaderPromise;
  }
  function cargarAvatar() {
    if (root.AdmiraAvatar) return Promise.resolve(root.AdmiraAvatar);
    return cargarCargador().then(A => A || cargarAvatarAntiguo());
  }
  function cargarAvatarAntiguo() {
    if (root.AvatarDigital) return Promise.resolve(root.AvatarDigital);
    if (!avatarPromise) {
      avatarPromise = new Promise(resolve => {
        const s = doc.createElement('script');
        let src = '/assets/avatar-digital.js';
        try { src = new URL('avatar-digital.js', script.src).pathname; } catch (_) {}
        s.src = src + (VERSION ? '?v=' + encodeURIComponent(VERSION) : '');
        s.async = true;
        s.setAttribute('data-xpace-avatar', '');
        s.onload = () => resolve(root.AvatarDigital || null);
        s.onerror = () => { s.remove(); avatarPromise = null; resolve(null); };
        (doc.head || doc.documentElement).append(s);
      });
    }
    return avatarPromise;
  }
  Object.assign(shared, {
    avatar: async (text) => {
      const command = avatarCommandText(text);
      const A = await cargarAvatar();
      if (!A || typeof A.handle !== 'function') throw Error(T('Avatar digital no disponible. Reintenta.', 'Digital avatar unavailable. Retry.'));
      // Do not silently accept extra arguments or multiple commands.
      const p = parseCommand(command || text);
      const args = p?.verb === 'cli' ? p.args.replace(/^(ayudante|helper)\s*/i, '') : p?.args;
      if (/\s/.test(args || '') || (A.decide && A.decide(command || text) === 'bad')) throw Error(T('Usa /avatar digital on o /avatar digital off.', 'Use /avatar digital on or /avatar digital off.'));
      let executable = command || text;
      if (A.decide && A.decide(executable) == null) {
        const legacy = executable.match(/^\/(?:avatar(on|off)|avatar\s+(on|off|encender|apagar|mostrar|ocultar|show|hide))$/i);
        if (!legacy) throw Error(T('Esta orden requiere el cargador central del avatar. Reintenta.', 'This command requires the central avatar loader. Retry.'));
        executable = '/avatardigital ' + (legacy[1] || legacy[2]).toLowerCase();
      }
      const line = await A.handle(executable);
      if (!line) throw Error(T('El avatar no confirmó la orden. Reintenta.', 'The avatar did not confirm the command. Retry.'));
      return line;
    },
    avatarCommand: async (text) => {
      if (!isAvatarCommand(text)) return null;
      try { return {ok: true, local: true, kind: 'avatar', message: await shared.avatar(text)}; }
      catch (error) { return {ok: false, local: true, kind: 'avatar', message: 'Error: ' + error.message}; }
    },
  });

  // El gemelo trae la barra en línea: no se duplica nada (solo queda el API y la marca).
  if (doc.getElementById('topBar') && !doc.querySelector('[data-xpace-shell]')) {
    root.XpaceShell = Object.assign(shared, {inline: true});
    let enIframe = false;
    try { enIframe = root.self !== root.top; } catch (_) { enIframe = true; }
    if (!enIframe) cargarCargador();
    return;
  }
  if (root.XpaceShell) return;
  // Incrustada en un iframe (p. ej. el Condicional dentro del panel XPL) la página ya
  // está bajo la barra de quien la incrusta: no se pinta una segunda.
  let framed = false;
  try { framed = root.self !== root.top; } catch (_) { framed = true; }
  if (framed && !(script && script.dataset.shellFramed === 'on')) {
    root.XpaceShell = Object.assign(shared, {inline: false, framed: true});
    return;
  }
  // Un solo avatar por pestaña: dentro de un iframe nunca se carga.
  if (!framed) cargarCargador();

  function mount() {
    const cfg = normalizeConfig(root.XPACE_SHELL, script ? script.dataset : {});
    const release = (doc.querySelector('meta[name="admiranext-version"]') || {}).content || '';
    const tpl = doc.createElement('template');
    tpl.innerHTML = markup(cfg, {lang: lang(), version: release ? 'XpaceOS ' + release : 'XpaceOS'}).html;
    const nodes = [...tpl.content.children];
    const bar = nodes[0];
    const [options, advanced, expert] = [...nodes[1].children];
    const optionSlot = options.querySelector('.xs-page-options');
    const actionSlot = advanced.querySelector('.xs-actions');
    const expertSlot = expert.querySelector('.xs-expert-slot');

    // Lo que la página marca pasa a los paneles con sus manejadores.
    const place = (node, slot) => {
      if (slot === 'advanced') { node.classList.add('xs-action'); actionSlot.append(node); }
      else if (slot === 'expert') expertSlot.append(node);
      else { if (/^(A|BUTTON)$/.test(node.tagName)) node.classList.add('xs-link'); optionSlot.append(node); }
    };
    for (const node of doc.querySelectorAll('[data-shell-slot]')) place(node, node.dataset.shellSlot);
    for (const nav of doc.querySelectorAll('[data-shell-nav]')) {
      for (const node of nav.querySelectorAll('a,button')) {
        if (node.closest('[data-shell-slot]') || node.hasAttribute('data-shell-skip')) continue;
        const href = node.getAttribute('href') || '';
        place(node, /^#./.test(href) ? 'advanced' : 'options');
      }
    }
    // Un enlace común que la página ya trae (mismo destino) no se repite.
    const target = a => { try { const u = new URL(a.getAttribute('href'), root.location.href); return u.origin === root.location.origin ? u.pathname : u.href; } catch (_) { return ''; } };
    const pageTargets = new Set([...optionSlot.querySelectorAll('a[href]')].map(target));
    for (const a of options.querySelectorAll('.xs-common a[href]')) if (a.getAttribute('href') !== cfg.home && pageTargets.has(target(a))) a.hidden = true;
    // El enlace a la página actual se marca.
    for (const a of options.querySelectorAll('a[href]')) if (!a.getAttribute('href').startsWith('#') && target(a) === root.location.pathname && !/[?#]/.test(a.getAttribute('href'))) a.setAttribute('aria-current', 'page');
    advanced.querySelector('.xs-empty').hidden = !!actionSlot.children.length;
    optionSlot.hidden = !optionSlot.children.length;
    for (const old of doc.querySelectorAll('[data-shell-replace],[data-shell-slots]')) old.remove();
    doc.body.prepend(...nodes);
    doc.body.classList.add('xs-page');
    html.setAttribute('data-xpace-shell', 'on');
    // Las anclas internas de Avanzado cierran el panel en pantallas estrechas.
    actionSlot.addEventListener('click', ev => { if (ev.target.closest('a[href^="#"]') && !wide()) setPanel('right', false); });
    return {cfg, bar, options, advanced, expert};
  }

  const wide = () => (root.matchMedia ? root.matchMedia('(min-width: 1100px)').matches : false);
  let parts = null, cfg = null;
  const state = {left: false, right: false, expert: false};
  const PANEL = {left: 'xsOptions', right: 'xsAdvanced', expert: 'xsExpert'};

  // Los paneles entran cerrados en cada página: el estado abierto no se guarda ni se restaura.
  function forgetPanels() { try { local.removeItem(PANELS_KEY); } catch (_) {} }

  // Los paneles se SUPERPONEN al contenido en todos los anchos: el cuerpo de la página no cambia
  // de posición, ancho ni alto al abrir ☰, ▤ o ⌘. Las variables solo informan a lo flotante
  // (los laterales se detienen sobre ⌘ con bottom:var(--xs-bottom)).
  function layout() {
    const size = (id, prop) => { const el = doc.getElementById(id); return el ? Math.round(el.getBoundingClientRect()[prop]) : 0; };
    html.style.setProperty('--xs-left', state.left ? size('xsOptions', 'width') + 'px' : '0px');
    html.style.setProperty('--xs-right', state.right ? size('xsAdvanced', 'width') + 'px' : '0px');
    html.style.setProperty('--xs-bottom', state.expert ? size('xsExpert', 'height') + 'px' : '0px');
  }

  function paintPanel(name) {
    const open = state[name];
    const panel = doc.getElementById(PANEL[name]);
    if (!panel) return;
    panel.classList.toggle('is-collapsed', !open);
    panel.toggleAttribute('inert', !open);
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    doc.body.classList.toggle(name === 'expert' ? 'xs-expert-open' : 'quad-' + name + '-open', open);
    const btn = doc.querySelector(`#topBar [data-quad-toggle="${name}"]`);
    if (btn) {
      btn.classList.toggle('is-active', open);
      btn.setAttribute(name === 'expert' ? 'aria-pressed' : 'aria-expanded', open ? 'true' : 'false');
    }
  }
  function setPanel(name, open, opts = {}) {
    if (!(name in state)) return;
    state[name] = !!open;
    paintPanel(name);
    layout();
    if (open && name === 'expert' && opts.focus !== false) { const input = doc.getElementById('xsCli'); if (input) setTimeout(() => input.focus({preventScroll: true}), 30); }
    doc.dispatchEvent(new CustomEvent('xpace:shell-panel', {detail: {panel: name, open: !!open}}));
  }

  function translate() {
    const en = lang() === 'en';
    for (const el of doc.querySelectorAll('#topBar [data-shell-es], .xs-panel [data-shell-es], .xs-expert [data-shell-es]')) {
      const text = en ? el.dataset.shellEn : el.dataset.shellEs;
      if (text != null && el.textContent !== text) el.textContent = text;
    }
    for (const el of doc.querySelectorAll('#topBar [data-shell-label-es], .xs-panel[data-shell-label-es], .xs-expert[data-shell-label-es], .xs-expert [data-shell-label-es]')) {
      const label = en ? el.dataset.shellLabelEn : el.dataset.shellLabelEs;
      if (label == null) continue;
      el.setAttribute('aria-label', label);
      if (el.hasAttribute('title')) el.title = label;
    }
  }

  // ─── CLI del modo experto ───
  const log = text => {
    const ol = doc.getElementById('xsLog');
    if (!ol) return;
    for (const line of String(text == null ? '' : text).split('\n')) {
      const li = doc.createElement('li');
      li.className = 'xs-out';
      li.textContent = line;
      ol.append(li);
    }
    while (ol.children.length > 200) ol.firstElementChild.remove();
    ol.scrollTop = ol.scrollHeight;
  };
  const echo = text => { const ol = doc.getElementById('xsLog'); if (!ol) return; const li = doc.createElement('li'); li.className = 'xs-in'; li.textContent = '› ' + text; ol.append(li); ol.scrollTop = ol.scrollHeight; };

  const pageVerbs = new Map();
  function registerVerb(def) {
    if (!def || typeof def.run !== 'function' || !/^[a-z0-9-]+$/i.test(def.id || '')) throw new Error('xpace-shell: verbo no válido');
    for (const name of [def.id, ...(def.aliases || [])]) pageVerbs.set(String(name).toLowerCase(), def);
  }
  const allVerbs = () => [...new Set([...SHELL_VERBS, ...pageVerbs.keys(), ...TWIN_VERBS])];

  function helpText() {
    const L = [];
    L.push(T('XpaceOS · modo experto. Verbos de esta página:', 'XpaceOS · expert mode. Verbs on this page:'));
    L.push(T('  /help (/ayuda) — esta ayuda', '  /help (/ayuda) — this help'));
    L.push(T('  /idioma [/language] [ESP|ENG] — castellano o inglés (sin arg: alterna; también idiomaESP)', '  /idioma [/language] [ESP|ENG] — Spanish or English (no arg: toggle; also idiomaESP)'));
    L.push(T('  /limpiar (/clear) — vacía la consola', '  /limpiar (/clear) — clear the console'));
    L.push(T('  /gemelo [orden] — abre el gemelo y, si la das, ejecuta allí la orden', '  /gemelo [command] — open the twin and, if given, run the command there'));
    L.push(T('  /marca [marca] — Marca blanca del catálogo de admiranext.com/marcablanca: /marca <id> viste la web con esa marca, /marca off vuelve a Admira, /marca sola dice cuál está activa y lista las disponibles, /marca <web> abre el analizador en otra pestaña. Alias: /brand.',
      '  /marca [brand] — White label from the admiranext.com/marcablanca catalogue: /marca <id> dresses the site in that brand, /marca off returns to Admira, /marca alone shows the active one and lists them, /marca <website> opens the analyser in a new tab. Alias: /brand.'));
    L.push(T('  /marca <cliente> — filtra las listas de Xpacios por ese cliente (lo suyo y lo genérico de Admira); /marca todas lista los clientes; /marca off vuelve a Admira, que lo ve todo. También ?cliente=<id> en la URL.',
      '  /marca <client> — filters the Xpace lists by that client (its own plus Admira generic); /marca todas lists the clients; /marca off returns to Admira, which sees everything. Also ?cliente=<id> in the URL.'));
    for (const def of new Set(pageVerbs.values())) L.push('  /' + def.id + (def.aliases && def.aliases.length ? ' (/' + def.aliases.join(', /') + ')' : '') + ' — ' + pick(lang(), def));
    L.push(T('Verbos del gemelo (se abren y se ejecutan en /admira-xp/): ', 'Twin verbs (opened and run in /admira-xp/): ') +
      '/distribuir · matrix · better · /status · /stock · /music · /ds · /layout · /inventario · /sincro · /xpacio …');
    L.push(T('Lista completa: /help en el gemelo o xpaceos.com/help/cli/.', 'Full list: /help in the twin or xpaceos.com/help/cli/.'));
    return L.join('\n');
  }

  function handoff(command) {
    const target = new URL(cfg.twinHome || TWIN_HOME, root.location.href);
    if (target.origin !== root.location.origin) {
      log(T('Abre el gemelo y escribe allí: ', 'Open the twin and enter: ') + command);
      setTimeout(() => root.location.assign(target.href), 350);
      return true;
    }
    if (!savePending(session, command)) { log(T('No se pudo preparar el gemelo (sessionStorage no disponible). Ábrelo y escribe la orden allí: ', 'Could not prepare the twin (no sessionStorage). Open it and type the command there: ') + TWIN_HOME); return false; }
    log(T('«' + command + '» es un verbo del gemelo: lo abro y lo ejecuto allí…', '“' + command + '” is a twin verb: opening the twin to run it there…'));
    setTimeout(() => root.location.assign(target.href), 350);
    return true;
  }

  async function run(text) {
    const p = parseCommand(text);
    if (!p) return;
    echo(p.raw);
    const verb = p.verb;
    try {
      const languageResult = shared.language(text);
      if (languageResult) {translate(); log(languageResult.message); return;}
      const avatarResult = await shared.avatarCommand(text);
      if (avatarResult) { log(avatarResult.message); return; }
      if (verb === 'help' || verb === 'ayuda' || verb === '?') { log(helpText()); return; }
      if (verb === 'limpiar' || verb === 'clear' || verb === 'cls') { const ol = doc.getElementById('xsLog'); if (ol) ol.replaceChildren(); return; }
      if (verb === 'gemelo' || verb === 'twin') {
        if (!p.args) { log(T('Abriendo el gemelo…', 'Opening the twin…')); setTimeout(() => root.location.assign(TWIN_HOME), 250); return; }
        handoff(p.args); return;
      }
      if (MARCA_VERB.test(verb)) { await shared.marca(p.args, log); return; }
      if (pageVerbs.has(verb)) {
        const out = await pageVerbs.get(verb).run(p.args, {log, lang: lang(), shell: root.XpaceShell}, lang());
        if (out != null && out !== '') log(typeof out === 'string' ? out : JSON.stringify(out));
        return;
      }
      if (isTwinVerb(verb)) { handoff(twinCommand(p)); return; }
      log(T('Verbo desconocido: ' + p.raw.split(/\s+/)[0] + '. /help lista los verbos; /gemelo <orden> la ejecuta en el gemelo.',
        'Unknown verb: ' + p.raw.split(/\s+/)[0] + '. /help lists the verbs; /gemelo <command> runs it in the twin.'));
    } catch (error) {
      log('Error: ' + ((error && error.message) || error));
    }
  }

  function wireCli() {
    const form = doc.getElementById('xsCliForm');
    const input = doc.getElementById('xsCli');
    let history = [];
    try { history = JSON.parse(local.getItem(HISTORY_KEY) || '[]').filter(x => typeof x === 'string').slice(-50); } catch (_) {}
    let cursor = history.length, draft = '';
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const value = input.value.trim();
      if (!value) return;
      input.value = '';
      if (history[history.length - 1] !== value) history.push(value);
      history = history.slice(-50);
      cursor = history.length;
      try { local.setItem(HISTORY_KEY, JSON.stringify(history)); } catch (_) {}
      run(value);
    });
    input.addEventListener('keydown', ev => {
      if(ev.key==='Enter'&&!ev.shiftKey&&!ev.isComposing){ev.preventDefault();form.requestSubmit();return;}
      if (ev.key === 'Tab' && !ev.shiftKey) {
        const brands = root.AdmiraMarca ? root.AdmiraMarca.conocidas().map(b => b.id) : BRAND_SEED;
        const c = complete(input.value, allVerbs(), brands);
        if (c.options.length) { ev.preventDefault(); input.value = c.value; if (c.options.length > 1) log(c.options.join('  ')); }
        // Con /marca se trae el catálogo real para el siguiente Tab (solo al usar /marca).
        if (/^\s*\/?(?:marca|brand|marcablanca)\s/i.test(input.value)) shared.marcaCatalog();
        return;
      }
      if (ev.key !== 'ArrowUp' && ev.key !== 'ArrowDown') return;
      ev.preventDefault();
      if (cursor === history.length) draft = input.value;
      cursor = Math.max(0, Math.min(history.length, cursor + (ev.key === 'ArrowUp' ? -1 : 1)));
      input.value = cursor === history.length ? draft : history[cursor];
    });
  }

  // ⌘ EXPERTO · CLI con la piel compartida de la suite (www.admiranext.com/suite), look de
  // digitalavatar.ai y MINIMIZADO por defecto (Carlos, 4-oct-2026 23:08/23:11): abajo solo queda
  // la orden «› /help» de una línea, escribible; el asa, el ▾ o ⌘ despliegan y una orden lanzada
  // en minimizado se despliega para ver la respuesta. Los verbos, el historial, la marca blanca y
  // el avatar siguen siendo los de este shell. El registro sale de «PREVIOS» a la columna del CLI
  // y los tres paneles (categorías, opciones de categoría, previos) quedan tras «＋ vista».
  // Con la piel el panel queda abierto para el shell (sin inert): manda el estado de la piel.
  function suiteExperto() {
    if (root.top !== root.self || /(^|[?&])embed=/.test(location.search)) return;
    const V = '20261005-experto-idioma-1', BASE = 'https://www.admiranext.com/suite/experto';
    const css = doc.createElement('link');
    css.rel = 'stylesheet'; css.href = BASE + '.css?v=' + V;
    doc.head.appendChild(css);
    const js = doc.createElement('script');
    js.src = BASE + '.js?v=' + V; js.defer = true;
    const host = location.hostname.replace(/^www\./, '');
    const attrs = {
      panel: '#xsExpert', body: '.expert-workspace', form: '#xsCliForm', input: '#xsCli', log: '#xsLog', hint: '.xs-hint',
      extras: '.expert-category-panel,.expert-controls-pane,.expert-view-pane', extrasLabel: 'vista',
      chrome: '.expert-divider,.xs-command-head', moveLog: '', toggle: '', pata: host,
      engine: /xpaceos/.test(host) ? 'XPACEOS ENGINE' : 'ADMIRA STORE ENGINE', versionUrl: '/version.json'
    };
    for (const k of Object.keys(attrs)) js.setAttribute('data-' + k.replace(/[A-Z]/g, c => '-' + c.toLowerCase()), attrs[k]);
    const skin = () => !!(root.AdmiraExperto && parts.expert.classList.contains('ax-experto'));
    // Con la piel, el panel ⌘ queda siempre abierto para el shell (sin inert): si una página lo
    // cierra (escena, inventario…), se reabre; plegar/desplegar es cosa de la piel.
    const keepOpen = () => { if (skin() && (parts.expert.inert || parts.expert.classList.contains('is-collapsed'))) setPanel('expert', true, {focus: false}); };
    new MutationObserver(keepOpen).observe(parts.expert, {attributes: true, attributeFilter: ['class', 'inert']});
    js.onload = keepOpen;
    // ⌘, × y Esc pliegan/despliegan la piel en vez de cerrar (inert) el panel.
    doc.addEventListener('click', ev => {
      if (!skin()) return;
      const t = ev.target.closest && ev.target.closest('#topBar [data-quad-toggle="expert"], [data-shell-close="expert"]');
      if (!t) return;
      ev.stopImmediatePropagation(); ev.preventDefault();
      if (t.matches('[data-shell-close]')) root.AdmiraExperto.close(); else root.AdmiraExperto.toggle();
    }, true);
    doc.addEventListener('keydown', ev => {
      if (ev.key !== 'Escape' || !skin() || !(ev.target && ev.target.closest && ev.target.closest('.xs-expert'))) return;
      ev.stopImmediatePropagation(); root.AdmiraExperto.close();
    }, true);
    // Con la piel el alto lo lleva el anclaje de la suite: sobra el asa de redimensionar de ⌘.
    const st = doc.createElement('style');
    st.textContent = 'html[data-ax-experto] .xp-panel-resize-height{display:none!important}';
    doc.head.appendChild(st);
    doc.head.appendChild(js);
  }

  function start() {
    parts = mount();
    cfg = parts.cfg;
    for (const verb of cfg.verbs) { try { registerVerb(verb); } catch (e) { console.warn(e); } }
    forgetPanels();
    // Primer pintado sin animación: los tres paneles entran cerrados.
    html.classList.add('xs-no-anim');
    for (const name of Object.keys(state)) paintPanel(name);
    translate();
    layout();
    requestAnimationFrame(() => requestAnimationFrame(() => html.classList.remove('xs-no-anim')));

    for (const btn of doc.querySelectorAll('#topBar [data-quad-toggle]')) {
      btn.addEventListener('click', () => { const name = btn.dataset.quadToggle; setPanel(name, !state[name]); });
    }
    for (const btn of doc.querySelectorAll('[data-shell-close]')) btn.addEventListener('click', () => { setPanel(btn.dataset.shellClose, false); const t = doc.querySelector(`#topBar [data-quad-toggle="${btn.dataset.shellClose}"]`); if (t) t.focus(); });
    doc.addEventListener('keydown', ev => {
      if (ev.key !== 'Escape') return;
      const inside = ev.target && ev.target.closest && ev.target.closest('.xs-panel, .xs-expert');
      if (!inside) return;
      const name = Object.keys(PANEL).find(k => PANEL[k] === inside.id);
      if (!name) return;
      setPanel(name, false);
      const t = doc.querySelector(`#topBar [data-quad-toggle="${name}"]`);
      if (t) t.focus();
    });
    root.addEventListener('resize', layout);
    if (root.ResizeObserver) new ResizeObserver(layout).observe(parts.expert);
    new MutationObserver(translate).observe(html, {attributes: true, attributeFilter: ['lang']});
    // Los paneles conservan su anclaje cuadrático mientras se mueve su borde interior (superpuestos).
    import(new URL('../admira-xp/scripts/panel-resize.mjs?v=20261003-expert-1',script.src).href).then(({attachPanelResize})=>{
      for(const name of ['left','right','expert']){
        const panel=doc.getElementById(PANEL[name]),vertical=name==='expert';
        const resize=attachPanelResize(panel,{
          axis:vertical?'height':'width',direction:name==='left'?1:-1,
          label:()=>T(name==='left'?'Opciones':name==='right'?'Avanzado':'Experto',name==='left'?'Options':name==='right'?'Advanced':'Expert'),
          key:'xpaceos_shell_size_v1:'+name,storage:local,container:parts.expert.parentElement,
          limits:()=>vertical?{minHeight:128,maxHeight:Math.max(128,root.innerHeight-BAR_HEIGHT-96)}:{minWidth:156,maxWidth:Math.max(156,Math.min(560,root.innerWidth*.45))},
          onChange:layout
        });
        doc.addEventListener('xpace:shell-panel',()=>resize.sync());
        root.addEventListener('pagehide',()=>resize.dispose(),{once:true});
      }
    }).catch(error=>console.warn('xpace-shell resize',error));
    wireCli();
    suiteExperto();
    registerVerb({
      id: 'avatardigital',
      aliases: ['digitalavatar', 'admirito'],
      es: '/avatar digital on|off activa u oculta el asistente. /avatarDigital sin argumento alterna Admirito; good, better y best conservan sus modelos.',
      en: '/avatar digital on|off enables or hides the assistant. /avatarDigital alone toggles Admirito; good, better and best retain their models.',
      run: (args) => shared.avatar('/avatardigital' + (args ? ' ' + args : '')),
    });
    registerVerb({
      id: 'avatarON',
      es: 'Muestra el avatar digital en esta web y lo recuerda.',
      en: 'Show the digital avatar on this site and remember it.',
      run: () => shared.avatar('/avatarON'),
    });
    registerVerb({
      id: 'avatarOFF',
      es: 'Oculta el avatar digital en esta web y lo recuerda.',
      en: 'Hide the digital avatar on this site and remember it.',
      run: () => shared.avatar('/avatarOFF'),
    });
    registerVerb({
      id: 'avatar',
      es: '/avatar good abre el calvo (cara 3D, 52 blendshapes) · /avatar better abre la chica (Ready Player Me, gafas) · /avatar best abre a Neo (MetaHuman; si el host de render está apagado, cae a la chica). /avatar sin nivel dice el estado. /avatar digital on lo muestra y /avatar digital off lo oculta; /avatarON y /avatarOFF siguen disponibles. /avatar reset vuelve al interruptor del proyecto.',
      en: '/avatar good opens the bald 3D face (facecap, 52 blendshapes) · /avatar better opens the web girl (Ready Player Me, glasses) · /avatar best opens Neo (MetaHuman; if the render host is off, the girl takes over). /avatar alone shows the status. /avatar digital on shows it and /avatar digital off hides it; /avatarON and /avatarOFF remain available. /avatar reset follows the project switch.',
      run: (args) => shared.avatar('/avatar' + (args ? ' ' + args : '')),
    });
    registerVerb({
      id: 'cli',
      es: 'Avatar: /cli dice su estado, /cli good|better|best abre ese nivel y /cli ayudante [on|off] es el interruptor. El resto de /cli sigue al gemelo.',
      en: 'Avatar: /cli shows its status, /cli good|better|best opens that level and /cli helper [on|off] is the switch. Any other /cli still goes to the twin.',
      run(args) {
        const first = String(args || '').trim().split(/\s+/)[0].toLowerCase();
        if (first === 'ayudante' || first === 'helper') return shared.avatar('/cli ' + String(args || '').trim());
        // Como en admira.app (tool #33): /cli solo dice el estado del avatar y /cli good|better|best
        // abre ese nivel; no salta al gemelo. El resto de /cli <orden> sigue yendo al gemelo.
        if (!first) return shared.avatar('/avatar');
        if (first === 'good' || first === 'better' || first === 'best') return shared.avatar('/avatar ' + first);
        handoff('/cli' + (args ? ' ' + args : ''));
      },
    });
    log(T('XpaceOS · consola lista. Escribe /help.', 'XpaceOS · console ready. Type /help.'));

    Object.assign(shared, {
      inline: false, config: cfg, lang, open: name => setPanel(name, true), close: name => setPanel(name, false),
      toggle: name => setPanel(name, !state[name]), state: () => Object.assign({}, state),
      run, print: log, registerVerb, handoff,
    });
    import(new URL('./expert-workspace.mjs?v=windows-menu-1',script.src).href).then(({mountExpertWorkspace})=>{
      shared.expertWorkspace=mountExpertWorkspace({panel:parts.expert,shell:shared,config:cfg});
      doc.dispatchEvent(new CustomEvent('xpace:expert-ready'));
    }).catch(error=>console.warn('xpace-shell expert',error));
    doc.dispatchEvent(new CustomEvent('xpace:shell-ready'));
  }

  root.XpaceShell = shared;
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start, {once: true}); else start();
})(typeof window === 'undefined' ? globalThis : window);
