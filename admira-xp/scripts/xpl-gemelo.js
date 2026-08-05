/* ============================================================================
 * XPL · adapter del GEMELO (XpaceOS)
 * ----------------------------------------------------------------------------
 * Conecta el lenguaje XPL (xpl-runtime.js) con el gemelo real:
 *   - lee el mundo desde window.G  (clima, hora, gente, satisfacción…)
 *   - pinta un overlay de señalización contextual (las "pantallas")
 *   - enchufa acciones de mundo: command→__xtExec, setWeather→G.weather, jingle→sonido
 *   - comparte las reglas con el editor (xpl.html) vía localStorage('xpl_rules')
 *
 * Se carga al final del index.html del gemelo, DESPUÉS de xpl-runtime.js:
 *   <script src="scripts/xpl-runtime.js"></script>
 *   <script src="scripts/xpl-gemelo.js"></script>
 *
 * No toca la lógica del juego: solo lee G y añade un overlay + un chip de estado.
 * Comandos CLI (vía el dispatcher): /xpl on | off | toggle | reload | status
 * ========================================================================== */
(function () {
  'use strict';
  if (!window.XPL) { console.warn('[XPL] runtime no cargado'); return; }
  // Idempotencia: si el adapter ya arrancó en esta página (doble carga por el
  // auto-reload de versión, etc.), no montar una segunda instancia.
  if (window.__XPL_GEMELO_ACTIVE) { return; }
  window.__XPL_GEMELO_ACTIVE = true;

  var LS_RULES = 'xpl_rules';      // reglas compartidas con el editor
  var LS_ON    = 'xpl_gemelo_on';  // overlay encendido/apagado

  /* ---------------------------------------------------------------------------
   * 1) WORLD ADAPTER  — XPL pregunta, G responde
   * ------------------------------------------------------------------------- */
  function hour() {
    var g = window.G;
    return g && typeof g.gameTime === 'number' ? Math.floor(g.gameTime) % 24 : new Date().getHours();
  }
  function isNight() {
    var h = hour();
    return h < 8 || h >= 21;
  }
  // El gemelo no guarda temperatura: la estimamos (hora + clima + estación real).
  function estTemp() {
    var g = window.G, h = hour();
    var base = 14 + Math.round(8 * Math.sin((h - 9) / 24 * Math.PI * 2)); // ~6..22 según hora
    var m = new Date().getMonth();
    var seasonAdj = (m >= 5 && m <= 8) ? 8 : (m === 11 || m <= 1) ? -7 : 0; // verano/invierno
    var rainAdj = (g && g.weather && g.weather.type === 'rain') ? -4 : 0;
    return base + seasonAdj + rainAdj;
  }
  function seasonNow() {
    var m = new Date().getMonth();
    return (m >= 2 && m <= 4) ? 'spring' : (m >= 5 && m <= 7) ? 'summer' : (m >= 8 && m <= 10) ? 'autumn' : 'winter';
  }
  function peopleNow() {
    var g = window.G; if (!g) return 0;
    if (typeof g.passersby === 'number') return g.passersby;
    if (Array.isArray(g.custs)) return g.custs.length;
    return 0;
  }

  var screen = { ad: null, tone: 'calm', content: null, contentReq: null };
  var extScreen = { ad: null };   // pantalla de exterior (MUPI de calle), dirigida al viandante

  // Audiencia por cámara (anónima, on-device): la lee el modelo facial de
  // index.html y la deja en window.LIVE_FACE {faces, gender, age, ageBucket, ts}.
  // Aquí la exponemos como HECHOS XPL (viewers/audGender/audAge) para que las
  // reglas reaccionen a quién mira la pantalla.
  function lfFresh() {
    var lf = window.LIVE_FACE;
    return (lf && lf.faces > 0 && (performance.now() - (lf.ts || 0)) < 5000) ? lf : null;
  }
  function camFaces()  { var lf = lfFresh(); return lf ? lf.faces : 0; }
  function camGender() { var lf = lfFresh(); if (!lf) return 'none'; return lf.gender === 'female' ? 'female' : lf.gender === 'male' ? 'male' : 'mixed'; }
  function camAge()    { var lf = lfFresh(); if (!lf) return 'none'; return lf.ageBucket || 'adulto'; }

  // Viandante por la MUPICAM (audiencia de la PANTALLA DE EXTERIOR): el gemelo deja
  // en G.exteriorAd {gender:'f'|'m', age:'nino'|...} a quien cruza el frente del mupi.
  function extFresh()   { var e = window.G && window.G.exteriorAd; return (e && e.gender) ? e : null; }
  function extGenderV() { var e = extFresh(); if (!e) return 'none'; return e.gender === 'f' ? 'female' : e.gender === 'm' ? 'male' : 'mixed'; }
  function extAgeV()    { var e = extFresh(); return (e && e.age) ? e.age : 'none'; }

  // OVERRIDE de emisión (control remoto CLI): manda POR ENCIMA de las reglas
  // durante 'until'. ad:'' = forzar apagado · ad:null = no tocar · auto = soltar.
  var override = { ad: null, tone: null, until: 0 };
  function applyOverride() {
    if (override.until && Date.now() < override.until) {
      if (override.ad !== null) screen.ad = override.ad || null;
      if (override.tone) screen.tone = override.tone;
    } else if (override.until) { override.until = 0; override.ad = null; override.tone = null; }
  }
  function overrideMs() { return Math.max(0, override.until - Date.now()); }

  var world = {
    fact: function (id) {
      var g = window.G || {};
      switch (id) {
        case 'rain':        return !!(g.weather && g.weather.type === 'rain');
        case 'temperature': return estTemp();
        case 'wind':        return !!(g.weather && g.weather.type === 'wind');
        case 'season':      return seasonNow();
        case 'hour':        return hour();
        case 'dayPart':     { var h = hour(); if (isNight()) return 'night';
                              return h < 12 ? 'morning' : h < 15 ? 'noon' : h < 21 ? 'afternoon' : 'night'; }
        case 'night':       return isNight();
        case 'weekend':     { var d = new Date().getDay(); return d === 0 || d === 6; }
        case 'holiday':     return !!g.holiday;
        case 'people':      return peopleNow();
        case 'rush':        return !!(g.rush || peopleNow() >= 12);
        case 'doorOpen':    return g.doorOpen !== false && !isNight();
        case 'thief':       return !!g.thief;
        case 'satisfaction':return typeof g.satisfaction === 'number' ? g.satisfaction : 70;
        case 'money':       return typeof g.money === 'number' ? g.money : 0;
        // — audiencia por cámara (anónima) —
        case 'viewers':     return camFaces();
        case 'audGender':   return camGender();
        case 'audAge':      return camAge();
        // — viandante (pantalla de exterior) —
        case 'extGender':   return extGenderV();
        case 'extAge':      return extAgeV();
      }
      return 0;
    },
    npcs: function () { return []; }, // efectos sobre NPCs: aún no cableados en el gemelo
    act: function (id, value /*, npc */) {
      var g = window.G;
      switch (id) {
        case 'showAd':      screen.ad = value; screen.contentReq = null; break;
        // showContent NO resuelve aquí (pick es async): solo fija la intención;
        // resolveContent() la convierte en un asset real tras el engine.tick().
        case 'showContent': screen.contentReq = value || 'auto'; screen.ad = null; break;
        case 'clearScreen': screen.ad = null; screen.contentReq = null; break;
        case 'screenTone':  screen.tone = value; break;
        case 'showExtAd':      extScreen.ad = value; break;
        case 'clearExtScreen': extScreen.ad = null; break;
        case 'setWeather':  if (g) { g.weather = { type: value === 'sun' ? 'sun' : value, timer: 600 }; } break;
        case 'jingle':      beep(value); break;
        case 'command':     if (typeof window.__xtExec === 'function' && value) window.__xtExec(String(value)); break;
        // equip/say/mood/dance/goInside (scope npc) -> sin targets, no hacen nada aquí
      }
    }
  };

  /* ---------------------------------------------------------------------------
   * 2) SONIDO (jingle) — WebAudio simple
   * ------------------------------------------------------------------------- */
  var actx = null;
  function beep(kind) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var notes = kind === 'alert' ? [880, 660] : kind === 'promo' ? [523, 659, 784] : [880];
      notes.forEach(function (f, i) {
        var o = actx.createOscillator(), gn = actx.createGain();
        o.frequency.value = f; o.type = 'sine'; o.connect(gn); gn.connect(actx.destination);
        var t = actx.currentTime + i * 0.12;
        gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        o.start(t); o.stop(t + 0.2);
      });
    } catch (e) {}
  }

  /* ---------------------------------------------------------------------------
   * 3) OVERLAY DE SEÑALIZACIÓN  (la "pantalla" contextual del gemelo)
   * ------------------------------------------------------------------------- */
  // OFF por defecto (Carlos, 14-jul-2026): la pantalla solo aparece si se enciende
  // explicitamente (/xpl on o clic en el chip); la eleccion persiste en localStorage.
  var el, chip, extEl, on = localStorage.getItem(LS_ON) === '1';

  function buildUI() {
    // ---- pantalla flotante (movible) ----
    el = document.createElement('div');
    el.id = 'xpl-signage';
    el.style.cssText = [
      'position:fixed', 'right:18px', 'bottom:64px', 'width:200px', 'height:118px',
      'border-radius:14px', 'overflow:hidden', 'z-index:100050', 'cursor:grab',
      'box-shadow:0 8px 30px rgba(0,0,0,.45)', 'border:2px solid rgba(255,255,255,.12)',
      'font-family:-apple-system,Segoe UI,Roboto,sans-serif', 'display:none', 'user-select:none',
      'transition:background .4s'
    ].join(';');
    el.innerHTML =
      // capa de CONTENIDO REAL (img/video del Stock) — encima del fondo, debajo del badge
      '<div id="xpl-sg-media" style="position:absolute;inset:0;display:none;background:#000;overflow:hidden"></div>' +
      '<div id="xpl-sg-body" style="position:absolute;inset:0;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;gap:4px;color:#fff;text-align:center">' +
      '<div id="xpl-sg-icon" style="font-size:46px;line-height:1"></div>' +
      '<div id="xpl-sg-label" style="font:700 11px ui-monospace,monospace;letter-spacing:1px"></div></div>' +
      '<div id="xpl-sg-badge" style="position:absolute;top:5px;left:7px;font:700 8px ui-monospace,monospace;color:#fff9;letter-spacing:1px;z-index:2;text-shadow:0 1px 2px #000a">XPACEOS · LIVE</div>';
    document.body.appendChild(el);
    dragify(el);

    // ---- PANTALLA DE EXTERIOR (MUPI de calle, vertical) — dirigida al viandante ----
    extEl = document.createElement('div');
    extEl.id = 'xpl-ext-signage';
    extEl.style.cssText = [
      'position:fixed', 'left:18px', 'bottom:64px', 'width:116px', 'height:196px',
      'border-radius:12px', 'overflow:hidden', 'z-index:100050', 'cursor:grab',
      'box-shadow:0 8px 30px rgba(0,0,0,.5)', 'border:2px solid rgba(255,255,255,.14)',
      'font-family:-apple-system,Segoe UI,Roboto,sans-serif', 'display:none', 'user-select:none',
      'transition:background .4s'
    ].join(';');
    extEl.innerHTML =
      '<div id="xpl-ext-body" style="position:absolute;inset:0;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;gap:6px;color:#fff;text-align:center;padding:0 8px">' +
      '<div id="xpl-ext-icon" style="font-size:52px;line-height:1"></div>' +
      '<div id="xpl-ext-label" style="font:700 11px ui-monospace,monospace;letter-spacing:.5px"></div></div>' +
      '<div style="position:absolute;top:5px;left:0;right:0;text-align:center;font:700 7px ui-monospace,monospace;color:#fff9;letter-spacing:1px;text-shadow:0 1px 2px #000a">MUPI · EXTERIOR</div>' +
      '<div id="xpl-ext-seg" style="position:absolute;bottom:5px;left:0;right:0;text-align:center;font:700 8px ui-monospace,monospace;color:#ffffffcc;text-shadow:0 1px 2px #000a"></div>';
    document.body.appendChild(extEl);
    dragify(extEl);

    // ---- chip de estado ----
    chip = document.createElement('div');
    chip.id = 'xpl-chip';
    chip.style.cssText = [
      'position:fixed', 'right:18px', 'bottom:18px', 'z-index:100051',
      'display:flex', 'align-items:center', 'gap:7px', 'padding:6px 11px',
      'border-radius:999px', 'background:#0b0e14d9', 'border:1px solid #26303f',
      'color:#cdd8e8', 'font:600 12px -apple-system,Segoe UI,sans-serif',
      'cursor:pointer', 'backdrop-filter:blur(6px)'
    ].join(';');
    chip.title = 'Condicional — contenidos condicionados · clic: on/off · CLI: /condicional on|off|toggle';
    chip.innerHTML = '<span id="xpl-dot" style="width:8px;height:8px;border-radius:50%;background:#5bd6c0"></span>' +
      '<b>Condicional</b><span id="xpl-chip-ad" style="color:#8a97ab">—</span>' +
      '<a href="xpl/" title="panel de control del Condicional" style="color:#7aa2ff;text-decoration:none;margin-left:2px">✎</a>';
    chip.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') return; // dejar pasar el lápiz
      setOn(!on);
    });
    document.body.appendChild(chip);
  }

  function dragify(node) {
    var sx, sy, ox, oy, drag = false;
    node.addEventListener('mousedown', function (e) {
      drag = true; sx = e.clientX; sy = e.clientY;
      var r = node.getBoundingClientRect(); ox = r.left; oy = r.top;
      node.style.cursor = 'grabbing'; e.preventDefault();
    });
    window.addEventListener('mousemove', function (e) {
      if (!drag) return;
      node.style.left = (ox + e.clientX - sx) + 'px';
      node.style.top = (oy + e.clientY - sy) + 'px';
      node.style.right = 'auto'; node.style.bottom = 'auto';
    });
    window.addEventListener('mouseup', function () { drag = false; node.style.cursor = 'grab'; });
  }

  // Puerta: la señalización SOLO existe cuando estamos dentro del Xtanco con el
  // gemelo desplegado (el splash de bienvenida añade body.splash-visible; al
  // pulsar PLAY/DEMO se quita). En el intro no debe verse nada de XPL.
  function gateInside() {
    return !!document.body && !document.body.classList.contains('splash-visible');
  }

  // Pinta un asset REAL del Stock (img o video) en la capa de media, reutilizando
  // el elemento si no cambió la url (evita recargas y cortes de vídeo).
  function setMedia(asset) {
    var m = document.getElementById('xpl-sg-media'); if (!m) return;
    if (m.__key === asset.url) return;
    m.__key = asset.url; m.innerHTML = '';
    var isVid = asset.type === 'video' || asset.type === 'animation' ||
      /^video\//.test(asset.mime || '') || /\.(mp4|webm|mov)(\?|$)/i.test(asset.url);
    var node = document.createElement(isVid ? 'video' : 'img');
    node.src = asset.url;
    node.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block';
    if (isVid) {
      node.muted = true; node.loop = true; node.autoplay = true;
      node.playsInline = true; node.setAttribute('playsinline', ''); node.setAttribute('muted', '');
      var p = node.play && node.play(); if (p && p.catch) p.catch(function () {});
    }
    m.appendChild(node);
  }
  function clearMedia() {
    var m = document.getElementById('xpl-sg-media'); if (!m) return;
    if (m.__key) { m.__key = ''; m.innerHTML = ''; }
    m.style.display = 'none';
  }

  var __wallImgs = {};
  function wallImg(u){ var im=__wallImgs[u]; if(!im){ im=new Image(); im.crossOrigin='anonymous'; im.src=u; __wallImgs[u]=im; } return im; }
  function renderOverlay() {
    if (!el) return;
    var inside = gateInside();
    // XPL -> pared: publicar el resultado para las DOS pantallas DS gigantes del
    // fondo (window.__dsXplMsg). Independiente del panel flotante (on/off).
    // Vigencia 60s (no 15s): el tick de 1s se retrasa hasta ~40s cuando el juego
    // satura el hilo/el navegador degrada los timers, y con 15s el mensaje pasaba
    // caducado casi todo el tiempo y la pared ca\u00eda a la rotaci\u00f3n (14-jul-2026).
    // Si el motor no produce resultado (o salimos del Xtanco), limpieza expl\u00edcita.
    try {
      var wc = inside ? (screen.content || null) : null;
      var wa = (!wc && inside && screen.ad) ? window.XPL.byId(window.XPL.ADS, screen.ad) : null;
      if (wc) {
        window.__dsXplMsg = { txt: String(wc.title || wc.type || 'CONTENIDO').toUpperCase().slice(0, 26),
          sub: 'XPL \u00b7 se\u00f1alizaci\u00f3n condicional', bg: '#0a1a2a', fg: '#3df08a',
          img: (wc.type === 'image' && wc.url) ? wallImg(wc.url) : null, until: Date.now() + 60000 };
      } else if (wa) {
        window.__dsXplMsg = { txt: String(wa.es || '').toUpperCase().slice(0, 26),
          sub: (wa.icon || '') + ' XPL \u00b7 condicional', bg: wa.bg || '#0a1a2a', fg: '#3df08a',
          img: null, until: Date.now() + 60000 };
      } else {
        window.__dsXplMsg = null;
      }
    } catch (e) {}
    // chip y ventana ocultos por completo mientras estemos en el intro
    if (chip) chip.style.display = inside ? 'flex' : 'none';
    renderExt(inside);   // la pantalla de exterior se pinta aparte (canal propio)
    if (!inside) { el.style.display = 'none'; clearMedia(); return; }
    // contenido REAL gana sobre la creatividad de juguete (mismo canal 'content')
    var content = (on && screen.content) ? screen.content : null;
    var ad = (!content && on && screen.ad) ? window.XPL.byId(window.XPL.ADS, screen.ad) : null;
    var dot = document.getElementById('xpl-dot');
    var chipAd = document.getElementById('xpl-chip-ad');
    var media = document.getElementById('xpl-sg-media');
    var body = document.getElementById('xpl-sg-body');
    if (dot) dot.style.background = on ? '#5bd6c0' : '#5a6678';
    if (!content && !ad) {
      el.style.display = 'none'; clearMedia();
      if (chipAd) chipAd.textContent = on ? '—' : 'off';
      return;
    }
    el.style.display = 'none';   // Condicional solo en pared (las dobles del fondo); el panel flotante no se muestra
    el.style.animation = screen.tone === 'hype' ? 'xplPulse .9s ease-in-out infinite' : 'none';
    if (content) {
      setMedia(content);
      if (media) media.style.display = 'block';
      if (body) body.style.display = 'none';
      el.style.background = '#000';
      var title = String(content.title || content.type || 'contenido').slice(0, 42);
      if (chipAd) chipAd.textContent = '🎬 ' + title;
    } else {
      clearMedia();
      if (body) body.style.display = 'flex';
      el.style.background = ad.bg;
      document.getElementById('xpl-sg-icon').textContent = ad.icon;
      document.getElementById('xpl-sg-label').textContent = ad.es.toUpperCase();
      if (chipAd) chipAd.textContent = ad.icon + ' ' + ad.es;
    }
  }

  // Pantalla de exterior (MUPI): creatividad dirigida al viandante de delante.
  function renderExt(inside) {
    if (!extEl) return;
    // Condicional SOLO en las pantallas dobles del fondo (Carlos, 14-jul-2026):
    // la pantalla de exterior queda para el CanalKiosk (la puerta).
    extEl.style.display = 'none'; return;
    var ad = (inside && on && extScreen.ad) ? window.XPL.byId(window.XPL.ADS, extScreen.ad) : null;
    if (!ad) { extEl.style.display = 'none'; return; }
    extEl.style.display = 'block';
    extEl.style.background = ad.bg;
    var ic = document.getElementById('xpl-ext-icon');
    var lb = document.getElementById('xpl-ext-label');
    var sg = document.getElementById('xpl-ext-seg');
    if (ic) ic.textContent = ad.icon;
    if (lb) lb.textContent = ad.es.toUpperCase();
    if (sg) {
      var GS = { female: '♀ mujer', male: '♂ hombre', mixed: '⚥ mixto' };
      var AS = { nino: 'niño', joven: 'joven', adulto: 'adulto', senior: 'senior' };
      var seg = [GS[extGenderV()] || '', AS[extAgeV()] || ''].filter(Boolean).join(' · ');
      sg.textContent = seg ? ('▸ ' + seg) : '';
    }
  }

  // keyframes
  var st = document.createElement('style');
  st.textContent = '@keyframes xplPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}';
  document.head.appendChild(st);

  function setOn(v) {
    on = v; localStorage.setItem(LS_ON, v ? '1' : '0'); renderOverlay();
  }

  /* ---------------------------------------------------------------------------
   * 4) MOTOR — corre cada segundo leyendo G
   * ------------------------------------------------------------------------- */
  var engine = window.XPL.createEngine(world);

  // ── Store REMOTO de reglas (backoffice XPL) ────────────────────────────────
  // El gemelo baja LO SUYO por screenId (cascada global→circuito→pantalla). Si el
  // store responde, manda; si no, cae a la caché local y al composer/semilla.
  var XPL_STORE = 'https://xpl.admira.store';   // dominio propio CF (esquiva bloqueo workers.dev en ES)
  var REMOTE = null;              // reglas remotas en memoria (null = aún no/offline)
  function screenId() {
    try { return localStorage.getItem('pixer-xtore-screen-id') || 'xtore-inicial'; } catch (e) { return 'xtore-inicial'; }
  }
  function circuitId() { try { return localStorage.getItem('xpl_circuit') || ''; } catch (e) { return ''; } }

  function loadRules() {
    if (REMOTE && REMOTE.length) return REMOTE;                       // 1) remoto en vivo
    try { var rc = JSON.parse(localStorage.getItem('xpl_remote_cache') || 'null'); if (Array.isArray(rc) && rc.length) return rc; } catch (e) {} // 2) caché remota
    var raw = localStorage.getItem(LS_RULES);                          // 3) composer local
    if (raw) { try { var a = JSON.parse(raw); if (Array.isArray(a) && a.length) return a; } catch (e) {} }
    return [                                                           // 4) semilla
      // — contenido REAL del Stock de Pixeria (el puente) —
      // Audiencia joven mirando → contenido de marca real (gana a todo).
      { id: 'seed-content-young', name: 'Público joven → contenido de marca real', priority: 5, enabled: true,
        when: { join: 'and', conds: [{ fact: 'audAge', value: 'joven' }] }, who: { group: 'all', filter: {} }, do: [{ id: 'showContent', value: 'marca' }] },
      // Por defecto, sin nada especial → contenido real auto (lo que pida el público que mira).
      { id: 'seed-content-base', name: 'Por defecto → contenido real (auto)', priority: 1, enabled: true,
        when: { join: 'and', conds: [] }, who: { group: 'all', filter: {} }, do: [{ id: 'showContent', value: 'auto' }] },
      // — eventos de clima: la creatividad de juguete del juego pop por encima del baseline —
      { id: 'seed-rain', name: 'Llueve → botas de agua', priority: 3, enabled: true,
        when: { join: 'and', conds: [{ fact: 'rain', value: true }] }, who: { group: 'all', filter: {} }, do: [{ id: 'showAd', value: 'rainboots' }] },
      { id: 'seed-hot', name: 'Calor → helado', priority: 3, enabled: true,
        when: { join: 'and', conds: [{ fact: 'temperature', op: '>=', value: 28 }] }, who: { group: 'all', filter: {} }, do: [{ id: 'showAd', value: 'icecream' }] },
      { id: 'seed-night', name: 'Noche → happy hour', priority: 3, enabled: true,
        when: { join: 'and', conds: [{ fact: 'night', value: true }] }, who: { group: 'all', filter: {} }, do: [{ id: 'showAd', value: 'happyhour' }] }
    ];
  }
  function syncRules() { engine.setRules(loadRules()); }

  // Trae las reglas remotas resueltas para ESTA pantalla y las aplica.
  function fetchRemoteRules() {
    var url = XPL_STORE + '/xpl/resolve?screen=' + encodeURIComponent(screenId()) + (circuitId() ? '&circuit=' + encodeURIComponent(circuitId()) : '') + '&ts=' + Date.now();
    fetch(url, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !Array.isArray(d.rules)) return;
      REMOTE = d.rules;
      try { localStorage.setItem('xpl_remote_cache', JSON.stringify(d.rules)); } catch (e) {}
      syncRules();
    }).catch(function () { /* offline → seguimos con la caché */ });
  }
  // Presencia: el gemelo se anuncia al store (para que el backoffice liste pantallas).
  // Instancia única de este gemelo abierto (por pestaña/carga) → el backoffice
  // cuenta gemelos distintos. Equipo: etiqueta manual (?device= / localStorage) o
  // deducida del navegador.
  var INSTANCE = 'xpl-' + Math.random().toString(36).slice(2, 10) + '-' + (Date.now() % 100000);
  function deviceName() {
    try {
      var q = new URLSearchParams(location.search).get('device');
      if (q) { try { localStorage.setItem('xpl_device', q); } catch (e) {} return q; }
      var saved = localStorage.getItem('xpl_device'); if (saved) return saved;
    } catch (e) {}
    var ua = navigator.userAgent || '';
    var os = /Macintosh|Mac OS/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : 'PC';
    var br = /Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : /Firefox/.test(ua) ? 'Firefox' : 'navegador';
    return os + ' · ' + br;
  }
  function pingStore() {
    try {
      fetch(XPL_STORE + '/xpl/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screen: screenId(), circuit: circuitId(), instance: INSTANCE,
          device: deviceName(), ua: (navigator.userAgent || '').slice(0, 180), url: location.href.slice(0, 180) }) }).catch(function () {});
    } catch (e) {}
  }

  // Canal de comandos remotos: el backoffice encola para mi screenId; los ejecuto
  // con el mismo dispatcher (__xtExec) que el chat del gemelo.
  var __cmdSeen = Date.now();
  function pollRemoteCmd() {
    try {
      fetch(XPL_STORE + '/xpl/cmd?screen=' + encodeURIComponent(screenId()) + '&since=' + __cmdSeen + '&ts=' + Date.now(), { cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
          if (!d || !Array.isArray(d.commands)) return;
          for (var i = 0; i < d.commands.length; i++) {
            var c = d.commands[i]; if (!c || c.id <= __cmdSeen) continue;
            __cmdSeen = Math.max(__cmdSeen, c.id);
            try { if (typeof window.__xtExec === 'function') window.__xtExec(String(c.text)); } catch (e) {}
          }
        }).catch(function () {});
    } catch (e) {}
  }

  // ── Ganchos sobre el JUEGO (window.G), sin tocar el index.html ──────────────
  // (1) los NPCs de pixeria (sprite custom) se quedan MÁS tiempo en el Xpacio.
  // (2) cuando falta poco para cerrar (~30 min), echa a TODOS (salen paseando).
  function gemeloDayHooks() {
    var g = window.G; if (!g || !Array.isArray(g.custs)) return;
    var closeH = (window.shopTimeSettings && window.shopTimeSettings.closeHour) || 22;
    var t = typeof g.gameTime === 'number' ? g.gameTime : 12;
    var closingSoon = t >= (closeH - 0.5) && t < closeH && !g.dayEnded;
    for (var i = 0; i < g.custs.length; i++) {
      var c = g.custs[i]; if (!c) continue;
      if (c.customSpriteUrl && !c.__xplStay) { c.__xplStay = true; c.stayTargetTicks = Math.max(c.stayTargetTicks || 0, 16000); }
      if (closingSoon && c.st !== 'leave') { c.st = 'leave'; c.timer = 0; }
    }
  }

  // ── Pantalla condicional EN LA PARED, sobre el gestor de colas ───────────────
  // Ancla el overlay de señalización a BTNS.turnKioskCall (hitbox del gestor de
  // colas, en coords de canvas → pantalla). /pantallacondicional la conmuta.
  var pantallaWall = (function () { try { return localStorage.getItem('xpl_pantalla_wall') === '1'; } catch (e) { return false; } })();
  function setPantallaWall(v) {
    pantallaWall = !!v; try { localStorage.setItem('xpl_pantalla_wall', v ? '1' : '0'); } catch (e) {}
    if (v) setOn(true);
    positionSignage();
  }
  function positionSignage() {
    if (!el) return;
    if (!pantallaWall) { // modo flotante (esquina), por defecto
      el.style.left = 'auto'; el.style.top = 'auto'; el.style.right = '18px'; el.style.bottom = '64px';
      el.style.width = '200px'; el.style.height = '118px'; el.style.borderRadius = '14px';
      return;
    }
    var cv = document.getElementById('c'); var btn = window.BTNS && window.BTNS.turnKioskCall;
    if (!cv || !btn) return;
    var r = cv.getBoundingClientRect(); var sx = r.width / cv.width, sy = r.height / cv.height;
    var w = Math.max(150, btn.w * sx * 3.6), h = Math.round(w * 0.62);
    var cx = r.left + (btn.x + btn.w / 2) * sx;           // centrado sobre el gestor de colas
    var topY = r.top + btn.y * sy - h - 14 * sy;          // ENCIMA, en la pared larga
    el.style.left = Math.round(cx - w / 2) + 'px'; el.style.top = Math.round(topY) + 'px';
    el.style.right = 'auto'; el.style.bottom = 'auto';
    el.style.width = Math.round(w) + 'px'; el.style.height = h + 'px'; el.style.borderRadius = '8px';
  }
  function handlePantalla(t) {
    var arg = (t.split(/\s+/)[1] || 'toggle').toLowerCase();
    if (arg === 'on' || arg === 'pared') setPantallaWall(true);
    else if (arg === 'off' || arg === 'flotante') setPantallaWall(false);
    else setPantallaWall(!pantallaWall);
  }

  // ── PUENTE A CONTENIDO REAL ─────────────────────────────────────────────────
  // showContent fija screen.contentReq (la intención). Aquí lo convertimos en un
  // asset real del Stock vía XPLStock, segmentando con los HECHOS vivos (la cámara
  // decide el público). El pick es async; mientras resuelve, mantenemos el asset
  // anterior (cero parpadeo) y rotamos cada ROTATE_MS para que la pantalla respire.
  var contentState = { sig: '', asset: null, picking: false, ts: 0 };
  var ROTATE_MS = 15000;
  var DAYPART_TS = { morning: 'manana', noon: 'mediodia', afternoon: 'tarde', night: 'noche' };
  function resolveContent() {
    var req = screen.contentReq;
    if (!req) { screen.content = null; contentState.sig = ''; contentState.asset = null; return; }
    if (!window.XPLStock) { return; }
    var gv = world.fact('audGender');
    var aud = gv === 'female' ? 'f' : gv === 'male' ? 'm' : '';
    var av = world.fact('audAge');
    var age = (av && av !== 'none') ? av : '';
    var ts  = DAYPART_TS[world.fact('dayPart')] || '';
    var cat = req === 'auto' ? '' : req;
    var sig = [cat, aud, age, ts].join('|');
    var now = Date.now();
    var stale = sig !== contentState.sig || !contentState.asset || (now - contentState.ts) > ROTATE_MS;
    if (stale && !contentState.picking) {
      contentState.picking = true; contentState.sig = sig;
      window.XPLStock.pickAsync({ category: cat, audience: aud, age: age, timeSlot: ts })
        .then(function (a) { if (a) contentState.asset = a; contentState.ts = Date.now(); contentState.picking = false; })
        .catch(function () { contentState.picking = false; });
    }
    screen.content = contentState.asset;
  }

  function tick() {
    if (!window.G) return;
    gemeloDayHooks();
    screen.ad = null;          // se "apaga" si ninguna regla 'while' lo pone
    screen.contentReq = null;  // idem para el canal de contenido real
    engine.tick();
    resolveContent();  // intención → asset real del Stock (async, sin parpadeo)
    applyOverride();   // el control remoto (CLI) manda por encima de las reglas
    renderOverlay();
    positionSignage();
    publishState();
  }

  // Publica el estado en vivo para el Panel de Control (otra pestaña lo lee).
  var _lastPub = '';
  function publishState() {
    // lee la fuente de verdad de on/off (lo que persiste setOn), no la closure
    var onNow = localStorage.getItem(LS_ON) === '1';
    var s = JSON.stringify({ on: onNow, ad: screen.ad, tone: screen.tone, inside: gateInside(),
      rules: engine.rules.length, ts: Date.now() });
    if (s !== _lastPub) { _lastPub = s; try { localStorage.setItem('xpl_state', s); } catch (e) {} }
  }

  // Eventos entre pestañas: reglas guardadas (editor) y comandos (panel de control).
  window.addEventListener('storage', function (e) {
    if (e.key === LS_RULES) syncRules();
    else if (e.key === 'xpl_cmd' && e.newValue) {
      try { var c = JSON.parse(e.newValue); if (c && c.cmd && typeof window.__xtExec === 'function') window.__xtExec(c.cmd); } catch (_) {}
    }
  });

  /* ---------------------------------------------------------------------------
   * 5) COMANDOS CLI:  /xpl on|off|toggle|reload|status   (vía el dispatcher)
   * ------------------------------------------------------------------------- */
  function patchDispatcher() {
    var prev = window.__xtExec;
    if (typeof prev !== 'function') return;
    window.__xtExec = function (text) {
      var t = String(text || '').trim();
      if (/^\/pantallacondicional\b/i.test(t)) { handlePantalla(t); return Promise.resolve('xpl'); }
      if (/^\/(condicional|condicionados|xpl)\b/i.test(t)) { handleCmd(t); return Promise.resolve('xpl'); }
      if (/^\/(show|ad|anuncia|tone|tono|clear|apaga|auto|release|libre|weather|clima)\b/i.test(t)) {
        if (handleEmit(t)) return Promise.resolve('xpl-emit');
      }
      return prev.apply(this, arguments);
    };
  }
  // Control remoto de EMISIÓN (override sobre las reglas). Devuelve true si lo reconoció.
  function handleEmit(t) {
    var p = t.trim().replace(/^\//, '').split(/\s+/);
    var cmd = (p[0] || '').toLowerCase(), arg = (p[1] || '').toLowerCase();
    var SEC = 120;  // el override dura 2 min y luego vuelve a las reglas
    if (cmd === 'show' || cmd === 'ad' || cmd === 'anuncia') {
      if (!window.XPL.byId(window.XPL.ADS, arg)) return false;   // creatividad válida
      override.ad = arg; override.until = Date.now() + SEC * 1000; screen.ad = arg; return true;
    }
    if (cmd === 'tone' || cmd === 'tono') {
      if (['calm', 'hype', 'lux'].indexOf(arg) < 0) return false;
      override.tone = arg; override.until = Date.now() + SEC * 1000; screen.tone = arg; return true;
    }
    if (cmd === 'clear' || cmd === 'apaga') {
      override.ad = ''; override.tone = null; override.until = Date.now() + SEC * 1000; screen.ad = null; return true;
    }
    if (cmd === 'auto' || cmd === 'release' || cmd === 'libre') {
      override.until = 0; override.ad = null; override.tone = null; return true;
    }
    if (cmd === 'weather' || cmd === 'clima') {
      if (window.G) window.G.weather = { type: arg === 'sun' ? 'sun' : arg, timer: 600 };
      return true;
    }
    return false;
  }
  function handleCmd(t) {
    var arg = (t.split(/\s+/)[1] || 'toggle').toLowerCase();
    if (arg === 'on') setOn(true);
    else if (arg === 'off') setOn(false);
    else if (arg === 'toggle') setOn(!on);
    else if (arg === 'reload') { fetchRemoteRules(); syncRules(); }
    else if (arg === 'status') {
      console.log('[XPL]', { on: on, ad: screen.ad, rules: engine.rules.length });
    }
  }

  /* ---------------------------------------------------------------------------
   * 6) ARRANQUE — espera a que exista window.G
   * ------------------------------------------------------------------------- */
  function boot() {
    if (!window.G) { return setTimeout(boot, 400); }
    buildUI();
    syncRules();                 // arranca con caché/semilla al instante
    patchDispatcher();
    setInterval(tick, 1000);
    tick();
    // store remoto: baja reglas + se anuncia (presencia) + polea comandos remotos
    fetchRemoteRules(); pingStore(); pollRemoteCmd();
    setInterval(fetchRemoteRules, 20000);   // cambios del backoffice cada 20s
    setInterval(pingStore, 40000);          // presencia cada 40s (TTL 120s en el worker)
    setInterval(pollRemoteCmd, 3000);       // control remoto cada 3s
    console.log('[XPL] adapter del gemelo activo · screen=' + screenId() + ' · instance=' + INSTANCE);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.XPLGemelo = { world: world, get screen() { return screen; }, setOn: setOn, reload: syncRules };
})();
