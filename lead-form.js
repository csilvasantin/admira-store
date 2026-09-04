/* ===== XpaceOS · formulario de lead unificado (home + gemelo Admira XP) =====
   El MISMO formulario que el gemelo abre con /contacto. Guarda el contacto en el
   worker pixer-eleven (POST /lead → KV + aviso Telegram) y, si la red falla, lo
   encola en localStorage y reintenta — no se pierde ningún lead. Bilingüe ES/EN
   (sigue el idioma de la página). Se engancha solo a los disparadores
   [data-admira-contact] y [data-lead-open]. Expone window.openLeadForm. */
(function () {
  // Dominio propio: LaLiga bloquea workers.dev/r2.dev en horas de fútbol (FLT-1633).
  var ENDPOINT = 'https://api.admira.store/lead';
  var QKEY = 'xpace_lead_queue';

  function lng() {
    try {
      var l = document.documentElement.lang
        || localStorage.getItem('xpaceosLang')
        || localStorage.getItem('xtanco_lang')
        || (window.lang || '');
      return /^es/i.test(l) ? 'es' : 'en';
    } catch (e) { return 'en'; }
  }

  var T = {
    es: { title: 'Hablemos', sub: 'Déjanos tus datos y te enseñamos XpaceOS en tu espacio.',
      name: 'Nombre', company: 'Empresa', email: 'Email', phone: 'Teléfono', role: 'Cargo',
      interest: 'Interés', pick: 'Elige…', notes: '¿Qué te gustaría ver?',
      consent: 'Acepto que Admira me contacte sobre XpaceOS.',
      send: 'Enviar', cancel: 'Cancelar', sending: 'Enviando…',
      okTitle: '¡Gracias! 🎉', okMsg: 'Te contactaremos muy pronto.', close: 'Cerrar',
      offMsg: 'Guardado ✓ — se enviará en cuanto haya conexión.',
      errName: 'Pon tu nombre.', errContact: 'Pon un email o un teléfono.', errEmail: 'Email no válido.' },
    en: { title: "Let's talk", sub: 'Leave your details and we’ll show XpaceOS in your space.',
      name: 'Name', company: 'Company', email: 'Email', phone: 'Phone', role: 'Role',
      interest: 'Interest', pick: 'Choose…', notes: 'What would you like to see?',
      consent: 'I agree Admira may contact me about XpaceOS.',
      send: 'Send', cancel: 'Cancel', sending: 'Sending…',
      okTitle: 'Thank you! 🎉', okMsg: 'We’ll be in touch very soon.', close: 'Close',
      offMsg: 'Saved ✓ — it will be sent once you’re back online.',
      errName: 'Enter your name.', errContact: 'Enter an email or a phone.', errEmail: 'Invalid email.' }
  };
  function tr() { return T[lng()] || T.es; }

  // Desplegable de interés: las 3 capas de AdmiraNext. value = rótulo canónico
  // EN (dato estable, igual que el contact-panel compartido); texto localizado.
  var INTEREST = [
    { value: 'Content Creation · LLM Productions · pixeria.com',
      en: 'Content Creation · LLM Productions · pixeria.com',
      es: 'Creación de Contenido · LLM Productions · pixeria.com' },
    { value: 'Content Distribution · Digital Twin · xpaceos.com',
      en: 'Content Distribution · Digital Twin · xpaceos.com',
      es: 'Distribución de Contenido · Gemelo Digital · xpaceos.com' },
    { value: 'Content Monetization · Programmatic Marketplace · admira.app',
      en: 'Content Monetization · Programmatic Marketplace · admira.app',
      es: 'Comercialización de Contenidos · Programmatic Marketplace · admira.app' },
    { value: 'Other', en: 'Other', es: 'Otro' }
  ];

  /* ── transporte + cola offline ─────────────────────────────────────── */
  function postLead(payload, timeoutMs) {
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var to = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, timeoutMs || 9000) : null;
    return fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (to) clearTimeout(to); if (!r.ok) throw new Error('http ' + r.status); return r.json().catch(function () { return {}; }); });
  }
  function loadQ() { try { return JSON.parse(localStorage.getItem(QKEY) || '[]'); } catch (e) { return []; } }
  function saveQ(a) { try { localStorage.setItem(QKEY, JSON.stringify(a.slice(-200))); } catch (e) {} }
  function enqueue(p) { var a = loadQ(); a.push(p); saveQ(a); }
  var flushing = false;
  function flushQ() {
    if (flushing) return; var a = loadQ(); if (!a.length) return; flushing = true;
    (function next() {
      if (!a.length) { saveQ(a); flushing = false; return; }
      var p = a[0];
      postLead(p, 9000).then(function () { a.shift(); saveQ(a); next(); })
        .catch(function () { flushing = false; });
    })();
  }

  /* ── modal ─────────────────────────────────────────────────────────── */
  var built = false, autoTimer = null, pendingSource = 'xpaceos-home', previousFocus = null;
  function q(id) { return document.getElementById(id); }
  function val(id) { var e = q(id); return e ? String(e.value || '').trim() : ''; }
  function build() {
    if (built) return;
    var back = document.createElement('div'); back.id = 'xleadBack';
    back.innerHTML =
      '<div id="xleadCard" role="dialog" aria-modal="true" aria-labelledby="xlT" aria-describedby="xlSub" tabindex="-1">' +
        '<button id="xleadClose" type="button" aria-label="close">×</button>' +
        '<form id="xleadForm" novalidate>' +
          '<h3 id="xlT"></h3><div class="xl-sub" id="xlSub"></div>' +
          '<div id="xleadErr" role="alert" aria-live="polite"></div>' +
          '<div class="xl-f"><label id="lbName" for="xleadName"></label><input id="xleadName" autocomplete="name" maxlength="120"></div>' +
          '<div class="xl-row"><div class="xl-f"><label id="lbCompany" for="xleadCompany"></label><input id="xleadCompany" autocomplete="organization" maxlength="120"></div>' +
            '<div class="xl-f"><label id="lbRole" for="xleadRole"></label><input id="xleadRole" autocomplete="organization-title" maxlength="80"></div></div>' +
          '<div class="xl-row"><div class="xl-f"><label id="lbEmail" for="xleadEmail"></label><input id="xleadEmail" type="email" inputmode="email" autocomplete="email" maxlength="160"></div>' +
            '<div class="xl-f"><label id="lbPhone" for="xleadPhone"></label><input id="xleadPhone" type="tel" inputmode="tel" autocomplete="tel" maxlength="40"></div></div>' +
          '<div class="xl-f"><label id="lbInterest" for="xleadInterest"></label><select id="xleadInterest"></select></div>' +
          '<div class="xl-f"><label id="lbNotes" for="xleadNotes"></label><textarea id="xleadNotes" maxlength="500"></textarea></div>' +
          '<label class="xl-consent"><input type="checkbox" id="xleadConsent"><span id="lbConsent"></span></label>' +
          '<div id="xleadBtns"><button id="xleadCancel" type="button"></button><button id="xleadSend" type="submit"></button></div>' +
        '</form>' +
        '<div id="xleadOK" role="status" aria-live="polite"><h3 id="xlOkT"></h3><p id="xlOkM"></p></div>' +
      '</div>';
    document.body.appendChild(back);
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    q('xleadClose').addEventListener('click', close);
    q('xleadCancel').addEventListener('click', close);
    q('xleadForm').addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    q('xleadForm').addEventListener('keydown', function (e) {
      var tag = e.target && e.target.tagName;
      if (e.key === 'Enter' && tag !== 'TEXTAREA' && tag !== 'SELECT' && tag !== 'BUTTON') {
        e.preventDefault(); submit();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (!back.classList.contains('show')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'Tab') return;
      var focusable = back.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]');
      if (!focusable.length) { e.preventDefault(); q('xleadCard').focus(); return; }
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    // Reidioma en caliente si el usuario cambia el idioma de la página.
    window.addEventListener('admira:languagechange', function () { if (back.classList.contains('show')) fill(); });
    built = true;
  }
  function fill() {
    var t = tr();
    q('xlT').textContent = t.title; q('xlSub').textContent = t.sub;
    q('lbName').textContent = t.name; q('lbCompany').textContent = t.company; q('lbRole').textContent = t.role;
    q('lbEmail').textContent = t.email; q('lbPhone').textContent = t.phone; q('lbInterest').textContent = t.interest;
    q('lbNotes').textContent = t.notes; q('lbConsent').textContent = t.consent;
    q('xleadClose').setAttribute('aria-label', t.close);
    q('xleadCancel').textContent = t.cancel; q('xleadSend').textContent = t.send;
    var sel = q('xleadInterest'); var prev = sel.value; var L = lng();
    sel.innerHTML = '';
    var o0 = document.createElement('option'); o0.value = ''; o0.textContent = t.pick; sel.appendChild(o0);
    INTEREST.forEach(function (it) { var o = document.createElement('option'); o.value = it.value; o.textContent = it[L] || it.en; sel.appendChild(o); });
    if (prev) { try { sel.value = prev; } catch (e) {} }
    q('xlOkT').textContent = t.okTitle; q('xlOkM').textContent = t.okMsg;
  }
  function setErr(m) { var e = q('xleadErr'); if (!e) return; if (m) { e.textContent = m; e.style.display = 'block'; } else { e.style.display = 'none'; } }
  function close() {
    var b = q('xleadBack'); if (b) b.classList.remove('show');
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    if (previousFocus && typeof previousFocus.focus === 'function') { try { previousFocus.focus(); } catch (e) {} }
    previousFocus = null;
  }
  function open(opts) {
    build();
    previousFocus = document.activeElement;
    if (opts && typeof opts === 'string') pendingSource = opts;
    else if (opts && opts.source) pendingSource = opts.source;
    else pendingSource = 'xpaceos-home';
    fill(); setErr('');
    q('xleadForm').style.display = 'block'; q('xleadOK').style.display = 'none';
    q('xleadSend').disabled = false;
    ['xleadName', 'xleadCompany', 'xleadRole', 'xleadEmail', 'xleadPhone', 'xleadNotes'].forEach(function (id) { var e = q(id); if (e) e.value = ''; });
    q('xleadInterest').selectedIndex = 0; q('xleadConsent').checked = false;
    if (opts && opts.notes) q('xleadNotes').value = String(opts.notes).slice(0, 500);
    q('xleadBack').classList.add('show');
    setTimeout(function () { try { q('xleadName').focus(); } catch (e) {} }, 40);
  }
  function showThanks(title, msg) {
    q('xleadForm').style.display = 'none';
    q('xleadOK').style.display = 'block';
    q('xlOkT').textContent = title; q('xlOkM').textContent = msg;
    autoTimer = setTimeout(close, 2600);
  }
  function submit() {
    var t = tr();
    var name = val('xleadName'), email = val('xleadEmail'), phone = val('xleadPhone');
    if (!name) { setErr(t.errName); return; }
    if (!email && !phone) { setErr(t.errContact); return; }
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr(t.errEmail); return; }
    setErr('');
    var payload = { name: name, email: email, phone: phone, company: val('xleadCompany'),
      role: val('xleadRole'), interest: val('xleadInterest'), notes: val('xleadNotes'),
      consent: q('xleadConsent').checked, source: pendingSource };
    var send = q('xleadSend'); send.disabled = true; send.textContent = t.sending;
    postLead(payload, 9000)
      .then(function () { showThanks(t.okTitle, t.okMsg); flushQ(); })
      .catch(function () { enqueue(payload); showThanks(t.okTitle, t.offMsg); });
  }

  /* ── disparadores ──────────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var trg = e.target.closest('[data-admira-contact],[data-lead-open]');
    if (!trg) return;
    e.preventDefault();
    open({ source: trg.getAttribute('data-lead-source') || 'xpaceos-home' });
  });

  function init() {
    setTimeout(flushQ, 3000);
    try { window.addEventListener('online', flushQ); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.openLeadForm = open;
  window.XpaceLead = { open: open, flush: flushQ, queued: function () { return loadQ().length; } };
})();
