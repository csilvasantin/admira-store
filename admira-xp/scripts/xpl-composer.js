/* ============================================================================
 * XPL · COMPOSITOR dentro del gemelo  ("IF · THEN · DO THAT")
 * ----------------------------------------------------------------------------
 * Panel flotante para componer reglas XPL SIN salir del gemelo. Guarda en el
 * mismo localStorage('xpl_rules') que lee el adapter (xpl-gemelo.js), así que
 * el efecto se ve al instante en la pantalla condicional.
 *
 * Se carga DESPUÉS de xpl-runtime.js y xpl-gemelo.js.
 * Toggle por CLI:  /ifthendothat on | off | toggle   (alias /componer)
 * ========================================================================== */
(function () {
  'use strict';
  if (!window.XPL) { console.warn('[XPL composer] runtime no cargado'); return; }
  var XPL = window.XPL, LS = 'xpl_rules';

  /* --------- estado --------- */
  var RULES = [], editingId = null, uid = 1, panel = null, open = false;
  var side = (function () { try { return localStorage.getItem('xpl_side') || 'auto'; } catch (e) { return 'auto'; } })();
  var _posTimer = null;

  function loadRules() {
    try { var s = JSON.parse(localStorage.getItem(LS) || 'null'); if (Array.isArray(s)) return s; } catch (e) {}
    return [];
  }
  function persist() {
    try { localStorage.setItem(LS, JSON.stringify(RULES)); } catch (e) {}
    // refrescar el motor del gemelo en caliente
    if (window.XPLGemelo && window.XPLGemelo.reload) window.XPLGemelo.reload();
  }
  function find(id) { return RULES.find(function (r) { return r.id === id; }); }
  function uniq() { return 'c' + (uid++) + (Date.now() % 9973); }

  /* --------- helpers de catálogo --------- */
  function L(o) { return XPL.label(o, 'es'); }
  function opt(arr, sel) {
    return arr.map(function (o) {
      return '<option value="' + o.id + '"' + (o.id === sel ? ' selected' : '') + '>' +
        (o.icon ? o.icon + ' ' : '') + L(o) + '</option>';
    }).join('');
  }
  // solo acciones que tienen efecto real en el gemelo (pantalla + mundo)
  function gemeloActions() {
    return XPL.ACTIONS.filter(function (a) { return a.scope === 'screen' || a.scope === 'world'; });
  }

  /* --------- builder de una regla --------- */
  function normWhen(r) { var w = XPL.condsOf(r.when); r.when = { join: w.join, conds: w.conds.slice() }; return r.when; }

  function builderHTML(r) {
    var W = XPL.condsOf(r.when);
    var joinLbl = W.join === 'or' ? 'O' : 'Y';
    var whenRows = '';
    W.conds.forEach(function (c, ci) {
      var f = XPL.byId(XPL.FACTS, c.fact) || XPL.FACTS[0];
      var row = '<select data-b="fact" data-ci="' + ci + '">' + opt(XPL.FACTS, c.fact) + '</select>';
      if (f.type === 'num') {
        row += '<select data-b="op" data-ci="' + ci + '">' + opt(XPL.OPS, c.op || '>=') + '</select>' +
          '<input type="number" data-b="val" data-ci="' + ci + '" value="' + (c.value != null ? c.value : 0) + '" style="width:62px">' +
          (f.unit ? '<i class="u">' + f.unit + '</i>' : '');
      } else if (f.type === 'enum') {
        row += '<i class="u">es</i><select data-b="eval" data-ci="' + ci + '">' + opt(f.values, c.value) + '</select>';
      } else {
        row += '<select data-b="bool" data-ci="' + ci + '"><option value="true"' + (c.value !== false ? ' selected' : '') +
          '>sí</option><option value="false"' + (c.value === false ? ' selected' : '') + '>no</option></select>';
      }
      if (W.conds.length > 1) row += '<button class="x" data-rmcond="' + ci + '">✕</button>';
      if (ci > 0) whenRows += '<div class="jn"><button class="lk" data-join="1">' + joinLbl + '</button></div>';
      whenRows += '<div class="rw">' + row + '</div>';
    });
    whenRows += '<div class="rw"><button class="lk" data-addcond="1">+ condición</button></div>';

    var acts = gemeloActions();
    var doRows = '';
    (r.do || []).forEach(function (act, i) {
      var a = XPL.byId(XPL.ACTIONS, act.id) || acts[0];
      var pr = '';
      if (a.param) {
        if (a.param.kind === 'enum') pr = '<select data-b="aval" data-i="' + i + '">' + opt(a.param.values, act.value) + '</select>';
        else pr = '<input type="text" data-b="aval" data-i="' + i + '" value="' + String(act.value || '').replace(/"/g, '&quot;') +
          '" placeholder="' + (a.param.placeholder || '') + '" style="flex:1;min-width:90px">';
      }
      doRows += '<div class="rw"><select data-b="act" data-i="' + i + '">' + opt(acts, act.id) + '</select>' + pr +
        (r.do.length > 1 ? '<button class="x" data-rmact="' + i + '">✕</button>' : '') + '</div>';
    });

    var prio = '<label>prioridad</label><div class="rw"><input type="number" data-b="prio" value="' + (r.priority || 0) +
      '" style="width:60px" min="0" max="99"><i class="u">gana el número más alto</i></div>';

    return '<div class="bld" data-bld="' + r.id + '">' +
      '<label>cuando (IF)</label>' + whenRows +
      '<label>entonces (THEN · DO THAT)</label>' + doRows +
      '<div class="rw"><button class="lk" data-addact="1">+ acción</button></div>' +
      prio +
      '<div class="rw end"><button class="lk" data-dup="1">copiar</button><span class="sp"></span><button class="ok" data-done="1">hecho</button></div>' +
      '</div>';
  }

  function render() {
    var list = panel.querySelector('#xc-list');
    panel.querySelector('#xc-count').textContent = RULES.length;
    if (!RULES.length) {
      list.innerHTML = '<div class="empty">Sin reglas. Crea una con <b>+ regla</b>.<br>' +
        'Ej: <i>CUANDO llueve ENTONCES en las pantallas anunciar botas de agua</i></div>';
      return;
    }
    var html = '';
    RULES.forEach(function (r) {
      var sent = XPL.ruleSentence(r, 'es').replace(/\b(CUANDO|ENTONCES|Y|O|coge|y)\b/g, '<b class="kw">$1</b>');
      html += '<div class="card' + (r.enabled === false ? ' off' : '') + '">' +
        '<div class="hd"><span class="sw' + (r.enabled === false ? '' : ' on') + '" data-tog="' + r.id + '"><i></i></span>' +
        '<input class="nm" value="' + String(r.name || '').replace(/"/g, '&quot;') + '" data-nm="' + r.id + '">' +
        '<button class="x" data-edit="' + r.id + '">✎</button><button class="x" data-del="' + r.id + '">✕</button></div>' +
        '<div class="sent">' + sent + '</div>' +
        (editingId === r.id ? builderHTML(r) : '') + '</div>';
    });
    list.innerHTML = html;
  }

  /* --------- acciones sobre el modelo --------- */
  function addRule() {
    var r = { id: uniq(), name: 'Regla nueva', enabled: true, priority: 1,
      when: { join: 'and', conds: [{ fact: 'rain', value: true }] }, who: { group: 'all', filter: {} },
      do: [{ id: 'showAd', value: 'rainboots' }] };
    RULES.push(r); editingId = r.id; persist(); render();
  }
  function defaultActVal(id) { var a = XPL.byId(XPL.ACTIONS, id); return a && a.param ? (a.param.kind === 'enum' ? a.param.values[0].id : '') : undefined; }

  /* --------- UI: construir panel --------- */
  function build() {
    var st = document.createElement('style');
    st.textContent = [
      // Panel acoplado a la franja lateral (posición/altura las fija positionDock()).
      '#xpl-composer{position:fixed;z-index:100060;color:#e8eef7;background:#0f141dF7;border:1px solid #26303f;',
      'border-radius:12px;font:12px -apple-system,Segoe UI,Roboto,sans-serif;display:none;flex-direction:column;',
      'overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.55);backdrop-filter:blur(8px)}',
      '#xpl-composer *{box-sizing:border-box}',
      '#xpl-composer .top{display:flex;align-items:center;gap:5px;padding:7px 8px;border-bottom:1px solid #26303f;background:#131822;flex-wrap:wrap}',
      '#xpl-composer .top b{font-size:12px;letter-spacing:.2px}',
      '#xpl-composer .top .tag{color:#5bd6c0;font-family:ui-monospace,monospace;font-size:10px}',
      '#xpl-composer .pill{font-size:10px;color:#8a97ab;border:1px solid #26303f;border-radius:999px;padding:1px 7px}',
      '#xpl-composer .sp{flex:1}',
      '#xpl-composer button{font:inherit;cursor:pointer;border:1px solid #26303f;background:#1a212e;color:#e8eef7;border-radius:8px;padding:4px 8px;font-size:11.5px}',
      '#xpl-composer button:hover{border-color:#5bd6c0}',
      '#xpl-composer .ok{background:#5bd6c0;color:#06231e;border-color:#5bd6c0;font-weight:700}',
      '#xpl-composer .lk{background:transparent;padding:3px 7px;color:#7aa2ff;font-size:10.5px}',
      '#xpl-composer .ico{background:transparent;border-color:transparent;color:#8a97ab;padding:2px 6px;font-size:13px}',
      '#xpl-composer .ico:hover{color:#fff}',
      '#xpl-composer .list{flex:1;overflow:auto;padding:8px;display:flex;flex-direction:column;gap:8px}',
      '#xpl-composer .card{background:#1a212e;border:1px solid #26303f;border-radius:10px;overflow:hidden;flex:none}',
      '#xpl-composer .card.off{opacity:.5}',
      '#xpl-composer .hd{display:flex;align-items:center;gap:6px;padding:5px 7px;border-bottom:1px solid #26303f;background:#161d28}',
      '#xpl-composer .nm{flex:1;min-width:0;background:transparent;border:none;color:#e8eef7;font-weight:600;font-size:11.5px;outline:none}',
      '#xpl-composer .sent{padding:6px 8px;font-size:11px;line-height:1.45;color:#cdd8e8}',
      '#xpl-composer .kw{color:#5bd6c0;font-family:ui-monospace,monospace;font-size:9.5px;font-weight:700}',
      '#xpl-composer .sw{position:relative;width:28px;height:16px;border-radius:999px;background:#2a3444;border:1px solid #26303f;flex:none;cursor:pointer}',
      '#xpl-composer .sw.on{background:#5bd6c0}',
      '#xpl-composer .sw i{position:absolute;top:1px;left:1px;width:12px;height:12px;border-radius:50%;background:#fff;transition:.15s}',
      '#xpl-composer .sw.on i{left:13px}',
      '#xpl-composer .x{color:#8a97ab;border:none;background:transparent;font-size:13px;padding:1px 4px}',
      '#xpl-composer .x:hover{color:#ff6b6b}',
      '#xpl-composer .bld{padding:7px 8px;border-top:1px solid #26303f;background:#0c1119;display:flex;flex-direction:column;gap:6px}',
      '#xpl-composer label{font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#8a97ab}',
      '#xpl-composer .rw{display:flex;align-items:center;gap:5px;flex-wrap:wrap}',
      '#xpl-composer .rw.end{margin-top:2px}',
      '#xpl-composer .jn{margin:-2px 0}',
      '#xpl-composer select,#xpl-composer input{font:inherit;background:#1a212e;color:#e8eef7;border:1px solid #26303f;border-radius:7px;padding:4px 6px;font-size:11.5px;outline:none;max-width:100%}',
      '#xpl-composer select:focus,#xpl-composer input:focus{border-color:#7aa2ff}',
      '#xpl-composer .u{color:#8a97ab;font-size:10.5px;font-style:normal}',
      '#xpl-composer .empty{color:#8a97ab;font-size:11.5px;text-align:center;padding:20px 12px;line-height:1.7}',
      '#xpl-composer .ft{padding:6px 9px;border-top:1px solid #26303f;color:#8a97ab;font-size:10px;display:flex;align-items:center;gap:5px}'
    ].join('');
    document.head.appendChild(st);

    panel = document.createElement('div');
    panel.id = 'xpl-composer';
    panel.innerHTML =
      '<div class="top"><b>IF·THEN·<span class="tag">DO THAT</span></b>' +
      '<span class="pill" id="xc-count">0</span><span class="sp"></span>' +
      '<button class="ico" id="xc-flip" title="cambiar de lado">⇄</button>' +
      '<button class="x" id="xc-close" title="cerrar (/ifthendothat off)">✕</button>' +
      '<div style="flex-basis:100%;height:0"></div>' +
      '<button class="ok" id="xc-add">+ regla</button>' +
      '<button class="lk" id="xc-ex">ejemplos</button></div>' +
      '<div class="list" id="xc-list"></div>' +
      '<div class="ft">● efecto inmediato en la pantalla condicional</div>';
    document.body.appendChild(panel);

    panel.querySelector('#xc-add').onclick = addRule;
    panel.querySelector('#xc-close').onclick = function () { setOpen(false); };
    panel.querySelector('#xc-ex').onclick = seed;
    panel.querySelector('#xc-flip').onclick = flip;
    window.addEventListener('resize', function () { if (open) positionDock(); });
    wire();
  }

  /* --------- acople a la franja lateral del Xpacio ------------------------- */
  function effectiveSide() {
    if (side !== 'auto') return side;
    var cv = document.getElementById('c'), vw = window.innerWidth;
    if (cv) { var r = cv.getBoundingClientRect(); return (r.left >= vw - r.right) ? 'left' : 'right'; }
    return 'right';
  }
  function positionDock() {
    if (!panel) return;
    var cv = document.getElementById('c');
    var vw = window.innerWidth, vh = window.innerHeight;
    var top = 8, height = vh - 16, leftStrip = vw * 0.22, rightStrip = vw * 0.22;
    if (cv) {
      var r = cv.getBoundingClientRect();
      if (r.width > 40 && r.height > 40) {
        top = Math.max(6, r.top);
        height = Math.max(220, Math.min(vh - top - 6, r.height));
        leftStrip = r.left; rightStrip = vw - r.right;
      }
    }
    var s = effectiveSide();
    var strip = (s === 'left') ? leftStrip : rightStrip;
    var width = Math.max(248, Math.min(336, strip - 6));
    panel.style.top = top + 'px'; panel.style.height = height + 'px'; panel.style.width = width + 'px';
    if (s === 'left') { panel.style.left = '4px'; panel.style.right = 'auto'; }
    else { panel.style.left = 'auto'; panel.style.right = '4px'; }
  }
  function flip() {
    side = (effectiveSide() === 'left') ? 'right' : 'left';
    try { localStorage.setItem('xpl_side', side); } catch (e) {}
    positionDock();
  }

  function seed() {
    RULES = [
      { id: uniq(), name: 'Llueve → botas de agua', enabled: true, priority: 3,
        when: { join: 'and', conds: [{ fact: 'rain', value: true }] }, who: { group: 'all', filter: {} }, do: [{ id: 'showAd', value: 'rainboots' }] },
      { id: uniq(), name: 'Calor → helado', enabled: true, priority: 1,
        when: { join: 'and', conds: [{ fact: 'temperature', op: '>=', value: 28 }] }, who: { group: 'all', filter: {} }, do: [{ id: 'showAd', value: 'icecream' }] },
      { id: uniq(), name: 'Noche → happy hour', enabled: true, priority: 1,
        when: { join: 'and', conds: [{ fact: 'night', value: true }] }, who: { group: 'all', filter: {} }, do: [{ id: 'showAd', value: 'happyhour' }] }
    ];
    editingId = null; persist(); render();
  }

  /* --------- eventos (delegación) --------- */
  function wire() {
    var list = panel.querySelector('#xc-list');
    list.addEventListener('click', function (e) {
      var t = e.target, b = t.closest('[data-bld]'), r;
      var tog = t.closest('[data-tog]');
      if (tog) { r = find(tog.dataset.tog); r.enabled = r.enabled === false; persist(); render(); return; }
      if (t.dataset.edit) { editingId = editingId === t.dataset.edit ? null : t.dataset.edit; render(); return; }
      if (t.dataset.del) { RULES = RULES.filter(function (x) { return x.id !== t.dataset.del; }); persist(); render(); return; }
      if (t.dataset.done) { editingId = null; render(); return; }
      if (!b) return; r = find(b.dataset.bld); if (!r) return;
      if (t.dataset.dup != null) { var c = JSON.parse(JSON.stringify(r)); c.id = uniq(); c.name = r.name + ' (copia)'; RULES.push(c); editingId = c.id; persist(); render(); return; }
      if (t.dataset.addcond != null) { normWhen(r).conds.push({ fact: 'temperature', op: '>=', value: 25 }); persist(); render(); return; }
      if (t.dataset.rmcond != null) { normWhen(r).conds.splice(+t.dataset.rmcond, 1); persist(); render(); return; }
      if (t.dataset.join != null) { var w = normWhen(r); w.join = w.join === 'or' ? 'and' : 'or'; persist(); render(); return; }
      if (t.dataset.addact != null) { r.do.push({ id: 'showAd', value: 'promo' }); persist(); render(); return; }
      if (t.dataset.rmact != null) { r.do.splice(+t.dataset.rmact, 1); persist(); render(); return; }
    });
    list.addEventListener('change', function (e) {
      var b = e.target.closest('[data-bld]'); if (!b) return;
      var r = find(b.dataset.bld), t = e.target, k = t.dataset.b;
      var i = t.dataset.i != null ? +t.dataset.i : null, ci = t.dataset.ci != null ? +t.dataset.ci : 0;
      if (k === 'fact') { var w = normWhen(r), f = XPL.byId(XPL.FACTS, t.value), nc = { fact: t.value };
        if (f.type === 'num') { nc.op = '>='; nc.value = f.min != null ? Math.round((f.min + (f.max || 100)) / 2) : 0; }
        else if (f.type === 'enum') nc.value = f.values[0].id; else nc.value = true; w.conds[ci] = nc; }
      else if (k === 'op') normWhen(r).conds[ci].op = t.value;
      else if (k === 'val') normWhen(r).conds[ci].value = +t.value;
      else if (k === 'eval') normWhen(r).conds[ci].value = t.value;
      else if (k === 'bool') normWhen(r).conds[ci].value = (t.value === 'true');
      else if (k === 'prio') r.priority = +t.value || 0;
      else if (k === 'act') { r.do[i] = { id: t.value }; var dv = defaultActVal(t.value); if (dv !== undefined) r.do[i].value = dv; }
      else if (k === 'aval') r.do[i].value = t.value;
      persist(); render();
    });
    list.addEventListener('input', function (e) {
      if (e.target.dataset.nm) { var r = find(e.target.dataset.nm); r.name = e.target.value;
        try { localStorage.setItem(LS, JSON.stringify(RULES)); } catch (x) {} }
    });
  }

  /* --------- drag --------- */
  /* --------- abrir/cerrar --------- */
  function setOpen(v) {
    open = v;
    if (!panel) build();
    if (v) { RULES = loadRules(); render(); }
    panel.style.display = v ? 'flex' : 'none';
    if (v) {
      positionDock();
      if (!_posTimer) _posTimer = setInterval(function () { if (open) positionDock(); else { clearInterval(_posTimer); _posTimer = null; } }, 1200);
    }
  }

  /* --------- CLI: /ifthendothat on|off|toggle (alias /componer) --------- */
  function patch() {
    var prev = window.__xtExec;
    if (typeof prev !== 'function') return setTimeout(patch, 500);
    window.__xtExec = function (text) {
      var t = String(text || '').trim();
      if (/^\/xplon\b/i.test(t))  { setOpen(true);  return Promise.resolve('xplon'); }
      if (/^\/xploff\b/i.test(t)) { setOpen(false); return Promise.resolve('xploff'); }
      if (/^\/(ifthendothat|componer)\b/i.test(t)) {
        var a = (t.split(/\s+/)[1] || 'toggle').toLowerCase();
        setOpen(a === 'on' ? true : a === 'off' ? false : !open);
        return Promise.resolve('ifthendothat');
      }
      return prev.apply(this, arguments);
    };
  }

  /* --------- intercepción del chat in-game ---------------------------------
   * El chat del gemelo (#telegramComposer) llama a la función LOCAL
   * executeTelegramText, que no pasa por nuestras envolturas de window.__xtExec.
   * Capturamos el envío y enrutamos NUESTROS comandos a window.__xtExec
   * (que sí tiene los wrappers de /ifthendothat y /condicional). El resto pasa
   * tal cual al gemelo. */
  var MINE = /^\/(xplon|xploff|ifthendothat|componer|pantallacondicional|condicional|condicionados|xpl)\b/i;
  function routeMine(v) {
    var t = String(v || '').trim();
    if (typeof window.__xtExec === 'function') window.__xtExec(t);
    var verb = t.split(/\s+/)[0];
    try { if (typeof window.showEv === 'function') window.showEv('XPL · ' + verb.replace(/^\//, '') + ' ✓', '#5bd6c0'); } catch (e) {}
  }
  function initInputHook() {
    var box = document.getElementById('telegramComposer');
    var btn = document.getElementById('telegramSendBtn');
    if (!box) { return setTimeout(initInputHook, 600); }
    if (box.__xplHooked) return; box.__xplHooked = true;
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && MINE.test(box.value)) {
        var v = box.value; e.preventDefault(); e.stopImmediatePropagation(); routeMine(v); box.value = '';
      }
    }, true);
    if (btn) btn.addEventListener('click', function (e) {
      if (MINE.test(box.value)) { var v = box.value; e.preventDefault(); e.stopImmediatePropagation(); routeMine(v); box.value = ''; }
    }, true);
    console.log('[XPL] chat in-game enganchado (/ifthendothat, /condicional)');
  }

  function boot() { patch(); initInputHook(); console.log('[XPL] compositor listo · /xplON · /xplOFF · /ifthendothat on|off|toggle'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();

  window.XPLComposer = { open: function () { setOpen(true); }, close: function () { setOpen(false); }, toggle: function () { setOpen(!open); } };
})();
