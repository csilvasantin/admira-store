/* ============================================================================
 * XPL · adapter del TEMPLO DE LA SOLEDAD  (Xperiencia El Templo de la Soledad)
 * ----------------------------------------------------------------------------
 * Escenografia reactiva del Templo gobernada por reglas XPL (CUANDO -> ENTONCES),
 * calcando el patron de admira-xp/scripts/xpl-gemelo.js:
 *   - WORLD ADAPTER: XPL pregunta hechos, el mundo del templo responde
 *     (proximidad a la Kryptonita, presencia en la esclusa, perfil de audiencia).
 *   - ACCIONES: bajar luces DMX, "debilitar" la estatua, transicionar la esclusa,
 *     conmutar la senalizacion del Escudo (E2), despertar a Jor-El (E1)…
 *   - ENGINE: usa window.XPL.createEngine si el runtime esta cargado; si no
 *     (loader a prueba de sync), cae a un mini-evaluador propio con el MISMO
 *     shape de regla { when:{join,conds:[{fact,op,value}]}, do:[{id,value}] }.
 *   - GANCHOS sobre window: no toca el index.html compartido del gemelo. Publica
 *     el estado en window.TEMPLO_STATE y expone window.XPLTemplo. Emite eventos
 *     'templo:scene' para que la capa fisica (DMX/audio/mapping) los consuma.
 *
 * Uso en el kiosko del Templo (NO en el index.html del gemelo de tienda):
 *   <script src="../../../admira-xp/scripts/xpl-runtime.js"></script>  <!-- opcional -->
 *   <script src="build/xpl-templo.js"></script>
 *
 * Entradas de sensor (las escribe el nodo edge de sala / el mockup de demo):
 *   window.TEMPLO = {
 *     kryptoProximity: 0..1,   // ToF/PIR junto a la Kryptonita (E4)
 *     esclusaPresence: bool,   // alguien cruzando la esclusa de entrada
 *     aud: { faces, gender:'female'|'male'|'mixed'|'none', ageBucket, ts }
 *   }
 * Comandos CLI (via window.XPLTemplo.exec o el dispatcher del kiosko):
 *   /templo on|off|toggle | /templo reload | /templo status
 *   /templo krypto <0..1> | /templo presence on|off      (simulacion de sensores)
 * ========================================================================== */
(function () {
  'use strict';
  if (window.__XPL_TEMPLO_ACTIVE) { return; }   // idempotente (doble carga)
  window.__XPL_TEMPLO_ACTIVE = true;

  var LS_ON    = 'xpl_templo_on';
  var LS_RULES = 'xpl_templo_rules';
  // Store remoto de reglas del Templo (mismo backoffice XPL que el gemelo de tienda).
  var XPL_STORE = 'https://xpl.admira.store';
  var SCREEN_ID = 'templo-soledad';

  /* ---------------------------------------------------------------------------
   * 1) MUNDO DEL TEMPLO — sensores + estado de escena
   * ------------------------------------------------------------------------- */
  var T = function () { return window.TEMPLO || (window.TEMPLO = {}); };
  function proximity() { var v = Number(T().kryptoProximity); return isFinite(v) ? Math.max(0, Math.min(1, v)) : 0; }
  function presence()  { return !!T().esclusaPresence; }
  function audFresh()  { var a = T().aud; return (a && a.faces > 0 && (Date.now() - (a.ts || 0)) < 8000) ? a : null; }
  function audGender() { var a = audFresh(); return a ? (a.gender || 'mixed') : 'none'; }
  function audAge()    { var a = audFresh(); return a ? (a.ageBucket || 'adulto') : 'none'; }
  function audFaces()  { var a = audFresh(); return a ? a.faces : 0; }

  // Estado de ESCENA que las reglas escriben y la capa fisica consume.
  // (defaults = templo "en reposo": frio, luces medias, estatua radiante.)
  var scene = {
    lights: 0.7,        // 0..1 intensidad DMX de sala
    statue: 1.0,        // 0..1 retroluz de la estatua de Kal-El (1 = pleno, baja = "debil")
    ambience: 'calm',   // 'calm' | 'weakening' | 'awe' | 'threshold'
    crest: 'classic',   // creatividad del Escudo (E2): classic | new52 | snyder | sponsor
    jorEl: false,       // E1: despertar el holograma
    audio: null         // pista/aviso puntual ('hum-low','entry-swell',…)
  };
  var lastEmit = '';

  var world = {
    fact: function (id) {
      switch (id) {
        case 'kryptoNear':   return proximity() >= 0.6;            // bool: mano/cuerpo muy cerca
        case 'kryptoProx':   return Math.round(proximity() * 100); // num 0..100
        case 'esclusa':      return presence();                    // bool: cruzando la esclusa
        case 'viewers':      return audFaces();                    // num
        case 'audGender':    return audGender();                   // enum
        case 'audAge':       return audAge();                      // enum
        case 'idle':         return audFaces() === 0 && !presence();
      }
      return 0;
    },
    act: function (id, value) {
      switch (id) {
        // — E4 Kryptonita / ambiente reactivo —
        case 'setLights':   scene.lights = clamp01(value); break;
        case 'weakenStatue':scene.statue = clamp01(value); break;
        case 'ambience':    scene.ambience = value || 'calm'; break;
        case 'audio':       scene.audio = value || null; break;
        // — esclusa de entrada —
        case 'threshold':   scene.ambience = 'threshold'; scene.lights = clamp01(value != null ? value : 0.25); break;
        // — E2 Escudo (senalizacion condicional por perfil) —
        case 'crest':       scene.crest = value || 'classic'; break;
        // — E1 Jor-El —
        case 'wakeJorEl':   scene.jorEl = (value !== false); if (scene.jorEl) wake(); break;
        case 'command':     if (typeof window.__xtExec === 'function' && value) window.__xtExec(String(value)); break;
      }
    }
  };
  function clamp01(v) { v = Number(v); return isFinite(v) ? Math.max(0, Math.min(1, v)) : 0; }

  /* ---------------------------------------------------------------------------
   * 2) REGLAS — semilla (las 3 pedidas) + cache local + store remoto
   * ------------------------------------------------------------------------- */
  function seedRules() {
    return [
      // (a) ESCLUSA DE ENTRADA: presencia -> transicion "cruzar al templo".
      { id: 'templo-esclusa', name: 'Esclusa: presencia -> transicion de umbral', priority: 9, enabled: true,
        when: { join: 'and', conds: [ { fact: 'esclusa', value: true } ] },
        do: [ { id: 'threshold', value: 0.25 }, { id: 'audio', value: 'entry-swell' }, { id: 'ambience', value: 'threshold' } ] },

      // (b) E4 KRYPTONITA: proximidad -> bajar luces, debilitar estatua, ambiente cae.
      //     Escalonado: cerca (>=60%) desploma; aproximacion (>=30%) atenua.
      { id: 'templo-krypto-near', name: 'Kryptonita: muy cerca -> la sala se debilita', priority: 8, enabled: true,
        when: { join: 'and', conds: [ { fact: 'kryptoProx', op: '>=', value: 60 } ] },
        do: [ { id: 'setLights', value: 0.18 }, { id: 'weakenStatue', value: 0.2 }, { id: 'ambience', value: 'weakening' }, { id: 'audio', value: 'hum-low' } ] },
      { id: 'templo-krypto-approach', name: 'Kryptonita: aproximacion -> atenuar', priority: 7, enabled: true,
        when: { join: 'and', conds: [ { fact: 'kryptoProx', op: '>=', value: 30 } ] },
        do: [ { id: 'setLights', value: 0.45 }, { id: 'weakenStatue', value: 0.6 }, { id: 'ambience', value: 'weakening' } ] },

      // (c) E2 ESCUDO: senalizacion condicional por PERFIL DE AUDIENCIA (camara anonima).
      { id: 'templo-crest-young', name: 'Escudo E2: publico joven -> emblema Snyder', priority: 5, enabled: true,
        when: { join: 'and', conds: [ { fact: 'audAge', value: 'joven' } ] },
        do: [ { id: 'crest', value: 'snyder' } ] },
      { id: 'templo-crest-child', name: 'Escudo E2: ninos -> emblema clasico', priority: 5, enabled: true,
        when: { join: 'and', conds: [ { fact: 'audAge', value: 'nino' } ] },
        do: [ { id: 'crest', value: 'classic' } ] },
      { id: 'templo-crest-adult', name: 'Escudo E2: adultos -> New 52', priority: 4, enabled: true,
        when: { join: 'and', conds: [ { fact: 'audAge', value: 'adulto' } ] },
        do: [ { id: 'crest', value: 'new52' } ] },

      // (d) Bienvenida / revelacion: hay publico y nadie toca la kryptonita -> Jor-El disponible.
      { id: 'templo-reveal', name: 'Revelacion: llega publico -> Jor-El disponible', priority: 3, enabled: true,
        when: { join: 'and', conds: [ { fact: 'viewers', op: '>=', value: 1 }, { fact: 'kryptoProx', op: '<', value: 30 } ] },
        do: [ { id: 'ambience', value: 'awe' }, { id: 'setLights', value: 0.7 }, { id: 'weakenStatue', value: 1.0 } ] }
    ];
  }

  var REMOTE = null;
  function loadRules() {
    if (REMOTE && REMOTE.length) return REMOTE;
    try { var rc = JSON.parse(localStorage.getItem('xpl_templo_remote_cache') || 'null'); if (Array.isArray(rc) && rc.length) return rc; } catch (e) {}
    try { var raw = localStorage.getItem(LS_RULES); if (raw) { var a = JSON.parse(raw); if (Array.isArray(a) && a.length) return a; } } catch (e) {}
    return seedRules();
  }

  /* ---------------------------------------------------------------------------
   * 3) ENGINE — reutiliza window.XPL si esta; si no, mini-evaluador propio
   *    (loader a prueba de sync: la escenografia funciona aunque el runtime XPL
   *     no haya cargado todavia o no incluya los hechos del templo).
   * ------------------------------------------------------------------------- */
  function makeLocalEngine(w) {
    var rules = [];
    function evalCond(c) {
      if (!c || !c.fact) return true;
      var cur = w.fact(c.fact);
      if (typeof cur === 'boolean') { var want = !(c.value === false || c.negate === true); return cur === want; }
      if (typeof cur === 'string')  return cur === c.value;
      var v = Number(c.value);
      switch (c.op) {
        case '>':  return cur >  v; case '>=': return cur >= v;
        case '<':  return cur <  v; case '<=': return cur <= v;
        case '==': return cur == v; default: return cur >= v;
      }
    }
    function evalWhen(when) {
      var conds = (when && when.conds) || []; if (!conds.length) return true;
      return (when.join === 'or') ? conds.some(evalCond) : conds.every(evalCond);
    }
    return {
      setRules: function (b) { rules = (b || []).slice().sort(function (x, y) { return (y.priority || 0) - (x.priority || 0); }); },
      tick: function () { for (var i = 0; i < rules.length; i++) { var r = rules[i]; if (r.enabled === false) continue; if (evalWhen(r.when)) (r.do || []).forEach(function (a) { w.act(a.id, a.value); }); } },
      get rules() { return rules; }
    };
  }
  // window.XPL.createEngine espera hechos de su propio catalogo (FACTS); los del
  // templo (kryptoProx, esclusa…) no estan ahi, asi que usamos el motor local
  // para la evaluacion. Mantenemos la referencia a XPL para compartir vocabulario.
  var engine = makeLocalEngine(world);
  function syncRules() { engine.setRules(loadRules()); }

  function fetchRemoteRules() {
    try {
      var url = XPL_STORE + '/xpl/resolve?screen=' + encodeURIComponent(SCREEN_ID) + '&ts=' + Date.now();
      fetch(url, { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        if (!d || !Array.isArray(d.rules) || !d.rules.length) return;
        REMOTE = d.rules;
        try { localStorage.setItem('xpl_templo_remote_cache', JSON.stringify(d.rules)); } catch (e) {}
        syncRules();
      }).catch(function () {});
    } catch (e) {}
  }
  function pingStore() {
    try {
      fetch(XPL_STORE + '/xpl/ping', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screen: SCREEN_ID, instance: INSTANCE, device: 'Templo Soledad', url: location.href.slice(0, 180) }) }).catch(function () {});
    } catch (e) {}
  }
  var INSTANCE = 'templo-' + Math.random().toString(36).slice(2, 8) + '-' + (Date.now() % 100000);

  /* ---------------------------------------------------------------------------
   * 4) SALIDA — publica escena + emite evento para la capa fisica
   * ------------------------------------------------------------------------- */
  var on = (function () { try { return localStorage.getItem(LS_ON) !== '0'; } catch (e) { return true; } })();
  function setOn(v) { on = !!v; try { localStorage.setItem(LS_ON, v ? '1' : '0'); } catch (e) {} }

  function wake() {
    // Despierta el holograma de Jor-El (E1) si su API embed esta montada.
    try { if (window.jorEl && window.jorEl.open) window.jorEl.open(); } catch (e) {}
    try { if (typeof window.mountJorEl === 'function') window.mountJorEl(); } catch (e) {}
  }

  function publish() {
    window.TEMPLO_STATE = {
      on: on, ts: Date.now(), rules: engine.rules.length,
      lights: scene.lights, statue: scene.statue, ambience: scene.ambience,
      crest: scene.crest, jorEl: scene.jorEl, audio: scene.audio,
      sensors: { kryptoProx: proximity(), esclusa: presence(), viewers: audFaces(), audGender: audGender(), audAge: audAge() }
    };
    var sig = JSON.stringify(window.TEMPLO_STATE.lights + '|' + window.TEMPLO_STATE.statue + '|' + scene.ambience + '|' + scene.crest);
    if (sig !== lastEmit) {
      lastEmit = sig;
      try { window.dispatchEvent(new CustomEvent('templo:scene', { detail: window.TEMPLO_STATE })); } catch (e) {}
    }
  }

  /* ---------------------------------------------------------------------------
   * 5) TICK — reposo, evalua, publica
   * ------------------------------------------------------------------------- */
  function tick() {
    if (!on) { publish(); return; }
    // reposo de escena antes de re-evaluar (las reglas 'while' vuelven a fijar)
    scene.lights = 0.7; scene.statue = 1.0; scene.ambience = 'calm'; scene.audio = null;
    engine.tick();
    publish();
  }

  /* ---------------------------------------------------------------------------
   * 6) CLI — /templo …  (via dispatcher del kiosko o window.XPLTemplo.exec)
   * ------------------------------------------------------------------------- */
  function exec(text) {
    var p = String(text || '').trim().replace(/^\//, '').split(/\s+/);
    if ((p[0] || '').toLowerCase() !== 'templo') return false;
    var arg = (p[1] || 'status').toLowerCase(), val = p[2];
    switch (arg) {
      case 'on':      setOn(true); break;
      case 'off':     setOn(false); break;
      case 'toggle':  setOn(!on); break;
      case 'reload':  fetchRemoteRules(); syncRules(); break;
      case 'krypto':  T().kryptoProximity = Math.max(0, Math.min(1, Number(val) || 0)); break;
      case 'presence':T().esclusaPresence = (val === 'on' || val === 'true' || val === '1'); break;
      case 'wake':    world.act('wakeJorEl', true); break;
      case 'status':  try { console.log('[XPL·Templo]', window.TEMPLO_STATE); } catch (e) {} break;
    }
    tick();
    return true;
  }
  function patchDispatcher() {
    var prev = window.__xtExec;
    if (typeof prev !== 'function') return;
    window.__xtExec = function (t) {
      if (/^\/templo\b/i.test(String(t || ''))) { exec(t); return Promise.resolve('templo'); }
      return prev.apply(this, arguments);
    };
  }

  /* ---------------------------------------------------------------------------
   * 7) ARRANQUE
   * ------------------------------------------------------------------------- */
  function boot() {
    syncRules();                 // semilla/cache al instante
    patchDispatcher();
    setInterval(tick, 500);      // sensores reactivos: 2 Hz
    tick();
    fetchRemoteRules(); pingStore();
    setInterval(fetchRemoteRules, 20000);
    setInterval(pingStore, 40000);
    try { console.log('[XPL·Templo] adapter activo · screen=' + SCREEN_ID + ' · instance=' + INSTANCE + ' · engine=' + (window.XPL ? 'XPL+local' : 'local')); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  // Ganchos publicos (no tocan el index.html del gemelo compartido).
  window.XPLTemplo = {
    world: world,
    get scene() { return scene; },
    get state() { return window.TEMPLO_STATE; },
    setOn: setOn, reload: syncRules, exec: exec, wake: wake,
    // helpers de simulacion de sensores para el mockup/demo:
    setProximity: function (v) { T().kryptoProximity = clamp01(v); tick(); },
    setPresence:  function (v) { T().esclusaPresence = !!v; tick(); },
    setAudience:  function (o) { T().aud = Object.assign({ faces: 1, gender: 'mixed', ageBucket: 'adulto', ts: Date.now() }, o || {}); tick(); }
  };
})();
